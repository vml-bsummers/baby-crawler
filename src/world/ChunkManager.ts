import Phaser from 'phaser';
import { Chunk } from './Chunk';
import { DungeonGenerator } from './DungeonGenerator';
import { GAME_CONFIG } from '../utils/Constants';

export interface ChunkConnection {
  position: number; // Position along the edge (0 to chunkSize-1)
  width: number;    // Width of the connection
}

export class ChunkManager {
  private chunks: Map<string, Chunk>;
  private generator: DungeonGenerator;
  private worldSeed: number;
  private connections: Map<string, ChunkConnection>;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.connections = new Map();
    // Generate a random world seed for this playthrough
    this.worldSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    this.generator = new DungeonGenerator(this.worldSeed, this);
  }

  private getChunkKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  getChunk(x: number, y: number): Chunk | null {
    const key = this.getChunkKey(x, y);
    return this.chunks.get(key) || null;
  }

  generateChunk(x: number, y: number): Chunk {
    const chunk = new Chunk(x, y, this.generator);
    
    // Store the chunk
    const key = this.getChunkKey(x, y);
    this.chunks.set(key, chunk);
    
    // Emit event for new chunk generation
    this.scene.events.emit('chunk-generated', x, y);
    
    return chunk;
  }

  updateChunks(centerChunkX: number, centerChunkY: number) {
    
    // Load chunks within view distance
    for (let dy = -GAME_CONFIG.viewDistance; dy <= GAME_CONFIG.viewDistance; dy++) {
      for (let dx = -GAME_CONFIG.viewDistance; dx <= GAME_CONFIG.viewDistance; dx++) {
        const chunkX = centerChunkX + dx;
        const chunkY = centerChunkY + dy;
        const key = this.getChunkKey(chunkX, chunkY);
        
        // Generate chunk if it doesn't exist
        if (!this.chunks.has(key)) {
          this.generateChunk(chunkX, chunkY);
        }
      }
    }
    
    // Unload chunks that are too far away
    const unloadDistance = GAME_CONFIG.viewDistance + 2;
    for (const [key, chunk] of this.chunks.entries()) {
      const dx = Math.abs(chunk.x - centerChunkX);
      const dy = Math.abs(chunk.y - centerChunkY);
      
      if (dx > unloadDistance || dy > unloadDistance) {
        this.chunks.delete(key);
      }
    }
  }

  getTileAt(worldTileX: number, worldTileY: number): number | null {
    // Convert world tile coordinates to chunk coordinates
    const chunkX = Math.floor(worldTileX / GAME_CONFIG.chunkSize);
    const chunkY = Math.floor(worldTileY / GAME_CONFIG.chunkSize);
    
    // Get local tile coordinates within the chunk
    let localX = worldTileX % GAME_CONFIG.chunkSize;
    let localY = worldTileY % GAME_CONFIG.chunkSize;
    
    // Handle negative coordinates
    if (localX < 0) localX += GAME_CONFIG.chunkSize;
    if (localY < 0) localY += GAME_CONFIG.chunkSize;
    
    const chunk = this.getChunk(chunkX, chunkY);
    if (!chunk) return null;
    
    return chunk.getTile(localX, localY);
  }
  
  // Connection tracking methods
  setConnection(chunkX: number, chunkY: number, edge: 'north' | 'south' | 'east' | 'west', connection: ChunkConnection) {
    const key = `${chunkX},${chunkY}:${edge}`;
    this.connections.set(key, connection);
  }
  
  getConnection(chunkX: number, chunkY: number, edge: 'north' | 'south' | 'east' | 'west'): ChunkConnection | null {
    const key = `${chunkX},${chunkY}:${edge}`;
    return this.connections.get(key) || null;
  }
  
  // Get the adjacent chunk's matching connection
  getAdjacentConnection(chunkX: number, chunkY: number, edge: 'north' | 'south' | 'east' | 'west'): ChunkConnection | null {
    let adjacentX = chunkX;
    let adjacentY = chunkY;
    let oppositeEdge: 'north' | 'south' | 'east' | 'west';
    
    switch (edge) {
      case 'north':
        adjacentY--;
        oppositeEdge = 'south';
        break;
      case 'south':
        adjacentY++;
        oppositeEdge = 'north';
        break;
      case 'east':
        adjacentX++;
        oppositeEdge = 'west';
        break;
      case 'west':
        adjacentX--;
        oppositeEdge = 'east';
        break;
    }
    
    return this.getConnection(adjacentX, adjacentY, oppositeEdge);
  }
}