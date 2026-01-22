
import React from 'react';
import { Color } from '../types';

interface DiceProps {
    value: number | null;
    isRolling: boolean;
    onRoll: () => void;
    disabled: boolean;
    color: Color;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling, onRoll, disabled, color }) => {
    const colorMap = {
        RED: 'bg-red-600 shadow-[0_6px_0_rgb(153,27,27)]',
        GREEN: 'bg-emerald-600 shadow-[0_6px_0_rgb(6,95,70)]',
        YELLOW: 'bg-amber-500 shadow-[0_6px_0_rgb(180,83,9)]',
        BLUE: 'bg-sky-600 shadow-[0_6px_0_rgb(7,89,133)]',
    };

    const renderDots = (num: number) => {
        const dotPositions: Record<number, number[]> = {
            1: [4],
            2: [0, 8],
            3: [0, 4, 8],
            4: [0, 2, 6, 8],
            5: [0, 2, 4, 6, 8],
            6: [0, 2, 3, 5, 6, 8]
        };

        return (
            <div className="grid grid-cols-3 gap-1 w-full h-full p-2">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="flex items-center justify-center">
                        {dotPositions[num].includes(i) && (
                            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-stone-100 shadow-inner" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={onRoll}
                disabled={disabled || isRolling}
                className={`
                    relative w-16 h-16 md:w-20 md:h-20 rounded-xl
                    ${colorMap[color]}
                    flex items-center justify-center border-2 border-white/30
                    transition-all duration-200
                    ${isRolling ? 'animate-spin scale-90' : 'hover:-translate-y-1 active:translate-y-1 active:shadow-none'}
                    ${(disabled && !isRolling) ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                {!isRolling && value && renderDots(value)}
                {!isRolling && !value && (
                    <div className="text-white temple-font text-[10px] md:text-xs text-center p-1">Invoke</div>
                )}
                {isRolling && (
                    <div className="text-white/20 temple-font text-2xl">?</div>
                )}
            </button>
            {!disabled && !isRolling && !value && (
                <span className="text-amber-500 font-bold animate-pulse text-xs uppercase tracking-widest">Your Turn</span>
            )}
        </div>
    );
};

export default Dice;
