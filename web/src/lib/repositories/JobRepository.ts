import { Job, JobStatus, WorkType } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';
import { AppError } from '@/lib/errors/AppError';

export interface CreateJobData {
  title: string;
  description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  location: string;
  workType: WorkType;
  department: string;
  employerId: string;
  experience_level: string;
  skills_required: string[];
  benefits: string[];
}

export interface UpdateJobData extends Partial<CreateJobData> {
  status?: JobStatus;
}

export interface JobFilters {
  status?: JobStatus;
  workType?: WorkType;
  employerId?: string;
  department?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
}

/**
 * Job Repository - Data Access Layer for Job Management
 * Handles all database operations for job-related data
 */
export class JobRepository extends BaseRepository<Job> {
  protected tableName = 'job';

  /**
   * Create a new job posting
   */
  async create(data: CreateJobData): Promise<Job> {
    try {
      const job = await this.db.job.create({
        data: {
          ...data,
          status: JobStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          employer: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      });

      return job;
    } catch (error) {
      throw new AppError(
        'Failed to create job',
        500,
        'JOB_CREATE_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Find jobs with filters and pagination
   */
  async findMany(
    filters: JobFilters = {},
    page = 1,
    limit = 10
  ): Promise<{ jobs: Job[]; total: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};

      // Apply filters
      if (filters.status) where.status = filters.status;
      if (filters.workType) where.workType = filters.workType;
      if (filters.employerId) where.employerId = filters.employerId;
      if (filters.department) where.department = { contains: filters.department, mode: 'insensitive' };
      if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
      
      // Salary range filter
      if (filters.salary_min || filters.salary_max) {
        where.AND = [];
        if (filters.salary_min) {
          where.AND.push({ salary_max: { gte: filters.salary_min } });
        }
        if (filters.salary_max) {
          where.AND.push({ salary_min: { lte: filters.salary_max } });
        }
      }

      const [jobs, total] = await Promise.all([
        this.db.job.findMany({
          where,
          include: {
            employer: {
              select: {
                id: true,
                email: true,
                profile: true
              }
            },
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.db.job.count({ where })
      ]);

      return {
        jobs,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new AppError(
        'Failed to fetch jobs',
        500,
        'JOB_FETCH_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Find job by ID with full details
   */
  async findById(id: string): Promise<Job | null> {
    try {
      return await this.db.job.findUnique({
        where: { id },
        include: {
          employer: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          applications: {
            include: {
              applicant: {
                select: {
                  id: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      });
    } catch (error) {
      throw new AppError(
        'Failed to fetch job',
        500,
        'JOB_FETCH_ERROR',
        { jobId: id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update job details
   */
  async update(id: string, data: UpdateJobData): Promise<Job> {
    try {
      const job = await this.db.job.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          employer: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      });

      return job;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND', { jobId: id });
      }
      throw new AppError(
        'Failed to update job',
        500,
        'JOB_UPDATE_ERROR',
        { jobId: id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Delete job (soft delete by setting status to CLOSED)
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.db.job.update({
        where: { id },
        data: {
          status: JobStatus.CLOSED,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND', { jobId: id });
      }
      throw new AppError(
        'Failed to delete job',
        500,
        'JOB_DELETE_ERROR',
        { jobId: id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get jobs by employer
   */
  async findByEmployer(employerId: string): Promise<Job[]> {
    try {
      return await this.db.job.findMany({
        where: { employerId },
        include: {
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new AppError(
        'Failed to fetch employer jobs',
        500,
        'JOB_FETCH_ERROR',
        { employerId, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Search jobs by title or description
   */
  async search(query: string, filters: JobFilters = {}): Promise<Job[]> {
    try {
      const where: any = {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { requirements: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      };

      // Apply additional filters
      if (filters.status) where.AND.push({ status: filters.status });
      if (filters.workType) where.AND.push({ workType: filters.workType });
      if (filters.location) where.AND.push({ location: { contains: filters.location, mode: 'insensitive' } });

      return await this.db.job.findMany({
        where,
        include: {
          employer: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Limit search results
      });
    } catch (error) {
      throw new AppError(
        'Failed to search jobs',
        500,
        'JOB_SEARCH_ERROR',
        { query, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}