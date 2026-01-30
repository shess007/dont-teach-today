# RECESS REVENGE

An asymmetric 2-player local multiplayer browser game built with PixiJS.

## Current Status

**Phase 1-2 Complete:** Basic infrastructure and game loop implemented.

## How to Run

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge)
2. The game will load with PixiJS from CDN
3. Press **SPACE** to start the game

## Controls

### Player 1 - Teacher
- **WASD** or **Arrow Keys**: Move in all directions
- **SHIFT**: Sprint (will be implemented in Phase 5)
- **Goal**: Reach the school building on the right side

### Player 2 - Pupil
- **Mouse**: Aim crosshair (will be implemented in Phase 4)
- **Left Click**: Throw egg (will be implemented in Phase 4)
- **Goal**: Prevent the teacher from reaching the school

## Development Progress

- [x] Phase 1: Project setup and basic HTML5 canvas infrastructure
- [x] Phase 2: Core game loop and rendering system
- [ ] Phase 3: Player 1 (Teacher) movement and controls
- [ ] Phase 4: Player 2 (Pupil) crosshair and egg throwing mechanics
- [ ] Phase 5: Sprint system with cooldown for teacher
- [ ] Phase 6: Collision detection and egg impact mechanics
- [ ] Phase 7: Schoolyard layout with obstacles and navigation
- [ ] Phase 8: Hiding mechanics in bushes
- [ ] Phase 9: Timer system and win/lose conditions
- [ ] Phase 10: Chicken coop egg refill system
- [ ] Phase 11: UI elements (timer, egg count, sprint meter)
- [ ] Phase 12: Visual feedback (splats, screen shake, effects)
- [ ] Phase 13: Pixel art assets (placeholder to final)
- [ ] Phase 14: Audio integration (music and sound effects)
- [ ] Phase 15: Game state management (start, playing, end screens)
- [ ] Phase 16: Balance tuning and playtesting
- [ ] Phase 17: Polish and optimization

## Technology Stack

- **PixiJS 7.x**: High-performance 2D rendering
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

## Next Steps

Continue with Phase 3: Implement Teacher movement and controls.

## Game Design

See [recess-revenge.md](recess-revenge.md) for the complete game design document.
