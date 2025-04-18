import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { INDUSTRIES, FOUNDER_STATUSES, COMMITMENT_LEVELS, FINANCIAL_CONTRIBUTIONS, LOCATIONS} from '../../constants';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  // Founder Information
  @Column({
    type: 'enum',
    enum: FOUNDER_STATUSES
  })
  founderStatus: string;

  @Column('simple-array')
  skills: string[];

  @Column({
    type: 'enum',
    enum: INDUSTRIES
  })
  industry: string;

  @Column()
  currentOccupation: string;

  @Column()
  yearsExperience: number;

  @Column({
    type: 'enum',
    enum: COMMITMENT_LEVELS
  })
  commitmentLevel: string;

  @Column({
    type: 'enum',
    enum: FINANCIAL_CONTRIBUTIONS
  })
  financialContribution: string;

  @Column('simple-array')
  personalityTraits: string[];

  @Column({
    type: 'enum',
    enum: LOCATIONS
  })
  location: string;

  // Co-founder Preferences
  @Column('simple-array')
  preferredSkills: string[];

  @Column({
    type: 'enum',
    enum: FOUNDER_STATUSES
  })
  preferredFounderType: string;

  @Column({
    type: 'enum',
    enum: INDUSTRIES
  })
  preferredIndustry: string;

  @Column({
    type: 'enum',
    enum: COMMITMENT_LEVELS
  })
  preferredCommitmentLevel: string;

  @Column({
    type: 'enum',
    enum: FINANCIAL_CONTRIBUTIONS
  })
  preferredFinancial: string;

  @Column('simple-array')
  preferredPersonalityTraits: string[];

  @Column({
    type: 'enum',
    enum: LOCATIONS
  })
  preferredLocation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}