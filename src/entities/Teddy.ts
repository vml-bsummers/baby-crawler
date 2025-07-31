import Phaser from 'phaser';

export class Teddy {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  collected: boolean = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    // Create teddy sprite
    this.sprite = scene.add.sprite(x, y, 'teddy');
    this.sprite.setScale(0.75); // 48x48 size
    
    // Add physics
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 40);
    body.setOffset(12, 12);
    body.setImmovable(true);
    
    // Add slight floating animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add gentle rotation
    scene.tweens.add({
      targets: this.sprite,
      angle: -5,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add pink tint for cuteness
    this.sprite.setTint(0xffdddd);
  }
  
  update() {
    // No update needed for static item
  }
  
  collect() {
    if (this.collected) return;
    
    this.collected = true;
    
    // Collection animation
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.2,
      alpha: 0,
      y: this.sprite.y - 20,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.sprite.destroy();
      }
    });
    
    // Stop physics
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }
}