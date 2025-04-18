// src/matches/dto/match-response.dto.ts
import { Match } from '../entities/match.entity';

export class MatchResponseDto {
  id: number;
  founderId: number;
  matchedFounderId: number;
  overallScore: number;
  industryScore: number;
  skillsScore: number;
  founderStatusScore: number;
  commitmentScore: number;
  financialScore: number;
  personalityScore: number;
  locationScore: number;
  status: string;
  matchedFounderDetails: {
    name: string;
    founderStatus: string;
    skills: string[];
    industry: string;
    yearsExperience: number;
    location: string;
  };
  createdAt: Date;

  constructor(match: Match, currentUserId: number) {
    this.id = match.id;
    
    // Determine which founder is the current user
    const isFounderA = match.founderA.user.id === currentUserId;
    
    this.founderId = isFounderA ? match.founderA.id : match.founderB.id;
    this.matchedFounderId = isFounderA ? match.founderB.id : match.founderA.id;
    
    this.overallScore = Number(match.overallScore);
    this.industryScore = Number(match.industryScore);
    this.skillsScore = Number(match.skillsScore);
    this.founderStatusScore = Number(match.founderStatusScore);
    this.commitmentScore = Number(match.commitmentScore);
    this.financialScore = Number(match.financialScore);
    this.personalityScore = Number(match.personalityScore);
    this.locationScore = Number(match.locationScore);
    
    this.status = match.status;
    this.createdAt = match.createdAt;
    
    // Include basic details about the matched founder
    const matchedFounder = isFounderA ? match.founderB : match.founderA;
    this.matchedFounderDetails = {
      name: `${matchedFounder.user.firstName} ${matchedFounder.user.lastName}`,
      founderStatus: matchedFounder.founderStatus,
      skills: matchedFounder.skills,
      industry: matchedFounder.industry,
      yearsExperience: matchedFounder.yearsExperience,
      location: matchedFounder.location
    };
  }
}

