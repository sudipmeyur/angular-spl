import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../common/player';
import { PlayerTeamRequest } from '../common/player-team-request';
import { map } from 'rxjs/operators';
import { PLAYERS_URL, PLAYER_TEAMS_URL } from '../config/constants';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  constructor(private httpClient: HttpClient) { }

  getPlayers(): Observable<Player[]>{
    return this.httpClient.get<GetResponse>(`${PLAYERS_URL}/available?seasonCode=S6&playerLevelCode=L2`).pipe(
      map(response => response.data.players)  
    );
  }

  savePlayerTeam(request: PlayerTeamRequest): Observable<any> {
    return this.httpClient.post(PLAYER_TEAMS_URL, request);
  }
}

interface GetResponse {
  data: {
    players: Player[];
  }
}
