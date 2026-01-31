import { Component, OnInit, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Player } from 'src/app/common/player';
import { PlayerService } from 'src/app/services/player.service';
import { PlayerTeamRequest } from 'src/app/common/player-team-request';
import { TeamSeason } from 'src/app/common/team-season';
import { ActivatedRoute } from '@angular/router';
import { SeasonService } from 'src/app/services/season.service';
import { Season } from 'src/app/common/season';
import { UnsoldType } from 'src/app/common/unsold-type';
import { UiService } from 'src/app/services/ui.service';
import { ToastService } from 'src/app/services/toast.service';

interface ShuffleCard {
  teamSeason: TeamSeason;
  isFlipped: boolean;
  isSelected: boolean;
  isSelectable?: boolean;
  reason?: string;
}

interface TeamSeasonWithStatus {
  teamSeason: TeamSeason;
  isSelectable: boolean;
  reason?: string;
}

@Component({
  selector: 'app-player-unsold',
  templateUrl: './player-unsold.component.html',
  styleUrls: ['./player-unsold.component.css']
})
export class PlayerUnsoldComponent implements OnInit {

  unsoldTypeCode: string = 'us';
  unsoldTypeId: number = 1;
  currentSeason: Season | null = null;
  unsoldType: UnsoldType | null |undefined = null;
  currentSeasonCode: string = 's6';
  currentSeasonId: number = 6;

  players: Player[] = [];
  teamSeasons: TeamSeason[] = [];
  selectableTeamSeasons: TeamSeason[] = [];
  allTeamSeasonsWithStatus: TeamSeasonWithStatus[] = [];
  
  dropdownOpen = false;
  animationOn = false;
  showEnvelope = false;
  envelopeOpen = false;

  // Shuffle Cards Properties
  selectionMode: 'manual' | 'shuffle' = 'manual';
  shuffleCardsList: ShuffleCard[] = [];
  isShuffling = false;
  hasSelectedCard = false;

  selectedTeamSeason: TeamSeason | null = null;
  selectedPlayerCode: string | null = null;
  selectedPlayer: Player | null = null;
  displayedPlayer: Player | null = null;

  boxPositions = new Map<string, { top: number, left: number }>();
  animationFrames: any[] = [];
  showBudgetTable = false;
  
  playerForm: {
    teamSeasonCode: string;
    amount: number | null;
    isRtmUsed: boolean;
  } = {
    teamSeasonCode: '',
    amount: null,
    isRtmUsed: false
  };
  

  constructor(
    private playerService: PlayerService,
    private seasonService: SeasonService,
    private el: ElementRef,
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private uiService: UiService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.seasonService.currentSeason$.subscribe(season => {
      if (season) {
        this.currentSeason = season;
        this.currentSeasonCode = season?.code || this.currentSeasonCode;
        this.currentSeasonId = season.id;




        // Clear any existing player selection when navigating to different level
        this.clearAllPlayerSelections();

        this.unsoldType = new UnsoldType(1, 'us', 'Unsold', this.currentSeason.minPlayerAmount, false, true, true);

        if (this.unsoldType) {
          this.unsoldTypeCode = this.unsoldType.code;
          this.unsoldTypeId = this.unsoldType.id;
          this.playerForm.amount = this.unsoldType.baseAmount || 0;
          console.log('Player level changed to:', this.unsoldTypeCode, 'isFree:', this.unsoldType.isFree);

          // Ensure selection mode is valid for current player level
          if (this.selectionMode === 'shuffle' && !this.isShuffleCardsEnabled()) {
            this.selectionMode = 'manual';
            this.resetShuffle();
          }

          // Always rebuild selectable team seasons when player level changes
          // This ensures the filtering is applied based on the new player level properties
          this.rebuildSelectableTeamSeasons();

          this.listPlayers(() => this.initializePositions());
        } else {
          console.warn('Unsold Type Id not found for ID:', this.unsoldTypeId);
        }


        this.loadTeamSeasons();
      }
    });
  }

