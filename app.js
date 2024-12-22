const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const chess = new Chess();

let players = {}; 

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.render('index', {title: 'Chess game'});
});

io.on("connection", function(uniquesoket){
    console.log("connection");

    if (!players.white) {
        players.white = uniquesoket.id;
        uniquesoket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesoket.id;
        uniquesoket.emit("playerRole", "b");
    } else {
        uniquesoket.emit("spectatorole");
    }

    uniquesoket.on("disconnect", function() {
        if (uniquesoket.id === players.white) {
            delete players.white;
        } else if (uniquesoket.id === players.black) {
            delete players.black;
        }
    });

    uniquesoket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && uniquesoket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesoket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move", move);
                uniquesoket.emit("invalidmove", move);
            }

        } catch (error) {
            console.log(error);
            uniquesoket.emit("invalidmove", move);
        }
    });
});

server.listen(3000, function () {
    console.log("Server running on http://localhost:3000");
});
