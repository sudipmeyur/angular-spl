import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlayerService } from 'src/app/services/player.service';
import { SeasonService } from 'src/app/services/season.service';
import { TeamSeason } from 'src/app/common/team-season';
import { Season } from 'src/app/common/season';
import { PlayerTeam } from 'src/app/common/player-team';





export interface TeamSquadData {
  manager?: PlayerTeam;
  playersByLevel: {
    [levelCode: string]: {
      levelName: string;
      players: PlayerTeam[];
      totalAmount: number;
    };
  };
  grandTotal: number;
}

@Component({
  selector: 'app-team-squad',
  templateUrl: './team-squad.component.html',
  styleUrls: ['./team-squad.component.css']
})
export class TeamSquadComponent implements OnInit {

  teamSquadData: TeamSquadData | null = null;
  currentSeason: Season | null = null;
  currentSeasonCode: string = 's6';
  teamSeasonId: number | undefined;
  teamSeason?: TeamSeason;
  loading: boolean = false;
  error: string = '';
  pdfLoading: boolean = false;

  constructor(
    private playerService: PlayerService,
    private seasonService: SeasonService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // this.seasonService.currentSeason$.subscribe(season => {
    //   if (season) {
    //     this.currentSeason = season;
    //     this.currentSeasonCode = season?.code || this.currentSeasonCode;
    //     this.checkRouteParams();
    //   }
    // });

    // Get team code from route parameters
    // this.route.paramMap.subscribe(params => {
    //   const teamCode = params.get('teamCode');
    //   if (teamCode) {
    //     this.teamSeasonCode = `${teamCode}_${this.currentSeasonCode}`;
    //     this.loadTeamSquad();
    //   }
    // });

    this.seasonService.currentSeason$.subscribe(season => {
      if (season) {
        this.currentSeason = season;
        this.currentSeasonCode = season?.code || this.currentSeasonCode;
        this.route.paramMap.subscribe(() => {
          this.loadTeamSquad();
        });
      }
    });
  }



  loadTeamSquad(): void {

    const hasTeamSeasonId: boolean = this.route.snapshot.paramMap.has('id');  

    if (!hasTeamSeasonId) return;

    this.loading = true;
    this.error = '';

    this.teamSeasonId = +this.route.snapshot.paramMap.get('id')!;
    console.log('Level Code:', this.teamSeasonId);

    // Load team squad data from API
    this.playerService.getTeamSquad(this.teamSeasonId).subscribe(
      data => {
        this.teamSeason = data;
        this.teamSquadData = this.processTeamSquadData(this.teamSeason);
        this.loading = false;
      },
      error => {
        console.error('Error loading team squad:', error);
        this.error = 'Failed to load team squad data';
        this.loading = false;
        
      }
    );
  }

  private processTeamSquadData(data: TeamSeason): TeamSquadData {
    const playersByLevel: { [levelCode: string]: { levelName: string; players: PlayerTeam[]; totalAmount: number; } } = {};
    let grandTotal = 0;
    let managerFromData:PlayerTeam | undefined = undefined;

    // Group players by level
    if (data.playerTeams) {
      data.playerTeams.forEach((playerTeam: PlayerTeam) => {

        if(playerTeam.isManager){
          managerFromData = playerTeam;
        }else{

          const levelCode = playerTeam.player.playerLevel.code;
          if (!playersByLevel[levelCode]) {
            playersByLevel[levelCode] = {
              levelName: playerTeam.player.playerLevel.name,
              players: [],
              totalAmount: 0
            };
          }
          playersByLevel[levelCode].players.push(playerTeam);
          // playersByLevel[levelCode].totalAmount += playerTeam.soldAmount;
          // grandTotal += playerTeam.soldAmount;

        }
      });
    }
    grandTotal = data.totalAmountSpent ?? 0;

    return {
      manager: managerFromData,
      playersByLevel,
      grandTotal
    };
  }


  getPlayerLevelColor(levelCode: string): string {
    const colors: { [key: string]: string } = {
      'l1': '#dc3545', // red
      'l2': '#fd7e14', // orange
      'l3': '#ffc107', // yellow
      'l4': '#198754', // green
      'l5': '#0d6efd', // blue
      'l6': '#6f42c1'  // purple
    };
    return colors[levelCode] || '#6c757d';
  }

  formatAmount(amount: number): string {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  }

  getDefaultPlayerImage(): string {
    return 'external-images/images/placeholder.png';
  }

  onImageError(event: any): void {
    event.target.src = this.getDefaultPlayerImage();
  }

  getPlayerLevels(): string[] {
    if (!this.teamSquadData) return [];
    return Object.keys(this.teamSquadData.playersByLevel).sort();
  }

  getLevelDisplayName(levelCode: string): string {
    if (!this.teamSquadData) return levelCode;
    return levelCode.toUpperCase();
  }

  getBudgetPercentage(): number {
    if (!this.teamSquadData || !this.currentSeason) return 0;
    return (this.teamSquadData.grandTotal / this.currentSeason.budgetLimit) * 100;
  }

  getBudgetProgressClass(): string {
    const percentage = this.getBudgetPercentage();
    if (percentage <= 70) return 'bg-success';
    if (percentage <= 90) return 'bg-warning';
    return 'bg-danger';
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

  generateTeamSquadPdf(): void {
    if (!this.teamSeasonId) return;
    
    this.pdfLoading = true;
    this.playerService.generateTeamSquadPdf(this.teamSeasonId).subscribe(
      (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.teamSeason?.team?.name || 'Team'}_Squad_${this.currentSeasonCode}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        // Also open in new tab for viewing
        window.open(url, '_blank');
        this.pdfLoading = false;
      },
      error => {
        console.error('Error generating PDF:', error);
        this.pdfLoading = false;
      }
    );
  }
}