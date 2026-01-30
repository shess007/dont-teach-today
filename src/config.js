// RECESS REVENGE - Game Configuration
// All game constants and balance parameters

const CONFIG = {
    // Display settings
    SCREEN: {
        WIDTH: 1280,
        HEIGHT: 720,
        BACKGROUND_COLOR: 0x88cc66 // Grass green
    },

    // Game timing
    GAME: {
        MATCH_DURATION: 120, // seconds
        FPS: 60,
        RESPAWN_INVULNERABILITY: 1.0 // seconds
    },

    // Teacher (Player 1) settings
    TEACHER: {
        SPEED: 160, // pixels per second
        SPRINT_SPEED_MULTIPLIER: 1.65,
        SPRINT_DURATION: 0.8, // seconds
        SPRINT_COOLDOWN: 5.0, // seconds
        SIZE: 32, // sprite size
        HITBOX_RADIUS: 16,
        SPAWN_X: 100,
        SPAWN_Y: 360, // center Y
        GOAL_X: 1180 // right side of screen
    },

    // Pupil (Player 2) settings
    PUPIL: {
        STARTING_EGGS: 3,
        MAX_EGGS: 3,
        EGG_COOLDOWN: 1.0, // seconds between throws
        REFILL_DELAY: 0.75, // seconds at chicken coop
        REFILL_AMOUNT: 1
    },

    // Projectile settings
    EGG: {
        SPEED: 1600, // pixels per second (increased for faster flight)
        ARC_HEIGHT: 100, // pixels - how high the arc goes
        SIZE: 16,
        HITBOX_RADIUS: 8,
        GRAVITY: 800, // pixels per second squared
        SPLAT_DURATION: 4.0 // seconds before splat fades
    },

    // Obstacle types and sizes
    OBSTACLES: {
        BUSH: {
            WIDTH: 60,
            HEIGHT: 60,
            CAN_HIDE: true,
            COLOR: 0x228B22 // Forest green
        },
        BENCH: {
            WIDTH: 80,
            HEIGHT: 40,
            CAN_HIDE: false,
            COLOR: 0x8B4513 // Saddle brown
        },
        TREE: {
            WIDTH: 50,
            HEIGHT: 80,
            CAN_HIDE: false,
            COLOR: 0x654321 // Dark brown
        },
        SWING_SET: {
            WIDTH: 100,
            HEIGHT: 120,
            CAN_HIDE: false,
            COLOR: 0xC0C0C0 // Silver
        },
        CHICKEN_COOP: {
            WIDTH: 80,
            HEIGHT: 80,
            COLOR: 0xDC143C // Crimson
        }
    },

    // School building (goal)
    SCHOOL: {
        WIDTH: 150,
        HEIGHT: 300,
        X: 1150,
        Y: 210, // centered vertically
        COLOR: 0x8B0000 // Dark red brick
    },

    // Colors for placeholder graphics
    COLORS: {
        TEACHER: 0x3498db, // Blue
        TEACHER_HIDDEN: 0x2c7ab8, // Darker blue (semi-transparent effect)
        CROSSHAIR: 0xff0000, // Red
        EGG: 0xFFFDD0, // Cream
        EGG_SPLAT: 0xFFFF00, // Yellow
        TRAJECTORY: 0xff0000, // Red
        GRASS: 0x88cc66, // Light green
        PATH: 0xc4a259 // Tan/dirt
    },

    // UI settings
    UI: {
        FONT_FAMILY: 'Arial',
        FONT_SIZE_LARGE: 48,
        FONT_SIZE_MEDIUM: 32,
        FONT_SIZE_SMALL: 24,
        TIMER_COLOR: 0xffffff,
        WARNING_COLOR: 0xff0000,
        WARNING_THRESHOLD: 30 // seconds
    },

    // Input keys
    KEYS: {
        // Teacher movement
        UP: ['w', 'W', 'ArrowUp'],
        DOWN: ['s', 'S', 'ArrowDown'],
        LEFT: ['a', 'A', 'ArrowLeft'],
        RIGHT: ['d', 'D', 'ArrowRight'],
        SPRINT: ['Shift'],
        // General
        PAUSE: ['Escape'],
        RESTART: [' ', 'Enter'] // Space or Enter
    }
};

// Game states
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// Winner types
const WINNER = {
    NONE: 'none',
    TEACHER: 'teacher',
    PUPIL: 'pupil'
};
