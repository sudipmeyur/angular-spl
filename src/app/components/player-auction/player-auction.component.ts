import { Component, OnInit, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Player } from 'src/app/common/player';
import { PlayerService } from 'src/app/services/player.service';
import { PlayerTeamRequest } from 'src/app/common/player-team-request';
import { TeamSeason } from 'src/app/common/team-season';
import { ActivatedRoute } from '@angular/router';
import { SeasonService } from 'src/app/services/season.service';
import { Season } from 'src/app/common/season';
import { PlayerLevel } from 'src/app/common/player-level';

@Component({
  selector: 'app-player-auction',
  templateUrl: './player-auction.component.html',
  styleUrls: ['./player-auction.component.css']
})
export class PlayerAuctionComponent implements OnInit, OnDestroy {

  currentPlayerLevelCode: string = 'l1';
  currentPlayerLevelId: number = 1;
  currentSeason: Season | null = null;
  currentPlayerLevel: PlayerLevel | null |undefined = null;
  currentSeasonCode: string = 's6';
  currentSeasonId: number = 6;

  players: Player[] = [];
  teamSeasons: TeamSeason[] = [];
  
  dropdownOpen = false;
  animationOn = false;
  showEnvelope = false;
  envelopeOpen = false;

  selectedTeamSeason: TeamSeason | null = null;
  selectedPlayerCode: string | null = null;
  selectedPlayer: Player | null = null;
  displayedPlayer: Player | null = null;

  boxPositions = new Map<string, { top: number, left: number }>();
  animationFrames: any[] = [];
  pollingInterval: any;
  showBudgetTable = false;
  
  playerForm = {
    teamSeasonCode: '',
    amount: null
  };
  

