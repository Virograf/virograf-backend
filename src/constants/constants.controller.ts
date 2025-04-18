import { Controller, Get } from '@nestjs/common';
import { INDUSTRIES, FOUNDER_STATUSES, COMMITMENT_LEVELS, PERSONALITY_TRAITS, SKILL_CATEGORIES, FINANCIAL_CONTRIBUTIONS, LOCATIONS } from '../constants';

@Controller('constants')
export class ConstantsController {
  @Get('industries')
  getIndustries() {
    return INDUSTRIES;
  }

  @Get('founder-statuses')
  getFounderStatuses() {
    return FOUNDER_STATUSES;
  }

  @Get('commitment-levels')
  getCommitmentLevels() {
    return COMMITMENT_LEVELS;
  }

  @Get('personality-traits')
  getPersonalityTraits() {
    return PERSONALITY_TRAITS;
  }

  @Get('skills')
  getSkillCategories() {
    return SKILL_CATEGORIES;
  }

  @Get('financial-contributions')
  getFinancialContributions() {
    return FINANCIAL_CONTRIBUTIONS;
  }

  @Get('locations')
  getLocations() {
    return LOCATIONS;
  }
}