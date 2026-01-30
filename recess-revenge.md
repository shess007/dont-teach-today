# RECESS REVENGE
## Game Design Document

---

## Overview

**Genre:** Asymmetric 2-Player Local Multiplayer  
**Platform:** Browser (HTML5/JavaScript)  
**Art Style:** Retro pixel art  
**Match Duration:** 2 minutes per round  

**Tagline:** *The bell's about to ring. One must reach the school. One must stop them at all costs.*

---

## Core Concept

RECESS REVENGE is a tense cat-and-mouse game where two players compete with completely different abilities and perspectives. The teacher must cross a dangerous schoolyard to reach the school building. The pupil, invisible and armed with eggs, must prevent the teacher from arriving before break ends.

---

## Players & Roles

### Player 1 — The Teacher

**Objective:** Reach the school building on the right side of the screen before the 2-minute timer runs out.

**Visibility:** Fully visible on screen at all times.

**Spawn Point:** Left side of the schoolyard.

**Controls:**
- **Movement:** WASD or Arrow Keys — move freely around the schoolyard
- **Sprint:** Hold SHIFT — temporary speed boost with cooldown

**Abilities:**
- **Normal Movement:** Standard walking speed in any direction
- **Sprint:** Faster movement for escaping danger, has a cooldown after use (suggested: 3 seconds of sprint, 5 seconds cooldown)
- **Hide:** Can move behind/into bushes to become visually obscured

**Lose Condition:** Getting hit by an egg resets the teacher to the starting position (left side).

**Win Condition:** Reach the school building before the timer hits zero.

---

### Player 2 — The Pupil

**Objective:** Prevent the teacher from reaching the school building until the break ends (timer reaches zero).

**Visibility:** The pupil has NO physical presence on screen. They are invisible.

**Controls:**
- **Crosshair Movement:** Mouse movement — a targeting crosshair moves around the schoolyard
- **Throw Egg:** Left Mouse Click — throws an egg at the crosshair position

**Abilities:**
- **Egg Throw:** Lob an egg toward the crosshair position
  - Cooldown: 1 second between throws
  - Trajectory preview: Visible curved arc showing where the egg will land (visible only to the pupil)
  - The curve adds difficulty — aiming requires predicting teacher movement AND compensating for arc
- **Refill Eggs:** Click on the chicken coop to gain +1 egg (short delay on refill)

**Resources:**
- **Egg Supply:** Starts with 3 eggs
- **Maximum Capacity:** 3 eggs (cannot stockpile beyond this)
- **Refill:** Shoot the chicken coop to add 1 egg to supply (brief delay before egg is available)

**Lose Condition:** Teacher reaches the school building.

**Win Condition:** Timer reaches zero while teacher has not reached the school building.

---

## Schoolyard Layout

**Orientation:** 
- Left side: Teacher spawn point
- Right side: School building (goal)
- One edge (top or bottom): Chicken coop for egg refills

**Terrain Type:** Wide open field — no corridors or tight passages.

**Obstacles:** Various objects scattered across the field that the teacher must navigate around:
- **Bushes** — Teacher can hide inside these (becomes visually obscured)
- **Benches** — Solid obstacles, must walk around
- **Trees** — Large obstacles providing cover
- **Swing set** — Obstacle in play area
- **Other playground equipment** — Jungle gym, slide, etc.

**Design Principles:**
- Obstacles create natural paths but no single "correct" route
- Multiple bushes give the teacher hiding options at the cost of time
- Open stretches between obstacles create high-tension zones
- Chicken coop placement should require the pupil to "commit" to refilling (perhaps positioned so aiming at coop means not aiming at main play area)

---

## Game Mechanics

### Egg Throwing (Pupil)

1. Pupil moves crosshair with mouse
2. A curved trajectory preview shows the arc the egg will travel (only visible to pupil)
3. Left click to throw
4. Egg travels along the curved arc toward target position
5. 1 second cooldown before next throw is available

**Important:** The teacher does NOT see:
- The crosshair
- The trajectory preview
- The egg in flight

The teacher only learns an egg was thrown when:
- They get hit (splat + reset to start)
- They see a splat on the ground from a miss

### Egg Impact & Feedback

**On Hit (teacher struck):**
- Large splat animation on teacher
- Screen shake (both players)
- Comedic teacher reaction animation
- Teacher resets to starting position (left side)
- Brief invulnerability on respawn (suggested: 1 second)

**On Miss (egg hits ground):**
- Splat appears on the ground at impact location
- Visible to BOTH players
- Splat remains visible for a few seconds then fades
- This gives the teacher information about where attacks came from

### Teacher Sprint

- **Activation:** Hold SHIFT while moving
- **Effect:** Increased movement speed (suggested: 1.5x to 2x normal speed)
- **Duration:** Limited (suggested: 3 seconds of sprint)
- **Cooldown:** Cannot sprint again until cooldown completes (suggested: 5 seconds)
- **Visual indicator:** Sprint meter or cooldown indicator visible to teacher

### Hiding in Bushes

- Teacher moves into a bush
- Teacher's sprite becomes obscured/hidden
- Pupil can still throw eggs at bushes — if teacher is inside, they get hit
- Teacher is not invulnerable, just harder to see
- Staying hidden wastes time on the clock

### Chicken Coop Refill

