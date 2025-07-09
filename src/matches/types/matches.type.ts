export type FixtureAPIResponse = {
  get: string;
  parameters: {
    live: string;
  };
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: FixtureResponse[];
};

export type FixtureResponse = {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number;
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: TeamDetails;
    away: TeamDetails;
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: {
      home: number;
      away: number;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
};

export type TeamDetails = {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
};

export type Fixture = {
  id: number;
  date: string;
  time: string;
  timezone: string;
  venue: string | null;
  leagueCountry: string;
  leagueName: string;
  leagueLogo: string;
  leagueFlag: string | null;
  matchDay: string;
  homeTeamId: number;
  homeTeam: string;
  homeTeamLogo: string;
  awayTeamId: number;
  awayTeam: string;
  awayTeamLogo: string;
  widget: string;
  country?: {
    id: number;
    name: string;
    code: string;
  };
  prediction?: FormattedPrediction;
  matchStats: {
    status: MatchStatsStatus;
    isHomeWinner: boolean;
    isAwayWinner: boolean;
  };
};

export type MatchStatsStatus =
  | 'FT' // Full Time
  | 'NS' // Not Started
  | '1H' // First Half
  | 'HT' // Half Time
  | '2H' // Second Half
  | 'ET' // Extra Time
  | 'P' // Penalty
  | 'BT' // Break Time
  | 'LIVE' // Live
  | 'AET' // After Extra Time
  | 'PEN' // Penalties
  | 'FT_PEN' // Full Time Penalties
  | 'TBD' // To Be Defined
  | 'POSTP' // Postponed
  | 'SUSP' // Suspended
  | 'INT' // Interrupted
  | 'CANC' // Cancelled
  | 'ABD' // Abandoned
  | 'AWD' // Technical Loss
  | 'WO' // Walkover
  | 'LIVE'; // Live (duplicate, but keeping for compatibility)

export type PredictionAPIResponse = {
  get: string;
  parameters: {
    fixture: string;
  };
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: PredictionResponse[];
};

export type PredictionResponse = {
  predictions: {
    winner: {
      id: number;
      name: string;
      comment: string;
    };
    win_or_draw: boolean;
    under_over: string;
    goals: {
      home: string;
      away: string;
    };
    advice: string;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  teams: {
    home: TeamStats;
    away: TeamStats;
  };
  comparison: ComparisonStats;
  h2h: H2HFixture[];
};

export type TeamStats = {
  id: number;
  name: string;
  logo: string;
  last_5: {
    form: string;
    att: string;
    def: string;
    goals: {
      for: {
        total: number;
        average: number;
      };
      against: {
        total: number;
        average: number;
      };
    };
  };
  league: {
    form: string;
    fixtures: {
      played: Record<'home' | 'away' | 'total', number>;
      wins: Record<'home' | 'away' | 'total', number>;
      draws: Record<'home' | 'away' | 'total', number>;
      loses: Record<'home' | 'away' | 'total', number>;
    };
    goals: {
      for: {
        total: Record<'home' | 'away' | 'total', number>;
        average: Record<'home' | 'away' | 'total', string>;
      };
      against: {
        total: Record<'home' | 'away' | 'total', number>;
        average: Record<'home' | 'away' | 'total', string>;
      };
    };
    biggest: {
      streak: Record<'wins' | 'draws' | 'loses', number>;
      wins: Record<'home' | 'away', string>;
      loses: Record<'home' | 'away', string>;
      goals: {
        for: Record<'home' | 'away', number>;
        against: Record<'home' | 'away', number>;
      };
    };
    clean_sheet: Record<'home' | 'away' | 'total', number>;
    failed_to_score: Record<'home' | 'away' | 'total', number>;
  };
};

export type ComparisonStats = {
  form: Record<'home' | 'away', string>;
  att: Record<'home' | 'away', string>;
  def: Record<'home' | 'away', string>;
  poisson_distribution: Record<'home' | 'away', string>;
  h2h: Record<'home' | 'away', string>;
  goals: Record<'home' | 'away', string>;
  total: Record<'home' | 'away', string>;
};

export type H2HFixture = {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number;
      second: number;
    };
    venue: {
      id: number | null;
      name: string;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: TeamBasic;
    away: TeamBasic;
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: {
      home: number;
      away: number;
    };
    fulltime: {
      home: number;
      away: number;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
};

export type TeamBasic = {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
};

export type PredictionOdds = {
  home: number;
  draw: number;
  away: number;
};

export type FormattedPrediction = {
  homePercent: string;
  awayPercent: string;
  drawPercent: string;
  advice: string;
  h2hHome: string;
  h2hAway: string;
  h2hGoalsHome: string;
  h2hGoalsAway: string;
  h2hTotalHome: string;
  h2hTotalAway: string;
  odds: PredictionOdds;
};

export interface Country {
  id: number;
  name: string;
  code: string;
  flag: string;
}

export type CountryFixtures = {
  country: Country;
  fixtures: Fixture[];
};

export type GroupedFixturesResponse = CountryFixtures[];
