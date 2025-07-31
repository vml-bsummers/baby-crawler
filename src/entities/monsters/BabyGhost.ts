import { Monster } from '../Monster';
import { COLORS } from '../../utils/Constants';

export class BabyGhost extends Monster {
  private floatPhase: number = 0;
  private ghostSprite!: Phaser.GameObjects.Sprite;
  private currentDirection: 'left' | 'right' = 'right';
  
  constructor(scene: Phaser.Scene, x: number, y: number, playerExploredArea: number = 0) {
    super(scene, x, y, COLORS.monsters.ghost, 25, playerExploredArea);
    this.behavior = 'flee';
  }
  
  createSprite() {
    // Store the physics body from the circle sprite
    const oldBody = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Remove the default circle sprite but keep physics reference
    this.sprite.destroy();
    
    // Create ghost sprite
    this.ghostSprite = this.scene.add.sprite(this.x, this.y, 'ghost');
    this.ghostSprite.setScale(0.5); // Scale down to 32x32
    this.ghostSprite.play('ghost-idle');
    this.ghostSprite.setAlpha(0.7);
    
    // Replace the sprite reference
    this.sprite = this.ghostSprite as any;
    
    // The base class already added physics to the original sprite,
    // so we don't need to add it again, just update the body reference
    if (oldBody) {
      // Copy velocity from old body if it exists
      const oldVelocity = { x: oldBody.velocity.x, y: oldBody.velocity.y };
      
      // Add physics to new sprite
      this.scene.physics.add.existing(this.sprite);
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setSize(24, 24);
        body.setOffset(20, 20);
        body.setCollideWorldBounds(false);
        body.setVelocity(oldVelocity.x, oldVelocity.y);
      }
    }
    
    // Floating animation
    this.scene.tweens.add({
      targets: this.ghostSprite,
      y: this.y - 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  update(delta: number, playerX: number, playerY: number) {
    super.update(delta, playerX, playerY);
    
    // Additional floating effect
    this.floatPhase += delta * 0.003;
    if (this.ghostSprite) {
      this.ghostSprite.setAlpha(0.6 + Math.sin(this.floatPhase) * 0.2);
    }
    
    // Update animation based on movement direction
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body && body.velocity && this.ghostSprite) {
      if (Math.abs(body.velocity.x) > Math.abs(body.velocity.y)) {
        // Moving horizontally
        if (body.velocity.x > 0) {
          this.currentDirection = 'right';
          this.ghostSprite.play('ghost-right', true);
        } else if (body.velocity.x < 0) {
          this.currentDirection = 'left';
          this.ghostSprite.play('ghost-left', true);
        }
      } else if (body.velocity.x === 0 && body.velocity.y === 0) {
        // Idle
        this.ghostSprite.play('ghost-idle', true);
      } else {
        // Moving vertically - use current direction
        this.ghostSprite.play(`ghost-${this.currentDirection}`, true);
      }
    }
  }
  
  makeSound() {
    console.log('Baby Ghost: *boo-boo*');
  }
  
  die() {
    // Mark sprite as inactive immediately
    if (this.sprite) {
      this.sprite.active = false;
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.enable = false;
      }
    }
    
    // Override to handle sprite-specific death
    this.scene.tweens.add({
      targets: this.ghostSprite,
      scale: 0,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        if (this.ghostSprite) {
          this.ghostSprite.destroy();
        }
        if (this.levelText) {
          this.levelText.destroy();
        }
      }
    });
  }
}