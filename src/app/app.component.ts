import { Component, OnInit } from '@angular/core';
import { PlayerService } from './services/player.service';
import { SeasonService } from './services/season.service';
import { TeamSeason } from './common/team-season';
import { Season } from './common/season';
import { PlayerLevel } from './common/player-level';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-spl';
  availableTeams: TeamSeason[] = [];
  currentSeason: Season | null = null;
  playerLevels: PlayerLevel[] = [];
  showAuctionCompleteModal: boolean = false;
  showConfirmModal: boolean = false;
  auctionCompletionNote: string = '';
  completingAuction: boolean = false;

  constructor(
    private playerService: PlayerService,
    private seasonService: SeasonService
  ) {}

  ngOnInit() {
    this.loadPlayerLevels();
    this.loadCurrentSeason();
  }

  loadPlayerLevels() {
  this.playerService.getPlayerLevels().subscribe(
    playerLevels => {
      this.playerLevels = playerLevels;
      this.seasonService.setPlayerLevel(playerLevels);
    },
    error => {
      console.error('Error loading player levels:', error);
    }
  );
}

  loadCurrentSeason() {
    this.playerService.getCurrentSeason().subscribe(
      season => {
        this.currentSeason = season;
        this.seasonService.setCurrentSeason(season);
        this.loadAvailableTeams();
      },
      error => {
        console.error('Error loading current season:', error);
      }
    );
  }

  loadAvailableTeams() {
    if (this.currentSeason) {
      this.playerService.getTeamSeasons(this.currentSeason.id).subscribe(
        teams => {
          this.availableTeams = teams;
        },
        error => {
          console.error('Error loading teams:', error);
        }
      );
    }
  }

  toggleMasterMenu(event: Event) {
    event.preventDefault();
    this.toggleSubmenu('master-submenu', 'master-arrow');
  }

  toggleAuctionMenu(event: Event) {
    event.preventDefault();
    this.toggleSubmenu('auction-submenu', 'auction-arrow');
  }

  toggleTeamSquadMenu(event: Event) {
    event.preventDefault();
    this.toggleSubmenu('team-squad-submenu', 'team-squad-arrow');
  }

  private toggleSubmenu(submenuId: string, arrowId: string) {
    const submenu = document.getElementById(submenuId);
    const arrow = document.getElementById(arrowId);
    
    if (submenu && arrow) {
      if (submenu.style.display === 'none' || submenu.style.display === '') {
        submenu.style.display = 'block';
        arrow.classList.remove('fa-chevron-right');
        arrow.classList.add('fa-chevron-down');
      } else {
        submenu.style.display = 'none';
        arrow.classList.remove('fa-chevron-down');
        arrow.classList.add('fa-chevron-right');
      }
    }
  }

  openAuctionCompleteModal() {
    this.showAuctionCompleteModal = true;
    this.auctionCompletionNote = '';
  }

  closeAuctionCompleteModal() {
    this.showAuctionCompleteModal = false;
    this.auctionCompletionNote = '';
  }

  showConfirmationModal() {
    this.showConfirmModal = true;
  }

  closeConfirmationModal() {
    this.showConfirmModal = false;
  }

  confirmCompleteAuction() {
    this.closeConfirmationModal();
    this.completeAuction();
  }

  completeAuction() {
    if (!this.currentSeason) return;
    
    this.completingAuction = true;
    this.seasonService.completeAuction(this.currentSeason.id, this.auctionCompletionNote).subscribe(
      (updatedSeason) => {
        this.currentSeason = updatedSeason;
        this.seasonService.setCurrentSeason(updatedSeason);
        this.closeAuctionCompleteModal();
        this.completingAuction = false;
      },
      (error) => {
        console.error('Error completing auction:', error);
        this.completingAuction = false;
      }
    );
  }
}
