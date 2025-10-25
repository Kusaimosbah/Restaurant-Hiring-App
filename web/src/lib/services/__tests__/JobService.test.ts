import { JobService } from '../JobService';
import { JobRepository } from '@/lib/repositories/JobRepository';
import { JobStatus, WorkType } from '@prisma/client';

// Mock the dependencies
jest.mock('@/lib/repositories/JobRepository');

const mockJobRepository = jest.mocked(JobRepository);

describe('JobService', () => {
  let jobService: JobService;
  let mockJobRepositoryInstance: jest.Mocked<JobRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJobRepositoryInstance = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmployer: jest.fn(),
      search: jest.fn()
    } as any;

    mockJobRepository.mockImplementation(() => mockJobRepositoryInstance);
    jobService = new JobService();
  });

  describe('createJob', () => {
    const validJobData = {
      title: 'Software Engineer',
      description: 'A great opportunity to work with our team on exciting projects. We are looking for someone with experience in React and Node.js.',
      requirements: 'Experience with React, Node.js',
      salary_min: 50000,
      salary_max: 80000,
      location: 'New York, NY',
      workType: WorkType.FULL_TIME,
      department: 'Engineering',
      employerId: 'employer123',
      experience_level: 'Mid Level',
      skills_required: ['React', 'Node.js'],
      benefits: ['Health Insurance', 'Paid Time Off']
    };

    it('should successfully create a new job', async () => {
      // Arrange
      const createdJob = {
        id: 'job123',
        ...validJobData,
        status: JobStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockJobRepositoryInstance.create.mockResolvedValue(createdJob as any);

      // Act
      const result = await jobService.createJob(validJobData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdJob);
      expect(mockJobRepositoryInstance.create).toHaveBeenCalledWith(validJobData);
    });

    it('should validate job title length', async () => {
      // Arrange
      const invalidJobData = {
        ...validJobData,
        title: 'AB' // Too short
      };

      // Act
      const result = await jobService.createJob(invalidJobData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TITLE');
      expect(result.error?.field).toBe('title');
    });

    it('should validate job description length', async () => {
      // Arrange
      const invalidJobData = {
        ...validJobData,
        description: 'Too short' // Less than 50 characters
      };

      // Act
      const result = await jobService.createJob(invalidJobData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_DESCRIPTION');
      expect(result.error?.field).toBe('description');
    });

    it('should validate salary range', async () => {
      // Arrange
      const invalidJobData = {
        ...validJobData,
        salary_min: 80000,
        salary_max: 50000 // Min greater than max
      };

      // Act
      const result = await jobService.createJob(invalidJobData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SALARY_RANGE');
      expect(result.error?.field).toBe('salary_min');
    });

    it('should validate negative salary', async () => {
      // Arrange
      const invalidJobData = {
        ...validJobData,
        salary_min: -1000
      };

      // Act
      const result = await jobService.createJob(invalidJobData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SALARY');
      expect(result.error?.field).toBe('salary_min');
    });

    it('should validate work type', async () => {
      // Arrange
      const invalidJobData = {
        ...validJobData,
        workType: 'INVALID_TYPE' as WorkType
      };

      // Act
      const result = await jobService.createJob(invalidJobData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_WORK_TYPE');
      expect(result.error?.field).toBe('workType');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockJobRepositoryInstance.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await jobService.createJob(validJobData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('JOB_CREATE_FAILED');
    });
  });

  describe('getJobs', () => {
    it('should successfully get jobs with pagination', async () => {
      // Arrange
      const mockResult = {
        jobs: [
          {
            id: 'job1',
            title: 'Job 1',
            status: JobStatus.ACTIVE
          },
          {
            id: 'job2',
            title: 'Job 2',
            status: JobStatus.ACTIVE
          }
        ],
        total: 2,
        pages: 1
      };

      mockJobRepositoryInstance.findMany.mockResolvedValue(mockResult as any);

      // Act
      const result = await jobService.getJobs({}, 1, 10);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockJobRepositoryInstance.findMany).toHaveBeenCalledWith({}, 1, 10);
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockJobRepositoryInstance.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await jobService.getJobs();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('JOBS_FETCH_FAILED');
    });
  });

  describe('updateJob', () => {
    const employerId = 'employer123';
    const jobId = 'job123';
    const updateData = {
      title: 'Updated Job Title',
      description: 'This is an updated description that is longer than fifty characters to meet validation requirements.'
    };

    it('should successfully update job when user is authorized', async () => {
      // Arrange
      const existingJob = {
        id: jobId,
        employerId,
        title: 'Original Title'
      };

      const updatedJob = {
        ...existingJob,
        ...updateData
      };

      mockJobRepositoryInstance.findById.mockResolvedValue(existingJob as any);
      mockJobRepositoryInstance.update.mockResolvedValue(updatedJob as any);

      // Act
      const result = await jobService.updateJob(jobId, updateData, employerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedJob);
      expect(mockJobRepositoryInstance.update).toHaveBeenCalledWith(jobId, updateData);
    });

    it('should return error when job not found', async () => {
      // Arrange
      mockJobRepositoryInstance.findById.mockResolvedValue(null);

      // Act
      const result = await jobService.updateJob(jobId, updateData, employerId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('JOB_NOT_FOUND');
    });

    it('should return error when user is not authorized', async () => {
      // Arrange
      const existingJob = {
        id: jobId,
        employerId: 'different-employer',
        title: 'Original Title'
      };

      mockJobRepositoryInstance.findById.mockResolvedValue(existingJob as any);

      // Act
      const result = await jobService.updateJob(jobId, updateData, employerId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('searchJobs', () => {
    it('should successfully search jobs', async () => {
      // Arrange
      const query = 'software engineer';
      const searchResults = [
        { id: 'job1', title: 'Software Engineer' },
        { id: 'job2', title: 'Senior Software Engineer' }
      ];

      mockJobRepositoryInstance.search.mockResolvedValue(searchResults as any);

      // Act
      const result = await jobService.searchJobs(query);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(searchResults);
      expect(mockJobRepositoryInstance.search).toHaveBeenCalledWith(query, {});
    });

    it('should return error for empty query', async () => {
      // Act
      const result = await jobService.searchJobs('   ');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SEARCH_QUERY');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockJobRepositoryInstance.search.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await jobService.searchJobs('software');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('JOB_SEARCH_FAILED');
    });
  });
});