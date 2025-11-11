import { prisma } from '@/lib/prisma';

/**
 * Advanced Search and Filtering Service
 * Provides powerful search capabilities for jobs, applications, and workers
 */

export interface SearchFilters {
  // Common filters
  query?: string;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
  
  // Job-specific filters
  workType?: string[];
  experienceLevel?: string[];
  salaryMin?: number;
  salaryMax?: number;
  schedule?: string[];
  benefits?: string[];
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Application-specific filters
  status?: string[];
  rating?: number;
  hasInterview?: boolean;
  
  // Worker-specific filters
  skills?: string[];
  availability?: string[];
  yearsOfExperience?: { min?: number; max?: number };
  certifications?: string[];
  languages?: string[];
  transportationMethod?: string[];
  
  // Advanced filters
  customFields?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  facets: SearchFacets;
  suggestions: string[];
  relatedQueries: string[];
}

export interface SearchFacets {
  workTypes: { value: string; count: number }[];
  locations: { value: string; count: number }[];
  experienceLevels: { value: string; count: number }[];
  salaryRanges: { range: string; count: number }[];
  skills: { value: string; count: number }[];
  statuses: { value: string; count: number }[];
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: SearchFilters;
  searchType: 'jobs' | 'applications' | 'workers';
  userId: string;
  isActive: boolean;
  alertsEnabled: boolean;
  lastExecuted?: Date;
  resultCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SearchService {
  /**
   * Search jobs with advanced filtering
   */
  async searchJobs(
    filters: SearchFilters,
    userId?: string
  ): Promise<SearchResult<any>> {
    try {
      const {
        query,
        location,
        workType,
        experienceLevel,
        salaryMin,
        salaryMax,
        schedule,
        benefits,
        urgency,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        limit = 20,
        offset = 0
      } = filters;

      // Build where clause
      const where: any = {
        isActive: true,
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo })
          }
        } : {})
      };

      // Full-text search
      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { requirements: { contains: query, mode: 'insensitive' } },
          { benefits: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Location filter
      if (location) {
        where.location = { contains: location, mode: 'insensitive' };
      }

      // Work type filter
      if (workType && workType.length > 0) {
        where.workType = { in: workType };
      }

      // Experience level filter
      if (experienceLevel && experienceLevel.length > 0) {
        where.experienceLevel = { in: experienceLevel };
      }

      // Salary filter
      if (salaryMin !== undefined || salaryMax !== undefined) {
        where.salaryMin = {};
        if (salaryMin !== undefined) where.salaryMin.gte = salaryMin;
        if (salaryMax !== undefined) where.salaryMax.lte = salaryMax;
      }

      // Schedule filter
      if (schedule && schedule.length > 0) {
        where.schedule = { hasSome: schedule };
      }

      // Benefits filter
      if (benefits && benefits.length > 0) {
        where.benefits = {
          contains: benefits.join('|'),
          mode: 'insensitive'
        };
      }

      // Urgency filter
      if (urgency) {
        where.urgency = urgency;
      }

      // Execute search
      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            employer: {
              select: {
                id: true,
                name: true,
                email: true,
                restaurantName: true,
                location: true
              }
            },
            applications: {
              select: { id: true, status: true },
              take: 5
            },
            _count: {
              select: { applications: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit
        }),
        prisma.job.count({ where })
      ]);

      // Calculate facets
      const facets = await this.calculateJobFacets(where);

      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions('jobs', query || '');

      // Generate related queries
      const relatedQueries = await this.generateRelatedQueries('jobs', filters);

      return {
        data: jobs,
        total,
        facets,
        suggestions,
        relatedQueries
      };

    } catch (error) {
      console.error('Job search error:', error);
      throw new Error('Failed to search jobs');
    }
  }

  /**
   * Search applications with advanced filtering
   */
  async searchApplications(
    filters: SearchFilters,
    restaurantOwnerId: string
  ): Promise<SearchResult<any>> {
    try {
      const {
        query,
        status,
        rating,
        hasInterview,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        limit = 20,
        offset = 0
      } = filters;

      // Build where clause
      const where: any = {
        job: { employerId: restaurantOwnerId },
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo })
          }
        } : {})
      };

      // Full-text search
      if (query) {
        where.OR = [
          { coverLetter: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
          { worker: { 
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          } },
          { job: { title: { contains: query, mode: 'insensitive' } } }
        ];
      }

      // Status filter
      if (status && status.length > 0) {
        where.status = { in: status };
      }

      // Rating filter
      if (rating !== undefined) {
        where.rating = { gte: rating };
      }

      // Interview filter
      if (hasInterview !== undefined) {
        if (hasInterview) {
          where.interviews = { some: {} };
        } else {
          where.interviews = { none: {} };
        }
      }

      // Execute search
      const [applications, total] = await Promise.all([
        prisma.application.findMany({
          where,
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                skills: true,
                experience: true,
                availability: true
              }
            },
            job: {
              select: {
                id: true,
                title: true,
                workType: true,
                location: true
              }
            },
            interviews: {
              select: {
                id: true,
                scheduledAt: true,
                status: true,
                type: true
              },
              orderBy: { scheduledAt: 'desc' },
              take: 1
            },
            reviews: {
              select: {
                id: true,
                rating: true,
                feedback: true,
                createdAt: true
              },
              take: 1
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit
        }),
        prisma.application.count({ where })
      ]);

      // Calculate facets
      const facets = await this.calculateApplicationFacets(where);

      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions('applications', query || '');

      // Generate related queries
      const relatedQueries = await this.generateRelatedQueries('applications', filters);

      return {
        data: applications,
        total,
        facets,
        suggestions,
        relatedQueries
      };

    } catch (error) {
      console.error('Application search error:', error);
      throw new Error('Failed to search applications');
    }
  }

  /**
   * Search workers/candidates with advanced filtering
   */
  async searchWorkers(
    filters: SearchFilters,
    restaurantOwnerId?: string
  ): Promise<SearchResult<any>> {
    try {
      const {
        query,
        skills,
        availability,
        yearsOfExperience,
        certifications,
        languages,
        transportationMethod,
        location,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        limit = 20,
        offset = 0
      } = filters;

      // Build where clause
      const where: any = {
        role: 'WORKER',
        isActive: true
      };

      // Full-text search
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { skills: { hasSome: [query] } },
          { experience: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Skills filter
      if (skills && skills.length > 0) {
        where.skills = { hasSome: skills };
      }

      // Availability filter
      if (availability && availability.length > 0) {
        where.availability = { hasSome: availability };
      }

      // Experience filter
      if (yearsOfExperience) {
        // This would require a separate field in the database
        // For now, we'll search in the experience text field
        const experienceFilters = [];
        if (yearsOfExperience.min) {
          experienceFilters.push({ experience: { contains: `${yearsOfExperience.min}+ years` } });
        }
        if (yearsOfExperience.max) {
          experienceFilters.push({ experience: { contains: `${yearsOfExperience.max} years` } });
        }
        if (experienceFilters.length > 0) {
          where.AND = experienceFilters;
        }
      }

      // Certifications filter
      if (certifications && certifications.length > 0) {
        where.certifications = { hasSome: certifications };
      }

      // Languages filter
      if (languages && languages.length > 0) {
        where.languages = { hasSome: languages };
      }

      // Transportation filter
      if (transportationMethod && transportationMethod.length > 0) {
        where.transportationMethod = { in: transportationMethod };
      }

      // Location filter
      if (location) {
        where.location = { contains: location, mode: 'insensitive' };
      }

      // Execute search
      const [workers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            bio: true,
            skills: true,
            experience: true,
            availability: true,
            certifications: true,
            languages: true,
            transportationMethod: true,
            profilePicture: true,
            createdAt: true,
            applications: {
              select: {
                id: true,
                status: true,
                job: {
                  select: {
                    title: true,
                    employer: {
                      select: { restaurantName: true }
                    }
                  }
                },
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            reviews: {
              select: {
                rating: true,
                feedback: true,
                createdAt: true
              },
              take: 3
            },
            _count: {
              select: {
                applications: true,
                reviews: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      // Calculate facets
      const facets = await this.calculateWorkerFacets(where);

      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions('workers', query || '');

      // Generate related queries
      const relatedQueries = await this.generateRelatedQueries('workers', filters);

      return {
        data: workers,
        total,
        facets,
        suggestions,
        relatedQueries
      };

    } catch (error) {
      console.error('Worker search error:', error);
      throw new Error('Failed to search workers');
    }
  }

  /**
   * Calculate facets for job search results
   */
  private async calculateJobFacets(baseWhere: any): Promise<SearchFacets> {
    try {
      const [workTypes, locations, experienceLevels, salaryRanges] = await Promise.all([
        prisma.job.groupBy({
          by: ['workType'],
          where: baseWhere,
          _count: { workType: true }
        }),
        prisma.job.groupBy({
          by: ['location'],
          where: baseWhere,
          _count: { location: true }
        }),
        prisma.job.groupBy({
          by: ['experienceLevel'],
          where: baseWhere,
          _count: { experienceLevel: true }
        }),
        // For salary ranges, we'll need to do a more complex aggregation
        this.calculateSalaryRangeFacets(baseWhere)
      ]);

      return {
        workTypes: workTypes.map(wt => ({ value: wt.workType, count: wt._count.workType })),
        locations: locations.map(loc => ({ value: loc.location, count: loc._count.location })),
        experienceLevels: experienceLevels.map(exp => ({ value: exp.experienceLevel, count: exp._count.experienceLevel })),
        salaryRanges,
        skills: [], // Would require skills field in Job model
        statuses: [] // Not applicable for jobs
      };

    } catch (error) {
      console.error('Error calculating job facets:', error);
      return {
        workTypes: [],
        locations: [],
        experienceLevels: [],
        salaryRanges: [],
        skills: [],
        statuses: []
      };
    }
  }

  /**
   * Calculate facets for application search results
   */
  private async calculateApplicationFacets(baseWhere: any): Promise<SearchFacets> {
    try {
      const statuses = await prisma.application.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true }
      });

      return {
        workTypes: [],
        locations: [],
        experienceLevels: [],
        salaryRanges: [],
        skills: [],
        statuses: statuses.map(status => ({ value: status.status, count: status._count.status }))
      };

    } catch (error) {
      console.error('Error calculating application facets:', error);
      return {
        workTypes: [],
        locations: [],
        experienceLevels: [],
        salaryRanges: [],
        skills: [],
        statuses: []
      };
    }
  }

  /**
   * Calculate facets for worker search results
   */
  private async calculateWorkerFacets(baseWhere: any): Promise<SearchFacets> {
    try {
      const locations = await prisma.user.groupBy({
        by: ['location'],
        where: baseWhere,
        _count: { location: true }
      });

      // For skills, we'd need to flatten the array field
      // This is a simplified version
      const skills = await this.calculateSkillsFacets(baseWhere);

      return {
        workTypes: [],
        locations: locations.filter(loc => loc.location).map(loc => ({ 
          value: loc.location!, 
          count: loc._count.location 
        })),
        experienceLevels: [],
        salaryRanges: [],
        skills,
        statuses: []
      };

    } catch (error) {
      console.error('Error calculating worker facets:', error);
      return {
        workTypes: [],
        locations: [],
        experienceLevels: [],
        salaryRanges: [],
        skills: [],
        statuses: []
      };
    }
  }

  /**
   * Calculate salary range facets
   */
  private async calculateSalaryRangeFacets(baseWhere: any): Promise<{ range: string; count: number }[]> {
    try {
      const salaryRanges = [
        { min: 0, max: 15, label: '$0-$15/hour' },
        { min: 15, max: 20, label: '$15-$20/hour' },
        { min: 20, max: 25, label: '$20-$25/hour' },
        { min: 25, max: 30, label: '$25-$30/hour' },
        { min: 30, max: 999, label: '$30+/hour' }
      ];

      const results = await Promise.all(
        salaryRanges.map(async range => {
          const count = await prisma.job.count({
            where: {
              ...baseWhere,
              salaryMin: { gte: range.min },
              salaryMax: range.max === 999 ? undefined : { lte: range.max }
            }
          });
          return { range: range.label, count };
        })
      );

      return results.filter(r => r.count > 0);

    } catch (error) {
      console.error('Error calculating salary range facets:', error);
      return [];
    }
  }

  /**
   * Calculate skills facets from user skills arrays
   */
  private async calculateSkillsFacets(baseWhere: any): Promise<{ value: string; count: number }[]> {
    try {
      // This would require raw SQL or a more complex query
      // For now, return empty array - would need to implement with raw queries
      return [];

    } catch (error) {
      console.error('Error calculating skills facets:', error);
      return [];
    }
  }

  /**
   * Generate search suggestions based on query and search type
   */
  private async generateSearchSuggestions(
    searchType: 'jobs' | 'applications' | 'workers',
    query: string
  ): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      const suggestions: string[] = [];

      switch (searchType) {
        case 'jobs':
          // Get job titles that match the query
          const jobs = await prisma.job.findMany({
            where: {
              title: { contains: query, mode: 'insensitive' },
              isActive: true
            },
            select: { title: true },
            distinct: ['title'],
            take: 5
          });
          suggestions.push(...jobs.map(job => job.title));
          break;

        case 'workers':
          // Get skills that match the query
          const workers = await prisma.user.findMany({
            where: {
              role: 'WORKER',
              skills: { hasSome: [query] }
            },
            select: { skills: true },
            take: 10
          });

          const skillSuggestions = new Set<string>();
          workers.forEach(worker => {
            worker.skills?.forEach(skill => {
              if (skill.toLowerCase().includes(query.toLowerCase())) {
                skillSuggestions.add(skill);
              }
            });
          });
          suggestions.push(...Array.from(skillSuggestions).slice(0, 5));
          break;

        case 'applications':
          // No specific suggestions for applications
          break;
      }

      return suggestions;

    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Generate related queries based on current filters
   */
  private async generateRelatedQueries(
    searchType: 'jobs' | 'applications' | 'workers',
    filters: SearchFilters
  ): Promise<string[]> {
    const related: string[] = [];

    try {
      switch (searchType) {
        case 'jobs':
          if (filters.workType?.includes('FULL_TIME')) {
            related.push('Part-time positions');
          }
          if (filters.location) {
            related.push('Remote work opportunities');
            related.push(`Jobs near ${filters.location}`);
          }
          if (filters.experienceLevel?.includes('ENTRY_LEVEL')) {
            related.push('Experienced positions');
          }
          break;

        case 'workers':
          if (filters.skills?.length) {
            related.push('Workers with similar skills');
            related.push('Entry-level candidates');
          }
          if (filters.location) {
            related.push('Remote workers');
          }
          break;

        case 'applications':
          related.push('Recent applications');
          related.push('Pending reviews');
          related.push('Top-rated candidates');
          break;
      }

      return related;

    } catch (error) {
      console.error('Error generating related queries:', error);
      return [];
    }
  }

  /**
   * Save a search for future use
   */
  async saveSearch(searchData: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedSearch> {
    try {
      const savedSearch = await prisma.savedSearch.create({
        data: {
          ...searchData,
          filters: JSON.stringify(searchData.filters)
        }
      });

      return {
        ...savedSearch,
        filters: JSON.parse(savedSearch.filters as string)
      } as SavedSearch;

    } catch (error) {
      console.error('Error saving search:', error);
      throw new Error('Failed to save search');
    }
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const savedSearches = await prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });

      return savedSearches.map(search => ({
        ...search,
        filters: JSON.parse(search.filters as string)
      })) as SavedSearch[];

    } catch (error) {
      console.error('Error getting saved searches:', error);
      throw new Error('Failed to get saved searches');
    }
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    searchId: string,
    updates: Partial<SavedSearch>,
    userId: string
  ): Promise<SavedSearch> {
    try {
      const updateData: any = { ...updates };
      if (updates.filters) {
        updateData.filters = JSON.stringify(updates.filters);
      }

      const savedSearch = await prisma.savedSearch.update({
        where: { 
          id: searchId,
          userId // Ensure user owns the search
        },
        data: updateData
      });

      return {
        ...savedSearch,
        filters: JSON.parse(savedSearch.filters as string)
      } as SavedSearch;

    } catch (error) {
      console.error('Error updating saved search:', error);
      throw new Error('Failed to update saved search');
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string, userId: string): Promise<void> {
    try {
      await prisma.savedSearch.delete({
        where: { 
          id: searchId,
          userId // Ensure user owns the search
        }
      });

    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw new Error('Failed to delete saved search');
    }
  }

  /**
   * Execute a saved search
   */
  async executeSavedSearch(searchId: string, userId: string): Promise<SearchResult<any>> {
    try {
      const savedSearch = await prisma.savedSearch.findFirst({
        where: { id: searchId, userId }
      });

      if (!savedSearch) {
        throw new Error('Saved search not found');
      }

      const filters = JSON.parse(savedSearch.filters as string) as SearchFilters;

      // Update last executed timestamp
      await prisma.savedSearch.update({
        where: { id: searchId },
        data: { lastExecuted: new Date() }
      });

      // Execute the appropriate search
      switch (savedSearch.searchType) {
        case 'jobs':
          return await this.searchJobs(filters, userId);
        case 'applications':
          return await this.searchApplications(filters, userId);
        case 'workers':
          return await this.searchWorkers(filters, userId);
        default:
          throw new Error('Invalid search type');
      }

    } catch (error) {
      console.error('Error executing saved search:', error);
      throw new Error('Failed to execute saved search');
    }
  }
}