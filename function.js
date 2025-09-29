window.function = function (playerName, difficulty, startLevel) {
  const name = playerName.value || 'WARRIOR';
  const diff = (difficulty.value || 'normal').toLowerCase();
  const level = Math.max(1, Math.min(3, startLevel.value || 1));
  
  try {
    const gamePage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Glide Warrior</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            overflow: hidden;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Courier New', monospace;
        }
        canvas {
            display: block;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        }
        #gameInfo {
            position: absolute;
            top: 10px;
            left: 10px;
            color: #0f0;
            font-size: 14px;
            text-shadow: 2px 2px #000;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="gameInfo"></div>
    <script>
        const PLAYER_NAME = '${name}';
        const DIFFICULTY = '${diff}';
        const START_LEVEL = ${level};
        
        // Game configuration based on difficulty
        const difficultySettings = {
            easy: { enemySpeed: 1, enemyHealth: 2, enemyCount: 3, playerLives: 5 },
            normal: { enemySpeed: 1.5, enemyHealth: 3, enemyCount: 5, playerLives: 3 },
            hard: { enemySpeed: 2, enemyHealth: 4, enemyCount: 7, playerLives: 2 }
        };
        
        const settings = difficultySettings[DIFFICULTY] || difficultySettings.normal;
        
        // Game state
        let player;
        let enemies = [];
        let bullets = [];
        let platforms = [];
        let powerups = [];
        let particles = [];
        let score = 0;
        let lives = settings.playerLives;
        let currentLevel = START_LEVEL;
        let gameState = 'playing'; // playing, gameover, victory, levelComplete
        let cameraX = 0;
        let levelWidth = 3000;
        let spawnTimer = 0;
        let bossActive = false;
        let boss = null;
        
        function setup() {
            createCanvas(800, 600);
            pixelDensity(1);
            initLevel(currentLevel);
        }
        
        function initLevel(level) {
            enemies = [];
            bullets = [];
            powerups = [];
            particles = [];
            bossActive = false;
            boss = null;
            
            // Create player
            player = new Player(100, 300);
            
            // Generate platforms for the level
            platforms = [];
            platforms.push(new Platform(0, height - 50, levelWidth, 50)); // Ground
            
            // Level-specific platform layout
            if (level === 1) {
                platforms.push(new Platform(300, 450, 200, 20));
                platforms.push(new Platform(600, 350, 200, 20));
                platforms.push(new Platform(900, 450, 200, 20));
                platforms.push(new Platform(1200, 350, 200, 20));
                platforms.push(new Platform(1500, 250, 200, 20));
                platforms.push(new Platform(1800, 350, 200, 20));
                platforms.push(new Platform(2100, 450, 200, 20));
                platforms.push(new Platform(2400, 350, 300, 20));
            } else if (level === 2) {
                platforms.push(new Platform(200, 450, 150, 20));
                platforms.push(new Platform(450, 350, 150, 20));
                platforms.push(new Platform(700, 450, 150, 20));
                platforms.push(new Platform(950, 300, 150, 20));
                platforms.push(new Platform(1200, 450, 150, 20));
                platforms.push(new Platform(1450, 250, 150, 20));
                platforms.push(new Platform(1700, 400, 150, 20));
                platforms.push(new Platform(1950, 300, 150, 20));
                platforms.push(new Platform(2200, 450, 150, 20));
                platforms.push(new Platform(2450, 350, 300, 20));
            } else if (level === 3) {
                platforms.push(new Platform(250, 400, 120, 20));
                platforms.push(new Platform(500, 300, 120, 20));
                platforms.push(new Platform(750, 450, 120, 20));
                platforms.push(new Platform(1000, 250, 120, 20));
                platforms.push(new Platform(1250, 400, 120, 20));
                platforms.push(new Platform(1500, 200, 120, 20));
                platforms.push(new Platform(1750, 350, 120, 20));
                platforms.push(new Platform(2000, 450, 120, 20));
                platforms.push(new Platform(2250, 300, 120, 20));
                platforms.push(new Platform(2500, 400, 400, 20));
            }
        }
        
        function draw() {
            background(20, 20, 40);
            
            if (gameState === 'playing') {
                updateGame();
            } else if (gameState === 'gameover') {
                showGameOver();
            } else if (gameState === 'victory') {
                showVictory();
            } else if (gameState === 'levelComplete') {
                showLevelComplete();
            }
            
            drawHUD();
        }
        
        function updateGame() {
            // Camera follow player
            cameraX = lerp(cameraX, player.x - width / 3, 0.1);
            cameraX = constrain(cameraX, 0, levelWidth - width);
            
            push();
            translate(-cameraX, 0);
            
            // Draw background elements
            drawBackground();
            
            // Update and draw platforms
            for (let platform of platforms) {
                platform.show();
            }
            
            // Update and draw player
            player.update();
            player.show();
            
            // Spawn enemies
            spawnTimer++;
            if (spawnTimer > 120 && enemies.length < settings.enemyCount && !bossActive) {
                let spawnX = cameraX + width + random(100, 300);
                if (spawnX < levelWidth - 200) {
                    enemies.push(new Enemy(spawnX, height - 150));
                    spawnTimer = 0;
                }
            }
            
            // Check for boss spawn (near end of level)
            if (player.x > levelWidth - 600 && !bossActive && currentLevel >= 2) {
                bossActive = true;
                boss = new Boss(levelWidth - 400, height - 200);
            }
            
            // Update enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                enemies[i].update();
                enemies[i].show();
                
                if (enemies[i].health <= 0) {
                    score += 100;
                    createExplosion(enemies[i].x, enemies[i].y);
                    // Random powerup drop
                    if (random() < 0.3) {
                        powerups.push(new Powerup(enemies[i].x, enemies[i].y));
                    }
                    enemies.splice(i, 1);
                } else if (enemies[i].x < cameraX - 100) {
                    enemies.splice(i, 1);
                }
            }
            
            // Update boss
            if (boss) {
                boss.update();
                boss.show();
                if (boss.health <= 0) {
                    score += 1000;
                    createExplosion(boss.x, boss.y);
                    boss = null;
                    bossActive = false;
                }
            }
            
            // Update bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].update();
                bullets[i].show();
                
                // Check bullet collisions with enemies
                for (let j = enemies.length - 1; j >= 0; j--) {
                    if (bullets[i].hits(enemies[j])) {
                        enemies[j].health--;
                        createHitEffect(bullets[i].x, bullets[i].y);
                        bullets.splice(i, 1);
                        break;
                    }
                }
                
                // Check bullet collisions with boss
                if (boss && bullets[i] && bullets[i].hits(boss)) {
                    boss.health--;
                    createHitEffect(bullets[i].x, bullets[i].y);
                    bullets.splice(i, 1);
                }
                
                // Remove off-screen bullets
                if (bullets[i] && (bullets[i].x < cameraX - 50 || bullets[i].x > cameraX + width + 50)) {
                    bullets.splice(i, 1);
                }
            }
            
            // Update powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                powerups[i].update();
                powerups[i].show();
                
                if (powerups[i].collect(player)) {
                    score += 50;
                    powerups.splice(i, 1);
                }
            }
            
            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                particle
