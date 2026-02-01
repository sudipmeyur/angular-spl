import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PlayerLevel } from '../../common/player-level';
import { Team } from '../../common/team';
import { PlayerService } from '../../services/player.service';
import { SeasonService } from '../../services/season.service';
import { UiService } from '../../services/ui.service';
import { ToastService } from '../../services/toast.service';
import { Season } from '../../common/season';
import { TeamSeason } from '../../common/team-season';
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
  itemsPerPage: number = 20;
  totalPages: number = 1;
  
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

  constructor(
    private playerService: PlayerService, 
    private seasonService: SeasonService, 
    private uiService: UiService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

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
        this.filterOutManagers();

        this.filterPlayers();
        this.recalculateCounts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading auction result players:', error);
        this.loadingError = 'Failed to load player data';
        this.isLoading = false;
      }
    });
  }
 filterOutManagers(): void {
  this.allPlayers = this.allPlayers.filter(p => !p.teamInfo?.isManager);
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

  // Recalculate counts - called after data updates
  recalculateCounts(): void {
    // Force Angular to detect changes by triggering change detection
    // This ensures the template re-evaluates the count methods
    this.playerLevels = [...this.playerLevels];
  }

  // Confirmation methods using global UiService
  showReleaseConfirmation(): void {
    if (!this.selectedPlayer) return;
    
    this.uiService.showConfirmation(
      {
        title: 'Release Player',
        message: `Are you sure you want to release ${this.selectedPlayer.player.name} from ${this.getPlayerTeam(this.selectedPlayer)?.name}?`,
        icon: 'fas fa-user-times',
        type: 'danger',
        confirmText: 'Release Player',
        cancelText: 'Cancel'
      },
      () => this.releasePlayer()
    );
  }

  showUnmarkConfirmation(): void {
    if (!this.selectedPlayer) return;
    
    this.uiService.showConfirmation(
      {
        title: 'Unmark Player',
        message: `Are you sure you want to unmark ${this.selectedPlayer.player.name} as unsold?`,
        icon: 'fas fa-undo',
        type: 'warning',
        confirmText: 'Unmark Player',
        cancelText: 'Cancel'
      },
      () => this.unmarkPlayer()
    );
  }

  private releasePlayer(): void {
    if (!this.selectedPlayer) return;
    
    const playerTeamCode = this.selectedPlayer.teamInfo?.playerTeamCode;
    
    if (!playerTeamCode) {
      this.uiService.showError('Unable to determine player team code for release');
      return;
    }

    this.uiService.showProcessing('Releasing player...');
    
    this.playerService.revertPlayerTeam(playerTeamCode).subscribe({
      next: () => {
        this.uiService.hideProcessing();
        this.closePanel();
        this.loadAuctionResultPlayers(this.currentSeason!.id);
        this.toastService.showSuccess('Player released successfully');
      },
      error: (error) => {
        this.uiService.hideProcessing();
        const errorMsg = error?.error?.message || error?.message || 'Unknown error occurred';
        this.toastService.showError('Failed to release player: ' + errorMsg);
      }
    });
  }

  private unmarkPlayer(): void {
    if (!this.selectedPlayer) return;
    
    const unsoldPlayerId = this.selectedPlayer.unsoldPlayerId;
    
    if (!unsoldPlayerId) {
      this.uiService.showError('Unable to determine unsold player ID for unmark');
      return;
    }

    this.uiService.showProcessing('Unmarking player...');
    
    this.playerService.revertUnsoldPlayer(unsoldPlayerId.toString()).subscribe({
      next: () => {
        this.uiService.hideProcessing();
        this.closePanel();
        this.loadAuctionResultPlayers(this.currentSeason!.id);
        this.toastService.showSuccess('Player unmarked successfully');
      },
      error: (error) => {
        this.uiService.hideProcessing();
        const errorMsg = error?.error?.message || error?.message || 'Unknown error occurred';
        this.toastService.showError('Failed to unmark player: ' + errorMsg);
      }
    });
  }

  // Category icon methods
  getCategoryIconPath(category: any): string {
    if (!category || !category.iconPath) {
      return 'external-images/images/player-categories/unknown.png';
    }
    return `${category.iconPath}`;
  }

  getCategoryIconAlt(category: any): string {
    return category ? category.name : 'Unknown Category';
  }
}
