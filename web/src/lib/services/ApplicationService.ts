import { Application, ApplicationStatus } from '@prisma/client';
import { ApplicationRepository, CreateApplicationData, UpdateApplicationData, ApplicationFilters } from '@/lib/repositories/ApplicationRepository';
import { JobRepository } from '@/lib/repositories/JobRepository';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { ServiceResult, BusinessError } from '@/lib/domain/types';

/**
 * Application Service - Business logic for job applications
 * Coordinates between repositories and implements application-related business rules
 */
export class ApplicationService {
  private applicationRepository: ApplicationRepository;
  private jobRepository: JobRepository;
  private userRepository: UserRepository;

  constructor() {
    this.applicationRepository = new ApplicationRepository();
    this.jobRepository = new JobRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Submit a job application with validation
   */
  async submitApplication(applicationData: CreateApplicationData): Promise<ServiceResult<Application>> {
    try {
      // Validate application data
      const validation = await this.validateApplicationData(applicationData);
      if (!validation.success) {
        return validation;
      }

      // Check if job exists and is active
      const job = await this.jobRepository.findById(applicationData.jobId);
      if (!job) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found'
          }
        };
      }

      if (job.status !== 'ACTIVE') {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_ACTIVE',
            message: 'This job is no longer accepting applications'
          }
        };
      }

      // Check if user has already applied
      const hasApplied = await this.applicationRepository.hasUserApplied(
        applicationData.jobId,
        applicationData.applicantId
      );

      if (hasApplied) {
        return {
          success: false,
          error: {
            code: 'ALREADY_APPLIED',
            message: 'You have already applied for this job'
          }
        };
      }

      // Verify applicant exists
      const applicant = await this.userRepository.findById(applicationData.applicantId);
      if (!applicant) {
        return {
          success: false,
          error: {
            code: 'APPLICANT_NOT_FOUND',
            message: 'Applicant not found'
          }
        };
      }

      // Create the application
      const application = await this.applicationRepository.create(applicationData);

      return {
        success: true,
        data: application
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPLICATION_SUBMIT_FAILED',
          message: 'Failed to submit application',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get applications with filtering and pagination
   */
  async getApplications(
    filters: ApplicationFilters = {},
    page = 1,
    limit = 10
  ): Promise<ServiceResult<{ applications: Application[]; total: number; pages: number }>> {
    try {
      const result = await this.applicationRepository.findMany(filters, page, limit);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPLICATIONS_FETCH_FAILED',
          message: 'Failed to fetch applications',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string): Promise<ServiceResult<Application>> {
    try {
      const application = await this.applicationRepository.findById(applicationId);

      if (!application) {
        return {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Application not found'
          }
        };
      }

      return {
        success: true,
        data: application
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPLICATION_FETCH_FAILED',
          message: 'Failed to fetch application',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Update application status (for employers)
   */
  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    employerId: string,
    reviewNotes?: string
  ): Promise<ServiceResult<Application>> {
    try {
      // Get application and verify employer can update it
      const application = await this.applicationRepository.findById(applicationId);
      
      if (!application) {
        return {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Application not found'
          }
        };
      }

      if (application.job.employerId !== employerId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to update this application'
          }
        };
      }

      // Update application status
      const updatedApplication = await this.applicationRepository.update(applicationId, {
        status,
        reviewNotes
      });

      return {
        success: true,
        data: updatedApplication
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPLICATION_UPDATE_FAILED',
          message: 'Failed to update application status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Update application details (for applicants)
   */
  async updateApplication(
    applicationId: string,
    updateData: Omit<UpdateApplicationData, 'status' | 'reviewNotes'>,
    applicantId: string
  ): Promise<ServiceResult<Application>> {
    try {
      // Get application and verify applicant can update it
      const application = await this.applicationRepository.findById(applicationId);
      
      if (!application) {
        return {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Application not found'
          }
        };
      }

      if (application.applicantId !== applicantId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to update this application'
          }
        };
      }

      // Check if application can be updated (only pending applications)
      if (application.status !== ApplicationStatus.PENDING) {
        return {
          success: false,
          error: {
            code: 'APPLICATION_NOT_EDITABLE',
            message: 'Application cannot be updated after it has been reviewed'
          }
        };
      }

      const updatedApplication = await this.applicationRepository.update(applicationId, updateData);

      return {
        success: true,
        data: updatedApplication
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPLICATION_UPDATE_FAILED',
          message: 'Failed to update application',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Withdraw application (for applicants)
   */
  async withdrawApplication(applicationId: string, applicantId: string): Promise<ServiceResult<boolean>> {
    try {
      // Get application and verify ownership
      const application = await this.applicationRepository.findById(applicationId);
      
      if (!application) {
        return {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Application not found'
          }
        };
      }

      if (application.applicantId !== applicantId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to withdraw this application'
          }
        };
      }

      // Check if application can be withdrawn
      if (application.status === ApplicationStatus.ACCEPTED || application.status === ApplicationStatus.REJECTED) {
        return {
          success: false,
          error: {
            code: 'APPLICATION_NOT_WITHDRAWABLE',
            message: 'Cannot withdraw application that has been accepted or rejected'
          }
        };
      }

      const result = await this.applicationRepository.delete(applicationId);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPLICATION_WITHDRAW_FAILED',
          message: 'Failed to withdraw application',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get applications for a specific job
   */
  async getJobApplications(jobId: string, employerId: string): Promise<ServiceResult<Application[]>> {
    try {
      // Verify employer owns the job
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

      if (job.employerId !== employerId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to view applications for this job'
          }
        };
      }

      const applications = await this.applicationRepository.findByJobId(jobId);

      return {
        success: true,
        data: applications
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'JOB_APPLICATIONS_FETCH_FAILED',
          message: 'Failed to fetch job applications',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get user's applications
   */
  async getUserApplications(applicantId: string): Promise<ServiceResult<Application[]>> {
    try {
      const applications = await this.applicationRepository.findByApplicantId(applicantId);

      return {
        success: true,
        data: applications
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'USER_APPLICATIONS_FETCH_FAILED',
          message: 'Failed to fetch user applications',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(employerId?: string, applicantId?: string): Promise<ServiceResult<{
    total: number;
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  }>> {
    try {
      const stats = await this.applicationRepository.getApplicationStats(employerId, applicantId);

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPLICATION_STATS_FAILED',
          message: 'Failed to fetch application statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Validate application data
   */
  private async validateApplicationData(applicationData: CreateApplicationData): Promise<ServiceResult<boolean>> {
    const errors: BusinessError[] = [];

    if (!applicationData.jobId || applicationData.jobId.trim().length === 0) {
      errors.push({
        code: 'INVALID_JOB_ID',
        message: 'Job ID is required',
        field: 'jobId'
      });
    }

    if (!applicationData.applicantId || applicationData.applicantId.trim().length === 0) {
      errors.push({
        code: 'INVALID_APPLICANT_ID',
        message: 'Applicant ID is required',
        field: 'applicantId'
      });
    }

    if (applicationData.coverLetter && applicationData.coverLetter.trim().length > 2000) {
      errors.push({
        code: 'COVER_LETTER_TOO_LONG',
        message: 'Cover letter must not exceed 2000 characters',
        field: 'coverLetter'
      });
    }

    if (applicationData.expectedSalary && applicationData.expectedSalary < 0) {
      errors.push({
        code: 'INVALID_EXPECTED_SALARY',
        message: 'Expected salary must be a positive number',
        field: 'expectedSalary'
      });
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