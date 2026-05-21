// Caveman Adventure - Core Game Engine

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game size
        this.width = 800;
        this.height = 450;
        
        // Physics constants
        this.gravity = 0.5;
        this.friction = 0.85;
        
        // Game states
        this.states = {
            START: 'START',
            PLAYING: 'PLAYING',
            GAMEOVER: 'GAMEOVER',
            CLEAR: 'CLEAR',
            VICTORY: 'VICTORY'
        };
        this.currentState = this.states.START;
        
        this.stage = 1;
        this.maxStages = 2;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('caveman_highscore')) || 0;
        
        // Active key states
        this.keys = {};
        
        // Active touch states for mobile
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            down: false,
            attack: false,
            jump: false
        };

        // Screen shake
        this.shakeAmount = 0;
        
        // Timers & counters
        this.gameTick = 0;

        // Sound preferences
        this.musicOn = true;
        this.soundOn = true;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        // Fetch HTML overlays
        this.screenStart = document.getElementById('screen-start');
        this.screenGameOver = document.getElementById('screen-gameover');
        this.screenClear = document.getElementById('screen-clear');
        this.screenVictory = document.getElementById('screen-victory');
        this.hud = document.getElementById('game-hud');
        
        this.hudHearts = document.getElementById('hud-hearts');
        this.hudFoodBar = document.getElementById('hud-food-bar');
        this.hudFoodText = document.getElementById('hud-food-text');
        this.hudScore = document.getElementById('hud-score');
        this.hudStage = document.getElementById('hud-stage');
        
        this.overScore = document.getElementById('over-score');
        this.overHighScore = document.getElementById('over-high-score');
        this.clearScore = document.getElementById('clear-score');
        this.clearBonus = document.getElementById('clear-bonus');
        this.victoryScore = document.getElementById('victory-score');
        this.victoryHighScore = document.getElementById('victory-high-score');
    }

    bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent scrolling on Space & Arrow keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            // Keyboard shortcut for attack (Space)
            if (e.code === 'Space' && this.currentState === this.states.PLAYING) {
                this.triggerPlayerAttack();
            }

            // Keyboard shortcut for jump (W)
            if (e.code === 'KeyW' && this.currentState === this.states.PLAYING) {
                this.triggerPlayerJump();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // DOM Button bindings
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.startGame(this.stage));
        document.getElementById('btn-next').addEventListener('click', () => this.nextStage());
        document.getElementById('btn-home').addEventListener('click', () => this.goToHome());

        // Audio controls
        const btnMusic = document.getElementById('btn-music');
        const btnSound = document.getElementById('btn-sound');

        btnMusic.addEventListener('click', () => {
            this.musicOn = window.gameAudio.toggleMusic();
            btnMusic.classList.toggle('toggle-active', this.musicOn);
        });

        btnSound.addEventListener('click', () => {
            this.soundOn = window.gameAudio.toggleSound();
            btnSound.classList.toggle('toggle-active', this.soundOn);
        });

        // Mobile Controls binds
        this.bindMobileButton('ctrl-left', 'left');
        this.bindMobileButton('ctrl-right', 'right');
        this.bindMobileButton('ctrl-up', 'up');
        this.bindMobileButton('ctrl-down', 'down');
        
        // Action triggers
        const btnAttack = document.getElementById('ctrl-attack');
        const btnJump = document.getElementById('ctrl-jump');

        btnAttack.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.triggerPlayerAttack();
        });
        btnAttack.addEventListener('mousedown', (e) => {
            this.triggerPlayerAttack();
        });

        btnJump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.triggerPlayerJump();
        });
        btnJump.addEventListener('mousedown', (e) => {
            this.triggerPlayerJump();
        });
    }

    bindMobileButton(elementId, commandName) {
        const el = document.getElementById(elementId);
        const startHandler = (e) => {
            e.preventDefault();
            this.touchControls[commandName] = true;
        };
        const endHandler = (e) => {
            e.preventDefault();
            this.touchControls[commandName] = false;
        };

        el.addEventListener('touchstart', startHandler);
        el.addEventListener('touchend', endHandler);
        el.addEventListener('mousedown', startHandler);
        el.addEventListener('mouseup', endHandler);
        el.addEventListener('mouseleave', endHandler);
    }

    // Trigger action jump
    triggerPlayerJump() {
        if (!this.player || this.currentState !== this.states.PLAYING) return;
        
        if (this.player.isOnGround) {
            this.player.vy = -11.5;
            this.player.isOnGround = false;
            this.player.isOnLadder = false;
            window.gameAudio.playJump();
            this.spawnDust(this.player.x + this.player.width/2, this.player.y + this.player.height);
        } else if (this.player.isOnLadder) {
            this.player.vy = -11.5;
            this.player.isOnLadder = false;
            window.gameAudio.playJump();
        }
    }

    // Trigger action attack (swing club)
    triggerPlayerAttack() {
        if (!this.player || this.currentState !== this.states.PLAYING || this.player.isAttacking) return;

        this.player.isAttacking = true;
        this.player.attackTimer = 10; // Frames duration of swinging club
        window.gameAudio.playSwing();

        // Determine club swing hit box
        const dir = this.player.direction;
        const attackBox = {
            x: dir === 1 ? this.player.x + this.player.width - 5 : this.player.x - 35,
            y: this.player.y + 5,
            w: 38,
            h: 32
        };

        // 1. Check hitting hidden blocks (Prehistorik mechanic!)
        this.hiddenTriggers.forEach(trigger => {
            if (!trigger.spawned && this.checkCollision(attackBox, trigger)) {
                trigger.spawned = true;
                this.spawnHiddenFood(trigger);
                this.shakeAmount = 4;
            }
        });

        // 2. Check hitting enemies
        this.enemies.forEach(enemy => {
            if (enemy.hp > 0 && this.checkCollision(attackBox, enemy)) {
                this.damageEnemy(enemy);
            }
        });
    }

    // Damage an enemy
    damageEnemy(enemy) {
        enemy.hp--;
        enemy.isHurt = true;
        enemy.hurtTimer = 10;
        enemy.vx = this.player.direction * 3; // knockback
        
        window.gameAudio.playHit();
        this.shakeAmount = 6;
        
        // Spawn hit particles
        this.spawnStars(enemy.x + enemy.w/2, enemy.y + enemy.h/2, 8);

        if (enemy.hp <= 0) {
            // Defeated!
            this.score += 300;
            this.spawnFloatingText("+300", enemy.x, enemy.y - 10, '#ffd166');
            
            // Drop a nice chunk of meat!
            this.foods.push({
                x: enemy.x + (enemy.w - 30)/2,
                y: enemy.y - 5,
                w: 30,
                h: 24,
                vx: (Math.random() * 2 - 1),
                vy: -5.5,
                type: 'meat',
                collected: false,
                isDropped: true // subject to gravity
            });
        }
    }

    // Spawn hidden food that pops out of air
    spawnHiddenFood(trigger) {
        window.gameAudio.playCollect(); // retro puzzle solve tone
        this.spawnStars(trigger.x + trigger.w/2, trigger.y + trigger.h/2, 6);
        this.spawnFloatingText("FOUND!", trigger.x, trigger.y - 15, '#ffb703');

        // Bouncing meat
        this.foods.push({
            x: trigger.x + (trigger.w - 30)/2,
            y: trigger.y - 15,
            w: 30,
            h: 24,
            vx: 0,
            vy: -7,
            type: trigger.foodType,
            collected: false,
            isDropped: true
        });
    }

    // Set up Stage data
    loadStage(stageNum) {
        this.stage = stageNum;
        this.gameTick = 0;
        this.cameraX = 0;
        this.shakeAmount = 0;
        this.particles = [];
        this.floatingTexts = [];

        // Build Level properties
        if (stageNum === 1) {
            this.stageWidth = 2500;
            this.foodNeeded = 10;
            
            // Player initial position
            this.player = {
                x: 100,
                y: 300,
                vx: 0,
                vy: 0,
                width: 34,
                height: 42,
                direction: 1, // 1=right, -1=left
                isOnGround: false,
                isOnLadder: false,
                isAttacking: false,
                attackTimer: 0,
                isHurt: false,
                hurtTimer: 0,
                hearts: 3,
                maxHearts: 3,
                foodCollected: 0
            };

            // Ground & Platforms [{x, y, w, h}]
            this.platforms = [
                // Base ground
                { x: 0, y: 390, w: 900, h: 60 },
                { x: 970, y: 390, w: 600, h: 60 }, // Gap 1 (900-970)
                { x: 1650, y: 390, w: 900, h: 60 }, // Gap 2 (1570-1650)
                
                // Upper platform layers
                { x: 250, y: 300, w: 180, h: 20 },
                { x: 450, y: 220, w: 220, h: 20 },
                { x: 740, y: 290, w: 120, h: 20 },
                
                // Cliff & Valley levels
                { x: 1050, y: 290, w: 150, h: 20 },
                { x: 1250, y: 210, w: 200, h: 20 },
                { x: 1150, y: 130, w: 120, h: 20 },
                
                // Island tower before goal
                { x: 1750, y: 300, w: 100, h: 20 },
                { x: 1900, y: 220, w: 180, h: 20 },
                { x: 2150, y: 310, w: 150, h: 20 }
            ];

            // Ladders [{x, y, w, h}]
            this.ladders = [
                { x: 500, y: 220, w: 24, h: 170 },
                { x: 1320, y: 210, w: 24, h: 180 },
                { x: 2000, y: 220, w: 24, h: 170 }
            ];

            // Scattered food [{x, y, w, h, type, collected}]
            this.foods = [
                { x: 180, y: 360, w: 30, h: 24, type: 'meat', collected: false },
                { x: 300, y: 270, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 350, y: 270, w: 24, h: 24, type: 'apple', collected: false },
                { x: 520, y: 180, w: 30, h: 24, type: 'meat', collected: false },
                { x: 600, y: 180, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 790, y: 250, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1100, y: 250, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1200, y: 90, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1400, y: 170, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1800, y: 260, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1980, y: 180, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2220, y: 270, w: 24, h: 24, type: 'cherry', collected: false }
            ];

            // Hidden food boxes (Prehistorik style hitting points)
            this.hiddenTriggers = [
                { x: 130, y: 220, w: 30, h: 30, foodType: 'meat', spawned: false }, // Air hit near start
                { x: 650, y: 350, w: 30, h: 30, foodType: 'meat', spawned: false }, // Floor hit near dinosaur
                { x: 1150, y: 80, w: 30, h: 30, foodType: 'apple', spawned: false }, // High cliff area
                { x: 1850, y: 350, w: 30, h: 30, foodType: 'meat', spawned: false } // Before island jumps
            ];

            // Enemies [{x, y, vx, w, h, type, hp, startX, range, isHurt, hurtTimer}]
            this.enemies = [
                { x: 400, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 1, startX: 400, range: 180, isHurt: false },
                { x: 750, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 1, startX: 750, range: 140, isHurt: false },
                { x: 1150, y: 350, vx: -1.0, w: 38, h: 36, type: 'dino', hp: 1, startX: 1150, range: 250, isHurt: false },
                { x: 1480, y: 350, vx: -1.5, w: 38, h: 36, type: 'dino', hp: 2, startX: 1480, range: 100, isHurt: false }, // Stronger dino!
                { x: 1920, y: 180, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 1, startX: 1920, range: 120, isHurt: false }
            ];

            // Level decor
            this.decor = [
                { x: 50, y: 390, type: 'tree' },
                { x: 220, y: 390, type: 'tree' },
                { x: 680, y: 390, type: 'tree' },
                { x: 1080, y: 390, type: 'tree' },
                { x: 1500, y: 390, type: 'tree' },
                { x: 1720, y: 390, type: 'tree' },
                { x: 2350, y: 390, type: 'tree' },
                
                // Clouds
                { x: 100, y: 80, type: 'cloud', w: 90 },
                { x: 400, y: 50, type: 'cloud', w: 120 },
                { x: 850, y: 100, type: 'cloud', w: 75 },
                { x: 1300, y: 60, type: 'cloud', w: 100 },
                { x: 1700, y: 90, type: 'cloud', w: 110 },
                { x: 2200, y: 60, type: 'cloud', w: 90 }
            ];

            // Goal Cave coordinates
            this.goal = { x: 2400, y: 310, w: 70, h: 80, type: 'cave' };

        } else if (stageNum === 2) {
            this.stageWidth = 2800;
            this.foodNeeded = 12;
            
            // Player initial position
            this.player = {
                x: 80,
                y: 300,
                vx: 0,
                vy: 0,
                width: 34,
                height: 42,
                direction: 1,
                isOnGround: false,
                isOnLadder: false,
                isAttacking: false,
                attackTimer: 0,
                isHurt: false,
                hurtTimer: 0,
                hearts: 3,
                maxHearts: 3,
                foodCollected: 0
            };

            // Cave platforms (more complex jumps and bottomless pits)
            this.platforms = [
                { x: 0, y: 390, w: 600, h: 60 },
                { x: 680, y: 390, w: 550, h: 60 }, // Gap 1
                { x: 1350, y: 390, w: 400, h: 60 }, // Gap 2
                { x: 1850, y: 350, w: 150, h: 100 }, // Raised cliff
                { x: 2100, y: 390, w: 700, h: 60 }, // Ending stretch

                // Upper levels
                { x: 150, y: 280, w: 150, h: 20 },
                { x: 380, y: 220, w: 120, h: 20 },
                
                // Deep Cave platforms
                { x: 740, y: 300, w: 160, h: 20 },
                { x: 850, y: 200, w: 140, h: 20 },
                { x: 700, y: 120, w: 120, h: 20 },
                
                // Middle bridge
                { x: 1300, y: 260, w: 200, h: 20 },
                { x: 1550, y: 180, w: 160, h: 20 },
                { x: 1400, y: 100, w: 120, h: 20 },

                // Pillar steps
                { x: 2150, y: 300, w: 80, h: 20 },
                { x: 2300, y: 220, w: 80, h: 20 },
                { x: 2450, y: 150, w: 80, h: 20 },
                { x: 2580, y: 260, w: 120, h: 20 }
            ];

            // Cave Ladders
            this.ladders = [
                { x: 220, y: 280, w: 24, h: 110 },
                { x: 800, y: 120, w: 24, h: 180 },
                { x: 1440, y: 100, w: 24, h: 160 }
            ];

            // Foods
            this.foods = [
                { x: 200, y: 240, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 440, y: 180, w: 24, h: 24, type: 'apple', collected: false },
                { x: 760, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 780, y: 260, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 900, y: 160, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1340, y: 220, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1620, y: 140, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1920, y: 310, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 2180, y: 260, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2320, y: 180, w: 24, h: 24, type: 'apple', collected: false },
                { x: 2620, y: 220, w: 30, h: 24, type: 'meat', collected: false }
            ];

            // Hidden Trigger Boxes
            this.hiddenTriggers = [
                { x: 50, y: 180, w: 30, h: 30, foodType: 'meat', spawned: false }, // ceiling near start
                { x: 1100, y: 350, w: 30, h: 30, foodType: 'meat', spawned: false }, // floor before gap
                { x: 1450, y: 60, w: 30, h: 30, foodType: 'meat', spawned: false }, // high bridge area
                { x: 2020, y: 180, w: 30, h: 30, foodType: 'apple', spawned: false }, // floating mystery
                { x: 2500, y: 350, w: 30, h: 30, foodType: 'meat', spawned: false } // near ending dino
            ];

            // Enemies (Spiders & Pterodactyls in the cave!)
            this.enemies = [
                // Walkers (dino)
                { x: 420, y: 350, vx: -1.3, w: 38, h: 36, type: 'dino', hp: 1, startX: 420, range: 150, isHurt: false },
                { x: 1050, y: 350, vx: -1.3, w: 38, h: 36, type: 'dino', hp: 2, startX: 1050, range: 120, isHurt: false },
                { x: 2350, y: 350, vx: -1.5, w: 38, h: 36, type: 'dino', hp: 2, startX: 2350, range: 180, isHurt: false },

                // Spiders (moving up and down)
                { x: 320, y: 120, vy: 1.0, w: 26, h: 26, type: 'spider', hp: 1, startY: 80, range: 160, dir: 1 },
                { x: 920, y: 150, vy: 0.8, w: 26, h: 26, type: 'spider', hp: 1, startY: 100, range: 140, dir: 1 },
                { x: 1680, y: 180, vy: 1.2, w: 26, h: 26, type: 'spider', hp: 1, startY: 120, range: 180, dir: 1 },

                // Flying Pterodactyls (horizontal air patrols)
                { x: 550, y: 120, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 550, range: 350, isHurt: false },
                { x: 1200, y: 80, vx: -1.8, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1200, range: 250, isHurt: false },
                { x: 2000, y: 100, vx: -2.2, w: 36, h: 28, type: 'ptero', hp: 1, startX: 2000, range: 300, isHurt: false }
            ];

            // Cave decor (Stalactites & stalagmites)
            this.decor = [
                // Stalactites (ceiling)
                { x: 100, y: 0, type: 'cave_top', h: 40 },
                { x: 300, y: 0, type: 'cave_top', h: 60 },
                { x: 600, y: 0, type: 'cave_top', h: 50 },
                { x: 900, y: 0, type: 'cave_top', h: 80 },
                { x: 1200, y: 0, type: 'cave_top', h: 40 },
                { x: 1500, y: 0, type: 'cave_top', h: 70 },
                { x: 1900, y: 0, type: 'cave_top', h: 60 },
                { x: 2200, y: 0, type: 'cave_top', h: 50 },
                { x: 2500, y: 0, type: 'cave_top', h: 70 },
                
                // Stalagmites (ground decor)
                { x: 450, y: 390, type: 'cave_bot', h: 30 },
                { x: 1150, y: 390, type: 'cave_bot', h: 40 },
                { x: 2400, y: 390, type: 'cave_bot', h: 35 }
            ];

            // Goal Portal (mystic glowing portal)
            this.goal = { x: 2680, y: 310, w: 60, h: 80, type: 'portal' };
        }
        
        this.updateHUD();
    }

    startGame(startStage = 1) {
        // Init Audio
        window.gameAudio.init();
        
        this.currentState = this.states.PLAYING;
        this.stage = startStage;
        this.loadStage(this.stage);
        
        // If restarting stage, score resets or loads stage base score. For simplicity, reset total score if stage 1.
        if (this.stage === 1) {
            this.score = 0;
        }

        // Hide overlays, show HUD
        this.screenStart.classList.add('hidden');
        this.screenGameOver.classList.add('hidden');
        this.screenClear.classList.add('hidden');
        this.screenVictory.classList.add('hidden');
        this.hud.classList.remove('hidden');

        // Play stage background music
        window.gameAudio.playBGM(this.stage);
    }

    // Move to next stage
    nextStage() {
        this.stage++;
        if (this.stage > this.maxStages) {
            this.triggerVictory();
        } else {
            this.startGame(this.stage);
        }
    }

    // Go back to home start screen
    goToHome() {
        this.currentState = this.states.START;
        this.player = null; // Clear player to show title background gradient
        this.screenVictory.classList.add('hidden');
        this.screenStart.classList.remove('hidden');
        this.hud.classList.add('hidden');
        window.gameAudio.stopBGM();
    }

    triggerGameOver() {
        this.currentState = this.states.GAMEOVER;
        this.hud.classList.add('hidden');
        this.screenGameOver.classList.remove('hidden');
        this.overScore.innerText = this.score.toLocaleString();
        
        // Save high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('caveman_highscore', this.highScore);
        }
        this.overHighScore.innerText = this.highScore.toLocaleString();
        
        window.gameAudio.playGameOver();
    }

    triggerStageClear() {
        this.currentState = this.states.CLEAR;
        this.hud.classList.add('hidden');
        this.screenClear.classList.remove('hidden');
        
        const stageScore = this.player.foodCollected * 100;
        const timeBonus = 500; // flat stage bonus
        this.score += stageScore + timeBonus;
        
        this.clearScore.innerText = (stageScore).toLocaleString();
        this.clearBonus.innerText = timeBonus.toLocaleString();
        
        window.gameAudio.playVictory();
    }

    triggerVictory() {
        this.currentState = this.states.VICTORY;
        this.hud.classList.add('hidden');
        this.screenVictory.classList.remove('hidden');
        
        this.victoryScore.innerText = this.score.toLocaleString();
        
        // Save high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('caveman_highscore', this.highScore);
        }
        this.victoryHighScore.innerText = this.highScore.toLocaleString();
        
        window.gameAudio.playVictory();
    }

    // Update Top Heads-up display
    updateHUD() {
        if (!this.player) return;
        
        // Redraw Hearts (lives)
        this.hudHearts.innerHTML = '';
        for (let i = 1; i <= this.player.maxHearts; i++) {
            const heart = document.createElement('span');
            heart.classList.add('heart-icon');
            if (i > this.player.hearts) {
                heart.classList.add('lost');
                heart.innerText = '♡';
            } else {
                heart.innerText = '♥';
            }
            this.hudHearts.appendChild(heart);
        }

        // Food progress bar
        const percent = Math.min(100, (this.player.foodCollected / this.foodNeeded) * 100);
        this.hudFoodBar.style.width = `${percent}%`;
        this.hudFoodText.innerText = `${this.player.foodCollected} / ${this.foodNeeded}`;
        
        // Bar color adjustments
        if (percent >= 100) {
            this.hudFoodBar.style.background = 'linear-gradient(to right, #00f5d4, #00bbf9)';
        } else {
            this.hudFoodBar.style.background = 'linear-gradient(to right, #06d6a0, #a7c957)';
        }

        // Score & Stage
        this.hudScore.innerText = String(this.score).padStart(6, '0');
        this.hudStage.innerText = this.stage;
    }

    // Core Game Update Loop
    update() {
        if (this.currentState !== this.states.PLAYING) return;
        
        this.gameTick++;

        // Decrease screen shake
        if (this.shakeAmount > 0) {
            this.shakeAmount -= 0.15;
            if (this.shakeAmount < 0) this.shakeAmount = 0;
        }

        // Update Player Statuses (timers)
        if (this.player.isHurt) {
            this.player.hurtTimer--;
            if (this.player.hurtTimer <= 0) this.player.isHurt = false;
        }

        if (this.player.isAttacking) {
            this.player.attackTimer--;
            if (this.player.attackTimer <= 0) {
                this.player.isAttacking = false;
            }
        }

        // Process Player Movement Input
        this.handlePlayerControls();

        // Apply Physics (Gravity & Speeds)
        this.applyPhysics();

        // Check platform and ladder collisions
        this.handleCollisions();

        // Update Entities (Enemies, Bouncing Foods, Particles)
        this.updateEntities();

        // Screen Camera bounds
        this.cameraX = this.player.x - this.width / 2 + this.player.width / 2;
        if (this.cameraX < 0) this.cameraX = 0;
        if (this.cameraX > this.stageWidth - this.width) this.cameraX = this.stageWidth - this.width;

        // Check Out of Bounds / Pitfall Death
        if (this.player.y > this.height + 50) {
            this.damagePlayer(3); // Instant death in pits
        }
    }

    handlePlayerControls() {
        // Left/Right Movements
        let isMoving = false;
        
        const keyLeft = this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left;
        const keyRight = this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right;
        const keyUp = this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.up;
        const keyDown = this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.down;

        // Duck (Crouch)
        this.player.isCrouching = keyDown && this.player.isOnGround && !this.player.isOnLadder;

        if (!this.player.isCrouching) {
            if (keyLeft) {
                this.player.vx -= 0.7;
                this.player.direction = -1;
                isMoving = true;
            } else if (keyRight) {
                this.player.vx += 0.7;
                this.player.direction = 1;
                isMoving = true;
            }
        }

        // Max horizontal speeds
        const maxSpeed = this.player.isCrouching ? 1.0 : 4.5;
        if (this.player.vx > maxSpeed) this.player.vx = maxSpeed;
        if (this.player.vx < -maxSpeed) this.player.vx = -maxSpeed;

        // Ladder mechanics
        let overlapsLadder = this.ladders.some(l => this.checkCollision(this.player, l));
        
        if (overlapsLadder) {
            if (keyUp || keyDown) {
                this.player.isOnLadder = true;
                this.player.vx = 0;
            }
        } else {
            this.player.isOnLadder = false;
        }

        if (this.player.isOnLadder) {
            this.player.vy = 0; // Cancel gravity
            
            if (keyUp) {
                this.player.vy = -3.5;
            } else if (keyDown) {
                this.player.vy = 3.5;
            }
            
            // Exit ladder if player touches ground and presses down
            if (this.player.isOnGround && keyDown) {
                this.player.isOnLadder = false;
            }
        }

        // Set animation state
        if (this.player.isHurt) {
            this.player.animState = 'hurt';
        } else if (this.player.isAttacking) {
            this.player.animState = 'hit';
        } else if (this.player.isOnLadder) {
            this.player.animState = 'walk'; // leg movement
        } else if (!this.player.isOnGround) {
            this.player.animState = 'jump';
        } else if (this.player.isCrouching) {
            this.player.animState = 'duck';
        } else if (isMoving && Math.abs(this.player.vx) > 0.2) {
            this.player.animState = 'walk';
            
            // Spawn footstep dust particles periodically
            if (this.gameTick % 12 === 0) {
                this.spawnDust(
                    this.player.x + (this.player.direction === 1 ? 0 : this.player.width),
                    this.player.y + this.player.height
                );
            }
        } else {
            this.player.animState = 'idle';
        }
    }

    applyPhysics() {
        // Friction on ground
        this.player.vx *= this.friction;

        // Apply gravity if not on ladder
        if (!this.player.isOnLadder) {
            this.player.vy += this.gravity;
            // Max fall speed limit
            if (this.player.vy > 12) this.player.vy = 12;
        }

        // Apply actual translations
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        // Level boundary clamps
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.vx = 0;
        }
        if (this.player.x > this.stageWidth - this.player.width) {
            this.player.x = this.stageWidth - this.player.width;
            this.player.vx = 0;
        }
    }

    handleCollisions() {
        this.player.isOnGround = false;

        // Don't collide with platforms while climbing ladder, unless standing on top of one
        if (this.player.isOnLadder) return;

        this.platforms.forEach(platform => {
            // Check collision with platform
            if (this.checkCollision(this.player, platform)) {
                
                // Resolve vertical top collision (landing on platform)
                const isFalling = this.player.vy > 0;
                const wasAbove = (this.player.y + this.player.height - this.player.vy) <= platform.y + 3;

                if (isFalling && wasAbove) {
                    this.player.y = platform.y - this.player.height;
                    this.player.vy = 0;
                    this.player.isOnGround = true;
                }
                
                // Resolve side wall collision (push out)
                else {
                    const isMovingRight = this.player.vx > 0;
                    const wasLeft = (this.player.x + this.player.width - this.player.vx) <= platform.x + 2;
                    
                    const isMovingLeft = this.player.vx < 0;
                    const wasRight = (this.player.x - this.player.vx) >= (platform.x + platform.w - 2);

                    if (isMovingRight && wasLeft) {
                        this.player.x = platform.x - this.player.width;
                        this.player.vx = 0;
                    } else if (isMovingLeft && wasRight) {
                        this.player.x = platform.x + platform.w;
                        this.player.vx = 0;
                    }
                }
            }
        });
    }

    updateEntities() {
        // 1. Update Bouncing/Dropping Foods
        this.foods.forEach(food => {
            if (food.collected) return;

            if (food.isDropped) {
                // Apply simple gravity
                food.vy += 0.4;
                food.x += food.vx;
                food.y += food.vy;

                // Collide with platforms
                this.platforms.forEach(plat => {
                    if (this.checkCollision(food, plat)) {
                        // bounce once or settle
                        food.y = plat.y - food.h;
                        food.vy = -food.vy * 0.4; // lose bounce energy
                        food.vx *= 0.6;
                        if (Math.abs(food.vy) < 0.8) {
                            food.vy = 0;
                            food.vx = 0;
                            food.isDropped = false;
                        }
                    }
                });
            }

            // Player collects food
            if (this.checkCollision(this.player, food)) {
                food.collected = true;
                this.player.foodCollected++;
                
                const points = food.type === 'meat' ? 200 : 100;
                this.score += points;
                
                window.gameAudio.playCollect();
                this.updateHUD();

                this.spawnFloatingText(`+${points}`, food.x, food.y - 10, '#06d6a0');
                this.spawnStars(food.x + food.w/2, food.y + food.h/2, 5);
            }
        });

        // Clean up collected foods
        this.foods = this.foods.filter(f => !f.collected);

        // 2. Update Enemies (AI)
        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;

            if (enemy.isHurt) {
                enemy.hurtTimer--;
                if (enemy.hurtTimer <= 0) enemy.isHurt = false;
            }

            // AI movement paths
            if (enemy.type === 'dino') {
                enemy.x += enemy.vx;
                
                // Patrol boundaries
                if (Math.abs(enemy.x - enemy.startX) > enemy.range) {
                    enemy.vx = -enemy.vx; // Turn around
                }
                
                // Fall resolution on ground
                enemy.vy = 4; // simulated gravity downwards
                this.platforms.forEach(plat => {
                    if (this.checkCollision(enemy, plat)) {
                        enemy.y = plat.y - enemy.h;
                        enemy.vy = 0;
                    }
                });
            } 
            
            else if (enemy.type === 'ptero') {
                // Flying float pattern
                enemy.x += enemy.vx;
                enemy.y += Math.sin(this.gameTick * 0.05) * 0.8; // wave pattern
                
                if (Math.abs(enemy.x - enemy.startX) > enemy.range) {
                    enemy.vx = -enemy.vx;
                }
            } 
            
            else if (enemy.type === 'spider') {
                // crawling up and down
                enemy.y += enemy.vy * enemy.dir;
                if (Math.abs(enemy.y - enemy.startY) > enemy.range) {
                    enemy.dir = -enemy.dir;
                }
            }

            // Damage player if touched
            if (this.checkCollision(this.player, enemy) && !this.player.isHurt) {
                this.damagePlayer(1);
            }
        });

        // Filter out dead enemies
        this.enemies = this.enemies.filter(e => e.hp > 0);

        // 3. Update goal touch
        if (this.checkCollision(this.player, this.goal)) {
            if (this.player.foodCollected >= this.foodNeeded) {
                this.triggerStageClear();
            } else {
                // Show floating helper to eat more food
                if (this.gameTick % 60 === 0) {
                    this.spawnFloatingText("배고파! 음식을 더 모아와!", this.goal.x - 40, this.goal.y - 20, '#ef476f');
                }
            }
        }

        // 4. Update Particle effects
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // 5. Update Floating Text Popups
        this.floatingTexts.forEach(t => {
            t.y -= 0.8;
            t.life--;
        });
        this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
    }

    damagePlayer(amount) {
        if (this.player.isHurt) return;

        this.player.hearts -= amount;
        this.player.isHurt = true;
        this.player.hurtTimer = 60; // 1 second invulnerability
        this.player.vx = -this.player.direction * 4; // knockback
        this.player.vy = -5.0; // little pop up
        this.player.isOnLadder = false;

        this.shakeAmount = 10;
        this.spawnStars(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 10);
        window.gameAudio.playDamage();
        this.updateHUD();

        if (this.player.hearts <= 0) {
            this.triggerGameOver();
        }
    }

    // Particle Spawners
    spawnStars(x, y, count) {
        const colors = ['#fff', '#ffd166', '#ff5e36', '#06d6a0'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 4,
                type: 'star'
            });
        }
    }

    spawnDust(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() * 10 - 5),
                y: y - 2,
                vx: (Math.random() * 1.5 - 0.75),
                vy: -Math.random() * 1.0,
                life: 15 + Math.random() * 10,
                color: 'rgba(255, 255, 255, 0.25)',
                size: 3 + Math.random() * 5,
                type: 'dust'
            });
        }
    }

    spawnFloatingText(text, x, y, color = '#fff') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            life: 45
        });
    }

    // Collision math helper (AABB box intersection)
    checkCollision(rect1, rect2) {
        const w1 = rect1.w !== undefined ? rect1.w : rect1.width;
        const h1 = rect1.h !== undefined ? rect1.h : rect1.height;
        const w2 = rect2.w !== undefined ? rect2.w : rect2.width;
        const h2 = rect2.h !== undefined ? rect2.h : rect2.height;
        return rect1.x < rect2.x + w2 &&
               rect1.x + w1 > rect2.x &&
               rect1.y < rect2.y + h2 &&
               rect1.y + h1 > rect2.y;
    }

    // Core Game Render Loop
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // If the game has not started and the player is not initialized yet,
        // draw a beautiful retro title screen backdrop to prevent crash.
        if (!this.player) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#100c26');
            gradient.addColorStop(0.6, '#31225a');
            gradient.addColorStop(1, '#ff8a5c');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
            return;
        }

        this.ctx.save();
        
        // Screen shaking translate
        if (this.shakeAmount > 0) {
            const dx = (Math.random() * 2 - 1) * this.shakeAmount;
            const dy = (Math.random() * 2 - 1) * this.shakeAmount;
            this.ctx.translate(dx, dy);
        }

        // Draw static level Backgrounds
        this.drawBackground();

        // Offset context by Camera scroll
        this.ctx.translate(-this.cameraX, 0);

        // Draw Ladders
        this.ladders.forEach(ladder => {
            window.Sprites.drawLadder(this.ctx, ladder.x, ladder.y, ladder.w, ladder.h);
        });

        // Draw Platforms
        this.drawPlatforms();

        // Draw Goal Cave/Portal
        this.drawGoal();

        // Draw Food Items
        this.foods.forEach(food => {
            if (food.type === 'meat') {
                window.Sprites.drawMeat(this.ctx, food.x, food.y, food.w, food.h);
            } else {
                window.Sprites.drawFruit(this.ctx, food.x, food.y, food.w, food.h, food.type);
            }
        });

        // Draw Enemies
        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            if (enemy.type === 'dino') {
                window.Sprites.drawDinosaur(this.ctx, enemy.x, enemy.y, enemy.w, enemy.h, this.gameTick, enemy.isHurt);
            } else if (enemy.type === 'ptero') {
                window.Sprites.drawPterodactyl(this.ctx, enemy.x, enemy.y, enemy.w, enemy.h, this.gameTick);
            } else if (enemy.type === 'spider') {
                window.Sprites.drawSpider(this.ctx, enemy.x, enemy.y, enemy.w, enemy.h, this.gameTick);
            }
        });

        // Draw Player Character (Caveman)
        const isFlashed = this.player.isHurt && (Math.floor(this.gameTick / 4) % 2 === 0);
        window.Sprites.drawCaveman(
            this.ctx, 
            this.player.x, 
            this.player.y, 
            this.player.width, 
            this.player.height, 
            this.player.animState, 
            this.player.direction, 
            this.gameTick,
            isFlashed
        );

        // Draw Club swing trace effect if attacking
        if (this.player.isAttacking && this.player.attackTimer > 4) {
            window.Sprites.drawClubEffect(
                this.ctx, 
                this.player.x, 
                this.player.y, 
                this.player.width, 
                this.player.height, 
                this.player.direction
            );
        }

        // Draw Particle effects
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            if (p.type === 'star') {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.type === 'dust') {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * (p.life / 25), 0, Math.PI * 2); // shrink over time
                this.ctx.fill();
            }
        });

        // Draw floating text popups
        this.ctx.font = `bold 10px 'Press Start 2P', monospace`;
        this.floatingTexts.forEach(t => {
            this.ctx.fillStyle = t.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(t.text, t.x, t.y);
        });

        this.ctx.restore();
    }

    drawBackground() {
        if (this.stage === 1) {
            // Stage 1 Sky (Beautiful soft gradient sky)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#100c26');
            gradient.addColorStop(0.6, '#31225a');
            gradient.addColorStop(1, '#ff8a5c');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Draw clouds & trees behind camera scroll
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.3, 0); // Parallax cloud scroll
            this.decor.forEach(d => {
                if (d.type === 'cloud') {
                    window.Sprites.drawCloud(this.ctx, d.x, d.y, d.w);
                }
            });
            this.ctx.restore();

            // Parallax trees scroll
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.7, 0);
            this.decor.forEach(d => {
                if (d.type === 'tree') {
                    window.Sprites.drawTree(this.ctx, d.x, 390, 80 + (d.x % 40));
                }
            });
            this.ctx.restore();

        } else if (this.stage === 2) {
            // Stage 2 Cave (Dark volcanic purple gradient sky/walls)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#0a0514');
            gradient.addColorStop(0.7, '#1b122e');
            gradient.addColorStop(1, '#2c1e45');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Stalactites and stalagmites (Parallax)
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.8, 0);
            this.decor.forEach(d => {
                if (d.type === 'cave_top') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 0, d.h, true);
                } else if (d.type === 'cave_bot') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 390, d.h, false);
                }
            });
            this.ctx.restore();
        }
    }

    drawPlatforms() {
        this.platforms.forEach(platform => {
            this.ctx.save();
            
            if (this.stage === 1) {
                // Green Forest Grass Platforms
                this.ctx.fillStyle = '#60993e'; // Grass top green
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                // Brown dirt base
                this.ctx.fillStyle = '#4e331c'; 
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                // Small grass strands
                this.ctx.strokeStyle = '#82c057';
                this.ctx.lineWidth = 2;
                for (let px = platform.x + 8; px < platform.x + platform.w; px += 16) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(px, platform.y);
                    this.ctx.lineTo(px + (px % 4 - 2), platform.y - 4);
                    this.ctx.stroke();
                }

            } else if (this.stage === 2) {
                // Purple/black Rock Platforms
                this.ctx.fillStyle = '#3a2d54'; // Purple cave rock top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#221a32'; // Dark interior
                this.ctx.fillRect(platform.x, platform.y + 6, platform.w, platform.h - 6);

                // Highlight rock edges
                this.ctx.strokeStyle = '#5a467f';
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    drawGoal() {
        this.ctx.save();
        if (this.goal.type === 'cave') {
            // Stage 1 Goal Cave opening (retro cave door)
            this.ctx.fillStyle = '#0f0b18';
            this.ctx.beginPath();
            this.ctx.ellipse(this.goal.x + this.goal.w/2, this.goal.y + this.goal.h, this.goal.w/2, this.goal.h, 0, Math.PI, 0);
            this.ctx.fill();
            this.ctx.strokeStyle = '#322315';
            this.ctx.lineWidth = 5;
            this.ctx.stroke();
            
            // Goal flag / text helper if food complete
            if (this.player.foodCollected >= this.foodNeeded) {
                this.ctx.fillStyle = '#06d6a0';
                this.ctx.font = "bold 9px 'Press Start 2P', monospace";
                this.ctx.textAlign = 'center';
                this.ctx.fillText("GOAL!", this.goal.x + this.goal.w/2, this.goal.y - 12);
                // Glowing border
                this.ctx.shadowColor = '#06d6a0';
                this.ctx.shadowBlur = 10;
                this.ctx.strokeStyle = '#06d6a0';
                this.ctx.stroke();
            }
        } 
        
        else if (this.goal.type === 'portal') {
            // Stage 2 Goal Portal (Mystic vortex)
            const cy = this.goal.y + this.goal.h/2;
            const cx = this.goal.x + this.goal.w/2;
            const wave = Math.sin(this.gameTick * 0.1) * 4;

            // Radiant neon glows
            const grad = this.ctx.createRadialGradient(cx, cy, 2, cx, cy, this.goal.w/2 + wave);
            grad.addColorStop(0, '#ffd166');
            grad.addColorStop(0.5, '#ff5e36');
            grad.addColorStop(1, 'rgba(15, 10, 28, 0)');
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, this.goal.w/2 + wave, 0, Math.PI * 2);
            this.ctx.fill();

            // Portal center vortex lines
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(this.gameTick * 0.05);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, this.goal.w/3, this.goal.h/2.5, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();

            if (this.player.foodCollected >= this.foodNeeded) {
                this.ctx.fillStyle = '#ffd166';
                this.ctx.font = "bold 9px 'Press Start 2P', monospace";
                this.ctx.textAlign = 'center';
                this.ctx.fillText("ESCAPE!", cx, this.goal.y - 12);
            }
        }
        this.ctx.restore();
    }
}

// Instantiate and start running
window.addEventListener('load', () => {
    const game = new Game();
    window.game = game;

    // Game loop runner
    function loop() {
        game.update();
        game.draw();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
});
