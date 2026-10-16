export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  score: number;
}

export interface GameState {
  players: Player[];
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
}
