# Baby Crawler - Project Documentation

## Project Environment
- This project runs in a **DDEV environment**
- Access URL: https://baby-crawler.ddev.site:5174
- The game is built with Phaser 3 and TypeScript

## Quick Start Commands
```bash
# Start DDEV environment
ddev start

# Install dependencies
ddev exec npm install

# Run development server
ddev exec npm run dev -- --host

# Build for production
ddev exec npm run build

# Run linting/type checking (if available)
ddev exec npm run lint
ddev exec npm run typecheck
```

## Project Overview
Baby Crawler is a procedurally generated dungeon crawler where players control a baby exploring an infinite nursery-themed dungeon. The game features:
- Infinite procedural dungeon generation with no dead ends
- Chunk-based world system for performance
- 2 types of baby monsters (Ghost and Slime) with custom sprites
- Smooth player movement with crawling animations
- Health system and combat mechanics
- Area exploration tracking and level progression
- Monster level scaling based on exploration progress

## Architecture

### Tech Stack
- **Game Engine**: Phaser 3 (v3.90.0)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Development Environment**: DDEV
- **Deployment**: Netlify

### Key Systems

#### 1. **Chunk System** (`/src/world/`)
- **ChunkManager.ts**: Manages loading/unloading of chunks based on player position
- **Chunk.ts**: Individual chunk generation with special handling for origin chunk (spawn area)
- **SimpleDungeonGenerator.ts**: Generates rooms and corridors with guaranteed edge connections
- Chunks are 32x32 tiles, with each tile being 32x32 pixels

#### 2. **Entity System** (`/src/entities/`)
- **Player.ts**: 
  - Direct position-based movement (not physics-based)
  - 64x64 sprite scaled to 32x32
  - Wobble animation while moving
  - Speed: 150 pixels/second
  - Health: 100 HP with invulnerability frames after hit
  - Level: 1 (displayed as "months old")
  - Tracks area explored for progression
  - Inventory system with Map<string, number> storage
- **Monster.ts**: Base class for all monsters with behaviors (wander, follow, flee, idle)
  - Level scales based on player's explored area (1% conversion)
  - Hit chance based on level ratio vs player
  - Damage: 10 per monster level
- **Monster Types** (`/src/entities/monsters/`):
  - BabyGhost: Custom sprite, flees from player, translucent with floating animation
  - BabySlime: Custom sprite, bounces around with jiggle effect, wanders
- **Collectible Items**:
  - Bottle: Restores 20 HP when used
  - Teddy: Spawns a FriendlyTeddy that hunts monsters
- **FriendlyTeddy.ts**: Allied entity that seeks and destroys monsters for 15 seconds

#### 3. **Scene System** (`/src/scenes/`)
- **BootScene.ts**: Handles game initialization, start screen, asset loading, sprite animations
- **GameScene.ts**: Main gameplay, handles rendering, collision detection, monster spawning, combat, item collection
- **UIScene.ts**: Game UI overlay showing health bar, player age, area explored, and inventory drawer

#### 4. **Inventory System** (`/src/utils/`)
- **ItemRegistry.ts**: Centralized item definitions and effects
- Inventory drawer UI with grid-based item display
- Items show images with quantity badges
- Click to use, right-click to drop
- Toggle with 'I' key or click on drawer

#### 5. **World Generation**
- Origin chunk (0,0) has a large 28x28 spawn room with no monsters
- Each chunk connects to adjacent chunks via corridors at edges
- Rooms are connected within chunks and to chunk edges for infinite exploration
- Monster spawning excludes the spawn zone
- Each playthrough generates a unique world seed for true randomization
- Chunks use combined world seed + coordinates for consistent but unique generation
- Connection generation prioritizes unexplored directions to encourage outward exploration
- Minimum 2 connections per chunk to prevent dead ends
- Smart connection matching ensures seamless chunk transitions

### Important Technical Details

#### Movement System
- Player movement uses direct position updates, not Phaser physics velocity
- This was a critical fix - physics-based movement wasn't working properly
- Movement is frame-rate independent using delta time

#### Collision Detection
- Custom collision detection for both player and monsters
- Checks multiple points around entities
- Pushes entities away from walls when collision detected
- Monsters bounce off walls when colliding

