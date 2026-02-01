import type * as Party from "partykit/server";
import { GameSimulation } from "../shared/simulation.js";
import { GAME_STATE } from "../shared/config.js";

const TICK_RATE = 20; // 20Hz server tick
const TICK_MS = 1000 / TICK_RATE;

interface PlayerInfo {
  role: "teacher" | "pupil" | "spectator";
  lastInput: any;
  prevClick: boolean; // track previous tick's click state for edge detection
}

export default class RecessRevengeServer implements Party.Server {
  simulation: GameSimulation;
  players: Map<string, PlayerInfo>;
  gameLoopInterval: ReturnType<typeof setInterval> | null;

  constructor(readonly room: Party.Room) {
    this.simulation = new GameSimulation();
    this.players = new Map();
    this.gameLoopInterval = null;
  }

  onConnect(connection: Party.Connection) {
    const player: PlayerInfo = {
      role: "spectator",
      lastInput: null,
      prevClick: false,
    };

    // Assign role based on who's already connected
    const hasTeacher = [...this.players.values()].some(p => p.role === "teacher");
    const hasPupil = [...this.players.values()].some(p => p.role === "pupil");

    if (!hasTeacher) {
      player.role = "teacher";
    } else if (!hasPupil) {
      player.role = "pupil";
    }

    this.players.set(connection.id, player);

    // Send role assignment
    connection.send(JSON.stringify({
      type: "role",
      role: player.role,
      playerId: connection.id,
    }));

    // Send obstacle layout
    connection.send(JSON.stringify(this.simulation.serializeInit()));

    // Broadcast player count
    this.broadcastLobbyState();

    // Start game if we have both players
    if (this.hasAllPlayers() && this.simulation.state === GAME_STATE.LOBBY) {
      this.startCountdown();
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    try {
      const data = JSON.parse(message as string);

      switch (data.type) {
        case "input":
          player.lastInput = data.input;
          break;

        case "restart":
          if (this.simulation.state === GAME_STATE.GAME_OVER && this.hasAllPlayers()) {
            this.startCountdown();
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
      this.stopGameLoop();
      this.simulation.state = GAME_STATE.LOBBY;

      this.room.broadcast(JSON.stringify({
        type: "disconnected",
        role: player.role,
        message: `${player.role === "teacher" ? "Teacher" : "Pupil"} disconnected.`,
      }));

      // Re-broadcast lobby state
      this.broadcastLobbyState();
    }
  }

  hasAllPlayers(): boolean {
    const roles = [...this.players.values()].map(p => p.role);
    return roles.includes("teacher") && roles.includes("pupil");
  }

  broadcastLobbyState() {
    const roles = [...this.players.values()].map(p => p.role);
    this.room.broadcast(JSON.stringify({
      type: "lobby",
      playerCount: this.players.size,
      hasTeacher: roles.includes("teacher"),
      hasPupil: roles.includes("pupil"),
    }));
  }

  startCountdown() {
    let countdown = 3;

    this.room.broadcast(JSON.stringify({
      type: "countdown",
      count: countdown,
    }));

    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.room.broadcast(JSON.stringify({
          type: "countdown",
          count: countdown,
        }));
      } else {
        clearInterval(countdownInterval);
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
