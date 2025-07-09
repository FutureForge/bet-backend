import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('')
  allFixtures() {
    return this.matchesService.getAllFixtures();
  }

  @Get('cache/status')
  getCacheStatus() {
    return this.matchesService.getCacheStatus();
  }

  @Delete('cache')
  clearCache() {
    return this.matchesService.clearFixturesCache();
  }

  @Delete('cache/individual')
  clearIndividualCache() {
    return this.matchesService.clearIndividualFixtureCache();
  }
}
