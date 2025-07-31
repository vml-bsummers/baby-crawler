import Phaser from 'phaser';
import { DEV_CONFIG } from '../utils/DevConfig';

export class BootScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text;
  private isLoading: boolean = true;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(this.scale.width / 2 - 100, this.scale.height / 2 - 15, 200, 30);
    
    const loadingText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 40,
      'Loading assets...',
      {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    );
    loadingText.setOrigin(0.5);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x74b9ff, 1);
      progressBar.fillRect(this.scale.width / 2 - 95, this.scale.height / 2 - 10, 190 * value, 20);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      this.isLoading = false;
    });

    // Load all assets
    this.load.image('loader', '/images/baby_crawler_loader.png');
    this.load.image('logo', '/images/baby_crawler_logo.png');
    this.load.spritesheet('baby', '/images/baby_sprite.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('ghost', '/images/ghost_sprite.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('slime', '/images/slime_sheet.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    // Create animations for the baby
    this.createAnimations();
    
    // Check if we should skip the start screen
    if (DEV_CONFIG.SKIP_START) {
      // Skip directly to the game
      this.startGame();
    } else {
      // Show start screen
      this.showStartScreen();
    }
  }

  private showStartScreen() {
    // Display the loader image to fill the entire game area
    const loader = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      'loader'
    );
    
    // Scale to fit height first, then width if possible
    const scaleX = this.scale.width / loader.width;
    const scaleY = this.scale.height / loader.height;
    // Use min to ensure the entire image height is visible
    const scale = Math.min(scaleX, scaleY);
    loader.setScale(scale);
    
    // Create a container for the button so we can scale it from center
    const buttonContainer = this.add.container(this.scale.width / 2, this.scale.height - 115);
    
    // Create start button with semi-transparent black background for visibility
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x000000, 0.8);
    buttonBg.fillRoundedRect(-120, -35, 240, 70, 15);
    buttonContainer.add(buttonBg);
    
    // Add colored inner button
    const innerButton = this.add.graphics();
    innerButton.fillStyle(0x74b9ff, 1);
    innerButton.fillRoundedRect(-115, -30, 230, 60, 12);
    buttonContainer.add(innerButton);
    
    this.startButton = this.add.text(
      0,
      0,
      'START GAME',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    this.startButton.setOrigin(0.5);
    buttonContainer.add(this.startButton);
    
    // Make button interactive
    buttonContainer.setInteractive(
      new Phaser.Geom.Rectangle(-115, -30, 230, 60),
      Phaser.Geom.Rectangle.Contains
    );
    
    // Button hover effects - scale the entire container
    buttonContainer.on('pointerover', () => {
      innerButton.clear();
      innerButton.fillStyle(0x5dade2, 1);
      innerButton.fillRoundedRect(-115, -30, 230, 60, 12);
      buttonContainer.setScale(1.1);
    });
    
    buttonContainer.on('pointerout', () => {
      innerButton.clear();
      innerButton.fillStyle(0x74b9ff, 1);
      innerButton.fillRoundedRect(-115, -30, 230, 60, 12);
      buttonContainer.setScale(1);
    });
    
    // Button click
    buttonContainer.on('pointerdown', () => {
      this.startGame();
    });
  }

  private startGame() {
    // Fade out before starting game
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.time.delayedCall(500, () => {
      // Start the game scene
      this.scene.start('GameScene');
      this.scene.start('UIScene');
      
      // Fade in the logo
      const logoElement = document.getElementById('game-logo');
      if (logoElement) {
        // Add ready class first to enable transition
        logoElement.classList.add('ready');
        // Use setTimeout to ensure the transition is applied
        setTimeout(() => {
          logoElement.classList.add('visible');
        }, 50);
      }
    });
  }

  private createAnimations() {
    // Row 1: Down movement (swapped)
    this.anims.create({
      key: 'baby-down',
      frames: this.anims.generateFrameNumbers('baby', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // Row 2: Up movement (swapped)
    this.anims.create({
      key: 'baby-up',
      frames: this.anims.generateFrameNumbers('baby', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    // Row 3: Left movement
    this.anims.create({
      key: 'baby-left',
      frames: this.anims.generateFrameNumbers('baby', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    // Row 4: Right movement
    this.anims.create({
      key: 'baby-right',
      frames: this.anims.generateFrameNumbers('baby', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    // Idle animation (using first frame of down)
    this.anims.create({
      key: 'baby-idle',
      frames: [{ key: 'baby', frame: 0 }],  // Updated to match swapped down animation
      frameRate: 1
    });
    
    // Ghost animations
    this.createGhostAnimations();
    
    // Slime animations
    this.createSlimeAnimations();
  }
  
  private createGhostAnimations() {
    // Ghost moving right (frames 0-2)
    this.anims.create({
      key: 'ghost-right',
      frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 2 }),
      frameRate: 6,
      repeat: -1
    });
    
    // Ghost moving left (frames 3-5)
    this.anims.create({
      key: 'ghost-left',
      frames: this.anims.generateFrameNumbers('ghost', { start: 3, end: 5 }),
      frameRate: 6,
      repeat: -1
    });
    
    // Ghost idle (use first frame of right)
    this.anims.create({
      key: 'ghost-idle',
      frames: [{ key: 'ghost', frame: 0 }],
      frameRate: 1
    });
  }
  
  private createSlimeAnimations() {
    // Slime moving right (frames 0-2)
    this.anims.create({
      key: 'slime-right',
      frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 2 }),
      frameRate: 4,
      repeat: -1
    });
    
    // Slime moving left (frames 3-5)
    this.anims.create({
      key: 'slime-left',
      frames: this.anims.generateFrameNumbers('slime', { start: 3, end: 5 }),
      frameRate: 4,
      repeat: -1
    });
    
    // Slime idle (use first frame of right)
    this.anims.create({
      key: 'slime-idle',
      frames: [{ key: 'slime', frame: 0 }],
      frameRate: 1
    });
  }
}