import { Component, OnInit } from '@angular/core';
import { Player } from '../../common/player';
import { PlayerLevel } from '../../common/player-level';
import { Team } from '../../common/team';
import { PlayerService } from '../../services/player.service';
import { SeasonService } from '../../services/season.service';
import { Season } from '../../common/season';
import { TeamSeason } from '../../common/team-season';
import { PlayerTeamRequest } from '../../common/player-team-request';
import { PlayerTeamInfo } from '../../common/player-team-info';

@Component({
  selector: 'app-auction-modify',
  templateUrl: './auction-modify.component.html',
  styleUrls: ['./auction-modify.component.css']
})
export class AuctionModifyComponent implements OnInit {

  // Component state
  activeTab: string = 'l1';
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm: string = '';
  selectedPlayer: PlayerTeamInfo | null = null;
  panelClosing: boolean = false;
  
  // Pagination state
  currentPage: number = 1;
  itemsPerPage: number = 20; // Configurable items per page
  totalPages: number = 1;
  
  // Confirmation modal state
  showConfirmation: boolean = false;
  confirmationType: 'release' | 'unmark' = 'release';
  isProcessing: boolean = false;
  
  // Success toast
  showSuccessToast: boolean = false;
  successMessage: string = '';

  // Loading state
  isLoading: boolean = true;
  loadingError: string = '';

  // Backend data
  playerLevels: PlayerLevel[] = [];
  teamSeasons: TeamSeason[] = [];
  currentSeason: Season | null = null;

  allPlayers: PlayerTeamInfo[] = [];

  filteredPlayers: PlayerTeamInfo[] = [];
  paginatedPlayers: PlayerTeamInfo[] = []; // Players for current page

  constructor(private playerService: PlayerService, private seasonService: SeasonService) { }

