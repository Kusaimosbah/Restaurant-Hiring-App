import { prisma } from '@/lib/prisma';

export interface JobMatchScore {
  jobId: string;
  workerId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  locationScore: number;
  availabilityScore: number;
  salaryScore: number;
  cultureScore: number;
  breakdown: {
    skills: {
      matched: string[];
      missing: string[];
      score: number;
    };
    experience: {
      required: number;
      actual: number;
      score: number;
    };
    location: {
      distance: number;
      score: number;
    };
    availability: {
      overlap: number;
      score: number;
    };
    salary: {
      expected: number;
      offered: number;
      score: number;
    };
    culture: {
      factors: string[];
      score: number;
    };
  };
  confidence: number;
  reasons: string[];
  recommendations: string[];
}

export interface MLFeatures {
  // Worker features
  workerSkills: number[];
  workerExperience: number;
  workerRating: number;
  workerCompletionRate: number;
  workerPreferredSalary: number;
  workerLocation: [number, number]; // [lat, lng]
  workerAvailability: number[];
  
  // Job features
  jobRequiredSkills: number[];
  jobExperienceLevel: number;
  jobSalary: number;
  jobLocation: [number, number];
  jobSchedule: number[];
  jobUrgency: number;
  jobRestaurantRating: number;
  
  // Historical features
  similarJobsSuccess: number;
  workerJobTypePreference: number;
  seasonalFactors: number;
  marketDemand: number;
}

export class AdvancedJobMatchingService {
  private readonly SKILL_WEIGHTS = {
    exact: 1.0,
    similar: 0.7,
    transferable: 0.4,
    basic: 0.2,
  };

  private readonly DISTANCE_DECAY = 0.1; // Score reduction per mile
  private readonly MAX_DISTANCE = 50; // Maximum reasonable distance in miles

  /**
   * Calculate comprehensive job match score using ML-enhanced algorithm
   */
  async calculateJobMatch(jobId: string, workerId: string): Promise<JobMatchScore> {
    const [job, worker] = await Promise.all([
      this.getJobWithDetails(jobId),
      this.getWorkerWithDetails(workerId),
    ]);

    if (!job || !worker) {
      throw new Error('Job or worker not found');
    }

    // Extract ML features
    const features = await this.extractMLFeatures(job, worker);
    
    // Calculate individual scores
    const skillsScore = this.calculateSkillsScore(job, worker);
    const experienceScore = this.calculateExperienceScore(job, worker);
    const locationScore = this.calculateLocationScore(job, worker);
    const availabilityScore = this.calculateAvailabilityScore(job, worker);
    const salaryScore = this.calculateSalaryScore(job, worker);
    const cultureScore = await this.calculateCultureScore(job, worker);

    // Apply ML enhancement
    const mlEnhancement = await this.applyMLEnhancement(features);
    
    // Calculate weighted overall score
    const weights = await this.getDynamicWeights(job, worker);
    const overallScore = (
      skillsScore.score * weights.skills +
      experienceScore.score * weights.experience +
      locationScore.score * weights.location +
      availabilityScore.score * weights.availability +
      salaryScore.score * weights.salary +
      cultureScore.score * weights.culture
    ) * mlEnhancement.multiplier;

    // Calculate confidence based on data quality and historical performance
    const confidence = this.calculateConfidence(job, worker, overallScore);

    // Generate insights and recommendations
    const { reasons, recommendations } = this.generateInsights(
      job, worker, skillsScore, experienceScore, locationScore, 
      availabilityScore, salaryScore, cultureScore
    );

    return {
      jobId,
      workerId,
      overallScore: Math.min(100, Math.max(0, overallScore)),
      skillsScore: skillsScore.score,
      experienceScore: experienceScore.score,
      locationScore: locationScore.score,
      availabilityScore: availabilityScore.score,
      salaryScore: salaryScore.score,
      cultureScore: cultureScore.score,
      breakdown: {
        skills: skillsScore,
        experience: experienceScore,
        location: locationScore,
        availability: availabilityScore,
        salary: salaryScore,
        culture: cultureScore,
      },
      confidence,
      reasons,
      recommendations,
    };
  }

