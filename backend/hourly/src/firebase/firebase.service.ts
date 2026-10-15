import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;
  private isConnectedToLive = false;

  // Resilient in-memory store if credentials are not yet configured
  private localStore: Map<string, Map<string, any>> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initFirebase();
    this.loadLocalBackup();
    this.seedInitialData();
  }

  private get dbFilePath(): string {
    const candidatePaths = [
      path.resolve(process.cwd(), 'data', 'firestore-local-db.json'),
      path.resolve(process.cwd(), 'backend', 'hourly', 'data', 'firestore-local-db.json'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) return p;
    }
    const fallbackDir = fs.existsSync(path.resolve(process.cwd(), 'backend', 'hourly'))
      ? path.resolve(process.cwd(), 'backend', 'hourly', 'data')
      : path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(fallbackDir)) {
      try {
        fs.mkdirSync(fallbackDir, { recursive: true });
      } catch {}
    }
    return path.join(fallbackDir, 'firestore-local-db.json');
  }

  private saveLocalBackup() {
    try {
      const obj: Record<string, Record<string, any>> = {};
      for (const [colName, colMap] of this.localStore.entries()) {
        obj[colName] = {};
        for (const [id, val] of colMap.entries()) {
          obj[colName][id] = val;
        }
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e: any) {
      this.logger.warn(`Could not write local DB backup: ${e.message}`);
    }
  }

  private loadLocalBackup() {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const obj = JSON.parse(raw);
        for (const [colName, docs] of Object.entries(obj)) {
          const colMap = this.getCollectionStore(colName);
          for (const [id, val] of Object.entries(docs as any)) {
            colMap.set(id, val);
          }
        }
        this.logger.log(`💾 Loaded persistent database from ${this.dbFilePath}`);
      }
    } catch (e: any) {
      this.logger.warn(`Could not load local DB backup: ${e.message}`);
    }
  }

  private initFirebase() {
    const rawPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH') || 'firebase-service-account.json';
    const candidatePaths = [
      path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath),
      path.resolve(process.cwd(), 'firebase-service-account.json'),
      path.resolve(process.cwd(), 'firebase-service-account.json.example'),
    ];

    let serviceAccountPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (content.project_id && content.private_key && !content.project_id.includes('sample')) {
            serviceAccountPath = p;
            break;
          }
        } catch {
          // continue
        }
      }
    }

    const projectId =
      this.configService.get<string>('FIREBASE_PROJECT_ID') ||
      this.configService.get<string>('GCLOUD_PROJECT');

    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    try {
      if (serviceAccountPath) {
        const fileContent = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        this.app = admin.initializeApp({
          credential: admin.credential.cert(fileContent),
          projectId: fileContent.project_id || projectId,
        });
        this.isConnectedToLive = true;
        this.logger.log(`🔥 Initialized Live Firebase Admin from credentials: ${serviceAccountPath} (Project: ${fileContent.project_id})`);
      } else if (projectId && clientEmail && privateKey) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
        });
        this.isConnectedToLive = true;
        this.logger.log(`🔥 Initialized Firebase Admin with env credentials for project: ${projectId}`);
      } else if (projectId) {
        this.app = admin.initializeApp({
          projectId,
        });
        this.isConnectedToLive = true;
        this.logger.log(`🔥 Initialized Firebase Admin for project: ${projectId}`);
      } else {
        this.logger.warn(
          `⚠️ No Firebase Service Account credentials found. Running in resilient local Firestore mode so the server never crashes. Add firebase-service-account.json to connect to Cloud Firebase.`,
        );
      }
    } catch (err: any) {
      this.logger.warn(`Firebase initialization notice: ${err.message}. Operating in resilient local Firestore mode.`);
      this.isConnectedToLive = false;
    }
  }

  get isLive(): boolean {
    return this.isConnectedToLive;
  }

  getAuth(): admin.auth.Auth | null {
    if (this.app && this.isConnectedToLive) {
      return this.app.auth();
    }
    return null;
  }

  getFirestore(): admin.firestore.Firestore | null {
    if (this.app && this.isConnectedToLive) {
      return this.app.firestore();
    }
    return null;
  }

  // ── Unified Document Methods ──────────────────────────────────────────

  private getCollectionStore(collectionName: string): Map<string, any> {
    if (!this.localStore.has(collectionName)) {
      this.localStore.set(collectionName, new Map());
    }
    return this.localStore.get(collectionName)!;
  }

  async setDoc(collectionName: string, docId: string, data: any): Promise<any> {
    const firestore = this.getFirestore();
    const payload = {
      ...data,
      id: docId,
      updatedAt: new Date().toISOString(),
      createdAt: data.createdAt || new Date().toISOString(),
    };

    if (firestore) {
      try {
        await firestore.collection(collectionName).doc(docId).set(payload, { merge: true });
      } catch (e: any) {
        this.logger.warn(`Firestore write error, saving locally: ${e.message}`);
      }
    }

    this.getCollectionStore(collectionName).set(docId, payload);
    this.saveLocalBackup();
    return payload;
  }

  async addDoc(collectionName: string, data: any): Promise<any> {
    const docId = data.id || `${collectionName.slice(0, 3).toUpperCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return this.setDoc(collectionName, docId, data);
  }

  async getDoc(collectionName: string, docId: string): Promise<any | null> {
    const firestore = this.getFirestore();
    if (firestore) {
      try {
        const snap = await firestore.collection(collectionName).doc(docId).get();
        if (snap.exists) {
          return { id: snap.id, ...snap.data() };
        }
      } catch {
        // Fallback to local
      }
    }
    return this.getCollectionStore(collectionName).get(docId) || null;
  }

  async updateDoc(collectionName: string, docId: string, updates: any): Promise<any | null> {
    const existing = await this.getDoc(collectionName, docId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const firestore = this.getFirestore();
    if (firestore) {
      try {
        await firestore.collection(collectionName).doc(docId).update(updates);
      } catch {
        // Fallback to local
      }
    }

    this.getCollectionStore(collectionName).set(docId, updated);
    this.saveLocalBackup();
    return updated;
  }

  async deleteDoc(collectionName: string, docId: string): Promise<boolean> {
    const firestore = this.getFirestore();
    if (firestore) {
      try {
        await firestore.collection(collectionName).doc(docId).delete();
      } catch {
        // Fallback
      }
    }
    const res = this.getCollectionStore(collectionName).delete(docId);
    this.saveLocalBackup();
    return res;
  }

  async getDocs(
    collectionName: string,
    filterFn?: (item: any) => boolean,
    sortField?: string,
    desc: boolean = true,
  ): Promise<any[]> {
    const firestore = this.getFirestore();
    let results: any[] = [];

    if (firestore) {
      try {
        const snap = await firestore.collection(collectionName).get();
        snap.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
      } catch {
        results = [];
      }
    }

    if (results.length === 0) {
      results = Array.from(this.getCollectionStore(collectionName).values());
    }

    if (filterFn) {
      results = results.filter(filterFn);
    }

    if (sortField) {
      results.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    }

    return results;
  }

  // ── Database Seed Data ────────────────────────────────────────────────

  private async seedInitialData() {
    // 1. Seed Service Categories
    const existingServices = await this.getDocs('services');
    if (existingServices.length === 0) {
      const services = [
        { id: 'Cleaning', name: 'Cleaning', fullName: 'Housekeeping / Cleaner', tone: 'PEACH', iconName: 'sparkles', baseRatePerHour: 250 },
        { id: 'Cooking', name: 'Cooking', fullName: 'Cook / Kitchen Staff', tone: 'YELLOW', iconName: 'restaurant', baseRatePerHour: 280 },
        { id: 'Plumbing', name: 'Plumbing', fullName: 'Plumber', tone: 'MINT', iconName: 'water', baseRatePerHour: 300 },
        { id: 'Electrical', name: 'Electrical', fullName: 'Electrician', tone: 'LAVENDER', iconName: 'flash', baseRatePerHour: 300 },
        { id: 'Carpentry', name: 'Carpentry', fullName: 'Carpenter', tone: 'PINK', iconName: 'hammer', baseRatePerHour: 320 },
        { id: 'General Help', name: 'General Help', fullName: 'General Helper / Labourer', tone: 'MINT', iconName: 'hand-left', baseRatePerHour: 200 },
        { id: 'Service Staff', name: 'Service Staff', fullName: 'Waiter / Service Staff', tone: 'PEACH', iconName: 'people', baseRatePerHour: 220 },
        { id: 'Security', name: 'Security', fullName: 'Security Guard', tone: 'LAVENDER', iconName: 'shield-checkmark', baseRatePerHour: 250 },
        { id: 'Driver', name: 'Driver', fullName: 'Driver', tone: 'YELLOW', iconName: 'car', baseRatePerHour: 260 },
        { id: 'Delivery', name: 'Delivery', fullName: 'Delivery / Logistics Worker', tone: 'PINK', iconName: 'bicycle', baseRatePerHour: 220 },
        { id: 'Warehouse', name: 'Warehouse', fullName: 'Warehouse Worker', tone: 'MINT', iconName: 'cube', baseRatePerHour: 230 },
        { id: 'Painting', name: 'Painting', fullName: 'Painter', tone: 'PEACH', iconName: 'color-palette', baseRatePerHour: 290 },
        { id: 'AC Service', name: 'AC Service', fullName: 'AC / Refrigeration Technician', tone: 'LAVENDER', iconName: 'snow', baseRatePerHour: 350 },
        { id: 'Appliance Repair', name: 'Appliance Repair', fullName: 'Appliance Repair Technician', tone: 'YELLOW', iconName: 'construct', baseRatePerHour: 320 },
        { id: 'Welding', name: 'Welding', fullName: 'Welder / Fabricator', tone: 'PINK', iconName: 'flame', baseRatePerHour: 340 },
      ];

      for (const s of services) {
        await this.setDoc('services', s.id, s);
      }
      this.logger.log(`✅ Seeded ${services.length} services to Firestore.`);
    }

    // 2. Seed Default Verified Workers if empty (ensures maps & listings always work out-of-the-box)
    const existingWorkers = await this.getDocs('workers');
    if (existingWorkers.length === 0) {
      const defaultWorkers = [
        {
          id: '9579196005',
          workerId: '9579196005',
          name: 'Ramesh Patil',
          phone: '9579196005',
          serviceCategory: 'Cleaning',
          years: 4,
          experienceDetails: '4 years experience in home deep cleaning',
          skills: ['Home cleaning', 'Deep kitchen cleaning', 'Floor polishing'],
          ratePerHour: 250,
          equipment: 'Eco-friendly supplies and personal toolkit',
          languages: 'Hindi, Marathi',
          bio: 'Verified professional home cleaner in Pune.',
          city: 'Pune',
          address: 'FC Road, Shivajinagar, Pune, Maharashtra 411005',
          latitude: 18.5314,
          longitude: 73.8446,
          jobs: 142,
          distanceKm: 1.8,
          onTimePercent: '99%',
          isVerified: true,
          imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '9820626341',
          workerId: '9820626341',
          name: 'Sunita Sharma',
          phone: '9820626341',
          serviceCategory: 'Cleaning',
          years: 3,
          experienceDetails: '3 years experience in kitchen & house cleaning',
          skills: ['Deep kitchen cleaning', 'Home cleaning'],
          ratePerHour: 260,
          equipment: 'Personal cleaning supplies',
          languages: 'Hindi, Marathi',
          bio: 'Experienced cleaner specializing in kitchens and bathrooms.',
          city: 'Pune',
          address: 'Kalyani Nagar, Pune, Maharashtra 411006',
          latitude: 18.5482,
          longitude: 73.9025,
          jobs: 98,
          distanceKm: 2.3,
          onTimePercent: '100%',
          isVerified: true,
          imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '9822001122',
          workerId: '9822001122',
          name: 'Amit Shinde',
          phone: '9822001122',
          serviceCategory: 'Cooking',
          years: 5,
          experienceDetails: '5 years cooking North Indian and Maharashtrian dishes',
          skills: ['North Indian', 'Maharashtrian', 'Party Catering'],
          ratePerHour: 280,
          equipment: 'Own knife set and culinary tools',
          languages: 'Hindi, Marathi, English',
          bio: 'Home chef specialized in healthy daily home cooking and party meals.',
          city: 'Pune',
          address: 'Kothrud, Pune, Maharashtra 411038',
          latitude: 18.5074,
          longitude: 73.8077,
          jobs: 110,
          distanceKm: 3.1,
          onTimePercent: '98%',
          isVerified: true,
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '9822003344',
          workerId: '9822003344',
          name: 'Rajesh More',
          phone: '9822003344',
          serviceCategory: 'Plumbing',
          years: 6,
          experienceDetails: 'Expert in leak repair, pipe fitting, and bathroom fixtures',
          skills: ['Leak repair', 'Pipe fitting', 'Bathroom fixtures'],
          ratePerHour: 300,
          equipment: 'Full plumbing kit with pipe wrench and sealants',
          languages: 'Hindi, Marathi',
          bio: 'Certified plumber available for rapid emergency repairs.',
          city: 'Pune',
          address: 'Viman Nagar, Pune, Maharashtra 411014',
          latitude: 18.5679,
          longitude: 73.9143,
          jobs: 175,
          distanceKm: 2.7,
          onTimePercent: '99%',
          isVerified: true,
          imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const w of defaultWorkers) {
        await this.setDoc('workers', w.id, w);
      }
      this.logger.log(`✅ Seeded ${defaultWorkers.length} default verified workers to Firestore.`);
    }
  }
}
