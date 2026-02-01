// RECESS REVENGE - Network Manager (PartySocket client)

import PartySocket from "partysocket";

export class NetworkManager {
    constructor(callbacks) {
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.role = null;
        this.callbacks = callbacks; // { onRole, onLobby, onInit, onCountdown, onStart, onState, onGameOver, onDisconnected }
    }

    connect(roomId) {
        const host = window.location.host;

        this.socket = new PartySocket({
            host,
            room: roomId,
        });

        this.socket.addEventListener("open", () => {
            console.log("Connected to game server");
            this.connected = true;
        });

        this.socket.addEventListener("message", (event) => {
            this.handleMessage(JSON.parse(event.data));
        });

        this.socket.addEventListener("close", () => {
            console.log("Disconnected from server");
            this.connected = false;
        });

        this.socket.addEventListener("error", (err) => {
            console.error("WebSocket error:", err);
        });
    }

    handleMessage(data) {
        switch (data.type) {
            case "role":
                this.playerId = data.playerId;
                this.role = data.role;
                this.callbacks.onRole?.(data.role, data.playerId);
                break;
            case "lobby":
                this.callbacks.onLobby?.(data);
                break;
            case "init":
                this.callbacks.onInit?.(data);
                break;
            case "countdown":
                this.callbacks.onCountdown?.(data.count);
                break;
            case "start":
                this.callbacks.onStart?.();
                break;
            case "state":
                this.callbacks.onState?.(data);
                break;
            case "disconnected":
                this.callbacks.onDisconnected?.(data);
                break;
        }
    }

    sendInput(input) {
        if (!this.connected || !this.socket) return;
        this.socket.send(JSON.stringify({ type: "input", input }));
    }

    sendSelectRole(role) {
        if (!this.connected || !this.socket) return;
        this.socket.send(JSON.stringify({ type: "selectRole", role }));
    }

    sendStart() {
        if (!this.connected || !this.socket) return;
        this.socket.send(JSON.stringify({ type: "start" }));
    }

    sendRestart() {
        if (!this.connected || !this.socket) return;
        this.socket.send(JSON.stringify({ type: "restart" }));
    }

    disconnect() {
        if (this.socket) this.socket.close();
    }
}
