
import { Piece, Player } from '../types';
import { SAFE_SQUARES, HOME_STRETCH_START, START_POSITIONS } from '../constants';

export const getNextPosition = (piece: Piece, roll: number): number | null => {
    const { position, color } = piece;

    // Piece is in base
    if (position === -1) {
        if (roll === 6) return START_POSITIONS[color];
        return null;
    }

    // Piece is already finished
    if (position === 100) return null;

    let currentPos = position;
    for (let i = 0; i < roll; i++) {
        // If we reach the turn-off point for home stretch
        if (currentPos === HOME_STRETCH_START[color]) {
            currentPos = 52; // Start of home stretch
        } else if (currentPos >= 52) {
            currentPos++; // Advance in home stretch
        } else {
            currentPos = (currentPos + 1) % 52; // Advance in common path
        }
    }

    // 52-57 are home squares. 58 is finish.
    if (currentPos === 58) return 100;
    if (currentPos > 58) return null; // Over-rolled

    return currentPos;
};

export const isSafeSquare = (pos: number): boolean => {
    return pos >= 52 || SAFE_SQUARES.includes(pos);
};

export const checkCapture = (players: Player[], movingPiece: Piece, newPos: number): { capturedPlayerIndex: number, capturedPieceId: number } | null => {
    if (isSafeSquare(newPos)) return null;

    for (let pIdx = 0; pIdx < players.length; pIdx++) {
        const player = players[pIdx];
        if (player.color === movingPiece.color) continue;

        for (let pcIdx = 0; pcIdx < player.pieces.length; pcIdx++) {
            const piece = player.pieces[pcIdx];
            if (piece.position === newPos) {
                return { capturedPlayerIndex: pIdx, capturedPieceId: piece.id };
            }
        }
    }
    return null;
};
