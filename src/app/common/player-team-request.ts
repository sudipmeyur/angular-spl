export class PlayerTeamRequest {
    code?: string;
    playerCode: string;
    teamSeasonCode: string;
    soldAmount: number;

    constructor(playerCode: string, teamSeasonCode: string, soldAmount: number, code?: string) {
        this.code = code;
        this.playerCode = playerCode;
        this.teamSeasonCode = teamSeasonCode;
        this.soldAmount = soldAmount;
    }
}
