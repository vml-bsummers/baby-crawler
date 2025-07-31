import { GAME_CONFIG, TILE_TYPES } from '../utils/Constants';
import { SimpleDungeonGenerator } from './SimpleDungeonGenerator';
import { DungeonGenerator } from './DungeonGenerator';

export class Chunk {
  x: number;
  y: number;
  tiles: number[][];
  private generator?: DungeonGenerator;

  constructor(x: number, y: number, generator?: DungeonGenerator) {
    this.x = x;
    this.y = y;
    this.tiles = [];
    this.generator = generator;
    this.generate();
  }

  private generate() {
    // Initialize tiles array
    this.tiles = [];
    for (let y = 0; y < GAME_CONFIG.chunkSize; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < GAME_CONFIG.chunkSize; x++) {
        this.tiles[y][x] = TILE_TYPES.WALL;
      }
    }
    
    // Special handling for the origin chunk
    if (this.x === 0 && this.y === 0) {
      this.generateOriginChunk();
    } else if (this.generator) {
      // Use the DungeonGenerator if available
      this.generator.generateChunk(this, this.x, this.y);
    } else {
      // Fallback to SimpleDungeonGenerator
      const generator = new SimpleDungeonGenerator(GAME_CONFIG.chunkSize, GAME_CONFIG.chunkSize);
      this.tiles = generator.generate();
    }
    
    // Ensure chunk edges connect to adjacent chunks
    this.ensureConnections();
  }

  private generateOriginChunk() {
    // Tiles are already initialized with walls
    
    // Create a large spawn room in the center
    const roomSize = 28; // Very large room for safe spawning (28x28 in a 32x32 chunk)
    const startX = Math.floor((GAME_CONFIG.chunkSize - roomSize) / 2);
    const startY = Math.floor((GAME_CONFIG.chunkSize - roomSize) / 2);
    
    for (let y = startY; y < startY + roomSize; y++) {
      for (let x = startX; x < startX + roomSize; x++) {
        this.tiles[y][x] = TILE_TYPES.FLOOR;
      }
    }
    
    // Add exits in all four directions
    const center = Math.floor(GAME_CONFIG.chunkSize / 2);
    
    // North exit
    for (let y = 0; y < startY; y++) {
      this.tiles[y][center] = TILE_TYPES.CORRIDOR;
      this.tiles[y][center - 1] = TILE_TYPES.CORRIDOR;
      this.tiles[y][center + 1] = TILE_TYPES.CORRIDOR;
    }
    
    // South exit
    for (let y = startY + roomSize; y < GAME_CONFIG.chunkSize; y++) {
      this.tiles[y][center] = TILE_TYPES.CORRIDOR;
      this.tiles[y][center - 1] = TILE_TYPES.CORRIDOR;
      this.tiles[y][center + 1] = TILE_TYPES.CORRIDOR;
    }
    
    // West exit
    for (let x = 0; x < startX; x++) {
      this.tiles[center][x] = TILE_TYPES.CORRIDOR;
      this.tiles[center - 1][x] = TILE_TYPES.CORRIDOR;
      this.tiles[center + 1][x] = TILE_TYPES.CORRIDOR;
    }
    
    // East exit
    for (let x = startX + roomSize; x < GAME_CONFIG.chunkSize; x++) {
      this.tiles[center][x] = TILE_TYPES.CORRIDOR;
      this.tiles[center - 1][x] = TILE_TYPES.CORRIDOR;
      this.tiles[center + 1][x] = TILE_TYPES.CORRIDOR;
    }
  }

  private ensureConnections() {
    // The SimpleDungeonGenerator now handles edge connections,
    // but we'll ensure the edges match up with adjacent chunks
    
    // Check and align edge corridors for seamless chunk connections
    const size = GAME_CONFIG.chunkSize;
    
    // Scan edges for corridor connections
    for (let i = 0; i < size; i++) {
      // North edge - if there's a corridor, ensure it's wide enough
      if (this.tiles[0][i] === TILE_TYPES.CORRIDOR) {
        for (let w = -1; w <= 1; w++) {
          const x = i + w;
          if (x >= 0 && x < size) {
            this.tiles[0][x] = TILE_TYPES.CORRIDOR;
            this.tiles[1][x] = TILE_TYPES.CORRIDOR;
          }
        }
      }
      
      // South edge
      if (this.tiles[size - 1][i] === TILE_TYPES.CORRIDOR) {
        for (let w = -1; w <= 1; w++) {
          const x = i + w;
          if (x >= 0 && x < size) {
            this.tiles[size - 1][x] = TILE_TYPES.CORRIDOR;
            this.tiles[size - 2][x] = TILE_TYPES.CORRIDOR;
          }
        }
      }
      
      // West edge
      if (this.tiles[i][0] === TILE_TYPES.CORRIDOR) {
        for (let w = -1; w <= 1; w++) {
          const y = i + w;
          if (y >= 0 && y < size) {
            this.tiles[y][0] = TILE_TYPES.CORRIDOR;
            this.tiles[y][1] = TILE_TYPES.CORRIDOR;
          }
        }
      }
      
      // East edge
      if (this.tiles[i][size - 1] === TILE_TYPES.CORRIDOR) {
        for (let w = -1; w <= 1; w++) {
          const y = i + w;
          if (y >= 0 && y < size) {
            this.tiles[y][size - 1] = TILE_TYPES.CORRIDOR;
            this.tiles[y][size - 2] = TILE_TYPES.CORRIDOR;
          }
        }
      }
    }
  }


  getTile(localX: number, localY: number): number | null {
    if (localX < 0 || localX >= GAME_CONFIG.chunkSize || 
        localY < 0 || localY >= GAME_CONFIG.chunkSize) {
      return null;
    }
    return this.tiles[localY][localX];
  }

  setTile(localX: number, localY: number, type: number) {
    if (localX >= 0 && localX < GAME_CONFIG.chunkSize && 
        localY >= 0 && localY < GAME_CONFIG.chunkSize) {
      this.tiles[localY][localX] = type;
    }
  }

  getWorldX(): number {
    return this.x * GAME_CONFIG.chunkSize * GAME_CONFIG.tileSize;
  }

  getWorldY(): number {
    return this.y * GAME_CONFIG.chunkSize * GAME_CONFIG.tileSize;
  }
}