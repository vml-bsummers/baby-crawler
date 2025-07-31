import { Monster } from '../Monster';
import { COLORS, GAME_CONFIG } from '../../utils/Constants';

export class BabySlime extends Monster {
  private bouncePhase: number = 0;
  private slimeSprite!: Phaser.GameObjects.Sprite;
  private currentDirection: 'left' | 'right' = 'right';
  
  constructor(scene: Phaser.Scene, x: number, y: number, playerExploredArea: number = 0) {
    super(scene, x, y, COLORS.monsters.slime, 30, playerExploredArea);
    this.behavior = 'wander';
  }
  
  createSprite() {
    // Store the physics body from the circle sprite
    const oldBody = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Remove the default circle sprite
    if (this.sprite) {
      this.sprite.destroy();
    }
    
    // Create slime sprite
    this.slimeSprite = this.scene.add.sprite(this.x, this.y, 'slime');
    this.slimeSprite.setScale(0.5); // Scale down to 32x32
    this.slimeSprite.play('slime-idle');
    
    // Replace the sprite reference
    this.sprite = this.slimeSprite as any;
    
    // Add physics to new sprite
    if (oldBody) {
      const oldVelocity = { x: oldBody.velocity.x, y: oldBody.velocity.y };
      
      this.scene.physics.add.existing(this.sprite);
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setSize(28, 24);
        body.setOffset(18, 20);
        body.setCollideWorldBounds(false);
        body.setVelocity(oldVelocity.x, oldVelocity.y);
      }
    }
    
    // Continuous jiggle effect
    this.scene.tweens.add({
      targets: this.slimeSprite,
      scaleX: 0.55,
      scaleY: 0.45,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  update(delta: number, playerX: number, playerY: number) {
    super.update(delta, playerX, playerY);
    
    // Update animation based on movement direction
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body && body.velocity && this.slimeSprite) {
      if (Math.abs(body.velocity.x) > Math.abs(body.velocity.y)) {
        // Moving horizontally
        if (body.velocity.x > 0) {
          this.currentDirection = 'right';
          this.slimeSprite.play('slime-right', true);
        } else if (body.velocity.x < 0) {
          this.currentDirection = 'left';
          this.slimeSprite.play('slime-left', true);
        }
      } else if (body.velocity.x === 0 && body.velocity.y === 0) {
        // Idle
        this.slimeSprite.play('slime-idle', true);
      } else {
        // Moving vertically - use current direction
        this.slimeSprite.play(`slime-${this.currentDirection}`, true);
      }
    }
  }
  
  makeSound() {
    console.log('Baby Slime: *squish squish*');
  }
  
  die() {
    // Override to handle sprite-specific death
    this.scene.tweens.add({
      targets: this.slimeSprite,
      scale: 0,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.slimeSprite.destroy();
        if (this.levelText) {
          this.levelText.destroy();
        }
      }
    });
  }
}