import Phaser from 'phaser';
import { Monster } from './Monster';

export class FriendlyTeddy {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  speed: number = 200; // Fast teddy!
  currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  target: Monster | null = null;
  lifespan: number = 15000; // 15 seconds
  spawnTime: number;
  private attackCooldown: number = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.spawnTime = scene.time.now;
    
    // Create teddy sprite
    this.sprite = scene.add.sprite(x, y, 'teddy');
    this.sprite.setScale(0.5); // Scale down to 32x32
    this.sprite.play('teddy-idle');
    
    // Add physics
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);
    body.setOffset(20, 20);
    
    // Add spawn animation
    this.sprite.setAlpha(0);
    scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scale: { from: 0.3, to: 0.5 },
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Add glow effect
    this.sprite.setTint(0xffdddd);
  }
  
  update(delta: number, monsters: Monster[]) {
    // Check if teddy should despawn
    if (this.scene.time.now - this.spawnTime > this.lifespan) {
      this.runOff();
      return;
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    
    // Always try to find a target, even if we just killed one
    this.findTarget(monsters);
    
    if (this.target && this.target.sprite && this.target.sprite.active && this.attackCooldown <= 0) {
      // Move towards target
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 20) {  // Increased from 5 to avoid overshooting
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const vx = (dx / distance) * this.speed;
        const vy = (dy / distance) * this.speed;
        body.setVelocity(vx, vy);
        
        // Update animation based on direction
        if (Math.abs(vx) > Math.abs(vy)) {
          if (vx > 0) {
            this.currentDirection = 'right';
            this.sprite.play('teddy-right', true);
          } else {
            this.currentDirection = 'left';
            this.sprite.play('teddy-left', true);
          }
        } else {
          if (vy > 0) {
            this.currentDirection = 'down';
            this.sprite.play('teddy-down', true);
          } else {
            this.currentDirection = 'up';
            this.sprite.play('teddy-up', true);
          }
        }
      } else {
        // Close enough to attack
        this.attackMonster();
      }
    } else {
      // No target, stop moving
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.sprite.play('teddy-idle', true);
    }
    
    // Update position
    this.x = this.sprite.x;
    this.y = this.sprite.y;
  }
  
  private findTarget(monsters: Monster[]) {
    let closestMonster: Monster | null = null;
    let closestDistance = Infinity;
    
    monsters.forEach(monster => {
      // Extra safety checks
      if (monster && monster.sprite && monster.sprite.active) {
        const dx = monster.x - this.x;
        const dy = monster.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < closestDistance && distance < 500) { // Also limit search radius
          closestDistance = distance;
          closestMonster = monster;
        }
      }
    });
    
    this.target = closestMonster;
  }
  
  private attackMonster() {
    if (this.target && this.attackCooldown <= 0) {
      try {
        // Extra safety check
        if (!this.target.sprite || !this.target.sprite.active) {
          this.target = null;
          return;
        }
        
        // Instantly kill the monster
        this.target.takeDamage(999);
        
        // Attack effect
        this.scene.tweens.add({
          targets: this.sprite,
          scale: 0.6,
          duration: 100,
          yoyo: true,
          ease: 'Power2'
        });
        
        // Set cooldown to prevent rapid attacks
        this.attackCooldown = 200; // 200ms cooldown
        
        // Clear target so we find a new one
        this.target = null;
      } catch (error) {
        console.error('Error in teddy attack:', error);
        this.target = null;
        this.attackCooldown = 200;
      }
    }
  }
  
  private runOff() {
    // Pick a random direction to run off screen
    const angle = Math.random() * Math.PI * 2;
    const speed = 300;
    
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    
    // Fade out
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  destroy() {
    this.sprite.destroy();
  }
}