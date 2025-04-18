import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { MatchResponseDto } from './dto/match-response.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';

@Injectable()
export class MatchesService {
    // Define weights for matching criteria based on your document
  private readonly WEIGHTS = {
    industry: 0.20,
    skills: 0.20,
    founderStatus: 0.15,
    commitment: 0.10,
    financial: 0.10,
    personality: 0.05,
    location: 0.05
  };

  // Minimum match threshold score
  private readonly MATCH_THRESHOLD = 0.60;

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private profilesService: ProfilesService,
    private dataSource: DataSource,
  ) {}


  /**
   * Generate matches for a user
   */
    async generateMatches(userId: number): Promise<MatchResponseDto[]> {
        try {
            // Get user's profile
            const userProfile = await this.profilesService.findByUserId(userId);
            
            // Find all other profiles as potential matches
            const potentialMatches = await this.profileRepository.find({
                where: { user: { id: Not(userId) } },
                relations: ['user'],
            });
            
            if (potentialMatches.length === 0) {
                return [];
            }

            // Calculate match scores for each potential match
            const matchResults: MatchResponseDto[] = [];
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        
            try {
                for (const candidateProfile of potentialMatches) {
                // Calculate match score
                const scoreResult = this.calculateMatchScore(userProfile, candidateProfile);
                
                // Only create matches above threshold
                if (scoreResult.overallScore >= this.MATCH_THRESHOLD) {
                    // Check if match already exists
                    const existingMatch = await this.matchRepository.findOne({
                    where: [
                        { founderA: { id: userProfile.id }, founderB: { id: candidateProfile.id } },
                        { founderA: { id: candidateProfile.id }, founderB: { id: userProfile.id } }
                    ],
                    relations: ['founderA', 'founderB', 'founderA.user', 'founderB.user'],
                    });
                    
                    if (existingMatch) {
                    // Update existing match with new scores
                    existingMatch.overallScore = scoreResult.overallScore;
                    existingMatch.industryScore = scoreResult.breakdownScores.industry;
                    existingMatch.skillsScore = scoreResult.breakdownScores.skills;
                    existingMatch.founderStatusScore = scoreResult.breakdownScores.founderStatus;
                    existingMatch.commitmentScore = scoreResult.breakdownScores.commitment;
                    existingMatch.financialScore = scoreResult.breakdownScores.financial;
                    existingMatch.personalityScore = scoreResult.breakdownScores.personality;
                    existingMatch.locationScore = scoreResult.breakdownScores.location;
                    
                    const updatedMatch = await queryRunner.manager.save(existingMatch);
                    matchResults.push(new MatchResponseDto(updatedMatch, userId));
                    } else {
                        // Create new match
                        const match = this.matchRepository.create({
                            founderA: userProfile,
                            founderB: candidateProfile,
                            overallScore: scoreResult.overallScore,
                            industryScore: scoreResult.breakdownScores.industry,
                            skillsScore: scoreResult.breakdownScores.skills,
                            founderStatusScore: scoreResult.breakdownScores.founderStatus,
                            commitmentScore: scoreResult.breakdownScores.commitment,
                            financialScore: scoreResult.breakdownScores.financial,
                            personalityScore: scoreResult.breakdownScores.personality,
                            locationScore: scoreResult.breakdownScores.location,
                            status: MatchStatus.PENDING
                        });
                    
                        const savedMatch = await queryRunner.manager.save(match);
                        // Reload match with relations
                        const fullMatch = await queryRunner.manager.findOne(Match, {
                            where: { id: savedMatch.id },
                            relations: ['founderA', 'founderB', 'founderA.user', 'founderB.user'],
                        });

                        if(!fullMatch){
                            throw new InternalServerErrorException('Failed to create match');
                        }
                    
                        matchResults.push(new MatchResponseDto(fullMatch, userId));
                    }
                }
            }
                
                await queryRunner.commitTransaction();
                return matchResults;
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new BadRequestException('You must create a profile before finding matches');
            }
            throw new InternalServerErrorException(`Failed to generate matches: ${error.message}`);
        }
    }       

     /**
   * Get matches for a user
   */
    async getMatches(userId: number): Promise<MatchResponseDto[]> {
        try {
            // Get user's profile
            const userProfile = await this.profilesService.findByUserId(userId);
      
            // Find all matches where user is either founderA or founderB
            const matches = await this.matchRepository.find({
                where: [
                    { founderA: { id: userProfile.id } },
                    { founderB: { id: userProfile.id } }
                ],
                relations: ['founderA', 'founderB', 'founderA.user', 'founderB.user'],
                order: { overallScore: 'DESC' }
            });
      
            return matches.map(match => new MatchResponseDto(match, userId));
        } catch (error) {
            if (error instanceof NotFoundException) {
            throw new BadRequestException('You must create a profile before viewing matches');
        }
        throw new InternalServerErrorException(`Failed to retrieve matches: ${error.message}`);
    }
  }

  /**
   * Get a specific match by ID
   */
    async getMatch(id: number, userId: number): Promise<MatchResponseDto> {
        try {
            // Find the match
            const match = await this.matchRepository.findOne({
                where: { id },
                relations: ['founderA', 'founderB', 'founderA.user', 'founderB.user'],
            });
      
            if (!match) {
                throw new NotFoundException(`Match with ID ${id} not found`);
            }
      
            // Verify that the user is part of this match
            if (match.founderA.user.id !== userId && match.founderB.user.id !== userId) {
                throw new BadRequestException('You do not have access to this match');
            }
      
            return new MatchResponseDto(match, userId);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
            throw error;
        }
        throw new InternalServerErrorException(`Failed to retrieve match: ${error.message}`);
    }
  }

  /**
   * Update match status
   */
    async updateMatchStatus(id: number, userId: number, updateMatchStatusDto: UpdateMatchStatusDto): Promise<MatchResponseDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Find the match
            const match = await this.matchRepository.findOne({
                where: { id },
                relations: ['founderA', 'founderB', 'founderA.user', 'founderB.user'],
            });
            
            if (!match) {
                throw new NotFoundException(`Match with ID ${id} not found`);
            }
            
            // Verify that the user is part of this match
            if (match.founderA.user.id !== userId && match.founderB.user.id !== userId) {
                throw new BadRequestException('You do not have access to this match');
            }
        
            // Update status
            match.status = updateMatchStatusDto.status;
            
            // If both users have accepted, change status to CONNECTED
            if (match.status === MatchStatus.ACCEPTED) {
                // In a real app, you would check if both users have accepted
                // For now, we'll simplify and assume immediate connection
                match.status = MatchStatus.CONNECTED;
            }
            
            const updatedMatch = await queryRunner.manager.save(match);
            await queryRunner.commitTransaction();
            
            return new MatchResponseDto(updatedMatch, userId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
        
            throw new InternalServerErrorException(`Failed to update match status: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    /**
   * Calculate match score between profiles using the matching algorithm
   */
    private calculateMatchScore(profile1: any, profile2: any): {
        overallScore: number;
        breakdownScores: Record<string, number>;
    } {
        const breakdownScores = {
            industry: this.calculateIndustryMatch(profile1, profile2),
            skills: this.calculateSkillsMatch(profile1, profile2),
            founderStatus: this.calculateFounderStatusMatch(profile1, profile2),
            commitment: this.calculateCommitmentMatch(profile1, profile2),
            financial: this.calculateFinancialMatch(profile1, profile2),
            personality: this.calculatePersonalityMatch(profile1, profile2),
            location: this.calculateLocationMatch(profile1, profile2),
        };
        
        // Calculate weighted average
        const overallScore =
            breakdownScores.industry * this.WEIGHTS.industry +
            breakdownScores.skills * this.WEIGHTS.skills +
            breakdownScores.founderStatus * this.WEIGHTS.founderStatus +
            breakdownScores.commitment * this.WEIGHTS.commitment +
            breakdownScores.financial * this.WEIGHTS.financial +
            breakdownScores.personality * this.WEIGHTS.personality +
            breakdownScores.location * this.WEIGHTS.location;
        
        return {
            overallScore,
            breakdownScores,
        };
    }

    /**
   * Calculate industry match score
   */
    private calculateIndustryMatch(profile1: any, profile2: any): number {
        return this.bidirectionalMatchScore(
            profile1.industry, profile1.preferredIndustry,
            profile2.industry, profile2.preferredIndustry,
        );
    }

    /**
   * Calculate skills match score
   */
    private calculateSkillsMatch(profile1: any, profile2: any): number {
        // Match if profile1's skills include what profile2 is looking for
        // and vice versa
        const profile1SkillsMatchProfile2Needs = this.calculateArrayOverlap(
            profile1.skills,
            profile2.preferredSkills
        );
        
        const profile2SkillsMatchProfile1Needs = this.calculateArrayOverlap(
            profile2.skills,
            profile1.preferredSkills
        );
        
        return (profile1SkillsMatchProfile2Needs + profile2SkillsMatchProfile1Needs) / 2;
    }

    /**
   * Calculate founder status match score
   */
    private calculateFounderStatusMatch(profile1: any, profile2: any): number {
        return this.bidirectionalMatchScore(
            profile1.founderStatus, profile1.preferredFounderType,
            profile2.founderStatus, profile2.preferredFounderType,
        );
    }

    /**
   * Calculate commitment level match score
   */
    private calculateCommitmentMatch(profile1: any, profile2: any): number {
        // If both want the same commitment level = perfect match
        if (profile1.preferredCommitmentLevel === profile2.commitmentLevel &&
            profile2.preferredCommitmentLevel === profile1.commitmentLevel) {
            return 1.0;
        }

        // If one party's expectation is met but not the other, partial match
        if (profile1.preferredCommitmentLevel === profile2.commitmentLevel ||
            profile2.preferredCommitmentLevel === profile1.commitmentLevel) {
            return 0.5;
        }

        // Different commitment preferences = no match
        return 0.0;
    }

    /**
   * Calculate financial compatibility match score
   */
    private calculateFinancialMatch(profile1: any, profile2: any): number {
        // Simplified compatibility logic
        const complementaryContributions = {
            'Will self-fund/bootstrap': ['Will self-fund/bootstrap'],
            'Can invest <$25K personally': ['No personal investment, seeking external funding'],
            'Can invest $25K-$100K personally': ['No personal investment, seeking external funding'],
            'Can invest >$100K personally': ['No personal investment, seeking external funding'],
            'No personal investment, seeking external funding': [
                'Can invest <$25K personally',
                'Can invest $25K-$100K personally',
                'Can invest >$100K personally'
            ],
            'Brings existing investor relationships': ['No personal investment, seeking external funding'],
            'Prefers not to discuss until later stage': ['Prefers not to discuss until later stage'],
            'Seeking co-founder with investment capability': [
                'Can invest <$25K personally', 
                'Can invest $25K-$100K personally', 
                'Can invest >$100K personally'
            ],
            'Open to sweat equity arrangements': ['Open to sweat equity arrangements']
        };

        // Check if their contributions complement each other
        const contributionsComplementEachOther = 
            complementaryContributions[profile1.financialContribution]?.includes(profile2.financialContribution) &&
            complementaryContributions[profile2.financialContribution]?.includes(profile1.financialContribution);
        
        if (contributionsComplementEachOther) {
            return 1.0;
        }
        
        // Partially compatible if one direction matches
        const partiallyCompatible = 
            complementaryContributions[profile1.financialContribution]?.includes(profile2.financialContribution) ||
            complementaryContributions[profile2.financialContribution]?.includes(profile1.financialContribution);
        
        if (partiallyCompatible) {
            return 0.5;
        }
        
        return 0.0;
    }

    /**
   * Calculate personality match score
   */
    private calculatePersonalityMatch(profile1: any, profile2: any): number {
        // For personality, we want some overlap but also some complementary traits
        const overlapScore = this.calculateArrayOverlap(
            profile1.personalityTraits,
            profile2.personalityTraits
        );
        
        // Complementary traits
        const complementaryTraits = {
            'Visionary': ['Detail-oriented', 'Execution-focused'],
            'Detail-oriented': ['Visionary', 'Strategic thinker'],
            'Risk-taker': ['Methodical', 'Analytical'],
            'Analytical': ['Creative', 'Risk-taker'],
            'Creative': ['Analytical', 'Process-driven'],
            'Methodical': ['Risk-taker', 'Adaptable'],
            'Growth-oriented': ['Process-driven', 'Methodical'],
            'Process-driven': ['Visionary', 'Creative'],
            'People-focused': ['Execution-focused', 'Analytical'],
            'Execution-focused': ['Visionary', 'Strategic thinker'],
            'Strategic thinker': ['Detail-oriented', 'Execution-focused'],
            'Tactical executor': ['Visionary', 'Strategic thinker'],
            'Persistent': ['Adaptable'],
            'Adaptable': ['Persistent'],
            'Collaborative': ['Independent'],
            'Independent': ['Collaborative']
        };
        
        let complementaryTraitsCount = 0;
        let totalPossibleComplementaryTraits = 0;
        
        // Check for complementary traits
        for (const trait1 of profile1.personalityTraits) {
            for (const trait2 of profile2.personalityTraits) {
                totalPossibleComplementaryTraits++;
                if (complementaryTraits[trait1]?.includes(trait2)) {
                    complementaryTraitsCount++;
                }
            }
        }
        
        // Calculate complementary score
        const complementaryScore = totalPossibleComplementaryTraits > 0 
        ? complementaryTraitsCount / Math.min(profile1.personalityTraits.length, profile2.personalityTraits.length)
        : 0;
        
        // Balance between shared traits and complementary traits
        return (overlapScore + complementaryScore) / 2;
    }

    /**
   * Calculate location match score
   */
    private calculateLocationMatch(profile1: any, profile2: any): number {
        // Remote is compatible with anything
        if (profile1.location === 'Remote only' || profile2.location === 'Remote only') {
            return 1.0;
        }
        
        // Exact location match
        if (profile1.location === profile2.location) {
            return 1.0;
        }
        
        // Regional matches (simplified)
        const regions = {
            'US - West Coast': ['US - West Coast'],
            'US - East Coast': ['US - East Coast'],
            'US - Midwest': ['US - Midwest'],
            'US - South': ['US - South'],
            'Europe': ['Europe'],
            'Asia': ['Asia'],
            'Latin America': ['Latin America'],
            'Africa': ['Africa'],
            'Australia/Oceania': ['Australia/Oceania']
        };
        
        if (regions[profile1.location]?.includes(profile2.location)) {
            return 0.7;
        }
        
        // Different locations
        return 0.0;
    }

    /**
   * Calculate bidirectional match score
   */
    private bidirectionalMatchScore(
        value1: string, preference1: string,
        value2: string, preference2: string,
    ): number {
        const match1 = value1 === preference2 ? 1 : 0;
        const match2 = value2 === preference1 ? 1 : 0;
        
        return (match1 + match2) / 2;
    }

    /**
   * Calculate array overlap
   */
    private calculateArrayOverlap(array1: string[], array2: string[]): number {
        if (!array1.length || !array2.length) return 0;
        
        const intersection = array1.filter(item => array2.includes(item));
        return intersection.length / Math.min(array1.length, array2.length);
    }
}
