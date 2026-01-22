
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, Color } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getOracleAdvice = async (gameState: GameState): Promise<string> => {
    try {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const prompt = `
            You are the Ancient Temple Oracle advising a player in the game of Temple Ludo King.
            Current Player: ${currentPlayer.name} (${currentPlayer.color})
            Current Dice Roll: ${gameState.diceValue}
            Board State (Positions):
            ${gameState.players.map(p => `${p.name}: ${p.pieces.map(pc => pc.position).join(', ')}`).join('\n')}
            
            Give a short, thematic advice (under 30 words) on which piece to move or what the strategy should be. 
            Be mystical and encouraging.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                maxOutputTokens: 60,
                temperature: 0.8,
            }
        });

        return response.text?.trim() || "The spirits are silent. Trust your own intuition.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "The mists of time cloud my vision. Choose wisely, traveler.";
    }
};
