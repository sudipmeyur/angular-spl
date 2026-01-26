import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../common/player';
import { PlayerTeamRequest } from '../common/player-team-request';
import { TeamSeason } from '../common/team-season';
import { map } from 'rxjs/operators';
import { PLAYERS_URL, PLAYER_TEAMS_URL, TEAM_SEASONS_URL, SEASONS_URL, PLAYER_LEVELS_URL } from '../config/constants';
import { Season } from '../common/season';
import { PlayerLevel } from '../common/player-level';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  

  

  constructor(private httpClient: HttpClient) { }

  getCurrentSeason(): Observable<Season>{
    return this.httpClient.get<SeasonResponse>(`${SEASONS_URL}/current`).pipe(
      map(response => response.data.item)  
    );
  }

  getPlayers(playerLevelId: number, seasonId: number): Observable<Player[]>{
    return this.httpClient.get<GetResponse>(`${PLAYERS_URL}/available?seasonId=${seasonId}&playerLevelId=${playerLevelId}`).pipe(
      map(response => response.data.items)  
    );
  }

  getTeamSeasons(seasonId: number): Observable<TeamSeason[]> {
    return this.httpClient.get<TeamSeasonsResponse>(`${TEAM_SEASONS_URL}?seasonId=${seasonId}`).pipe(
      map(response => response.data.items)
    );
  }

  savePlayerTeam(request: PlayerTeamRequest): Observable<any> {
    return this.httpClient.post(PLAYER_TEAMS_URL, request);
  }

  saveUnsoldPlayer(request: PlayerTeamRequest): Observable<any> {
    return this.httpClient.post(`${PLAYERS_URL}/unsold`, request);
  }

  getTeamSquad(teamSeasonId: number): Observable<TeamSeason> {
    return this.httpClient.get<TeamSeasonResponse>(`${TEAM_SEASONS_URL}/${teamSeasonId}`).pipe(
      map(response => response.data.item)  
    );
  }

  getPlayerLevels(): Observable<PlayerLevel[]>{
    return this.httpClient.get<PlayerLevesResponse>(`${PLAYER_LEVELS_URL}`).pipe(
      map(response => response.data.items)  
    );
  }

}

interface GetResponse {
  data: {
    items: Player[];
  }
}

interface TeamSeasonsResponse {
  data: {
    items: TeamSeason[];
  }
}

interface SeasonResponse {
  data: {
    item: Season;
  }
}

interface TeamSeasonResponse {
  data: {
    item: TeamSeason;
  }
}

interface PlayerLevesResponse {
  data: {
    items: PlayerLevel[];
  }
}
