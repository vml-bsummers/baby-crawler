import { Chunk } from './Chunk';
import { GAME_CONFIG, TILE_TYPES } from '../utils/Constants';
import { ChunkManager } from './ChunkManager';

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DungeonGenerator {
  private worldSeed: number;
  private chunkManager: ChunkManager;

  constructor(worldSeed: number, chunkManager: ChunkManager) {
    this.worldSeed = worldSeed;
    this.chunkManager = chunkManager;
  }

  generateChunk(chunk: Chunk, chunkX: number, chunkY: number) {
    // Combine world seed with chunk coordinates for unique but consistent generation
    const chunkSeed = this.hashCoords(chunkX, chunkY) ^ this.worldSeed;
    
    // Initialize with walls
    for (let y = 0; y < GAME_CONFIG.chunkSize; y++) {
      for (let x = 0; x < GAME_CONFIG.chunkSize; x++) {
        chunk.setTile(x, y, TILE_TYPES.WALL);
      }
    }
    
    // Generate rooms using BSP
    const rooms = this.generateRoomsBSP(chunk, chunkSeed);
    
    // Connect rooms with corridors
    this.connectRooms(chunk, rooms, chunkSeed);
    
    // Create chunk edge connections with smart matching
    this.createChunkConnections(chunk, chunkX, chunkY, chunkSeed);
    
    // Connect rooms to edge connections
    this.connectRoomsToEdges(chunk, rooms);
  }

  private generateRoomsBSP(chunk: Chunk, seed: number): Room[] {
    const rooms: Room[] = [];
    const minRoomSize = 4;
    const maxRoomSize = 10;
    
    // Simple room generation - place 2-4 rooms per chunk
    const numRooms = 2 + Math.floor(this.seededRandom(seed) * 3);
    
    for (let i = 0; i < numRooms; i++) {
      const roomWidth = minRoomSize + Math.floor(this.seededRandom(seed + i * 100) * (maxRoomSize - minRoomSize));
      const roomHeight = minRoomSize + Math.floor(this.seededRandom(seed + i * 200) * (maxRoomSize - minRoomSize));
      
      const x = 1 + Math.floor(this.seededRandom(seed + i * 300) * (GAME_CONFIG.chunkSize - roomWidth - 2));
      const y = 1 + Math.floor(this.seededRandom(seed + i * 400) * (GAME_CONFIG.chunkSize - roomHeight - 2));
      
      const room: Room = { x, y, width: roomWidth, height: roomHeight };
      
      // Carve out the room
      for (let ry = room.y; ry < room.y + room.height; ry++) {
        for (let rx = room.x; rx < room.x + room.width; rx++) {
          chunk.setTile(rx, ry, TILE_TYPES.FLOOR);
        }
      }
      
      rooms.push(room);
    }
    
    return rooms;
  }

  private connectRooms(chunk: Chunk, rooms: Room[], seed: number) {
    // Connect each room to the next with L-shaped corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];
      
      const startX = Math.floor(roomA.x + roomA.width / 2);
      const startY = Math.floor(roomA.y + roomA.height / 2);
      const endX = Math.floor(roomB.x + roomB.width / 2);
      const endY = Math.floor(roomB.y + roomB.height / 2);
      
      // Create L-shaped corridor
      if (this.seededRandom(seed + i * 500) > 0.5) {
        // Horizontal first
        this.createCorridor(chunk, startX, startY, endX, startY);
        this.createCorridor(chunk, endX, startY, endX, endY);
      } else {
        // Vertical first
        this.createCorridor(chunk, startX, startY, startX, endY);
        this.createCorridor(chunk, startX, endY, endX, endY);
      }
    }
  }

  private createCorridor(chunk: Chunk, x1: number, y1: number, x2: number, y2: number) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (x >= 0 && x < GAME_CONFIG.chunkSize && y >= 0 && y < GAME_CONFIG.chunkSize) {
          chunk.setTile(x, y, TILE_TYPES.CORRIDOR);
        }
      }
    }
  }

  private createChunkConnections(chunk: Chunk, chunkX: number, chunkY: number, seed: number) {
    const opening = 3;
    const mid = Math.floor(GAME_CONFIG.chunkSize / 2);
    
    // Check existing adjacent connections that we need to match
    const existingConnections = {
      north: this.chunkManager.getAdjacentConnection(chunkX, chunkY, 'north'),
      south: this.chunkManager.getAdjacentConnection(chunkX, chunkY, 'south'),
      east: this.chunkManager.getAdjacentConnection(chunkX, chunkY, 'east'),
      west: this.chunkManager.getAdjacentConnection(chunkX, chunkY, 'west')
    };
    
    // Check which adjacent chunks already exist (explored areas)
    const adjacentChunkExists = {
      north: this.chunkManager.getChunk(chunkX, chunkY - 1) !== null,
      south: this.chunkManager.getChunk(chunkX, chunkY + 1) !== null,
      east: this.chunkManager.getChunk(chunkX + 1, chunkY) !== null,
      west: this.chunkManager.getChunk(chunkX - 1, chunkY) !== null
    };
    
    // Count how many connections we must create to match existing chunks
    let requiredConnections = 0;
    if (existingConnections.north) requiredConnections++;
    if (existingConnections.south) requiredConnections++;
    if (existingConnections.east) requiredConnections++;
    if (existingConnections.west) requiredConnections++;
    
    // Plan which connections to create
    const connections = {
      north: false,
      south: false,
      east: false,
      west: false
    };
    
    // First, match all existing connections
    if (existingConnections.north) {
      connections.north = true;
      this.createConnection(chunk, chunkX, chunkY, 'north', existingConnections.north.position, existingConnections.north.width);
    }
    if (existingConnections.south) {
      connections.south = true;
      this.createConnection(chunk, chunkX, chunkY, 'south', existingConnections.south.position, existingConnections.south.width);
    }
    if (existingConnections.east) {
      connections.east = true;
      this.createConnection(chunk, chunkX, chunkY, 'east', existingConnections.east.position, existingConnections.east.width);
    }
    if (existingConnections.west) {
      connections.west = true;
      this.createConnection(chunk, chunkX, chunkY, 'west', existingConnections.west.position, existingConnections.west.width);
    }
    
    // Ensure we have at least 2 connections total
    let totalConnections = requiredConnections;
    const minConnections = 2;
    
    if (totalConnections < minConnections) {
      // Need to add more connections - prioritize unexplored directions
      const unexploredEdges: ('north' | 'south' | 'east' | 'west')[] = [];
      const exploredEdges: ('north' | 'south' | 'east' | 'west')[] = [];
      
      // Categorize edges by whether they lead to explored chunks
      if (!connections.north) {
        if (adjacentChunkExists.north) {
          exploredEdges.push('north');
        } else {
          unexploredEdges.push('north');
        }
      }
      if (!connections.south) {
        if (adjacentChunkExists.south) {
          exploredEdges.push('south');
        } else {
          unexploredEdges.push('south');
        }
      }
      if (!connections.east) {
        if (adjacentChunkExists.east) {
          exploredEdges.push('east');
        } else {
          unexploredEdges.push('east');
        }
      }
      if (!connections.west) {
        if (adjacentChunkExists.west) {
          exploredEdges.push('west');
        } else {
          unexploredEdges.push('west');
        }
      }
      
      // First, try to add connections to unexplored areas
      while (totalConnections < minConnections && unexploredEdges.length > 0) {
        const randomIndex = Math.floor(this.seededRandom(seed + totalConnections * 1000) * unexploredEdges.length);
        const edge = unexploredEdges[randomIndex];
        unexploredEdges.splice(randomIndex, 1);
        
        connections[edge] = true;
        this.createConnection(chunk, chunkX, chunkY, edge, mid, opening * 2 + 1);
        totalConnections++;
      }
      
      // If we still need more connections, use explored edges
      while (totalConnections < minConnections && exploredEdges.length > 0) {
        const randomIndex = Math.floor(this.seededRandom(seed + totalConnections * 1000) * exploredEdges.length);
        const edge = exploredEdges[randomIndex];
        exploredEdges.splice(randomIndex, 1);
        
        connections[edge] = true;
        this.createConnection(chunk, chunkX, chunkY, edge, mid, opening * 2 + 1);
        totalConnections++;
      }
    }
    
    // Optionally add more connections, with higher chance for unexplored directions
    const baseChance = 0.3; // Base chance for explored directions
    const bonusChance = 0.4; // Additional chance for unexplored directions
    
    const extraChances = {
      north: !connections.north && this.seededRandom(seed + 5000) > (adjacentChunkExists.north ? baseChance : baseChance - bonusChance),
      south: !connections.south && this.seededRandom(seed + 6000) > (adjacentChunkExists.south ? baseChance : baseChance - bonusChance),
      east: !connections.east && this.seededRandom(seed + 7000) > (adjacentChunkExists.east ? baseChance : baseChance - bonusChance),
      west: !connections.west && this.seededRandom(seed + 8000) > (adjacentChunkExists.west ? baseChance : baseChance - bonusChance)
    };
    
    // Prioritize adding connections to unexplored areas first
    if (extraChances.north && !adjacentChunkExists.north) {
      connections.north = true;
      this.createConnection(chunk, chunkX, chunkY, 'north', mid, opening * 2 + 1);
    }
    if (extraChances.south && !adjacentChunkExists.south) {
      connections.south = true;
      this.createConnection(chunk, chunkX, chunkY, 'south', mid, opening * 2 + 1);
    }
    if (extraChances.east && !adjacentChunkExists.east) {
      connections.east = true;
      this.createConnection(chunk, chunkX, chunkY, 'east', mid, opening * 2 + 1);
    }
    if (extraChances.west && !adjacentChunkExists.west) {
      connections.west = true;
      this.createConnection(chunk, chunkX, chunkY, 'west', mid, opening * 2 + 1);
    }
    
    // Then add connections to explored areas if rolled
    if (extraChances.north && adjacentChunkExists.north && !connections.north) {
      connections.north = true;
      this.createConnection(chunk, chunkX, chunkY, 'north', mid, opening * 2 + 1);
    }
    if (extraChances.south && adjacentChunkExists.south && !connections.south) {
      connections.south = true;
      this.createConnection(chunk, chunkX, chunkY, 'south', mid, opening * 2 + 1);
    }
    if (extraChances.east && adjacentChunkExists.east && !connections.east) {
      connections.east = true;
      this.createConnection(chunk, chunkX, chunkY, 'east', mid, opening * 2 + 1);
    }
    if (extraChances.west && adjacentChunkExists.west && !connections.west) {
      connections.west = true;
      this.createConnection(chunk, chunkX, chunkY, 'west', mid, opening * 2 + 1);
    }
  }
  
  private createConnection(chunk: Chunk, chunkX: number, chunkY: number, edge: 'north' | 'south' | 'east' | 'west', position: number, width: number) {
    const halfWidth = Math.floor(width / 2);
    
    switch (edge) {
      case 'north':
        for (let i = -halfWidth; i <= halfWidth; i++) {
          const x = position + i;
          if (x >= 0 && x < GAME_CONFIG.chunkSize) {
            chunk.setTile(x, 0, TILE_TYPES.CORRIDOR);
            chunk.setTile(x, 1, TILE_TYPES.CORRIDOR);
          }
        }
        this.chunkManager.setConnection(chunkX, chunkY, 'north', { position, width });
        break;
        
      case 'south':
        for (let i = -halfWidth; i <= halfWidth; i++) {
          const x = position + i;
          if (x >= 0 && x < GAME_CONFIG.chunkSize) {
            chunk.setTile(x, GAME_CONFIG.chunkSize - 1, TILE_TYPES.CORRIDOR);
            chunk.setTile(x, GAME_CONFIG.chunkSize - 2, TILE_TYPES.CORRIDOR);
          }
        }
        this.chunkManager.setConnection(chunkX, chunkY, 'south', { position, width });
        break;
        
      case 'east':
        for (let i = -halfWidth; i <= halfWidth; i++) {
          const y = position + i;
          if (y >= 0 && y < GAME_CONFIG.chunkSize) {
            chunk.setTile(GAME_CONFIG.chunkSize - 1, y, TILE_TYPES.CORRIDOR);
            chunk.setTile(GAME_CONFIG.chunkSize - 2, y, TILE_TYPES.CORRIDOR);
          }
        }
        this.chunkManager.setConnection(chunkX, chunkY, 'east', { position, width });
        break;
        
      case 'west':
        for (let i = -halfWidth; i <= halfWidth; i++) {
          const y = position + i;
          if (y >= 0 && y < GAME_CONFIG.chunkSize) {
            chunk.setTile(0, y, TILE_TYPES.CORRIDOR);
            chunk.setTile(1, y, TILE_TYPES.CORRIDOR);
          }
        }
        this.chunkManager.setConnection(chunkX, chunkY, 'west', { position, width });
        break;
    }
  }


  private connectRoomsToEdges(chunk: Chunk, rooms: Room[]) {
    if (rooms.length === 0) return;
    
    // Find edge corridors
    const edgeCorridors: { edge: string, x: number, y: number }[] = [];
    
    // Check top and bottom edges
    for (let x = 0; x < GAME_CONFIG.chunkSize; x++) {
      if (chunk.getTile(x, 0) === TILE_TYPES.CORRIDOR) {
        edgeCorridors.push({ edge: 'north', x, y: 0 });
      }
      if (chunk.getTile(x, GAME_CONFIG.chunkSize - 1) === TILE_TYPES.CORRIDOR) {
        edgeCorridors.push({ edge: 'south', x, y: GAME_CONFIG.chunkSize - 1 });
      }
    }
    
    // Check left and right edges
    for (let y = 0; y < GAME_CONFIG.chunkSize; y++) {
      if (chunk.getTile(0, y) === TILE_TYPES.CORRIDOR) {
        edgeCorridors.push({ edge: 'west', x: 0, y });
      }
      if (chunk.getTile(GAME_CONFIG.chunkSize - 1, y) === TILE_TYPES.CORRIDOR) {
        edgeCorridors.push({ edge: 'east', x: GAME_CONFIG.chunkSize - 1, y });
      }
    }
    
    // Connect each edge corridor to the nearest room
    for (const corridor of edgeCorridors) {
      let nearestRoom = rooms[0];
      let nearestDistance = Infinity;
      
      // Find nearest room
      for (const room of rooms) {
        const roomCenterX = room.x + Math.floor(room.width / 2);
        const roomCenterY = room.y + Math.floor(room.height / 2);
        const distance = Math.abs(roomCenterX - corridor.x) + Math.abs(roomCenterY - corridor.y);
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestRoom = room;
        }
      }
      
      // Connect corridor to nearest room
      const roomCenterX = nearestRoom.x + Math.floor(nearestRoom.width / 2);
      const roomCenterY = nearestRoom.y + Math.floor(nearestRoom.height / 2);
      
      // Create L-shaped connection
      if (Math.abs(corridor.x - roomCenterX) > Math.abs(corridor.y - roomCenterY)) {
        // Horizontal first
        this.createCorridor(chunk, corridor.x, corridor.y, roomCenterX, corridor.y);
        this.createCorridor(chunk, roomCenterX, corridor.y, roomCenterX, roomCenterY);
      } else {
        // Vertical first
        this.createCorridor(chunk, corridor.x, corridor.y, corridor.x, roomCenterY);
        this.createCorridor(chunk, corridor.x, roomCenterY, roomCenterX, roomCenterY);
      }
    }
  }

  private hashCoords(x: number, y: number): number {
    // Simple hash function for coordinates
    return ((x * 73856093) ^ (y * 19349663)) & 0x7fffffff;
  }

  private seededRandom(seed: number): number {
    // Simple seeded random number generator
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}