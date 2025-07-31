import { TILE_TYPES } from '../utils/Constants';

export class SimpleDungeonGenerator {
  private width: number;
  private height: number;
  private tiles: number[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    
    // Initialize with walls
    for (let y = 0; y < height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < width; x++) {
        this.tiles[y][x] = TILE_TYPES.WALL;
      }
    }
  }

  generate(): number[][] {
    // Create rooms
    const rooms = this.createRooms();
    
    // Connect rooms with corridors
    this.connectRooms(rooms);
    
    return this.tiles;
  }

  private createRooms(): Array<{x: number, y: number, width: number, height: number}> {
    const rooms = [];
    const numRooms = 8 + Math.floor(Math.random() * 8); // More rooms for higher density
    const maxAttempts = 100; // More attempts to place rooms
    
    for (let i = 0; i < maxAttempts && rooms.length < numRooms; i++) {
      const roomWidth = 3 + Math.floor(Math.random() * 8); // Varied room sizes
      const roomHeight = 3 + Math.floor(Math.random() * 8);
      const x = 1 + Math.floor(Math.random() * (this.width - roomWidth - 2));
      const y = 1 + Math.floor(Math.random() * (this.height - roomHeight - 2));
      
      // Check if room overlaps with existing rooms (with 1 tile spacing)
      let overlaps = false;
      for (const room of rooms) {
        if (x < room.x + room.width + 1 &&
            x + roomWidth + 1 > room.x &&
            y < room.y + room.height + 1 &&
            y + roomHeight + 1 > room.y) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        // Carve out the room
        for (let ry = y; ry < y + roomHeight; ry++) {
          for (let rx = x; rx < x + roomWidth; rx++) {
            this.tiles[ry][rx] = TILE_TYPES.FLOOR;
          }
        }
        
        rooms.push({ x, y, width: roomWidth, height: roomHeight });
      }
    }
    
    // Ensure we have at least 3 rooms
    if (rooms.length < 3) {
      // Force create rooms in corners
      const forcedRooms = [
        { x: 1, y: 1, width: 5, height: 5 },
        { x: this.width - 6, y: 1, width: 5, height: 5 },
        { x: 1, y: this.height - 6, width: 5, height: 5 },
        { x: this.width - 6, y: this.height - 6, width: 5, height: 5 }
      ];
      
      for (const room of forcedRooms) {
        if (rooms.length < 3) {
          for (let ry = room.y; ry < room.y + room.height; ry++) {
            for (let rx = room.x; rx < room.x + room.width; rx++) {
              if (rx < this.width && ry < this.height) {
                this.tiles[ry][rx] = TILE_TYPES.FLOOR;
              }
            }
          }
          rooms.push(room);
        }
      }
    }
    
    return rooms;
  }

  private connectRooms(rooms: Array<{x: number, y: number, width: number, height: number}>) {
    // Connect each room to the next one
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];
      
      // Get center points
      const centerA = {
        x: Math.floor(roomA.x + roomA.width / 2),
        y: Math.floor(roomA.y + roomA.height / 2)
      };
      const centerB = {
        x: Math.floor(roomB.x + roomB.width / 2),
        y: Math.floor(roomB.y + roomB.height / 2)
      };
      
      // Create L-shaped corridor
      if (Math.random() < 0.5) {
        // Horizontal then vertical
        this.createCorridor(centerA.x, centerA.y, centerB.x, centerA.y);
        this.createCorridor(centerB.x, centerA.y, centerB.x, centerB.y);
      } else {
        // Vertical then horizontal
        this.createCorridor(centerA.x, centerA.y, centerA.x, centerB.y);
        this.createCorridor(centerA.x, centerB.y, centerB.x, centerB.y);
      }
    }
    
    // Connect rooms to chunk edges for infinite generation
    this.connectToEdges(rooms);
  }

  private createCorridor(x1: number, y1: number, x2: number, y2: number) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    if (minX === maxX) {
      // Vertical corridor
      for (let y = minY; y <= maxY; y++) {
        this.tiles[y][minX] = TILE_TYPES.CORRIDOR;
      }
    } else {
      // Horizontal corridor
      for (let x = minX; x <= maxX; x++) {
        this.tiles[minY][x] = TILE_TYPES.CORRIDOR;
      }
    }
  }
  
  private connectToEdges(rooms: Array<{x: number, y: number, width: number, height: number}>) {
    if (rooms.length === 0) return;
    
    // Find rooms closest to each edge
    let northRoom = rooms[0];
    let southRoom = rooms[0];
    let westRoom = rooms[0];
    let eastRoom = rooms[0];
    
    for (const room of rooms) {
      const centerX = room.x + room.width / 2;
      const centerY = room.y + room.height / 2;
      
      if (centerY < northRoom.y + northRoom.height / 2) northRoom = room;
      if (centerY > southRoom.y + southRoom.height / 2) southRoom = room;
      if (centerX < westRoom.x + westRoom.width / 2) westRoom = room;
      if (centerX > eastRoom.x + eastRoom.width / 2) eastRoom = room;
    }
    
    // Connect to edges
    const center = Math.floor(this.width / 2);
    
    // North edge
    const northCenter = Math.floor(northRoom.x + northRoom.width / 2);
    this.createCorridor(northCenter, northRoom.y, northCenter, 0);
    // Widen connection point
    for (let i = -2; i <= 2; i++) {
      const x = northCenter + i;
      if (x >= 0 && x < this.width) {
        this.tiles[0][x] = TILE_TYPES.CORRIDOR;
        this.tiles[1][x] = TILE_TYPES.CORRIDOR;
      }
    }
    
    // South edge
    const southCenter = Math.floor(southRoom.x + southRoom.width / 2);
    this.createCorridor(southCenter, southRoom.y + southRoom.height - 1, southCenter, this.height - 1);
    // Widen connection point
    for (let i = -2; i <= 2; i++) {
      const x = southCenter + i;
      if (x >= 0 && x < this.width) {
        this.tiles[this.height - 1][x] = TILE_TYPES.CORRIDOR;
        this.tiles[this.height - 2][x] = TILE_TYPES.CORRIDOR;
      }
    }
    
    // West edge
    const westCenter = Math.floor(westRoom.y + westRoom.height / 2);
    this.createCorridor(westRoom.x, westCenter, 0, westCenter);
    // Widen connection point
    for (let i = -2; i <= 2; i++) {
      const y = westCenter + i;
      if (y >= 0 && y < this.height) {
        this.tiles[y][0] = TILE_TYPES.CORRIDOR;
        this.tiles[y][1] = TILE_TYPES.CORRIDOR;
      }
    }
    
    // East edge
    const eastCenter = Math.floor(eastRoom.y + eastRoom.height / 2);
    this.createCorridor(eastRoom.x + eastRoom.width - 1, eastCenter, this.width - 1, eastCenter);
    // Widen connection point
    for (let i = -2; i <= 2; i++) {
      const y = eastCenter + i;
      if (y >= 0 && y < this.height) {
        this.tiles[y][this.width - 1] = TILE_TYPES.CORRIDOR;
        this.tiles[y][this.width - 2] = TILE_TYPES.CORRIDOR;
      }
    }
  }
}