# RECESS REVENGE

An asymmetric 2-player local multiplayer browser game built with PixiJS.

## Current Status

**All Phases Complete!** The game is fully playable with all features implemented, balanced, and polished.

## How to Run

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge)
2. The game will load with PixiJS from CDN
3. Press **SPACE** to start the game

## Controls

### Player 1 - Teacher
- **WASD** or **Arrow Keys**: Move in all directions
- **SHIFT**: Sprint for a burst of speed (limited duration with cooldown)
- **Goal**: Reach the school building on the right side before time runs out
- **Special**: Hide in bushes to become invisible to eggs!

### Player 2 - Pupil
- **Mouse**: Aim crosshair with trajectory preview
- **Left Click**: Throw egg at the teacher
- **Click Chicken Coop**: Refill eggs (holds 5 eggs, refills 2 at a time)
- **Goal**: Stop the teacher by hitting them with eggs before they reach school

### General
- **SPACE**: Start game / Restart after game over
- **ESC**: Pause / Resume game

## Development Progress

- [x] Phase 1: Project setup and basic HTML5 canvas infrastructure
- [x] Phase 2: Core game loop and rendering system
- [x] Phase 3: Player 1 (Teacher) movement and controls
- [x] Phase 4: Player 2 (Pupil) crosshair and egg throwing mechanics
- [x] Phase 5: Sprint system with cooldown for teacher
- [x] Phase 6: Collision detection and egg impact mechanics
- [x] Phase 7: Schoolyard layout with obstacles and navigation
- [x] Phase 8: Hiding mechanics in bushes
- [x] Phase 9: Timer system and win/lose conditions
- [x] Phase 10: Chicken coop egg refill system
- [x] Phase 11: UI elements (timer, egg count, sprint meter)
- [x] Phase 12: Visual feedback (splats, screen shake, effects)
- [x] Phase 13: Pixel art assets (placeholder to final)
- [x] Phase 14: Audio integration (music and sound effects)
- [x] Phase 15: Game state management (start, playing, end screens)
- [x] Phase 16: Balance tuning and playtesting
- [x] Phase 17: Polish and optimization

## Technology Stack

- **PixiJS 8.x**: High-performance 2D rendering with WebGL
- **Web Audio API**: Procedurally generated sound effects
- **Vanilla JavaScript**: No build process required
- **HTML5 Canvas**: For rendering

## Project Structure

```
recess-revenge/
├── index.html              # Main entry point
├── css/
│   └── style.css          # Global styles
├── src/
│   ├── game.js            # Main game controller
│   ├── config.js          # Game configuration
│   ├── utils.js           # Utility functions
│   ├── input.js           # Input manager
│   ├── teacher.js         # Teacher (Player 1)
│   ├── pupil.js           # Pupil (Player 2)
│   ├── projectile.js      # Egg projectiles
│   ├── obstacles.js       # Obstacles
│   ├── collision.js       # Collision detection
│   ├── effects.js         # Visual effects
│   ├── ui.js              # UI elements
│   └── audio.js           # Audio manager
└── recess-revenge.md      # Game design document
```

## Features

- **Asymmetric Gameplay**: Two players with completely different mechanics
- **Sprint System**: Teacher can sprint with a cooldown timer
- **Hiding Mechanic**: Teacher can hide in bushes to avoid eggs
- **Egg Refill System**: Pupil must strategically visit the chicken coop
- **Dynamic Obstacles**: Navigate around benches, trees, swing sets, and bushes
- **Visual Effects**: Egg splats, screen shake, impact particles
- **Audio**: Procedurally generated sound effects for all actions
- **Pixel Art**: Custom pixel art graphics for all game elements
- **UI**: Real-time display of timer, egg count, and sprint meter
- **90-Second Matches**: Fast-paced, intense gameplay
- **Balanced**: Carefully tuned for competitive play

## Game Design

See [recess-revenge.md](recess-revenge.md) for the complete game design document.
