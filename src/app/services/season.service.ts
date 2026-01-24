import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Season } from '../common/season';
import { PlayerLevel } from '../common/player-level';

@Injectable({
  providedIn: 'root'
})
export class SeasonService {
  private currentSeasonSubject = new BehaviorSubject<Season | null>(null);
  private playerLevelMapSubject = new BehaviorSubject<Map<number, PlayerLevel> | null>(null);

  public currentSeason$ = this.currentSeasonSubject.asObservable();
  public playerLevelMap$ = this.playerLevelMapSubject.asObservable();

  setCurrentSeason(season: Season) {
    this.currentSeasonSubject.next(season);
  }

  getCurrentSeason(): Season | null {
    return this.currentSeasonSubject.value;
  }

  setPlayerLevel(playerLeves: PlayerLevel[]) {
    if (playerLeves) {
      // Create a map with playerLevel.id as key and playerLevel as value
      const playerLevelMap = new Map<number, PlayerLevel>();
      playerLeves.forEach(playerLevel => {
        playerLevelMap.set(playerLevel.id, playerLevel);
      });
      this.playerLevelMapSubject.next(playerLevelMap);
    }

  }
  getPlayerLevelMap(): Map<number, PlayerLevel> | null {
    return this.playerLevelMapSubject.value;
  }

  getPlayerLevelById(id: number): PlayerLevel | undefined {
    const playerLevelMap = this.getPlayerLevelMap();
    return playerLevelMap?.get(id);
  }
}