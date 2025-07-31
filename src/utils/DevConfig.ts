// Development configuration settings
export const DEV_CONFIG = {
  // Skip the start screen and go directly to the game
  SKIP_START: false,
  
  // Enable debug rendering
  DEBUG_PHYSICS: false,
  
  // Show FPS counter
  SHOW_FPS: false,
  
  // Start position override (null to use default)
  START_POSITION: null as { x: number; y: number } | null,
  
  // Starting inventory items (itemId: quantity)
  START_INVENTORY: {
    'bottle': 3,  // Set to higher number for testing
    'teddy': 2    // Set to higher number for testing
  } as Record<string, number>,
  
  // Spawn rates (probability per frame in update loop)
  SPAWN_RATES: {
    // Monster spawn chance per frame when below max (default: 0.01 = 1%)
    MONSTER_SPAWN_CHANCE: 0.05, // 5% for testing
    
    // Bottle spawn chance per frame when below max (default: 0.005 = 0.5%)
    BOTTLE_SPAWN_CHANCE: 0.03, // 3% for testing
    
    // Teddy spawn chance per frame when below max
    TEDDY_SPAWN_CHANCE: 0.02, // 2% for testing
    
    // Max counts
    MAX_MONSTERS: 100,
    MAX_BOTTLES: 80, // Increased for testing
    MAX_TEDDIES: 3, // Limit teddy bears
    
    // Per chunk spawn rates
    MONSTERS_PER_CHUNK: { min: 1, max: 3 },
    BOTTLES_PER_CHUNK: { min: 1, max: 3 }, // Increased from 0-2 to 1-3 for testing
    TEDDIES_PER_CHUNK: { min: 0, max: 1 }
  }
};