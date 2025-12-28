// Next, React
import { FC, useEffect, useRef, useState } from 'react';
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
  // ==================== TYPES ====================
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
  }

  interface Projectile {
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    speed: number;
  }

  // ==================== STATE ====================
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [energy, setEnergy] = useState(50);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [, setTick] = useState(0); // Force re-renders
  const [totalCoins, setTotalCoins] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shipsOpen, setShipsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // ==================== REFS ====================
  const playerRef = useRef({ x: 145, y: 520, width: 70, height: 60, speed: 3 });
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

  // ==================== GAME CONSTANTS ====================
  const GAME_WIDTH = 360;
  const GAME_HEIGHT = 600;
  const ENEMY_SIZE = 40;
  const PLAYER_MAX_LIVES = 3;
  const SPRITE_INTERVAL = 150;

  // ==================== GAME FUNCTIONS ====================
  
  // Initialize projectile pool
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
  }, []);

  // Collision detection
  const isColliding = (rect1: any, rect2: any): boolean => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Get free projectile from pool
  const getProjectile = () => {
    return projectilesRef.current.find(p => !p.active);
  };

  // Fire projectile
  const fireProjectile = () => {
    const proj = getProjectile();
    if (proj) {
      proj.active = true;
      proj.x = playerRef.current.x + playerRef.current.width / 2 - proj.width / 2;
      proj.y = playerRef.current.y;
    }
  };

  // Spawn wave
  const spawnWave = () => {
    const newEnemies: Enemy[] = [];
    for (let row = 0; row < rowsRef.current; row++) {
      for (let col = 0; col < columnsRef.current; col++) {
        const isRhino = Math.random() < 0.3;
        newEnemies.push({
          x: 0,
          y: 0,
          width: ENEMY_SIZE,
          height: ENEMY_SIZE,
          type: isRhino ? 'rhino' : 'beetle',
          lives: isRhino ? 4 : 1,
          maxLives: isRhino ? 4 : 1,
          posX: col * ENEMY_SIZE,
          posY: row * ENEMY_SIZE,
          frameX: 0,
          frameY: Math.floor(Math.random() * 4),
          remove: false
        });
      }
    }
    enemiesRef.current = newEnemies;
    waveRef.current.x = GAME_WIDTH / 2 - (columnsRef.current * ENEMY_SIZE) / 2;
    waveRef.current.y = -rowsRef.current * ENEMY_SIZE;
    waveRef.current.speedX = Math.random() < 0.5 ? -1.5 : 1.5;
  };

  // Spawn boss
  const spawnBoss = () => {
    enemiesRef.current = [{
      x: GAME_WIDTH / 2 - 100,
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
      remove: false
    }];
    waveRef.current.speedX = Math.random() < 0.5 ? -1.5 : 1.5;
  };

  // Next wave
  const nextWave = () => {
    setWave(prev => {
      const nextWave = prev + 1;
      if (nextWave % 5 === 0) {
        spawnBoss();
      } else {
        if (Math.random() < 0.5 && columnsRef.current * ENEMY_SIZE < GAME_WIDTH * 0.8) {
          columnsRef.current++;
        } else if (rowsRef.current * ENEMY_SIZE < GAME_HEIGHT * 0.6) {
          rowsRef.current++;
        }
        if (columnsRef.current > 3) columnsRef.current = 3;
        if (rowsRef.current > 3) rowsRef.current = 3;
        spawnWave();
      }
      return nextWave;
    });
    
    setLives(prev => Math.min(prev + 1, PLAYER_MAX_LIVES));
  };

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
  const updateEnemies = () => {
    const wave = waveRef.current;
    const enemies = enemiesRef.current;
    
    if (enemies.length === 0) return;

    const isBoss = enemies[0].type === 'boss';

    if (isBoss) {
      const boss = enemies[0];
      if (boss.y < 0) {
        boss.y += 2;
      }
      if (boss.x <= 0 || boss.x >= GAME_WIDTH - boss.width) {
        wave.speedX *= -1;
        boss.y += boss.height * 0.3;
      }
      boss.x += wave.speedX * 0.5;
    } else {
      if (wave.y < 0) wave.y += 3;
      
      const waveWidth = columnsRef.current * ENEMY_SIZE;
      if (wave.x < 0 || wave.x > GAME_WIDTH - waveWidth) {
        wave.speedX *= -1;
        wave.speedY = ENEMY_SIZE;
      } else {
        wave.speedY = 0;
      }
      
      wave.x += wave.speedX;
      wave.y += wave.speedY;

      enemies.forEach(enemy => {
        enemy.x = wave.x + enemy.posX;
        enemy.y = wave.y + enemy.posY;
      });
    }
  };

  // Update lasers
  const updateLasers = () => {
    const isSmallLaser = keysRef.current.has('s');
    const isBigLaser = keysRef.current.has('d');
    
    laserActiveRef.current.small = isSmallLaser;
    laserActiveRef.current.big = isBigLaser;

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

    if (energyRef.current < PLAYER_MAX_LIVES) {
      energyRef.current = Math.min(100, energyRef.current + 0.06);
    }

    if (energyRef.current < 1) {
      energyDepletedRef.current = true;
    } else if (energyRef.current > 30) {
      energyDepletedRef.current = false;
    }

    setEnergy(Math.floor(energyRef.current));
  };

  // Check collisions
  const checkCollisions = () => {
    const player = playerRef.current;
    
    enemiesRef.current.forEach(enemy => {
      if (enemy.lives <= 0) {
        if (spriteUpdateRef.current) {
          enemy.frameX++;
          if (enemy.frameX > (enemy.type === 'boss' ? 11 : enemy.type === 'rhino' ? 5 : 2)) {
            enemy.remove = true;
            if (!gameOver) {
              setScore(prev => prev + enemy.maxLives);
            }
            if (enemy.type === 'boss') {
              bossLivesRef.current += 5;
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
          }
          return newLives;
        });
      }

      if (enemy.y + enemy.height > GAME_HEIGHT && enemy.lives > 0) {
        setGameOver(true);
      }
    });

    enemiesRef.current = enemiesRef.current.filter(e => !e.remove);

    if (enemiesRef.current.length === 0 && !gameOver && gameStarted) {
      nextWave();
    }
  };

  // Restart game
  const restart = () => {
    // Save coins earned in this session
    const newTotal = totalCoins + score;
    setTotalCoins(newTotal);
    localStorage.setItem('laserfall_coins', newTotal.toString());
    
    setScore(0);
    setLives(3);
    setEnergy(50);
    setWave(1);
    setGameOver(false);
    playerRef.current.x = 145;
    playerRef.current.y = 520;
    energyRef.current = 50;
    energyDepletedRef.current = false;
    columnsRef.current = 1;
    rowsRef.current = 1;
    bossLivesRef.current = 10;
    projectilesRef.current.forEach(p => p.active = false);
    keysRef.current.clear();
    setSettingsOpen(false);
    setShipsOpen(false);
    spawnWave();
  };

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setSettingsOpen(false);
    setShipsOpen(false);
    spawnWave();
  };
  
  // Reset all progress
  const resetProgress = () => {
    setTotalCoins(0);
    localStorage.setItem('laserfall_coins', '0');
    setSettingsOpen(false);
  };

  // ==================== EVENT HANDLERS ====================
  
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
  }, [gameOver, gameStarted]);

  // Touch handlers
  const handleTouchStart = (key: string) => {
    if (!gameStarted || gameOver) return;
    keysRef.current.add(key);
    if (key === ' ' && !projectileFiredRef.current) {
      projectileFiredRef.current = true;
      fireProjectile();
    }
  };

  const handleTouchEnd = (key: string) => {
    keysRef.current.delete(key);
    if (key === ' ') {
      projectileFiredRef.current = false;
    }
  };

  // ==================== GAME LOOP ====================
  
  useEffect(() => {
    if (!gameStarted || gameOver) return;

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
  }, [gameStarted, gameOver]);

  // ==================== RENDER ====================
  
  return (
    <div className="relative w-full h-full bg-black overflow-hidden" style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }}>
      
      {/* Starfield Background */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
      
      {/* UI - Score, Wave, Lives - Enhanced */}
      {gameStarted && !gameOver && (
        <div className="absolute top-2 left-2 right-2 z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/30 shadow-lg">
            <div className="flex items-start justify-between">
              {/* Left: Score & Wave stacked */}
              <div className="flex flex-col gap-1">
                <div
                  className="flex items-center gap-1.5 text-cyan-400 text-sm font-bold"
                  style={{ textShadow: '0 0 10px rgba(34,211,238,0.8)' }}
                >
                  <span className="text-[10px]">SCORE</span>
                  <span className="text-white">{score}</span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-purple-400 text-xs font-bold"
                  style={{ textShadow: '0 0 8px rgba(192,132,252,0.6)' }}
                >
                  <span className="text-[10px]">WAVE</span>
                  <span className="text-white">{wave}</span>
                </div>
              </div>
              
              {/* Right: Lives */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] text-red-400 font-bold">LIVES</span>
                <div className="flex gap-1">
                  {Array.from({ length: PLAYER_MAX_LIVES }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-4 border-2 rounded-sm transition-all ${
                        i < lives 
                          ? 'bg-red-500 border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                          : 'bg-transparent border-red-900/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Energy Bar - Enhanced */}
      {gameStarted && !gameOver && (
        <div className="absolute top-20 left-2 z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-yellow-500/30">
            <div className="text-[9px] text-yellow-400 font-bold mb-1">
              {energyDepletedRef.current ? '⚠️ OVERHEAT' : 'ENERGY'}
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 rounded-sm transition-all ${
                    i < Math.floor(energy / 2)
                      ? energyDepletedRef.current 
                        ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]'
                        : energy > 70
                        ? 'bg-green-400 shadow-[0_0_4px_rgba(34,197,94,0.6)]'
                        : energy > 40
                        ? 'bg-yellow-400 shadow-[0_0_4px_rgba(234,179,8,0.6)]'
                        : 'bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.6)]'
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Player Ship */}
      {gameStarted && !gameOver && (
        <div
          className="absolute transition-none"
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

      {/* Mobile Controls */}
      {gameStarted && !gameOver && (
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-2">
          <div className="flex gap-4">
            <button
              onTouchStart={() => handleTouchStart('ArrowLeft')}
              onTouchEnd={() => handleTouchEnd('ArrowLeft')}
              onMouseDown={() => handleTouchStart('ArrowLeft')}
              onMouseUp={() => handleTouchEnd('ArrowLeft')}
              className="w-14 h-14 bg-blue-600/80 rounded-lg flex items-center justify-center text-white text-2xl font-bold active:bg-blue-500"
            >
              ←
            </button>
            <button
              onTouchStart={() => handleTouchStart(' ')}
              onTouchEnd={() => handleTouchEnd(' ')}
              onMouseDown={() => handleTouchStart(' ')}
              onMouseUp={() => handleTouchEnd(' ')}
              className="w-14 h-14 bg-red-600/80 rounded-lg flex items-center justify-center text-white text-xs font-bold active:bg-red-500"
            >
              FIRE
            </button>
            <button
              onTouchStart={() => handleTouchStart('ArrowRight')}
              onTouchEnd={() => handleTouchEnd('ArrowRight')}
              onMouseDown={() => handleTouchStart('ArrowRight')}
              onMouseUp={() => handleTouchEnd('ArrowRight')}
              className="w-14 h-14 bg-blue-600/80 rounded-lg flex items-center justify-center text-white text-2xl font-bold active:bg-blue-500"
            >
              →
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onTouchStart={() => handleTouchStart('s')}
              onTouchEnd={() => handleTouchEnd('s')}
              onMouseDown={() => handleTouchStart('s')}
              onMouseUp={() => handleTouchEnd('s')}
              className="w-14 h-14 bg-green-600/80 rounded-lg flex items-center justify-center text-white text-sm font-bold active:bg-green-500"
            >
              S
            </button>
            <button
              onTouchStart={() => handleTouchStart('d')}
              onTouchEnd={() => handleTouchEnd('d')}
              onMouseDown={() => handleTouchStart('d')}
              onMouseUp={() => handleTouchEnd('d')}
              className="w-14 h-14 bg-yellow-600/80 rounded-lg flex items-center justify-center text-white text-sm font-bold active:bg-yellow-500"
            >
              D
            </button>
          </div>
        </div>
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
            onClick={() => setSettingsOpen(!settingsOpen)}
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
            onClick={() => setShipsOpen(!shipsOpen)}
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
                onClick={() => setSettingsOpen(false)}
              />

              {/* Panel */}
              <div className="relative w-80 rounded-3xl bg-gradient-to-b from-purple-900 to-purple-800 p-6 shadow-2xl">
                
                {/* Close Button */}
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-500 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95"
                >
                  ×
                </button>

                {/* Buttons */}
                <div className="flex flex-col gap-5">
                  {/* Mute Button */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
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
                onClick={() => setShipsOpen(false)}
              />

              {/* Panel */}
              <div className="relative w-80 rounded-3xl bg-gradient-to-b from-purple-900 to-purple-800 p-6 shadow-2xl">
                
                {/* Close Button */}
                <button
                  onClick={() => setShipsOpen(false)}
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
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black flex flex-col items-center justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-7xl font-bold mb-2 text-center" style={{
              background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.6))'
            }}>
              GAME OVER
            </h2>
          </div>
          
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-8 py-6 mb-8 border border-red-500/30 shadow-lg">
            <div className="text-center mb-4">
              <div className="text-gray-400 text-xs mb-1">FINAL SCORE</div>
              <div className="text-5xl font-bold text-white mb-3" style={{ textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>
                {score}
              </div>
            </div>
            
            <div className="flex justify-center gap-8 mb-2">
              <div className="flex items-center gap-2">
                <div className="text-purple-400 text-xs">WAVE</div>
                <div className="text-xl font-bold text-white">{wave}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-red-400 text-xs">LIVES</div>
                <div className="text-xl font-bold text-white">{lives}</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={restart}
            className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-bold text-xl shadow-lg transition-all"
            style={{
              boxShadow: '0 0 20px rgba(6,182,212,0.5), 0 4px 6px rgba(0,0,0,0.3)'
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};