- Pupil clicks on the chicken coop with their crosshair
- Short delay (suggested: 0.5–1 second)
- +1 egg added to supply (if not already at max of 3)
- The coop should be positioned so refilling requires the pupil to momentarily stop tracking the teacher

---

## User Interface

### Shared UI Elements (Both Players See)

- **Countdown Timer:** Prominently displayed, showing remaining time in the 2-minute match
- **Schoolyard:** Full view of the play area with all obstacles

### Teacher UI (Player 1)

- **Sprint Indicator:** Shows sprint availability and cooldown status
- No egg count (teacher doesn't know pupil's ammo)
- No crosshair visibility
- No trajectory preview

### Pupil UI (Player 2)

- **Crosshair:** Visible targeting reticle
- **Trajectory Preview:** Curved line showing egg arc (only when aiming)
- **Egg Count:** Display showing current egg supply (0–3)
- **Cooldown Indicator:** Shows when next egg can be thrown

---

## Win/Lose Conditions Summary

| Condition | Teacher (P1) | Pupil (P2) |
|-----------|--------------|------------|
| Teacher reaches school building | **WIN** | LOSE |
| Timer reaches zero, teacher hasn't reached building | LOSE | **WIN** |

---

## Game Flow

1. **Match Start**
   - Teacher spawns on left side
   - Pupil crosshair appears (position: center or near coop)
   - Pupil starts with 3 eggs
   - 2:00 timer begins countdown
   - Brief "GO!" signal

2. **Gameplay Loop**
   - Teacher navigates toward school building, using sprint and bushes strategically
   - Pupil tracks teacher with crosshair, throws eggs, manages ammo
   - Hits reset teacher to start
   - Misses leave visible splats

3. **Endgame Tension**
   - Final 30 seconds: possible audio/visual intensity increase
   - Every decision matters

4. **Match End**
   - Victory screen for winner
   - Option to play again / swap roles

---

## Technical Specifications

### Input Handling

**Player 1 (Teacher):**
- Keyboard: WASD or Arrow Keys for movement
- Keyboard: SHIFT for sprint

**Player 2 (Pupil):**
- Mouse: Movement controls crosshair position
- Mouse: Left click to throw egg / refill at coop

### Screen Layout

- Single shared screen (local multiplayer)
- Both players view the same schoolyard
- UI elements positioned to not obstruct play area

### Suggested Resolution

- Target: 1280x720 or 1920x1080
- Pixel art should be scaled appropriately (e.g., 16x16 or 32x32 base sprites scaled up)

---

## Art Direction

### Style
- Retro pixel art aesthetic
- Clean, readable sprites
- Vibrant schoolyard colors (green grass, colorful playground equipment)

### Key Assets Needed

**Characters:**
- Teacher sprite (idle, walking, sprinting, hit reaction)
- Teacher hidden state (obscured in bush)

**Environment:**
- Schoolyard background/tileset (grass, paths)
- School building (right side goal)
- Bushes (hideable)
- Benches
- Trees
- Swing set
- Chicken coop
- Other playground elements

**Effects:**
- Egg projectile (in flight — only pupil sees)
- Egg splat (ground miss — both see)
- Egg splat (hit on teacher — both see)
- Sprint effect (dust, motion lines)

**UI:**
- Crosshair
- Timer display
- Egg count display
- Sprint meter/cooldown indicator
- Trajectory preview arc

---

## Audio Direction (Optional/Future)

**Music:**
- Playful, slightly mischievous chiptune track
- Tension increase in final 30 seconds

**Sound Effects:**
- Footsteps (teacher walking/sprinting)
- Egg throw (whoosh)
- Egg splat (satisfying squish)
- Teacher hit reaction (comedic yelp)
- Timer warnings (final 30s, 10s, 5s)
- Victory/defeat jingles
- Chicken cluck (on refill)

---

## Balance Considerations & Playtesting Notes

These values should be tuned through playtesting:

| Parameter | Starting Value | Notes |
|-----------|----------------|-------|
| Match duration | 120 seconds | Core timing — adjust if matches feel too long/short |
| Starting eggs | 3 | Low ammo creates tension |
| Max eggs | 3 | Prevents hoarding |
| Egg refill amount | 1 | Forces multiple trips to coop |
| Egg throw cooldown | 1 second | Prevents spam |
| Sprint duration | 3 seconds | Long enough to cross open areas |
| Sprint cooldown | 5 seconds | Punishes poor sprint timing |
| Respawn invulnerability | 1 second | Prevents instant re-hits |
| Trajectory curve intensity | TBD | More curve = harder for pupil |

---

## Future Ideas (Out of Scope for MVP)

- Role swap between rounds (best of 3)
- Multiple schoolyard layouts
- Power-ups (coffee for teacher speed, golden egg for pupil)
- Cosmetic unlocks
- Online multiplayer
- Single-player mode with AI opponent
- Additional obstacles (roaming hall monitor, sprinklers)

---

## Summary

RECESS REVENGE is an asymmetric local multiplayer game about tension, prediction, and resource management. The teacher must brave the open schoolyard while the invisible pupil rains down eggs from above. With a retro pixel art style, simple controls, and 2-minute matches, it's designed for quick, replayable sessions with plenty of "one more round" appeal.

---

*Document Version: 1.0*  
*Ready for development*