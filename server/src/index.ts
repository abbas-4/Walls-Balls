import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = 3001;

app.get("/", (_req, res) => {
  res.json({ message: "Walls and Balls server is running!" });
});

const colors = ["#38bdf8", "#fb7185", "#a3e635", "#fbbf24"];

io.on("connection", (socket) => {
  const player = {
    id: socket.id,
    name: `Player ${io.engine.clientsCount}`,
    x: 100 + Math.random() * 400,
    y: 100 + Math.random() * 200,
    color: colors[Math.floor(Math.random() * colors.length)],
    score: 0,
  };

  socket.emit("welcome", player);
  socket.broadcast.emit("player-joined", player);

  socket.on("move", (position: { x: number; y: number }) => {
    socket.broadcast.emit("player-moved", {
      id: socket.id,
      x: position.x,
      y: position.y,
    });
  });

  socket.on("disconnect", () => {
    io.emit("player-left", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Walls and Balls server running at http://localhost:${PORT}`);
});
