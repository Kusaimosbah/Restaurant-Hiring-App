import { User, Role } from '@prisma/client';
import { UserRepository, CreateUserData, UpdateUserData } from '@/lib/repositories/UserRepository';
import { ServiceResult, BusinessError } from '@/lib/domain/types';
import bcrypt from 'bcryptjs';

/**
 * Enhanced User Service - Business logic for user management
 * Coordinates between repositories and implements business rules
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user with validation and business rules
   */
  async registerUser(userData: CreateUserData): Promise<ServiceResult<User>> {
    try {
      // Validate business rules
      const validation = await this.validateUserRegistration(userData);
      if (!validation.success) {
        return validation;
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this email already exists',
            field: 'email'
          }
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = await this.userRepository.create({
        ...userData,
        password: hashedPassword
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword as User
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get user profile with business logic
   */
  async getUserProfile(userId: string): Promise<ServiceResult<User>> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        };
      }

      // Remove sensitive data
      const { password, ...userProfile } = user;

      return {
        success: true,
        data: userProfile as User
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to fetch user profile',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Validate user registration data
   */
  private async validateUserRegistration(userData: CreateUserData): Promise<ServiceResult<boolean>> {
    const errors: BusinessError[] = [];

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      errors.push({
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address',
        field: 'email'
      });
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.success) {
      errors.push(passwordValidation.error!);
    }

    // Validate required fields
    if (!userData.role || !Object.values(Role).includes(userData.role)) {
      errors.push({
        code: 'INVALID_ROLE',
        message: 'Please select a valid role',
        field: 'role'
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

  /**
   * Validate password strength
   */
  private validatePassword(password: string): ServiceResult<boolean> {
    if (!password || password.length < 8) {
      return {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
          field: 'password'
        }
      };
    }

    // Check for at least one uppercase, one lowercase, and one number
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpper || !hasLower || !hasNumber) {
      return {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          field: 'password'
        }
      };
    }

    return { success: true, data: true };
  }
}