  constructor(
    private playerService: PlayerService,
    private seasonService: SeasonService,
    private el: ElementRef,
    private renderer: Renderer2,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.seasonService.currentSeason$.subscribe(season => {
      if (season) {
        this.currentSeason = season;
        this.currentSeasonCode = season?.code || this.currentSeasonCode;
        this.currentSeasonId = season.id;
        this.route.paramMap.subscribe(() => {

          const hasLevelId: boolean = this.route.snapshot.paramMap.has('playerLevelId');
          if (hasLevelId) {
            const playerLevelId = +this.route.snapshot.paramMap.get('playerLevelId')!;

            this.currentPlayerLevel = this.seasonService.getPlayerLevelById(playerLevelId);

            if (this.currentPlayerLevel) {
              this.currentPlayerLevelCode = this.currentPlayerLevel.code;
              this.currentPlayerLevelId = this.currentPlayerLevel.id;
              console.log('Level Code:', this.currentPlayerLevelCode);

              this.listPlayers(() => this.initializePositions());
            } else {
              console.warn('Player level not found for ID:', playerLevelId);
            } console.log('Level Code:', this.currentPlayerLevelCode);
          }
        });
        this.loadTeamSeasons();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  listPlayers(callback?: () => void) {
    console.log('Calling getPlayers API with season:', this.currentSeason);

    

    this.playerService.getPlayers(this.currentPlayerLevelId, this.currentSeasonId).subscribe(
      data => {
        console.log('API response:', data);
        this.players = data;
        if (callback) callback();
      },
      error => {
        console.error('API error:', error);
      }
    );
  }

  loadTeamSeasons() {
    this.playerService.getTeamSeasons(this.currentSeasonId).subscribe(
      data => {
        this.teamSeasons = data;
      }
    );
  }

  initializePositions() {
    
    const board = this.el.nativeElement.querySelector('#auction-board');
    if (!board) {     
      return;
    }
    const boardWidth = board.clientWidth;
    const boxWidth = 70; // auction-box width
    const boxHeight = 35; // auction-box height
    const gap = 10; // gap between boxes
    const itemsPerRow = Math.floor((boardWidth - gap) / (boxWidth + gap));
    
    this.boxPositions.clear();
    
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      
      const left = gap + col * (boxWidth + gap);
      const top = gap + row * (boxHeight + gap);
      
      this.boxPositions.set(player.code, { top, left });
    }
  }

  toggleAnimation() {
    this.animationOn = !this.animationOn;
    if (this.animationOn) {
      for (let i = 0; i < this.players.length; i++) {
        this.animateBox(i);
      }
    } else {
      this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
      this.animationFrames = [];
    }
  }

  animateBox(index: number) {
    if (!this.animationOn) return;
    
    const board = this.el.nativeElement.querySelector('#auction-board');
    if (!board) return;
    
    const player = this.players[index];
    if (!player) return;
    
    const box = this.el.nativeElement.querySelector(`#player-${player.code}`);
    if (!box) return;
    
    const maxTop = board.clientHeight - box.clientHeight;
    const maxLeft = board.clientWidth - box.clientWidth;
    
    const newTop = Math.floor(Math.random() * maxTop);
    const newLeft = Math.floor(Math.random() * maxLeft);
    
    this.boxPositions.set(player.code, { top: newTop, left: newLeft });
    
    const frame = requestAnimationFrame(() => this.animateBox(index));
    this.animationFrames.push(frame);
  }

  choseThis(index: number) {
    if (this.selectedPlayerCode) return;
    
    const player = this.players[index];
    if (!player) return;
    
    this.selectedPlayerCode = player.code;
    this.selectedPlayer = player;
    
    const box = this.el.nativeElement.querySelector(`#player-${player.code}`);
    const container = this.el.nativeElement.querySelector('.section-box-inner');
    const stage = this.el.nativeElement.querySelector('#stage');
    
    if (!box || !container || !stage) return;
    
    const boxRect = box.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    
    const position = this.boxPositions.get(player.code);
    if (!position) return;
    
    const originalTop = position.top;
    const originalLeft = position.left;
    
    box.setAttribute('data-original-top', originalTop.toString());
    box.setAttribute('data-original-left', originalLeft.toString());
    
    this.renderer.setStyle(box, 'position', 'fixed');
    this.renderer.setStyle(box, 'z-index', '99999');
    this.renderer.setStyle(stage, 'z-index', '-1');
    
    const centerTop = (container.clientHeight - box.clientHeight) / 2;
    const centerLeft = (container.clientWidth - box.clientWidth);
    
    this.animateElement(box, { top: centerTop, left: centerLeft }, 500, () => {
      const finalTop = (stageRect.top - containerRect.top) + (stage.clientHeight - box.clientHeight) / 2;
      const finalLeft = container.clientWidth + (stageRect.left - (containerRect.left + container.clientWidth)) + (stage.clientWidth - box.clientWidth) / 2;
      
      this.animateElement(box, { top: finalTop, left: finalLeft }, 500, () => {
        this.renderer.setStyle(stage, 'z-index', '1');
        this.renderer.setStyle(box, 'display', 'none');
        this.showEnvelope = true;
      });
    });
  }

  closeEnvelope() {
    this.envelopeOpen = false;
    this.showEnvelope = false;
  }

  clearPlayerSelection() {
    this.selectedPlayerCode = null;
    this.selectedPlayer = null;
  }

  sendBack() {
    if (!this.selectedPlayerCode) return;
    
    this.closeEnvelope();
    
    const box = this.el.nativeElement.querySelector(`#player-${this.selectedPlayerCode}`);
    const container = this.el.nativeElement.querySelector('.section-box-inner');
    const stage = this.el.nativeElement.querySelector('#stage');
    
    if (!box || !container) return;
    
    this.renderer.setStyle(box, 'display', 'block');
    this.renderer.setStyle(box, 'position', 'fixed');
    this.renderer.setStyle(stage, 'z-index', '-1');
    this.renderer.setStyle(box, 'z-index', '99999');
    
    
    const originalTop = parseFloat(box.getAttribute('data-original-top'));
    const originalLeft = parseFloat(box.getAttribute('data-original-left'));
    
    const centerTop = (container.clientHeight - box.clientHeight) / 2;
    const centerLeft = (container.clientWidth - box.clientWidth);
    
    this.animateElement(box, { top: centerTop, left: centerLeft }, 500, () => {
      this.animateElement(box, { top: originalTop, left: originalLeft }, 500, () => {
        this.renderer.setStyle(stage, 'z-index', '1');
        this.renderer.setStyle(box, 'z-index', '');
        this.clearPlayerSelection();
      });
    });
  }

  openEnvelop(event: Event) {
    if ((event.target as HTMLElement).tagName === 'A') return;
    this.envelopeOpen = !this.envelopeOpen;
  }

  populatePlayerData() {
    if (this.selectedPlayer) {
      this.displayedPlayer = this.selectedPlayer;
      this.playerForm = {
        teamSeasonCode: '',
        amount: null
      };
      this.selectedTeamSeason = null;
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTeamSeason(teamSeason: TeamSeason) {
    this.selectedTeamSeason = teamSeason;
    this.playerForm.teamSeasonCode = teamSeason.code;
    this.dropdownOpen = false;
  }

  savePlayer() {
    if (!this.playerForm.teamSeasonCode || !this.playerForm.amount) {
      alert('Please select team season and enter amount');
      return;
    }

    const confirmMessage = `Confirm player assignment:\n\nPlayer: ${this.selectedPlayer?.name}\nTeam: ${this.selectedTeamSeason?.team.name}\nAmount: $${this.playerForm.amount}\n\nProceed with save?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    const request = new PlayerTeamRequest(
      this.selectedPlayer?.code || '',
      this.playerForm.teamSeasonCode,
      this.playerForm.amount
    );

    this.playerService.savePlayerTeam(request).subscribe(
      response => {
        alert('Player saved successfully!');
        this.resetFormData();
        this.closeEnvelope();
        this.clearPlayerSelection();
        this.listPlayers();
        this.loadTeamSeasons();
      },
      error => {
        alert('Error saving player: ' + error.message);
      }
    );
  }

  resetFormData() {
    this.playerForm = {
      teamSeasonCode: '',
      amount: null
    };
    this.selectedTeamSeason = null;
    this.displayedPlayer = null;
  }

  cancelSelection() {
    this.resetFormData();
    this.sendBack();
  }

  toggleBudgetTable() {
    this.showBudgetTable = !this.showBudgetTable;
  }

  getProgressPercentage(teamSeason: TeamSeason): number {
    return ((teamSeason?.totalAmountSpent || 0) / (teamSeason?.season?.budgetLimit || 1)) * 100;
  }

  getPlayerLevelColor(playerLevelCode: string): string {
    const colors: { [key: string]: string } = {
      'l1': '#dc3545', // red
      'l2': '#fd7e14', // orange
      'l3': '#ffc107', // yellow
      'l4': '#198754', // green
      'l5': '#0d6efd', // blue
      'l6': '#6f42c1'  // purple
    };
    return colors[playerLevelCode] || '#6c757d';
  }

  getPlayerLevelPercentage(teamSeason: TeamSeason, playerLevel: any): number {
    const budgetLimit = teamSeason?.season?.budgetLimit || 1;
    return ((playerLevel?.totalAmountSpent || 0) / budgetLimit) * 100;
  }

  private animateElement(element: any, target: any, duration: number, callback?: () => void) {
    const start = {
      top: parseFloat(element.style.top) || 0,
      left: parseFloat(element.style.left) || 0
    };
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentTop = start.top + (target.top - start.top) * progress;
      const currentLeft = start.left + (target.left - start.left) * progress;
      
      this.renderer.setStyle(element, 'top', `${currentTop}px`);
      this.renderer.setStyle(element, 'left', `${currentLeft}px`);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    };
    
    requestAnimationFrame(animate);
  }
}
