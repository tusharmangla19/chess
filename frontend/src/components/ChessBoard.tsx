import { Chess, Square } from "chess.js";
import { useState, useMemo } from "react";

const MOVE = "move";

export const ChessBoard = ({ chess, socket, playerColor, moveCount }: {
    chess: Chess;
    socket: WebSocket;
    playerColor: 'white' | 'black' | null;
    moveCount: number;
}) => {
    const [from, setFrom] = useState<null | Square>(null);

    // Calculate valid moves when a piece is selected
    const validMoves = useMemo(() => {
        if (!from) return [];
        if (chess.isGameOver()) return []; // Prevent showing moves after game over
        try {
            return chess.moves({ square: from, verbose: true });
        } catch (error) {
            console.error("Error calculating moves:", error);
            return [];
        }
    }, [from, chess, moveCount]);

    // Get the last move made
    const lastMove = useMemo(() => {
        const history = chess.history({ verbose: true });
        return history.length > 0 ? history[history.length - 1] : null;
    }, [chess, moveCount]);

    const getSquareClass = (squareRepresentation: Square, i: number, j: number) => {
        let baseClass = `w-16 h-16 ${(i+j)%2 === 0 ? 'bg-green-500' : 'bg-slate-500'}`;
        
        // Highlight selected piece
        if (from === squareRepresentation) {
            baseClass += ' ring-4 ring-yellow-400 ring-opacity-75';
        }
        
        // Highlight last move
        if (lastMove && (lastMove.from === squareRepresentation || lastMove.to === squareRepresentation)) {
            baseClass += ' ring-2 ring-blue-400 ring-opacity-50';
        }
        
        // Highlight valid move destinations
        const validMove = validMoves.find(move => move.to === squareRepresentation);
        if (validMove) {
            const targetPiece = chess.get(squareRepresentation);
            if (targetPiece) {
                // Capturable piece - red background
                baseClass += ' bg-red-400';
            } else {
                // Empty square - green dot
                baseClass += ' relative';
            }
        }
        
        return baseClass;
    };

    const handleSquareClick = (squareRepresentation: Square) => {
        if (chess.isGameOver()) {
            console.log("Game is over - no more moves allowed");
            return; // Prevent any action if game is over
        }
        
        // Check if it's the player's turn
        const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
        if (playerColor !== currentTurn) {
            console.log("It's not your turn!");
            return;
        }

        if (!from) {
            // Selecting a piece
            const piece = chess.get(squareRepresentation);
            if (piece && piece.color === chess.turn()) {
                setFrom(squareRepresentation);
            }
        } else {
            // Making a move
            const isValidMove = validMoves.some(move => move.to === squareRepresentation);
            
            if (isValidMove) {
                // Apply move locally immediately for responsiveness
                try {
                    chess.move({ from, to: squareRepresentation });
                    
                    // Send move to server
                    socket.send(JSON.stringify({
                        type: MOVE,
                        payload: {
                            move: {
                                from,
                                to: squareRepresentation
                            }
                        }
                    }));
                    
                    setFrom(null);
                    console.log({
                        from,
                        to: squareRepresentation
                    });
                } catch (error) {
                    console.error("Error making move:", error);
                    setFrom(null);
                }
            } else {
                // If clicking on another piece of the same color, select it instead
                const piece = chess.get(squareRepresentation);
                if (piece && piece.color === chess.turn()) {
                    setFrom(squareRepresentation);
                } else {
                    // Invalid move, deselect
                    setFrom(null);
                }
            }
        }
    };

    return <div className="text-white-200">
        {chess.board().map((row, i) => {
            return <div key={i} className="flex">
                {row.map((square, j) => {
                    const squareRepresentation = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
                    const squareClass = getSquareClass(squareRepresentation, i, j);
                    const validMove = validMoves.find(move => move.to === squareRepresentation);
                    const targetPiece = chess.get(squareRepresentation);

                    return (
                        <div 
                            onClick={() => handleSquareClick(squareRepresentation)} 
                            key={j} 
                            className={`${squareClass} cursor-pointer transition-all duration-200 hover:opacity-80`}
                        >
                            <div className="w-full justify-center flex h-full relative">
                                <div className="h-full justify-center flex flex-col">
                                    {square ? (
                                        <img 
                                            className="w-4" 
                                            src={`/${square?.color === "b" ? square?.type : `${square?.type?.toUpperCase()} copy`}.png`} 
                                        />
                                    ) : null}
                                </div>
                                
                                {/* Valid move indicator for empty squares */}
                                {validMove && !targetPiece && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-green-600 rounded-full opacity-70"></div>
                                    </div>
                                )}
                                
                                {/* Capturable piece indicator */}
                                {validMove && targetPiece && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-red-600 rounded-full opacity-70"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        })}
    </div>
}