import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service.js';

@Injectable()
export class WorkersService {
  private readonly logger = new Logger(WorkersService.name);

  constructor(private firebaseService: FirebaseService) {}

  async findAll(service?: string, city?: string, sort?: string) {
    const allWorkers = await this.firebaseService.getDocs('workers', (w) => {
      // Must not be explicitly unverified
      if (w.isVerified === false) return false;
      return true;
    });

    const cleanService = (service || '').trim().toLowerCase();
    const cleanCity = (city || '').trim().toLowerCase();

    // 1. Filter by Service & Skills
    let matchedWorkers = allWorkers;
    if (cleanService && cleanService !== 'all') {
      matchedWorkers = allWorkers.filter((w) => {
        const cat = (w.serviceCategory || '').toLowerCase();
        // Category exact or substring match (e.g. 'clean' in 'Cleaning' or vice versa)
        if (cat && (cat.includes(cleanService) || cleanService.includes(cat))) {
          return true;
        }

        // Skills match: check if any skill matches or contains service words
        if (Array.isArray(w.skills) && w.skills.length > 0) {
          const hasSkillMatch = w.skills.some((sk: string) => {
            const skillLower = (sk || '').toLowerCase();
            if (skillLower.includes(cleanService) || cleanService.includes(skillLower)) {
              return true;
            }
            // Check word-by-word match (e.g., 'cleaning' in 'Home cleaning')
            const serviceWords = cleanService.split(/[\s,/-]+/).filter((word) => word.length > 2);
            const skillWords = skillLower.split(/[\s,/-]+/).filter((word) => word.length > 2);
            return serviceWords.some((sw) =>
              skillWords.some((skw) => skw.includes(sw) || sw.includes(skw))
            );
          });
          if (hasSkillMatch) return true;
        }

        // Also check experience details / bio
        const bio = (w.bio || w.experienceDetails || '').toLowerCase();
        if (bio.includes(cleanService)) {
          return true;
        }

        return false;
      });

      // If strict service match yielded 0 workers, fallback to all workers
      // so clients never get a dead-end during early rollout / testing
      if (matchedWorkers.length === 0 && allWorkers.length > 0) {
        this.logger.log(`No exact worker for service '${service}', falling back to all active workers`);
        matchedWorkers = allWorkers;
      }
    }

    // 2. Filter by City (smart local priority with statewide fallback)
    let results = matchedWorkers;
    if (cleanCity && cleanCity !== 'all' && cleanCity !== 'all maharashtra') {
      const cityMatches = matchedWorkers.filter((w) => {
        const workerCity = (w.city || '').toLowerCase();
        const workerAddress = (w.address || '').toLowerCase();
        const workerBio = (w.bio || w.experienceDetails || '').toLowerCase();

        return (
          workerCity.includes(cleanCity) ||
          cleanCity.includes(workerCity) ||
          workerAddress.includes(cleanCity) ||
          workerBio.includes(cleanCity)
        );
      });

      // If matching workers exist in that city/locality, return them!
      // If 0 found in that exact town, fallback to all matching workers across Maharashtra
      if (cityMatches.length > 0) {
        results = cityMatches;
      } else {
        this.logger.log(`No worker strictly in city '${city}', showing verified workers across Maharashtra`);
        results = matchedWorkers;
      }
    }

    // 3. Sorting
    switch (sort) {
      case 'Nearest':
        results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        break;
      case 'Top Rated':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'Price':
        results.sort((a, b) => (a.ratePerHour || 0) - (b.ratePerHour || 0));
        break;
      default:
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return results;
  }

  async findByWorkerId(workerId: string) {
    const worker = await this.firebaseService.getDoc('workers', workerId);
    if (!worker) {
      throw new NotFoundException(`Worker with ID '${workerId}' not found`);
    }
    return worker;
  }
}
