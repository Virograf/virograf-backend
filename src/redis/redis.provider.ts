// src/redis/redis.provider.ts
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    });
  },
  inject: [ConfigService],
};