import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Player } from '../../../common/player';
import { PlayerLevel } from '../../../common/player-level';
import { PlayerCategory } from '../../../common/player-category';
import { PlayerService } from '../../../services/player.service';
import { PlayerCategoryService } from '../../../services/player-category.service';
import { SeasonService } from '../../../services/season.service';
import { UiService } from '../../../services/ui.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnDestroy {

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
  isUploading: boolean = false;
  uploadProgress: number = 0;

  // Loading state
  isLoading: boolean = true;
  loadingError: string = '';

  // Backend data
  playerLevels: PlayerLevel[] = [];
  playerCategories: PlayerCategory[] = [];
  allPlayers: Player[] = [];
  filteredPlayers: Player[] = [];
  paginatedPlayers: Player[] = [];

  // Subscription management
  private subscriptions: Subscription[] = [];

  constructor(
    private playerService: PlayerService, 
    private playerCategoryService: PlayerCategoryService,
    private seasonService: SeasonService, 
    private uiService: UiService,
    private toastService: ToastService,
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

    // Load player levels and categories
    const sub = this.playerService.getPlayerLevels().subscribe({
      next: (playerLevels: PlayerLevel[]) => {
        console.log('Player levels loaded from API:', playerLevels);
        this.playerLevels = playerLevels;
        
        // Also update the season service
        this.seasonService.setPlayerLevel(playerLevels);
        
        // Load categories
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error loading player levels:', error);
        this.loadingError = 'Failed to load player levels';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadCategories(): void {
    const sub = this.playerCategoryService.getAllCategories().subscribe({
      next: (categories: PlayerCategory[]) => {
        console.log('Player categories loaded:', categories);
        this.playerCategories = categories;
        
        // Now load players
        this.loadActivePlayers();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        // Continue without categories
        this.loadActivePlayers();
      }
    });
    this.subscriptions.push(sub);
  }

  private loadActivePlayers(): void {
    const sub = this.playerService.getActivePlayers().subscribe({
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
    this.subscriptions.push(sub);
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
      this.toastService.showError('Player levels not loaded. Please refresh the page.');
      return;
    }
    
    console.log('Creating new player with level:', this.playerLevels[0]);
    
    this.isCreating = true;
    this.isEditing = false;
    this.selectedPlayer = null;
    
    // Create new player with first available level and no category
    this.editForm = new Player('', '', '', this.playerLevels[0]);
    this.editForm.code = ''; // Player code will be generated by backend
    this.editForm.category = undefined; // No category selected initially
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
    
    // Ensure player category is properly selected by finding the matching category object
    if (player.category) {
      const matchingCategory = this.playerCategories.find(category => category.code === player.category?.code);
      if (matchingCategory) {
        this.editForm.category = matchingCategory;
      }
    }
    
    this.panelClosing = false;
  }

  savePlayer(): void {
    if (!this.editForm) return;

    const actionText = this.isCreating ? 'Creating player...' : 'Saving changes...';
    this.uiService.showProcessing(actionText);

    if (this.isCreating) {
      const sub = this.playerService.createPlayer(this.editForm).subscribe({
        next: (createdPlayer: Player) => {
          this.uiService.hideProcessing();
          console.log('Created player:', createdPlayer); // Debug log
          this.allPlayers.push(createdPlayer);
          this.filterPlayers();
          this.closePanel(); // Close panel after successful creation
          this.toastService.showSuccess('Player created successfully');
        },
        error: (error) => {
          this.uiService.hideProcessing();
          const errorMsg = error?.error?.message || error?.message || 'Unknown error occurred';
          this.toastService.showError('Failed to create player: ' + errorMsg);
        }
      });
      this.subscriptions.push(sub);
    } else if (this.isEditing && this.editForm.id) {
      const sub = this.playerService.updatePlayer(this.editForm.id, this.editForm).subscribe({
        next: (updatedPlayer: Player) => {
          this.uiService.hideProcessing();
          console.log('Updated player:', updatedPlayer); // Debug log
          const index = this.allPlayers.findIndex(p => p.id === updatedPlayer.id);
          if (index !== -1) {
            this.allPlayers[index] = updatedPlayer;
            this.filterPlayers();
          }
          this.closePanel(); // Close panel after successful update
          this.toastService.showSuccess('Player updated successfully');
        },
        error: (error) => {
          this.uiService.hideProcessing();
          const errorMsg = error?.error?.message || error?.message || 'Unknown error occurred';
          this.toastService.showError('Failed to update player: ' + errorMsg);
        }
      });
      this.subscriptions.push(sub);
    }
  }

  deletePlayer(): void {
    if (!this.selectedPlayer || !this.selectedPlayer.id) return;

    this.uiService.showProcessing('Deleting player...');

    const sub = this.playerService.deletePlayer(this.selectedPlayer.id).subscribe({
      next: () => {
        this.uiService.hideProcessing();
        this.allPlayers = this.allPlayers.filter(p => p.id !== this.selectedPlayer!.id);
        this.filterPlayers();
        this.closePanel();
        this.toastService.showSuccess('Player deleted successfully');
      },
      error: (error) => {
        this.uiService.hideProcessing();
        const errorMsg = error?.error?.message || error?.message || 'Unknown error occurred';
        this.toastService.showError('Failed to delete player: ' + errorMsg);
      }
    });
    this.subscriptions.push(sub);
  }

  resetForm(): void {
    this.isEditing = false;
    this.isCreating = false;
    this.editForm = null;
  }

  cancelEdit(): void {
    if (this.hasUnsavedChanges()) {
      this.showCancelConfirmation();
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

  // Confirmation modal methods using UiService
  showDeleteConfirmation(): void {
    if (!this.selectedPlayer) return;
    
    this.uiService.showConfirmation(
      {
        title: 'Delete Player',
        message: `Are you sure you want to delete ${this.selectedPlayer.name}? This action cannot be undone.`,
        icon: 'fas fa-trash',
        type: 'danger',
        confirmText: 'Delete Player',
        cancelText: 'Cancel'
      },
      () => this.deletePlayer()
    );
  }

  showCancelConfirmation(): void {
    this.uiService.showConfirmation(
      {
        title: 'Discard Changes',
        message: 'You have unsaved changes. Are you sure you want to discard them?',
        icon: 'fas fa-exclamation-triangle',
        type: 'warning',
        confirmText: 'Discard Changes',
        cancelText: 'Keep Editing'
      },
      () => this.resetForm()
    );
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
      this.toastService.showError('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.toastService.showError('File size must be less than 5MB.');
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

    this.imageStatus = 'Ready to upload';
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.suggestedFileName = '';
    this.imageStatus = '';
    this.uploadProgress = 0;
    this.isUploading = false;
    if (this.editForm) {
      this.editForm.imageUrl = '';
    }
  }

  uploadSelectedFile(): void {
    if (!this.selectedFile || !this.editForm) return;
    
    this.isUploading = true;
    this.uploadProgress = 0;
    this.imageStatus = 'Uploading...';
    
    const playerCode = this.editForm.code || undefined;
    
    const sub = this.playerService.uploadPlayerImage(this.selectedFile, playerCode).subscribe({
      next: (imagePath: string) => {
        this.editForm!.imageUrl = imagePath;
        this.imageStatus = 'Upload successful!';
        this.uploadProgress = 100;
        this.isUploading = false;
        this.toastService.showSuccess('Image uploaded successfully!');
        
        // Clear the selected file after successful upload
        setTimeout(() => {
          this.selectedFile = null;
          this.suggestedFileName = '';
          this.uploadProgress = 0;
          this.imageStatus = 'Image updated';
        }, 2000);
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.imageStatus = 'Upload failed';
        this.isUploading = false;
        this.uploadProgress = 0;
        const errorMsg = error?.error?.message || error?.message || 'Unknown error occurred';
        this.toastService.showError('Failed to upload image: ' + errorMsg);
      }
    });
    this.subscriptions.push(sub);
  }

  getAssetPath(): string {
    return `external-images/images/players/${this.suggestedFileName}`;
  }

  copyAssetPath(): void {
    const path = this.getAssetPath();
    navigator.clipboard.writeText(path).then(() => {
      this.toastService.showSuccess('Asset path copied to clipboard!');
    }).catch(() => {
      this.toastService.showError('Failed to copy to clipboard. Please copy manually.');
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
    // Only show uploaded image URL, not selected file preview
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
    if (this.imageStatus.includes('successful') || this.imageStatus.includes('updated')) return 'fas fa-check-circle';
    if (this.imageStatus.includes('Uploading')) return 'fas fa-spinner fa-spin';
    if (this.imageStatus.includes('Ready')) return 'fas fa-upload';
    if (this.imageStatus.includes('failed')) return 'fas fa-exclamation-triangle';
    if (this.imageStatus.includes('not found')) return 'fas fa-exclamation-triangle';
    return 'fas fa-info-circle';
  }

  getImageStatusColor(): string {
    if (this.imageStatus.includes('successful') || this.imageStatus.includes('updated')) return '#28a745';
    if (this.imageStatus.includes('Uploading')) return '#007bff';
    if (this.imageStatus.includes('Ready')) return '#28a745';
    if (this.imageStatus.includes('failed')) return '#dc3545';
    if (this.imageStatus.includes('not found')) return '#dc3545';
    return '#6c757d';
  }

  // Player image URL methods for template usage
  getPlayerImageUrl(player: Player): string {
    if (!player || !player.imageUrl) {
      return 'external-images/images/placeholder.png';
    }

    // Backend returns full path like 'external-images/images/players/1013.png'
    // If it's an external URL, use it as-is
    if (player.imageUrl.startsWith('http://') || player.imageUrl.startsWith('https://')) {
      return player.imageUrl;
    }
    
    // Use the backend-provided path directly
    return player.imageUrl;
  }

  onPlayerImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'external-images/images/placeholder.png';
  }

  // Category icon methods
  getCategoryIconPath(category: PlayerCategory | undefined): string {
    if (!category || !category.iconPath) {
      return 'external-images/images/player-categories/unknown.png';
    }
    return `${category.iconPath}`;
  }

  getCategoryIconAlt(category: PlayerCategory | undefined): string {
    return category ? category.name : 'Unknown Category';
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

}