  ngOnDestroy(): void {
    
    this.resetFormData();
    this.closeEnvelope();
    this.clearPlayerSelection();
  }

  listPlayers(callback?: () => void) {
    console.log('Calling getPlayers API with season:', this.currentSeason);

    this.uiService.showProcessing('Loading players...');

    this.playerService.getUnsoldPlayers(this.currentSeasonId).subscribe(
      data => {
        console.log('API response:', data);
        this.players = data;
        this.uiService.hideProcessing();
        if (callback) callback();
      },
      error => {
        console.error('API error:', error);
        this.uiService.hideProcessing();
        this.toastService.showError('Failed to load players: ' + error.message);
      }
    );
  }

  loadTeamSeasons() {
    console.log('Loading team seasons from API for season ID:', this.currentSeasonId);
    this.playerService.getTeamSeasons(this.currentSeasonId).subscribe(
      data => {
        console.log('Team seasons loaded from API:', data.length, 'teams');
        this.teamSeasons = data;
        // Always rebuild selectable team seasons after loading from API
        // This ensures the filtering is applied based on current player level
        this.rebuildSelectableTeamSeasons();
      },
      error => {
        console.error('Error loading team seasons:', error);
        // Initialize empty arrays on error
        this.teamSeasons = [];
        this.selectableTeamSeasons = [];
        this.initializeShuffleCards();
      }
    );
  }

  rebuildSelectableTeamSeasons() {
    console.log('=== REBUILDING SELECTABLE TEAM SEASONS ===');
    console.log('Current player level:', this.unsoldType?.code, 'isFree:', this.unsoldType?.isFree);
    console.log('Current season:', this.currentSeason?.code);
    console.log('Total team seasons available:', this.teamSeasons?.length || 0);
    console.log('Shuffle cards enabled:', this.isShuffleCardsEnabled());
    
    // If team seasons haven't been loaded yet, initialize empty array and return
    if (!this.teamSeasons || this.teamSeasons.length === 0) {
      console.log('Team seasons not loaded yet, initializing empty selectable teams');
      this.selectableTeamSeasons = [];
      this.allTeamSeasonsWithStatus = [];
      // Only initialize shuffle cards if shuffle mode is enabled
      if (this.isShuffleCardsEnabled()) {
        this.initializeShuffleCards();
      } else {
        console.log('Skipping shuffle cards initialization - shuffle mode disabled');
        this.clearShuffleCardData();
      }
      return;
    }
    
    // Store previous selectable teams for comparison
    const previousSelectableTeams = this.selectableTeamSeasons.map(ts => ts.code);
    
    // Build team seasons with status for both dropdown and shuffle cards
    this.allTeamSeasonsWithStatus = this.teamSeasons.map(teamSeason => {
      let isSelectable = true;
      let reason = '';
      
      if(this.currentSeason){
        // Check player limit
        if(this.currentSeason.maxPlayersAllowed <= (teamSeason.totalPlayer || 0)) {
          isSelectable = false;
          reason = `Players Full (${teamSeason.totalPlayer}/${this.currentSeason.maxPlayersAllowed})`;
        }
        
        // Check free player limit for free levels
        if(isSelectable && (this.unsoldType && this.unsoldType.isFree)){
          if(this.currentSeason.maxFreeAllowed <= (teamSeason.totalFreeUsed || 0)) {
            isSelectable = false;
            reason = `Free Players Full (${teamSeason.totalFreeUsed}/${this.currentSeason.maxFreeAllowed})`;
          }
        }
      } else {
        isSelectable = false;
        reason = 'No season data';
      }
      
      return {
        teamSeason,
        isSelectable,
        reason: isSelectable ? undefined : reason
      };
    });
    
    // Extract selectable teams for backward compatibility
    this.selectableTeamSeasons = this.allTeamSeasonsWithStatus
      .filter(item => item.isSelectable)
      .map(item => item.teamSeason);
    
    // Check if the selectable teams have changed
    const newSelectableTeams = this.selectableTeamSeasons.map(ts => ts.code);
    const teamsChanged = JSON.stringify(previousSelectableTeams.sort()) !== JSON.stringify(newSelectableTeams.sort());
    
    console.log('Final selectable team seasons count:', this.selectableTeamSeasons.length, 'out of', this.teamSeasons.length);
    console.log('Final selectable teams:', this.selectableTeamSeasons.map(ts => ts.team.name));
    console.log('Teams changed:', teamsChanged);
    
    // If the currently selected team is no longer selectable, clear the selection
    if (this.selectedTeamSeason && !this.selectableTeamSeasons.find(ts => ts.code === this.selectedTeamSeason!.code)) {
      console.log('Currently selected team is no longer selectable, clearing selection');
      this.selectedTeamSeason = null;
      this.playerForm.teamSeasonCode = '';
      this.dropdownOpen = false;
    }
    
    console.log('=== REBUILD COMPLETE ===');
    
    // Only initialize shuffle cards if shuffle mode is enabled
    if (this.isShuffleCardsEnabled()) {
      console.log('Initializing shuffle cards for', this.allTeamSeasonsWithStatus.length, 'teams');
      this.initializeShuffleCards();
    } else {
      console.log('Skipping shuffle cards initialization - shuffle mode disabled');
      this.clearShuffleCardData();
    }
  }

