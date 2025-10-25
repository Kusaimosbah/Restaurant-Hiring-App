import { JobService } from '../JobService';
import { JobRepository } from '@/lib/repositories/JobRepository';

// Mock the dependencies
jest.mock('@/lib/repositories/JobRepository');

const mockJobRepository = jest.mocked(JobRepository);

describe('JobService', () => {
  let jobService: JobService;
  let mockJobRepositoryInstance: jest.Mocked<JobRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJobRepositoryInstance = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByRestaurant: jest.fn(),
    } as jest.Mocked<JobRepository>;
    
    mockJobRepository.mockImplementation(() => mockJobRepositoryInstance);
    jobService = new JobService();
  });

  describe('getAllJobs', () => {
    it('should return all jobs', async () => {
      // Arrange
      const jobs = [
        {
          id: '1',
          title: 'Server',
          description: 'Full-time server position',
          requirements: 'Restaurant experience preferred',
          hourlyRate: 15.0,
          startDate: new Date(),
          endDate: new Date(),
          status: 'ACTIVE',
          maxWorkers: 2,
          restaurantId: 'restaurant123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockJobRepositoryInstance.findAll.mockResolvedValue(jobs);

      // Act
      const result = await jobService.getAllJobs();

      // Assert
      expect(result).toEqual(jobs);
      expect(mockJobRepositoryInstance.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching jobs', async () => {
      // Arrange
      const error = new Error('Database error');
      mockJobRepositoryInstance.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(jobService.getAllJobs()).rejects.toThrow('Database error');
    });
  });

  describe('getJobById', () => {
    it('should return a job by ID', async () => {
      // Arrange
      const jobId = '1';
      const job = {
        id: jobId,
        title: 'Server',
        description: 'Full-time server position',
        requirements: 'Restaurant experience preferred',
        hourlyRate: 15.0,
        startDate: new Date(),
        endDate: new Date(),
        status: 'ACTIVE',
        maxWorkers: 2,
        restaurantId: 'restaurant123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockJobRepositoryInstance.findById.mockResolvedValue(job);

      // Act
      const result = await jobService.getJobById(jobId);

      // Assert
      expect(result).toEqual(job);
      expect(mockJobRepositoryInstance.findById).toHaveBeenCalledWith(jobId);
    });

    it('should handle errors when fetching job by ID', async () => {
      // Arrange
      const jobId = '1';
      const error = new Error('Job not found');
      mockJobRepositoryInstance.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(jobService.getJobById(jobId)).rejects.toThrow('Job not found');
    });
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      // Arrange
      const jobData = {
        title: 'Server',
        description: 'Full-time server position',
        requirements: 'Restaurant experience preferred',
        hourlyRate: 15.0,
        startDate: new Date(),
        endDate: new Date(),
        maxWorkers: 2,
        restaurantId: 'restaurant123',
      };

      const createdJob = {
        id: '1',
        ...jobData,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockJobRepositoryInstance.create.mockResolvedValue(createdJob);

      // Act
      const result = await jobService.createJob(jobData);

      // Assert
      expect(result).toEqual(createdJob);
      expect(mockJobRepositoryInstance.create).toHaveBeenCalledWith(jobData);
    });

    it('should handle errors when creating job', async () => {
      // Arrange
      const jobData = {
        title: 'Server',
        description: 'Full-time server position',
        requirements: 'Restaurant experience preferred',
        hourlyRate: 15.0,
        startDate: new Date(),
        endDate: new Date(),
        maxWorkers: 2,
        restaurantId: 'restaurant123',
      };

      const error = new Error('Database error');
      mockJobRepositoryInstance.create.mockRejectedValue(error);

      // Act & Assert
      await expect(jobService.createJob(jobData)).rejects.toThrow('Database error');
    });
  });
});
