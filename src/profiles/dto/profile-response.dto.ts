import { Profile } from '../entities/profile.entity';

export class ProfileResponseDto {
  id: number;
  userId: number;
  founderStatus: string;
  skills: string[];
  industry: string;
  currentOccupation: string;
  yearsExperience: number;
  commitmentLevel: string;
  financialContribution: string;
  personalityTraits: string[];
  location: string;
  preferredSkills: string[];
  preferredFounderType: string;
  preferredIndustry: string;
  preferredCommitmentLevel: string;
  preferredFinancial: string;
  preferredPersonalityTraits: string[];
  preferredLocation: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(profile: Profile) {
    this.id = profile.id;
    this.userId = profile.user.id;
    this.founderStatus = profile.founderStatus;
    this.skills = profile.skills;
    this.industry = profile.industry;
    this.currentOccupation = profile.currentOccupation;
    this.yearsExperience = profile.yearsExperience;
    this.commitmentLevel = profile.commitmentLevel;
    this.financialContribution = profile.financialContribution;
    this.personalityTraits = profile.personalityTraits;
    this.location = profile.location;
    this.preferredSkills = profile.preferredSkills;
    this.preferredFounderType = profile.preferredFounderType;
    this.preferredIndustry = profile.preferredIndustry;
    this.preferredCommitmentLevel = profile.preferredCommitmentLevel;
    this.preferredFinancial = profile.preferredFinancial;
    this.preferredPersonalityTraits = profile.preferredPersonalityTraits;
    this.preferredLocation = profile.preferredLocation;
    this.createdAt = profile.createdAt;
    this.updatedAt = profile.updatedAt;
  }
}