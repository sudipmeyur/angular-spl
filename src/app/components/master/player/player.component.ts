import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Player } from '../../../common/player';
import { PlayerLevel } from '../../../common/player-level';
import { PlayerService } from '../../../services/player.service';
import { SeasonService } from '../../../services/season.service';
import { UiService } from '../../../services/ui.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {

  // Component state
  activeTab: string = 'l1';
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm: string = '';
  selectedPlayer: Player | null = null;
  panelClosing: boolean = false;
  
  // Pagination state
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 1;
  
  // Form state
  isEditing: boolean = false;
  isCreating: boolean = false;
  editForm: Player | null = null;
  
  // Image upload state
  uploadMethod: 'file' | 'url' = 'url';
  selectedFile: File | null = null;
  isDragOver: boolean = false;
  imageStatus: string = '';
  suggestedFileName: string = '';
  
  // Confirmation modal state
  showConfirmation: boolean = false;
  confirmationType: 'delete' | 'cancel' = 'delete';
  isProcessing: boolean = false;
  
  // Toast notifications
  showSuccessToast: boolean = false;
  successMessage: string = '';
  showErrorToast: boolean = false;
  errorMessage: string = '';

  // Loading state
  isLoading: boolean = true;
  loadingError: string = '';

  // Backend data
  playerLevels: PlayerLevel[] = [];
  allPlayers: Player[] = [];
  filteredPlayers: Player[] = [];
  paginatedPlayers: Player[] = [];

  constructor(
    private playerService: PlayerService, 
    private seasonService: SeasonService, 
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('PlayerComponent initialized');
    this.loadData();
  }

  loadData(): void {
    console.log('Loading player data...');
    this.isLoading = true;
    this.loadingError = '';

    // Load player levels first
    this.playerService.getPlayerLevels().subscribe({
      next: (playerLevels: PlayerLevel[]) => {
        console.log('Player levels loaded from API:', playerLevels);
        this.playerLevels = playerLevels;
        
        // Also update the season service
        this.seasonService.setPlayerLevel(playerLevels);
        
        // Now load players
        this.loadActivePlayers();
      },
      error: (error) => {
        console.error('Error loading player levels:', error);
        this.loadingError = 'Failed to load player levels';
        this.isLoading = false;
      }
    });
  }

  private loadActivePlayers(): void {
    this.playerService.getActivePlayers().subscribe({
      next: (players: Player[]) => {
        this.allPlayers = players;
        this.filterPlayers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.loadingError = 'Failed to load player data';
        this.isLoading = false;
      }
    });
  }

  // Tab management
  switchTab(tabCode: string): void {
    this.activeTab = tabCode;
    this.selectedPlayer = null;
    this.currentPage = 1;
    this.filterPlayers();
  }

  // View mode management
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  // Player filtering with pagination
  filterPlayers(): void {
    let players = this.allPlayers;

    // Filter by active tab (player level)
    if (this.activeTab !== 'all') {
      players = players.filter(p => p.playerLevel.code === this.activeTab);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      players = players.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.code.toLowerCase().includes(term)
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
  selectPlayer(player: Player): void {
    this.selectedPlayer = player;
    this.panelClosing = false;
    this.resetForm();
  }

  viewPlayer(player: Player, event: Event): void {
    event.stopPropagation();
    this.selectPlayer(player);
  }

  closePanel(): void {
    this.panelClosing = true;
    setTimeout(() => {
      this.selectedPlayer = null;
      this.panelClosing = false;
      this.resetForm();
    }, 300);
  }

  // Debug method to test click events
  testClick(): void {
    console.log('Test button clicked - Click events are working!');
    console.log('Current state:');
    console.log('- isLoading:', this.isLoading);
    console.log('- playerLevels.length:', this.playerLevels.length);
    console.log('- loadingError:', this.loadingError);
    alert(`Click events work! State: isLoading=${this.isLoading}, playerLevels=${this.playerLevels.length}`);
  }

  // CRUD Operations
  createNewPlayer(): void {
    console.log('Create New Player button clicked'); // Debug log
    console.log('Player levels available:', this.playerLevels);
    
    // Ensure we have player levels loaded
    if (!this.playerLevels || this.playerLevels.length === 0) {
      console.error('No player levels available');
      this.showErrorMessage('Player levels not loaded. Please refresh the page.');
      return;
    }
    
    console.log('Creating new player with level:', this.playerLevels[0]);
    
    this.isCreating = true;
    this.isEditing = false;
    this.selectedPlayer = null;
    
    // Create new player with first available level
    this.editForm = new Player('', '', '', this.playerLevels[0]);
    this.editForm.code = ''; // Player code will be generated by backend
    this.panelClosing = false;
    
    console.log('Edit form created:', this.editForm);
    
    // Force change detection
    this.cdr.detectChanges();
    
    console.log('Panel should now be open. isCreating:', this.isCreating);
  }

  editPlayer(player: Player, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isEditing = true;
    this.isCreating = false;
    this.selectedPlayer = player;
    this.editForm = { ...player };
    // Ensure player level is properly selected by finding the matching level object
    const matchingLevel = this.playerLevels.find(level => level.id === player.playerLevel.id);
    if (matchingLevel) {
      this.editForm.playerLevel = matchingLevel;
    }
    this.panelClosing = false;
  }

  savePlayer(): void {
    if (!this.editForm) return;

    this.isProcessing = true;

    if (this.isCreating) {
      this.playerService.createPlayer(this.editForm).subscribe({
        next: (createdPlayer: Player) => {
          this.allPlayers.push(createdPlayer);
          this.filterPlayers();
          this.showSuccessMessage('Player created successfully');
          this.resetForm();
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error creating player:', error);
          this.showErrorMessage('Failed to create player');
          this.isProcessing = false;
        }
      });
    } else if (this.isEditing && this.editForm.id) {
      this.playerService.updatePlayer(this.editForm.id, this.editForm).subscribe({
        next: (updatedPlayer: Player) => {
          const index = this.allPlayers.findIndex(p => p.id === updatedPlayer.id);
          if (index !== -1) {
            this.allPlayers[index] = updatedPlayer;
            this.filterPlayers();
          }
          this.showSuccessMessage('Player updated successfully');
          this.resetForm();
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error updating player:', error);
          this.showErrorMessage('Failed to update player');
          this.isProcessing = false;
        }
      });
    }
  }

  deletePlayer(): void {
    if (!this.selectedPlayer || !this.selectedPlayer.id) return;

    this.isProcessing = true;

    this.playerService.deletePlayer(this.selectedPlayer.id).subscribe({
      next: () => {
        this.allPlayers = this.allPlayers.filter(p => p.id !== this.selectedPlayer!.id);
        this.filterPlayers();
        this.showSuccessMessage('Player deleted successfully');
        this.closePanel();
        this.isProcessing = false;
        this.showConfirmation = false;
      },
      error: (error) => {
        console.error('Error deleting player:', error);
        this.showErrorMessage('Failed to delete player');
        this.isProcessing = false;
        this.showConfirmation = false;
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.isCreating = false;
    this.editForm = null;
  }

  cancelEdit(): void {
    if (this.hasUnsavedChanges()) {
      this.confirmationType = 'cancel';
      this.showConfirmation = true;
    } else {
      this.resetForm();
    }
  }

  hasUnsavedChanges(): boolean {
    if (!this.editForm) return false;
    
    if (this.isCreating) {
      return !!(this.editForm.name || this.editForm.code || this.editForm.description);
    }
    
    if (this.isEditing && this.selectedPlayer) {
      return (
        this.editForm.name !== this.selectedPlayer.name ||
        this.editForm.code !== this.selectedPlayer.code ||
        this.editForm.description !== this.selectedPlayer.description ||
        this.editForm.imageUrl !== this.selectedPlayer.imageUrl ||
        this.editForm.playerLevel.id !== this.selectedPlayer.playerLevel.id
      );
    }
    
    return false;
  }

  // Count helpers
  getPlayerCount(levelCode: string): number {
    if (levelCode === 'all') {
      return this.allPlayers.length;
    }
    return this.allPlayers.filter(p => p.playerLevel.code === levelCode).length;
  }

  // Confirmation modal methods
  showDeleteConfirmation(): void {
    this.confirmationType = 'delete';
    this.showConfirmation = true;
  }

  cancelAction(): void {
    this.showConfirmation = false;
    this.isProcessing = false;
  }

  confirmAction(): void {
    if (this.confirmationType === 'delete') {
      this.deletePlayer();
    } else if (this.confirmationType === 'cancel') {
      this.resetForm();
      this.showConfirmation = false;
    }
  }

  private showSuccessMessage(message: string): void {
    this.uiService.showSuccess(message, 4000, 'Success');
  }

  private showErrorMessage(message: string): void {
    this.uiService.showError(message, 6000, 'Error');
  }

  // Confirmation modal helpers
  getConfirmationTitle(): string {
    return this.confirmationType === 'delete' ? 'Delete Player' : 'Discard Changes';
  }

  getConfirmationMessage(): string {
    if (this.confirmationType === 'delete' && this.selectedPlayer) {
      return `Are you sure you want to delete ${this.selectedPlayer.name}? This action cannot be undone.`;
    } else if (this.confirmationType === 'cancel') {
      return 'You have unsaved changes. Are you sure you want to discard them?';
    }
    return '';
  }

  getConfirmationIcon(): string {
    return this.confirmationType === 'delete' ? 'fas fa-trash' : 'fas fa-exclamation-triangle';
  }

  getConfirmationButtonClass(): string {
    return this.confirmationType === 'delete' ? 'btn-danger' : 'btn-warning';
  }

  getConfirmationButtonText(): string {
    if (this.isProcessing) {
      return this.confirmationType === 'delete' ? 'Deleting...' : 'Discarding...';
    }
    return this.confirmationType === 'delete' ? 'Delete Player' : 'Discard Changes';
  }

  // Form validation
  isFormValid(): boolean {
   // alert(this.editForm);
    if (!this.editForm) return false;
    return !!(this.editForm.name && this.editForm.playerLevel);
  }

  // Image handling methods
  setUploadMethod(method: 'file' | 'url'): void {
    this.uploadMethod = method;
    if (method === 'url') {
      this.selectedFile = null;
      this.suggestedFileName = '';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showErrorMessage('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showErrorMessage('File size must be less than 5MB.');
      return;
    }

    this.selectedFile = file;
    this.generateSuggestedFileName();
    this.updateImagePreview();
  }

  private generateSuggestedFileName(): void {
    if (!this.selectedFile || !this.editForm) return;
    
    const playerName = this.editForm.name || 'player';
    const extension = this.selectedFile.name.split('.').pop() || 'jpg';
    const sanitizedName = playerName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    this.suggestedFileName = `${sanitizedName}.${extension}`;
  }

  private updateImagePreview(): void {
    if (!this.selectedFile || !this.editForm) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // For preview, we use the data URL
      // But we set the asset path for the actual form value
      this.editForm!.imageUrl = this.getAssetPath();
      this.imageStatus = 'Preview (Manual upload required)';
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.suggestedFileName = '';
    this.imageStatus = '';
    if (this.editForm) {
      this.editForm.imageUrl = '';
    }
  }

  getAssetPath(): string {
    return `external-images/images/players/${this.suggestedFileName}`;
  }

  copyAssetPath(): void {
    const path = this.getAssetPath();
    navigator.clipboard.writeText(path).then(() => {
      this.showSuccessMessage('Asset path copied to clipboard!');
    }).catch(() => {
      this.showErrorMessage('Failed to copy to clipboard. Please copy manually.');
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getImageSource(): string {
    if (this.selectedFile && this.uploadMethod === 'file') {
      // For preview, create object URL
      return URL.createObjectURL(this.selectedFile);
    }
    
    const imageUrl = this.editForm?.imageUrl || '';
    
    // If no image URL, return placeholder
    if (!imageUrl) {
      return 'external-images/images/placeholder.png';
    }
    
    // If it's already an external URL, use it as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path starting with external-images/, use it as-is
    if (imageUrl.startsWith('external-images/')) {
      return imageUrl;
    }
    
    // If it contains 'players', assume it's a player image path
    if (imageUrl.includes('players')) {
      return imageUrl;
    }
    
    // Otherwise, assume it's a filename and build the path
    return `external-images/images/players/${imageUrl}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'external-images/images/placeholder.png';
    this.imageStatus = 'Image not found';
  }

  onImageUrlChange(): void {
    this.imageStatus = '';
    this.selectedFile = null;
    this.suggestedFileName = '';
  }

  getImageStatusIcon(): string {
    if (this.imageStatus.includes('Preview')) return 'fas fa-eye';
    if (this.imageStatus.includes('not found')) return 'fas fa-exclamation-triangle';
    return 'fas fa-info-circle';
  }

  getImageStatusColor(): string {
    if (this.imageStatus.includes('Preview')) return '#28a745';
    if (this.imageStatus.includes('not found')) return '#dc3545';
    return '#6c757d';
  }

  // Player image URL methods for template usage
  getPlayerImageUrl(player: Player): string {
    if (!player || !player.imageUrl) {
      return 'external-images/images/placeholder.png';
    }

    // Handle backend URLs that come in format like "images/players/1002.png"
    if (player.imageUrl.includes('/')) {
      // If it starts with 'images/', it's a backend URL format - convert to assets path
      if (player.imageUrl.startsWith('images/')) {
        return `external-images/${player.imageUrl}`;
      }
      // If it starts with 'external-images/', use it as-is
      if (player.imageUrl.startsWith('external-images/')) {
        return player.imageUrl;
      }
      // If it's an external URL, use it as-is
      if (player.imageUrl.startsWith('http://') || player.imageUrl.startsWith('https://')) {
        return player.imageUrl;
      }
      // Otherwise use it as-is
      return player.imageUrl;
    }

    // For simple filenames, build the asset path
    return `external-images/images/players/${player.imageUrl}`;
  }

  onPlayerImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'external-images/images/placeholder.png';
  }

}
