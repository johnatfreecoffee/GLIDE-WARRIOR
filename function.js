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
                particles[i].update();
                particles[i].show();
                if (particles[i].isDead()) {
                    particles.splice(i, 1);
                }
            }
            
            pop();
            
            // Check win condition
            if (player.x > levelWidth - 100) {
                if (currentLevel < 3) {
                    gameState = 'levelComplete';
                } else {
                    gameState = 'victory';
                }
            }
            
            // Check lose condition
            if (lives <= 0) {
                gameState = 'gameover';
            }
        }
        
        function drawBackground() {
            // Parallax background
            fill(30, 30, 60);
            noStroke();
            for (let i = 0; i < 5; i++) {
                let x = (cameraX * 0.3 + i * 400) % 800;
                rect(x - 400, 0, 400, height);
            }
            
            // Stars
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
            rect(0, 0, width, 40);
            
            fill(255);
            textSize(16);
            textAlign(LEFT);
            text(\`PLAYER: \${PLAYER_NAME}\`, 10, 25);
            text(\`SCORE: \${score}\`, 200, 25);
            text(\`LIVES: \${lives}\`, 400, 25);
            text(\`LEVEL: \${currentLevel}\`, 550, 25);
            text(\`DIFFICULTY: \${DIFFICULTY.toUpperCase()}\`, 650, 25);
        }
        
        function showGameOver() {
            background(0);
            fill(255, 0, 0);
            textSize(64);
            textAlign(CENTER, CENTER);
            text('GAME OVER', width/2, height/2 - 50);
            
            fill(255);
            textSize(24);
            text(\`Final Score: \${score}\`, width/2, height/2 + 20);
            text('Press SPACE to restart', width/2, height/2 + 60);
        }
        
        function showVictory() {
            background(0, 100, 0);
            fill(255, 255, 0);
            textSize(64);
            textAlign(CENTER, CENTER);
            text('VICTORY!', width/2, height/2 - 50);
            
            fill(255);
            textSize(24);
            text(\`Final Score: \${score}\`, width/2, height/2 + 20);
            text(\`\${PLAYER_NAME} saved the day!\`, width/2, height/2 + 60);
            text('Press SPACE to restart', width/2, height/2 + 100);
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
        
        function keyPressed() {
            if (key === ' ') {
                if (gameState === 'gameover') {
                    // Restart
                    score = 0;
                    lives = settings.playerLives;
                    currentLevel = START_LEVEL;
                    gameState = 'playing';
                    initLevel(currentLevel);
                } else if (gameState === 'levelComplete') {
                    currentLevel++;
                    gameState = 'playing';
                    initLevel(currentLevel);
                } else if (gameState === 'victory') {
                    score = 0;
                    lives = settings.playerLives;
                    currentLevel = START_LEVEL;
                    gameState = 'playing';
                    initLevel(currentLevel);
                } else if (gameState === 'playing') {
                    player.jump();
                }
            }
            
            if (key === 'x' || key === 'X') {
                player.shoot();
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
        
        class Player {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.w = 30;
                this.h = 40;
                this.vx = 0;
                this.vy = 0;
                this.speed = 4;
                this.jumpPower = -12;
                this.gravity = 0.6;
                this.onGround = false;
                this.shootCooldown = 0;
                this.invincible = 0;
            }
            
            update() {
                // Movement
                if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
                    this.vx = -this.speed;
                } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
                    this.vx = this.speed;
                } else {
                    this.vx = 0;
                }
                
                // Shooting
                if (keyIsDown(88)) { // X key
                    this.shoot();
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
                        }
                    }
                }
                
                // Keep in bounds
                this.x = constrain(this.x, 0, levelWidth - this.w);
                
                // Enemy collision
                if (this.invincible === 0) {
                    for (let enemy of enemies) {
                        if (this.hits(enemy)) {
                            lives--;
                            this.invincible = 120;
                            createExplosion(this.x, this.y);
                        }
                    }
                    
                    if (boss && this.hits(boss)) {
                        lives--;
                        this.invincible = 120;
                        createExplosion(this.x, this.y);
                    }
                }
                
                if (this.invincible > 0) {
                    this.invincible--;
                }
                
                if (this.shootCooldown > 0) {
                    this.shootCooldown--;
                }
            }
            
            jump() {
                if (this.onGround) {
                    this.vy = this.jumpPower;
                }
            }
            
            shoot() {
                if (this.shootCooldown === 0) {
                    bullets.push(new Bullet(this.x + this.w, this.y + this.h/2, 1));
                    this.shootCooldown = 15;
                }
            }
            
            hits(other) {
                return this.x < other.x + other.w &&
                       this.x + this.w > other.x &&
                       this.y < other.y + other.h &&
                       this.y + this.h > other.y;
            }
            
            intersects(platform) {
                return this.x < platform.x + platform.w &&
                       this.x + this.w > platform.x &&
                       this.y + this.h > platform.y &&
                       this.y + this.h < platform.y + platform.h + this.vy;
            }
            
            show() {
                if (this.invincible % 10 < 5 || this.invincible === 0) {
                    fill(0, 255, 255);
                    stroke(0, 200, 200);
                    strokeWeight(2);
                    rect(this.x, this.y, this.w, this.h);
                    
                    // Gun
                    fill(150);
                    rect(this.x + this.w, this.y + this.h/2 - 3, 10, 6);
                    
                    // Visor
                    fill(255, 0, 0);
                    rect(this.x + 5, this.y + 8, 20, 6);
                }
            }
        }
        
        class Enemy {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.w = 30;
                this.h = 35;
                this.vx = -settings.enemySpeed;
                this.health = settings.enemyHealth;
                this.shootTimer = int(random(60, 180));
            }
            
            update() {
                this.x += this.vx;
                
                this.shootTimer--;
                if (this.shootTimer <= 0 && abs(this.x - player.x) < 400) {
                    bullets.push(new Bullet(this.x, this.y + this.h/2, -1));
                    this.shootTimer = int(random(60, 180));
                }
            }
            
            show() {
                fill(255, 0, 0);
                stroke(200, 0, 0);
                strokeWeight(2);
                rect(this.x, this.y, this.w, this.h);
                
                // Gun
                fill(100);
                rect(this.x - 10, this.y + this.h/2 - 3, 10, 6);
                
                // Health bar
                fill(0);
                rect(this.x, this.y - 10, this.w, 4);
                fill(0, 255, 0);
                rect(this.x, this.y - 10, this.w * (this.health / settings.enemyHealth), 4);
            }
        }
        
        class Boss {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.w = 80;
                this.h = 100;
                this.vx = -0.5;
                this.health = 20;
                this.maxHealth = 20;
                this.shootTimer = 30;
                this.direction = -1;
            }
            
            update() {
                this.x += this.vx;
                
                // Bounce
                if (this.x < levelWidth - 600 || this.x > levelWidth - 200) {
                    this.vx *= -1;
                }
                
                this.shootTimer--;
                if (this.shootTimer <= 0) {
                    // Triple shot
                    bullets.push(new Bullet(this.x, this.y + 30, -1));
                    bullets.push(new Bullet(this.x, this.y + 50, -1));
                    bullets.push(new Bullet(this.x, this.y + 70, -1));
                    this.shootTimer = 40;
                }
            }
            
            show() {
                fill(150, 0, 150);
                stroke(100, 0, 100);
                strokeWeight(3);
                rect(this.x, this.y, this.w, this.h);
                
                // Boss features
                fill(255, 0, 0);
                circle(this.x + 20, this.y + 30, 15);
                circle(this.x + 60, this.y + 30, 15);
                
                // Health bar
                fill(0);
                rect(this.x, this.y - 15, this.w, 8);
                fill(255, 0, 0);
                rect(this.x, this.y - 15, this.w * (this.health / this.maxHealth), 8);
                
                // Label
                fill(255);
                textSize(12);
                textAlign(CENTER);
                text('BOSS', this.x + this.w/2, this.y - 20);
            }
        }
        
        class Bullet {
            constructor(x, y, direction) {
                this.x = x;
                this.y = y;
                this.w = 10;
                this.h = 4;
                this.speed = 8 * direction;
                this.direction = direction;
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
                fill(this.direction > 0 ? color(255, 255, 0) : color(255, 100, 0));
                noStroke();
                rect(this.x, this.y, this.w, this.h);
            }
        }
        
        class Platform {
            constructor(x, y, w, h) {
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
            }
            
            show() {
                fill(100, 150, 100);
                stroke(80, 120, 80);
                strokeWeight(2);
                rect(this.x, this.y, this.w, this.h);
            }
        }
        
        class Powerup {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.w = 20;
                this.h = 20;
                this.vy = 2;
            }
            
            update() {
                this.y += this.vy;
                
                // Stop at ground
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
                fill(255, 215, 0);
                stroke(200, 170, 0);
                strokeWeight(2);
                circle(this.x + this.w/2, this.y + this.h/2, this.w);
                
                fill(255);
                textSize(12);
                textAlign(CENTER, CENTER);
                text('★', this.x + this.w/2, this.y + this.h/2);
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
