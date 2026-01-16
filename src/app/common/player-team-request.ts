export class PlayerTeamRequest {
    code?: string;
    playerCode: string;
    teamCode: string;
    seasonCode: string;
    soldAmount: number;

    constructor(playerCode: string, teamCode: string, seasonCode: string, soldAmount: number, code?: string) {
        this.code = code;
        this.playerCode = playerCode;
        this.teamCode = teamCode;
        this.seasonCode = seasonCode;
        this.soldAmount = soldAmount;
    }
}
