import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayerCategory } from '../common/player-category';
import { PLAYER_CATAGORY_URL } from '../config/constants';

@Injectable({
  providedIn: 'root'
})
export class PlayerCategoryService {

  

  constructor(private httpClient: HttpClient) { }

  getAllCategories(): Observable<PlayerCategory[]> {
    return this.httpClient.get<CategoryResponse>(`${PLAYER_CATAGORY_URL}`).pipe(
      map(response => response.data.items)
    );
  }
}

interface CategoryResponse {
  data: {
    items: PlayerCategory[];
  }
}