  /**
   * Get job recommendations for a worker using advanced ML algorithms
   */
  async getJobRecommendations(
    workerId: string, 
    options: {
      limit?: number;
      minScore?: number;
      includeApplied?: boolean;
      categories?: string[];
      maxDistance?: number;
    } = {}
  ): Promise<JobMatchScore[]> {
    const {
      limit = 10,
      minScore = 60,
      includeApplied = false,
      categories,
      maxDistance = this.MAX_DISTANCE,
    } = options;

    // Get worker details
    const worker = await this.getWorkerWithDetails(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    // Build job query with filters
    const jobFilter: any = {
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    };

    if (!includeApplied) {
      jobFilter.applications = {
        none: { workerId }
      };
    }

    if (categories?.length) {
      jobFilter.title = {
        contains: categories.join('|'),
        mode: 'insensitive',
      };
    }

    // Get candidate jobs
    const jobs = await prisma.job.findMany({
      where: jobFilter,
      include: {
        restaurant: {
          include: {
            reviews: true,
          }
        },
        applications: {
          include: {
            worker: true,
          }
        },
        _count: {
          select: {
            applications: true,
          }
        }
      },
      take: 100, // Get more to filter by distance and score
    });

    // Calculate matches for all jobs
    const matches = await Promise.all(
      jobs.map(async (job) => {
        try {
          return await this.calculateJobMatch(job.id, workerId);
        } catch (error) {
          console.error(`Error calculating match for job ${job.id}:`, error);
          return null;
        }
      })
    );

    // Filter and sort results
    const validMatches = matches
      .filter((match): match is JobMatchScore => 
        match !== null && 
        match.overallScore >= minScore &&
        match.breakdown.location.distance <= maxDistance
      )
      .sort((a, b) => {
        // Primary sort by overall score
        if (Math.abs(a.overallScore - b.overallScore) > 5) {
          return b.overallScore - a.overallScore;
        }
        // Secondary sort by confidence
        return b.confidence - a.confidence;
      })
      .slice(0, limit);

    return validMatches;
  }

  /**
   * Get worker recommendations for a job posting
   */
  async getWorkerRecommendations(
    jobId: string,
    options: {
      limit?: number;
      minScore?: number;
      excludeApplied?: boolean;
      activeOnly?: boolean;
    } = {}
  ): Promise<JobMatchScore[]> {
    const {
      limit = 20,
      minScore = 50,
      excludeApplied = true,
      activeOnly = true,
    } = options;

    // Get job details
    const job = await this.getJobWithDetails(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Build worker query
    const workerFilter: any = {};

    if (excludeApplied) {
      workerFilter.applications = {
        none: { jobId }
      };
    }

    if (activeOnly) {
      workerFilter.user = {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
        }
      };
    }

    // Get candidate workers
    const workers = await prisma.workerProfile.findMany({
      where: workerFilter,
      include: {
        user: true,
        applications: {
          include: {
            job: true,
          }
        },
        reviewsFromRestaurants: true,
        workerSkills: {
          include: {
            skill: true,
          }
        },
        certifications: true,
      },
      take: 200, // Get more to filter by score
    });

    // Calculate matches for all workers
    const matches = await Promise.all(
      workers.map(async (worker) => {
        try {
          return await this.calculateJobMatch(jobId, worker.id);
        } catch (error) {
          console.error(`Error calculating match for worker ${worker.id}:`, error);
          return null;
        }
      })
    );

    // Filter and sort results
    const validMatches = matches
      .filter((match): match is JobMatchScore => 
        match !== null && match.overallScore >= minScore
      )
      .sort((a, b) => {
        // Weighted scoring considering both match score and confidence
        const scoreA = a.overallScore * (a.confidence / 100);
        const scoreB = b.overallScore * (b.confidence / 100);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return validMatches;
  }

  /**
   * Calculate skills compatibility score
   */
  private calculateSkillsScore(job: any, worker: any) {
    const requiredSkills = this.extractJobSkills(job);
    const workerSkills = worker.workerSkills?.map((ws: any) => ({
      name: ws.skill.name,
      level: ws.level,
      yearsExperience: ws.yearsExperience || 0,
    })) || [];

    const matched: string[] = [];
    const missing: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    requiredSkills.forEach((requiredSkill) => {
      maxPossibleScore += requiredSkill.weight;
      
      const workerSkill = workerSkills.find(ws => 
        this.skillsSimilarity(ws.name, requiredSkill.name) > 0.8
      );

      if (workerSkill) {
        matched.push(requiredSkill.name);
        
        // Calculate skill level match
        const levelScore = this.calculateSkillLevelScore(
          requiredSkill.level,
          workerSkill.level,
          workerSkill.yearsExperience
        );
        
        totalScore += requiredSkill.weight * levelScore;
      } else {
        missing.push(requiredSkill.name);
      }
    });

    const score = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      matched,
      missing,
      score: Math.round(score),
    };
  }

  /**
   * Calculate experience compatibility score
   */
  private calculateExperienceScore(job: any, worker: any) {
    const requiredExperience = this.extractRequiredExperience(job);
    const workerExperience = worker.yearsOfExperience || 0;

    let score = 0;
    
    if (workerExperience >= requiredExperience) {
      // Worker meets or exceeds requirements
      score = 100;
      
      // Slight penalty for being overqualified (may seek higher positions)
      if (workerExperience > requiredExperience * 2) {
        score = Math.max(80, score - (workerExperience - requiredExperience * 2) * 5);
      }
    } else {
      // Worker has less experience than required
      const experienceRatio = workerExperience / Math.max(requiredExperience, 1);
      score = Math.min(85, experienceRatio * 100); // Cap at 85 for under-qualified
    }

    return {
      required: requiredExperience,
      actual: workerExperience,
      score: Math.round(score),
    };
  }

  /**
   * Calculate location compatibility score
   */
  private calculateLocationScore(job: any, worker: any) {
    const distance = this.calculateDistance(
      [job.restaurant.latitude || 0, job.restaurant.longitude || 0],
      [worker.latitude || 0, worker.longitude || 0]
    );

    let score = 100;
    
    if (distance > 0) {
      // Exponential decay based on distance
      score = Math.max(0, 100 * Math.exp(-this.DISTANCE_DECAY * distance));
    }

    return {
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      score: Math.round(score),
    };
  }

  /**
   * Calculate availability compatibility score
   */
  private calculateAvailabilityScore(job: any, worker: any) {
    // This is a simplified version - in practice, you'd have detailed schedule data
    const jobSchedule = this.extractJobSchedule(job);
    const workerAvailability = this.extractWorkerAvailability(worker);

    const overlap = this.calculateScheduleOverlap(jobSchedule, workerAvailability);
    const score = overlap * 100;

    return {
      overlap: Math.round(overlap * 100) / 100,
      score: Math.round(score),
    };
  }

  /**
   * Calculate salary compatibility score
   */
  private calculateSalaryScore(job: any, worker: any) {
    const offeredSalary = job.hourlyRate || 0;
    const expectedSalary = worker.hourlyRate || 0;

    let score = 100;

    if (expectedSalary > 0) {
      const salaryRatio = offeredSalary / expectedSalary;
      
      if (salaryRatio >= 1) {
        // Offered salary meets or exceeds expectations
        score = 100;
      } else {
        // Offered salary is below expectations
        score = Math.max(20, salaryRatio * 100);
      }
    }

    return {
      expected: expectedSalary,
      offered: offeredSalary,
      score: Math.round(score),
    };
  }

  /**
   * Calculate cultural fit score
   */
  private async calculateCultureScore(job: any, worker: any) {
    const factors: string[] = [];
    let score = 70; // Base score

    // Restaurant rating and reviews
    const restaurantRating = this.calculateRestaurantRating(job.restaurant);
    if (restaurantRating >= 4.0) {
      factors.push('High-rated restaurant');
      score += 10;
    } else if (restaurantRating < 3.0) {
      factors.push('Lower-rated restaurant');
      score -= 10;
    }

    // Worker's historical performance
    const workerRating = this.calculateWorkerRating(worker);
    if (workerRating >= 4.5) {
      factors.push('High-performing worker');
      score += 10;
    }

    // Team size preference
    const teamSize = job.maxWorkers || 1;
    if (teamSize > 5) {
      factors.push('Large team environment');
    } else if (teamSize === 1) {
      factors.push('Independent work');
    }

    return {
      factors,
      score: Math.min(100, Math.max(0, Math.round(score))),
    };
  }

  // Helper methods for data extraction and calculations
  private async getJobWithDetails(jobId: string) {
    return prisma.job.findUnique({
      where: { id: jobId },
      include: {
        restaurant: {
          include: {
            reviews: true,
          }
        },
        applications: {
          include: {
            worker: true,
          }
        },
      },
    });
  }

  private async getWorkerWithDetails(workerId: string) {
    return prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        user: true,
        applications: {
          include: {
            job: {
              include: {
                restaurant: true,
              }
            },
          }
        },
        reviewsFromRestaurants: true,
        workerSkills: {
          include: {
            skill: true,
          }
        },
        certifications: true,
      },
    });
  }

  private extractJobSkills(job: any): Array<{ name: string; level: string; weight: number }> {
    // Extract skills from job requirements text using NLP or predefined mapping
    const skillsText = (job.requirements || '').toLowerCase();
    const commonSkills = [
      { name: 'customer service', level: 'intermediate', weight: 1.0 },
      { name: 'food preparation', level: 'beginner', weight: 0.8 },
      { name: 'cash handling', level: 'beginner', weight: 0.6 },
      { name: 'teamwork', level: 'intermediate', weight: 0.7 },
      { name: 'communication', level: 'intermediate', weight: 0.9 },
    ];

    return commonSkills.filter(skill => 
      skillsText.includes(skill.name.replace(' ', '')) || 
      skillsText.includes(skill.name)
    );
  }

  private extractRequiredExperience(job: any): number {
    const requirementsText = (job.requirements || '').toLowerCase();
    
    // Extract experience requirements using regex
    const experienceMatch = requirementsText.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?experience/);
    if (experienceMatch) {
      return parseInt(experienceMatch[1]);
    }

    // Default based on job title complexity
    const title = (job.title || '').toLowerCase();
    if (title.includes('manager') || title.includes('supervisor')) {
      return 3;
    } else if (title.includes('senior') || title.includes('lead')) {
      return 2;
    }
    
    return 0; // Entry level
  }

  private skillsSimilarity(skill1: string, skill2: string): number {
    // Simple similarity calculation - in practice, use more sophisticated NLP
    const s1 = skill1.toLowerCase().trim();
    const s2 = skill2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    // Check for partial matches
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Levenshtein distance for more sophisticated matching
    return this.levenshteinSimilarity(s1, s2);
  }

  private levenshteinSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen > 0 ? (maxLen - matrix[len1][len2]) / maxLen : 0;
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateSkillLevelScore(required: string, actual: string, experience: number): number {
    const levelMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const reqLevel = levelMap[required as keyof typeof levelMap] || 1;
    const actLevel = levelMap[actual as keyof typeof levelMap] || 1;
    
    let score = Math.min(1.0, actLevel / reqLevel);
    
    // Boost score based on years of experience
    if (experience >= 3) score = Math.min(1.0, score + 0.2);
    if (experience >= 5) score = Math.min(1.0, score + 0.1);
    
    return score;
  }

  private extractJobSchedule(job: any): number[] {
    // Simplified schedule extraction - returns hours of operation as array
    // In practice, this would parse detailed schedule data
    return [9, 10, 11, 12, 13, 14, 15, 16, 17]; // 9 AM to 5 PM
  }

  private extractWorkerAvailability(worker: any): number[] {
    // Extract worker availability from profile
    // Simplified version
    return [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 8 AM to 6 PM
  }

  private calculateScheduleOverlap(schedule1: number[], schedule2: number[]): number {
    const overlap = schedule1.filter(hour => schedule2.includes(hour));
    const union = [...new Set([...schedule1, ...schedule2])];
    return union.length > 0 ? overlap.length / union.length : 0;
  }

  private calculateRestaurantRating(restaurant: any): number {
    const reviews = restaurant.reviews || [];
    if (reviews.length === 0) return 3.5; // Default rating
    
    const total = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    return total / reviews.length;
  }

  private calculateWorkerRating(worker: any): number {
    const reviews = worker.reviewsFromRestaurants || [];
    if (reviews.length === 0) return 3.5; // Default rating
    
    const total = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    return total / reviews.length;
  }

  private async extractMLFeatures(job: any, worker: any): Promise<MLFeatures> {
    // Extract numerical features for ML model
    return {
      workerSkills: this.encodeSkills(worker.workerSkills),
      workerExperience: worker.yearsOfExperience || 0,
      workerRating: this.calculateWorkerRating(worker),
      workerCompletionRate: this.calculateCompletionRate(worker),
      workerPreferredSalary: worker.hourlyRate || 0,
      workerLocation: [worker.latitude || 0, worker.longitude || 0],
      workerAvailability: this.encodeAvailability(worker.availability),
      
      jobRequiredSkills: this.encodeSkills(this.extractJobSkills(job)),
      jobExperienceLevel: this.extractRequiredExperience(job),
      jobSalary: job.hourlyRate || 0,
      jobLocation: [job.restaurant.latitude || 0, job.restaurant.longitude || 0],
      jobSchedule: this.extractJobSchedule(job),
      jobUrgency: this.calculateJobUrgency(job),
      jobRestaurantRating: this.calculateRestaurantRating(job.restaurant),
      
      similarJobsSuccess: await this.calculateSimilarJobsSuccess(worker, job),
      workerJobTypePreference: this.calculateJobTypePreference(worker, job),
      seasonalFactors: this.calculateSeasonalFactors(),
      marketDemand: await this.calculateMarketDemand(job),
    };
  }

  private encodeSkills(skills: any[]): number[] {
    // Convert skills to numerical encoding for ML
    const skillVector = new Array(50).fill(0); // 50-dimensional skill vector
    
    skills.forEach((skill, index) => {
      if (index < 50) {
        skillVector[index] = skill.level === 'expert' ? 4 : 
                            skill.level === 'advanced' ? 3 :
                            skill.level === 'intermediate' ? 2 : 1;
      }
    });
    
    return skillVector;
  }

  private encodeAvailability(availability: any): number[] {
    // Convert availability to 24-hour binary vector
    const vector = new Array(24).fill(0);
    // Simplified encoding - in practice, parse actual availability data
    for (let i = 8; i < 18; i++) {
      vector[i] = 1; // Available 8 AM to 6 PM
    }
    return vector;
  }

  private calculateCompletionRate(worker: any): number {
    const applications = worker.applications || [];
    if (applications.length === 0) return 0.8; // Default rate
    
    const completed = applications.filter((app: any) => app.status === 'HIRED').length;
    return completed / applications.length;
  }

  private calculateJobUrgency(job: any): number {
    const daysUntilStart = Math.max(0, 
      (new Date(job.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    // Urgency increases as start date approaches
    return Math.max(0.1, Math.min(1.0, 1 - (daysUntilStart / 30)));
  }

  private async calculateSimilarJobsSuccess(worker: any, job: any): Promise<number> {
    // Calculate success rate for similar jobs
    const similarJobs = worker.applications?.filter((app: any) => 
      app.job.title.toLowerCase().includes(job.title.toLowerCase().split(' ')[0])
    ) || [];
    
    if (similarJobs.length === 0) return 0.5;
    
    const successful = similarJobs.filter((app: any) => app.status === 'HIRED').length;
    return successful / similarJobs.length;
  }

  private calculateJobTypePreference(worker: any, job: any): number {
    // Calculate worker's preference for this type of job based on history
    const applications = worker.applications || [];
    const jobType = this.categorizeJob(job);
    
    const sameTypeApplications = applications.filter((app: any) => 
      this.categorizeJob(app.job) === jobType
    );
    
    return applications.length > 0 ? sameTypeApplications.length / applications.length : 0.5;
  }

  private categorizeJob(job: any): string {
    const title = job.title.toLowerCase();
    if (title.includes('server') || title.includes('waiter')) return 'service';
    if (title.includes('cook') || title.includes('chef')) return 'kitchen';
    if (title.includes('manager')) return 'management';
    if (title.includes('host')) return 'front-of-house';
    return 'other';
  }

  private calculateSeasonalFactors(): number {
    const month = new Date().getMonth();
    // Restaurant industry seasonal patterns
    const seasonalMultipliers = [0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 1.1, 1.2];
    return seasonalMultipliers[month];
  }

  private async calculateMarketDemand(job: any): Promise<number> {
    // Calculate market demand for this type of job
    const jobType = this.categorizeJob(job);
    const location = `${job.restaurant.city}, ${job.restaurant.state}`;
    
    // Simplified calculation - in practice, use market data APIs
    const recentJobs = await prisma.job.count({
      where: {
        title: { contains: jobType, mode: 'insensitive' },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }
    });
    
    // Normalize to 0-1 scale
    return Math.min(1.0, recentJobs / 100);
  }

  private async applyMLEnhancement(features: MLFeatures): Promise<{ multiplier: number; confidence: number }> {
    // Simplified ML enhancement - in practice, use trained model
    // This would call your ML model API or use a local model
    
    let multiplier = 1.0;
    let confidence = 0.8;
    
    // Simple rule-based enhancement as placeholder
    const skillsMatch = this.calculateVectorSimilarity(features.workerSkills, features.jobRequiredSkills);
    const experienceMatch = Math.min(1.0, features.workerExperience / Math.max(1, features.jobExperienceLevel));
    
    if (skillsMatch > 0.8 && experienceMatch > 0.9) {
      multiplier = 1.1;
      confidence = 0.95;
    } else if (skillsMatch < 0.3 || experienceMatch < 0.5) {
      multiplier = 0.85;
      confidence = 0.6;
    }
    
    return { multiplier, confidence };
  }

  private calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const magnitude1 = Math.sqrt(norm1);
    const magnitude2 = Math.sqrt(norm2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  private async getDynamicWeights(job: any, worker: any): Promise<{
    skills: number;
    experience: number;
    location: number;
    availability: number;
    salary: number;
    culture: number;
  }> {
    // Dynamic weight calculation based on job and market conditions
    const jobType = this.categorizeJob(job);
    
    // Default weights
    let weights = {
      skills: 0.30,
      experience: 0.20,
      location: 0.15,
      availability: 0.15,
      salary: 0.10,
      culture: 0.10,
    };
    
    // Adjust weights based on job type
    if (jobType === 'kitchen') {
      weights.skills = 0.40; // Skills more important for kitchen roles
      weights.experience = 0.25;
    } else if (jobType === 'service') {
      weights.culture = 0.15; // Culture fit more important for customer-facing roles
      weights.skills = 0.25;
    } else if (jobType === 'management') {
      weights.experience = 0.35; // Experience crucial for management
      weights.skills = 0.25;
    }
    
    // Adjust based on urgency
    const urgency = this.calculateJobUrgency(job);
    if (urgency > 0.8) {
      weights.availability = 0.25; // Availability more important for urgent jobs
      weights.location = 0.20;
    }
    
    return weights;
  }

  private calculateConfidence(job: any, worker: any, overallScore: number): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence based on data completeness
    if (worker.workerSkills?.length > 3) confidence += 10;
    if (worker.yearsOfExperience > 0) confidence += 5;
    if (worker.reviewsFromRestaurants?.length > 2) confidence += 10;
    if (job.requirements && job.requirements.length > 50) confidence += 5;
    
    // Adjust based on score extremes
    if (overallScore > 90) confidence -= 5; // High scores might be overfit
    if (overallScore < 30) confidence -= 10; // Very low scores are suspicious
    
    return Math.min(100, Math.max(50, confidence));
  }

  private generateInsights(
    job: any, worker: any, skillsScore: any, experienceScore: any, 
    locationScore: any, availabilityScore: any, salaryScore: any, cultureScore: any
  ): { reasons: string[]; recommendations: string[] } {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    
    // Generate reasons for the match
    if (skillsScore.score >= 80) {
      reasons.push(`Strong skills match (${skillsScore.matched.length}/${skillsScore.matched.length + skillsScore.missing.length} skills matched)`);
    } else if (skillsScore.score >= 60) {
      reasons.push(`Moderate skills match with room for growth`);
    } else {
      reasons.push(`Limited skills match - may require training`);
    }
    
    if (experienceScore.score >= 90) {
      reasons.push(`Excellent experience level (${experienceScore.actual} years)`);
    } else if (experienceScore.score >= 70) {
      reasons.push(`Good experience level for this role`);
    }
    
    if (locationScore.score >= 80) {
      reasons.push(`Convenient location (${locationScore.distance} miles away)`);
    } else if (locationScore.distance > 20) {
      reasons.push(`Long commute distance (${locationScore.distance} miles)`);
    }
    
    if (salaryScore.score >= 90) {
      reasons.push(`Salary expectations align well with offer`);
    } else if (salaryScore.score < 70) {
      reasons.push(`Salary below worker expectations`);
    }
    
    // Generate recommendations
    if (skillsScore.missing.length > 0) {
      recommendations.push(`Consider training in: ${skillsScore.missing.slice(0, 3).join(', ')}`);
    }
    
    if (experienceScore.score < 70) {
      recommendations.push(`Provide mentorship or additional training support`);
    }
    
    if (locationScore.score < 60) {
      recommendations.push(`Consider offering transportation assistance or remote work options`);
    }
    
    if (salaryScore.score < 70) {
      recommendations.push(`Consider salary negotiation or additional benefits`);
    }
    
    if (cultureScore.score >= 80) {
      recommendations.push(`Strong cultural fit - highlight company values in outreach`);
    }
    
    return { reasons, recommendations };
  }
}

export const jobMatchingService = new AdvancedJobMatchingService();