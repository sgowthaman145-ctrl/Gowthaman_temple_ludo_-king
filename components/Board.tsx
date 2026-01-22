
import React from 'react';
import { Player, Piece, Color } from '../types';
import { BOARD_SIZE, PATH_COORDS, HOME_STRETCH_COORDS, BASE_COORDS, SAFE_SQUARES } from '../constants';
import { Crown, Star } from 'lucide-react';

interface BoardProps {
    players: Player[];
    onPieceClick: (piece: Piece) => void;
    validMovePieces: Piece[];
}

const Board: React.FC<BoardProps> = ({ players, onPieceClick, validMovePieces }) => {
    const getPiecesAtPos = (pos: number, type: 'PATH' | 'STRETCH', color?: Color) => {
        const piecesAtPos: Piece[] = [];
        players.forEach(player => {
            player.pieces.forEach(piece => {
                if (type === 'PATH' && piece.position === pos) piecesAtPos.push(piece);
                if (type === 'STRETCH' && piece.position === pos && piece.color === color) piecesAtPos.push(piece);
            });
        });
        return piecesAtPos;
    };

    const renderSquare = (r: number, c: number) => {
        // Center Home Area
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
            if (r === 7 && c === 7) {
                return (
                    <div key={`${r}-${c}`} className="relative bg-stone-800 flex items-center justify-center border border-stone-700/50">
                        <Crown className="w-8 h-8 text-yellow-500 opacity-80" />
                    </div>
                );
            }
            let colorClass = '';
            if (r === 6 && c === 7) colorClass = 'bg-emerald-600/30';
            if (r === 8 && c === 7) colorClass = 'bg-sky-600/30';
            if (r === 7 && c === 6) colorClass = 'bg-red-600/30';
            if (r === 7 && c === 8) colorClass = 'bg-amber-500/30';
            
            return <div key={`${r}-${c}`} className={`${colorClass} border border-stone-700/50`} />;
        }

        // Check if it's base
        const baseColors: Color[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
        for (const color of baseColors) {
            const coords = BASE_COORDS[color];
            const piecePosIdx = coords.findIndex(coord => coord.r === r && coord.c === c);
            if (piecePosIdx !== -1) {
                const piece = players.find(p => p.color === color)?.pieces[piecePosIdx];
                const isMovable = validMovePieces.some(p => p.id === piece?.id && p.color === piece?.color);
                return (
                    <div key={`${r}-${c}`} className="p-1 border border-stone-800/20">
                        <div className="w-full h-full rounded-full bg-stone-900/60 border border-stone-700 flex items-center justify-center">
                            {piece && piece.position === -1 && (
                                <PieceToken piece={piece} onClick={() => onPieceClick(piece)} isMovable={isMovable} />
                            )}
                        </div>
                    </div>
                );
            }
        }

        // Base background regions
        if (r < 6 && c < 6) return <div key={`${r}-${c}`} className="bg-red-800/80 border border-stone-900/50" />;
        if (r < 6 && c > 8) return <div key={`${r}-${c}`} className="bg-emerald-800/80 border border-stone-900/50" />;
        if (r > 8 && c > 8) return <div key={`${r}-${c}`} className="bg-amber-700/80 border border-stone-900/50" />;
        if (r > 8 && c < 6) return <div key={`${r}-${c}`} className="bg-sky-800/80 border border-stone-900/50" />;

        // Path squares
        const pathIdx = PATH_COORDS.findIndex(coord => coord.r === r && coord.c === c);
        if (pathIdx !== -1) {
            const isSafe = SAFE_SQUARES.includes(pathIdx);
            const pieces = getPiecesAtPos(pathIdx, 'PATH');
            let bgColor = 'bg-stone-200';
            if (pathIdx === 0) bgColor = 'bg-red-500';
            if (pathIdx === 13) bgColor = 'bg-emerald-500';
            if (pathIdx === 26) bgColor = 'bg-amber-400';
            if (pathIdx === 39) bgColor = 'bg-sky-500';

            return (
                <div key={`${r}-${c}`} className={`${bgColor} border border-stone-400 relative flex items-center justify-center`}>
                    {isSafe && <Star className="w-4 h-4 text-stone-600/40 absolute" />}
                    <div className="flex flex-wrap items-center justify-center gap-0.5">
                        {pieces.map((p) => (
                            <PieceToken 
                                key={`${p.color}-${p.id}`} 
                                piece={p} 
                                onClick={() => onPieceClick(p)} 
                                isMovable={validMovePieces.some(vp => vp.id === p.id && vp.color === p.color)}
                                stacked={pieces.length > 1}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        // Home stretch
        for (const color of baseColors) {
            const stretchIdx = HOME_STRETCH_COORDS[color].findIndex(coord => coord.r === r && coord.c === c);
            if (stretchIdx !== -1) {
                const pos = 52 + stretchIdx;
                const pieces = getPiecesAtPos(pos, 'STRETCH', color);
                let bgColor = '';
                if (color === 'RED') bgColor = 'bg-red-400';
                if (color === 'GREEN') bgColor = 'bg-emerald-400';
                if (color === 'YELLOW') bgColor = 'bg-amber-300';
                if (color === 'BLUE') bgColor = 'bg-sky-400';

                return (
                    <div key={`${r}-${c}`} className={`${bgColor} border border-stone-400 relative flex items-center justify-center`}>
                        <div className="flex flex-wrap items-center justify-center gap-0.5">
                            {pieces.map((p) => (
                                <PieceToken 
                                    key={`${p.color}-${p.id}`} 
                                    piece={p} 
                                    onClick={() => onPieceClick(p)} 
                                    isMovable={validMovePieces.some(vp => vp.id === p.id && vp.color === p.color)}
                                    stacked={pieces.length > 1}
                                />
                            ))}
                        </div>
                    </div>
                );
            }
        }

        return <div key={`${r}-${c}`} className="bg-stone-200 border border-stone-400" />;
    };

    const gridItems = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            gridItems.push(renderSquare(r, c));
        }
    }

    return (
        <div className="relative w-full max-w-[600px] aspect-square bg-stone-900 p-2 rounded-lg shadow-2xl border-8 border-stone-800">
            <div className="board-grid w-full h-full rounded shadow-inner overflow-hidden">
                {gridItems}
            </div>
        </div>
    );
};

const PieceToken: React.FC<{ piece: Piece, onClick: () => void, isMovable: boolean, stacked?: boolean }> = ({ piece, onClick, isMovable, stacked }) => {
    const colorMap = {
        RED: 'from-red-500 to-red-800 shadow-[0_4px_0_rgb(153,27,27)]',
        GREEN: 'from-emerald-500 to-emerald-800 shadow-[0_4px_0_rgb(6,95,70)]',
        YELLOW: 'from-amber-400 to-amber-600 shadow-[0_4px_0_rgb(180,83,9)]',
        BLUE: 'from-sky-500 to-sky-800 shadow-[0_4px_0_rgb(7,89,133)]',
    };

    return (
        <button
            onClick={onClick}
            disabled={!isMovable}
            className={`
                ${stacked ? 'w-4 h-4 md:w-6 md:h-6' : 'w-6 h-6 md:w-10 md:h-10'}
                rounded-full bg-gradient-to-br border-2 border-white/40
                ${colorMap[piece.color]}
                flex items-center justify-center transition-all duration-200
                ${isMovable ? 'cursor-pointer hover:scale-110 animate-bounce active:translate-y-1 active:shadow-none' : 'cursor-default'}
                ${!isMovable && 'opacity-90'}
            `}
        >
            <div className="w-1/2 h-1/2 rounded-full border border-white/20" />
        </button>
    );
};

export default Board;
