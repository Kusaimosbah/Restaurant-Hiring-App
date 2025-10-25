import { UserService } from '../UserService';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock the dependencies
jest.mock('@/lib/repositories/UserRepository');
jest.mock('bcryptjs');

const mockUserRepository = jest.mocked(UserRepository);
const mockBcrypt = jest.mocked(bcrypt);

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepositoryInstance: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockUserRepositoryInstance = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    // Mock the constructor to return our mock instance
    mockUserRepository.mockImplementation(() => mockUserRepositoryInstance);
    
    userService = new UserService();
  });

  describe('registerUser', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'ValidPass123',
      role: Role.WORKER,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    };

    it('should successfully register a new user', async () => {
      // Arrange
      const hashedPassword = 'hashedpassword123';
      const createdUser = {
        id: '123',
        email: 'test@example.com',
        role: Role.WORKER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepositoryInstance.create.mockResolvedValue(createdUser as any);

      // Act
      const result = await userService.registerUser(validUserData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdUser);
      expect(mockUserRepositoryInstance.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('ValidPass123', 12);
      expect(mockUserRepositoryInstance.create).toHaveBeenCalledWith({
        ...validUserData,
        password: hashedPassword
      });
    });

    it('should return error if user already exists', async () => {
      // Arrange
      const existingUser = { id: '123', email: 'test@example.com' };
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(existingUser as any);

      // Act
      const result = await userService.registerUser(validUserData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_EXISTS');
      expect(result.error?.message).toBe('A user with this email already exists');
      expect(mockUserRepositoryInstance.create).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidUserData = {
        ...validUserData,
        email: 'invalid-email'
      };

      // Act
      const result = await userService.registerUser(invalidUserData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_EMAIL');
      expect(result.error?.field).toBe('email');
    });

    it('should validate password strength - too short', async () => {
      // Arrange
      const weakPasswordData = {
        ...validUserData,
        password: 'weak'
      };

      // Act
      const result = await userService.registerUser(weakPasswordData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEAK_PASSWORD');
      expect(result.error?.field).toBe('password');
      expect(result.error?.message).toBe('Password must be at least 8 characters long');
    });

    it('should validate password strength - missing requirements', async () => {
      // Arrange
      const weakPasswordData = {
        ...validUserData,
        password: 'onlylowercase'
      };

      // Act
      const result = await userService.registerUser(weakPasswordData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEAK_PASSWORD');
      expect(result.error?.field).toBe('password');
      expect(result.error?.message).toBe('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    });

    it('should validate role', async () => {
      // Arrange
      const invalidRoleData = {
        ...validUserData,
        role: 'INVALID_ROLE' as Role
      };

      // Act
      const result = await userService.registerUser(invalidRoleData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ROLE');
      expect(result.error?.field).toBe('role');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      mockUserRepositoryInstance.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await userService.registerUser(validUserData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('REGISTRATION_FAILED');
    });
  });

  describe('getUserProfile', () => {
    it('should successfully get user profile', async () => {
      // Arrange
      const userId = '123';
      const user = {
        id: '123',
        email: 'test@example.com',
        role: Role.WORKER,
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepositoryInstance.findById.mockResolvedValue(user as any);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '123',
        email: 'test@example.com',
        role: Role.WORKER,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledWith(userId);
    });

    it('should return error if user not found', async () => {
      // Arrange
      const userId = '123';
      mockUserRepositoryInstance.findById.mockResolvedValue(null);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = '123';
      mockUserRepositoryInstance.findById.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROFILE_FETCH_FAILED');
    });
  });
});