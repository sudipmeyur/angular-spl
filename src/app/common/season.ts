export class Season {
    id:number;
    minPlayerAmount:number;
    budgetLimit: number;
    code: string;
    maxPlayersAllowed: number;
    maxRtmAllowed: number;
    maxFreeAllowed: number;
    isAuctionCompleted: boolean;
    auctionCompletionNote?:string;

    constructor(id:number,minPlayerAmount:number,budgetLimit: number, code: string, maxPlayersAllowed: number, maxRtmAllowed: number, maxFreeAllowed: number, isAuctionCompleted: boolean, auctionCompletionNote?:string) {
        this.id=id;
        this.minPlayerAmount = minPlayerAmount;
        this.budgetLimit = budgetLimit;
        this.code = code;
        this.maxPlayersAllowed = maxPlayersAllowed;
        this.maxRtmAllowed = maxRtmAllowed;
        this.maxFreeAllowed = maxFreeAllowed;
        this.isAuctionCompleted = isAuctionCompleted;
        this.auctionCompletionNote = auctionCompletionNote;
    }
}