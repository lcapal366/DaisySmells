const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors"); // ✅ Added CORS support

const app = express();
const server = http.createServer(app);

// ✅ Enable CORS for WebSocket connections
app.use(cors({
    origin: "https://lcapal366.github.io",
    methods: ["GET", "POST"]
}));

const io = socketIo(server, {
    cors: {
        origin: "https://lcapal366.github.io", // Allow GitHub Pages access
        methods: ["GET", "POST"]
    }
});

const deck = [
    '2♥', '5♦', '7♠', 'K♣', 'A♥', '9♦', 'Q♠', 'J♣', '3♠', '8♥', 
    '4♦', '6♣', '10♠', '2♠', '5♣', '7♦', 'K♠', 'A♣', '9♠', 'Q♦', 'J♠'
]; // Expanded deck for better gameplay
const players = {};
let gameActive = false;

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    console.log("🃏 Deck shuffled:", deck); // Debug log for deck
}

// ✅ Root route for checking if the server is running
app.get("/", (req, res) => {
    res.send("WebSocket server is running!");
});

io.on("connection", (socket) => {
    console.log("🔹 New connection detected! Player Socket ID:", socket.id);
    console.log("🔹 Checking existing players:", Object.keys(players));

    if (Object.keys(players).length < 2) {
        players[socket.id] = { hand: [] };
        console.log(`✅ Player ${Object.keys(players).length} assigned to ID: ${socket.id}`);
        socket.emit("playerAssigned", Object.keys(players).length);

        if (Object.keys(players).length === 2) {
            console.log("🚀 Two players connected. Triggering startGame()...");
            startGame();
        }
    } else {
        console.log("❌ Game is full. Disconnecting player:", socket.id);
        socket.emit("playerStatus", "Game is full! Try again later.");
        socket.disconnect();
    }

    // ✅ Ping test to check if WebSocket is connected
    socket.emit("serverPing", "WebSocket connection established with backend.");

    // Listen for submitted hands
    socket.on("submitHand", (hand) => {
        console.log(`🃏 Player ${Object.keys(players).indexOf(socket.id) + 1} submitted their hand:`, hand);
        
        if (isValidHand(hand)) {
            console.log(`🏆 Player ${Object.keys(players).indexOf(socket.id) + 1} wins!`);
            io.emit("gameWin", `Player ${Object.keys(players).indexOf(socket.id) + 1} wins!`);
            gameActive = false;
        } else {
            console.log("❌ Invalid hand submitted.");
            socket.emit("invalidHand", "Your hand is invalid! Try again.");
        }
    });

    // Restart the game
    socket.on("restartGame", () => {
        console.log("🔄 Restarting game...");
        gameActive = true;
        startGame();
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
        console.log("🔻 Player disconnected:", socket.id);
        delete players[socket.id];
    });
});

function startGame() {
    console.log("🛠 Triggered startGame() function...");
    shuffleDeck();

    Object.keys(players).forEach((playerId, index) => {
        players[playerId].hand = [];
        for (let i = 0; i < 7; i++) {
            players[playerId].hand.push(deck.pop());
        }
        console.log(`✅ Hand dealt to Player ${index + 1} (ID: ${playerId}):`, players[playerId].hand);
        io.to(playerId).emit("yourHand", players[playerId].hand);
    });

    gameActive = true;
    console.log("🎯 Game has started successfully.");
}

// Function to validate hands (to be improved later)
function isValidHand(hand) {
    return true; // Placeholder logic for validating sets/sequences
}

server.listen(3000, () => console.log("✅ Server running on port 3000"));