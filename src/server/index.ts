import type * as Party from "partykit/server";
import { GameSimulation } from "../shared/simulation.js";
import { GAME_STATE } from "../shared/config.js";

const TICK_RATE = 20; // 20Hz server tick
const TICK_MS = 1000 / TICK_RATE;

const VALID_ROLES = ["teacher1", "teacher2", "pupil1", "pupil2"] as const;
const TEACHER_ROLES = ["teacher1", "teacher2"] as const;
const PUPIL_ROLES = ["pupil1", "pupil2"] as const;

type Role = typeof VALID_ROLES[number] | "unassigned";

interface PlayerInfo {
  role: Role;
  lastInput: any;
  prevClick: boolean;
}

function roleSlot(role: string): number {
  if (role === "teacher1" || role === "pupil1") return 0;
  if (role === "teacher2" || role === "pupil2") return 1;
  return -1;
}

function roleTeam(role: string): string | null {
  if (role === "teacher1" || role === "teacher2") return "teacher";
  if (role === "pupil1" || role === "pupil2") return "pupil";
  return null;
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
          if (!(VALID_ROLES as readonly string[]).includes(requestedRole)) break;

          // Check if this specific slot is available
          const roleTaken = [...this.players.entries()].some(
            ([id, p]) => id !== sender.id && p.role === requestedRole
          );
          if (roleTaken) break;

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

    if (player && player.role !== "unassigned") {
      // If game was playing, end it
      if (this.simulation.state === GAME_STATE.PLAYING) {
        this.stopGameLoop();
        this.simulation.state = GAME_STATE.LOBBY;

        const team = roleTeam(player.role);
        const label = team === "teacher" ? "A teacher" : "A pupil";
        this.room.broadcast(JSON.stringify({
          type: "disconnected",
          role: player.role,
          message: `${label} disconnected.`,
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
    const hasTeacher = roles.some(r => (TEACHER_ROLES as readonly string[]).includes(r));
    const hasPupil = roles.some(r => (PUPIL_ROLES as readonly string[]).includes(r));
    return hasTeacher && hasPupil;
  }

  getSlotInfo(role: string): { taken: boolean; playerId: string | null } {
    const entry = [...this.players.entries()].find(([, p]) => p.role === role);
    return { taken: !!entry, playerId: entry?.[0] || null };
  }

  broadcastLobbyState() {
    this.room.broadcast(JSON.stringify({
      type: "lobby",
      playerCount: this.players.size,
      teacher1: this.getSlotInfo("teacher1"),
      teacher2: this.getSlotInfo("teacher2"),
      pupil1: this.getSlotInfo("pupil1"),
      pupil2: this.getSlotInfo("pupil2"),
      canStart: this.hasAllPlayers(),
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
    const roles = [...this.players.values()].map(p => p.role);
    const teacherCount = roles.filter(r => (TEACHER_ROLES as readonly string[]).includes(r)).length;
    const pupilCount = roles.filter(r => (PUPIL_ROLES as readonly string[]).includes(r)).length;

    this.simulation.startGame(teacherCount, pupilCount);

    this.room.broadcast(JSON.stringify({
      type: "start",
      teacherCount,
      pupilCount,
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

    // Gather inputs per slot
    const teacherInputs: Record<number, any> = {};
    const pupilInputs: Record<number, any> = {};

    for (const [, player] of this.players) {
      const team = roleTeam(player.role);
      const slot = roleSlot(player.role);

      if (team === "teacher") {
        teacherInputs[slot] = player.lastInput || { up: false, down: false, left: false, right: false, sprint: false };
      } else if (team === "pupil") {
        const input = { ...(player.lastInput || { mouseX: 0, mouseY: 0, click: false }) };
        // Edge detection for click
        const isDown = !!input.click;
        input.click = isDown && !player.prevClick;
        player.prevClick = isDown;
        pupilInputs[slot] = input;
      }
    }

    const deltaTime = 1 / TICK_RATE;
    this.simulation.update(deltaTime, teacherInputs, pupilInputs);

    // Broadcast state
    const state = this.simulation.serialize();
    this.room.broadcast(JSON.stringify(state));

    // Stop loop if game ended
    if (this.simulation.state === GAME_STATE.GAME_OVER) {
      this.stopGameLoop();
    }
  }
}
