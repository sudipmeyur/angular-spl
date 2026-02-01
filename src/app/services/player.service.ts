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
import { PlayerTeamInfo } from '../common/player-team-info';

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

  getActivePlayers(): Observable<Player[]>{
    return this.httpClient.get<GetResponse>(`${PLAYERS_URL}`).pipe(
      map(response => response.data.items)  
    );
  }

  getPlayers(playerLevelId: number, seasonId: number): Observable<Player[]>{
    return this.httpClient.get<GetResponse>(`${PLAYERS_URL}/available?seasonId=${seasonId}&playerLevelId=${playerLevelId}`).pipe(
      map(response => response.data.items)  
    );
  }

  getUnsoldPlayers(seasonId: number): Observable<Player[]>{
    return this.httpClient.get<GetResponse>(`${PLAYERS_URL}/unsold?seasonId=${seasonId}`).pipe(
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

  revertPlayerTeam(playerTeamCode: string): Observable<any> {
    return this.httpClient.delete(`${PLAYER_TEAMS_URL}/${playerTeamCode}`);
  }

  saveUnsoldPlayer(request: PlayerTeamRequest): Observable<any> {
    return this.httpClient.post(`${PLAYERS_URL}/unsold`, request);
  }

  revertUnsoldPlayer(unsoldPlayerId: string): Observable<any> {
    return this.httpClient.delete(`${PLAYERS_URL}/unsold/${unsoldPlayerId}`);
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

  getAuctionResultPlayers(seasonId: number) : Observable<PlayerTeamInfo[]>{
    return this.httpClient.get<PlayerTeamInfosResponse>(`${PLAYERS_URL}/auction-result?seasonId=${seasonId}`).pipe(
      map(response => response.data.items)  
    );
  }

  // CRUD operations for Player Master
  createPlayer(player: Player): Observable<Player> {
    return this.httpClient.post<PlayerResponse>(PLAYERS_URL, player).pipe(
      map(response => response.data.item)
    );
  }

  updatePlayer(id: number, player: Player): Observable<Player> {
    return this.httpClient.put<PlayerResponse>(`${PLAYERS_URL}/${id}`, player).pipe(
      map(response => response.data.item)
    );
  }

  deletePlayer(id: number): Observable<any> {
    return this.httpClient.delete(`${PLAYERS_URL}/${id}`);
  }

  getPlayerById(id: number): Observable<Player> {
    return this.httpClient.get<PlayerResponse>(`${PLAYERS_URL}/${id}`).pipe(
      map(response => response.data.item)
    );
  }

  // File upload for player images
  uploadPlayerImage(file: File, playerCode?: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    if (playerCode) {
      formData.append('playerCode', playerCode);
    }
    
    return this.httpClient.post<UploadResponse>('http://localhost:8080/api/upload/player-image', formData).pipe(
      map(response => response.data.item)
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

interface PlayerTeamInfosResponse {
  data: {
    items: PlayerTeamInfo[];
  }
}

interface PlayerResponse {
  data: {
    item: Player;
  }
}

interface UploadResponse {
  data: {
    item: string;
  }
}
