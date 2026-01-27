import { Player } from './player';
import { Team } from './team';

export class TeamInfo {
    team: Team;
    soldAmount: number;
    isManager: boolean;
    isRtmUsed: boolean;

    constructor(team: Team, soldAmount: number, isManager: boolean, isRtmUsed: boolean) {
        this.team = team;
        this.soldAmount = soldAmount;
        this.isManager = isManager;
        this.isRtmUsed = isRtmUsed;
    }
}

export class PlayerTeamInfo {
    player: Player;
    isUnsold: boolean;
    teamInfo?: TeamInfo;

    constructor(player: Player, isUnsold: boolean, teamInfo?: TeamInfo) {
        this.player = player;
        this.isUnsold = isUnsold;
        this.teamInfo = teamInfo;
    }
}
