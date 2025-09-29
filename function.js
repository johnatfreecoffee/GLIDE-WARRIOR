window.function = function (playerName, characterType, difficulty, startLevel, levelData, coopMode, player2Name) {
  const name = playerName.value || 'WARRIOR';
  const charType = (characterType.value || 'soldier').toLowerCase();
  const diff = (difficulty.value || 'normal').toLowerCase();
  const level = Math.max(1, Math.min(3, startLevel.value || 1));
  const customLevel = levelData.value || null;
  const coop = (coopMode.value || 'false').toLowerCase() === 'true';
  const p2name = player2Name.value || 'PLAYER 2';
  
  try {
    const gamePage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Glide Warrior ULTRA</title>
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
    </style>
</head>
<body>
    <script>
        // ============ GAME CONFIGURATION ============
        const PLAYER_NAME = '${name}';
        const PLAYER2_NAME = '${p2name}';
        const CHARACTER_TYPE = '${charType}';
        const DIFFICULTY = '${diff}';
        const START_LEVEL = ${level};
        const COOP_MODE = ${coop};
        const CUSTOM_LEVEL_DATA = ${customLevel ? `\`${customLevel}\`` : 'null'};
        
        // Character stats
        const characterStats = {
            soldier: { speed: 4, jumpPower: 12, color: [0, 255, 255], health: 3, special: 'balanced' },
            speedster: { speed: 6, jumpPower: 14, color: [255, 255, 0], health: 2, special: 'doubleJump' },
            tank: { speed: 3, jumpPower: 10, color: [255, 100, 0], health: 5, special: 'armor' },
            ninja: { speed: 5, jumpPower: 13, color: [138, 43, 226], health: 2, special: 'dash' }
        };
        
        // Difficulty settings
        const difficultySettings = {
            easy: { enemySpeed: 1, enemyHealth: 2, enemyCount: 3, playerLives: 5 },
            normal: { enemySpeed: 1.5, enemyHealth: 3, enemyCount: 5, playerLives: 3 },
            hard: { enemySpeed: 2, enemyHealth: 4, enemyCount: 7, playerLives: 2 }
        };
        
        const settings = difficultySettings[DIFFICULTY] || difficultySettings.normal;
        const charStats = characterStats[CHARACTER_TYPE] || characterStats.soldier;
        
        // Weapon types
        const WEAPONS = {
            PISTOL: { name: 'PISTOL', damage: 1, cooldown: 15, spread: 1 },
            SPREAD: { name: 'SPREAD', damage: 1, cooldown: 20, spread: 3 },
            LASER: { name: 'LASER', damage: 2, cooldown: 8, spread: 1 },
            MISSILE: { name: 'MISSILE', damage: 3, cooldown: 30, spread: 1 }
        };
        
        // ============ GAME STATE ============
        let players = [];
        let enemies = [];
        let bullets = [];
        let platforms = [];
        let powerups = [];
        let particles = [];
        let destructibles = [];
        let score = 0;
        let lives = settings.playerLives;
        let currentLevel = START_LEVEL;
        let gameState = 'playing';
        let cameraX = 0;
        let levelWidth = 3000;
        let spawnTimer = 0;
        let bossActive = false;
        let boss = null;
        let highScore = parseInt(localStorage.getItem('glideWarriorHighScore') || '0');
        let finalScoreOutput = '';
        
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
            destructibles = [];
            bossActive = false;
            boss = null;
            
            // Create players
            players = [];
            players.push(new Player(100, 300, PLAYER_NAME, CHARACTER_TYPE, 1));
            if (COOP_MODE) {
                players.push(new Player(150, 300, PLAYER2_NAME, 'tank', 2));
            }
            
            // Load custom level or use default
            if (CUSTOM_LEVEL_DATA) {
                try {
                    loadCustomLevel(JSON.parse(CUSTOM_LEVEL_DATA));
                    return;
                } catch (e) {
                    console.error('Custom level parse error:', e);
                }
            }
            
            // Default level generation
            platforms = [];
            platforms.push(new Platform(0, height - 50, levelWidth, 50, false));
            
            if (level === 1) {
                platforms.push(new Platform(300, 450, 200, 20, false));
                platforms.push(new Platform(600, 350, 200, 20, false));
                platforms.push(new Platform(900, 450, 200, 20, false));
                platforms.push(new Platform(1200, 350, 200, 20, false));
                platforms.push(new Platform(1500, 250, 200, 20, false));
                
                // Destructible crates
                destructibles.push(new Destructible(500, 400, 40, 40));
                destructibles.push(new Destructible(800, 300, 40, 40));
                destructibles.push(new Destructible(1100, 300, 40, 40));
                destructibles.push(new Destructible(1400, 200, 40, 40));
                
            } else if (level === 2) {
                platforms.push(new Platform(200, 450, 150, 20, false));
                platforms.push(new Platform(450, 350, 150, 20, false));
                platforms.push(new Platform(700, 450, 150, 20, false));
                platforms.push(new Platform(950, 300, 150, 20, false));
                platforms.push(new Platform(1200, 450, 150, 20, false));
                
                destructibles.push(new Destructible(350, 400, 40, 40));
                destructibles.push(new Destructible(390, 400, 40, 40));
                destructibles.push(new Destructible(600, 400, 40, 40));
                destructibles.push(new Destructible(900, 250, 40, 40));
                destructibles.push(new Destructible(1100, 400, 40, 40));
                
            } else if (level === 3) {
                platforms.push(new Platform(250, 400, 120, 20, false));
                platforms.push(new Platform(500, 300, 120, 20, false));
                platforms.push(new Platform(750, 450, 120, 20, false));
                platforms.push(new Platform(1000, 250, 120, 20, false));
                platforms.push(new Platform(1250, 400, 120, 20, false));
                
                destructibles.push(new Destructible(400, 350, 40, 40));
                destructibles.push(new Destructible(650, 400, 40, 40));
                destructibles.push(new Destructible(950, 200, 40, 40));
            }
        }
        
        function loadCustomLevel(data) {
            platforms = [];
            destructibles = [];
            
            // Add ground
            platforms.push(new Platform(0, height - 50, data.width || 3000, 50, false));
            levelWidth = data.width || 3000;
            
            // Add custom platforms
            if (data.platforms) {
                for (let p of data.platforms) {
                    platforms.push(new Platform(p.x, p.y, p.w, p.h, p.destructible || false));
                }
            }
            
            // Add destructibles
            if (data.destructibles) {
                for (let d of data.destructibles) {
                    destructibles.push(new Destructible(d.x, d.y, d.w || 40, d.h || 40));
                }
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
            // Camera follow main player
            let mainPlayer = players[0];
            cameraX = lerp(cameraX, mainPlayer.x - width / 3, 0.1);
            cameraX = constrain(cameraX, 0, levelWidth - width);
            
            push();
            translate(-cameraX, 0);
            
            drawBackground();
            
            // Platforms
            for (let platform of platforms) {
                platform.show();
            }
            
            // Destructibles
            for (let i = destructibles.length - 1; i >= 0; i--) {
                destructibles[i].show();
                if (destructibles[i].destroyed) {
                    destructibles.splice(i, 1);
                }
            }
            
            // Players
            for (let player of players) {
                player.update();
                player.show();
            }
            
            // Spawn enemies
            spawnTimer++;
            if (spawnTimer > 120 && enemies.length < settings.enemyCount && !bossActive) {
                let spawnX = cameraX + width + random(100, 300);
                if (spawnX < levelWidth - 200) {
                    let enemyType = random(['ground', 'flying', 'jumping', 'tank']);
                    if (enemyType === 'flying') {
                        enemies.push(new FlyingEnemy(spawnX, random(200, 400)));
                    } else if (enemyType === 'jumping') {
                        enemies.push(new JumpingEnemy(spawnX, height - 150));
                    } else if (enemyType === 'tank') {
                        enemies.push(new TankEnemy(spawnX, height - 200));
                    } else {
                        enemies.push(new Enemy(spawnX, height - 150));
                    }
                    spawnTimer = 0;
                }
            }
            
            // Boss spawn
            if (mainPlayer.x > levelWidth - 600 && !bossActive && currentLevel >= 2) {
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
                    if (random() < 0.4) {
                        let powerupType = random(['weapon', 'health', 'coin']);
                        powerups.push(new Powerup(enemies[i].x, enemies[i].y, powerupType));
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
                
                // Hit enemies
                for (let j = enemies.length - 1; j >= 0; j--) {
                    if (bullets[i] && bullets[i].friendly && bullets[i].hits(enemies[j])) {
                        enemies[j].health -= bullets[i].damage;
                        createHitEffect(bullets[i].x, bullets[i].y);
                        if (bullets[i].type !== 'laser') {
                            bullets.splice(i, 1);
                        }
                        break;
                    }
                }
                
                // Hit boss
                if (boss && bullets[i] && bullets[i].friendly && bullets[i].hits(boss)) {
                    boss.health -= bullets[i].damage;
                    createHitEffect(bullets[i].x, bullets[i].y);
                    if (bullets[i].type !== 'laser') {
                        bullets.splice(i, 1);
                    }
                }
                
                // Hit players
                for (let player of players) {
                    if (bullets[i] && !bullets[i].friendly && bullets[i].hits(player) && player.invincible === 0) {
                        player.takeDamage(1);
                        bullets.splice(i, 1);
                        break;
                    }
                }
                
                // Hit destructibles
                for (let d of destructibles) {
                    if (bullets[i] && !d.destroyed && bullets[i].hits(d)) {
                        d.health--;
                        createHitEffect(bullets[i].x, bullets[i].y);
                        if (d.health <= 0) {
                            d.destroyed = true;
                            createExplosion(d.x, d.y);
                            score += 25;
                        }
                        if (bullets[i].type !== 'laser') {
                            bullets.splice(i, 1);
                        }
                        break;
                    }
                }
                
                // Remove off-screen
                if (bullets[i] && (bullets[i].x < cameraX - 50 || bullets[i].x > cameraX + width + 50)) {
                    bullets.splice(i, 1);
                }
            }
            
            // Update powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                powerups[i].update();
                powerups[i].show();
                
                for (let player of players) {
                    if (powerups[i].collect(player)) {
                        if (powerups[i].type === 'weapon') {
                            player.upgradeWeapon();
                        } else if (powerups[i].type === 'health') {
                            player.health = min(player.maxHealth, player.health + 1);
                        } else if (powerups[i].type === 'coin') {
                            score += 50;
                        }
                        powerups.splice(i, 1);
                        break;
                    }
                }
            }
            
            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].show();
                if (particles[i].isDead()) {
                    particles.splice(i, 1);
                }
            }
            
            pop();
            
            // Check win
            let anyPlayerAtEnd = false;
            for (let player of players) {
                if (player.x > levelWidth - 100) {
                    anyPlayerAtEnd = true;
                }
            }
            
            if (anyPlayerAtEnd) {
                if (currentLevel < 3) {
                    gameState = 'levelComplete';
                } else {
                    gameState = 'victory';
                    saveHighScore();
                }
            }
            
            // Check lose
            let allPlayersDead = true;
            for (let player of players) {
                if (player.health > 0) {
                    allPlayersDead = false;
                }
            }
            
            if (allPlayersDead) {
                gameState = 'gameover';
                saveHighScore();
            }
        }
        
        function drawBackground() {
            fill(30, 30, 60);
            noStroke();
            for (let i = 0; i < 5; i++) {
                let x = (cameraX * 0.3 + i * 400) % 800;
                rect(x - 400, 0, 400, height);
            }
            
            fill(255, 255, 100);
            for (let i = 0; i < 50; i++) {
                let x = (i * 173 + cameraX * 0.5) % levelWidth;
                let y = (i * 197) % (height - 100);
                circle(x, y, 2);
            }
        }
        
        function drawHUD() {
            fill(0, 200);
            noStroke();
            rect(0, 0, width, 60);
            
            fill(255);
            textSize(14);
            textAlign(LEFT);
            
            // Player 1 info
            text(\`P1: \${players[0].name}\`, 10, 20);
            text(\`HP: \${players[0].health}/\${players[0].maxHealth}\`, 10, 40);
            text(\`Weapon: \${players[0].weapon.name}\`, 180, 20);
            text(\`Score: \${score}\`, 350, 20);
            text(\`Level: \${currentLevel}\`, 350, 40);
            text(\`High: \${highScore}\`, 500, 20);
            
            if (COOP_MODE && players.length > 1) {
                text(\`P2: \${players[1].name}\`, 10, 57);
                text(\`HP: \${players[1].health}/\${players[1].maxHealth}\`, 180, 57);
            }
        }
        
        function showGameOver() {
            background(0);
            fill(255, 0, 0);
            textSize(64);
            textAlign(CENTER, CENTER);
            text('GAME OVER', width/2, height/2 - 80);
            
            fill(255);
            textSize(24);
            text(\`Final Score: \${score}\`, width/2, height/2 - 20);
            text(\`High Score: \${highScore}\`, width/2, height/2 + 20);
            text('Press SPACE to restart', width/2, height/2 + 60);
            
            textSize(12);
            text(\`Score Output: \${finalScoreOutput}\`, width/2, height - 30);
            text('(Copy this to save in Glide)', width/2, height - 10);
        }
        
        function showVictory() {
            background(0, 100, 0);
            fill(255, 255, 0);
            textSize(64);
            textAlign(CENTER, CENTER);
            text('VICTORY!', width/2, height/2 - 80);
            
            fill(255);
            textSize(24);
            text(\`Final Score: \${score}\`, width/2, height/2 - 20);
            text(\`High Score: \${highScore}\`, width/2, height/2 + 20);
            text(\`\${PLAYER_NAME} saved the day!\`, width/2, height/2 + 60);
            text('Press SPACE to restart', width/2, height/2 + 100);
            
            textSize(12);
            text(\`Score Output: \${finalScoreOutput}\`, width/2, height - 30);
            text('(Copy this to save in Glide)', width/2, height - 10);
        }
        
        function showLevelComplete() {
            background(0, 50, 100);
            fill(100, 255, 100);
            textSize(48);
            textAlign(CENTER, CENTER);
            text(\`LEVEL \${currentLevel} COMPLETE!\`, width/2, height/2 - 50);
            
            fill(255);
            textSize(24);
            text(\`Score: \${score}\`, width/2, height/2 + 20);
            text('Press SPACE for next level', width/2, height/2 + 60);
        }
        
        function saveHighScore() {
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('glideWarriorHighScore', highScore.toString());
            }
            finalScoreOutput = \`\${PLAYER_NAME}|\${score}|\${new Date().toISOString()}\`;
        }
        
        function keyPressed() {
            if (key === ' ') {
                if (gameState === 'gameover' || gameState === 'victory') {
                    score = 0;
                    currentLevel = START_LEVEL;
                    gameState = 'playing';
                    initLevel(currentLevel);
                } else if (gameState === 'levelComplete') {
                    currentLevel++;
                    gameState = 'playing';
                    initLevel(currentLevel);
                } else if (gameState === 'playing') {
                    players[0].jump();
                }
            }
            
            if (key === 'x' || key === 'X') {
                players[0].shoot();
            }
            
            if (key === 'c' || key === 'C') {
                players[0].dash();
            }
            
            // Player 2 controls
            if (COOP_MODE && players.length > 1) {
                if (key === 'i' || key === 'I') {
                    players[1].jump();
                }
                if (key === 'm' || key === 'M') {
                    players[1].shoot();
                }
                if (key === 'n' || key === 'N') {
                    players[1].dash();
                }
            }
        }
        
        function createExplosion(x, y) {
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(x, y, color(255, 100, 0)));
            }
        }
        
        function createHitEffect(x, y) {
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(x, y, color(255, 255, 0)));
            }
        }
        
        // ============ PLAYER CLASS ============
        class Player {
            constructor(x, y, name, charType, playerNum) {
                this.x = x;
                this.y = y;
                this.w = 30;
                this.h = 40;
                this.vx = 0;
                this.vy = 0;
                this.name = name;
                this.playerNum = playerNum;
                
                let stats = characterStats[charType] || characterStats.soldier;
                this.speed = stats.speed;
                this.jumpPower = -stats.jumpPower;
                this.color = color(stats.color);
                this.maxHealth = stats.health;
                this.health = stats.health;
                this.special = stats.special;
                
                this.gravity = 0.6;
                this.onGround = false;
                this.weapon = WEAPONS.PISTOL;
                this.shootCooldown = 0;
                this.invincible = 0;
                this.jumpsLeft = 1;
                this.dashCooldown = 0;
                this.dashing = false;
                this.dashTimer = 0;
            }
            
            update() {
                // Movement controls
                if (this.playerNum === 1) {
                    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
                        this.vx = this.dashing ? -this.speed * 2 : -this.speed;
                    } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
                        this.vx = this.dashing ? this.speed * 2 : this.speed;
                    } else {
                        this.vx = 0;
                    }
                    
                    if (keyIsDown(88)) {
                        this.shoot();
                    }
                } else if (this.playerNum === 2) {
                    if (keyIsDown(74)) { // J
                        this.vx = -this.speed;
                    } else if (keyIsDown(76)) { // L
                        this.vx = this.speed;
                    } else {
                        this.vx = 0;
                    }
                }
                
                this.x += this.vx;
                this.vy += this.gravity;
                this.y += this.vy;
                
                this.onGround = false;
                
                // Platform collision
                for (let platform of platforms) {
                    if (this.intersects(platform)) {
                        if (this.vy > 0) {
                            this.y = platform.y - this.h;
                            this.vy = 0;
                            this.onGround = true;
                            if (this.special === 'doubleJump') {
                                this.jumpsLeft = 2;
                            } else {
                                this.jumpsLeft = 1;
                            }
                        }
                    }
                }
                
                // Destructible collision
                for (let d of destructibles) {
                    if (!d.destroyed && this.intersects(d)) {
                        if (this.vy > 0) {
                            this.y = d.y - this.h;
                            this.vy = 0;
                            this.onGround = true;
                            if (this.special === 'doubleJump') {
                                this.jumpsLeft = 2;
                            } else {
                                this.jumpsLeft = 1;
                            }
                        }
                    }
                }
                
                this.x = constrain(this.x, 0, levelWidth - this.w);
                
                // Enemy collision
                if (this.invincible === 0) {
                    for (let enemy of enemies) {
                        if (this.hits(enemy)) {
                            this.takeDamage(1);
                        }
                    }
                    
                    if (boss && this.hits(boss)) {
                        this.takeDamage(2);
                    }
                }
                
                if (this.invincible > 0) this.invincible--;
                if (this.shootCooldown > 0) this.shootCooldown--;
                if (this.dashCooldown > 0) this.dashCooldown--;
                if (this.dashTimer > 0) {
                    this.dashTimer--;
                    if (this.dashTimer === 0) this.dashing = false;
                }
            }
            
            jump() {
                if (this.jumpsLeft > 0) {
                    this.vy = this.jumpPower;
                    this.jumpsLeft--;
                }
            }
            
            shoot() {
                if (this.shootCooldown === 0) {
                    if (this.weapon.spread === 1) {
                        bullets.push(new Bullet(this.x + this.w, this.y + this.h/2, 1, this.weapon, true));
                    } else if (this.weapon.spread === 3) {
                        bullets.push(new Bullet(this.x + this.w, this.y + this.h/2 - 10, 1, this.weapon, true));
                        bullets.push(new Bullet(this.x + this.w, this.y + this.h/2, 1, this.weapon, true));
                        bullets.push(new Bullet(this.x + this.w, this.y + this.h/2 + 10, 1, this.weapon, true));
                    }
                    this.shootCooldown = this.weapon.cooldown;
                }
            }
            
            dash() {
                if (this.special === 'dash' && this.dashCooldown === 0) {
                    this.dashing = true;
                    this.dashTimer = 10;
                    this.dashCooldown = 60;
                    this.invincible = 10;
                }
            }
            
            takeDamage(amount) {
                if (this.special === 'armor') {
                    amount = Math.max(1, amount - 1);
                }
                this.health -= amount;
                this.invincible = 120;
                createExplosion(this.x, this.y);
            }
            
            upgradeWeapon() {
                let weapons = [WEAPONS.PISTOL, WEAPONS.SPREAD, WEAPONS.LASER, WEAPONS.MISSILE];
                let currentIndex = weapons.findIndex(w => w.name === this.weapon.name);
                this.weapon = weapons[(currentIndex + 1) % weapons.length];
            }
            
            hits(other) {
                return this.x < other.x + other.w &&
                       this.x + this.w > other.x &&
                       this.y < other.y + other.h &&
                       this.y + this.h > other.y;
            }
            
            intersects(obj) {
                return this.x < obj.x + obj.w &&
                       this.x + this.w > obj.x &&
                       this.y + this.h > obj.y &&
                       this.y + this.h < obj.y + obj.h + this.vy;
            }
            
            show() {
                if (this.invincible % 10 < 5 || this.invincible === 0) {
                    fill(this.color);
                    stroke(red(this.color) * 0.8, green(this.color) * 0.8, blue(this.color) * 0.8);
                    strokeWeight(2);
                    rect(this.x, this.y, this.w, this.h);
                    
                    // Gun
                    fill(150);
                    rect(this.x + this.w, this.y + this.h/2 - 3, 10, 6);
                    
                    // Health bar
                    fill(0);
                    rect(this.x, this.y - 10, this.w, 4);
                    fill(0, 255, 0);
                    rect(this.x, this.y - 10, this.w * (this.health / this.maxHealth), 4);
                    
                    // Name
                    fill(255);
                    textSize(10);
                    textAlign(CENTER);
                    text(this.name, this.x + this.w/2, this.y - 15);
                }
                
                if (this.dashing) {
                    fill(255, 255, 0, 100);
                    noStroke();
                    circle(this.x + this.w/2, this.y + this.h/2, this.w * 2);
                }
            }
        }
        
        // ============ ENEMY CLASSES ============
        class Enemy {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.w = 30;
                this.h = 35;
                this.vx = -settings.enemySpeed;
                this.health = settings.enemyHealth;
                this.maxHealth = settings.enemyHealth;
                this.shootTimer = int(random(60, 180));
            }
            
            update() {
                this.x += this.vx;
                this.shootTimer--;
                if (this.shootTimer <= 0 && abs(this.x - players[0].x) < 400) {
                    bullets.push(new Bullet(this.x, this.y + this.h/2, -1, WEAPONS.PISTOL, false));
                    this.shootTimer = int(random(60, 180));
                }
            }
            
            show() {
                fill(255, 0, 0);
                stroke(200, 0, 0);
                strokeWeight(2);
                rect(this.x, this.y, this.w, this.h);
                fill(100);
                rect(this.x - 10, this.y + this.h/2 - 3, 10, 6);
                fill(0);
                rect(this.x, this.y - 8, this.w, 4);
                fill(0, 255, 0);
                rect(this.x, this.y - 8, this.w * (this.health / this.maxHealth), 4);
            }
        }
        
        class FlyingEnemy extends Enemy {
            constructor(x, y) {
                super(x, y);
                this.vx = -settings.enemySpeed * 0.8;
                this.vy = sin(frameCount * 0.05) * 2;
                this.amplitude = 50;
                this.frequency = 0.05;
            }
            
            update() {
                this.x += this.vx;
                this.y += sin(frameCount * this.frequency) * 2;
                this.y = constrain(this.y, 100, height - 150);
                
                this.shootTimer--;
                if (this.shootTimer <= 0 && abs(this.x - players[0].x) < 400) {
                    bullets.push(new Bullet(this.x, this.y + this.h/2, -1, WEAPONS.PISTOL, false));
                    this.shootTimer = int(random(40, 120));
                }
            }
            
            show() {
                fill(255, 100, 255);
                stroke(200, 50, 200);
                strokeWeight(2);
                ellipse(this.x + this.w/2, this.y + this.h/2, this.w, this.h);
                fill(100);
                rect(this.x - 10, this.y + this.h/2 - 3, 10, 6);
                fill(0);
                rect(this.x, this.y - 8, this.w, 4);
                fill(0, 255, 0);
                rect(this.x, this.y - 8, this.w * (this.health / this.maxHealth), 4);
            }
        }
        
        class JumpingEnemy extends Enemy {
            constructor(x, y) {
                super(x, y);
                this.vy = 0;
                this.gravity = 0.6;
                this.jumpTimer = int(random(60, 120));
                this.onGround = false;
            }
            
            update() {
                this.x += this.vx;
                this.vy += this.gravity;
                this.y += this.vy;
                
                this.onGround = false;
                for (let platform of platforms) {
                    if (this.intersects(platform)) {
                        this.y = platform.y - this.h;
                        this.vy = 0;
                        this.onGround = true;
                    }
                }
                
                this.jumpTimer--;
                if (this.jumpTimer <= 0 && this.onGround) {
                    this.vy = -10;
                    this.jumpTimer = int(random(60, 120));
                }
                
                this.shootTimer--;
                if (this.shootTimer <= 0 && abs(this.x - players[0].x) < 400) {
                    bullets.push(new Bullet(this.x, this.y + this.h/2, -1, WEAPONS.PISTOL, false));
                    this.shootTimer = int(random(60, 180));
                }
            }
            
            intersects(platform) {
                return this.x < platform.x + platform.w &&
                       this.x + this.w > platform.x &&
                       this.y + this.h > platform.y &&
                       this.y + this.h < platform.y + platform.h + this.vy;
            }
            
            show() {
                fill(255, 255, 0);
                stroke(200, 200, 0);
                strokeWeight(2);
                rect(this.x, this.y, this.w, this.h);
                fill(100);
                rect(this.x - 10, this.y + this.h/2 - 3, 10, 6);
                fill(0);
                rect(this.x, this.y - 8, this.w, 4);
                fill(0, 255, 0);
                rect(this.x, this.y - 8, this.w * (this.health / this.maxHealth), 4);
            }
        }
        
        class TankEnemy extends Enemy {
            constructor(x, y) {
                super(x, y);
                this.w = 50;
                this.h = 50;
                this.vx = -settings.enemySpeed * 0.5;
                this.health = settings.enemyHealth * 2;
                this.maxHealth = settings.enemyHealth * 2;
            }
            
            show() {
                fill(100, 100, 100);
                stroke(50, 50, 50);
                strokeWeight(3);
                rect(this.x, this.y, this.w, this.h);
                fill(150);
                rect(this.x - 15, this.y + this.h/2 - 5, 15, 10);
                fill(0);
                rect(this.x, this.y - 10, this.w, 5);
                fill(0, 255, 0);
                rect(this.x, this.y - 10, this.w * (this.health / this.maxHealth), 5);
            }
        }
        
        class Boss {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.w = 80;
                this.h = 100;
                this.vx = -0.5;
                this.health = 30;
                this.maxHealth = 30;
                this.shootTimer = 30;
            }
            
            update() {
                this.x += this.vx;
                if (this.x < levelWidth - 600 || this.x > levelWidth - 200) {
                    this.vx *= -1;
                }
                
                this.shootTimer--;
                if (this.shootTimer <= 0) {
                    bullets.push(new Bullet(this.x, this.y + 30, -1, WEAPONS.SPREAD, false));
                    bullets.push(new Bullet(this.x, this.y + 50, -1, WEAPONS.SPREAD, false));
                    bullets.push(new Bullet(this.x, this.y + 70, -1, WEAPONS.SPREAD, false));
                    this.shootTimer = 40;
                }
            }
            
            show() {
                fill(150, 0, 150);
                stroke(100, 0, 100);
                strokeWeight(3);
                rect(this.x, this.y, this.w, this.h);
                fill(255, 0, 0);
                circle(this.x + 20, this.y + 30, 15);
                circle(this.x + 60, this.y + 30, 15);
                fill(0);
                rect(this.x, this.y - 15, this.w, 8);
                fill(255, 0, 0);
                rect(this.x, this.y - 15, this.w * (this.health / this.maxHealth), 8);
                fill(255);
                textSize(12);
                textAlign(CENTER);
                text('BOSS', this.x + this.w/2, this.y - 20);
            }
        }
        
        // ============ OTHER CLASSES ============
        class Bullet {
            constructor(x, y, direction, weapon, friendly) {
                this.x = x;
                this.y = y;
                this.w = weapon.name === 'LASER' ? 20 : 10;
                this.h = weapon.name === 'LASER' ? 3 : 4;
                this.speed = 8 * direction;
                this.direction = direction;
                this.damage = weapon.damage;
                this.type = weapon.name.toLowerCase();
                this.friendly = friendly;
            }
            
            update() {
                this.x += this.speed;
            }
            
            hits(target) {
                return this.x < target.x + target.w &&
                       this.x + this.w > target.x &&
                       this.y < target.y + target.h &&
                       this.y + this.h > target.y;
            }
            
            show() {
                if (this.type === 'laser') {
                    stroke(0, 255, 255);
                    strokeWeight(3);
                    line(this.x, this.y, this.x + this.w, this.y);
                } else if (this.type === 'missile') {
                    fill(255, 100, 0);
                    noStroke();
                    ellipse(this.x, this.y, 12, 8);
                } else {
                    fill(this.friendly ? color(255, 255, 0) : color(255, 100, 0));
                    noStroke();
                    rect(this.x, this.y, this.w, this.h);
                }
            }
        }
        
        class Platform {
            constructor(x, y, w, h, destructible) {
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
                this.destructible = destructible;
            }
            
            show() {
                fill(100, 150, 100);
                stroke(80, 120, 80);
                strokeWeight(2);
                rect(this.x, this.y, this.w, this.h);
            }
        }
        
        class Destructible {
            constructor(x, y, w, h) {
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
                this.health = 3;
                this.destroyed = false;
            }
            
            show() {
                if (!this.destroyed) {
                    fill(139, 69, 19);
                    stroke(101, 50, 13);
                    strokeWeight(2);
                    rect(this.x, this.y, this.w, this.h);
                    
                    fill(160, 82, 45);
                    rect(this.x + 5, this.y + 5, this.w - 10, this.h - 10);
                }
            }
        }
        
        class Powerup {
            constructor(x, y, type) {
                this.x = x;
                this.y = y;
                this.w = 20;
                this.h = 20;
                this.vy = 2;
                this.type = type;
            }
            
            update() {
                this.y += this.vy;
                if (this.y > height - 70) {
                    this.y = height - 70;
                    this.vy = 0;
                }
            }
            
            collect(player) {
                return this.x < player.x + player.w &&
                       this.x + this.w > player.x &&
                       this.y < player.y + player.h &&
                       this.y + this.h > player.y;
            }
            
            show() {
                if (this.type === 'weapon') {
                    fill(255, 0, 255);
                    stroke(200, 0, 200);
                    text('W', this.x + this.w/2, this.y + this.h/2 + 5);
                } else if (this.type === 'health') {
                    fill(0, 255, 0);
                    stroke(0, 200, 0);
                    text('H', this.x + this.w/2, this.y + this.h/2 + 5);
                } else {
                    fill(255, 215, 0);
                    stroke(200, 170, 0);
                    text('★', this.x + this.w/2, this.y + this.h/2 + 5);
                }
                strokeWeight(2);
                circle(this.x + this.w/2, this.y + this.h/2, this.w);
                fill(255);
                textSize(12);
                textAlign(CENTER, CENTER);
            }
        }
        
        class Particle {
            constructor(x, y, col) {
                this.x = x;
                this.y = y;
                this.vx = random(-3, 3);
                this.vy = random(-3, 3);
                this.life = 30;
                this.col = col;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life--;
            }
            
            isDead() {
                return this.life <= 0;
            }
            
            show() {
                fill(red(this.col), green(this.col), blue(this.col), this.life * 8);
                noStroke();
                circle(this.x, this.y, 6);
            }
        }
    </script>
</body>
</html>`;
    
    const encodedHtml = encodeURIComponent(gamePage);
    return "data:text/html;charset=utf-8," + encodedHtml;
    
  } catch (error) {
    console.error('Game Error:', error);
    return undefined;
  }
}
