import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { PlayerAuctionComponent } from './components/player-auction/player-auction.component';
import { TeamSquadComponent } from './components/team-squad/team-squad.component';
import { HttpClientModule } from '@angular/common/http';
import { PlayerService } from './services/player.service';
import { SeasonService } from './services/season.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { Routes,RouterModule } from '@angular/router';
import { PlayerUnsoldComponent } from './components/player-unsold/player-unsold.component';
import { AuctionModifyComponent } from './components/auction-modify/auction-modify.component';


const routes:Routes = [
  {path:'auction/:playerLevelId',component: PlayerAuctionComponent},
  {path:'auction/',component: PlayerAuctionComponent},
  {path:'unsold',component: PlayerUnsoldComponent},
  {path:'auction-modify',component: AuctionModifyComponent},
  {path:'team-squad/:id',component: TeamSquadComponent},
  {path:'dashboard',component: DashboardComponent},
  {path:'',redirectTo:'/dashboard', pathMatch:'full'},
  {path:'**',redirectTo:'/dashboard', pathMatch:'full'}
];


@NgModule({
  declarations: [
    AppComponent,
    PlayerAuctionComponent,
    TeamSquadComponent,
    DashboardComponent,
    PlayerUnsoldComponent,
    AuctionModifyComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [PlayerService, SeasonService],
  bootstrap: [AppComponent]
})
export class AppModule { }
