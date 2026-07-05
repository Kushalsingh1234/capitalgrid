import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from '../game/scenes/GameScene';

export default function GameWorld({ startup, onBuildingClick, disableClicks }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  
  // Store click callback in a mutable ref to decouple it from Phaser's mount cycle
  const clickCallbackRef = useRef(onBuildingClick);

  // Keep the ref updated with the latest prop callback
  useEffect(() => {
    clickCallbackRef.current = onBuildingClick;
  }, [onBuildingClick]);

  useEffect(() => {
    // Guard clause to prevent duplicate Phaser game instances (e.g. under React StrictMode)
    if (gameRef.current) {
      return;
    }

    const config = {
      type: Phaser.AUTO,
      width: '100%',
      height: '100%',
      parent: containerRef.current,
      backgroundColor: '#2e7d32', // Matches GameScene grass backdrop
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [GameScene]
    };

    // Initialize single Phaser game instance (executed exactly once on mount)
    const game = new Phaser.Game(config);
    
    // Set the initial startup data into Phaser registry
    game.registry.set('startup', startup);
    if (game.input) {
      game.input.enabled = !disableClicks;
    }
    gameRef.current = game;

    // Listen for click events from the Phaser scene
    const handleBuildingClick = (buildingData) => {
      if (clickCallbackRef.current) {
        clickCallbackRef.current(buildingData);
      }
    };
    game.events.on('building-click', handleBuildingClick);

    // Cleanup reference on component unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.events.off('building-click', handleBuildingClick);
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // Run ONLY once on mount

  // Update registry if startup changes (avoids destroying Phaser)
  useEffect(() => {
    if (gameRef.current && startup) {
      gameRef.current.registry.set('startup', startup);
    }
  }, [startup]);

  // Synchronize input interaction block state dynamically
  useEffect(() => {
    if (gameRef.current && gameRef.current.input) {
      gameRef.current.input.enabled = !disableClicks;
    }
  }, [disableClicks]);

  return (
    <div className="w-full h-full overflow-hidden" style={{ width: '100%', height: '100%' }}>
      <div 
        ref={containerRef} 
        id="phaser-game-container" 
        className="w-full h-full"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
