import { Player } from './player';

export interface Hole {
  readonly id: number;
  isFilled: boolean;
  filledBy: Player | null;
  isWon: boolean;
}