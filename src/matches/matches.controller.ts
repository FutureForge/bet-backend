import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { SingleFixtureRequest } from './types/matches.type';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('')
  allFixtures() {
    return this.matchesService.getAllFixtures();
  }

  @Get('/dummy')
  dummyFixtures() {
    return this.matchesService.getDummyFixtures();
  }

  @Get('/live')
  liveFixtures() {
    return this.matchesService.getLiveFixtures();
  }

  @Get(':fixtureId')
  singleFixture(
    @Param('fixtureId') fixtureId: string,
    @Query('includePrediction') includePrediction?: string,
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    const options: Partial<SingleFixtureRequest> = {
      includePrediction: includePrediction === 'true',
      forceRefresh: forceRefresh === 'true',
    };

    return this.matchesService.getSingleFixture(fixtureId, options);
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

  @Delete('cache/:fixtureId')
  clearIndividualFixtureCache(@Param('fixtureId') fixtureId: string) {
    return this.matchesService.invalidateFixtureCache(fixtureId);
  }
}
