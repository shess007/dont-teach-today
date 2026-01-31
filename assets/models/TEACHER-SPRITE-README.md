# Chibi Teacher Animated Spritesheet

This document explains the chibi/super-deformed animated teacher character for RECESS REVENGE.

## Overview

The teacher character uses a **chibi/SD art style** with classic proportions:
- Big head, small body (2-3 heads tall)
- Exaggerated features for cuteness
- Classic stern teacher appearance with glasses, tie, and briefcase

## Files Created

### 1. Spritesheet Generator
**File:** `generate-teacher-sprite.html`

An interactive HTML canvas tool that:
- Draws all animation frames programmatically using Canvas 2D API
- Displays a live preview with animation cycling
- Allows downloading the spritesheet as PNG
- Features a 2026-style glassmorphism UI with neon accents

**Usage:**
1. Open the HTML file in any modern browser
2. The spritesheet will generate automatically
3. Click "Download Spritesheet PNG" to save as `teacher-spritesheet.png`
4. Save the file to `/assets/models/teacher-spritesheet.png`
5. Click the preview canvas to cycle through animations (idle, walk, sprint)

### 2. Spritesheet JSON Descriptor
**File:** `teacher-spritesheet.json`

PixiJS 8.x compatible spritesheet metadata defining:
- **14 total frames** across 3 animations
- Frame coordinates for each animation state
- Animation definitions with frame sequences
- Compatible with `PIXI.Assets.load()` for automatic texture atlas loading

### 3. Updated Teacher Class
**File:** `/src/teacher.js`

Enhanced with:
- `preloadTeacherAssets()` function for async spritesheet loading
- `PIXI.AnimatedSprite` support with fallback to Graphics
- Animation state management (idle, walk, sprint)
- Horizontal sprite flipping for left/right movement
- Preserved all existing game mechanics

## Spritesheet Layout

```
Total Size: 384x192 pixels

Row 0 (Y: 0-64):    [Idle-0][Idle-1][Idle-2][Idle-3]
Row 1 (Y: 64-128):  [Walk-0][Walk-1][Walk-2][Walk-3][Walk-4][Walk-5]
Row 2 (Y: 128-192): [Sprint-0][Sprint-1][Sprint-2][Sprint-3]

Each frame: 64x64 pixels
```

## Animations

### Idle (4 frames)
- Gentle bobbing/breathing animation
- Animation speed: 0.1 (slower, relaxed)
- Loops continuously when stationary

### Walk (6 frames)
- Full walking cycle with leg and arm swing
- Briefcase swings subtly
- Animation speed: 0.15 (moderate pace)
- Triggers when moving (not sprinting)

### Sprint (4 frames)
- Fast running with exaggerated motion
- Leaning forward for speed
- More dramatic leg swing and arm movement
- Animation speed: 0.2 (fast)
- Triggers when holding SHIFT while moving

## Character Design Details

### Color Palette
Matches `CONFIG.COLORS` from game config:

- **Skin:** #FFCC99 (warm peachy tone)
- **Shirt:** #3498db (CONFIG.COLORS.TEACHER blue)
- **Tie:** #2574A9 (darker blue)
- **Pants:** #333333 (dark charcoal)
- **Briefcase:** #8B4513 (saddle brown)
- **Briefcase Lock:** #FFD700 (gold)
- **Glasses Frame:** #000000 (black)
- **Glasses Lens:** rgba(135, 206, 235, 0.3) (translucent sky blue)
- **Hair:** #4a4a4a (dark gray)
- **Shoes:** #1a1a1a (near black)

### Proportions
- **Head:** 20x20 pixels (largest part - chibi style!)
- **Body:** 16 pixels wide, 14 pixels tall
- **Legs:** 8 pixels long (short chibi legs)
- **Total height:** ~50 pixels within 64x64 frame
- **Chibi ratio:** ~2.5 heads tall (classic SD proportions)

### Features
- Rectangular stern glasses (classic teacher look)
- Small tie for professionalism
- Briefcase held in right hand (swings during movement)
- Determined expression with small mouth
- Simple hair detail on top and sides

## Integration with Game

### Scaling
- Spritesheet frames: 64x64 pixels
- Game display size: 32 pixels (CONFIG.TEACHER.SIZE)
- Scale factor: 0.5 (automatic in code)

### Direction Handling
- Sprite faces **RIGHT** by default
- Flips horizontally (scale.x = -1) when moving left
- No vertical flipping needed

### Animation State Machine
```javascript
Movement State          Animation      Speed
--------------------------------------------------
Not moving              idle           0.1
Moving (normal)         walk           0.15
Moving (sprinting)      sprint         0.2
```

### Preserved Features
All existing teacher mechanics remain intact:
- Position and velocity
- Invulnerability with flashing effect
- Hiding in bushes (tint change)
- Sprint system with cooldown
- Collision detection
- Respawn at starting position
- Alpha blending for effects

### Fallback Support
If spritesheet fails to load, the game falls back to the original PIXI.Graphics rectangular teacher. The game will never break!

## Technical Implementation

### PixiJS 8.x Compatibility
```javascript
// Load spritesheet
TEACHER_SPRITESHEET = await PIXI.Assets.load('assets/models/teacher-spritesheet.json');

// Create animated sprite
const textures = TEACHER_SPRITESHEET.animations.idle;
sprite = new PIXI.AnimatedSprite(textures);
sprite.anchor.set(0.5, 0.5);
sprite.animationSpeed = 0.1;
sprite.loop = true;
sprite.play();
```

### Animation Switching
```javascript
// Switch to walk animation
sprite.textures = TEACHER_SPRITESHEET.animations.walk;
sprite.animationSpeed = 0.15;
sprite.play();
```

### Horizontal Flipping
```javascript
// Face right (normal)
sprite.scale.x = Math.abs(sprite.scale.x);

// Face left (flipped)
sprite.scale.x = -Math.abs(sprite.scale.x);
```

## Design Philosophy

This chibi teacher embodies **2026 visual trends**:
1. **Retro-Futurism Revival**: Pixel art meets modern smooth animations
2. **Character-Driven Design**: Personality through exaggerated proportions
3. **Motion-First**: Every frame designed for fluid animation
4. **Nostalgic + Fresh**: Classic teacher archetype in cute chibi form

The character is designed to be:
- **Memorable**: Distinct silhouette with glasses and briefcase
- **Expressive**: Despite small size, conveys determination
- **Performant**: Optimized frame count for smooth 60fps gameplay
- **Scalable**: Works at various display sizes

## Browser Compatibility

The spritesheet generator works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Uses only standard Canvas 2D API - no WebGL required for generation.

## Future Enhancements

Potential additions (not currently implemented):
- Hit reaction animation (when struck by egg)
- Victory celebration animation
- Crouch/hide animation for bushes
- Idle variations (check watch, adjust glasses)
- Directional variants (4-way or 8-way movement)

## Credits

- **Art Style**: Chibi/Super-Deformed (classic Japanese proportions)
- **Color Palette**: Matches RECESS REVENGE game config
- **Animation Principles**: Bob, swing, and anticipation
- **Tool**: HTML5 Canvas 2D API
- **Framework**: PixiJS 8.x AnimatedSprite

---

**Created for RECESS REVENGE** - A browser-based asymmetric multiplayer game where a stern teacher tries to reach school while dodging eggs from mischievous students!
