export class Season {
    id:number;
    minPlayerAmount:number;
    budgetLimit: number;
    code: string;
    maxPlayersAllowed: number;
    maxRtmAllowed: number;
    maxFreeAllowed: number;

    constructor(id:number,minPlayerAmount:number,budgetLimit: number, code: string, maxPlayersAllowed: number, maxRtmAllowed: number, maxFreeAllowed: number) {
        this.id=id;
        this.minPlayerAmount = minPlayerAmount;
        this.budgetLimit = budgetLimit;
        this.code = code;
        this.maxPlayersAllowed = maxPlayersAllowed;
        this.maxRtmAllowed = maxRtmAllowed;
        this.maxFreeAllowed = maxFreeAllowed;
    }
}