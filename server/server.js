const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const deck = ['2♥', '5♦', '7♠', 'K♣', 'A♥', '9♦', 'Q♠', 'J♣', '3♠', '8♥', '4♦', '6♣', '10♠'];
const players = {};
let gameActive = false;

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

app.get("/", (req, res) => {
    res.send("WebSocket server is running!");
});

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    console.log("Current players:", Object.keys(players)); // Debug log

    if (Object.keys(players).length < 2) {
        players[socket.id] = { hand: [] };
        console.log(`Player ${Object.keys(players).length} assigned.`);
        socket.emit("playerAssigned", Object.keys(players).length);

        if (Object.keys(players).length === 2) {
            console.log("Two players connected. Starting the game...");
            startGame();
        }
    } else {
        console.log("Game is full. Disconnecting:", socket.id);
        socket.emit("playerStatus", "Game is full! Try again later.");
        socket.disconnect();
    }

    socket.on("submitHand", (hand) => {
        console.log(`Player submitted hand: ${hand}`); // Debug log
        if (isValidHand(hand)) {
            const playerIndex = Object.keys(players).indexOf(socket.id) + 1;
            io.emit("gameWin", `Player ${playerIndex} wins!`);
            gameActive = false;
        } else {
            socket.emit("invalidHand", "Your hand is invalid! Try again.");
        }
    });

    socket.on("restartGame", () => {
        console.log("Restarting game...");
        gameActive = true;
        startGame();
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
    });
});

function startGame() {
    shuffleDeck();
    Object.keys(players).forEach((playerId) => {
        players[playerId].hand = [];
        for (let i = 0; i < 7; i++) {
            players[playerId].hand.push(deck.pop());
        }
        console.log(`Dealing hand to Player ${Object.keys(players).indexOf(playerId) + 1}:`, players[playerId].hand); // Debug log
        io.to(playerId).emit("yourHand", players[playerId].hand);
    });
    gameActive = true;
    console.log("Game has started.");
}

function isValidHand(hand) {
    // Placeholder: Implement detailed validation for sequences/sets
    return true; // Placeholder: Add proper logic later
}

server.listen(3000, () => console.log("Server running on port 3000"));