// src/matches/dto/update-match-status.dto.ts
import { IsEnum } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

export class UpdateMatchStatusDto {
  @IsEnum(MatchStatus, { message: 'Invalid match status' })
  status: MatchStatus;
}