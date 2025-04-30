const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const deck = ['2♥', '5♦', '7♠', 'K♣', 'A♥', '9♦', 'Q♠', 'J♣', '3♠', '8♥', '4♦', '6♣', '10♠'];
const players = {};

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; 
    }
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    players[socket.id] = { hand: [] };
    shuffleDeck();
    for (let i = 0; i < 7; i++) {
        players[socket.id].hand.push(deck.pop());
    }

    socket.emit("yourHand", players[socket.id].hand);

    socket.on("drawCard", () => {
        if (deck.length > 0) {
            players[socket.id].hand.push(deck.pop());
            socket.emit("yourHand", players[socket.id].hand);
        }
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id]; 
    });
});

server.listen(3000, () => console.log("Server running on port 3000"));