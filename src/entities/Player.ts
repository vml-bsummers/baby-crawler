import Phaser from 'phaser';
import { GAME_CONFIG } from '../utils/Constants';
import { ItemRegistry } from '../utils/ItemRegistry';
import { DEV_CONFIG } from '../utils/DevConfig';

export class Player {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: any;
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private speed: number = 150; // pixels per second
  
  // Combat and stats
  health: number = 100;
  maxHealth: number = 100;
  private level: number = 1; // months old
  private experience: number = 0;
  private experienceToNext: number = 100; // XP needed for level 2
  private invulnerable: boolean = false;
  private lastHitTime: number = 0;
  private exploredTiles: Set<string> = new Set();
  private isDead: boolean = false;
  
  // Inventory
  private inventory: Map<string, number> = new Map();
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private bottleKey!: Phaser.Input.Keyboard.Key;

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
    this.bottleKey = scene.input.keyboard.addKey('B');
    
    // Initialize starting inventory from dev config
    Object.entries(DEV_CONFIG.START_INVENTORY).forEach(([itemId, quantity]) => {
      if (quantity > 0 && ItemRegistry.itemExists(itemId)) {
        this.inventory.set(itemId, quantity);
      }
    });
  }

  update(delta: number) {
    if (!this.cursors || !this.wasd) return;
    
    // Update invulnerability
    if (this.invulnerable && this.scene.time.now - this.lastHitTime > 1000) {
      this.invulnerable = false;
      this.sprite.clearTint();
    }
    
    // Check for bottle use
    if (Phaser.Input.Keyboard.JustDown(this.bottleKey)) {
      this.useItem('bottle');
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
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (moveX !== 0 || moveY !== 0) {
      const moveAmount = this.speed * delta / 1000;
      this.sprite.x += moveX * moveAmount;
      this.sprite.y += moveY * moveAmount;
      
      // Track explored tiles
      this.trackExploration();
    } else if (body) {
      // Reset velocity when not moving to prevent sliding
      body.setVelocity(0, 0);
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
        
        // Show visual feedback for bottle use
        if (itemType === 'bottle') {
          this.showHealingEffect();
        }
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
  
  isInventoryKeyJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.inventoryKey);
  }
  
  // Experience system with logarithmic scaling
  private calculateExperienceForLevel(level: number): number {
    // Base XP = 100, each level requires ~1.5x more XP than the previous
    // Formula: XP = 100 * (level^2.2)
    return Math.floor(100 * Math.pow(level, 2.2));
  }
  
  addExperience(amount: number) {
    this.experience += amount;
    
    // Check for level up
    while (this.experience >= this.experienceToNext) {
      this.experience -= this.experienceToNext;
      this.levelUp();
    }
    
    // Emit experience update
    this.scene.game.events.emit('experience-update', this.experience, this.experienceToNext, this.level);
  }
  
  private levelUp() {
    this.level++;
    this.experienceToNext = this.calculateExperienceForLevel(this.level);
    
    // Increase max health by 10 per level
    this.maxHealth += 10;
    this.health = this.maxHealth; // Full heal on level up
    
    // Speed bonus: +5 pixels/second per level
    this.speed += 5;
    
    // Emit level up event
    this.scene.game.events.emit('level-up', this.level);
    this.scene.game.events.emit('health-update', this.health, this.maxHealth);
    this.scene.game.events.emit('age-update', this.level);
    
    // Show level up effect
    this.showLevelUpEffect();
  }
  
  private showLevelUpEffect() {
    // Golden glow effect
    this.sprite.setTint(0xffff00);
    
    // Create sparkle effects around player
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const sparkle = this.scene.add.star(
        this.sprite.x + Math.cos(angle) * 20,
        this.sprite.y + Math.sin(angle) * 20,
        5,
        3,
        6,
        0xffff00
      );
      
      this.scene.tweens.add({
        targets: sparkle,
        x: sparkle.x + Math.cos(angle) * 40,
        y: sparkle.y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
    
    // Remove tint after effect
    this.scene.time.delayedCall(500, () => {
      this.sprite.clearTint();
    });
    
    // Show level up text
    const levelUpText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 40,
      `Level ${this.level}!`,
      {
        fontSize: '24px',
        color: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    levelUpText.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: levelUpText,
      y: levelUpText.y - 30,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => levelUpText.destroy()
    });
  }
  
  getExperience(): number {
    return this.experience;
  }
  
  getExperienceToNext(): number {
    return this.experienceToNext;
  }
  
  private showHealingEffect() {
    // Green healing glow
    this.sprite.setTint(0x00ff00);
    
    // Create healing particles
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const particle = this.scene.add.graphics();
      particle.fillStyle(0x00ff00, 0.8);
      particle.fillCircle(0, 0, 3);
      particle.x = this.sprite.x + Math.cos(angle) * 20;
      particle.y = this.sprite.y + Math.sin(angle) * 20;
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 30,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    // Show +20 HP text
    const healText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 20,
      '+20 HP',
      {
        fontSize: '20px',
        color: '#00ff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    healText.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => healText.destroy()
    });
    
    // Remove tint after effect
    this.scene.time.delayedCall(300, () => {
      this.sprite.clearTint();
    });
  }
}