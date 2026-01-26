export class PlayerTeamRequest {
    code?: string;
    playerCode: string;
    teamSeasonCode: string;
    soldAmount: number;
    isFree?: boolean;
    isRtmUsed? : boolean;
    seasonCode?: string;

    constructor(playerCode: string, teamSeasonCode: string, soldAmount: number, code?: string, seasonCode?: string,isFree?: boolean, isRtmUsed?: boolean) {
        this.code = code;
        this.playerCode = playerCode;
        this.teamSeasonCode = teamSeasonCode;
        this.soldAmount = soldAmount;
        this.isFree = isFree;
        this.isRtmUsed = isRtmUsed;
        this.seasonCode = seasonCode;
    }
}
