import { Application, ApplicationStatus } from '@prisma/client';
import { BaseRepository } from '@/lib/repositories/BaseRepository';
import { AppError } from '@/lib/errors/AppError';

export interface CreateApplicationData {
  jobId: string;
  applicantId: string;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
}

export interface UpdateApplicationData {
  status?: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  reviewNotes?: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  jobId?: string;
  applicantId?: string;
  employerId?: string;
}

/**
 * Application Repository - Data Access Layer for Job Applications
 * Handles all database operations for application-related data
 */
export class ApplicationRepository extends BaseRepository<Application> {
  protected tableName = 'application';

  /**
   * Create a new job application
   */
  async create(data: CreateApplicationData): Promise<Application> {
    try {
      const application = await this.db.application.create({
        data: {
          ...data,
          status: ApplicationStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              employerId: true,
              employer: {
                select: {
                  id: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          applicant: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        }
      });

      return application;
    } catch (error) {
      throw new AppError(
        'Failed to create application',
        500,
        'APPLICATION_CREATE_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Find applications with filters and pagination
   */
  async findMany(
    filters: ApplicationFilters = {},
    page = 1,
    limit = 10
  ): Promise<{ applications: Application[]; total: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};

      // Apply filters
      if (filters.status) where.status = filters.status;
      if (filters.jobId) where.jobId = filters.jobId;
      if (filters.applicantId) where.applicantId = filters.applicantId;
      
      // Filter by employer (through job)
      if (filters.employerId) {
        where.job = { employerId: filters.employerId };
      }

      const [applications, total] = await Promise.all([
        this.db.application.findMany({
          where,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                department: true,
                location: true,
                salary_min: true,
                salary_max: true,
                employerId: true,
                employer: {
                  select: {
                    id: true,
                    email: true,
                    profile: true
                  }
                }
              }
            },
            applicant: {
              select: {
                id: true,
                email: true,
                profile: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.db.application.count({ where })
      ]);

      return {
        applications,
        total,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new AppError(
        'Failed to fetch applications',
        500,
        'APPLICATION_FETCH_ERROR',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Find application by ID with full details
   */
  async findById(id: string): Promise<Application | null> {
    try {
      return await this.db.application.findUnique({
        where: { id },
        include: {
          job: {
            include: {
              employer: {
                select: {
                  id: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          applicant: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        }
      });
    } catch (error) {
      throw new AppError(
        'Failed to fetch application',
        500,
        'APPLICATION_FETCH_ERROR',
        { applicationId: id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update application
   */
  async update(id: string, data: UpdateApplicationData): Promise<Application> {
    try {
      const application = await this.db.application.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              employerId: true,
              employer: {
                select: {
                  id: true,
                  email: true,
                  profile: true
                }
              }
            }
          },
          applicant: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        }
      });

      return application;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND', { applicationId: id });
      }
      throw new AppError(
        'Failed to update application',
        500,
        'APPLICATION_UPDATE_ERROR',
        { applicationId: id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Delete application
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.db.application.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new AppError('Application not found', 404, 'APPLICATION_NOT_FOUND', { applicationId: id });
      }
      throw new AppError(
        'Failed to delete application',
        500,
        'APPLICATION_DELETE_ERROR',
        { applicationId: id, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Check if user has already applied for a job
   */
  async hasUserApplied(jobId: string, applicantId: string): Promise<boolean> {
    try {
      const application = await this.db.application.findFirst({
        where: {
          jobId,
          applicantId
        }
      });

      return !!application;
    } catch (error) {
      throw new AppError(
        'Failed to check application status',
        500,
        'APPLICATION_CHECK_ERROR',
        { jobId, applicantId, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get applications by job ID
   */
  async findByJobId(jobId: string): Promise<Application[]> {
    try {
      return await this.db.application.findMany({
        where: { jobId },
        include: {
          applicant: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new AppError(
        'Failed to fetch job applications',
        500,
        'APPLICATION_FETCH_ERROR',
        { jobId, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get applications by applicant ID
   */
  async findByApplicantId(applicantId: string): Promise<Application[]> {
    try {
      return await this.db.application.findMany({
        where: { applicantId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              department: true,
              location: true,
              salary_min: true,
              salary_max: true,
              status: true,
              employer: {
                select: {
                  id: true,
                  email: true,
                  profile: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new AppError(
        'Failed to fetch user applications',
        500,
        'APPLICATION_FETCH_ERROR',
        { applicantId, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get applications statistics
   */
  async getApplicationStats(employerId?: string, applicantId?: string): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  }> {
    try {
      const where: any = {};
      
      if (employerId) {
        where.job = { employerId };
      }
      
      if (applicantId) {
        where.applicantId = applicantId;
      }

      const [total, pending, reviewed, accepted, rejected] = await Promise.all([
        this.db.application.count({ where }),
        this.db.application.count({ where: { ...where, status: ApplicationStatus.PENDING } }),
        this.db.application.count({ where: { ...where, status: ApplicationStatus.REVIEWED } }),
        this.db.application.count({ where: { ...where, status: ApplicationStatus.ACCEPTED } }),
        this.db.application.count({ where: { ...where, status: ApplicationStatus.REJECTED } })
      ]);

      return {
        total,
        pending,
        reviewed,
        accepted,
        rejected
      };
    } catch (error) {
      throw new AppError(
        'Failed to fetch application statistics',
        500,
        'APPLICATION_STATS_ERROR',
        { employerId, applicantId, originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}