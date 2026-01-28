import { PlayerTeam } from './player-team';
import { Season } from './season';
import { Team } from './team';

export interface TeamSeasonPlayerLevel {
    playerLevel: {
        code: string;
    };
    totalAmountSpent: number;
    totalPlayerCount: number;
    nextPlayerBudget: number;
}

export class TeamSeason {
    id: number;
    code: string;
    totalAmountSpent?: number;
    totalPlayer?: number;
    totalRtmUsed?: number;
    totalFreeUsed?: number;
    isRtmEligible?: boolean;
    season: Season;
    team: Team;
    playerTeams: PlayerTeam[];
    teamSeasonPlayerLevels: TeamSeasonPlayerLevel[];

    constructor(id: number,code: string, season: Season, team: Team, playerTeams: PlayerTeam[], totalAmountSpent?: number, totalPlayer?: number, totalRtmUsed?: number, totalFreeUsed?: number,isRtmEligible?: boolean,teamSeasonPlayerLevels?: TeamSeasonPlayerLevel[]) {
        this.id = id;
        this.code = code;
        this.season = season;
        this.team = team;
        this.playerTeams = playerTeams;
        this.totalAmountSpent = totalAmountSpent || 0;
        this.totalPlayer = totalPlayer || 0;
        this.totalRtmUsed = totalRtmUsed || 0;
        this.totalFreeUsed = totalFreeUsed || 0;
        this.isRtmEligible = isRtmEligible;
        this.teamSeasonPlayerLevels = teamSeasonPlayerLevels || [];
    }
}