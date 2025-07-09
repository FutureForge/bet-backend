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
  country: {
    id: number;
    name: string;
    code: string;
  };
};
