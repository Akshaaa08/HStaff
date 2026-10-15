import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service.js';

@Injectable()
export class ServicesService {
  constructor(private firebaseService: FirebaseService) {}

  async findAll() {
    return this.firebaseService.getDocs('services', undefined, 'name', false);
  }

  async findByName(name: string) {
    return this.firebaseService.getDoc('services', name);
  }
}
