export class Season {
    budgetLimit: number;
    code: string;
    maxPlayersAllowed: number;
    maxRtmAllowed: number;

    constructor(budgetLimit: number, code: string, maxPlayersAllowed: number, maxRtmAllowed: number) {
        this.budgetLimit = budgetLimit;
        this.code = code;
        this.maxPlayersAllowed = maxPlayersAllowed;
        this.maxRtmAllowed = maxRtmAllowed;
    }
}