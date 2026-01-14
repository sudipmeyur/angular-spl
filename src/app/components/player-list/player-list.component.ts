import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Player } from 'src/app/common/player';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.css']
})
export class PlayerListComponent implements OnInit {

  players: Player[] = [];
  animationOn = false;
  showEnvelope = false;
  envelopeOpen = false;
  selectedIndex = -1;
  selectedPlayer: Player | null = null;
  boxPositions: any[] = [{}, {}, {}, {}];
  animationFrames: any[] = [];
  
  playerForm = {
    name: '',
    jerseyNumber: null,
    position: '',
    age: null,
    team: '',
    nationality: ''
  };

  constructor(
    private playerService: PlayerService,
    private el: ElementRef,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.listPlayers();
    setTimeout(() => this.initializePositions(), 100);
  }

  listPlayers() {
    this.playerService.getPlayers().subscribe(
      data => {
        this.players = data;
      }
    );
  }

  initializePositions() {
    this.boxPositions = [
      { top: 10, left: 10 },
      { top: 10, left: 120 },
      { top: 10, left: 230 },
      { top: 10, left: 340 }
    ];
  }

  toggleAnimation() {
    this.animationOn = !this.animationOn;
    if (this.animationOn) {
      for (let i = 0; i < 4; i++) {
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
    
    const box = this.el.nativeElement.querySelector(`#player-${index}`);
    if (!box) return;
    
    const maxTop = board.clientHeight - box.clientHeight;
    const maxLeft = board.clientWidth - box.clientWidth;
    
    const newTop = Math.floor(Math.random() * maxTop);
    const newLeft = Math.floor(Math.random() * maxLeft);
    
    this.boxPositions[index] = { top: newTop, left: newLeft };
    
    const frame = requestAnimationFrame(() => this.animateBox(index));
    this.animationFrames.push(frame);
  }

  choseThis(index: number) {
    if (this.selectedIndex >= 0) return;
    
    this.selectedIndex = index;
    this.selectedPlayer = this.players[index];
    
    const box = this.el.nativeElement.querySelector(`#player-${index}`);
    const container = this.el.nativeElement.querySelector('.section-box-inner');
    const stage = this.el.nativeElement.querySelector('#stage');
    
    if (!box || !container || !stage) return;
    
    const boxRect = box.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    
    const originalTop = this.boxPositions[index].top;
    const originalLeft = this.boxPositions[index].left;
    
    box.setAttribute('data-original-top', originalTop);
    box.setAttribute('data-original-left', originalLeft);
    
    this.renderer.setStyle(box, 'z-index', '1000');
    
    const centerTop = (container.clientHeight - box.clientHeight) / 2;
    const centerLeft = (container.clientWidth - box.clientWidth);
    
    this.animateElement(box, { top: centerTop, left: centerLeft }, 500, () => {
      const finalTop = (stageRect.top - containerRect.top) + (stage.clientHeight - box.clientHeight) / 2;
      const finalLeft = container.clientWidth + (stageRect.left - (containerRect.left + container.clientWidth)) + (stage.clientWidth - box.clientWidth) / 2;
      
      this.animateElement(box, { top: finalTop, left: finalLeft }, 500, () => {
        this.renderer.setStyle(box, 'display', 'none');
        this.showEnvelope = true;
      });
    });
  }

  sendBack() {
    if (this.selectedIndex < 0) return;
    
    this.envelopeOpen = false;
    this.showEnvelope = false;
    
    const box = this.el.nativeElement.querySelector(`#player-${this.selectedIndex}`);
    const container = this.el.nativeElement.querySelector('.section-box-inner');
    
    if (!box || !container) return;
    
    this.renderer.setStyle(box, 'display', 'block');
    this.renderer.setStyle(box, 'z-index', '1000');
    
    const originalTop = parseFloat(box.getAttribute('data-original-top'));
    const originalLeft = parseFloat(box.getAttribute('data-original-left'));
    
    const centerTop = (container.clientHeight - box.clientHeight) / 2;
    const centerLeft = (container.clientWidth - box.clientWidth);
    
    this.animateElement(box, { top: centerTop, left: centerLeft }, 500, () => {
      this.animateElement(box, { top: originalTop, left: originalLeft }, 500, () => {
        this.renderer.setStyle(box, 'z-index', '');
        this.selectedIndex = -1;
        this.selectedPlayer = null;
      });
    });
  }

  openEnvelop(event: Event) {
    if ((event.target as HTMLElement).tagName === 'A') return;
    this.envelopeOpen = !this.envelopeOpen;
  }

  populatePlayerData() {
    if (this.selectedPlayer) {
      this.playerForm = {
        name: this.selectedPlayer.name || '',
        jerseyNumber: null,
        position: '',
        age: null,
        team: '',
        nationality: ''
      };
    }
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
