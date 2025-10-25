import { Job, JobStatus, WorkType } from '@prisma/client';
import { JobRepository, CreateJobData, UpdateJobData, JobFilters } from '@/lib/repositories/JobRepository';
import { ServiceResult, BusinessError } from '@/lib/domain/types';

/**
 * Job Service - Business logic for job management
 * Coordinates between repositories and implements job-related business rules
 */
export class JobService {
  private jobRepository: JobRepository;

  constructor() {
    this.jobRepository = new JobRepository();
  }

  /**
   * Create a new job posting with validation
   */
  async createJob(jobData: CreateJobData): Promise<ServiceResult<Job>> {
    try {
      // Validate job data
      const validation = await this.validateJobData(jobData);
      if (!validation.success) {
        return validation;
      }

      // Create the job
      const job = await this.jobRepository.create(jobData);

      return {
        success: true,
        data: job
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_CREATE_FAILED',
          message: 'Failed to create job posting',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get jobs with filtering and pagination
   */
  async getJobs(
    filters: JobFilters = {},
    page = 1,
    limit = 10
  ): Promise<ServiceResult<{ jobs: Job[]; total: number; pages: number }>> {
    try {
      const result = await this.jobRepository.findMany(filters, page, limit);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOBS_FETCH_FAILED',
          message: 'Failed to fetch jobs',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get job by ID with full details
   */
  async getJobById(jobId: string): Promise<ServiceResult<Job>> {
    try {
      const job = await this.jobRepository.findById(jobId);

      if (!job) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found'
          }
        };
      }

      return {
        success: true,
        data: job
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_FETCH_FAILED',
          message: 'Failed to fetch job',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Update job posting
   */
  async updateJob(jobId: string, updateData: UpdateJobData, employerId: string): Promise<ServiceResult<Job>> {
    try {
      // First verify the job exists and belongs to the employer
      const existingJob = await this.jobRepository.findById(jobId);
      
      if (!existingJob) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found'
          }
        };
      }

      if (existingJob.employerId !== employerId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to update this job'
          }
        };
      }

      // Validate update data if provided
      if (Object.keys(updateData).some(key => ['title', 'description', 'salary_min', 'salary_max'].includes(key))) {
        const validation = await this.validateJobData(updateData as CreateJobData, true);
        if (!validation.success) {
          return validation;
        }
      }

      const updatedJob = await this.jobRepository.update(jobId, updateData);

      return {
        success: true,
        data: updatedJob
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_UPDATE_FAILED',
          message: 'Failed to update job',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Delete job (close job posting)
   */
  async deleteJob(jobId: string, employerId: string): Promise<ServiceResult<boolean>> {
    try {
      // Verify job ownership
      const existingJob = await this.jobRepository.findById(jobId);
      
      if (!existingJob) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found'
          }
        };
      }

      if (existingJob.employerId !== employerId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to delete this job'
          }
        };
      }

      const result = await this.jobRepository.delete(jobId);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_DELETE_FAILED',
          message: 'Failed to delete job',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get jobs by employer
   */
  async getEmployerJobs(employerId: string): Promise<ServiceResult<Job[]>> {
    try {
      const jobs = await this.jobRepository.findByEmployer(employerId);

      return {
        success: true,
        data: jobs
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EMPLOYER_JOBS_FETCH_FAILED',
          message: 'Failed to fetch employer jobs',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Search jobs by query
   */
  async searchJobs(query: string, filters: JobFilters = {}): Promise<ServiceResult<Job[]>> {
    try {
      if (!query.trim()) {
        return {
          success: false,
          error: {
            code: 'INVALID_SEARCH_QUERY',
            message: 'Search query cannot be empty'
          }
        };
      }

      const jobs = await this.jobRepository.search(query, filters);

      return {
        success: true,
        data: jobs
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_SEARCH_FAILED',
          message: 'Failed to search jobs',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Validate job data
   */
  private async validateJobData(jobData: Partial<CreateJobData>, isUpdate = false): Promise<ServiceResult<boolean>> {
    const errors: BusinessError[] = [];

    if (!isUpdate || jobData.title !== undefined) {
      if (!jobData.title || jobData.title.trim().length < 3) {
        errors.push({
          code: 'INVALID_TITLE',
          message: 'Job title must be at least 3 characters long',
          field: 'title'
        });
      }
    }

    if (!isUpdate || jobData.description !== undefined) {
      if (!jobData.description || jobData.description.trim().length < 50) {
        errors.push({
          code: 'INVALID_DESCRIPTION',
          message: 'Job description must be at least 50 characters long',
          field: 'description'
        });
      }
    }

    if (!isUpdate || (jobData.salary_min !== undefined && jobData.salary_max !== undefined)) {
      if (jobData.salary_min && jobData.salary_max && jobData.salary_min > jobData.salary_max) {
        errors.push({
          code: 'INVALID_SALARY_RANGE',
          message: 'Minimum salary cannot be greater than maximum salary',
          field: 'salary_min'
        });
      }

      if (jobData.salary_min && jobData.salary_min < 0) {
        errors.push({
          code: 'INVALID_SALARY',
          message: 'Salary must be a positive number',
          field: 'salary_min'
        });
      }
    }

    if (!isUpdate || jobData.workType !== undefined) {
      if (jobData.workType && !Object.values(WorkType).includes(jobData.workType)) {
        errors.push({
          code: 'INVALID_WORK_TYPE',
          message: 'Invalid work type',
          field: 'workType'
        });
      }
    }

    if (!isUpdate || jobData.location !== undefined) {
      if (!jobData.location || jobData.location.trim().length < 2) {
        errors.push({
          code: 'INVALID_LOCATION',
          message: 'Location must be at least 2 characters long',
          field: 'location'
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors[0] // Return first error
      };
    }

    return { success: true, data: true };
  }
}