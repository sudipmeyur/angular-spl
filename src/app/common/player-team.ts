import { Player } from './player';

export class PlayerTeam {
    code: string;
    isManager: boolean;
    isRtmUsed: boolean;
    player: Player;
    soldAmount: number;

    constructor(
        code: string,
        isManager: boolean,
        isRtmUsed: boolean,
        player: Player,
        soldAmount: number
    ) {
        this.code = code;
        this.isManager = isManager;
        this.isRtmUsed = isRtmUsed;
        this.player = player;
        this.soldAmount = soldAmount
    }

}