export class Team {
    id: number;
    code: string;
    name: string;
    logoUrl?: string;

    constructor(id: number, code: string, name: string, logoUrl?: string) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.logoUrl = logoUrl;
    }
}