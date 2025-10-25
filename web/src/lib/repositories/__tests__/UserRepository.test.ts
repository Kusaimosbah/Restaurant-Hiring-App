import { UserRepository } from '../UserRepository';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors/AppError';
import { Role } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

const mockPrisma = jest.mocked(prisma);

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = new UserRepository();
  });

  describe('create', () => {
    const userData = {
      email: 'test@example.com',
      password: 'hashedpassword',
      role: Role.WORKER,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    };

    it('should successfully create a user', async () => {
      // Arrange
      const createdUser = {
        id: '123',
        email: 'test@example.com',
        role: Role.WORKER,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      mockPrisma.user.create.mockResolvedValue(createdUser as any);

      // Act
      const result = await userRepository.create(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });

    it('should throw AppError on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.user.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userRepository.create(userData)).rejects.toThrow(AppError);
      await expect(userRepository.create(userData)).rejects.toThrow('Failed to create user');
    });

    it('should handle Prisma unique constraint error', async () => {
      // Arrange
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] }
      };
      mockPrisma.user.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userRepository.create(userData)).rejects.toThrow(AppError);
      await expect(userRepository.create(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('findByEmail', () => {
    it('should successfully find user by email', async () => {
      // Arrange
      const email = 'test@example.com';
      const user = {
        id: '123',
        email,
        role: Role.WORKER
      };

      mockPrisma.user.findUnique.mockResolvedValue(user as any);

      // Act
      const result = await userRepository.findByEmail(email);

      // Assert
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw AppError on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userRepository.findByEmail('test@example.com')).rejects.toThrow(AppError);
    });
  });

  describe('findById', () => {
    it('should successfully find user by ID', async () => {
      // Arrange
      const userId = '123';
      const user = {
        id: userId,
        email: 'test@example.com',
        role: Role.WORKER
      };

      mockPrisma.user.findUnique.mockResolvedValue(user as any);

      // Act
      const result = await userRepository.findById(userId);

      // Assert
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userRepository.findById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw AppError on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userRepository.findById('123')).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    const userId = '123';
    const updateData = {
      profile: {
        update: {
          firstName: 'Jane'
        }
      }
    };

    it('should successfully update user', async () => {
      // Arrange
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        profile: {
          firstName: 'Jane',
          lastName: 'Doe'
        }
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser as any);

      // Act
      const result = await userRepository.update(userId, updateData);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });

    it('should throw AppError when user not found', async () => {
      // Arrange
      const prismaError = { code: 'P2025' };
      mockPrisma.user.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userRepository.update(userId, updateData)).rejects.toThrow(AppError);
      await expect(userRepository.update(userId, updateData)).rejects.toThrow('User not found');
    });

    it('should throw AppError on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.user.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userRepository.update(userId, updateData)).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    const userId = '123';

    it('should successfully delete user', async () => {
      // Arrange
      mockPrisma.user.delete.mockResolvedValue({ id: userId } as any);

      // Act
      const result = await userRepository.delete(userId);

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it('should throw AppError when user not found', async () => {
      // Arrange
      const prismaError = { code: 'P2025' };
      mockPrisma.user.delete.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(userRepository.delete(userId)).rejects.toThrow(AppError);
      await expect(userRepository.delete(userId)).rejects.toThrow('User not found');
    });

    it('should throw AppError on database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.user.delete.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userRepository.delete(userId)).rejects.toThrow(AppError);
    });
  });
});