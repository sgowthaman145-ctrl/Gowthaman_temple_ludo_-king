
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { COLORS } from './constants';
import { GameState, Player, Piece, Color } from './types';
import { getNextPosition, checkCapture } from './utils/gameLogic';
import Board from './components/Board';
import Dice from './components/Dice';
import { Trophy, Users, Shield, Crown, Scroll, Sparkles } from 'lucide-react';
import { getOracleAdvice } from './services/geminiService';

const INITIAL_PIECES = (color: Color): Piece[] => 
    [0, 1, 2, 3].map(id => ({ id, color, position: -1 }));

const INITIAL_PLAYERS: Player[] = COLORS.map(color => ({
    color,
    name: color.charAt(0) + color.slice(1).toLowerCase(),
    pieces: INITIAL_PIECES(color),
    isBot: false,
    hasFinished: false,
}));

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>({
        players: INITIAL_PLAYERS,
        currentPlayerIndex: 0,
        diceValue: null,
        status: 'START',
        winner: null,
        message: 'Welcome to Temple Ludo King!',
        logs: ['Temple ritual begins... Red Player, invoke the artifact.'],
    });

    const [isRolling, setIsRolling] = useState(false);
    const [oracleAdvice, setOracleAdvice] = useState<string | null>(null);
    const [isOracleLoading, setIsOracleLoading] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [gameState.logs]);

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    const addLog = (msg: string) => {
        setGameState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
    };

    const rollDice = useCallback(async () => {
        if (gameState.status !== 'START' && gameState.status !== 'WAITING_FOR_MOVE') return;
        if (isRolling) return;

        setIsRolling(true);
        setGameState(prev => ({ ...prev, status: 'ROLLING', message: 'Invoking the artifact...' }));

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setIsRolling(false);
            
            setGameState(prev => {
                const canMoveAny = prev.players[prev.currentPlayerIndex].pieces.some(p => getNextPosition(p, roll) !== null);
                
                const newLogs = [...prev.logs, `${currentPlayer.name} invoked a ${roll}.`];
                if (!canMoveAny) newLogs.push(`Alas! No moves possible for ${currentPlayer.name}.`);

                return {
                    ...prev,
                    diceValue: roll,
                    status: 'WAITING_FOR_MOVE',
                    message: canMoveAny ? `Rolled a ${roll}. Choose your path.` : `Rolled a ${roll}. No moves available.`,
                    logs: newLogs,
                };
            });
        }, 800);
    }, [gameState.status, gameState.currentPlayerIndex, isRolling, currentPlayer.name]);

    const nextTurn = useCallback(() => {
        setGameState(prev => {
            let nextIdx = (prev.currentPlayerIndex + 1) % prev.players.length;
            while (prev.players[nextIdx].hasFinished) {
                nextIdx = (nextIdx + 1) % prev.players.length;
            }
            return {
                ...prev,
                currentPlayerIndex: nextIdx,
                diceValue: null,
                status: 'START',
                message: `${prev.players[nextIdx].name}'s turn!`,
            };
        });
        setOracleAdvice(null);
    }, []);

    const fetchAdvice = async () => {
        setIsOracleLoading(true);
        const advice = await getOracleAdvice(gameState);
        setOracleAdvice(advice);
        setIsOracleLoading(false);
    };

    const handlePieceClick = useCallback((piece: Piece) => {
        if (gameState.status !== 'WAITING_FOR_MOVE' || !gameState.diceValue) return;
        if (piece.color !== currentPlayer.color) return;

        const nextPos = getNextPosition(piece, gameState.diceValue);
        if (nextPos === null) return;

        setGameState(prev => {
            const newPlayers = [...prev.players];
            const pIdx = prev.currentPlayerIndex;
            const pieceIdx = newPlayers[pIdx].pieces.findIndex(p => p.id === piece.id);

            const captureResult = checkCapture(newPlayers, piece, nextPos);
            const newLogs = [...prev.logs];
            
            if (captureResult) {
                newPlayers[captureResult.capturedPlayerIndex].pieces[captureResult.capturedPieceId].position = -1;
                newLogs.push(`BY THE GODS! ${currentPlayer.name} captured ${newPlayers[captureResult.capturedPlayerIndex].name}!`);
            }

            newPlayers[pIdx].pieces[pieceIdx] = { ...piece, position: nextPos };

            const allFinished = newPlayers[pIdx].pieces.every(p => p.position === 100);
            if (allFinished) {
                newPlayers[pIdx].hasFinished = true;
                newLogs.push(`CELEBRATION! ${currentPlayer.name} has reached the inner sanctum!`);
            }

            const getsExtraTurn = prev.diceValue === 6 || captureResult !== null || nextPos === 100;

            return {
                ...prev,
                players: newPlayers,
                diceValue: null,
                message: getsExtraTurn ? `The spirits grant ${currentPlayer.name} another roll!` : `${currentPlayer.name} has moved.`,
                status: getsExtraTurn ? 'START' : 'MOVING',
                logs: newLogs,
            };
        });
    }, [gameState, currentPlayer]);

    useEffect(() => {
        if (gameState.status === 'MOVING') {
            const timer = setTimeout(() => {
                nextTurn();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [gameState.status, nextTurn]);

    useEffect(() => {
        if (gameState.status === 'WAITING_FOR_MOVE' && gameState.diceValue !== null) {
            const canMoveAny = currentPlayer.pieces.some(p => getNextPosition(p, gameState.diceValue!) !== null);
            if (!canMoveAny) {
                const timer = setTimeout(() => nextTurn(), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState.status, gameState.diceValue, currentPlayer, nextTurn]);

    const resetGame = () => {
        setGameState({
            players: INITIAL_PLAYERS.map(p => ({ ...p, pieces: INITIAL_PIECES(p.color), hasFinished: false })),
            currentPlayerIndex: 0,
            diceValue: null,
            status: 'START',
            winner: null,
            message: 'A new ritual begins!',
            logs: ['New game started. Red Player, step forward.'],
        });
        setOracleAdvice(null);
    };

    return (
        <div className="min-h-screen bg-[#1c1917] text-stone-200 p-4 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-500/10 p-3 rounded-full border border-amber-500/30">
                        <Crown className="w-10 h-10 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black temple-font tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 drop-shadow-sm">
                            Temple Ludo King
                        </h1>
                        <p className="text-stone-500 temple-font text-xs md:text-sm tracking-widest uppercase">Ancient Wisdom • Modern Glory</p>
                    </div>
                </div>
                <button 
                    onClick={resetGame}
                    className="px-8 py-3 bg-stone-800 border-2 border-stone-600 rounded-full hover:bg-stone-700 hover:border-amber-500/50 transition-all temple-font text-sm uppercase tracking-widest shadow-lg"
                >
                    Ritual Reset
                </button>
            </div>

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Left Panel: Players 1 & 4 */}
                <div className="flex flex-col gap-6 order-2 lg:order-1">
                    <PlayerCard player={gameState.players[0]} isActive={gameState.currentPlayerIndex === 0} />
                    <PlayerCard player={gameState.players[3]} isActive={gameState.currentPlayerIndex === 3} />
                    
                    {/* Oracle Component */}
                    <div className="bg-stone-900/60 p-5 rounded-2xl border-2 border-stone-800 flex flex-col gap-3 shadow-xl">
                        <div className="flex items-center gap-2 text-amber-500 temple-font">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">Oracle's Vision</span>
                        </div>
                        <div className="text-stone-400 text-sm italic leading-relaxed min-h-[60px]">
                            {isOracleLoading ? "Consulting the stars..." : (oracleAdvice || "Invoke the artifact to receive divine guidance on your next move.")}
                        </div>
                        {gameState.status === 'WAITING_FOR_MOVE' && gameState.diceValue && !oracleAdvice && !isOracleLoading && (
                            <button 
                                onClick={fetchAdvice}
                                className="text-[10px] uppercase tracking-tighter text-amber-500/60 hover:text-amber-500 underline decoration-amber-500/20"
                            >
                                Ask for advice
                            </button>
                        )}
                    </div>
                </div>

                {/* Center Panel: Board & Controls */}
                <div className="lg:col-span-2 flex flex-col items-center gap-8 order-1 lg:order-2">
                    <Board 
                        players={gameState.players} 
                        onPieceClick={handlePieceClick}
                        validMovePieces={gameState.diceValue ? currentPlayer.pieces.filter(p => getNextPosition(p, gameState.diceValue!) !== null) : []}
                    />
                    
                    <div className="w-full bg-stone-900/90 p-8 rounded-[2rem] border-4 border-stone-800 shadow-2xl flex flex-col items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                        <p className="text-xl md:text-2xl temple-font mb-6 text-stone-300 italic text-center drop-shadow-md">
                            {gameState.message}
                        </p>
                        <Dice 
                            value={gameState.diceValue} 
                            isRolling={isRolling} 
                            onRoll={rollDice} 
                            disabled={gameState.status !== 'START' && (gameState.status !== 'WAITING_FOR_MOVE' || gameState.diceValue !== null)}
                            color={currentPlayer.color}
                        />
                    </div>
                </div>

                {/* Right Panel: Players 2 & 3 & Logs */}
                <div className="flex flex-col gap-6 order-3">
                    <PlayerCard player={gameState.players[1]} isActive={gameState.currentPlayerIndex === 1} />
                    <PlayerCard player={gameState.players[2]} isActive={gameState.currentPlayerIndex === 2} />
                    
                    {/* Game Logs */}
                    <div className="bg-stone-900/80 p-5 rounded-2xl border-2 border-stone-800 flex flex-col gap-4 shadow-xl h-[300px]">
                        <div className="flex items-center gap-2 text-stone-500 temple-font border-b border-stone-800 pb-2">
                            <Scroll className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Chronicle of Fate</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                            {gameState.logs.map((log, i) => (
                                <div key={i} className={`text-xs leading-relaxed ${i === gameState.logs.length - 1 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                                    <span className="opacity-30 mr-2">[{i + 1}]</span> {log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="mt-12 text-stone-600 flex flex-wrap justify-center gap-8 text-sm temple-font uppercase tracking-widest border-t border-stone-800/50 pt-8 w-full max-w-4xl">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-stone-700" /> 4 Temple Champions
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stone-700" /> 8 Sacred Sanctuaries
                </div>
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-stone-700" /> Reach Inner Sanctum
                </div>
            </div>
        </div>
    );
};

const PlayerCard: React.FC<{ player: Player, isActive: boolean }> = ({ player, isActive }) => {
    const colorMap = {
        RED: 'border-red-600/50 bg-red-950/10 text-red-500 shadow-red-900/20',
        GREEN: 'border-emerald-600/50 bg-emerald-950/10 text-emerald-500 shadow-emerald-900/20',
        YELLOW: 'border-amber-500/50 bg-amber-950/10 text-amber-500 shadow-amber-900/20',
        BLUE: 'border-sky-600/50 bg-sky-950/10 text-sky-500 shadow-sky-900/20',
    };

    const finishedCount = player.pieces.filter(p => p.position === 100).length;

    return (
        <div className={`
            p-5 rounded-2xl border-2 transition-all duration-500
            ${isActive ? `${colorMap[player.color]} scale-105 shadow-2xl ring-2 ring-white/5` : 'border-stone-800 bg-stone-900/40 opacity-40'}
        `}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <h3 className="text-xl font-bold temple-font tracking-widest uppercase">{player.name}</h3>
                    <span className="text-[10px] opacity-60 tracking-tighter uppercase font-sans">Guardian of the {player.color}</span>
                </div>
                {player.hasFinished && <Trophy className="text-yellow-500 w-6 h-6 animate-bounce" />}
                {isActive && !player.hasFinished && <div className="w-2 h-2 rounded-full bg-current animate-ping" />}
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                    {[0, 1, 2, 3].map(i => (
                        <div 
                            key={i} 
                            className={`w-4 h-4 rounded-full border border-white/10 transition-all duration-700 ${i < finishedCount ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-stone-800'}`} 
                        />
                    ))}
                </div>
                <div className="text-[9px] text-stone-500 font-sans tracking-widest uppercase">
                    Tokens Enlightened: {finishedCount}/4
                </div>
            </div>
        </div>
    );
};

export default App;
