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

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    if (Object.keys(players).length < 2) {
        players[socket.id] = { hand: [] };
        socket.emit("playerAssigned", Object.keys(players).length);

        if (Object.keys(players).length === 2) {
            startGame();
        }
    } else {
        socket.emit("playerStatus", "Game is full! Try again later.");
        socket.disconnect();
    }

    socket.on("submitHand", (hand) => {
        if (isValidHand(hand)) {
            io.emit("gameWin", `Player ${Object.keys(players).indexOf(socket.id) + 1}`);
            gameActive = false;
        }
    });

    socket.on("restartGame", () => {
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
        io.to(playerId).emit("yourHand", players[playerId].hand);
    });
    gameActive = true;
}

function isValidHand(hand) {
    // Basic logic for checking if the hand is valid (sequences or sets)
    return true; // You can implement more detailed validation here
}

server.listen(3000, () => console.log("Server running on port 3000"));