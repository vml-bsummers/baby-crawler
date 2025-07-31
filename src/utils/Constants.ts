export const GAME_CONFIG = {
  width: 800,
  height: 800,
  tileSize: 32,
  chunkSize: 32,
  viewDistance: 1, // Number of chunks around player to load
};

export const COLORS = {
  // Soft pastel colors for baby theme
  wall: 0xffd3e1,      // Pink
  floor: 0xfff5ba,     // Light yellow
  player: 0xa8e6cf,    // Mint green
  monsters: {
    dragon: 0xffb3ba,   // Light red
    slime: 0xbae1ff,    // Light blue
    skeleton: 0xf5f5f5, // Off white
    spider: 0xd3d3d3,   // Light gray
    goblin: 0xc7ceea,   // Lavender
    ghost: 0xf0f0f0,    // Very light gray
    mimic: 0xffd3a6,    // Light orange
    bat: 0xe0bbe4,      // Light purple
  }
};

export const TILE_TYPES = {
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  CORRIDOR: 4,
};

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};