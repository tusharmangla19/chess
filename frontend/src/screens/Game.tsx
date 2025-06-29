import { useEffect, useState, useRef } from "react";
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { VideoCallButton } from "../components/VideoCallButton"
import { useSocket } from "../hooks/useSocket";
import { useVideoCall } from "../hooks/useVideoCall";
import { Chess } from 'chess.js'

// Message types
const INIT_GAME = "init_game";
const MOVE = "move";
const GAME_OVER = "game_over";
const ERROR = "error";
const SINGLE_PLAYER = "single_player";
const CREATE_ROOM = "create_room";
const JOIN_ROOM = "join_room";
const ROOM_CREATED = "room_created";
const ROOM_JOINED = "room_joined";
const ROOM_NOT_FOUND = "room_not_found";
const WAITING_FOR_OPPONENT = "waiting_for_opponent";

// Video call message types
const VIDEO_CALL_REQUEST = "video_call_request";
const VIDEO_CALL_ACCEPTED = "video_call_accepted";
const VIDEO_CALL_REJECTED = "video_call_rejected";
const VIDEO_CALL_ENDED = "video_call_ended";
const VIDEO_OFFER = "video_offer";
const VIDEO_ANSWER = "video_answer";
const ICE_CANDIDATE = "ice_candidate";

type GameMode = 'menu' | 'single_player' | 'multiplayer' | 'room_creator' | 'room_joiner';

