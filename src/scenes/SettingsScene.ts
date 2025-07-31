import Phaser from 'phaser';
import { DEV_CONFIG } from '../utils/DevConfig';

export class SettingsScene extends Phaser.Scene {
  private isOpen: boolean = false;
  private container!: Phaser.GameObjects.Container;
  private inputElements: Map<string, HTMLInputElement> = new Map();
  private tildeKey!: Phaser.Input.Keyboard.Key;
  private backtickKey!: Phaser.Input.Keyboard.Key;
  
  constructor() {
    super({ key: 'SettingsScene' });
  }
  
  create() {
    console.log('SettingsScene created');
    
    // Set up tilde/backtick keys (keycode 192 is the ` / ~ key)
    this.tildeKey = this.input.keyboard!.addKey(192);
    this.backtickKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
    
    // Create container for settings panel
    this.container = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.container.setVisible(false);
    this.container.setDepth(10000);
    
    // Create panel background
    const panelWidth = 600;
    const panelHeight = 600;
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.95);
    bg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
    bg.lineStyle(2, 0x00ff00);
    bg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
    this.container.add(bg);
    
    // Title
    const title = this.add.text(0, -panelHeight/2 + 20, 'SECRET DEV SETTINGS', {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);
    
    // Create scrollable content area
    const contentY = -panelHeight/2 + 60;
    const inputSpacing = 35;
    let currentY = contentY;
    
    // Monster spawn settings
    this.createSectionTitle('SPAWN RATES', currentY);
    currentY += 30;
    
    currentY = this.createNumberInput('Monster Spawn Chance', 'MONSTER_SPAWN_CHANCE', 
      DEV_CONFIG.SPAWN_RATES.MONSTER_SPAWN_CHANCE, 0, 1, 0.01, currentY);
    
    currentY = this.createNumberInput('Max Monsters', 'MAX_MONSTERS', 
      DEV_CONFIG.SPAWN_RATES.MAX_MONSTERS, 0, 100, 1, currentY);
    
    currentY = this.createRangeInput('Monsters Per Chunk', 'MONSTERS_PER_CHUNK_MIN', 'MONSTERS_PER_CHUNK_MAX',
      DEV_CONFIG.SPAWN_RATES.MONSTERS_PER_CHUNK.min, DEV_CONFIG.SPAWN_RATES.MONSTERS_PER_CHUNK.max, 0, 20, currentY);
    
    // Bottle spawn settings
    currentY += 10;
    currentY = this.createNumberInput('Bottle Spawn Chance', 'BOTTLE_SPAWN_CHANCE', 
      DEV_CONFIG.SPAWN_RATES.BOTTLE_SPAWN_CHANCE, 0, 1, 0.01, currentY);
    
    currentY = this.createNumberInput('Max Bottles', 'MAX_BOTTLES', 
      DEV_CONFIG.SPAWN_RATES.MAX_BOTTLES, 0, 50, 1, currentY);
    
    currentY = this.createRangeInput('Bottles Per Chunk', 'BOTTLES_PER_CHUNK_MIN', 'BOTTLES_PER_CHUNK_MAX',
      DEV_CONFIG.SPAWN_RATES.BOTTLES_PER_CHUNK.min, DEV_CONFIG.SPAWN_RATES.BOTTLES_PER_CHUNK.max, 0, 10, currentY);
    
    // Teddy spawn settings
    currentY += 10;
    currentY = this.createNumberInput('Teddy Spawn Chance', 'TEDDY_SPAWN_CHANCE', 
      DEV_CONFIG.SPAWN_RATES.TEDDY_SPAWN_CHANCE, 0, 1, 0.01, currentY);
    
    currentY = this.createNumberInput('Max Teddies', 'MAX_TEDDIES', 
      DEV_CONFIG.SPAWN_RATES.MAX_TEDDIES, 0, 20, 1, currentY);
    
    currentY = this.createRangeInput('Teddies Per Chunk', 'TEDDIES_PER_CHUNK_MIN', 'TEDDIES_PER_CHUNK_MAX',
      DEV_CONFIG.SPAWN_RATES.TEDDIES_PER_CHUNK.min, DEV_CONFIG.SPAWN_RATES.TEDDIES_PER_CHUNK.max, 0, 5, currentY);
    
    // Starting inventory
    currentY += 20;
    this.createSectionTitle('STARTING INVENTORY', currentY);
    currentY += 30;
    
    currentY = this.createNumberInput('Starting Bottles', 'START_BOTTLES', 
      DEV_CONFIG.START_INVENTORY.bottle || 0, 0, 99, 1, currentY);
    
    currentY = this.createNumberInput('Starting Teddies', 'START_TEDDIES', 
      DEV_CONFIG.START_INVENTORY.teddy || 0, 0, 99, 1, currentY);
    
    // Buttons
    const buttonY = panelHeight/2 - 40;
    
    // Save & Restart button
    const saveBtn = this.add.text(-80, buttonY, 'SAVE & RESTART', {
      fontSize: '18px',
      color: '#00ff00',
      fontFamily: 'monospace',
      backgroundColor: '#003300',
      padding: { x: 10, y: 5 }
    });
    saveBtn.setOrigin(0.5);
    saveBtn.setInteractive({ useHandCursor: true });
    saveBtn.on('pointerover', () => saveBtn.setColor('#00ffff'));
    saveBtn.on('pointerout', () => saveBtn.setColor('#00ff00'));
    saveBtn.on('pointerdown', () => this.saveAndRestart());
    this.container.add(saveBtn);
    
    // Cancel button
    const cancelBtn = this.add.text(80, buttonY, 'CANCEL', {
      fontSize: '18px',
      color: '#ff0000',
      fontFamily: 'monospace',
      backgroundColor: '#330000',
      padding: { x: 10, y: 5 }
    });
    cancelBtn.setOrigin(0.5);
    cancelBtn.setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerover', () => cancelBtn.setColor('#ffff00'));
    cancelBtn.on('pointerout', () => cancelBtn.setColor('#ff0000'));
    cancelBtn.on('pointerdown', () => this.close());
    this.container.add(cancelBtn);
    
    // Instructions
    const instructions = this.add.text(0, -panelHeight/2 + 40, 'Press ~ to toggle', {
      fontSize: '12px',
      color: '#666666',
      fontFamily: 'monospace'
    });
    instructions.setOrigin(0.5, 0);
    this.container.add(instructions);
  }
  
