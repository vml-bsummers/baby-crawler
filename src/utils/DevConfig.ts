// Development configuration settings
export const DEV_CONFIG = {
  // Skip the start screen and go directly to the game
  SKIP_START: true,
  
  // Enable debug rendering
  DEBUG_PHYSICS: false,
  
  // Show FPS counter
  SHOW_FPS: false,
  
  // Start position override (null to use default)
  START_POSITION: null as { x: number; y: number } | null,
};