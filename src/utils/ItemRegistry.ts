export interface ItemDefinition {
  id: string;
  name: string;
  imageKey: string;
  description: string;
  maxStack: number;
  effect?: (player: any) => void;
}

export class ItemRegistry {
  private static items: Map<string, ItemDefinition> = new Map();
  
  static initialize() {
    // Register all items
    this.registerItem({
      id: 'bottle',
      name: 'Baby Bottle',
      imageKey: 'bottle',
      description: 'Restores 20 HP when consumed',
      maxStack: 10,
      effect: (player) => {
        const newHealth = Math.min(player.health + 20, player.maxHealth);
        player.health = newHealth;
        player.scene.game.events.emit('health-update', player.health, player.maxHealth);
      }
    });
    
    this.registerItem({
      id: 'teddy',
      name: 'Teddy Bear',
      imageKey: 'teddy-item',
      description: 'Summons a brave teddy to fight monsters',
      maxStack: 3,
      effect: (player) => {
        // Emit event to spawn teddy
        player.scene.game.events.emit('spawn-teddy', player.getPosition());
        // Close inventory drawer after using teddy
        player.scene.game.events.emit('close-inventory');
      }
    });
  }
  
  static registerItem(item: ItemDefinition) {
    this.items.set(item.id, item);
  }
  
  static getItem(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }
  
  static getAllItems(): ItemDefinition[] {
    return Array.from(this.items.values());
  }
  
  static itemExists(id: string): boolean {
    return this.items.has(id);
  }
}