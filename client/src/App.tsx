import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
};

const socket = io("http://localhost:3001", { autoConnect: false });

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [me, setMe] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("welcome", (p: Player) => {
      setMe(p.id);
      setPlayers(old => [...old.filter(x => x.id !== p.id), p]);
    });
    socket.on("player-joined", (p: Player) =>
      setPlayers(old => [...old.filter(x => x.id !== p.id), p]));
    socket.on("player-moved", (p: { id: string; x: number; y: number }) =>
      setPlayers(old => old.map(x => x.id === p.id ? { ...x, ...p } : x)));
    socket.on("player-left", (id: string) =>
      setPlayers(old => old.filter(p => p.id !== id)));
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  function move(dx: number, dy: number) {
    const p = players.find(x => x.id === me);
    if (!p) return;
    const next = {
      x: Math.max(20, Math.min(700, p.x + dx)),
      y: Math.max(20, Math.min(380, p.y + dy))
    };
    setPlayers(old => old.map(x => x.id === me ? { ...x, ...next } : x));
    socket.emit("move", next);
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const d: Record<string, [number, number]> = {
        ArrowUp: [0, -12], w: [0, -12],
        ArrowDown: [0, 12], s: [0, 12],
        ArrowLeft: [-12, 0], a: [-12, 0],
        ArrowRight: [12, 0], d: [12, 0]
      };
      if (d[e.key]) {
        e.preventDefault();
        move(...d[e.key]);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: 20, color: "#eef2ff", fontFamily: "Arial", background: "#0b1020", minHeight: "80vh" }}>
      <h1>WALLS <span style={{ color: "#5eead4" }}>&amp;</span> BALLS</h1>
      <p>{connected ? "🟢 Connected to multiplayer server" : "🟡 Connecting to server…"}</p>
      <h2>Live Arena · {players.length} players</h2>
      <div style={{ height: 430, position: "relative", overflow: "hidden", background: "#111c30", border: "1px solid #334155", borderRadius: 12 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#ffffff0a 1px,transparent 1px),linear-gradient(90deg,#ffffff0a 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        {players.map(p => (
          <div key={p.id} style={{ position: "absolute", left: p.x, top: p.y, width: 18, height: 18, borderRadius: "50%", background: p.color, boxShadow: `0 0 20px ${p.color}`, transform: "translate(-50%,-50%)" }} title={p.id === me ? "You" : p.name} />
        ))}
      </div>
      <p>Move with WASD or arrow keys, or use these buttons:</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => move(0, -12)}>↑</button>
        <button onClick={() => move(-12, 0)}>←</button>
        <button onClick={() => move(0, 12)}>↓</button>
        <button onClick={() => move(12, 0)}>→</button>
      </div>
      <p>You're {players.find(p => p.id === me)?.name ?? "joining"}.</p>
    </main>
  );
}
