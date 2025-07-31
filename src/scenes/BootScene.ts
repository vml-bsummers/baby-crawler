import Phaser from 'phaser';
import { DEV_CONFIG } from '../utils/DevConfig';
import { ItemRegistry } from '../utils/ItemRegistry';

export class BootScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text;

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
    });

    // Load all assets
    this.load.image('loader', '/images/ui/baby_crawler_loader.png');
    this.load.image('logo', '/images/ui/baby_crawler_logo.png');
    this.load.spritesheet('baby', '/images/sprites/baby_sheet.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('ghost', '/images/sprites/ghost_sheet.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('slime', '/images/sprites/slime_sheet.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.image('bottle', '/images/items/bottle.png');
    this.load.image('diaper', '/images/ui/diaper.png');
    this.load.image('teddy-item', '/images/items/teddy.png');
    this.load.spritesheet('teddy', '/images/sprites/teddy_sheet.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    // Initialize the item registry
    ItemRegistry.initialize();
    
    // Create animations for the baby
    this.createAnimations();
    
    // Check if we should skip the start screen
    // Check if we should skip the start screen (e.g., after settings restart)
    const skipStartScreen = this.game.registry.get('skipStartScreen');
    if (skipStartScreen) {
      // Clear the flag
      this.game.registry.set('skipStartScreen', false);
      // Skip directly to the game
      this.startGame();
    } else if (DEV_CONFIG.SKIP_START) {
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
    // Step 1: Fade loading image to black
    this.cameras.main.fadeOut(800, 0, 0, 0);
    
    // Step 2: After fade out, start game scenes but keep them hidden
    this.time.delayedCall(800, () => {
      // Start the game scene but keep it hidden initially
      this.scene.start('GameScene');
      this.scene.start('UIScene');
      this.scene.start('SettingsScene');
      
      // Wait a frame for scenes to initialize, then fade them out
      this.time.delayedCall(50, () => {
        const gameScene = this.scene.get('GameScene') as Phaser.Scene;
        if (gameScene && gameScene.cameras && gameScene.cameras.main) {
          gameScene.cameras.main.fadeOut(0, 0, 0, 0);
        }
        
        const uiScene = this.scene.get('UIScene') as Phaser.Scene;
        if (uiScene && uiScene.cameras && uiScene.cameras.main) {
          uiScene.cameras.main.fadeOut(0, 0, 0, 0);
        }
      });
      
      // Step 3: Animate logo and keyboard shortcuts rising and fading in
      const logoElement = document.getElementById('game-logo');
      const keyboardElement = document.getElementById('keyboard-shortcuts');
      
      if (logoElement) {
        // Set initial position below the game area
        logoElement.style.transform = 'translateY(100px)';
        logoElement.style.transition = 'none';
        logoElement.classList.add('ready');
        
        // Start the rise and fade in animation
        setTimeout(() => {
          logoElement.style.transition = 'opacity 1.2s ease-in-out, transform 1.2s ease-out';
          logoElement.style.transform = 'translateY(0)';
          logoElement.classList.add('visible');
        }, 100);
      }
      
      if (keyboardElement) {
        // Set initial position above the game area (hidden behind)
        keyboardElement.style.transform = 'translateY(-150px)';
        keyboardElement.style.transition = 'none';
        keyboardElement.classList.add('ready');
        
        // Start the downward slide and fade in animation with slight delay after logo
        setTimeout(() => {
          keyboardElement.style.transition = 'opacity 1.2s ease-in-out, transform 1.2s ease-out';
          keyboardElement.style.transform = 'translateY(0)';
          keyboardElement.classList.add('visible');
        }, 400);
      }
      
      // Step 4: After logo animation, fade in the game
      this.time.delayedCall(1500, () => {
        // Fade in both game scenes
        const gameScene = this.scene.get('GameScene') as Phaser.Scene;
        if (gameScene && gameScene.cameras && gameScene.cameras.main) {
          gameScene.cameras.main.fadeIn(800, 0, 0, 0);
        }
        const uiScene = this.scene.get('UIScene') as Phaser.Scene;
        if (uiScene && uiScene.cameras && uiScene.cameras.main) {
          uiScene.cameras.main.fadeIn(800, 0, 0, 0);
        }
      });
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
    
    // Teddy animations
    this.createTeddyAnimations();
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
  
  private createTeddyAnimations() {
    // Teddy has 8 frames total (4 directions x 2 frames each)
    // Row 1: Down (frames 0-1)
    this.anims.create({
      key: 'teddy-down',
      frames: this.anims.generateFrameNumbers('teddy', { start: 0, end: 1 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Row 2: Up (frames 2-3)
    this.anims.create({
      key: 'teddy-up',
      frames: this.anims.generateFrameNumbers('teddy', { start: 2, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Row 3: Right (frames 4-5)
    this.anims.create({
      key: 'teddy-right',
      frames: this.anims.generateFrameNumbers('teddy', { start: 4, end: 5 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Row 4: Left (frames 6-7)
    this.anims.create({
      key: 'teddy-left',
      frames: this.anims.generateFrameNumbers('teddy', { start: 6, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Idle animation (use first frame of down)
    this.anims.create({
      key: 'teddy-idle',
      frames: [{ key: 'teddy', frame: 0 }],
      frameRate: 1
    });
  }
}