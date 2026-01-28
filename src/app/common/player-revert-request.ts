export class PlayerRevertRequest {
    
    playerId: number;
    teamSeasonId?: number;
    isUnsold : boolean;

    constructor(playerId:number,isUnsold : boolean,teamSeasonId?:number) {
        this.playerId = playerId;
        this.isUnsold = isUnsold;
        this.teamSeasonId = teamSeasonId;
    }
}
