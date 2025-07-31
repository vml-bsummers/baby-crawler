import { Monster } from '../Monster';
import { COLORS, GAME_CONFIG } from '../../utils/Constants';

export class BabyDragon extends Monster {
  private hiccupTimer: number = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, COLORS.monsters.dragon, 40);
    this.behavior = 'wander';
  }
  
  createSprite() {
    // Create a more dragon-like shape
    this.sprite.destroy();
    
    // Body (ellipse-ish)
    this.sprite = this.scene.add.ellipse(
      this.x, 
      this.y, 
      GAME_CONFIG.tileSize - 8, 
      GAME_CONFIG.tileSize - 10, 
      this.color
    );
    
    // Add cute features
    this.sprite.setStrokeStyle(2, 0x000000, 0.3);
    
    // Add wobble animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  update(delta: number, playerX: number, playerY: number) {
    super.update(delta, playerX, playerY);
    
    // Hiccup flames occasionally
    this.hiccupTimer += delta;
    if (this.hiccupTimer > 3000) {
      this.hiccupTimer = 0;
      this.hiccupFlame();
    }
  }
  
  private hiccupFlame() {
    // Create a small flame particle
    const flame = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y - 10,
      4,
      0xffa500
    );
    
    // Animate the flame
    this.scene.tweens.add({
      targets: flame,
      y: flame.y - 20,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      onComplete: () => flame.destroy()
    });
    
    this.makeSound();
  }
  
  makeSound() {
    // Placeholder for hiccup sound
    console.log('Baby Dragon: *hiccup*');
  }
}