  initializeShuffleCards() {
    this.shuffleCardsList = this.allTeamSeasonsWithStatus.map(item => ({
      teamSeason: item.teamSeason,
      isFlipped: false,
      isSelected: false,
      isSelectable: item.isSelectable,
      reason: item.reason
    }));
  }

  clearShuffleCardData() {
    console.log('Clearing shuffle card data - shuffle mode disabled');
    this.shuffleCardsList = [];
    this.isShuffling = false;
    this.hasSelectedCard = false;
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

    if (this.selectedPlayerCode) {
      if(this.animationOn){
        this.animationOn = !this.animationOn;
        this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
        this.animationFrames = [];
      } 
      return;
    }

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
    if (this.selectedPlayerCode || this.animationOn) return;
    
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
    
    // this.renderer.setStyle(box, 'position', 'fixed');
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
    // this.renderer.setStyle(box, 'position', 'fixed');
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
      
      // Set default amount based on player level
      let defaultAmount: number | null = null;
      
      if (this.unsoldType) {
        if (this.unsoldType.isFree) {
          // If player level is free, amount should be 0
          defaultAmount = 0;
        } else {
          // Set default amount to player level's base amount
          defaultAmount = this.unsoldType.baseAmount || null;
        }
      }
      
      this.playerForm = {
        teamSeasonCode: '',
        amount: defaultAmount,
        isRtmUsed: false
      };
      this.selectedTeamSeason = null;
      
      console.log('Player data populated with default amount:', defaultAmount, 'isFree:', this.unsoldType?.isFree);
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTeamSeason(teamSeason: TeamSeason) {
    this.selectedTeamSeason = teamSeason;
    this.playerForm.teamSeasonCode = teamSeason.code;
    this.dropdownOpen = false;
    
    // Reset RTM state when selecting a new team to ensure proper state management
    // If the new team has exhausted RTM slots, turn OFF RTM automatically
    if (this.playerForm.isRtmUsed && this.isRtmDisabled()) {
      this.playerForm.isRtmUsed = false;
      console.log('RTM automatically turned OFF due to team RTM exhaustion');
    }
  }

  saveSoldPlayer() {
    if (!this.displayedPlayer) {
      this.uiService.showAlert(
        'Validation Error',
        'Please select player',
        'warning'
      );
      return;
    } else if (!this.playerForm.teamSeasonCode || !this.playerForm.amount) {
      this.uiService.showAlert(
        'Validation Error',
        'Please select team season and enter amount',
        'warning'
      );
      return;
    }

    const confirmMessage = `Confirm player assignment:\n\nPlayer: ${this.selectedPlayer?.name}\nTeam: ${this.selectedTeamSeason?.team.name}\nAmount: ₹${this.playerForm.amount}\nRTM: ${this.playerForm.isRtmUsed ? 'YES' : 'NO'}`;
    
    console.log('saveSoldPlayer: Showing confirmation dialog');
    
    this.uiService.showConfirmation(
      {
        title: 'Confirm Player Assignment',
        message: confirmMessage,
        icon: 'fas fa-check-circle',
        confirmText: 'Save',
        cancelText: 'Cancel',
        type: 'success'
      },
      () => {
        console.log('saveSoldPlayer: Confirmation callback executed');
        
        const request = new PlayerTeamRequest(
          this.selectedPlayer?.code || '',
          this.playerForm.teamSeasonCode,
          this.playerForm.amount || 0,
          '',
          '',
          this.unsoldType?.isFree,
          this.playerForm.isRtmUsed,
          this.unsoldType?.isUnsold,
          false
        );

        console.log('saveSoldPlayer: Showing processing loader');
        this.uiService.showProcessing('Saving player...');

        this.playerService.savePlayerTeam(request).subscribe(
          () => {
            console.log('saveSoldPlayer: API call successful');
            this.uiService.hideProcessing();
            this.toastService.showSuccess(`${this.selectedPlayer?.name} sold to ${this.selectedTeamSeason?.team.name} for ₹${this.playerForm.amount}`);
            this.resetFormData();
            this.closeEnvelope();
            this.clearPlayerSelection();
            this.listPlayers();
            this.loadTeamSeasons();
          },
          error => {
            console.error('saveSoldPlayer: API call failed', error);
            this.uiService.hideProcessing();
            this.toastService.showError(`Failed to save ${this.selectedPlayer?.name}. Please try again.`);
          }
        );
      }
    );
  }


  resetFormData() {
    // Set default amount based on player level
    let defaultAmount: number | null = null;
    
    if (this.unsoldType) {
      if (this.unsoldType.isFree) {
        // If player level is free, amount should be 0
        defaultAmount = 0;
      } else {
        // Set default amount to player level's base amount
        defaultAmount = this.unsoldType.baseAmount || null;
      }
    }
    
    this.playerForm = {
      teamSeasonCode: '',
      amount: defaultAmount,
      isRtmUsed: false
    };
    this.selectedTeamSeason = null;
    this.displayedPlayer = null;
    
    console.log('Form data reset with default amount:', defaultAmount);
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

  // Shuffle Cards Methods
  setSelectionMode(mode: 'manual' | 'shuffle') {
    // Prevent switching to shuffle mode if it's not enabled
    if (mode === 'shuffle' && !this.isShuffleCardsEnabled()) {
      return;
    }
    
    this.selectionMode = mode;
    if (mode === 'manual') {
      this.resetShuffle();
    } else {
      // Only process shuffle cards if shuffle mode is enabled
      if (this.isShuffleCardsEnabled()) {
        this.dropdownOpen = false;
        this.selectedTeamSeason = null;
      }
    }
  }

  isShuffleCardsEnabled(): boolean {
    return this.unsoldType?.isRandomTeamSelection === true;
  }

  shuffleCards() {
    // Skip processing if shuffle cards are not enabled
    if (!this.isShuffleCardsEnabled()) {
      console.log('Shuffle cards processing skipped - shuffle mode disabled');
      return;
    }
    
    if (this.isShuffling || this.hasSelectedCard) return;
    
    this.isShuffling = true;
    this.hasSelectedCard = false;
    
    // Reset all cards
    this.shuffleCardsList.forEach(card => {
      card.isFlipped = false;
      card.isSelected = false;
    });
    
    // Only shuffle selectable cards
    const selectableCards = this.shuffleCardsList.filter(card => card.isSelectable);
    
    if (selectableCards.length === 0) {
      console.warn('No selectable teams available for shuffle');
      this.isShuffling = false;
      return;
    }
    
    // Create a fresh copy and properly shuffle using Fisher-Yates algorithm
    const shuffledArray = [...this.shuffleCardsList];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    
    // Update the array reference to trigger change detection
    this.shuffleCardsList = shuffledArray;
    
    // Debug: Log the shuffled order
    console.log('Shuffled order:', this.shuffleCardsList.map((card, index) => 
      `${index}: ${card.teamSeason.team.name} (${card.isSelectable ? 'selectable' : 'disabled'})`
    ));
    
    // Shuffle animation duration
    setTimeout(() => {
      // Generate a truly random index from selectable cards only
      const selectableIndices = this.shuffleCardsList
        .map((card, index) => card.isSelectable ? index : -1)
        .filter(index => index !== -1);
      
      const randomSelectableIndex = Math.floor(Math.random() * selectableIndices.length);
      const selectedIndex = selectableIndices[randomSelectableIndex];
      
      console.log('Selected random index:', selectedIndex, 'out of', this.shuffleCardsList.length);
      console.log('Selected team:', this.shuffleCardsList[selectedIndex]?.teamSeason?.team?.name);
      
      this.selectCard(selectedIndex);
      this.isShuffling = false;
    }, 2000); // 2 second shuffle animation
  }

  selectCard(index: number) {
    // Skip processing if shuffle cards are not enabled
    if (!this.isShuffleCardsEnabled()) {
      console.log('Card selection processing skipped - shuffle mode disabled');
      return;
    }
    
    if (this.isShuffling || this.hasSelectedCard) return;
    
    const selectedCard = this.shuffleCardsList[index];
    if (!selectedCard) {
      console.error('No card found at index:', index);
      return;
    }
    
    // Prevent selection of non-selectable cards
    if (!selectedCard.isSelectable) {
      console.warn('Cannot select non-selectable team:', selectedCard.teamSeason.team.name, 'Reason:', selectedCard.reason);
      return;
    }
    
    console.log('Selecting card at index:', index);
    console.log('Card details:', selectedCard.teamSeason.team.name);
    
    // Flip and select the card
    selectedCard.isFlipped = true;
    selectedCard.isSelected = true;
    
    // Set the selected team season
    this.selectedTeamSeason = selectedCard.teamSeason;
    this.playerForm.teamSeasonCode = selectedCard.teamSeason.code;
    this.hasSelectedCard = true;
    
    // Reset RTM state when selecting a new team via shuffle to ensure proper state management
    // If the new team has exhausted RTM slots, turn OFF RTM automatically
    if (this.playerForm.isRtmUsed && this.isRtmDisabled()) {
      this.playerForm.isRtmUsed = false;
      console.log('RTM automatically turned OFF due to team RTM exhaustion (shuffle selection)');
    }
    
    console.log('Selected team season:', this.selectedTeamSeason.team.name);
    
    // Add a small delay for visual effect
    setTimeout(() => {
      // Optional: Add some celebration effect here
    }, 500);
  }

  resetShuffle() {
    // Skip processing if shuffle cards are not enabled
    if (!this.isShuffleCardsEnabled()) {
      console.log('Shuffle reset processing skipped - shuffle mode disabled');
      return;
    }
    
    // Reset to original order and clear selections
    this.shuffleCardsList = this.allTeamSeasonsWithStatus.map(item => ({
      teamSeason: item.teamSeason,
      isFlipped: false,
      isSelected: false,
      isSelectable: item.isSelectable,
      reason: item.reason
    }));
    this.hasSelectedCard = false;
    this.isShuffling = false;
    this.selectedTeamSeason = null;
    this.playerForm.teamSeasonCode = '';
  }

  toggleRtm() {
    // Prevent toggling if RTM is disabled
    if (this.isRtmDisabled()) {
      // Provide user feedback when RTM toggle is disabled
      if (!this.selectedTeamSeason) {
        console.warn('Cannot toggle RTM: No team selected');
      } else if (!this.currentSeason) {
        console.warn('Cannot toggle RTM: No season data available');
      } else if (!this.selectedTeamSeason.isRtmEligible) {
        console.warn(`Cannot enable RTM: Team ${this.selectedTeamSeason.team.name} is not eligible for RTM`);
      } else {
        const rtmUsed = this.selectedTeamSeason.totalRtmUsed || 0;
        const maxRtmAllowed = this.currentSeason.maxRtmAllowed || 0;
        console.warn(`Cannot enable RTM: Team has exhausted all RTM slots (${rtmUsed}/${maxRtmAllowed})`);
      }
      return;
    }
    
    this.playerForm.isRtmUsed = !this.playerForm.isRtmUsed;
    console.log(`RTM toggled: ${this.playerForm.isRtmUsed ? 'ON' : 'OFF'}`);
  }

  isRtmDisabled(): boolean {
    // RTM is disabled if no team is selected or no season data
    if (!this.selectedTeamSeason || !this.currentSeason) {
      return true;
    }

    // If RTM is currently ON, always allow turning it OFF (never disable when ON)
    if (this.playerForm.isRtmUsed) {
      return false;
    }

    // Check if the team season is RTM eligible
    if (!this.selectedTeamSeason.isRtmEligible) {
      return true;
    }

    // If RTM is currently OFF, only allow turning it ON if RTM slots are available
    const rtmUsed = this.selectedTeamSeason.totalRtmUsed || 0;
    const maxRtmAllowed = this.currentSeason.maxRtmAllowed || 0;
    
    // Disable RTM toggle when trying to turn ON RTM but team has exhausted all RTM slots
    return rtmUsed >= maxRtmAllowed;
  }

  isRtmExhausted(): boolean {
    if (!this.selectedTeamSeason || !this.currentSeason) {
      return false;
    }

    const rtmUsed = this.selectedTeamSeason.totalRtmUsed || 0;
    const maxRtmAllowed = this.currentSeason.maxRtmAllowed || 0;
    
    return rtmUsed >= maxRtmAllowed;
  }

  getRtmTooltip(): string | null {
    if (!this.selectedTeamSeason || !this.currentSeason) {
      return 'Please select a team first';
    }

    if (!this.selectedTeamSeason.isRtmEligible) {
      return `${this.selectedTeamSeason.team.name} is not eligible for RTM`;
    }

    const rtmUsed = this.selectedTeamSeason.totalRtmUsed || 0;
    const maxRtmAllowed = this.currentSeason.maxRtmAllowed || 0;
    
    if (rtmUsed >= maxRtmAllowed) {
      return `RTM exhausted for ${this.selectedTeamSeason.team.name} (${rtmUsed}/${maxRtmAllowed})`;
    }

    if (this.playerForm.isRtmUsed) {
      return `RTM is ON for ${this.selectedTeamSeason.team.name}`;
    }

    return `RTM available for ${this.selectedTeamSeason.team.name} (${rtmUsed}/${maxRtmAllowed})`;
  }

  clearAllPlayerSelections() {
    // Clear player selection state
    this.selectedPlayerCode = null;
    this.selectedPlayer = null;
    this.displayedPlayer = null;
    
    // Close envelope and reset envelope state
    this.showEnvelope = false;
    this.envelopeOpen = false;
    
    // Reset form data
    this.resetFormData();
    
    // Clear team selection
    this.selectedTeamSeason = null;
    this.dropdownOpen = false;
    
    // Reset shuffle card states only if shuffle mode is enabled
    if (this.isShuffleCardsEnabled()) {
      this.resetShuffle();
    } else {
      console.log('Skipping shuffle reset - shuffle mode disabled');
    }
    
    // Reset selection mode to manual if shuffle is not enabled
    if (this.selectionMode === 'shuffle' && !this.isShuffleCardsEnabled()) {
      this.selectionMode = 'manual';
    }
    
    console.log('All player selections cleared');
  }

  // Amount input methods
  isAmountReadonly(): boolean {
    return this.unsoldType?.isUnsold === true;
  }

}
