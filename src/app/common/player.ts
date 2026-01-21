import { PlayerLevel } from './player-level';

export class Player {
    id?: number;
    code: string;
    name: string;
    description?: string;
    imageUrl: string;
    playerLevel: PlayerLevel;

    constructor(code: string, name: string, imageUrl: string, playerLevel: PlayerLevel, id?: number, description?: string) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.playerLevel = playerLevel;
    }
}
