import { Season } from './season';
import { Team } from './team';

export interface TeamSeasonPlayerLevel {
    playerLevel: {
        code: string;
    };
    totalAmountSpent: number;
    totalPlayerCount: number;
}

export class TeamSeason {
    code: string;
    totalAmountSpent?: number;
    totalPlayer?: number;
    totalRtmUsed?: number;
    season: Season;
    team: Team;
    teamSeasonPlayerLevels?: TeamSeasonPlayerLevel[];

    constructor(code: string, season: Season, team: Team, totalAmountSpent?: number, totalPlayer?: number, totalRtmUsed?: number, teamSeasonPlayerLevels?: TeamSeasonPlayerLevel[]) {
        this.code = code;
        this.season = season;
        this.team = team;
        this.totalAmountSpent = totalAmountSpent || 0;
        this.totalPlayer = totalPlayer || 0;
        this.totalRtmUsed = totalRtmUsed || 0;
        this.teamSeasonPlayerLevels = teamSeasonPlayerLevels || [];
    }
}