# Baby Crawler

A procedurally generated dungeon crawler where you play as a baby exploring an infinite nursery-themed dungeon! Built with Phaser 3 and TypeScript.

## Features

- 🍼 **Infinite Procedural Generation**: The dungeon generates endlessly as you explore
- 👶 **Baby-Themed**: Play as a crawling baby in a nursery-themed dungeon
- 🎮 **Smooth Controls**: Use WASD or Arrow keys to crawl around
- 🏗️ **Chunk-Based System**: Efficient memory management with dynamic chunk loading
- 🎨 **Cute Visuals**: Soft pastel colors and baby-friendly design

## Development

This project uses DDEV for the development environment.

### Prerequisites
- DDEV installed on your machine

### Getting Started

1. Start the DDEV environment:
   ```bash
   ddev start
   ```

2. Install dependencies:
   ```bash
   ddev exec npm install
   ```

3. Run the development server:
   ```bash
   ddev exec npm run dev -- --host
   ```

4. Access the game at: https://baby-crawler.ddev.site:5174

### Building for Production

```bash
ddev exec npm run build
```

The built files will be in the `dist` directory, ready for deployment to Netlify.

## Game Controls

- **Arrow Keys** or **WASD**: Move the baby
- The baby will crawl around with a cute wobbling animation
- Explore the infinite dungeon!

## Technical Stack

- **Game Engine**: Phaser 3
- **Language**: TypeScript
- **Build Tool**: Vite
- **Development Environment**: DDEV
- **Deployment**: Netlify

## Current Features

- ✅ Infinite procedural dungeon generation
- ✅ Baby player with smooth crawling animations
- ✅ 4 types of baby monsters:
  - Baby Dragon (hiccups flames)
  - Baby Slime (bouncing jello)
  - Baby Ghost (translucent, says "boo-boo")
  - Baby Spider (fuzzy and fast)
- ✅ Smart collision detection
- ✅ Chunk-based world system for performance

## Deployment to Netlify

### Option 1: Drag & Drop
1. Build the project: `ddev exec npm run build`
2. The `dist` folder contains your built game
3. Drag the `dist` folder to Netlify's deployment area

### Option 2: Git Integration
1. Push this repository to GitHub
2. Connect your GitHub repo to Netlify
3. Netlify will automatically build and deploy using the `netlify.toml` configuration

### Option 3: Netlify CLI
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Build the project
ddev exec npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## Upcoming Features

- 🧸 More baby monsters (Skeleton, Goblin, Mimic, Bat)
- 🎯 Toy collection system
- 🗺️ Minimap implementation
- 🎵 Sound effects and music
- ✨ Particle effects
- 🎨 Nursery-themed tile graphics