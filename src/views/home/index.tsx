// Next, React
import { FC, useEffect, useRef, useState, useCallback } from 'react';
import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

const GameSandbox: FC = () => {
  const SmallLaserIcon = () => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Side emitters */}
      <rect x="2" y="9" width="3" height="6" rx="1" fill="white" />
      <rect x="19" y="9" width="3" height="6" rx="1" fill="white" />

      {/* Core laser */}
      <rect x="7" y="10" width="10" height="4" rx="2" fill="white" />

      {/* Center dot */}
      <circle cx="12" cy="12" r="1.2" fill="white" />
    </svg>
  );

  const BigLaserIcon = () => (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Side cannons */}
      <rect x="1.5" y="8" width="4" height="8" rx="1.5" fill="white" />
      <rect x="18.5" y="8" width="4" height="8" rx="1.5" fill="white" />

      {/* Main laser body */}
      <rect x="6" y="7" width="12" height="10" rx="3" fill="white" />

      {/* Inner energy core */}
      <rect x="9" y="9.5" width="6" height="5" rx="2" fill="white" opacity="0.6" />
    </svg>
  );

  interface Enemy {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'beetle' | 'rhino' | 'boss';
    lives: number;
    maxLives: number;
    posX: number;
    posY: number;
    frameX: number;
    frameY: number;
    remove: boolean;
    waveId: number;
    waveBaseX?: number;
    waveBaseY?: number;
    waveSpeedX?: number;
  }

  interface Projectile {
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    speed: number;
  }

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(1);
  const [energy, setEnergy] = useState(50);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [, setTick] = useState(0); // Force re-renders
  const [totalCoins, setTotalCoins] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shipsOpen, setShipsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef({ x: 145, y: 420, width: 70, height: 60, speed: 3 });
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const waveRef = useRef({ x: 0, y: -200, speedX: 1.5, speedY: 0, columns: 1, rows: 1 });
  const keysRef = useRef<Set<string>>(new Set());
  const energyRef = useRef(50);
  const energyDepletedRef = useRef(false);
  const laserActiveRef = useRef({ small: false, big: false });
  const spriteTimerRef = useRef(0);
  const spriteUpdateRef = useRef(false);
  const projectileFiredRef = useRef(false);
  const bossLivesRef = useRef(10);
  const columnsRef = useRef(1);
  const rowsRef = useRef(1);
  const autoFireTimerRef = useRef(0);
  const touchStartXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const waveSpawnTimerRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);

  // Audio refs
  const homeBgAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameplayBgAudioRef = useRef<HTMLAudioElement | null>(null);
  const buttonClickAudioRef = useRef<HTMLAudioElement | null>(null);
  const menuOpenAudioRef = useRef<HTMLAudioElement | null>(null);
  const normalFireAudioRef = useRef<HTMLAudioElement | null>(null);
  const smallLaserAudioRef = useRef<HTMLAudioElement | null>(null);
  const bigLaserAudioRef = useRef<HTMLAudioElement | null>(null);
  const enemyHitAudioRef = useRef<HTMLAudioElement | null>(null);
  const enemyExplodeAudioRef = useRef<HTMLAudioElement | null>(null);
  const bossHitAudioRef = useRef<HTMLAudioElement | null>(null);
  const bossExplodeAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);

  const GAME_WIDTH = 360;
  const GAME_HEIGHT = 600;
  const ENEMY_SIZE = 40;
  const PLAYER_MAX_LIVES = 1;
  const SPRITE_INTERVAL = 150;

  // Audio helper function
  const playSound = useCallback((audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (!isMuted && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [isMuted]);
  
  // Initialize projectile pool and audio
  useEffect(() => {
    projectilesRef.current = Array(10).fill(null).map(() => ({
      x: 0,
      y: 0,
      width: 4,
      height: 12,
      active: false,
      speed: 10
    }));
    
    // Load total coins from localStorage
    const savedCoins = localStorage.getItem('laserfall_coins');
    if (savedCoins) {
      setTotalCoins(parseInt(savedCoins, 10));
    }

    // Initialize audio files
    homeBgAudioRef.current = new Audio('/assets/aud/home-bg-audio.mp3');
    homeBgAudioRef.current.loop = true;
    homeBgAudioRef.current.volume = 0.3;

    gameplayBgAudioRef.current = new Audio('/assets/aud/gameplay-bg-audio.mp3');
    gameplayBgAudioRef.current.loop = true;
    gameplayBgAudioRef.current.volume = 0.3;

    buttonClickAudioRef.current = new Audio('/assets/aud/button-click.mp3');
    buttonClickAudioRef.current.volume = 0.5;

    menuOpenAudioRef.current = new Audio('/assets/aud/menu-open.mp3');
    menuOpenAudioRef.current.volume = 0.5;

    normalFireAudioRef.current = new Audio('/assets/aud/normal-fire.mp3');
    normalFireAudioRef.current.volume = 0.3;

    smallLaserAudioRef.current = new Audio('/assets/aud/small-lazor.mp3');
    smallLaserAudioRef.current.volume = 0.4;

    bigLaserAudioRef.current = new Audio('/assets/aud/big-lazor.mp3');
    bigLaserAudioRef.current.volume = 0.4;

    enemyHitAudioRef.current = new Audio('/assets/aud/enemy-hit.mp3');
    enemyHitAudioRef.current.volume = 0.4;

    enemyExplodeAudioRef.current = new Audio('/assets/aud/enemy-explode.mp3');
    enemyExplodeAudioRef.current.volume = 0.5;

    bossHitAudioRef.current = new Audio('/assets/aud/boss-hit.mp3');
    bossHitAudioRef.current.volume = 0.5;

    bossExplodeAudioRef.current = new Audio('/assets/aud/boss-explode.mp3');
    bossExplodeAudioRef.current.volume = 0.6;

    gameOverAudioRef.current = new Audio('/assets/aud/game-over.mp3');
    gameOverAudioRef.current.volume = 0.5;
  }, []);

  // Collision detection
  const isColliding = useCallback((rect1: any, rect2: any): boolean => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }, []);

  // Get free projectile from pool
  const getProjectile = () => {
    return projectilesRef.current.find(p => !p.active);
  };

  // Fire projectile
  const fireProjectile = useCallback(() => {
    const proj = getProjectile();
    if (proj) {
      proj.active = true;
      proj.x = playerRef.current.x + playerRef.current.width / 2 - proj.width / 2;
      proj.y = playerRef.current.y;
      playSound(normalFireAudioRef);
    }
  }, [playSound]);

  // Spawn wave
  const spawnWave = useCallback(() => {
    const waveId = Date.now(); // Unique ID for this wave
    const waveSpeedX = (Math.random() < 0.5 ? -1 : 1) * (1.3 + Math.random() * 0.7);
    const waveBaseX = GAME_WIDTH / 2 - (columnsRef.current * ENEMY_SIZE) / 2;
    const waveBaseY = -rowsRef.current * ENEMY_SIZE;
    
    const newEnemies: Enemy[] = [];
    for (let row = 0; row < rowsRef.current; row++) {
      for (let col = 0; col < columnsRef.current; col++) {
        const isRhino = Math.random() < 0.35;
        newEnemies.push({
          x: waveBaseX + col * ENEMY_SIZE,
          y: waveBaseY + row * ENEMY_SIZE,
          width: ENEMY_SIZE,
          height: ENEMY_SIZE,
          type: isRhino ? 'rhino' : 'beetle',
          lives: isRhino ? 4 : 1,
          maxLives: isRhino ? 4 : 1,
          posX: col * ENEMY_SIZE,
          posY: row * ENEMY_SIZE,
          frameX: 0,
          frameY: Math.floor(Math.random() * 4),
          remove: false,
          waveId: waveId,
          waveBaseX: waveBaseX,
          waveBaseY: waveBaseY,
          waveSpeedX: waveSpeedX
        });
      }
    }
    
    // Add to existing enemies instead of replacing
    enemiesRef.current = [...enemiesRef.current, ...newEnemies];
  }, []);

  // Spawn boss
  const spawnBoss = useCallback(() => {
    const waveId = Date.now();
    const boss: Enemy = {
      x: GAME_WIDTH / 2 - 50,
      y: -100,
      width: 100,
      height: 100,
      type: 'boss',
      lives: bossLivesRef.current,
      maxLives: bossLivesRef.current,
      posX: 0,
      posY: 0,
      frameX: 0,
      frameY: Math.floor(Math.random() * 4),
      remove: false,
      waveId: waveId,
      waveSpeedX: (Math.random() < 0.5 ? -1 : 1) * (1.0 + Math.random() * 0.6)
    };
    
    // Add boss to existing enemies
    enemiesRef.current = [...enemiesRef.current, boss];
  }, []);

  // Next wave
  const nextWave = useCallback(() => {
    setWave(prev => {
      const nextWave = prev + 1;
      if (nextWave % 5 === 0) {
        spawnBoss();
      } else {
        if (Math.random() < 0.5 && columnsRef.current < 4) {
          columnsRef.current++;
        }
        if (Math.random() < 0.5 && rowsRef.current < 3) {
          rowsRef.current++;
        }
        spawnWave();
      }
      return nextWave;
    });
  }, [spawnBoss, spawnWave]);

  // Update player
  const updatePlayer = () => {
    const player = playerRef.current;
    
    if (keysRef.current.has('ArrowLeft')) {
      player.x = Math.max(-player.width * 0.5, player.x - player.speed);
    }
    if (keysRef.current.has('ArrowRight')) {
      player.x = Math.min(GAME_WIDTH - player.width * 0.5, player.x + player.speed);
    }
  };

  // Update projectiles
  const updateProjectiles = () => {
    projectilesRef.current.forEach(proj => {
      if (proj.active) {
        proj.y -= proj.speed;
        if (proj.y < -proj.height) {
          proj.active = false;
        }
      }
    });
  };

  // Update enemies
  const updateEnemies = useCallback(() => {
    const enemies = enemiesRef.current;
    
    if (enemies.length === 0) return;

    // Group enemies by waveId
    const waveGroups = new Map<number, Enemy[]>();
    enemies.forEach(enemy => {
      if (!waveGroups.has(enemy.waveId)) {
        waveGroups.set(enemy.waveId, []);
      }
      waveGroups.get(enemy.waveId)?.push(enemy);
    });

    // Update each wave independently
    waveGroups.forEach((waveEnemies) => {
      if (waveEnemies.length === 0) return;
      
      const isBoss = waveEnemies[0].type === 'boss';

      if (isBoss) {
        const boss = waveEnemies[0];
        if (boss.y < 0) {
          boss.y += 2;
        }
        if (boss.x <= 0 || boss.x >= GAME_WIDTH - boss.width) {
          boss.waveSpeedX = (boss.waveSpeedX || 1.5) * -1;
          boss.y += boss.height * 0.3;
        }
        boss.x += (boss.waveSpeedX || 1.5) * 0.5;
      } else {
        // Regular wave movement
        const firstEnemy = waveEnemies[0];
        const waveSpeedX = firstEnemy.waveSpeedX || 2;
        let waveBaseX = firstEnemy.waveBaseX || 0;
        let waveBaseY = firstEnemy.waveBaseY || 0;
        
        // Move wave down if still entering
        if (waveBaseY < 0) {
          waveBaseY += 4;
        }
        
        const waveWidth = columnsRef.current * ENEMY_SIZE;
        let speedY = 0;
        
        // Check boundaries and reverse direction
        if (waveBaseX < 0 || waveBaseX > GAME_WIDTH - waveWidth) {
          firstEnemy.waveSpeedX = waveSpeedX * -1;
          speedY = ENEMY_SIZE;
        }
        
        waveBaseX += firstEnemy.waveSpeedX || waveSpeedX;
        waveBaseY += speedY;

        // Update all enemies in this wave
        waveEnemies.forEach(enemy => {
          enemy.waveBaseX = waveBaseX;
          enemy.waveBaseY = waveBaseY;
          enemy.x = waveBaseX + enemy.posX;
          enemy.y = waveBaseY + enemy.posY;
        });
      }
    });
  }, []);

  // Update lasers
  const updateLasers = useCallback(() => {
    const isSmallLaser = keysRef.current.has('s');
    const isBigLaser = keysRef.current.has('d');
    
    const wasSmallLaserActive = laserActiveRef.current.small;
    const wasBigLaserActive = laserActiveRef.current.big;
    
    laserActiveRef.current.small = isSmallLaser;
    laserActiveRef.current.big = isBigLaser;

    // Handle small laser audio - play once when activated
    if (isSmallLaser && !wasSmallLaserActive && !isMuted && smallLaserAudioRef.current) {
      smallLaserAudioRef.current.currentTime = 0;
      smallLaserAudioRef.current.play().catch(() => {});
    }

    // Handle big laser audio - play once when activated
    if (isBigLaser && !wasBigLaserActive && !isMuted && bigLaserAudioRef.current) {
      bigLaserAudioRef.current.currentTime = 0;
      bigLaserAudioRef.current.play().catch(() => {});
    }

    if ((isSmallLaser || isBigLaser) && energyRef.current > 1 && !energyDepletedRef.current) {
      const damage = isBigLaser ? 0.8 : 0.5;
      energyRef.current -= damage;

      if (spriteUpdateRef.current) {
        const laserWidth = isBigLaser ? 25 : 5;
        const laserX = playerRef.current.x + playerRef.current.width / 2 - laserWidth / 2;
        const laserRect = { x: laserX, y: 0, width: laserWidth, height: playerRef.current.y };

        enemiesRef.current.forEach(enemy => {
          if (isColliding(enemy, laserRect) && enemy.lives > 0) {
            enemy.lives -= damage;
            if (enemy.type === 'rhino') {
              enemy.frameX = enemy.maxLives - Math.floor(enemy.lives);
            }
          }
        });
      }
    }

    if (energyRef.current < 100) {
      energyRef.current = Math.min(100, energyRef.current + 0.12);
    }

    if (energyRef.current < 1) {
      energyDepletedRef.current = true;
      // Clear laser keys to prevent auto-trigger when energy returns
      keysRef.current.delete('s');
      keysRef.current.delete('d');
    } else if (energyRef.current > 30) {
      energyDepletedRef.current = false;
    }

    setEnergy(Math.floor(energyRef.current));
  }, [isMuted, isColliding]);

  // Check collisions
  const checkCollisions = useCallback(() => {
    const player = playerRef.current;
    
    enemiesRef.current.forEach(enemy => {
      if (enemy.lives <= 0) {
        if (spriteUpdateRef.current) {
          enemy.frameX++;
          if (enemy.frameX === 1) {
            // Play explode sound on first death frame
            if (enemy.type === 'boss') {
              playSound(bossExplodeAudioRef);
            } else {
              playSound(enemyExplodeAudioRef);
            }
          }
          if (enemy.frameX > (enemy.type === 'boss' ? 11 : enemy.type === 'rhino' ? 5 : 2)) {
            enemy.remove = true;
            if (!gameOver) {
              const coinValue = enemy.maxLives;
              setScore(prev => prev + coinValue);
              // Add coins immediately when enemy is killed
              setTotalCoins(prev => {
                const newTotal = prev + coinValue;
                localStorage.setItem('laserfall_coins', newTotal.toString());
                return newTotal;
              });
            }
            if (enemy.type === 'boss') {
              bossLivesRef.current += 7;
            }
          }
        }
        return;
      }

      projectilesRef.current.forEach(proj => {
        if (proj.active && isColliding(enemy, proj)) {
          enemy.lives -= 1;
          if (enemy.type === 'rhino') {
            enemy.frameX = enemy.maxLives - Math.floor(enemy.lives);
          }
          proj.active = false;
        }
      });

      if (isColliding(enemy, player) && enemy.lives > 0) {
        enemy.lives = 0;
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            // Stop gameplay music and play game over sound
            if (gameplayBgAudioRef.current) {
              gameplayBgAudioRef.current.pause();
            }
            playSound(gameOverAudioRef);
          }
          return newLives;
        });
      }
    });

    enemiesRef.current = enemiesRef.current.filter(e => !e.remove);

    // Start wave spawn timer continuously (not just when screen cleared)
    if (waveSpawnTimerRef.current === 0 && !gameOver && gameStarted) {
      const spawnDelay = 2000 + Math.random() * 2000; // Random 2-4 seconds
      waveSpawnTimerRef.current = spawnDelay;
    }
  }, [gameOver, gameStarted, playSound, isColliding]);

  // Resume with coins
  const resumeWithCoins = () => {
    if (totalCoins > 5000) {
      playSound(buttonClickAudioRef);
      const newTotal = totalCoins - 5000;
      setTotalCoins(newTotal);
      localStorage.setItem('laserfall_coins', newTotal.toString());
      setGameOver(false);
      setLives(1);
      // Continue from where player died
      spawnWave();
      // Resume gameplay music
      if (!isMuted && gameplayBgAudioRef.current) {
        gameplayBgAudioRef.current.play().catch(() => {});
      }
    }
  };

  // Restart game
  const restart = useCallback(() => {
    playSound(buttonClickAudioRef);
    // Coins already saved during gameplay, no need to add score again
    
    setScore(0);
    setLives(1);
    setEnergy(50);
    setWave(1);
    setGameOver(false);
    setIsPaused(false);
    setPauseMenuOpen(false);
    playerRef.current.x = 145;
    playerRef.current.y = 420;
    energyRef.current = 50;
    energyDepletedRef.current = false;
    columnsRef.current = 1;
    rowsRef.current = 1;
    bossLivesRef.current = 10;
    enemiesRef.current = [];
    projectilesRef.current.forEach(p => p.active = false);
    keysRef.current.clear();
    autoFireTimerRef.current = 0;
    waveSpawnTimerRef.current = 0;
    isDraggingRef.current = false;
    setSettingsOpen(false);
    setShipsOpen(false);
    spawnWave();
    // Start gameplay music
    if (!isMuted && gameplayBgAudioRef.current) {
      gameplayBgAudioRef.current.play().catch(() => {});
    }
  }, [playSound, spawnWave, isMuted]);

  // Start game
  const startGame = () => {
    playSound(buttonClickAudioRef);
    setGameStarted(true);
    setIsPaused(false);
    setPauseMenuOpen(false);
    setSettingsOpen(false);
    setShipsOpen(false);
    enemiesRef.current = [];
    spawnWave();
    // Stop home music and start gameplay music
    if (homeBgAudioRef.current) {
      homeBgAudioRef.current.pause();
    }
    if (!isMuted && gameplayBgAudioRef.current) {
      gameplayBgAudioRef.current.play().catch(() => {});
    }
  };
  
  // Go to home
  const goHome = () => {
    playSound(buttonClickAudioRef);
    // Coins already saved during gameplay, no need to add score again
    
    setGameStarted(false);
    setGameOver(false);
    setIsPaused(false);
    setPauseMenuOpen(false);
    setScore(0);
    setLives(1);
    setEnergy(50);
    setWave(1);
    playerRef.current.x = 145;
    playerRef.current.y = 420;
    energyRef.current = 50;
    energyDepletedRef.current = false;
    columnsRef.current = 1;
    rowsRef.current = 1;
    bossLivesRef.current = 10;
    projectilesRef.current.forEach(p => p.active = false);
    keysRef.current.clear();
    autoFireTimerRef.current = 0;
    waveSpawnTimerRef.current = 0;
    isDraggingRef.current = false;
    // Stop gameplay music and start home music
    if (gameplayBgAudioRef.current) {
      gameplayBgAudioRef.current.pause();
    }
    if (!isMuted && homeBgAudioRef.current) {
      homeBgAudioRef.current.play().catch(() => {});
    }
  };
  
  // Reset all progress
  const resetProgress = () => {
    playSound(buttonClickAudioRef);
    setTotalCoins(0);
    localStorage.setItem('laserfall_coins', '0');
    setSettingsOpen(false);
  };

  // EVENT HANDLERS
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver && e.key === 'r') {
        restart();
        return;
      }
      if (!gameStarted || gameOver) return;
      
      keysRef.current.add(e.key);
      
      if (e.key === ' ' && !projectileFiredRef.current) {
        projectileFiredRef.current = true;
        fireProjectile();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      if (e.key === ' ') {
        projectileFiredRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, gameStarted, fireProjectile, restart]);

  // Control background music based on game state
  useEffect(() => {
    if (!gameStarted && !gameOver) {
      // Home screen
      if (!isMuted && homeBgAudioRef.current) {
        homeBgAudioRef.current.play().catch(() => {});
      }
    }
  }, [gameStarted, gameOver, isMuted]);

  // Control mute state for all audio
  useEffect(() => {
    if (isMuted) {
      // Pause all audio
      homeBgAudioRef.current?.pause();
      gameplayBgAudioRef.current?.pause();
      smallLaserAudioRef.current?.pause();
      bigLaserAudioRef.current?.pause();
    } else {
      // Resume appropriate background music
      if (!gameStarted && !gameOver && homeBgAudioRef.current) {
        homeBgAudioRef.current.play().catch(() => {});
      } else if (gameStarted && !gameOver && !isPaused && gameplayBgAudioRef.current) {
        gameplayBgAudioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, gameStarted, gameOver, isPaused]);

  // Touch handlers
  const handleTouchStart = (key: string) => {
    if (!gameStarted || gameOver) return;
    
    if (key === 's' || key === 'd') {
      // Laser keys - single activation only
      if (!keysRef.current.has(key)) {
        keysRef.current.add(key);
        // Remove immediately for single-shot behavior
        setTimeout(() => keysRef.current.delete(key), 50);
      }
    } else {
      keysRef.current.add(key);
      if (key === ' ' && !projectileFiredRef.current) {
        projectileFiredRef.current = true;
        fireProjectile();
      }
    }
  };

  const handleTouchEnd = (key: string) => {
    // For non-laser keys, remove on release
    if (key !== 's' && key !== 'd') {
      keysRef.current.delete(key);
    }
    if (key === ' ') {
      projectileFiredRef.current = false;
    }
  };

  // GAME LOOP
  
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    let lastTime = 0;
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Sprite animation timer
      spriteTimerRef.current += deltaTime;
      if (spriteTimerRef.current > SPRITE_INTERVAL) {
        spriteTimerRef.current = 0;
        spriteUpdateRef.current = true;
      } else {
        spriteUpdateRef.current = false;
      }

      // Auto-fire logic
      autoFireTimerRef.current += deltaTime;
      if (autoFireTimerRef.current > 180) {
        autoFireTimerRef.current = 0;
        fireProjectile();
      }

      // Wave spawn timer - countdown and spawn when reaches 0
      if (waveSpawnTimerRef.current > 0) {
        waveSpawnTimerRef.current -= deltaTime;
        if (waveSpawnTimerRef.current <= 0) {
          nextWave();
          waveSpawnTimerRef.current = 0;
        }
      }

      // Update game objects

      // Update game objects
      updatePlayer();
      updateProjectiles();
      updateEnemies();
      updateLasers();
      checkCollisions();

      // Force re-render
      setTick(prev => prev + 1);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, gameOver, isPaused, fireProjectile, nextWave, updateEnemies, updateLasers, checkCollisions]);

  // RENDER
  
  return (
    <div className="relative w-full h-full bg-black overflow-hidden" style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }}>
      
      {/* Gameplay Background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/assets/img/Gameplay_Background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Pause Button - Top Left */}
      {gameStarted && !gameOver && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            playSound(menuOpenAudioRef);
            setIsPaused(true);
            setPauseMenuOpen(true);
            if (gameplayBgAudioRef.current) {
              gameplayBgAudioRef.current.pause();
            }
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            playSound(menuOpenAudioRef);
            setIsPaused(true);
            setPauseMenuOpen(true);
            if (gameplayBgAudioRef.current) {
              gameplayBgAudioRef.current.pause();
            }
          }}
          className="absolute top-3 left-3 z-40 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 border-3 border-orange-400 shadow-[0_0_15px_rgba(255,140,0,0.5)] active:scale-95 transition-transform"
        >
          <span className="absolute inset-1 rounded-lg bg-purple-600 opacity-80"></span>
          <span className="relative z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z"/>
            </svg>
          </span>
        </button>
      )}

      {/* Energy Bar - 12 Small Candles Below Coins */}
      {gameStarted && !gameOver && (
        <div className="absolute top-20 right-3 z-10">
          <div className="bg-black/80 rounded-lg px-2 py-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-5 rounded-sm transition-all ${
                    i < Math.floor(energy / 8.33)
                      ? energyDepletedRef.current 
                        ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.9)]'
                        : energy > 70
                        ? 'bg-green-400 shadow-[0_0_4px_rgba(34,197,94,0.7)]'
                        : energy > 40
                        ? 'bg-yellow-400 shadow-[0_0_4px_rgba(234,179,8,0.7)]'
                        : 'bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.7)]'
                      : 'bg-gray-800/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Score - Top Right (Number Only) */}
      {gameStarted && !gameOver && (
        <div className="absolute top-3 right-3 z-10">
          <div
            className="text-white text-3xl font-bold"
            style={{ textShadow: '0 0 15px rgba(34,211,238,0.8), 2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            {score}
          </div>
        </div>
      )}

      {/* Coins - Below Score */}
      {gameStarted && !gameOver && (
        <div className="absolute top-12 right-3 z-10 flex items-center gap-1.5">
          <img src="/assets/img/coin.png" alt="coin" className="w-6 h-6" />
          <span
            className="text-white text-xl font-bold"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            {totalCoins}
          </span>
        </div>
      )}

      {/* Player Ship */}
      {gameStarted && !gameOver && (
        <div
          className="absolute transition-none z-20"
          style={{
            left: `${playerRef.current.x}px`,
            top: `${playerRef.current.y}px`,
            width: `${playerRef.current.width}px`,
            height: `${playerRef.current.height}px`,
            backgroundImage: "url('/assets/img/player.png')",
            backgroundSize: `${playerRef.current.width * 4}px ${playerRef.current.height}px`,
            backgroundPosition: '0 0'
          }}
        />
      )}

      {/* Lasers - Enhanced with glow */}
      {gameStarted && !gameOver && (laserActiveRef.current.small || laserActiveRef.current.big) && energyRef.current > 1 && !energyDepletedRef.current && (
        <>
          {/* Outer glow */}
          <div
            className="absolute bg-gradient-to-t from-green-400/30 to-yellow-300/30 blur-md"
            style={{
              left: `${playerRef.current.x + playerRef.current.width / 2 - (laserActiveRef.current.big ? 18 : 8)}px`,
              top: '0',
              width: `${laserActiveRef.current.big ? 36 : 16}px`,
              height: `${playerRef.current.y}px`
            }}
          />
          {/* Main beam */}
          <div
            className="absolute bg-gradient-to-t from-green-400 via-green-300 to-yellow-300 opacity-90"
            style={{
              left: `${playerRef.current.x + playerRef.current.width / 2 - (laserActiveRef.current.big ? 12.5 : 2.5)}px`,
              top: '0',
              width: `${laserActiveRef.current.big ? 25 : 5}px`,
              height: `${playerRef.current.y}px`,
              boxShadow: laserActiveRef.current.big 
                ? '0 0 20px rgba(34,197,94,0.8), 0 0 40px rgba(234,179,8,0.6)'
                : '0 0 10px rgba(34,197,94,0.6)'
            }}
          />
          {/* Inner core */}
          <div
            className="absolute bg-white"
            style={{
              left: `${playerRef.current.x + playerRef.current.width / 2 - (laserActiveRef.current.big ? 6 : 1)}px`,
              top: '0',
              width: `${laserActiveRef.current.big ? 12 : 2}px`,
              height: `${playerRef.current.y}px`,
              opacity: 0.8
            }}
          />
        </>
      )}

      {/* Projectiles - Enhanced with glow and trail */}
      {gameStarted && !gameOver && projectilesRef.current.map((proj, i) => 
        proj.active ? (
          <div key={i}>
            {/* Glow effect */}
            <div
              className="absolute bg-green-400/40 rounded-full blur-sm"
              style={{
                left: `${proj.x - 2}px`,
                top: `${proj.y - 2}px`,
                width: `${proj.width + 4}px`,
                height: `${proj.height + 4}px`
              }}
            />
            {/* Main projectile */}
            <div
              className="absolute bg-gradient-to-t from-green-400 to-green-200 rounded-sm"
              style={{
                left: `${proj.x}px`,
                top: `${proj.y}px`,
                width: `${proj.width}px`,
                height: `${proj.height}px`,
                boxShadow: '0 0 8px rgba(34,197,94,0.8), 0 0 4px rgba(255,255,255,0.6)'
              }}
            />
            {/* Core */}
            <div
              className="absolute bg-white rounded-sm"
              style={{
                left: `${proj.x + 1}px`,
                top: `${proj.y + 2}px`,
                width: `${proj.width - 2}px`,
                height: `${proj.height - 4}px`,
                opacity: 0.7
              }}
            />
          </div>
        ) : null
      )}

      {/* Enemies */}
      {gameStarted && !gameOver && enemiesRef.current.map((enemy, i) => (
        <div key={i}>
          {/* Enemy glow effect for bosses and special enemies */}
          {(enemy.type === 'boss' || enemy.type === 'rhino') && (
            <div
              className="absolute rounded-full blur-md"
              style={{
                left: `${enemy.x - 4}px`,
                top: `${enemy.y - 4}px`,
                width: `${enemy.width + 8}px`,
                height: `${enemy.height + 8}px`,
                background: enemy.type === 'boss' 
                  ? 'radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)'
              }}
            />
          )}
          {/* Enemy sprite */}
          <div
            className="absolute"
            style={{
              left: `${enemy.x}px`,
              top: `${enemy.y}px`,
              width: `${enemy.width}px`,
              height: `${enemy.height}px`,
              backgroundImage: `url('/assets/img/${enemy.type === 'boss' ? 'boss' : enemy.type === 'rhino' ? 'rhinomorph' : 'beetlemorph'}.png')`,
              backgroundSize: enemy.type === 'boss' 
                ? `${enemy.width * 12}px ${enemy.height * 4}px`
                : enemy.type === 'rhino'
                ? `${enemy.width * 6}px ${enemy.height * 4}px`
                : `${enemy.width * 3}px ${enemy.height * 4}px`,
              backgroundPosition: `-${enemy.frameX * enemy.width}px -${enemy.frameY * enemy.height}px`,
              filter: enemy.type === 'boss' ? 'drop-shadow(0 0 8px rgba(234,179,8,0.6))' : 'none'
            }}
          >
            {/* Boss health bar */}
            {enemy.type === 'boss' && enemy.lives > 0 && (
              <div className="absolute -top-6 left-0 right-0">
                <div className="bg-black/80 rounded-full h-2 overflow-hidden border border-yellow-500/50">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                    style={{ 
                      width: `${(enemy.lives / 300) * 100}%`,
                      boxShadow: '0 0 8px rgba(234,179,8,0.8)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pause Menu Popover */}
      {pauseMenuOpen && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              playSound(buttonClickAudioRef);
              setIsPaused(false);
              setPauseMenuOpen(false);
              if (!isMuted && gameplayBgAudioRef.current) {
                gameplayBgAudioRef.current.play().catch(() => {});
              }
            }}
          />

          {/* Panel */}
          <div className="relative w-80 rounded-3xl bg-gradient-to-b from-purple-900 to-purple-800 p-6 shadow-2xl">
            
            {/* Close Button */}
            <button
              onClick={() => {
                playSound(buttonClickAudioRef);
                setIsPaused(false);
                setPauseMenuOpen(false);
                if (!isMuted && gameplayBgAudioRef.current) {
                  gameplayBgAudioRef.current.play().catch(() => {});
                }
              }}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-500 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95"
            >
              ×
            </button>

            {/* Buttons */}
            <div className="flex flex-col gap-4">
              {/* Resume Button */}
              <button
                onClick={() => {
                  playSound(buttonClickAudioRef);
                  setIsPaused(false);
                  setPauseMenuOpen(false);
                  if (!isMuted && gameplayBgAudioRef.current) {
                    gameplayBgAudioRef.current.play().catch(() => {});
                  }
                }}
                className="relative flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_18px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
              >
                <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
                <span className="relative z-10 flex items-center gap-3 text-white font-extrabold text-lg">
                  RESUME
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </span>
              </button>

              {/* Restart Button */}
              <button
                onClick={restart}
                className="relative flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_18px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
              >
                <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
                <span className="relative z-10 flex items-center gap-3 text-white font-extrabold text-lg">
                  RESTART
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1H5a7 7 0 1 0 7-8Z"/>
                  </svg>
                </span>
              </button>

              {/* Home Button */}
              <button
                onClick={goHome}
                className="relative flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_18px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
              >
                <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
                <span className="relative z-10 flex items-center gap-3 text-white font-extrabold text-lg">
                  HOME
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Touch Drag Area for Movement - Full Screen */}
      {gameStarted && !gameOver && !isPaused && (
        <div
          className="absolute inset-0 z-10"
          onTouchStart={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            playerRef.current.x = touchX - playerRef.current.width / 2;
            playerRef.current.x = Math.max(-playerRef.current.width * 0.5, Math.min(GAME_WIDTH - playerRef.current.width * 0.5, playerRef.current.x));
          }}
          onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            playerRef.current.x = touchX - playerRef.current.width / 2;
            playerRef.current.x = Math.max(-playerRef.current.width * 0.5, Math.min(GAME_WIDTH - playerRef.current.width * 0.5, playerRef.current.x));
          }}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            playerRef.current.x = mouseX - playerRef.current.width / 2;
            playerRef.current.x = Math.max(-playerRef.current.width * 0.5, Math.min(GAME_WIDTH - playerRef.current.width * 0.5, playerRef.current.x));
          }}
          onMouseMove={(e) => {
            if (e.buttons === 1) {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              playerRef.current.x = mouseX - playerRef.current.width / 2;
              playerRef.current.x = Math.max(-playerRef.current.width * 0.5, Math.min(GAME_WIDTH - playerRef.current.width * 0.5, playerRef.current.x));
            }
          }}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Laser Controls - Only Small and Big Laser */}
      {gameStarted && !gameOver && !isPaused && (
        <>
          {/* SMALL LASER - Bottom Left */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              handleTouchStart('s');
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleTouchEnd('s');
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleTouchStart('s');
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              handleTouchEnd('s');
            }}
            className="absolute bottom-6 left-2 w-20 h-20 rounded-2xl bg-gradient-to-b from-green-400 to-green-600 border-4 border-green-300 shadow-[0_0_18px_rgba(0,0,0,0.5)] active:scale-95 transition-transform flex items-center justify-center z-30"
          >
            <span className="absolute inset-1 rounded-xl bg-black/20"></span>
            <div className="relative z-10">
              <SmallLaserIcon />
            </div>
          </button>

          {/* BIG LASER - Bottom Right */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              handleTouchStart('d');
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleTouchEnd('d');
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleTouchStart('d');
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              handleTouchEnd('d');
            }}
            className="absolute bottom-6 right-2 w-20 h-20 rounded-2xl bg-gradient-to-b from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-[0_0_18px_rgba(0,0,0,0.5)] active:scale-95 transition-transform flex items-center justify-center z-30"
          >
            <span className="absolute inset-1 rounded-xl bg-black/20"></span>
            <div className="relative z-10">
              <BigLaserIcon />
            </div>
          </button>
        </>
      )}

      {/* Start Screen - Redesigned */}
      {!gameStarted && !gameOver && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/img/home-bg.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Top Right: Coins Counter (Clean - just icon and number) */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <img src="/assets/img/coin.png" alt="coin" className="w-8 h-8" />
            <span className="text-white text-2xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {totalCoins}
            </span>
          </div>
          
          {/* Center: Start Button (Game Button style) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startGame}
              className="relative flex items-center justify-center px-12 mt-64 h-16 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_20px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
            >
              <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
              <span className="relative z-10 text-white font-bold text-xl">START</span>
            </button>
          </div>
          
          {/* Bottom Left: Settings Button (Icon Only) */}
          <button
            onClick={() => {
              playSound(menuOpenAudioRef);
              setSettingsOpen(!settingsOpen);
            }}
            className="absolute bottom-12 left-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_20px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
          >
            <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
            <span className="relative z-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.07 7.07 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.77 14.5a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.39.32.6.22l2.39-.96c.51.4 1.05.71 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.21.1.47.01.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.56ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"/>
              </svg>
            </span>
          </button>
          
          {/* Bottom Right: Ships Button (Icon Only) */}
          <button
            onClick={() => {
              playSound(menuOpenAudioRef);
              setShipsOpen(!shipsOpen);
            }}
            className="absolute bottom-12 right-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_20px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
          >
            <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
            <span className="relative z-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 2c-3.87 0-7 3.13-7 7 0 1.54.5 2.96 1.34 4.1L4 22l4.9-2.34A6.96 6.96 0 0 0 12 20c3.87 0 7-3.13 7-7s-3.13-11-7-11Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
              </svg>
            </span>
          </button>
          
          {/* Settings Popover */}
          {settingsOpen && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => {
                  playSound(buttonClickAudioRef);
                  setSettingsOpen(false);
                }}
              />

              {/* Panel */}
              <div className="relative w-80 rounded-3xl bg-gradient-to-b from-purple-900 to-purple-800 p-6 shadow-2xl">
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    playSound(buttonClickAudioRef);
                    setSettingsOpen(false);
                  }}
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-500 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95"
                >
                  ×
                </button>

                {/* Buttons */}
                <div className="flex flex-col gap-5">
                  {/* Mute Button */}
                  <button
                    onClick={() => {
                      playSound(buttonClickAudioRef);
                      setIsMuted(!isMuted);
                    }}
                    className="relative flex items-center justify-center gap-3 h-16 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_18px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
                  >
                    <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
                    <span className="relative z-10 flex items-center gap-3 text-white font-extrabold text-xl">
                      {isMuted ? 'UNMUTE' : 'MUTE'}
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                        {isMuted ? (
                          <>
                            <path d="M16.5 12 19 14.5 17.5 16 15 13.5 12.5 16 11 14.5 13.5 12 11 9.5 12.5 8 15 10.5 17.5 8 19 9.5 16.5 12Z"/>
                            <path d="M3 9v6h4l5 5V4L7 9H3Z"/>
                          </>
                        ) : (
                          <>
                            <path d="M3 9v6h4l5 5V4L7 9H3Z"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07l1.42 1.42a7 7 0 0 0 0-9.9l-1.42 1.41Z"/>
                            <path d="M18.36 5.64a9 9 0 0 1 0 12.73l1.42 1.42a11 11 0 0 0 0-15.56l-1.42 1.41Z"/>
                          </>
                        )}
                      </svg>
                    </span>
                  </button>

                  {/* Reset Button */}
                  <button
                    onClick={resetProgress}
                    className="relative flex items-center justify-center gap-3 h-16 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_18px_rgba(255,140,0,0.6)] active:scale-95 transition-transform"
                  >
                    <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
                    <span className="relative z-10 flex items-center gap-3 text-white font-extrabold text-xl">
                      RESET
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                        <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1H5a7 7 0 1 0 7-8Z"/>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Ships Popover */}
          {shipsOpen && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => {
                  playSound(buttonClickAudioRef);
                  setShipsOpen(false);
                }}
              />

              {/* Panel */}
              <div className="relative w-80 rounded-3xl bg-gradient-to-b from-purple-900 to-purple-800 p-6 shadow-2xl">
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    playSound(buttonClickAudioRef);
                    setShipsOpen(false);
                  }}
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-500 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95"
                >
                  ×
                </button>

                {/* Coming Soon Content */}
                <div className="text-center py-8">
                  <div className="text-7xl mb-6">🚀</div>
                  <p className="text-yellow-400 text-3xl font-bold mb-3" style={{ textShadow: '0 0 10px rgba(234,179,8,0.6)' }}>
                    COMING SOON
                  </p>
                  <p className="text-white/80 text-base leading-relaxed">
                    Unlock powerful ships with your collected coins!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Modal - Enhanced */}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Gameplay Background */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/assets/img/Gameplay_Background.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3
            }}
          />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Custom GAME OVER Text */}
            <div className="mb-6 flex justify-center">
              <div className="flex">
                {'GAME OVER'.split('').map((char, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: '#a855f7',
                      textShadow: '0 0 8px #7c3aed, 0 0 16px #6d28d9, 0 0 24px #5b21b6',
                      WebkitTextStroke: '2px #fbbf24',
                      display: 'inline-block',
                      margin: '0 2px'
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Score Card */}
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-8 py-6 mb-6 border border-red-500/30 shadow-lg">
              <div className="text-center mb-4">
                <div className="text-gray-400 text-xs mb-1">FINAL SCORE</div>
                <div className="text-5xl font-bold text-white mb-3" style={{ textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>
                  {score}
                </div>
              </div>
              
              <div className="flex justify-center gap-8 mb-2">
                <div className="flex items-center gap-2">
                  <img src="/assets/img/coin.png" alt="coin" className="w-6 h-6" />
                  <div className="text-xl font-bold text-white">{totalCoins}</div>
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col gap-3 w-64">
              {/* Resume with Coins Button */}
              <button
                onClick={resumeWithCoins}
                disabled={totalCoins < 5000}
                className={`relative flex items-center justify-center gap-2 h-14 rounded-2xl border-4 shadow-lg transition-all ${
                  totalCoins >= 5000
                    ? 'bg-gradient-to-b from-green-500 to-green-700 border-green-300 shadow-[0_0_18px_rgba(34,197,94,0.6)] active:scale-95'
                    : 'bg-gradient-to-b from-gray-600 to-gray-800 border-gray-500 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="absolute inset-1 rounded-xl bg-black/20"></span>
                <span className="relative z-10 flex items-center gap-2 text-white font-extrabold text-base">
                  <img src="/assets/img/coin.png" alt="coin" className="w-5 h-5" />
                  5000 - RESUME
                </span>
              </button>

              {/* Play Again Button */}
              <button
                onClick={restart}
                className="relative flex items-center justify-center h-14 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_18px_rgba(255,140,0,0.6)] active:scale-95 transition-all"
              >
                <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
                <span className="relative z-10 text-white font-extrabold text-lg">START AGAIN</span>
              </button>

              {/* Home Button */}
              <button
                onClick={goHome}
                className="relative flex items-center justify-center h-12 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 border-4 border-orange-400 shadow-[0_0_18px_rgba(255,140,0,0.6)] active:scale-95 transition-all"
              >
                <span className="absolute inset-1 rounded-xl bg-purple-600 opacity-80"></span>
                <span className="relative z-10 text-white font-extrabold text-base">HOME</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
