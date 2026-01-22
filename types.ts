
export type Color = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';

export interface Piece {
    id: number;
    color: Color;
    position: number; // -1 for base, 0-51 for common path, 52-57 for home stretch, 100 for finish
}

export interface Player {
    color: Color;
    name: string;
    pieces: Piece[];
    isBot: boolean;
    hasFinished: boolean;
    rank?: number;
}

export type GameStatus = 'START' | 'ROLLING' | 'WAITING_FOR_MOVE' | 'MOVING' | 'FINISHED';

export interface GameState {
    players: Player[];
    currentPlayerIndex: number;
    diceValue: number | null;
    status: GameStatus;
    winner: Color | null;
    message: string;
    logs: string[];
}
