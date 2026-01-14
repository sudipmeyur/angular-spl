import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { PlayerListComponent } from './components/player-list/player-list.component';
import { HttpClientModule } from '@angular/common/http';
import { PlayerService } from './services/player.service';

@NgModule({
  declarations: [
    AppComponent,
    PlayerListComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [PlayerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
