import { PlayerLevel } from './player-level';
import { PlayerCategory } from './player-category';

export class Player {
    id?: number;
    code: string;
    name: string;
    description?: string;
    imageUrl: string;
    playerLevel: PlayerLevel;
    category?: PlayerCategory;

    constructor(code: string, name: string, imageUrl: string, playerLevel: PlayerLevel, id?: number, description?: string, category?: PlayerCategory) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.playerLevel = playerLevel;
        this.category = category;
    }

}
