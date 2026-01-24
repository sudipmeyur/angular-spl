export class Season {
    id:number;
    budgetLimit: number;
    code: string;
    maxPlayersAllowed: number;
    maxRtmAllowed: number;

    constructor(id:number,budgetLimit: number, code: string, maxPlayersAllowed: number, maxRtmAllowed: number) {
        this.id=id;
        this.budgetLimit = budgetLimit;
        this.code = code;
        this.maxPlayersAllowed = maxPlayersAllowed;
        this.maxRtmAllowed = maxRtmAllowed;
    }
}