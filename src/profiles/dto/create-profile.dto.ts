import { IsString, IsEnum, IsArray, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { INDUSTRIES, FOUNDER_STATUSES, COMMITMENT_LEVELS, FINANCIAL_CONTRIBUTIONS, LOCATIONS, PERSONALITY_TRAITS, SKILL_CATEGORIES } from '../../constants';

export class CreateProfileDto {
  @IsEnum(FOUNDER_STATUSES, { message: 'Invalid founder status' })
  founderStatus: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsEnum(INDUSTRIES, { message: 'Invalid industry' })
  industry: string;

  @IsString()
  @IsNotEmpty()
  currentOccupation: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  yearsExperience: number;

  @IsEnum(COMMITMENT_LEVELS, { message: 'Invalid commitment level' })
  commitmentLevel: string;

  @IsEnum(FINANCIAL_CONTRIBUTIONS, { message: 'Invalid financial contribution' })
  financialContribution: string;

  @IsArray()
  @IsString({ each: true })
  personalityTraits: string[];

  @IsEnum(LOCATIONS, { message: 'Invalid location' })
  location: string;

  @IsArray()
  @IsString({ each: true })
  preferredSkills: string[];

  @IsEnum(FOUNDER_STATUSES, { message: 'Invalid preferred founder type' })
  preferredFounderType: string;

  @IsEnum(INDUSTRIES, { message: 'Invalid preferred industry' })
  preferredIndustry: string;

  @IsEnum(COMMITMENT_LEVELS, { message: 'Invalid preferred commitment level' })
  preferredCommitmentLevel: string;

  @IsEnum(FINANCIAL_CONTRIBUTIONS, { message: 'Invalid preferred financial contribution' })
  preferredFinancial: string;

  @IsArray()
  @IsString({ each: true })
  preferredPersonalityTraits: string[];

  @IsEnum(LOCATIONS, { message: 'Invalid preferred location' })
  preferredLocation: string;
}