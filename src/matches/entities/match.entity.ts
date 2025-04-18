// src/matches/entities/match.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CONNECTED = 'connected'
}

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  founderA: Profile;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  founderB: Profile;

  @Column('decimal', { precision: 5, scale: 2 })
  overallScore: number;

  // Individual criteria scores
  @Column('decimal', { precision: 5, scale: 2 })
  industryScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  skillsScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  founderStatusScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  commitmentScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  financialScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  personalityScore: number;

  @Column('decimal', { precision: 5, scale: 2 })
  locationScore: number;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING
  })
  status: MatchStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}