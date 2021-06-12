import { Component, OnInit } from '@angular/core';

import { Hole } from '../interfaces/hole';
import { Player } from '../interfaces/player';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  rows: Hole[][] = [];
  holes: Hole[] = [];
  horizontalRows: Hole[][] = [];
  verticalRows: Hole[][] = [];
  diagonalRows: Hole[][] = [];
  player1!: Player;
  player2!: Player;
  currentPlayer!: Player;
  winner: Player | undefined;
  rowLength!: number;
  coinDropSound!: HTMLAudioElement;
  winningSound!: HTMLAudioElement;
  isProcessing: boolean = false;
  isGameOver: boolean = false;
  isTie: boolean = false;

  constructor() {
    this.initializeUser();
  }

  ngOnInit(): void {
    this.generateRows(7, 6);
    this.createSounds();
  }

  createSounds() {
    this.coinDropSound = new Audio('assets/sounds/coinDrop.mp3');
    this.winningSound = new Audio('assets/sounds/winningSound.mp3');
  }

  // To remove all the coins of previous game on reset.
  removeCoins(): void {
    this.holes.forEach((hole) => {
      if (hole.isFilled) {
        setTimeout(() => {
          const coin = document.getElementById(`coin-${hole.id}`);
          if (coin) {
            coin.parentNode?.removeChild(coin);
          }
        });
      }
    });
  }

  onResetGame(): void {
    this.isProcessing = true;
    this.removeCoins();
    this.initializeUser();
    this.generateRows(7, 6);
    this.winner = undefined;
    this.isGameOver = false;
    this.isTie = false;
    this.isProcessing = false;
  }

  // To generate all possible rows of four sequential coins from given rows
  generateRowsOfFour(rows: Hole[][]) {
    const generatedRows = rows.map((row) => {
      let rowsOfFour: Hole[][] = [];
      row.forEach((hole, index) => {
        let newRow = [];
        if (index < (row.length - 3)) {
          newRow.push(hole);
          newRow.push(row[++index]);
          newRow.push(row[++index]);
          newRow.push(row[++index]);
          rowsOfFour.unshift(newRow);
        }
      });
      return rowsOfFour;
    });
    return generatedRows;
  }

  createHorizontalRows(): void {
    this.horizontalRows = this.generateRowsOfFour(this.rows).flat().reverse();
  }

  createVerticalRows(): void {
    let columns = [];
    for (let i = 0; i < this.rowLength; i++) {
      const column = this.rows.map((row) => row[i]);
      columns.push(column);
    }
    this.verticalRows = this.generateRowsOfFour(columns).flat();
  }

  createDiagonalRows() {
    const topLeftDiagonals = [];
    for (let i = 0; i < (this.rowLength - 1); i++) {
      let diagonal = [];
      let index = 0;
      for (let j = i; j >= 0; j--) {
        diagonal.push(this.rows[index++][j]);
      }
      topLeftDiagonals.push(diagonal);
    }

    const bottomRightDiagonals = [];
    for (let i = (this.rowLength - 1); i > 0; i--) {
      let diagonal = [];
      let index = this.rows.length - 1;
      for (let j = i; j <= (this.rowLength - 1); j++) {
        diagonal.push(this.rows[index--][j]);
      }
      bottomRightDiagonals.push(diagonal);
    }

    const bottomLeftDiagonals = [];
    for (let i = 0; i < (this.rowLength - 1); i++) {
      let diagonal = [];
      let index = this.rows.length - 1;
      for (let j = i; j >= 0; j--) {
        diagonal.push(this.rows[index--][j]);
      }
      bottomLeftDiagonals.push(diagonal);
    }

    const topRightDiagonals = [];
    let colIndex = this.rowLength - 1;
    for (let i = 0; i < (this.rowLength - 1); i++) {
      let diagonal = [];
      let index = 0;
      for (let j = colIndex; j <= (this.rowLength - 1); j++) {
        diagonal.push(this.rows[index++][j]);
      }
      colIndex--;
      topRightDiagonals.push(diagonal);
    }

    const finalArray = topLeftDiagonals.concat(bottomRightDiagonals, bottomLeftDiagonals, topRightDiagonals).filter((diagonal) => diagonal.length >= 4);
    this.diagonalRows = this.generateRowsOfFour(finalArray).flat();
  }

  // To generate rows of holes of given number and of given length which will be rendered on dom
  generateRows(rowLength: number, rowStrength: number): void {
    this.rows = [];
    this.holes = [];
    this.horizontalRows = [];
    this.verticalRows = [];
    this.diagonalRows = [];
    this.rowLength = rowLength;
    let index = 0;
    
    for (let i = 0; i < rowStrength; i++) {
      const row: Hole[] = [];
      for (let j = 0; j < rowLength; j++) {
        const hole: Hole = {
          id: index++,
          isFilled: false,
          filledBy: null,
          isWon: false,
        };
       row.push(hole);
      }
      this.rows.push(row);
    }
    
    this.rows = this.rows.reverse();
    this.createHorizontalRows();
    this.createVerticalRows();
    this.createDiagonalRows();
    this.holes = this.rows.flat().reverse();
  }

  initializeUser() {    
    this.player1 = {
      turn: true,
      color: 'red',
      name: 'player1'
    };

    this.player2 = {
      turn: false,
      color: 'yellow',
      name: 'player2'
    }

    this.currentPlayer = this.player1;
  }

  trackRowsByIndex(index: number, row: Hole[]): number {
    return index;
  }

  trackRowHolesById(index: number, hole: Hole): number {
    return hole.id;
  }

  findHoleToFill(clickedHole: Hole, rowIndex: number, holeIndex: number): Hole | undefined {
    let columnHoles: Hole[];
    let holeToFillId: number;

    if (clickedHole.isFilled) { // If clicked hole is already filled then check for above holes only.
      columnHoles = this.rows.filter((row, index) => index < rowIndex).map((row) => row[holeIndex]);
      if (!columnHoles.length) return; // The top most hole is filled.      
    } else { // If clicked hole is not filled then check for below holes only.
      columnHoles = this.rows.filter((row, index) => index >= rowIndex).map((row) => row[holeIndex]);
    }

    const filledColumnHolesIds: number[] = columnHoles.filter((hole) => hole.isFilled).map((hole) => hole.id);
    if (filledColumnHolesIds.length) {
      holeToFillId = filledColumnHolesIds.reduce((id1, id2) => Math.max(id1, id2)) + this.rowLength;
    } else {
      holeToFillId = columnHoles.map((hole) => hole.id).reduce((id1, id2) => Math.min(id1, id2));
    }

    return columnHoles.find((hole) => hole.id === holeToFillId);
  }

  findFourInARow(filledHole: Hole, rows: Hole[][]) {
    const rowsFound = rows.filter((row) => row.every((hole) => hole.filledBy?.name === filledHole.filledBy?.name));
    return rowsFound;
  }

  checkIfCurrentPlayerWon(filledHole: Hole): boolean {
    const horizontallyConnected = this.findFourInARow(filledHole, this.horizontalRows);
    const verticallyConnected = this.findFourInARow(filledHole, this.verticalRows);
    const diagonallyConnected = this.findFourInARow(filledHole, this.diagonalRows);
    let winningRowHoles = horizontallyConnected.concat(verticallyConnected, diagonallyConnected).flat();
    winningRowHoles.forEach((hole) => {
      const domHole = document.getElementById(`coin-${hole.id}`);
      if (domHole) {
        domHole.style.animationDuration = '700ms';
        domHole.style.animationIterationCount = 'infinite';
        domHole.style.animationDirection = 'alternate';
        domHole.style.animationName = `toggle-${hole.filledBy?.color}`;
      }
    });
    return !!winningRowHoles.length;
  }

  playCoinDropSound(): void {
    this.coinDropSound.play();
  }

  playWinningSound(): void {
    this.winningSound.play();
  }

  fillTheHole(holeToFill: Hole, holeIndex: number) {
    const rowIndex = this.rows.findIndex((row) => row.find((hole) => hole.id === holeToFill.id));
    const coin = document.createElement('div');
    coin.setAttribute('id', `coin-${holeToFill.id}`);
    coin.style.backgroundColor = this.currentPlayer.color;
    coin.style.width = '90px';
    coin.style.height = '90px';
    coin.style.borderRadius = '50%';
    coin.style.position = 'absolute';    
    const holePosition = document.getElementById(`hole-${holeToFill.id}`);
    if (holePosition) {
      const holeTop = rowIndex * holePosition.offsetTop * -1;
      coin.style.top = holeTop + 'px';
      holePosition?.appendChild(coin);
      
      setTimeout(() => {
        coin.style.transitionProperty = 'top';
        coin.style.transitionDuration = '300ms';
        this.playCoinDropSound();
        coin.style.top = '0';
        holeToFill.isFilled = true;
        holeToFill.filledBy = this.currentPlayer;
        setTimeout(() => {
          const hasWon: boolean = this.checkIfCurrentPlayerWon(holeToFill);
          if (hasWon) {
            this.winner = this.currentPlayer;
            this.playWinningSound();
            this.isGameOver = true;
          } else {
            const allHolesFilled = this.holes.every((hole) => hole.isFilled);
            if (allHolesFilled) {
              this.isTie = true;
              this.playWinningSound();
              this.isGameOver = true;
            } else {
              this.changeTurn();
            }
          }
          this.isProcessing = false;
        }, 300);        
      });
    }
  }

  onHoleClick(clickedHole: Hole, rowIndex: number, holeIndex: number): void {
    if (this.isGameOver || this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    const holeToFill = this.findHoleToFill(clickedHole, rowIndex, holeIndex);
    if (holeToFill) {
      this.fillTheHole(holeToFill, holeIndex);
    } else {
      this.isProcessing = false;
    }
  }

  changeTurn(): void {
    this.player1.turn = !this.player1.turn;
    this.player2.turn = !this.player2.turn;
    this.currentPlayer = this.player1.turn ? this.player1 : this.player2;
  }
}