#### Development Configuration (`/src/utils/DevConfig.ts`)
```typescript
export const DEV_CONFIG = {
  SKIP_START: false,       // Skip start screen during development
  DEBUG_PHYSICS: false,    // Show physics debug overlay
  SHOW_FPS: false,        // Show FPS counter
  START_POSITION: null,   // Override spawn position
  START_INVENTORY: {       // Starting inventory items for testing
    'bottle': 3,
    'teddy': 2
  },
  SPAWN_RATES: {          // Configurable spawn rates for testing
    MONSTER_SPAWN_CHANCE: 0.05,
    BOTTLE_SPAWN_CHANCE: 0.03,
    TEDDY_SPAWN_CHANCE: 0.02,
    // ... and more
  }
};
```

## Common Issues & Solutions

### Issue: Player movement not working
**Solution**: The movement system was rewritten to use direct position updates instead of physics velocity. The player sprite position is updated directly in the update loop.

### Issue: Player spawning in walls
**Solution**: The game now searches for a valid floor tile near origin before spawning the player.

### Issue: Monsters walking through walls
**Solution**: Implemented `handleMonsterWallCollisions()` in GameScene that checks collision points and bounces monsters away from walls.

### Issue: Dead-end dungeons
**Solution**: SimpleDungeonGenerator now connects all rooms to chunk edges, ensuring infinite generation possibilities.

## File Structure
```
baby-crawler/
├── .ddev/                    # DDEV configuration
├── public/
│   └── images/              # Game assets organized by type
│       ├── ui/              # UI elements (loader, logo, diaper)
│       ├── sprites/         # Character sprite sheets (*_sheet.png)
│       ├── items/           # Collectible item images
│       └── unused/          # Unused/old assets
├── src/
│   ├── entities/            # Player and monster classes
│   ├── scenes/              # Phaser scenes
│   ├── utils/               # Constants, configuration, and registries
│   ├── world/               # Chunk and dungeon generation
│   └── main.ts              # Entry point
├── index.html               # Main HTML file
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration (includes DDEV host settings)
└── netlify.toml             # Netlify deployment configuration
```

## Recent Changes
1. Increased spawn room size from 20x20 to 28x28 (nearly fills the 32x32 chunk)
2. Added true randomization with world seed (each playthrough is unique)
3. Added monster-free spawn zone
4. Improved dungeon generation to connect all rooms to chunk edges
5. Fixed monster wall collision detection
6. Implemented development configuration system
7. Removed minimap and toy counter UI elements
8. Added health system with visual health bar (100 HP)
9. Added player age display (months old theme)
10. Added area exploration tracking in square meters
11. Implemented monster collision and combat system
12. Added distance-based monster level scaling (1% of explored area)
13. Integrated custom ghost and slime sprites with animations
14. Reduced monster types to 2: Ghost and Slime only
15. Fixed movement stopping after sprite integration
16. Resolved black screen loading issues
17. Disabled player movement on game over
18. Added monster spawning when new chunks are generated (1-3 per chunk)
19. Removed debug console from UI
20. Implemented inventory system with collectible items (bottles, teddy bears)
21. Added inventory drawer UI with item grid display
22. Created ItemRegistry for centralized item management
23. Added FriendlyTeddy entity that hunts monsters for 15 seconds
24. Standardized sprite sheet naming to *_sheet.png format
25. Reorganized images into subdirectories (ui/, sprites/, items/, unused/)
26. Added configurable starting inventory and spawn rates in DevConfig
27. Fixed monster array cleanup and teddy attack behavior

## Deployment
The project is configured for Netlify deployment:
1. Build command: `npm run build`
2. Publish directory: `dist`
3. The `netlify.toml` file contains the deployment configuration

## Testing
Currently no automated tests. Manual testing is done through the development server.

## Testing Notes
- When testing in Playwright, know that the page reloads from the dev server after every code edit

## Performance Considerations
- Chunk system limits world rendering to visible area
- Monsters are only updated when in loaded chunks
- Graphics are cleared and redrawn each frame only for visible tiles

## Future Improvements (from README)
- More baby monsters (Skeleton, Goblin, Mimic, Bat)
- Toy collection system
- Minimap implementation
- Sound effects and music
- Particle effects
- Nursery-themed tile graphics