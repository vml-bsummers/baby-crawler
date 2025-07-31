import { Monster } from '../Monster';
import { COLORS, GAME_CONFIG } from '../../utils/Constants';

export class BabySpider extends Monster {
  private legPhase: number = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, COLORS.monsters.spider, 60);
    this.behavior = 'follow';
  }
  
  createSprite() {
    this.sprite.destroy();
    
    // Fuzzy spider body
    this.sprite = this.scene.add.circle(
      this.x,
      this.y,
      GAME_CONFIG.tileSize / 2 - 7,
      this.color
    );
    
    this.sprite.setStrokeStyle(3, 0x000000, 0.3);
    
    // Quick scuttle animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Linear'
    });
  }
  
  update(delta: number, playerX: number, playerY: number) {
    super.update(delta, playerX, playerY);
    
    // Scuttling leg movement effect
    this.legPhase += delta * 0.01;
    const wiggle = Math.sin(this.legPhase) * 2;
    this.sprite.rotation = wiggle * 0.1;
  }
  
  makeSound() {
    console.log('Baby Spider: *tickle tickle*');
  }
}