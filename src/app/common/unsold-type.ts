export class UnsoldType {
    id: number;
    code: string;
    name: string;
    baseAmount?: number;
    isFree?: boolean;
    isRandomTeamSelection?: boolean;
    isUnsold?: boolean;

    constructor(id: number, code: string, name?: string, baseAmount?: number, isFree?: boolean, isRandomTeamSelection?: boolean,isUnsold?: boolean) {
        this.id = id;
        this.code = code;
        this.name = name || code;
        this.baseAmount = baseAmount;
        this.isFree = isFree;
        this.isRandomTeamSelection = isRandomTeamSelection;
        this.isUnsold = isUnsold;
    }
}
