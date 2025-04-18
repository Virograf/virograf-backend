// src/auth/services/token-blacklist.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.provider';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private jwtService: JwtService,
  ) {}

  /**
   * Blacklist a token until its original expiration time
   */
  async blacklist(token: string): Promise<void> {
    try {
      // Extract the token without 'Bearer ' prefix if present
      const actualToken = token.startsWith('Bearer ')
        ? token.substring(7)
        : token;

      // Decode the token to get its expiration time
      const decoded = this.jwtService.decode(actualToken);
      
      if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      // Calculate how many seconds until token expiration
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      
      // Only blacklist if the token is not yet expired
      if (expiresIn > 0) {
        // Store in Redis with automatic expiration
        await this.redis.set(
          `blacklisted:${actualToken}`,
          'true',
          'EX',
          expiresIn
        );
      }
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      // Extract the token without 'Bearer ' prefix if present
      const actualToken = token.startsWith('Bearer ')
        ? token.substring(7)
        : token;
        
      const result = await this.redis.get(`blacklisted:${actualToken}`);
      return result === 'true';
    } catch (error) {
      console.error('Error checking if token is blacklisted:', error);
      // If there's an error checking, assume it's not blacklisted
      return false;
    }
  }
}