import type * as Party from "partykit/server";
import { GameSimulation } from "../shared/simulation.js";
import { GAME_STATE } from "../shared/config.js";

const TICK_RATE = 20; // 20Hz server tick
const TICK_MS = 1000 / TICK_RATE;

interface PlayerInfo {
  role: "teacher" | "pupil" | "unassigned";
  lastInput: any;
  prevClick: boolean;
}

export default class RecessRevengeServer implements Party.Server {
  simulation: GameSimulation;
  players: Map<string, PlayerInfo>;
  gameLoopInterval: ReturnType<typeof setInterval> | null;
  countdownInterval: ReturnType<typeof setInterval> | null;

  constructor(readonly room: Party.Room) {
    this.simulation = new GameSimulation();
    this.players = new Map();
    this.gameLoopInterval = null;
    this.countdownInterval = null;
  }

  onConnect(connection: Party.Connection) {
    const player: PlayerInfo = {
      role: "unassigned",
      lastInput: null,
      prevClick: false,
    };

    this.players.set(connection.id, player);

    // Send player their ID
    connection.send(JSON.stringify({
      type: "role",
      role: "unassigned",
      playerId: connection.id,
    }));

    // Send obstacle layout
    connection.send(JSON.stringify(this.simulation.serializeInit()));

    // Broadcast lobby state to all
    this.broadcastLobbyState();
  }

  onMessage(message: string, sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    try {
      const data = JSON.parse(message as string);

      switch (data.type) {
        case "selectRole": {
          if (this.simulation.state !== GAME_STATE.LOBBY) break;
          const requestedRole = data.role;
          if (requestedRole !== "teacher" && requestedRole !== "pupil") break;

          // Check if role is available
          const roleTaken = [...this.players.entries()].some(
            ([id, p]) => id !== sender.id && p.role === requestedRole
          );
          if (roleTaken) break;

          // If player had a different role, free it
          player.role = requestedRole;
          this.broadcastLobbyState();
          break;
        }

        case "start": {
          if (this.simulation.state !== GAME_STATE.LOBBY) break;
          if (!this.hasAllPlayers()) break;
          this.startCountdown();
          break;
        }

        case "input":
          player.lastInput = data.input;
          break;

        case "restart":
          if (this.simulation.state === GAME_STATE.GAME_OVER) {
            // Reset all players to unassigned and go back to lobby
            this.simulation.state = GAME_STATE.LOBBY;
            for (const [, p] of this.players) {
              p.role = "unassigned";
              p.lastInput = null;
              p.prevClick = false;
            }
            this.broadcastLobbyState();
          }
          break;
      }
    } catch (err) {
      // Ignore bad messages
    }
  }

  onClose(connection: Party.Connection) {
    const player = this.players.get(connection.id);
    this.players.delete(connection.id);

    if (player && (player.role === "teacher" || player.role === "pupil")) {
      // If game was playing, end it
      if (this.simulation.state === GAME_STATE.PLAYING) {
        this.stopGameLoop();
        this.simulation.state = GAME_STATE.LOBBY;

        this.room.broadcast(JSON.stringify({
          type: "disconnected",
          role: player.role,
          message: `${player.role === "teacher" ? "Teacher" : "Pupil"} disconnected.`,
        }));
      }

      // If countdown was running, cancel it
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }

    // Always broadcast updated lobby state
    this.broadcastLobbyState();
  }

  hasAllPlayers(): boolean {
    const roles = [...this.players.values()].map(p => p.role);
    return roles.includes("teacher") && roles.includes("pupil");
  }

  broadcastLobbyState() {
    const teacherPlayer = [...this.players.entries()].find(([, p]) => p.role === "teacher");
    const pupilPlayer = [...this.players.entries()].find(([, p]) => p.role === "pupil");

    this.room.broadcast(JSON.stringify({
      type: "lobby",
      playerCount: this.players.size,
      teacherTaken: !!teacherPlayer,
      pupilTaken: !!pupilPlayer,
      teacherId: teacherPlayer?.[0] || null,
      pupilId: pupilPlayer?.[0] || null,
      canStart: !!teacherPlayer && !!pupilPlayer,
    }));
  }

  startCountdown() {
    if (this.countdownInterval) return;
    let countdown = 3;

    this.room.broadcast(JSON.stringify({
      type: "countdown",
      count: countdown,
    }));

    this.countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.room.broadcast(JSON.stringify({
          type: "countdown",
          count: countdown,
        }));
      } else {
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
        this.startGame();
      }
    }, 1000);
  }

  startGame() {
    this.simulation.startGame();

    this.room.broadcast(JSON.stringify({
      type: "start",
    }));

    this.startGameLoop();
  }

  startGameLoop() {
    if (this.gameLoopInterval) return;

    this.gameLoopInterval = setInterval(() => {
      this.gameTick();
    }, TICK_MS);
  }

  stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  gameTick() {
    if (this.simulation.state !== GAME_STATE.PLAYING) {
      this.stopGameLoop();
      return;
    }

    // Gather inputs
    const teacherInput = this.getPlayerInput("teacher");
    const pupilInput = this.getPlayerInput("pupil");

    const deltaTime = 1 / TICK_RATE;
    this.simulation.update(deltaTime, teacherInput, pupilInput);

    // Broadcast state
    const state = this.simulation.serialize();
    this.room.broadcast(JSON.stringify(state));

    // Stop loop if game ended
    if (this.simulation.state === GAME_STATE.GAME_OVER) {
      this.stopGameLoop();
    }
  }

  getPlayerInput(role: string): any {
    for (const [, player] of this.players) {
      if (player.role === role && player.lastInput) {
        const input = { ...player.lastInput };
        // For pupil: detect rising edge (mouseDown goes from false to true)
        if (role === "pupil") {
          const isDown = !!input.click;
          input.click = isDown && !player.prevClick;
          player.prevClick = isDown;
        }
        return input;
      }
    }
    // Default inputs
    if (role === "teacher") {
      return { up: false, down: false, left: false, right: false, sprint: false };
    }
    return { mouseX: 0, mouseY: 0, click: false };
  }
}