  private createSectionTitle(title: string, y: number): void {
    const text = this.add.text(-250, y, title, {
      fontSize: '16px',
      color: '#ffff00',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    });
    this.container.add(text);
  }
  
  private createNumberInput(label: string, key: string, value: number, min: number, max: number, step: number, y: number): number {
    // Label
    const labelText = this.add.text(-250, y, label + ':', {
      fontSize: '14px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    this.container.add(labelText);
    
    // Add a placeholder text to show where the input will be
    const placeholderText = this.add.text(50, y, value.toString(), {
      fontSize: '14px',
      color: '#005500',
      fontFamily: 'monospace'
    });
    this.container.add(placeholderText);
    
    // Create HTML input
    const input = document.createElement('input');
    input.type = 'number';
    input.value = value.toString();
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.style.position = 'absolute';
    input.style.width = '80px';
    input.style.backgroundColor = '#001100';
    input.style.color = '#00ff00';
    input.style.border = '1px solid #00ff00';
    input.style.fontFamily = 'monospace';
    input.style.fontSize = '14px';
    input.style.padding = '2px 5px';
    input.style.display = 'none';
    input.style.zIndex = '10001';
    
    document.body.appendChild(input);
    this.inputElements.set(key, input);
    
    // Position will be updated when panel opens
    
    return y + 35;
  }
  
  private createRangeInput(label: string, minKey: string, maxKey: string, minValue: number, maxValue: number, min: number, max: number, y: number): number {
    // Label
    const labelText = this.add.text(-250, y, label + ':', {
      fontSize: '14px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    this.container.add(labelText);
    
    // Add placeholder texts for the range
    const minPlaceholder = this.add.text(50, y, minValue.toString(), {
      fontSize: '14px',
      color: '#005500',
      fontFamily: 'monospace'
    });
    this.container.add(minPlaceholder);
    
    const maxPlaceholder = this.add.text(130, y, maxValue.toString(), {
      fontSize: '14px',
      color: '#005500',
      fontFamily: 'monospace'
    });
    this.container.add(maxPlaceholder);
    
    // Min input
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.value = minValue.toString();
    minInput.min = min.toString();
    minInput.max = max.toString();
    minInput.step = '1';
    minInput.style.position = 'absolute';
    minInput.style.width = '50px';
    minInput.style.backgroundColor = '#001100';
    minInput.style.color = '#00ff00';
    minInput.style.border = '1px solid #00ff00';
    minInput.style.fontFamily = 'monospace';
    minInput.style.fontSize = '14px';
    minInput.style.padding = '2px 5px';
    minInput.style.display = 'none';
    minInput.style.zIndex = '10001';
    
    // Max input
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.value = maxValue.toString();
    maxInput.min = min.toString();
    maxInput.max = max.toString();
    maxInput.step = '1';
    maxInput.style.position = 'absolute';
    maxInput.style.width = '50px';
    maxInput.style.backgroundColor = '#001100';
    maxInput.style.color = '#00ff00';
    maxInput.style.border = '1px solid #00ff00';
    maxInput.style.fontFamily = 'monospace';
    maxInput.style.fontSize = '14px';
    maxInput.style.padding = '2px 5px';
    maxInput.style.display = 'none';
    maxInput.style.zIndex = '10001';
    
    document.body.appendChild(minInput);
    document.body.appendChild(maxInput);
    this.inputElements.set(minKey, minInput);
    this.inputElements.set(maxKey, maxInput);
    
    // Add separator text
    const separator = this.add.text(105, y, '-', {
      fontSize: '14px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    this.container.add(separator);
    
    return y + 35;
  }
  
  update() {
    if (Phaser.Input.Keyboard.JustDown(this.tildeKey) || Phaser.Input.Keyboard.JustDown(this.backtickKey)) {
      this.toggle();
    }
  }
  
  private toggle() {
    console.log('Toggle settings panel');
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  private open() {
    this.isOpen = true;
    this.container.setVisible(true);
    
    // Pause game scenes
    this.scene.pause('GameScene');
    this.scene.pause('UIScene');
    
    // Update input positions and show them
    this.updateInputPositions();
    this.inputElements.forEach(input => {
      input.style.display = 'block';
    });
  }
  
  private close() {
    this.isOpen = false;
    this.container.setVisible(false);
    
    // Resume game scenes
    this.scene.resume('GameScene');
    this.scene.resume('UIScene');
    
    // Hide inputs
    this.inputElements.forEach(input => {
      input.style.display = 'none';
    });
  }
  
  private updateInputPositions() {
    // Get the game canvas position
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const containerX = rect.left + this.scale.width / 2;
    const containerY = rect.top + this.scale.height / 2;
    
    // Update each input position based on its key
    let yOffset = -190;
    
    // Monster spawn inputs
    this.positionInput('MONSTER_SPAWN_CHANCE', containerX + 50, containerY + yOffset);
    yOffset += 33;
    this.positionInput('MAX_MONSTERS', containerX + 50, containerY + yOffset);
    yOffset += 33;
    this.positionInput('MONSTERS_PER_CHUNK_MIN', containerX + 50, containerY + yOffset);
    this.positionInput('MONSTERS_PER_CHUNK_MAX', containerX + 130, containerY + yOffset);
    yOffset += 42;
    
    // Bottle spawn inputs
    this.positionInput('BOTTLE_SPAWN_CHANCE', containerX + 50, containerY + yOffset);
    yOffset += 33;
    this.positionInput('MAX_BOTTLES', containerX + 50, containerY + yOffset);
    yOffset += 33;
    this.positionInput('BOTTLES_PER_CHUNK_MIN', containerX + 50, containerY + yOffset);
    this.positionInput('BOTTLES_PER_CHUNK_MAX', containerX + 130, containerY + yOffset);
    yOffset += 42;
    
    // Teddy spawn inputs
    this.positionInput('TEDDY_SPAWN_CHANCE', containerX + 50, containerY + yOffset);
    yOffset += 33;
    this.positionInput('MAX_TEDDIES', containerX + 50, containerY + yOffset);
    yOffset += 33;
    this.positionInput('TEDDIES_PER_CHUNK_MIN', containerX + 50, containerY + yOffset);
    this.positionInput('TEDDIES_PER_CHUNK_MAX', containerX + 130, containerY + yOffset);
    yOffset += 52;
    
    // Starting inventory
    this.positionInput('START_BOTTLES', containerX + 50, containerY + yOffset);
    yOffset += 33;
    this.positionInput('START_TEDDIES', containerX + 50, containerY + yOffset);
  }
  
  private positionInput(key: string, x: number, y: number) {
    const input = this.inputElements.get(key);
    if (input) {
      input.style.left = `${x}px`;
      input.style.top = `${y}px`;
    }
  }
  
  private saveAndRestart() {
    // Update DEV_CONFIG with new values
    DEV_CONFIG.SPAWN_RATES.MONSTER_SPAWN_CHANCE = parseFloat(this.inputElements.get('MONSTER_SPAWN_CHANCE')!.value);
    DEV_CONFIG.SPAWN_RATES.MAX_MONSTERS = parseInt(this.inputElements.get('MAX_MONSTERS')!.value);
    DEV_CONFIG.SPAWN_RATES.MONSTERS_PER_CHUNK.min = parseInt(this.inputElements.get('MONSTERS_PER_CHUNK_MIN')!.value);
    DEV_CONFIG.SPAWN_RATES.MONSTERS_PER_CHUNK.max = parseInt(this.inputElements.get('MONSTERS_PER_CHUNK_MAX')!.value);
    
    DEV_CONFIG.SPAWN_RATES.BOTTLE_SPAWN_CHANCE = parseFloat(this.inputElements.get('BOTTLE_SPAWN_CHANCE')!.value);
    DEV_CONFIG.SPAWN_RATES.MAX_BOTTLES = parseInt(this.inputElements.get('MAX_BOTTLES')!.value);
    DEV_CONFIG.SPAWN_RATES.BOTTLES_PER_CHUNK.min = parseInt(this.inputElements.get('BOTTLES_PER_CHUNK_MIN')!.value);
    DEV_CONFIG.SPAWN_RATES.BOTTLES_PER_CHUNK.max = parseInt(this.inputElements.get('BOTTLES_PER_CHUNK_MAX')!.value);
    
    DEV_CONFIG.SPAWN_RATES.TEDDY_SPAWN_CHANCE = parseFloat(this.inputElements.get('TEDDY_SPAWN_CHANCE')!.value);
    DEV_CONFIG.SPAWN_RATES.MAX_TEDDIES = parseInt(this.inputElements.get('MAX_TEDDIES')!.value);
    DEV_CONFIG.SPAWN_RATES.TEDDIES_PER_CHUNK.min = parseInt(this.inputElements.get('TEDDIES_PER_CHUNK_MIN')!.value);
    DEV_CONFIG.SPAWN_RATES.TEDDIES_PER_CHUNK.max = parseInt(this.inputElements.get('TEDDIES_PER_CHUNK_MAX')!.value);
    
    DEV_CONFIG.START_INVENTORY.bottle = parseInt(this.inputElements.get('START_BOTTLES')!.value);
    DEV_CONFIG.START_INVENTORY.teddy = parseInt(this.inputElements.get('START_TEDDIES')!.value);
    
    // Clean up inputs before restarting
    this.inputElements.forEach(input => {
      if (input && input.parentNode) {
        input.remove();
      }
    });
    this.inputElements.clear();
    
    // Hide the container
    this.container.setVisible(false);
    this.isOpen = false;
    
    // Use time event to ensure clean restart
    this.time.delayedCall(100, () => {
      // Stop all scenes
      this.scene.stop('SettingsScene');
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      
      // Set a flag to skip the start screen
      this.game.registry.set('skipStartScreen', true);
      
      // Restart from BootScene to ensure clean initialization
      this.scene.start('BootScene');
    });
  }
  
  shutdown() {
    // Clean up inputs when scene shuts down
    this.inputElements.forEach(input => {
      input.remove();
    });
    this.inputElements.clear();
  }
}