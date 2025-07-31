import Phaser from 'phaser';
import { GAME_CONFIG } from '../utils/Constants';
import { ItemRegistry } from '../utils/ItemRegistry';
import { DEV_CONFIG } from '../utils/DevConfig';

export class Player {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: any;
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private speed: number = 150; // pixels per second
  
  // Combat and stats
  health: number = 100;
  maxHealth: number = 100;
  private level: number = 1; // months old
  private invulnerable: boolean = false;
  private lastHitTime: number = 0;
  private exploredTiles: Set<string> = new Set();
  private isDead: boolean = false;
  
  // Inventory
  private inventory: Map<string, number> = new Map();
  private inventoryKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create baby sprite
    this.sprite = scene.add.sprite(x, y, 'baby');
    this.sprite.setScale(0.5); // Scale down from 64x64 to 32x32
    this.sprite.play('baby-idle');
    
    // Set up physics body for collision
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24); // Slightly smaller hitbox
    body.setOffset(4, 4);

    // Set up controls
    if (!scene.input || !scene.input.keyboard) {
      console.error('Keyboard input not initialized');
      return;
    }
    
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
    this.inventoryKey = scene.input.keyboard.addKey('I');
    
    // Initialize starting inventory from dev config
    Object.entries(DEV_CONFIG.START_INVENTORY).forEach(([itemId, quantity]) => {
      if (quantity > 0 && ItemRegistry.itemExists(itemId)) {
        this.inventory.set(itemId, quantity);
      }
    });
    
    // Emit initial inventory update if we have starting items
    if (this.inventory.size > 0) {
      scene.game.events.emit('inventory-update', this.inventory);
    }
  }

  update(delta: number) {
    if (!this.cursors || !this.wasd) return;
    
    // Update invulnerability
    if (this.invulnerable && this.scene.time.now - this.lastHitTime > 1000) {
      this.invulnerable = false;
      this.sprite.clearTint();
    }
    
    // Don't allow movement if dead
    if (this.isDead) {
      this.sprite.play('baby-idle');
      return;
    }
    
    let isMoving = false;
    let moveX = 0;
    let moveY = 0;

    // Handle input
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      moveX = -1;
      this.currentDirection = 'left';
      isMoving = true;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      moveX = 1;
      this.currentDirection = 'right';
      isMoving = true;
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      moveY = -1;
      this.currentDirection = 'up';
      isMoving = true;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      moveY = 1;
      this.currentDirection = 'down';
      isMoving = true;
    }

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707;
      moveY *= 0.707;
    }

    // Apply movement
    if (moveX !== 0 || moveY !== 0) {
      const moveAmount = this.speed * delta / 1000;
      this.sprite.x += moveX * moveAmount;
      this.sprite.y += moveY * moveAmount;
      
      // Track explored tiles
      this.trackExploration();
    }

    // Update animations
    if (isMoving) {
      this.sprite.play(`baby-${this.currentDirection}`, true);
      
    } else {
      // Show idle animation
      this.sprite.play('baby-idle');
      
      // Set the frame based on direction
      switch (this.currentDirection) {
        case 'up':
          this.sprite.setFrame(4);  // Swapped
          break;
        case 'down':
          this.sprite.setFrame(0);  // Swapped
          break;
        case 'left':
          this.sprite.setFrame(8);
          break;
        case 'right':
          this.sprite.setFrame(12);
          break;
      }
    }
    
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPosition(x: number, y: number) {
    this.sprite.x = x;
    this.sprite.y = y;
  }
  
  takeDamage(damage: number): boolean {
    if (this.invulnerable || this.health <= 0) return false;
    
    this.health -= damage;
    this.invulnerable = true;
    this.lastHitTime = this.scene.time.now;
    
    // Visual feedback
    this.sprite.setTint(0xff0000);
    
    // Update UI
    this.scene.game.events.emit('health-update', this.health, this.maxHealth);
    
    // Check if dead
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.scene.game.events.emit('game-over');
      return true;
    }
    
    return false;
  }
  
  private trackExploration() {
    // Get current tile position
    const tileX = Math.floor(this.sprite.x / GAME_CONFIG.tileSize);
    const tileY = Math.floor(this.sprite.y / GAME_CONFIG.tileSize);
    const tileKey = `${tileX},${tileY}`;
    
    // Add to explored tiles if new
    if (!this.exploredTiles.has(tileKey)) {
      this.exploredTiles.add(tileKey);
      
      // Update UI with total area (1 tile = 1 square meter)
      this.scene.game.events.emit('area-update', this.exploredTiles.size);
    }
  }
  
  getHealth(): number {
    return this.health;
  }
  
  getLevel(): number {
    return this.level;
  }
  
  isInvulnerable(): boolean {
    return this.invulnerable;
  }
  
  getExploredArea(): number {
    return this.exploredTiles.size;
  }
  
  getInventory(): Map<string, number> {
    return this.inventory;
  }
  
  collectItem(itemType: string) {
    const currentCount = this.inventory.get(itemType) || 0;
    this.inventory.set(itemType, currentCount + 1);
    
    // Emit event for UI update
    this.scene.game.events.emit('inventory-update', this.inventory);
  }
  
  useItem(itemType: string): boolean {
    const count = this.inventory.get(itemType) || 0;
    if (count > 0) {
      this.inventory.set(itemType, count - 1);
      
      // Handle item effects using ItemRegistry
      const itemDef = ItemRegistry.getItem(itemType);
      if (itemDef && itemDef.effect) {
        itemDef.effect(this);
      }
      
      // Emit event for UI update
      this.scene.game.events.emit('inventory-update', this.inventory);
      return true;
    }
    return false;
  }
  
  dropItem(itemType: string): boolean {
    const count = this.inventory.get(itemType) || 0;
    if (count > 0) {
      this.inventory.set(itemType, count - 1);
      
      // Emit event for UI update
      this.scene.game.events.emit('inventory-update', this.inventory);
      return true;
    }
    return false;
  }
  
  getInventory(): Map<string, number> {
    return new Map(this.inventory);
  }
  
  isInventoryKeyJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.inventoryKey);
  }
}