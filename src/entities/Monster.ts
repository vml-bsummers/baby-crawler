import Phaser from 'phaser';
import { GAME_CONFIG } from '../utils/Constants';

export abstract class Monster {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Ellipse;
  x: number;
  y: number;
  speed: number;
  health: number;
  maxHealth: number;
  color: number;
  behavior: 'wander' | 'follow' | 'flee' | 'idle';
  level: number;
  levelText?: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, x: number, y: number, color: number, speed: number = 50, playerExploredArea: number = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = speed;
    this.health = 3;
    this.maxHealth = 3;
    this.behavior = 'wander';
    
    // Calculate level based on 1% of explored area (minimum level 1)
    this.level = Math.max(1, Math.floor(playerExploredArea * 0.01));
    
    // Create sprite (to be overridden by subclasses)
    this.sprite = scene.add.circle(x, y, GAME_CONFIG.tileSize / 2 - 6, color);
    this.createSprite();
    
    // Set up physics
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);
    
    // Create level text
    this.levelText = scene.add.text(x, y - 20, `Lv${this.level}`, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.levelText.setOrigin(0.5);
    this.levelText.setStroke('#000000', 2);
  }
  
  abstract createSprite(): void;
  abstract makeSound(): void;
  
  update(delta: number, playerX: number, playerY: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    switch (this.behavior) {
      case 'wander':
        this.wanderBehavior(delta);
        break;
      case 'follow':
        this.followBehavior(delta, playerX, playerY);
        break;
      case 'flee':
        this.fleeBehavior(delta, playerX, playerY);
        break;
      case 'idle':
        body.setVelocity(0, 0);
        break;
    }
    
    // Update position
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    
    // Update level text position
    if (this.levelText) {
      this.levelText.x = this.x;
      this.levelText.y = this.y - 20;
    }
  }
  
  private wanderBehavior(_delta: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Change direction randomly
    if (Math.random() < 0.02) {
      const angle = Math.random() * Math.PI * 2;
      body.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );
    }
  }
  
  private followBehavior(_delta: number, playerX: number, playerY: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > GAME_CONFIG.tileSize) {
      body.setVelocity(
        (dx / distance) * this.speed,
        (dy / distance) * this.speed
      );
    } else {
      body.setVelocity(0, 0);
    }
  }
  
  private fleeBehavior(_delta: number, playerX: number, playerY: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < GAME_CONFIG.tileSize * 4) {
      body.setVelocity(
        (dx / distance) * this.speed * 1.5,
        (dy / distance) * this.speed * 1.5
      );
    } else {
      this.behavior = 'wander';
    }
  }
  
  takeDamage(amount: number) {
    this.health -= amount;
    
    // Flash effect
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Mark sprite as inactive immediately to prevent further updates
    if (this.sprite) {
      this.sprite.active = false;
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.enable = false;
        body.setVelocity(0, 0);
      }
    }
    
    // Death effects
    // Flash red
    this.sprite.setTint(0xff0000);
    
    // Create death particles effect
    const deathX = this.sprite.x;
    const deathY = this.sprite.y;
    
    // Create small particle explosions
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(
        deathX + Phaser.Math.Between(-10, 10),
        deathY + Phaser.Math.Between(-10, 10),
        3,
        this.color
      );
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-30, 30),
        y: particle.y + Phaser.Math.Between(-30, 30),
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    // Death animation
    this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: this.sprite.scale, to: 1.2 },
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          scale: 0,
          alpha: 0,
          angle: 360,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            if (this.sprite) {
              this.sprite.destroy();
            }
            if (this.levelText) {
              this.levelText.destroy();
            }
          }
        });
      }
    });
  }
  
  getLevel(): number {
    return this.level;
  }
}