export const Game = () => {
    const socket = useSocket();
    const chessRef = useRef(new Chess());
    const [gameMode, setGameMode] = useState<GameMode>('menu');
    const [roomId, setRoomId] = useState('');
    const [createdRoomId, setCreatedRoomId] = useState('');
    const [waitingForOpponent, setWaitingForOpponent] = useState(false);
    const [started, setStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ callId: string; from: string } | null>(null);
    const [opponentId] = useState<string>('opponent');
    const [moveCount, setMoveCount] = useState(0);

    const {
        videoCallState,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        handleVideoMessage,
        localVideoRef,
        remoteVideoRef
    } = useVideoCall(socket, 'player');

    useEffect(() => {
        if (!socket) return;
 // useEffect sirf ek baar chalke socket.onmessage ko set karta hai.
// Fir jab bhi server se koi message aata hai, socket.onmessage chalega — useEffect dobara nahi chalega.

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                // Handle video call messages
                if ([VIDEO_CALL_REQUEST, VIDEO_CALL_ACCEPTED, VIDEO_CALL_REJECTED, VIDEO_CALL_ENDED, VIDEO_OFFER, VIDEO_ANSWER, ICE_CANDIDATE].includes(message.type)) {
                    handleVideoMessage(message);
                    
                    if (message.type === VIDEO_CALL_REQUEST) {
                        setIncomingCall({
                            callId: message.payload.callId,
                            from: message.from
                        });
                    }
                    
                    if (message.type === VIDEO_CALL_ACCEPTED || message.type === VIDEO_CALL_REJECTED) {
                        setIncomingCall(null);
                    }
                    
                    return;
                }

                switch (message.type) {
                    case INIT_GAME:
                        setStarted(true);
                        setPlayerColor(message.payload.color);
                        setWaitingForOpponent(false);
                        break;
                    case MOVE:
                        const move = message.payload.move;
                        try {
                            // Apply move only after server validation
                            // This ensures we only show moves that the server has validated
                            chessRef.current.move(move);
                            setMoveCount(prev => prev + 1);
                            console.log("Move applied after server validation:", move);
                        } catch (error) {
                            console.error("Error applying server-validated move:", error);
                            // This shouldn't happen if server validation is working correctly
                            setErrorMessage("Error applying move from server");
                            setTimeout(() => setErrorMessage(null), 3000);
                        }
                        break;
                    case GAME_OVER:
                        const winner = message.payload.winner;
                        const reason = message.payload.reason;
                        let gameOverMessage = '';
                        
                        if (winner) {
                            gameOverMessage = `Game Over! ${winner} wins by ${reason}!`;
                        } else {
                            gameOverMessage = `Game Over! Draw by ${reason}!`;
                        }
                        
                        setErrorMessage(gameOverMessage);
                        // Don't auto-clear game over messages
                        break;
                    case ERROR:
                        setErrorMessage(message.payload.message);
                        setTimeout(() => setErrorMessage(null), 3000);
                        break;
                    case WAITING_FOR_OPPONENT:
                        setWaitingForOpponent(true);
                        break;
                    case ROOM_CREATED:
                        setCreatedRoomId(message.payload.roomId);
                        setWaitingForOpponent(true);
                        break;
                    case ROOM_JOINED:
                        setStarted(true);
                        setPlayerColor(message.payload.color);
                        setWaitingForOpponent(false);
                        break;
                    case ROOM_NOT_FOUND:
                        setErrorMessage(message.payload.message);
                        setTimeout(() => setErrorMessage(null), 3000);
                        break;
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
                setErrorMessage("Error processing server message");
                setTimeout(() => setErrorMessage(null), 3000);
            }
        };
    }, [socket, handleVideoMessage]);

    const startSinglePlayer = () => {
        if (socket) {
            socket.send(JSON.stringify({ type: SINGLE_PLAYER }));
            setGameMode('single_player');
        }
    };

    const startMultiplayer = () => {
        if (socket) {
            socket.send(JSON.stringify({ type: INIT_GAME }));
            setGameMode('multiplayer');
            setWaitingForOpponent(true);
        }
    };

    const createRoom = () => {
        if (socket) {
            socket.send(JSON.stringify({ type: CREATE_ROOM }));
            setGameMode('room_creator');
        }
    };

    const joinRoom = () => {
        if (socket && roomId.trim()) {
            const cleanRoomId = roomId.trim().toUpperCase();
            if (!/^[A-Z0-9]{6}$/.test(cleanRoomId)) {
                setErrorMessage("Room code must be 6 characters (letters and numbers)");
                setTimeout(() => setErrorMessage(null), 3000);
                return;
            }
            
            socket.send(JSON.stringify({
                type: JOIN_ROOM,
                payload: { roomId: cleanRoomId }
            }));
            setGameMode('room_joiner');
        }
    };

    const resetGame = () => {
        chessRef.current = new Chess();
        setStarted(false);
        setPlayerColor(null);
        setGameMode('menu');
        setRoomId('');
        setCreatedRoomId('');
        setWaitingForOpponent(false);
    };

    const handleStartVideoCall = () => {
        if (started && opponentId) {
            startCall(opponentId);
        }
    };

    const handleAcceptIncomingCall = () => {
        if (incomingCall) {
            acceptCall(incomingCall.callId, incomingCall.from);
            setIncomingCall(null);
        }
    };

    const handleRejectIncomingCall = () => {
        if (incomingCall) {
            rejectCall(incomingCall.callId, incomingCall.from);
            setIncomingCall(null);
        }
    };

    if (!socket) return <div className="flex justify-center items-center h-screen text-white">Connecting...</div>

    const currentTurn = chessRef.current.turn() === 'w' ? 'white' : 'black';
    const isPlayerTurn = playerColor === currentTurn;
    const moveHistory = chessRef.current.history();

    // Game Menu
    if (gameMode === 'menu') {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h1 className="text-3xl font-bold text-white text-center mb-8">♔ Chess Game ♔</h1>
                    
                    <div className="space-y-4">
                        <Button onClick={startSinglePlayer} className="w-full">
                            🎮 Play vs AI
                        </Button>
                        
                        <Button onClick={startMultiplayer} className="w-full">
                            👥 Find Opponent
                        </Button>
                        
                        <Button onClick={createRoom} className="w-full">
                            🏠 Create Room
                        </Button>
                        
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Enter Room Code"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:border-blue-500"
                                maxLength={6}
                            />
                            <Button onClick={joinRoom} disabled={!roomId.trim()}>
                                Join
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Waiting for opponent screen
    if (waitingForOpponent && !started) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <div className="bg-slate-800 p-8 rounded-lg shadow-lg text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <h2 className="text-xl text-white mb-2">Waiting for opponent...</h2>
                    {createdRoomId && (
                        <div className="bg-slate-700 p-4 rounded-lg mt-4">
                            <p className="text-gray-300 text-sm">Room Code:</p>
                            <p className="text-white text-2xl font-mono font-bold">{createdRoomId}</p>
                            <p className="text-gray-400 text-xs mt-2">Share this code with your friend</p>
                        </div>
                    )}
                    <Button onClick={resetGame} className="mt-4">
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    // Main Game Screen
    return <div className="justify-center flex">
        <div className="pt-8 max-w-screen-lg w-full">
            {/* Error Popup */}
            {errorMessage && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
                    <div className="flex items-center">
                        <span className="mr-2">⚠️</span>
                        {errorMessage}
                    </div>
                </div>
            )}

            {/* Incoming Call Notification */}
            {incomingCall && (
                <div className="fixed top-4 left-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    <div className="flex items-center">
                        <span className="mr-2">📞</span>
                        <span>Incoming call from {incomingCall.from}</span>
                        <button
                            onClick={handleAcceptIncomingCall}
                            className="ml-4 bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm"
                        >
                            Accept
                        </button>
                        <button
                            onClick={handleRejectIncomingCall}
                            className="ml-2 bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-6 gap-4 w-full">
                <div className="col-span-4 w-full flex justify-center">
                    <ChessBoard 
                        chess={chessRef.current} 
                        socket={socket} 
                        playerColor={playerColor}
                        moveCount={moveCount}
                    />
                </div>
                <div className="col-span-2 bg-slate-900 w-full flex justify-center">
                    <div className="pt-8 w-full px-4">
                        <div className="text-white space-y-4">
                            <div className="text-center">
                                <h2 className="text-xl mb-2">Game Status</h2>
                                <div className={`text-lg font-semibold ${isPlayerTurn ? 'text-green-400' : 'text-gray-400'}`}>
                                    {gameMode === 'single_player' ? 
                                        (isPlayerTurn ? 'Your Turn' : "AI's Turn") : 
                                        (isPlayerTurn ? 'Your Turn' : "Opponent's Turn")
                                    }
                                </div>
                            </div>
                            
                            <div className="bg-slate-800 p-4 rounded-lg">
                                <div className="text-sm text-gray-300 mb-2">You are playing as:</div>
                                <div className={`text-lg font-bold ${playerColor === 'white' ? 'text-white' : 'text-gray-300'}`}>
                                    {playerColor === 'white' ? '⚪ White' : '⚫ Black'}
                                </div>
                            </div>
                            
                            <div className="bg-slate-800 p-4 rounded-lg">
                                <div className="text-sm text-gray-300 mb-2">Current turn:</div>
                                <div className={`text-lg font-bold ${currentTurn === 'white' ? 'text-white' : 'text-gray-300'}`}>
                                    {currentTurn === 'white' ? '⚪ White' : '⚫ Black'}
                                </div>
                            </div>

                            {/* Video Call Section */}
                            {started && gameMode !== 'single_player' && (
                                <div className="bg-slate-800 p-4 rounded-lg">
                                    <div className="text-sm text-gray-300 mb-2">Video Call:</div>
                                    <VideoCallButton
                                        onClick={videoCallState.isInCall ? endCall : handleStartVideoCall}
                                        disabled={!started}
                                        isInCall={videoCallState.isInCall}
                                        className="w-full"
                                    />
                                    {videoCallState.isInCall && (
                                        <div className="mt-2 text-xs text-gray-400">
                                            {videoCallState.isCallActive ? 'Call Active' : 'Connecting...'}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Move History */}
                            <div className="bg-slate-800 p-4 rounded-lg">
                                <div className="text-sm text-gray-300 mb-2">Move History:</div>
                                <div className="max-h-32 overflow-y-auto text-xs">
                                    {moveHistory.length === 0 ? (
                                        <div className="text-gray-500">No moves yet</div>
                                    ) : (
                                        <div className="space-y-1">
                                            {moveHistory.map((move, index) => (
                                                <div key={index} className="flex justify-between">
                                                    <span className="text-gray-400">{Math.floor(index / 2) + 1}.</span>
                                                    <span className="text-white">{move}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {chessRef.current.isCheckmate() && (
                                <div className="bg-red-600 p-4 rounded-lg text-center">
                                    <div className="text-lg font-bold">Checkmate!</div>
                                    <div className="text-sm">{currentTurn === 'white' ? 'Black' : 'White'} wins!</div>
                                </div>
                            )}
                            
                            {chessRef.current.isDraw() && !chessRef.current.isCheckmate() && (
                                <div className="bg-yellow-600 p-4 rounded-lg text-center">
                                    <div className="text-lg font-bold">Draw!</div>
                                    <div className="text-sm">
                                        {chessRef.current.isStalemate() && 'Stalemate'}
                                        {chessRef.current.isThreefoldRepetition() && 'Threefold Repetition'}
                                        {chessRef.current.isInsufficientMaterial() && 'Insufficient Material'}
                                        {chessRef.current.isDraw() && !chessRef.current.isStalemate() && 
                                         !chessRef.current.isThreefoldRepetition() && !chessRef.current.isInsufficientMaterial() && 
                                         'Fifty-Move Rule'}
                                    </div>
                                </div>
                            )}
                            
                            {chessRef.current.isCheck() && !chessRef.current.isCheckmate() && (
                                <div className="bg-orange-600 p-4 rounded-lg text-center">
                                    <div className="text-lg font-bold">Check!</div>
                                </div>
                            )}
                            
                            {chessRef.current.isGameOver() && (
                                <div className="bg-gray-600 p-4 rounded-lg text-center">
                                    <div className="text-lg font-bold">Game Over</div>
                                    <div className="text-sm">No more moves allowed</div>
                                </div>
                            )}
                            
                            <Button onClick={resetGame} className="w-full">
                                New Game
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Call Section Below Chess Board */}
            {videoCallState.isInCall && (
                <div className="mt-6 bg-slate-800 rounded-lg p-4">
                    <div className="text-white text-center mb-4">
                        <h3 className="text-lg font-semibold">Video Call</h3>
                        {!videoCallState.isCallActive && (
                            <p className="text-sm text-gray-400">Connecting...</p>
                        )}
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                        {/* Remote Video */}
                        <div className="relative">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-64 h-48 bg-slate-700 rounded-lg object-cover"
                                muted={false}
                            />
                            {!videoCallState.remoteStream && (
                                <div className="absolute inset-0 bg-slate-700 rounded-lg flex items-center justify-center">
                                    <div className="text-white text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                        <p className="text-sm">Waiting for opponent...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Local Video */}
                        <div className="relative">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted={true}
                                className="w-64 h-48 bg-slate-700 rounded-lg object-cover"
                            />
                            {!videoCallState.isVideoEnabled && (
                                <div className="absolute inset-0 bg-slate-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-sm">Camera Off</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Video Controls */}
                    <div className="flex justify-center space-x-4 mt-4">
                        <button
                            onClick={toggleMute}
                            className={`px-4 py-2 rounded-full transition-colors ${
                                videoCallState.isMuted
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-slate-600 hover:bg-slate-700 text-white'
                            }`}
                        >
                            {videoCallState.isMuted ? '🔇' : '🎤'}
                        </button>
                        
                        <button
                            onClick={toggleVideo}
                            className={`px-4 py-2 rounded-full transition-colors ${
                                !videoCallState.isVideoEnabled
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-slate-600 hover:bg-slate-700 text-white'
                            }`}
                        >
                            {videoCallState.isVideoEnabled ? '📹' : '🚫'}
                        </button>
                        
                        <button
                            onClick={endCall}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors"
                        >
                            📞
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
}