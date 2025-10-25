import { User, Role } from '@prisma/client';
import { BaseRepository, FindOptions, PaginatedResult } from './BaseRepository';

export type CreateUserData = {
  email: string;
  password: string;
  role: Role;
  name: string;
  phone?: string;
  emailVerifiedAt?: Date;
};

export type UpdateUserData = Partial<Omit<CreateUserData, 'password'>> & {
  password?: string;
};

/**
 * User Repository - handles all user data access operations
 */
export class UserRepository extends BaseRepository<User> {
  
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { id }
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.db.user.findUnique({
      where: { email }
    });
  }

  /**
   * Find multiple users with pagination
   */
  async findMany(options: FindOptions = {}): Promise<User[]> {
    const { page = 1, limit = 10, where, orderBy, include } = options;
    
    return await this.db.user.findMany({
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include
    });
  }

  /**
   * Find users with pagination result
   */
  async findManyPaginated(options: FindOptions = {}): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, where } = options;
    
    const [users, total] = await Promise.all([
      this.findMany(options),
      this.count(where)
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      hasMore: (page * limit) < total
    };
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    return await this.db.user.create({
      data: userData
    });
  }

  /**
   * Update user by ID
   */
  async update(id: string, userData: UpdateUserData): Promise<User> {
    return await this.db.user.update({
      where: { id },
      data: userData
    });
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id }
    });
  }

  /**
   * Count users
   */
  async count(filters?: any): Promise<number> {
    return await this.db.user.count({
      where: filters
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: Role, options: FindOptions = {}): Promise<User[]> {
    return await this.findMany({
      ...options,
      where: { role, ...options.where }
    });
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.db.user.count({
      where: { email }
    });
    return count > 0;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return await this.db.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
  }

  /**
   * Mark email as verified
   */
  async verifyEmail(id: string): Promise<User> {
    return await this.db.user.update({
      where: { id },
      data: { 
        emailVerified: new Date(),
        updatedAt: new Date()
      }
    });
  }
}