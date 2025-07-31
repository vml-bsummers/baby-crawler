import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, TILE_TYPES } from '../utils/Constants';
import { ChunkManager } from '../world/ChunkManager';
import { Player } from '../entities/Player';
import { Monster } from '../entities/Monster';
import { BabySlime, BabyGhost } from '../entities/monsters';
import { Bottle } from '../entities/Bottle';
import { Teddy } from '../entities/Teddy';
import { FriendlyTeddy } from '../entities/FriendlyTeddy';
import { DEV_CONFIG } from '../utils/DevConfig';

export class GameScene extends Phaser.Scene {
  private chunkManager!: ChunkManager;
  private player!: Player;
  private graphics!: Phaser.GameObjects.Graphics;
  private monsters: Monster[] = [];
  private monsterGroup!: Phaser.Physics.Arcade.Group;
  private bottles: Bottle[] = [];
  private bottleGroup!: Phaser.Physics.Arcade.Group;
  private teddyItems: Teddy[] = [];
  private teddyItemGroup!: Phaser.Physics.Arcade.Group;
  private teddies: FriendlyTeddy[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize graphics for rendering
    this.graphics = this.add.graphics();
    
    // Initialize chunk manager
    this.chunkManager = new ChunkManager(this);
    
    // Initial world generation
    this.chunkManager.updateChunks(0, 0);
    
    // Find a valid spawn position (floor tile)
    let spawnX = 0;
    let spawnY = 0;
    let foundSpawn = false;
    
    // Search for a floor tile near the origin
    for (let radius = 1; radius <= 10 && !foundSpawn; radius++) {
      for (let y = -radius; y <= radius && !foundSpawn; y++) {
        for (let x = -radius; x <= radius && !foundSpawn; x++) {
          const tile = this.chunkManager.getTileAt(x, y);
          if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.CORRIDOR) {
            spawnX = x * GAME_CONFIG.tileSize;
            spawnY = y * GAME_CONFIG.tileSize;
            foundSpawn = true;
          }
        }
      }
    }
    
    // Create player at valid spawn position
    this.player = new Player(this, spawnX, spawnY);
    
    // Create monster group for physics
    this.monsterGroup = this.physics.add.group();
    
    // Create bottle group for physics
    this.bottleGroup = this.physics.add.group();
    
    // Create teddy item group for physics
    this.teddyItemGroup = this.physics.add.group();
    
    // Set up camera to follow player
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setZoom(2);
    this.cameras.main.setLerp(0.1, 0.1); // Smooth camera movement
    
    // Spawn initial monsters
    this.spawnMonsters();
    
    // Spawn initial bottles
    this.spawnBottles();
    
    // Spawn initial teddy items
    this.spawnTeddyItems();
    
    // Set up keyboard controls
    this.setupControls();
    
    // Initialize UI
    this.game.events.emit('health-update', 100, 100);
    this.game.events.emit('age-update', 1);
    this.game.events.emit('area-update', 0);
    
    // Emit initial inventory if player has starting items
    const playerInventory = this.player.getInventory();
    this.game.events.emit('inventory-update', playerInventory);
    
    // Listen for chunk generation events
    this.events.on('chunk-generated', this.onChunkGenerated, this);
    
