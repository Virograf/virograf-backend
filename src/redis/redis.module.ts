// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}