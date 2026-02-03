// RECESS REVENGE - Shared Game Configuration
// Used by both server and client

export const CONFIG = {
    SCREEN: {
        WIDTH: 1408,
        HEIGHT: 792,
        BACKGROUND_COLOR: 0x3a3a3a
    },
    GAME: {
        MATCH_DURATION: 90,
        FPS: 60,
        RESPAWN_INVULNERABILITY: 1.5,
        DEBUG_MODE: false
    },
    TEACHER: {
        SPEED: 140,
        SPRINT_SPEED_MULTIPLIER: 1.6,
        SPRINT_DURATION: 0.8,
        SPRINT_COOLDOWN: 6.0,
        SIZE: 32,
        HITBOX_RADIUS: 16,
        SPAWN_X: 110,
        SPAWN_Y: 396,
        GOAL_X: 1298,
        SPAWN_POSITIONS: [
            { x: 110, y: 200 },
            { x: 110, y: 592 }
        ]
    },
    PUPIL: {
        STARTING_EGGS: 5,
        MAX_EGGS: 5,
        EGG_COOLDOWN: 0.8,
        REFILL_DELAY: 0.75,
        REFILL_AMOUNT: 2,
        THROW_POSITIONS: [
            { x: 1368, y: 60 },
            { x: 1368, y: 752 }
        ]
    },
    EGG: {
        SPEED: 1200,
        ARC_HEIGHT: 100,
        SIZE: 16,
        HITBOX_RADIUS: 8,
        GRAVITY: 800,
        SPLAT_DURATION: 4.0
    },
    OBSTACLES: {
        BUSH: { WIDTH: 60, HEIGHT: 60, CAN_HIDE: true, COLOR: 0x228B22 },
        BENCH: { WIDTH: 80, HEIGHT: 40, CAN_HIDE: false, COLOR: 0x8B4513 },
        TREE: { WIDTH: 50, HEIGHT: 80, CAN_HIDE: false, COLOR: 0x654321 },
        SWING_SET: { WIDTH: 100, HEIGHT: 120, CAN_HIDE: false, COLOR: 0xC0C0C0 },
        CHICKEN_COOP: { WIDTH: 120, HEIGHT: 115, COLOR: 0xDC143C }
    },
    SCHOOL: {
        WIDTH: 150, HEIGHT: 300, X: 1265, Y: 246, COLOR: 0x8B0000
    },
    COLORS: {
        TEACHER: 0x3498db,
        TEACHER_HIDDEN: 0x2c7ab8,
        TEACHER2: 0x2ecc71,
        CROSSHAIR: 0xff0000,
        CROSSHAIR2: 0xff8800,
        TRAJECTORY: 0xff0000,
        TRAJECTORY2: 0xff8800,
        EGG: 0xFFFDD0,
        EGG_SPLAT: 0xFFFF00,
        ASPHALT: 0x3a3a3a,
        PATH: 0x505050
    },
    UI: {
        FONT_FAMILY: 'Arial',
        FONT_SIZE_LARGE: 48,
        FONT_SIZE_MEDIUM: 32,
        FONT_SIZE_SMALL: 24,
        TIMER_COLOR: 0xffffff,
        WARNING_COLOR: 0xff0000,
        WARNING_THRESHOLD: 30
    },
    COMMENTARY: {
        TTS_VOLUME: 0.05  // 0.0 to 1.0
    },
    KEYS: {
        UP: ['w', 'W', 'ArrowUp'],
        DOWN: ['s', 'S', 'ArrowDown'],
        LEFT: ['a', 'A', 'ArrowLeft'],
        RIGHT: ['d', 'D', 'ArrowRight'],
        SPRINT: ['Shift'],
        PAUSE: ['Escape'],
        RESTART: [' ', 'Enter'],
        MUSIC_TOGGLE: ['m', 'M'],
        COMMENTARY_TOGGLE: ['c', 'C']
    }
};

export const GAME_STATE = {
    LOBBY: 'lobby',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

export const WINNER = {
    NONE: 'none',
    TEACHER: 'teacher',
    PUPIL: 'pupil'
};

export const ROLES = {
    TEACHER1: 'teacher1',
    TEACHER2: 'teacher2',
    PUPIL1: 'pupil1',
    PUPIL2: 'pupil2',
    UNASSIGNED: 'unassigned',
};

export const TEACHER_ROLES = [ROLES.TEACHER1, ROLES.TEACHER2];
export const PUPIL_ROLES = [ROLES.PUPIL1, ROLES.PUPIL2];

export function roleTeam(role) {
    if (role === ROLES.TEACHER1 || role === ROLES.TEACHER2) return 'teacher';
    if (role === ROLES.PUPIL1 || role === ROLES.PUPIL2) return 'pupil';
    return null;
}

export function roleIndex(role) {
    if (role === ROLES.TEACHER1 || role === ROLES.PUPIL1) return 0;
    if (role === ROLES.TEACHER2 || role === ROLES.PUPIL2) return 1;
    return -1;
}
