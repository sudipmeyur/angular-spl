export class PlayerLevel {
    id: number;
    code: string;
    name: string;
    baseAmount?: number;
    isFree?: boolean;
    isRandomTeamSelection?: boolean;

    constructor(id: number, code: string, name?: string, baseAmount?: number, isFree?: boolean, isRandomTeamSelection?: boolean) {
        this.id = id;
        this.code = code;
        this.name = name || code;
        this.baseAmount = baseAmount;
        this.isFree = isFree;
        this.isRandomTeamSelection = isRandomTeamSelection;
    }


}