    // Listen for teddy spawn events
    this.game.events.on('spawn-teddy', this.spawnTeddy, this);
  }

  update(_time: number, delta: number) {
    // Update player
    this.player.update(delta);
    
    // Check for inventory toggle
    if (this.player.isInventoryKeyJustPressed()) {
      this.game.events.emit('toggle-inventory');
    }
    
    // Get player position from sprite
    const playerPos = this.player.getPosition();
    
    // Update chunks based on player position
    const playerChunkX = Math.floor(playerPos.x / (GAME_CONFIG.chunkSize * GAME_CONFIG.tileSize));
    const playerChunkY = Math.floor(playerPos.y / (GAME_CONFIG.chunkSize * GAME_CONFIG.tileSize));
    this.chunkManager.updateChunks(playerChunkX, playerChunkY);
    
    // Update monsters and remove dead ones
    this.monsters = this.monsters.filter(monster => {
      if (monster.sprite && monster.sprite.active) {
        monster.update(delta, playerPos.x, playerPos.y);
        return true;
      }
      return false;
    });
    
    // Update bottles
    this.bottles.forEach(bottle => {
      bottle.update();
    });
    
    // Update teddy items
    this.teddyItems.forEach(teddy => {
      teddy.update();
    });
    
    // Update teddies
    this.teddies = this.teddies.filter(teddy => {
      if (teddy.sprite && teddy.sprite.active) {
        teddy.update(delta, this.monsters);
        return true;
      }
      return false;
    });
    
    // Spawn more monsters if needed
    if (this.monsters.length < DEV_CONFIG.SPAWN_RATES.MAX_MONSTERS && 
        Math.random() < DEV_CONFIG.SPAWN_RATES.MONSTER_SPAWN_CHANCE) {
      this.spawnMonsters();
    }
    
    // Spawn more bottles if needed
    if (this.bottles.length < DEV_CONFIG.SPAWN_RATES.MAX_BOTTLES && 
        Math.random() < DEV_CONFIG.SPAWN_RATES.BOTTLE_SPAWN_CHANCE) {
      this.spawnBottles();
    }
    
    // Spawn more teddy items if needed
    if (this.teddyItems.length < DEV_CONFIG.SPAWN_RATES.MAX_TEDDIES && 
        Math.random() < DEV_CONFIG.SPAWN_RATES.TEDDY_SPAWN_CHANCE) {
      this.spawnTeddyItems();
    }
    
    // Render visible chunks
    this.renderWorld();
    
    // Handle collisions with walls
    this.handleWallCollisions();
    this.handleMonsterWallCollisions();
    
    // Handle monster-player collisions
    this.handleMonsterPlayerCollisions();
    
    // Handle bottle-player collisions
    this.handleBottlePlayerCollisions();
    
    // Handle teddy item-player collisions
    this.handleTeddyItemPlayerCollisions();
  }

  private setupControls() {
    // Keyboard controls will be handled in Player class
  }

  private renderWorld() {
    // Clear previous frame
    this.graphics.clear();
    
    // Get camera bounds
    const camera = this.cameras.main;
    const startX = Math.floor((camera.scrollX - 100) / GAME_CONFIG.tileSize);
    const endX = Math.ceil((camera.scrollX + camera.width + 100) / GAME_CONFIG.tileSize);
    const startY = Math.floor((camera.scrollY - 100) / GAME_CONFIG.tileSize);
    const endY = Math.ceil((camera.scrollY + camera.height + 100) / GAME_CONFIG.tileSize);
    
    // Render visible tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.chunkManager.getTileAt(x, y);
        if (tile !== null) {
          const worldX = x * GAME_CONFIG.tileSize;
          const worldY = y * GAME_CONFIG.tileSize;
          
          switch (tile) {
            case TILE_TYPES.WALL:
              this.graphics.fillStyle(COLORS.wall);
              this.graphics.fillRect(worldX, worldY, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
              break;
            case TILE_TYPES.FLOOR:
            case TILE_TYPES.CORRIDOR:
              this.graphics.fillStyle(COLORS.floor);
              this.graphics.fillRect(worldX, worldY, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
              break;
          }
        }
      }
    }
  }

  checkCollision(x: number, y: number): boolean {
    const tileX = Math.floor(x / GAME_CONFIG.tileSize);
    const tileY = Math.floor(y / GAME_CONFIG.tileSize);
    const tile = this.chunkManager.getTileAt(tileX, tileY);
    return tile === TILE_TYPES.WALL || tile === null;
  }

  private handleWallCollisions() {
    const playerPos = this.player.getPosition();
    
    // Use sprite position and size to check collisions
    const halfWidth = 12; // Slightly smaller than half sprite width for better feel
    const halfHeight = 12;
    
    // Check points around the player
    const checkPoints = [
      { x: playerPos.x - halfWidth, y: playerPos.y - halfHeight }, // top-left
      { x: playerPos.x + halfWidth, y: playerPos.y - halfHeight }, // top-right
      { x: playerPos.x - halfWidth, y: playerPos.y + halfHeight }, // bottom-left
      { x: playerPos.x + halfWidth, y: playerPos.y + halfHeight }, // bottom-right
      { x: playerPos.x, y: playerPos.y - halfHeight }, // top-center
      { x: playerPos.x, y: playerPos.y + halfHeight }, // bottom-center
      { x: playerPos.x - halfWidth, y: playerPos.y }, // left-center
      { x: playerPos.x + halfWidth, y: playerPos.y }, // right-center
    ];
    
    // Check if any point is in a wall and push player out
    for (const point of checkPoints) {
      const tileX = Math.floor(point.x / GAME_CONFIG.tileSize);
      const tileY = Math.floor(point.y / GAME_CONFIG.tileSize);
      const tile = this.chunkManager.getTileAt(tileX, tileY);
      
      if (tile === TILE_TYPES.WALL || tile === null) {
        // Calculate push direction from tile center
        const tileCenterX = tileX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        const tileCenterY = tileY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
        
        const pushX = playerPos.x - tileCenterX;
        const pushY = playerPos.y - tileCenterY;
        const pushDist = Math.sqrt(pushX * pushX + pushY * pushY);
        
        if (pushDist > 0) {
          // Push player away from wall
          const pushAmount = 2;
          this.player.setPosition(
            playerPos.x + (pushX / pushDist) * pushAmount,
            playerPos.y + (pushY / pushDist) * pushAmount
          );
        }
      }
    }
  }

  private handleMonsterWallCollisions() {
    this.monsters.forEach(monster => {
      const body = monster.sprite.body as Phaser.Physics.Arcade.Body;
      if (!body || !body.enable) return;
      
      const monsterX = monster.sprite.x;
      const monsterY = monster.sprite.y;
      const radius = 12; // Monster collision radius
      
      // Check points around the monster
      const checkPoints = [
        { x: monsterX - radius, y: monsterY - radius },
        { x: monsterX + radius, y: monsterY - radius },
        { x: monsterX - radius, y: monsterY + radius },
        { x: monsterX + radius, y: monsterY + radius },
        { x: monsterX, y: monsterY - radius },
        { x: monsterX, y: monsterY + radius },
        { x: monsterX - radius, y: monsterY },
        { x: monsterX + radius, y: monsterY },
      ];
      
      // Check if any point is in a wall
      for (const point of checkPoints) {
        const tileX = Math.floor(point.x / GAME_CONFIG.tileSize);
        const tileY = Math.floor(point.y / GAME_CONFIG.tileSize);
        const tile = this.chunkManager.getTileAt(tileX, tileY);
        
        if (tile === TILE_TYPES.WALL || tile === null) {
          // Stop velocity in the direction of the wall
          const dx = point.x - monsterX;
          const dy = point.y - monsterY;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal collision
            if ((dx > 0 && body.velocity.x > 0) || (dx < 0 && body.velocity.x < 0)) {
              body.velocity.x = -body.velocity.x * 0.5; // Bounce back
            }
          } else {
            // Vertical collision
            if ((dy > 0 && body.velocity.y > 0) || (dy < 0 && body.velocity.y < 0)) {
              body.velocity.y = -body.velocity.y * 0.5; // Bounce back
            }
          }
          
          // Push monster away from wall slightly
          const tileCenterX = tileX * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
          const tileCenterY = tileY * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2;
          
          const pushX = monsterX - tileCenterX;
          const pushY = monsterY - tileCenterY;
          const pushDist = Math.sqrt(pushX * pushX + pushY * pushY);
          
          if (pushDist > 0) {
            monster.sprite.x += (pushX / pushDist) * 2;
            monster.sprite.y += (pushY / pushDist) * 2;
            body.updateFromGameObject();
          }
        }
      }
    });
  }

  private spawnMonsters() {
    // Find valid spawn positions near the player
    const playerPos = this.player.getPosition();
    const spawnDistance = GAME_CONFIG.tileSize * 10;
    const attempts = 20;
    
    // Define safe spawn zone (origin chunk area)
    const safeZoneSize = GAME_CONFIG.chunkSize * GAME_CONFIG.tileSize;
    const safeZoneMin = -safeZoneSize / 2;
    const safeZoneMax = safeZoneSize / 2;
    
    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = spawnDistance + Math.random() * spawnDistance;
      const x = playerPos.x + Math.cos(angle) * distance;
      const y = playerPos.y + Math.sin(angle) * distance;
      
      // Skip if in safe spawn zone
      if (x >= safeZoneMin && x <= safeZoneMax && y >= safeZoneMin && y <= safeZoneMax) {
        continue;
      }
      
      // Check if position is valid (on floor)
      const tileX = Math.floor(x / GAME_CONFIG.tileSize);
      const tileY = Math.floor(y / GAME_CONFIG.tileSize);
      const tile = this.chunkManager.getTileAt(tileX, tileY);
      
      if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.CORRIDOR) {
        // Only spawn Ghosts and Slimes
        const monsterTypes = [BabySlime, BabyGhost];
        const MonsterClass = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        
        // Pass explored area for level calculation
        const playerExploredArea = this.player.getExploredArea();
        const monster = new MonsterClass(this, x, y, playerExploredArea);
        this.monsters.push(monster);
        this.monsterGroup.add(monster.sprite);
        
        // Only spawn one monster per call
        break;
      }
    }
  }
  
  private handleMonsterPlayerCollisions() {
    const playerPos = this.player.getPosition();
    const playerRadius = 12; // Half of player's hitbox
    
    this.monsters.forEach((monster) => {
      // Skip if monster is being destroyed
      if (!monster.sprite || !monster.sprite.active) return;
      
      const monsterRadius = 12;
      const dx = monster.x - playerPos.x;
      const dy = monster.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check collision
      if (distance < playerRadius + monsterRadius) {
        // Calculate hit chance based on monster level vs player level
        const baseHitChance = 0.5; // 50% base chance
        const levelRatio = monster.getLevel() / this.player.getLevel();
        const hitChance = Math.min(0.9, baseHitChance * levelRatio); // Cap at 90%
        
        // Check if monster hits (once per second)
        if (!this.player.isInvulnerable() && Math.random() < hitChance) {
          const damage = 10 * monster.getLevel(); // 10 damage per monster level
          const isDead = this.player.takeDamage(damage);
          
          
          if (isDead) {
            // Handle game over
            this.handleGameOver();
          }
        }
      }
    });
  }
  
  private handleGameOver() {
    // Pause physics
    this.physics.pause();
    
    // Show game over text
    const gameOverText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      'GAME OVER',
      {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    
    // Show restart button
    const restartText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 20,
      'Click to Restart',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    restartText.setOrigin(0.5);
    restartText.setScrollFactor(0);
    restartText.setInteractive();
    
    restartText.on('pointerdown', () => {
      // Clean up event listeners
      this.events.off('chunk-generated');
      
      // Stop and restart both scenes
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      
      // Start fresh game scenes
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }
  
  private onChunkGenerated(chunkX: number, chunkY: number) {
    // Don't spawn monsters in the starting chunk
    if (chunkX === 0 && chunkY === 0) {
      return;
    }
    
    // Spawn monsters per new chunk based on config
    const monsterRange = DEV_CONFIG.SPAWN_RATES.MONSTERS_PER_CHUNK.max - DEV_CONFIG.SPAWN_RATES.MONSTERS_PER_CHUNK.min + 1;
    const monstersToSpawn = Math.floor(Math.random() * monsterRange) + DEV_CONFIG.SPAWN_RATES.MONSTERS_PER_CHUNK.min;
    
    for (let i = 0; i < monstersToSpawn; i++) {
      // Random position within the chunk
      const tileX = chunkX * GAME_CONFIG.chunkSize + Math.floor(Math.random() * GAME_CONFIG.chunkSize);
      const tileY = chunkY * GAME_CONFIG.chunkSize + Math.floor(Math.random() * GAME_CONFIG.chunkSize);
      const x = tileX * GAME_CONFIG.tileSize;
      const y = tileY * GAME_CONFIG.tileSize;
      
      // Check if position is valid (on floor)
      const tile = this.chunkManager.getTileAt(tileX, tileY);
      
      if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.CORRIDOR) {
        // Only spawn Ghosts and Slimes
        const monsterTypes = [BabySlime, BabyGhost];
        const MonsterClass = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        
        // Pass explored area for level calculation
        const playerExploredArea = this.player.getExploredArea();
        const monster = new MonsterClass(this, x, y, playerExploredArea);
        this.monsters.push(monster);
        this.monsterGroup.add(monster.sprite);
      }
    }
    
    // Also spawn bottles per new chunk based on config
    const bottleRange = DEV_CONFIG.SPAWN_RATES.BOTTLES_PER_CHUNK.max - DEV_CONFIG.SPAWN_RATES.BOTTLES_PER_CHUNK.min + 1;
    const bottlesToSpawn = Math.floor(Math.random() * bottleRange) + DEV_CONFIG.SPAWN_RATES.BOTTLES_PER_CHUNK.min;
    
    for (let i = 0; i < bottlesToSpawn; i++) {
      // Random position within the chunk
      const tileX = chunkX * GAME_CONFIG.chunkSize + Math.floor(Math.random() * GAME_CONFIG.chunkSize);
      const tileY = chunkY * GAME_CONFIG.chunkSize + Math.floor(Math.random() * GAME_CONFIG.chunkSize);
      const x = tileX * GAME_CONFIG.tileSize;
      const y = tileY * GAME_CONFIG.tileSize;
      
      // Check if position is valid (on floor)
      const tile = this.chunkManager.getTileAt(tileX, tileY);
      
      if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.CORRIDOR) {
        const bottle = new Bottle(this, x, y);
        this.bottles.push(bottle);
        this.bottleGroup.add(bottle.sprite);
      }
    }
    
    // Also spawn teddy items per new chunk based on config
    const teddyRange = DEV_CONFIG.SPAWN_RATES.TEDDIES_PER_CHUNK.max - DEV_CONFIG.SPAWN_RATES.TEDDIES_PER_CHUNK.min + 1;
    const teddiesToSpawn = Math.floor(Math.random() * teddyRange) + DEV_CONFIG.SPAWN_RATES.TEDDIES_PER_CHUNK.min;
    
    for (let i = 0; i < teddiesToSpawn; i++) {
      // Random position within the chunk
      const tileX = chunkX * GAME_CONFIG.chunkSize + Math.floor(Math.random() * GAME_CONFIG.chunkSize);
      const tileY = chunkY * GAME_CONFIG.chunkSize + Math.floor(Math.random() * GAME_CONFIG.chunkSize);
      const x = tileX * GAME_CONFIG.tileSize;
      const y = tileY * GAME_CONFIG.tileSize;
      
      // Check if position is valid (on floor)
      const tile = this.chunkManager.getTileAt(tileX, tileY);
      
      if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.CORRIDOR) {
        const teddy = new Teddy(this, x, y);
        this.teddyItems.push(teddy);
        this.teddyItemGroup.add(teddy.sprite);
      }
    }
  }
  
  private spawnBottles() {
    // Find valid spawn positions near the player
    const playerPos = this.player.getPosition();
    const spawnDistance = GAME_CONFIG.tileSize * 15;
    const attempts = 10;
    
    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = spawnDistance + Math.random() * spawnDistance;
      const x = playerPos.x + Math.cos(angle) * distance;
      const y = playerPos.y + Math.sin(angle) * distance;
      
      // Check if position is valid (on floor)
      const tileX = Math.floor(x / GAME_CONFIG.tileSize);
      const tileY = Math.floor(y / GAME_CONFIG.tileSize);
      const tile = this.chunkManager.getTileAt(tileX, tileY);
      
      if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.CORRIDOR) {
        const bottle = new Bottle(this, x, y);
        this.bottles.push(bottle);
        this.bottleGroup.add(bottle.sprite);
        
        // Only spawn one bottle per call
        break;
      }
    }
  }
  
  private handleBottlePlayerCollisions() {
    const playerPos = this.player.getPosition();
    const playerRadius = 16;
    
    this.bottles.forEach((bottle, index) => {
      if (bottle.collected) return;
      
      const dx = bottle.x - playerPos.x;
      const dy = bottle.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < playerRadius + 16) {
        // Collect the bottle
        bottle.collect();
        this.player.collectItem('bottle');
        
        // Remove from array after collection animation
        this.time.delayedCall(300, () => {
          this.bottles.splice(index, 1);
        });
      }
    });
  }
  
  private spawnTeddy(playerPosition: { x: number, y: number }) {
    // Spawn teddy near the player
    const offsetDistance = 50;
    const angle = Math.random() * Math.PI * 2;
    const x = playerPosition.x + Math.cos(angle) * offsetDistance;
    const y = playerPosition.y + Math.sin(angle) * offsetDistance;
    
    // Create the teddy
    const teddy = new FriendlyTeddy(this, x, y);
    this.teddies.push(teddy);
    
    // Show a message
    this.showFloatingText(playerPosition.x, playerPosition.y - 30, 'Teddy summoned!', '#ff69b4');
  }
  
  private showFloatingText(x: number, y: number, text: string, color: string) {
    const floatingText = this.add.text(x, y, text, {
      fontSize: '20px',
      color: color,
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 3
    });
    floatingText.setOrigin(0.5);
    
    // Animate the text floating up and fading out
    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }
  
  private spawnTeddyItems() {
    // Find valid spawn positions near the player
    const playerPos = this.player.getPosition();
    const spawnDistance = GAME_CONFIG.tileSize * 20;
    const attempts = 10;
    
    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = spawnDistance + Math.random() * spawnDistance;
      const x = playerPos.x + Math.cos(angle) * distance;
      const y = playerPos.y + Math.sin(angle) * distance;
      
      // Check if position is valid (on floor)
      const tileX = Math.floor(x / GAME_CONFIG.tileSize);
      const tileY = Math.floor(y / GAME_CONFIG.tileSize);
      const tile = this.chunkManager.getTileAt(tileX, tileY);
      
      if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.CORRIDOR) {
        const teddy = new Teddy(this, x, y);
        this.teddyItems.push(teddy);
        this.teddyItemGroup.add(teddy.sprite);
        
        // Only spawn one teddy per call
        break;
      }
    }
  }
  
  private handleTeddyItemPlayerCollisions() {
    const playerPos = this.player.getPosition();
    const playerRadius = 16;
    
    this.teddyItems.forEach((teddy, index) => {
      if (teddy.collected) return;
      
      const dx = teddy.x - playerPos.x;
      const dy = teddy.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < playerRadius + 16) {
        // Collect the teddy
        teddy.collect();
        this.player.collectItem('teddy');
        
        // Remove from array after collection animation
        this.time.delayedCall(300, () => {
          this.teddyItems.splice(index, 1);
        });
      }
    });
  }
  
  shutdown() {
    // Clean up event listeners
    this.events.off('chunk-generated');
    this.game.events.off('spawn-teddy');
    
    // Clear arrays
    this.monsters = [];
    this.bottles = [];
    this.teddyItems = [];
    this.teddies = [];
  }
}