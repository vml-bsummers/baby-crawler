import Phaser from 'phaser';

export class Bottle {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // Create bottle sprite
    this.sprite = scene.add.sprite(x, y, 'bottle');
    this.sprite.setScale(0.5); // Scale down to 32x32 from 64x64
    
    // Add slight floating animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add subtle rotation
    scene.tweens.add({
      targets: this.sprite,
      angle: -5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  collect() {
    if (this.collected) return;
    
    this.collected = true;
    
    // Collection animation
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 0.8,
      alpha: 0,
      y: this.y - 20,
      duration: 300,
      onComplete: () => {
        this.sprite.destroy();
      }
    });
  }

  update() {
    // Update position if needed
    this.x = this.sprite.x;
    this.y = this.sprite.y;
  }
}