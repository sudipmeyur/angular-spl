import { Player } from './player';
import { Team } from './team';

export class TeamInfo {
    playerTeamCode: string;
    team: Team;
    soldAmount: number;
    isManager: boolean;
    isRtmUsed: boolean;

    constructor(playerTeamCode: string,team: Team, soldAmount: number, isManager: boolean, isRtmUsed: boolean) {
        this.playerTeamCode = playerTeamCode;
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
    unsoldPlayerId?: number;

    constructor(player: Player, isUnsold: boolean, teamInfo?: TeamInfo,unsoldPlayerId?: number) {
        this.player = player;
        this.isUnsold = isUnsold;
        this.teamInfo = teamInfo;
        this.unsoldPlayerId = unsoldPlayerId;
    }
}
