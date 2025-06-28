# Chess Game with Video Call

A multiplayer chess game with integrated video call functionality built with React, TypeScript, and WebRTC.

## Features

### Chess Game
- Multiplayer chess gameplay
- Single player vs AI
- Room-based multiplayer with custom room codes
- Real-time move synchronization
- Game state management
- Move history tracking

### Video Call
- **WebRTC-based video calling** between players
- **Real-time audio and video** communication
- **Mute/unmute** functionality
- **Enable/disable camera** functionality
- **Call controls** (accept, reject, end call)
- **Picture-in-picture** local video display
- **Automatic connection** handling

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- WebRTC with simple-peer library
- WebSocket for real-time communication

### Backend
- Node.js with TypeScript
- WebSocket server for real-time messaging
- Video call signaling server
- Chess.js for game logic

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chess-new-chat-and-vc
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend1
   npm install
   ```

4. **Build the backend**
   ```bash
   npm run build
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend1
   npm start
   ```
   The WebSocket server will start on port 8081.

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The React app will start on port 5173.

3. **Open your browser**
   Navigate to `http://localhost:5173`

## How to Use Video Call

### Starting a Video Call
1. Start a multiplayer game (either "Find Opponent" or join/create a room)
2. Once the game starts, you'll see a "Video Call" button in the sidebar
3. Click the button to initiate a video call with your opponent
4. Grant camera and microphone permissions when prompted

### Receiving a Video Call
1. When an opponent initiates a call, you'll see an incoming call notification
2. Click "Accept" to join the call or "Decline" to reject it
3. Grant camera and microphone permissions when prompted

### During a Video Call
- **Mute/Unmute**: Click the microphone button to toggle audio
- **Enable/Disable Camera**: Click the camera button to toggle video
- **End Call**: Click the phone button to end the call
- **Local Video**: Your video appears in a small picture-in-picture window

### Call Controls
- **Green microphone icon**: Audio enabled
- **Red microphone icon**: Audio muted
- **Camera icon**: Video enabled
- **Crossed camera icon**: Video disabled
- **Phone icon**: End call

## Technical Details

### WebRTC Implementation
- Uses `simple-peer` library for WebRTC peer connections
- STUN servers for NAT traversal
- Signaling through WebSocket server
- Automatic connection establishment

### Video Call Flow
1. **Call Request**: Initiator sends call request through WebSocket
2. **Call Acceptance**: Receiver accepts and establishes peer connection
3. **Signaling**: WebRTC offer/answer exchange through server
4. **Media Stream**: Direct peer-to-peer video/audio streaming
5. **Call Management**: Mute, video toggle, and call termination

### Security Features
- HTTPS required for camera/microphone access
- WebRTC encryption for media streams
- Secure signaling through WebSocket

## Browser Compatibility

The video call feature requires:
- Modern browsers with WebRTC support
- HTTPS connection (for camera/microphone access)
- Camera and microphone permissions

Supported browsers:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Troubleshooting

### Video Call Issues
1. **Camera not working**: Check browser permissions and HTTPS
2. **No audio**: Ensure microphone permissions are granted
3. **Connection failed**: Check firewall settings and STUN server availability
4. **Poor quality**: Check internet connection and browser WebRTC settings

### Game Issues
1. **Connection lost**: Refresh the page and reconnect
2. **Moves not syncing**: Check WebSocket connection status
3. **Room not found**: Verify room code and ensure room exists

## Development

### Project Structure
```
chess-new-chat-and-vc/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── screens/        # Page components
│   │   └── types/          # TypeScript types
│   └── package.json
├── backend1/                # Node.js backend
│   ├── src/
│   │   ├── game-manager.ts # Game logic
│   │   ├── types.ts        # TypeScript types
│   │   └── index.ts        # Server entry point
│   └── package.json
└── README.md
```

### Adding Features
- Video call components are in `frontend/src/components/`
- Video call logic is in `frontend/src/hooks/useVideoCall.ts`
- Backend signaling is in `backend1/src/game-manager.ts`

## License

This project is licensed under the MIT License. 