  ngOnInit(): void {
    this.seasonService.currentSeason$.subscribe(season => {
      if (season) {
        this.currentSeason = season;
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.loadingError = '';

    // Get current season from SeasonService
    this.currentSeason = this.seasonService.getCurrentSeason();
    
    if (!this.currentSeason) {
      this.loadingError = 'No current season available';
      this.isLoading = false;
      return;
    }

    // Get player levels from SeasonService
    const playerLevelMap = this.seasonService.getPlayerLevelMap();
    
    if (!playerLevelMap || playerLevelMap.size === 0) {
      this.loadingError = 'Failed to load player levels';
      this.isLoading = false;
      return;
    }

    // Convert Map to Array for template compatibility
    this.playerLevels = Array.from(playerLevelMap.values());

    // Load all auction result players in a single network call
    this.loadAuctionResultPlayers(this.currentSeason.id);
  }

  private loadAuctionResultPlayers(seasonId: number): void {
    this.playerService.getAuctionResultPlayers(seasonId).subscribe({
      next: (playerTeamInfos: PlayerTeamInfo[]) => {
        // Use PlayerTeamInfo directly
        this.allPlayers = playerTeamInfos;

        this.filterPlayers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading auction result players:', error);
        this.loadingError = 'Failed to load player data';
        this.isLoading = false;
      }
    });
  }

  // Tab management
  switchTab(tabCode: string): void {
    this.activeTab = tabCode;
    this.selectedPlayer = null;
    this.currentPage = 1; // Reset to first page when switching tabs
    this.filterPlayers();
  }

  // View mode management
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  // Player filtering with pagination
  filterPlayers(): void {
    let players = this.allPlayers;

    // Filter by active tab
    if (this.activeTab === 'unsold') {
      players = players.filter(p => p.isUnsold);
    } else {
      players = players.filter(p => p.player.playerLevel.code === this.activeTab && !p.isUnsold);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      players = players.filter(p => 
        p.player.name.toLowerCase().includes(term) || 
        p.player.code.toLowerCase().includes(term)
      );
    }

    this.filteredPlayers = players;
    this.calculatePagination();
    this.updatePaginatedPlayers();
  }

  // Pagination methods
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPlayers.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  updatePaginatedPlayers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPlayers = this.filteredPlayers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedPlayers();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  changeItemsPerPage(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.calculatePagination();
    this.updatePaginatedPlayers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredPlayers.length);
  }

  // Player selection
  selectPlayer(player: PlayerTeamInfo): void {
    this.selectedPlayer = player;
    this.panelClosing = false;
  }

  editPlayer(player: PlayerTeamInfo, event: Event): void {
    event.stopPropagation();
    this.selectPlayer(player);
  }

  closePanel(): void {
    this.panelClosing = true;
    setTimeout(() => {
      this.selectedPlayer = null;
      this.panelClosing = false;
    }, 300);
  }

  // Player status helpers
  isPlayerSold(player: PlayerTeamInfo): boolean {
    return !!player.teamInfo && !player.isUnsold;
  }

  isPlayerUnsold(player: PlayerTeamInfo): boolean {
    return !!player.isUnsold;
  }

  getPlayerStatus(player: PlayerTeamInfo): string {
    if (player.isUnsold) return 'Unsold';
    if (player.teamInfo) return 'Sold';
    return 'Available';
  }

  getPlayerStatusClass(player: PlayerTeamInfo): string {
    if (player.isUnsold) return 'status-unsold';
    if (player.teamInfo) return 'status-sold';
    return 'status-available';
  }

  getPlayerStatusIcon(player: PlayerTeamInfo): string {
    if (player.isUnsold) return 'fas fa-times-circle';
    if (player.teamInfo) return 'fas fa-check-circle';
    return 'fas fa-clock';
  }

  getPlayerTeam(player: PlayerTeamInfo): Team | null {
    return player.teamInfo?.team || null;
  }

  getPlayerAmount(player: PlayerTeamInfo): number {
    return player.teamInfo?.soldAmount || 0;
  }

  isRtmUsed(player: PlayerTeamInfo): boolean {
    return player.teamInfo?.isRtmUsed || false;
  }

  // Count helpers
  getSoldCount(levelCode: string): number {
    return this.allPlayers.filter(p => 
      p.player.playerLevel.code === levelCode && 
      this.isPlayerSold(p)
    ).length;
  }

  getUnsoldCount(levelCode: string): number {
    return this.allPlayers.filter(p => 
      p.player.playerLevel.code === levelCode && 
      p.isUnsold
    ).length;
  }

  getTotalUnsoldCount(): number {
    return this.allPlayers.filter(p => p.isUnsold).length;
  }

  // Confirmation modal methods
  showReleaseConfirmation(): void {
    this.confirmationType = 'release';
    this.showConfirmation = true;
  }

  showUnmarkConfirmation(): void {
    this.confirmationType = 'unmark';
    this.showConfirmation = true;
  }

  cancelAction(): void {
    this.showConfirmation = false;
    this.isProcessing = false;
  }

  confirmAction(): void {
    if (!this.selectedPlayer) return;

    this.isProcessing = true;

    if (this.confirmationType === 'release') {
      // Build PlayerTeamRequest for releasing a player
      const request = new PlayerTeamRequest(
        this.selectedPlayer.player.code,           // playerCode
        this.selectedPlayer.teamInfo?.team?.code || '',  // teamSeasonCode
        this.selectedPlayer.teamInfo?.soldAmount || 0,   // soldAmount
        undefined,                           // code (optional)
        this.currentSeason?.code,            // seasonCode
        false,                               // isFree
        this.selectedPlayer.teamInfo?.isRtmUsed || false,    // isRtmUsed
        false,                               // isUnsold
        false                                // isManager
      );

      this.playerService.savePlayerTeam(request).subscribe({
        next: () => {
          this.releasePlayer();
          this.isProcessing = false;
          this.showConfirmation = false;
          this.closePanel();
          this.filterPlayers();
          this.showSuccessMessage();
        },
        error: (error) => {
          console.error('Error releasing player:', error);
          this.loadingError = 'Failed to release player';
          this.isProcessing = false;
          this.showConfirmation = false;
        }
      });
    } else {
      // Build PlayerTeamRequest for unmarking unsold player
      const request = new PlayerTeamRequest(
        this.selectedPlayer.player.code,           // playerCode
        '',                                  // teamSeasonCode (empty for unsold)
        0,                                   // soldAmount
        undefined,                           // code (optional)
        this.currentSeason?.code,            // seasonCode
        false,                               // isFree
        false,                               // isRtmUsed
        true,                                // isUnsold
        false                                // isManager
      );

      this.playerService.saveUnsoldPlayer(request).subscribe({
        next: () => {
          this.unmarkPlayer();
          this.isProcessing = false;
          this.showConfirmation = false;
          this.closePanel();
          this.filterPlayers();
          this.showSuccessMessage();
        },
        error: (error) => {
          console.error('Error unmarking player:', error);
          this.loadingError = 'Failed to unmark player';
          this.isProcessing = false;
          this.showConfirmation = false;
        }
      });
    }
  }

  private releasePlayer(): void {
    if (this.selectedPlayer) {
      this.selectedPlayer.teamInfo = undefined;
      this.successMessage = `${this.selectedPlayer.player.name} has been released from the team.`;
    }
  }

  private unmarkPlayer(): void {
    if (this.selectedPlayer) {
      this.selectedPlayer.isUnsold = false;
      this.successMessage = `${this.selectedPlayer.player.name} has been unmarked as unsold.`;
    }
  }

  private showSuccessMessage(): void {
    this.showSuccessToast = true;
    setTimeout(() => {
      this.showSuccessToast = false;
    }, 3000);
  }

  // Confirmation modal helpers
  getConfirmationTitle(): string {
    return this.confirmationType === 'release' ? 'Release Player' : 'Unmark Player';
  }

  getConfirmationMessage(): string {
    if (!this.selectedPlayer) return '';
    
    if (this.confirmationType === 'release') {
      return `Are you sure you want to release ${this.selectedPlayer.player.name} from ${this.getPlayerTeam(this.selectedPlayer)?.name}?`;
    } else {
      return `Are you sure you want to unmark ${this.selectedPlayer.player.name} as unsold?`;
    }
  }

  getConfirmationIcon(): string {
    return this.confirmationType === 'release' ? 'fas fa-user-times' : 'fas fa-undo';
  }

  getConfirmationButtonClass(): string {
    return this.confirmationType === 'release' ? 'btn-danger' : 'btn-warning';
  }

  getConfirmationButtonText(): string {
    if (this.isProcessing) {
      return this.confirmationType === 'release' ? 'Releasing...' : 'Unmarking...';
    }
    return this.confirmationType === 'release' ? 'Release Player' : 'Unmark Player';
  }
}
