import Phaser from 'phaser';
import { ItemRegistry } from '../utils/ItemRegistry';

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private playerAgeText!: Phaser.GameObjects.Text;
  private areaExploredText!: Phaser.GameObjects.Text;
  private experienceBar!: Phaser.GameObjects.Graphics;
  private experienceText!: Phaser.GameObjects.Text;
  
  // Game stats
  private playerHealth: number = 100;
  private maxHealth: number = 100;
  private playerAge: number = 1; // months old
  private areaExplored: number = 0; // square meters
  private playerExperience: number = 0;
  private experienceToNext: number = 100;
  
  // Inventory UI
  private inventoryDrawer!: Phaser.GameObjects.Container;
  private inventoryBackground!: Phaser.GameObjects.Image;
  private inventoryText!: Phaser.GameObjects.Text;
  private inventoryOpen: boolean = false;
  private inventory: Map<string, number> = new Map();

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Create UI elements
    this.createHealthBar();
    this.createExperienceBar();
    this.createPlayerAge();
    this.createAreaExplored();
    this.createInventoryDrawer();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private createHealthBar() {
    // Background for health display
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.8);
    bg.fillRoundedRect(10, 10, 250, 60, 10);
    
    // Health bar container
    const barBg = this.add.graphics();
    barBg.fillStyle(0x444444, 1);
    barBg.fillRect(20, 40, 200, 20);
    
    // Health bar fill
    this.healthBar = this.add.graphics();
    this.updateHealthBar();
    
    // Health text
    this.healthText = this.add.text(20, 15, `Health: ${this.playerHealth}/${this.maxHealth}`, {
      fontSize: '18px',
      color: '#ff6b6b',
      fontFamily: 'Arial, sans-serif'
    });
  }
  
  private createExperienceBar() {
    // Background for experience display
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.8);
    bg.fillRoundedRect(270, 10, 250, 60, 10);
    
    // Experience bar container
    const barBg = this.add.graphics();
    barBg.fillStyle(0x444444, 1);
    barBg.fillRect(280, 40, 230, 20);
    
    // Experience bar fill
    this.experienceBar = this.add.graphics();
    this.updateExperienceBar();
    
    // Experience text
    this.experienceText = this.add.text(280, 15, `Level ${this.playerAge} - XP: ${this.playerExperience}/${this.experienceToNext}`, {
      fontSize: '16px',
      color: '#333333',
      fontFamily: 'Arial'
    });
  }
  
  private createPlayerAge() {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.8);
    bg.fillRoundedRect(10, 80, 250, 40, 10);
    
    // Age text
    this.playerAgeText = this.add.text(20, 88, `${this.playerAge} month${this.playerAge > 1 ? 's' : ''} old`, {
      fontSize: '20px',
      color: '#a8e6cf',
      fontFamily: 'Arial, sans-serif'
    });
  }
  
  private createAreaExplored() {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.8);
    bg.fillRoundedRect(10, 130, 250, 40, 10);
    
    // Area text
    this.areaExploredText = this.add.text(20, 138, `Explored: ${this.areaExplored} m²`, {
      fontSize: '20px',
      color: '#74b9ff',
      fontFamily: 'Arial, sans-serif'
    });
  }
  
  private updateHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff6b6b, 1);
    const healthPercent = this.playerHealth / this.maxHealth;
    this.healthBar.fillRect(20, 40, 200 * healthPercent, 20);
  }
  
  private updateExperienceBar() {
    this.experienceBar.clear();
    this.experienceBar.fillStyle(0xffff00, 1);
    const xpPercent = this.playerExperience / this.experienceToNext;
    this.experienceBar.fillRect(280, 40, 230 * xpPercent, 20);
  }
  
  updateHealth(health: number, maxHealth: number) {
    this.playerHealth = health;
    this.maxHealth = maxHealth;
    this.healthText.setText(`Health: ${this.playerHealth}/${this.maxHealth}`);
    this.updateHealthBar();
  }
  
  updatePlayerAge(age: number) {
    this.playerAge = age;
    this.playerAgeText.setText(`${this.playerAge} month${this.playerAge > 1 ? 's' : ''} old`);
  }
  
  updateAreaExplored(area: number) {
    this.areaExplored = area;
    this.areaExploredText.setText(`Explored: ${this.areaExplored} m²`);
  }
  
  private createInventoryDrawer() {
    const gameHeight = this.scale.height;
    const drawerHeight = 410;
    const visibleHeight = 40;
    
    // Create container for the drawer
    this.inventoryDrawer = this.add.container(this.scale.width / 2, gameHeight - visibleHeight);
    
    // Add diaper background
    this.inventoryBackground = this.add.image(0, drawerHeight / 2, 'diaper');
    this.inventoryBackground.setScale(0.555, 0.555); // Scale down to better fit drawer size
    this.inventoryBackground.setInteractive();
    
    // Add dark overlay for better text visibility
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRoundedRect(-300, 150, 600, 250, 20);
    
    // Add title
    const title = this.add.text(0, 180, 'Inventory', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    });
    title.setOrigin(0.5);
    
    // Add inventory text
    this.inventoryText = this.add.text(0, 250, 'Empty', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 500 }
    });
    this.inventoryText.setOrigin(0.5);
    
    // Add controls text
    const controls = this.add.text(0, 360, 'Click item to use', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });
    controls.setOrigin(0.5);
    
    // Add all to container
    this.inventoryDrawer.add([this.inventoryBackground, overlay, title, this.inventoryText, controls]);
    
    // Handle clicking on the drawer
    this.inventoryBackground.on('pointerdown', () => {
      this.toggleInventory();
    });
  }
  
  private toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    
    const targetY = this.inventoryOpen ? 
      this.scale.height - 410 : // Fully open
      this.scale.height - 40; // Partially closed
    
    this.tweens.add({
      targets: this.inventoryDrawer,
      y: targetY,
      duration: 300,
      ease: 'Power2'
    });
  }
  
  private inventoryItemContainers: Phaser.GameObjects.Container[] = [];
  
  private updateInventoryDisplay() {
    // Clear existing inventory items
    this.inventoryItemContainers.forEach(container => container.destroy());
    this.inventoryItemContainers = [];
    this.inventoryText.setText('');
    
    if (this.inventory.size === 0) {
      this.inventoryText.setText('Empty');
    } else {
      // Grid layout configuration
      const itemSize = 64; // Increased from 48
      const padding = 20; // Increased from 10
      const itemsPerRow = 6; // Reduced from 8 to fit
      const startX = -((itemsPerRow * (itemSize + padding)) / 2) + itemSize / 2;
      const startY = 220;
      
      let index = 0;
      this.inventory.forEach((count, itemId) => {
        if (count > 0) {
          const itemDef = ItemRegistry.getItem(itemId);
          if (!itemDef) return;
          
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const x = startX + col * (itemSize + padding);
          const y = startY + row * (itemSize + padding);
          
          // Create container for item
          const itemContainer = this.add.container(x, y);
          
          // Background for item slot
          const slotBg = this.add.graphics();
          slotBg.fillStyle(0x333333, 1);
          slotBg.fillRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 8);
          itemContainer.add(slotBg);
          
          // Item image
          const itemImage = this.add.image(0, 0, itemDef.imageKey);
          itemImage.setScale(1.5); // Scale up 2x from 0.75
          itemContainer.add(itemImage);
          
          // Count badge
          if (count > 1) {
            const countBg = this.add.graphics();
            countBg.fillStyle(0x000000, 0.8);
            countBg.fillCircle(itemSize/2 - 10, itemSize/2 - 10, 12);
            itemContainer.add(countBg);
            
            const countText = this.add.text(itemSize/2 - 10, itemSize/2 - 10, count.toString(), {
              fontSize: '14px',
              color: '#ffffff',
              fontFamily: 'Arial'
            });
            countText.setOrigin(0.5);
            itemContainer.add(countText);
          }
          
          // Make interactive
          itemContainer.setSize(itemSize, itemSize);
          itemContainer.setInteractive();
          
          // Hover effects
          itemContainer.on('pointerover', () => {
            slotBg.clear();
            slotBg.fillStyle(0x555555, 1);
            slotBg.fillRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 8);
            
            // TODO: Show tooltip with item description
          });
          
          itemContainer.on('pointerout', () => {
            slotBg.clear();
            slotBg.fillStyle(0x333333, 1);
            slotBg.fillRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 8);
          });
          
          itemContainer.on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene') as any;
            if (gameScene && gameScene.player) {
              gameScene.player.useItem(itemId);
            }
          });
          
          this.inventoryDrawer.add(itemContainer);
          this.inventoryItemContainers.push(itemContainer);
          index++;
        }
      });
    }
  }

  private setupEventListeners() {
    // Listen for health updates
    this.game.events.on('health-update', (health: number, maxHealth: number) => {
      this.updateHealth(health, maxHealth);
    });
    
    // Listen for player age updates
    this.game.events.on('age-update', (age: number) => {
      this.updatePlayerAge(age);
    });
    
    // Listen for area explored updates
    this.game.events.on('area-update', (area: number) => {
      this.updateAreaExplored(area);
    });
    
    // Listen for inventory updates
    this.game.events.on('inventory-update', (inventory: Map<string, number>) => {
      this.inventory = new Map(inventory);
      this.updateInventoryDisplay();
    });
    
    // Listen for inventory toggle
    this.game.events.on('toggle-inventory', () => {
      this.toggleInventory();
    });
    
    // Listen for experience updates
    this.game.events.on('experience-update', (experience: number, toNext: number, level: number) => {
      this.updateExperience(experience, toNext, level);
    });
    
    // Listen for level up
    this.game.events.on('level-up', (level: number) => {
      this.showLevelUpNotification(level);
    });
    
    // Listen for close inventory event
    this.game.events.on('close-inventory', () => {
      if (this.inventoryOpen) {
        this.toggleInventory();
      }
    });
  }
  
  update() {
    // Check for inventory key press in GameScene instead
  }
  
  private updateExperience(experience: number, toNext: number, level: number) {
    this.playerExperience = experience;
    this.experienceToNext = toNext;
    this.experienceText.setText(`Level ${level} - XP: ${experience}/${toNext}`);
    this.updateExperienceBar();
  }
  
  private showLevelUpNotification(level: number) {
    // Create level up notification
    const notification = this.add.container(this.scale.width / 2, 150);
    
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-150, -30, 300, 60, 15);
    notification.add(bg);
    
    // Text
    const text = this.add.text(0, 0, `LEVEL UP! Now Level ${level}`, {
      fontSize: '28px',
      color: '#ffff00',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    notification.add(text);
    
    // Animation
    notification.setScale(0);
    this.tweens.add({
      targets: notification,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: notification,
            scale: 0,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => notification.destroy()
          });
        });
      }
    });
  }

}