import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private playerAgeText!: Phaser.GameObjects.Text;
  private areaExploredText!: Phaser.GameObjects.Text;
  
  // Game stats
  private playerHealth: number = 100;
  private maxHealth: number = 100;
  private playerAge: number = 1; // months old
  private areaExplored: number = 0; // square meters

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Create UI elements
    this.createHealthBar();
    this.createPlayerAge();
    this.createAreaExplored();
    
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
  }

}