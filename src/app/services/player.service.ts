import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../common/player';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private baseUrl = 'http://localhost:8080/api/players';

  constructor(private httpClient: HttpClient) { }

  getPlayers(): Observable<Player[]>{
    return this.httpClient.get<GetResponse>(this.baseUrl).pipe(
      map(response => response.data.players)  
    );
  }
}

interface GetResponse {
  data: {
    players: Player[];
  }
}
