// Caveman Adventure - Core Game Engine

// ==============================
// Firebase Configuration
// ==============================
// Replace these values with your own Firebase project config
// to enable online leaderboard. If left as placeholders,
// the game will automatically fall back to localStorage.
const firebaseConfig = {
    apiKey: "AIzaSyC1_8xkjvBaF_-SMrAQuvOlTlkbp2feIFc",
    authDomain: "egoing-da91d.firebaseapp.com",
    databaseURL: "https://egoing-da91d-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "egoing-da91d",
    storageBucket: "egoing-da91d.firebasestorage.app",
    messagingSenderId: "622933587054",
    appId: "1:622933587054:web:eb497d8cfab9438db8a27f",
    measurementId: "G-PX17N5DEH5"
};

let firebaseDB = null;
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
        firebase.initializeApp(firebaseConfig);
        firebaseDB = firebase.database();
        console.log('[CavemanAdventure] Firebase online leaderboard connected!');
    } else {
        console.log('[CavemanAdventure] Firebase not configured. Using localStorage fallback.');
    }
} catch (e) {
    console.warn('[CavemanAdventure] Firebase init failed, using localStorage fallback.', e);
    firebaseDB = null;
}

// Country flag emoji map
const COUNTRY_FLAGS = {
    'KR': '\ud83c\uddf0\ud83c\uddf7', 'US': '\ud83c\uddfa\ud83c\uddf8', 'JP': '\ud83c\uddef\ud83c\uddf5',
    'CN': '\ud83c\udde8\ud83c\uddf3', 'GB': '\ud83c\uddec\ud83c\udde7', 'CA': '\ud83c\udde8\ud83c\udde6',
    'AU': '\ud83c\udde6\ud83c\uddfa', 'VN': '\ud83c\uddfb\ud83c\uddf3', 'PH': '\ud83c\uddf5\ud83c\udded',
    'TH': '\ud83c\uddf9\ud83c\udded', 'DE': '\ud83c\udde9\ud83c\uddea', 'FR': '\ud83c\uddeb\ud83c\uddf7',
    'BR': '\ud83c\udde7\ud83c\uddf7', 'IN': '\ud83c\uddee\ud83c\uddf3', 'RU': '\ud83c\uddf7\ud83c\uddfa'
};

// Default dummy leaderboard data
const DEFAULT_LEADERBOARD = [
    { name: 'Ugg', country: 'US', time: 765200, score: 18500, perfect: false },
    { name: 'Grog', country: 'KR', time: 930150, score: 15200, perfect: false },
    { name: 'Caveboy', country: 'JP', time: 1102500, score: 12800, perfect: false }
];

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
            VICTORY: 'VICTORY',
            ENDING: 'ENDING',
            RANK_REGISTER: 'RANK_REGISTER',
            LEADERBOARD: 'LEADERBOARD'
        };
        this.currentState = this.states.START;
        
        this.stage = 1;
        this.maxStages = 10;
        this.prevAttackPressed = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('caveman_highscore')) || 0;

        // Rank Mode state
        this.isRankMode = false;
        this.rankStartTime = 0;
        this.rankElapsedTime = 0;
        this.isPerfectRun = true;
        this.rankPausedTime = 0; // accumulated time from paused segments
        
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

        this.deferredPrompt = null;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        // Fetch HTML overlays
        this.screenStart = document.getElementById('screen-start');
        this.screenGameOver = document.getElementById('screen-gameover');
        this.screenClear = document.getElementById('screen-clear');
        this.screenVictory = document.getElementById('screen-victory');
        this.screenRankRegister = document.getElementById('screen-rank-register');
        this.screenLeaderboard = document.getElementById('screen-leaderboard');
        this.hud = document.getElementById('game-hud');
        
        this.hudHearts = document.getElementById('hud-hearts');
        this.hudFoodBar = document.getElementById('hud-food-bar');
        this.hudFoodText = document.getElementById('hud-food-text');
        this.hudScore = document.getElementById('hud-score');
        this.hudStage = document.getElementById('hud-stage');
        this.hudTimeContainer = document.getElementById('hud-time-container');
        this.hudTime = document.getElementById('hud-time');
        
        this.overScore = document.getElementById('over-score');
        this.overHighScore = document.getElementById('over-high-score');
        this.clearScore = document.getElementById('clear-score');
        this.clearBonus = document.getElementById('clear-bonus');
        this.victoryScore = document.getElementById('victory-score');
        this.victoryHighScore = document.getElementById('victory-high-score');
        
        // Rank register elements
        this.rankTimeEl = document.getElementById('rank-time');
        this.rankScoreEl = document.getElementById('rank-score');
        this.rankPerfectRow = document.getElementById('rank-perfect-row');
        this.rankNameInput = document.getElementById('rank-name');
        this.rankCountrySelect = document.getElementById('rank-country');
        this.leaderboardBody = document.getElementById('leaderboard-body');
    }

    bindEvents() {
        // Prevent screen bounce and scroll gestures on mobile while playing
        document.body.addEventListener('touchmove', (e) => {
            if (this.currentState === this.states.PLAYING) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent double-tap to zoom on mobile devices
        document.body.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent scrolling on Space & Arrow keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
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
        document.getElementById('btn-start').addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                this.requestFullscreenForGame();
            }
            this.isRankMode = false;
            this.startGame();
        });
        document.getElementById('btn-restart').addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                this.requestFullscreenForGame();
            }
            this.startGame(this.stage);
        });
        document.getElementById('btn-next').addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                this.requestFullscreenForGame();
            }
            this.nextStage();
        });
        document.getElementById('btn-home').addEventListener('click', () => this.goToHome());

        // Rank Mode Button Bindings
        const btnStartRank = document.getElementById('btn-start-rank');
        if (btnStartRank) {
            btnStartRank.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    this.requestFullscreenForGame();
                }
                this.isRankMode = true;
                this.isPerfectRun = true;
                this.rankPausedTime = 0;
                this.rankStartTime = Date.now();
                this.startGame();
            });
        }

        const btnViewLeaderboard = document.getElementById('btn-view-leaderboard');
        if (btnViewLeaderboard) {
            btnViewLeaderboard.addEventListener('click', () => {
                this.showLeaderboard();
            });
        }

        const btnSubmitRank = document.getElementById('btn-submit-rank');
        if (btnSubmitRank) {
            btnSubmitRank.addEventListener('click', () => {
                this.submitRankEntry();
            });
        }

        const btnLeaderboardHome = document.getElementById('btn-leaderboard-home');
        if (btnLeaderboardHome) {
            btnLeaderboardHome.addEventListener('click', () => {
                this.goToHome();
            });
        }

        // PWA Install Event Handler
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            const btnPwaInstall = document.getElementById('btn-pwa-install');
            if (btnPwaInstall) {
                btnPwaInstall.classList.remove('hidden');
            }
        });

        // PWA Install Button Click
        const btnPwaInstall = document.getElementById('btn-pwa-install');
        if (btnPwaInstall) {
            btnPwaInstall.addEventListener('click', () => {
                this.showPwaInstallModal();
            });
        }

        // PWA Close Modal Click
        const btnPwaClose = document.getElementById('btn-pwa-close');
        if (btnPwaClose) {
            btnPwaClose.addEventListener('click', () => {
                const modal = document.getElementById('pwa-install-modal');
                if (modal) modal.classList.add('hidden');
            });
        }

        // PWA Android Install Prompt Action
        const btnPwaInstallAction = document.getElementById('btn-pwa-install-action');
        if (btnPwaInstallAction) {
            btnPwaInstallAction.addEventListener('click', () => {
                const modal = document.getElementById('pwa-install-modal');
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    this.deferredPrompt.userChoice.then((choiceResult) => {
                        console.log(`User prompt choice: ${choiceResult.outcome}`);
                        this.deferredPrompt = null;
                        const btnPwaInstall = document.getElementById('btn-pwa-install');
                        if (btnPwaInstall) btnPwaInstall.classList.add('hidden');
                    }).catch((err) => {
                        console.error('Error during PWA choice prompt:', err);
                    });
                }
                if (modal) modal.classList.add('hidden');
            });
        }

        // Check if iOS Safari (no beforeinstallprompt) to show install button immediately
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isIOS && !isStandalone) {
            if (btnPwaInstall) btnPwaInstall.classList.remove('hidden');
        }

        // Fullscreen Toggle (Desktop and Mobile)
        const btnFullscreen = document.getElementById('btn-fullscreen');
        const btnMobileFullscreen = document.getElementById('mobile-fullscreen');
        
        const handleFullscreenToggle = () => this.toggleFullscreen();
        
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', handleFullscreenToggle);
        }
        if (btnMobileFullscreen) {
            btnMobileFullscreen.addEventListener('click', handleFullscreenToggle);
            btnMobileFullscreen.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.toggleFullscreen();
            }, { passive: false });
        }
        
        // Fullscreen change listener to update both desktop & mobile icons dynamically
        document.addEventListener('fullscreenchange', () => {
            const svgDesktop = document.getElementById('svg-fullscreen');
            const svgMobile = document.getElementById('svg-mobile-fullscreen');
            
            const exitIcon = '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>';
            const enterIcon = '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>';
            
            const isFS = !!document.fullscreenElement;
            
            if (svgDesktop) {
                svgDesktop.innerHTML = isFS ? exitIcon : enterIcon;
            }
            if (svgMobile) {
                svgMobile.innerHTML = isFS ? exitIcon : enterIcon;
            }
        });

        // Mobile Audio context unlock helper (safari/chrome restriction bypass)
        const unlockAudio = () => {
            if (window.gameAudio) {
                window.gameAudio.init();
                // Clean up listeners
                window.removeEventListener('touchstart', unlockAudio);
                window.removeEventListener('mousedown', unlockAudio);
            }
        };
        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('mousedown', unlockAudio);

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

        if (btnAttack) {
            this.bindMobileButton('ctrl-attack', 'attack');
        }

        if (btnJump) {
            btnJump.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.triggerPlayerJump();
            }, { passive: false });
            btnJump.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.triggerPlayerJump();
            });
        }

        // Canvas ending screen click skip
        this.canvas.addEventListener('click', () => {
            if (this.currentState === this.states.ENDING) {
                this.triggerVictory();
            }
        });
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.currentState === this.states.ENDING) {
                e.preventDefault();
                this.triggerVictory();
            }
        }, { passive: false });
    }

    bindMobileButton(elementId, commandName) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        const startHandler = (e) => {
            e.preventDefault();
            this.touchControls[commandName] = true;
        };
        const endHandler = (e) => {
            e.preventDefault();
            this.touchControls[commandName] = false;
        };

        el.addEventListener('touchstart', startHandler, { passive: false });
        el.addEventListener('touchend', endHandler, { passive: false });
        el.addEventListener('mousedown', startHandler);
        el.addEventListener('mouseup', endHandler);
        el.addEventListener('mouseleave', endHandler);
    }

    requestFullscreenForGame() {
        const container = document.documentElement;
        if (!container) return;
        
        const requestFS = container.requestFullscreen || 
                          container.webkitRequestFullscreen || 
                          container.mozRequestFullScreen || 
                          container.msRequestFullscreen;
                          
        if (requestFS && !document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            
            requestFS.call(container).catch(err => {
                console.warn(`Fullscreen request failed: ${err.message}`);
            });
        }
    }

    toggleFullscreen() {
        const container = document.documentElement;
        if (!container) return;
        
        const isFS = document.fullscreenElement || 
                     document.webkitFullscreenElement || 
                     document.mozFullScreenElement || 
                     document.msFullscreenElement;
        
        if (!isFS) {
            this.requestFullscreenForGame();
        } else {
            const exitFS = document.exitFullscreen || 
                           document.webkitExitFullscreen || 
                           document.mozCancelFullScreen || 
                           document.msExitFullscreen;
            if (exitFS) {
                exitFS.call(document).catch(err => {
                    console.error(`Error attempting to exit fullscreen: ${err.message}`);
                });
            }
        }
    }

    showPwaInstallModal() {
        const modal = document.getElementById('pwa-install-modal');
        if (!modal) return;

        modal.classList.remove('hidden');

        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        const isInAppBrowser = /KAKAOTALK|Instagram|FBAN|FBAV|Line|NAVER/i.test(userAgent);

        const androidSection = document.getElementById('pwa-android-install');
        const iosSection = document.getElementById('pwa-ios-install');
        const inappSection = document.getElementById('pwa-inapp-install');
        const fallbackSection = document.getElementById('pwa-android-fallback');

        // Hide all sections first
        if (androidSection) androidSection.classList.add('hidden');
        if (iosSection) iosSection.classList.add('hidden');
        if (inappSection) inappSection.classList.add('hidden');
        if (fallbackSection) fallbackSection.classList.add('hidden');

        if (isInAppBrowser) {
            if (inappSection) inappSection.classList.remove('hidden');
        } else if (this.deferredPrompt) {
            if (androidSection) androidSection.classList.remove('hidden');
        } else if (isIOS) {
            if (iosSection) iosSection.classList.remove('hidden');
        } else {
            if (fallbackSection) fallbackSection.classList.remove('hidden');
        }
    }

    // Trigger action jump
    triggerPlayerJump() {
        if (!this.player || this.currentState !== this.states.PLAYING) return;
        if (this.player.isCharging || this.player.isDashing) return; // Prevent jump while charging or dashing
        
        if (this.player.isOnGround) {
            this.player.vy = -11.5;
            this.player.isOnGround = false;
            this.player.isOnLadder = false;
            this.player.jumpCount = 1;
            window.gameAudio.playJump();
            this.spawnDust(this.player.x + this.player.width/2, this.player.y + this.player.height);
        } else if (this.player.isOnLadder) {
            this.player.vy = -11.5;
            this.player.isOnLadder = false;
            this.player.jumpCount = 1;
            window.gameAudio.playJump();
        } else if (this.player.jumpCount < 2) {
            // Double Jump!
            this.player.vy = -10.5; // Slightly lower jump force in mid-air
            this.player.jumpCount = 2;
            window.gameAudio.playJump();
            // Mid-air visual effect (extra dust/star particles)
            this.spawnStars(this.player.x + this.player.width/2, this.player.y + this.player.height, 6);
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

    finishAttackCharging() {
        window.gameAudio.stopChargeSound();
        this.player.isCharging = false;
        
        if (this.player.chargeTimer >= 25) {
            // Shoot arrow!
            const arrowW = 16;
            const arrowH = 8;
            const arrowX = this.player.direction === 1 ? this.player.x + this.player.width : this.player.x - arrowW;
            const arrowY = this.player.y + this.player.height / 2 - 4;
            const arrowSpeed = 8.0;
            this.arrows.push({
                x: arrowX,
                y: arrowY,
                w: arrowW,
                h: arrowH,
                vx: this.player.direction * arrowSpeed,
                vy: 0,
                direction: this.player.direction,
                dead: false
            });
            window.gameAudio.playArrow();
            this.player.isAttacking = true;
            this.player.attackTimer = 10;
            this.player.animState = 'hit';
        } else {
            // Regular club swing
            this.triggerPlayerAttack();
        }
        this.player.chargeTimer = 0;
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
            const isBoss = enemy.type === 'boss';
            const points = isBoss ? 2000 : 300;
            this.score += points;
            this.spawnFloatingText(`+${points}`, enemy.x, enemy.y - 10, '#ffd166');
            
            if (isBoss) {
                // Drop multiple bouncing meats!
                const meatCount = this.stage === 10 ? 10 : 5;
                for (let i = 0; i < meatCount; i++) {
                    this.foods.push({
                        x: enemy.x + enemy.w / 2 - 15,
                        y: enemy.y + enemy.h / 2 - 12,
                        w: 30,
                        h: 24,
                        vx: (Math.random() * 6 - 3),
                        vy: -7 - Math.random() * 4,
                        type: 'meat',
                        collected: false,
                        isDropped: true
                    });
                }
            } else {
                // Drop a single chunk of meat!
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

    createPlayerTemplate(x, y) {
        return {
            x: x,
            y: y,
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
            foodCollected: 0,
            jumpCount: 0,
            // New mechanics state
            hasDashed: false,
            isDashing: false,
            dashTimer: 0,
            dashDirection: 1,
            isCharging: false,
            chargeTimer: 0
        };
    }

    // Set up Stage data
    loadStage(stageNum) {
        this.stage = stageNum;
        this.gameTick = 0;
        this.cameraX = 0;
        this.shakeAmount = 0;
        this.particles = [];
        this.floatingTexts = [];
        this.arrows = [];

        // Build Level properties
        if (stageNum === 1) {
            this.stageWidth = 2500;
            this.foodNeeded = 10;
            
            // Player initial position
            this.player = this.createPlayerTemplate(100, 300);

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
            this.player = this.createPlayerTemplate(80, 300);

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
        } else if (stageNum === 3) {
            // Stage 3 (Volcanic Cave)
            this.stageWidth = 2600;
            this.foodNeeded = 15;
            
            this.player = this.createPlayerTemplate(100, 300);

            this.platforms = [
                { x: 0, y: 390, w: 500, h: 60 },
                { x: 600, y: 390, w: 450, h: 60 },
                { x: 1200, y: 390, w: 600, h: 60 },
                { x: 1950, y: 390, w: 650, h: 60 },
                { x: 200, y: 300, w: 150, h: 20 },
                { x: 450, y: 220, w: 180, h: 20 },
                { x: 750, y: 300, w: 150, h: 20 },
                { x: 920, y: 210, w: 200, h: 20 },
                { x: 1300, y: 300, w: 150, h: 20 },
                { x: 1500, y: 200, w: 220, h: 20 },
                { x: 1800, y: 280, w: 120, h: 20 },
                { x: 2100, y: 200, w: 200, h: 20 },
                { x: 2350, y: 290, w: 150, h: 20 }
            ];

            this.ladders = [
                { x: 250, y: 300, w: 24, h: 90 },
                { x: 1000, y: 210, w: 24, h: 180 },
                { x: 1600, y: 200, w: 24, h: 190 },
                { x: 2200, y: 200, w: 24, h: 190 }
            ];

            this.foods = [
                { x: 150, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 250, y: 260, w: 24, h: 24, type: 'apple', collected: false },
                { x: 320, y: 260, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 500, y: 180, w: 30, h: 24, type: 'meat', collected: false },
                { x: 620, y: 350, w: 24, h: 24, type: 'apple', collected: false },
                { x: 800, y: 260, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 960, y: 170, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1350, y: 260, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1400, y: 350, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1600, y: 160, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1850, y: 240, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 2000, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2150, y: 160, w: 24, h: 24, type: 'apple', collected: false },
                { x: 2250, y: 160, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 2400, y: 250, w: 30, h: 24, type: 'meat', collected: false }
            ];

            this.hiddenTriggers = [
                { x: 380, y: 320, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 1100, y: 280, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 1700, y: 320, w: 30, h: 30, foodType: 'apple', spawned: false },
                { x: 2300, y: 320, w: 30, h: 30, foodType: 'meat', spawned: false }
            ];

            this.enemies = [
                { x: 350, y: 350, vx: -1.3, w: 38, h: 36, type: 'dino', hp: 1, startX: 350, range: 100, isHurt: false },
                { x: 800, y: 350, vx: -1.4, w: 38, h: 36, type: 'dino', hp: 2, startX: 800, range: 120, isHurt: false },
                { x: 1400, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 1, startX: 1400, range: 150, isHurt: false },
                { x: 2200, y: 350, vx: -1.5, w: 38, h: 36, type: 'dino', hp: 2, startX: 2200, range: 120, isHurt: false },
                { x: 500, y: 150, vy: 1.2, w: 26, h: 26, type: 'spider', hp: 1, startY: 100, range: 150, dir: 1 },
                { x: 1050, y: 180, vy: 1.0, w: 26, h: 26, type: 'spider', hp: 1, startY: 120, range: 140, dir: 1 },
                { x: 1650, y: 140, vy: 1.5, w: 26, h: 26, type: 'spider', hp: 1, startY: 80, range: 180, dir: 1 },
                { x: 700, y: 100, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 700, range: 250, isHurt: false },
                { x: 1300, y: 120, vx: -2.2, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1300, range: 300, isHurt: false },
                { x: 1900, y: 80, vx: -1.8, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1900, range: 200, isHurt: false }
            ];

            this.decor = [
                { x: 150, y: 0, type: 'cave_top', h: 60 },
                { x: 450, y: 0, type: 'cave_top', h: 50 },
                { x: 800, y: 0, type: 'cave_top', h: 70 },
                { x: 1100, y: 0, type: 'cave_top', h: 40 },
                { x: 1400, y: 0, type: 'cave_top', h: 80 },
                { x: 1750, y: 0, type: 'cave_top', h: 50 },
                { x: 2100, y: 0, type: 'cave_top', h: 70 },
                { x: 2400, y: 0, type: 'cave_top', h: 60 },
                { x: 300, y: 390, type: 'cave_bot', h: 40 },
                { x: 750, y: 390, type: 'cave_bot', h: 30 },
                { x: 1550, y: 390, type: 'cave_bot', h: 35 },
                { x: 2300, y: 390, type: 'cave_bot', h: 45 }
            ];

            this.goal = { x: 2500, y: 310, w: 60, h: 80, type: 'portal' };

        } else if (stageNum === 4) {
            // Stage 4 (Sky City)
            this.stageWidth = 2600;
            this.foodNeeded = 15;

            this.player = this.createPlayerTemplate(80, 300);

            this.platforms = [
                { x: 0, y: 390, w: 400, h: 60 },
                { x: 2200, y: 390, w: 400, h: 60 },
                { x: 450, y: 320, w: 150, h: 20 },
                { x: 650, y: 240, w: 150, h: 20 },
                { x: 850, y: 160, w: 180, h: 20 },
                { x: 1100, y: 240, w: 120, h: 20 },
                { x: 1280, y: 320, w: 160, h: 20 },
                { x: 1500, y: 240, w: 150, h: 20 },
                { x: 1700, y: 160, w: 180, h: 20 },
                { x: 1950, y: 260, w: 180, h: 20 },
                { x: 300, y: 220, w: 80, h: 20 },
                { x: 600, y: 120, w: 80, h: 20 },
                { x: 1050, y: 100, w: 80, h: 20 },
                { x: 1450, y: 140, w: 80, h: 20 },
                { x: 1900, y: 90, w: 80, h: 20 }
            ];

            this.ladders = [
                { x: 150, y: 220, w: 24, h: 170 },
                { x: 920, y: 160, w: 24, h: 120 },
                { x: 2350, y: 250, w: 24, h: 140 }
            ];

            this.foods = [
                { x: 120, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 320, y: 180, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 480, y: 280, w: 24, h: 24, type: 'apple', collected: false },
                { x: 520, y: 280, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 630, y: 80, w: 30, h: 24, type: 'meat', collected: false },
                { x: 720, y: 200, w: 24, h: 24, type: 'apple', collected: false },
                { x: 900, y: 120, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1080, y: 60, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1150, y: 200, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1320, y: 280, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1550, y: 200, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1750, y: 120, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1800, y: 120, w: 24, h: 24, type: 'apple', collected: false },
                { x: 2000, y: 220, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2300, y: 350, w: 24, h: 24, type: 'cherry', collected: false }
            ];

            this.hiddenTriggers = [
                { x: 200, y: 150, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 800, y: 280, w: 30, h: 30, foodType: 'apple', spawned: false },
                { x: 1400, y: 200, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 2100, y: 180, w: 30, h: 30, foodType: 'meat', spawned: false }
            ];

            this.enemies = [
                { x: 200, y: 350, vx: -1.0, w: 38, h: 36, type: 'dino', hp: 1, startX: 200, range: 80, isHurt: false },
                { x: 2300, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 2, startX: 2300, range: 100, isHurt: false },
                { x: 500, y: 220, vy: 1.0, w: 26, h: 26, type: 'spider', hp: 1, startY: 180, range: 100, dir: 1 },
                { x: 1200, y: 180, vy: 1.2, w: 26, h: 26, type: 'spider', hp: 1, startY: 140, range: 120, dir: 1 },
                { x: 1600, y: 160, vy: 0.8, w: 26, h: 26, type: 'spider', hp: 1, startY: 120, range: 100, dir: 1 },
                { x: 400, y: 100, vx: -2.2, w: 36, h: 28, type: 'ptero', hp: 1, startX: 400, range: 200, isHurt: false },
                { x: 900, y: 60, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 900, range: 250, isHurt: false },
                { x: 1400, y: 80, vx: -2.4, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1400, range: 300, isHurt: false },
                { x: 1850, y: 60, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1850, range: 200, isHurt: false }
            ];

            this.decor = [
                { x: 100, y: 80, type: 'cloud', w: 100 },
                { x: 300, y: 140, type: 'cloud', w: 80 },
                { x: 600, y: 60, type: 'cloud', w: 120 },
                { x: 900, y: 100, type: 'cloud', w: 90 },
                { x: 1200, y: 120, type: 'cloud', w: 110 },
                { x: 1500, y: 50, type: 'cloud', w: 130 },
                { x: 1800, y: 90, type: 'cloud', w: 80 },
                { x: 2150, y: 110, type: 'cloud', w: 100 }
            ];

            this.goal = { x: 2450, y: 310, w: 70, h: 80, type: 'cave' };

        } else if (stageNum === 5) {
            // Stage 5 (Ice Palace & Boss Arena)
            this.stageWidth = 2500;
            this.foodNeeded = 10;

            this.player = this.createPlayerTemplate(80, 300);

            this.platforms = [
                { x: 0, y: 390, w: 400, h: 60 },
                { x: 500, y: 390, w: 300, h: 60 },
                { x: 900, y: 390, w: 350, h: 60 },
                { x: 1350, y: 390, w: 300, h: 60 },
                { x: 1650, y: 390, w: 850, h: 60 }, // Boss Arena
                { x: 250, y: 300, w: 120, h: 20 },
                { x: 450, y: 220, w: 150, h: 20 },
                { x: 750, y: 290, w: 120, h: 20 },
                { x: 1000, y: 200, w: 180, h: 20 },
                { x: 1250, y: 280, w: 150, h: 20 }
            ];

            this.ladders = [
                { x: 300, y: 300, w: 24, h: 90 },
                { x: 1100, y: 200, w: 24, h: 190 }
            ];

            this.foods = [
                { x: 150, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 280, y: 260, w: 24, h: 24, type: 'apple', collected: false },
                { x: 550, y: 180, w: 30, h: 24, type: 'meat', collected: false },
                { x: 780, y: 250, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 950, y: 350, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1050, y: 160, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1300, y: 240, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1450, y: 350, w: 30, h: 24, type: 'meat', collected: false }
            ];

            this.hiddenTriggers = [
                { x: 600, y: 300, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 1200, y: 200, w: 30, h: 30, foodType: 'apple', spawned: false }
            ];

            this.enemies = [
                // Final Boss Dino King
                { x: 1900, y: 300, vx: -1.8, w: 95, h: 90, type: 'boss', hp: 10, startX: 1950, range: 250, isHurt: false },
                { x: 600, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 2, startX: 600, range: 80, isHurt: false },
                { x: 1050, y: 350, vx: -1.0, w: 38, h: 36, type: 'dino', hp: 1, startX: 1050, range: 100, isHurt: false },
                { x: 800, y: 150, vy: 1.0, w: 26, h: 26, type: 'spider', hp: 1, startY: 100, range: 120, dir: 1 },
                { x: 1200, y: 100, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1200, range: 150, isHurt: false }
            ];

            this.decor = [
                { x: 100, y: 0, type: 'cave_top', h: 50 },
                { x: 300, y: 0, type: 'cave_top', h: 70 },
                { x: 550, y: 0, type: 'cave_top', h: 40 },
                { x: 800, y: 0, type: 'cave_top', h: 80 },
                { x: 1100, y: 0, type: 'cave_top', h: 60 },
                { x: 1400, y: 0, type: 'cave_top', h: 50 },
                { x: 1700, y: 0, type: 'cave_top', h: 70 },
                { x: 2000, y: 0, type: 'cave_top', h: 40 },
                { x: 2300, y: 0, type: 'cave_top', h: 60 },
                { x: 450, y: 390, type: 'cave_bot', h: 35 },
                { x: 950, y: 390, type: 'cave_bot', h: 45 },
                { x: 1380, y: 390, type: 'cave_bot', h: 30 }
            ];

            this.goal = { x: 2350, y: 310, w: 60, h: 80, type: 'portal' };
        } else if (stageNum === 6) {
            // Stage 6 (Jungle Canopy)
            this.stageWidth = 2600;
            this.foodNeeded = 15;
            this.player = this.createPlayerTemplate(100, 300);

            this.platforms = [
                { x: 0, y: 390, w: 700, h: 60 },
                { x: 800, y: 390, w: 900, h: 60 },
                { x: 1800, y: 390, w: 800, h: 60 },
                { x: 250, y: 290, w: 180, h: 20 },
                { x: 480, y: 200, w: 200, h: 20 },
                { x: 900, y: 300, w: 150, h: 20 },
                { x: 1100, y: 210, w: 220, h: 20 },
                { x: 1380, y: 130, w: 180, h: 20 },
                { x: 1600, y: 240, w: 150, h: 20 },
                { x: 1900, y: 300, w: 150, h: 20 },
                { x: 2100, y: 210, w: 180, h: 20 }
            ];

            this.ladders = [
                { x: 300, y: 290, w: 24, h: 100 },
                { x: 1200, y: 210, w: 24, h: 180 },
                { x: 2150, y: 210, w: 24, h: 180 }
            ];

            this.foods = [
                { x: 200, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 350, y: 250, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 550, y: 160, w: 24, h: 24, type: 'apple', collected: false },
                { x: 950, y: 260, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1250, y: 170, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1450, y: 90, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1650, y: 200, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1950, y: 260, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2200, y: 170, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 2400, y: 350, w: 30, h: 24, type: 'meat', collected: false }
            ];

            this.hiddenTriggers = [
                { x: 600, y: 300, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 1500, y: 350, w: 30, h: 30, foodType: 'apple', spawned: false }
            ];

            this.enemies = [
                { x: 400, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 1, startX: 400, range: 120, isHurt: false },
                { x: 1100, y: 350, vx: -1.5, w: 38, h: 36, type: 'dino', hp: 2, startX: 1100, range: 150, isHurt: false },
                { x: 2000, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 2, startX: 2000, range: 180, isHurt: false },
                { x: 600, y: 150, vy: 1.2, w: 26, h: 26, type: 'spider', hp: 1, startY: 80, range: 150, dir: 1 },
                { x: 1450, y: 180, vy: 1.0, w: 26, h: 26, type: 'spider', hp: 1, startY: 100, range: 120, dir: 1 },
                { x: 1600, y: 100, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1600, range: 250, isHurt: false }
            ];

            this.decor = [
                { x: 50, y: 390, type: 'tree' },
                { x: 400, y: 390, type: 'tree' },
                { x: 950, y: 390, type: 'tree' },
                { x: 1500, y: 390, type: 'tree' },
                { x: 2300, y: 390, type: 'tree' },
                { x: 150, y: 60, type: 'cloud', w: 100 },
                { x: 750, y: 80, type: 'cloud', w: 120 },
                { x: 1350, y: 50, type: 'cloud', w: 90 },
                { x: 1950, y: 70, type: 'cloud', w: 110 }
            ];

            this.goal = { x: 2450, y: 310, w: 70, h: 80, type: 'cave' };

        } else if (stageNum === 7) {
            // Stage 7 (Magma Core)
            this.stageWidth = 2800;
            this.foodNeeded = 15;
            this.player = this.createPlayerTemplate(80, 300);

            this.platforms = [
                { x: 0, y: 390, w: 450, h: 60 },
                { x: 900, y: 390, w: 400, h: 60 },
                { x: 1700, y: 390, w: 350, h: 60 },
                { x: 2300, y: 390, w: 500, h: 60 },
                { x: 520, y: 300, w: 100, h: 20 },
                { x: 680, y: 220, w: 120, h: 20 },
                { x: 1400, y: 280, w: 150, h: 20 },
                { x: 1580, y: 190, w: 100, h: 20 },
                { x: 2120, y: 300, w: 120, h: 20 },
                { x: 200, y: 280, w: 150, h: 20 },
                { x: 1050, y: 290, w: 180, h: 20 },
                { x: 1200, y: 200, w: 150, h: 20 },
                { x: 1850, y: 280, w: 150, h: 20 },
                { x: 2400, y: 290, w: 160, h: 20 }
            ];

            this.ladders = [
                { x: 250, y: 280, w: 24, h: 110 },
                { x: 1100, y: 290, w: 24, h: 100 },
                { x: 2450, y: 290, w: 24, h: 100 }
            ];

            this.foods = [
                { x: 150, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 300, y: 240, w: 30, h: 24, type: 'meat', collected: false },
                { x: 570, y: 260, w: 24, h: 24, type: 'apple', collected: false },
                { x: 730, y: 180, w: 30, h: 24, type: 'meat', collected: false },
                { x: 950, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1100, y: 250, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1250, y: 160, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1450, y: 240, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1750, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1900, y: 240, w: 24, h: 24, type: 'apple', collected: false },
                { x: 2180, y: 260, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2350, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 2500, y: 250, w: 30, h: 24, type: 'meat', collected: false }
            ];

            this.hiddenTriggers = [
                { x: 1350, y: 320, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 2000, y: 320, w: 30, h: 30, foodType: 'meat', spawned: false }
            ];

            this.enemies = [
                { x: 300, y: 350, vx: -1.3, w: 38, h: 36, type: 'dino', hp: 1, startX: 300, range: 80, isHurt: false },
                { x: 1000, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 2, startX: 1000, range: 100, isHurt: false },
                { x: 1800, y: 350, vx: -1.4, w: 38, h: 36, type: 'dino', hp: 2, startX: 1800, range: 100, isHurt: false },
                { x: 2500, y: 350, vx: -1.6, w: 38, h: 36, type: 'dino', hp: 3, startX: 2500, range: 120, isHurt: false },
                { x: 750, y: 150, vy: 1.3, w: 26, h: 26, type: 'spider', hp: 1, startY: 80, range: 140, dir: 1 },
                { x: 1500, y: 120, vy: 1.5, w: 26, h: 26, type: 'spider', hp: 1, startY: 80, range: 180, dir: 1 },
                { x: 600, y: 100, vx: -2.2, w: 36, h: 28, type: 'ptero', hp: 1, startX: 600, range: 200, isHurt: false },
                { x: 1300, y: 80, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1300, range: 250, isHurt: false },
                { x: 2100, y: 100, vx: -2.4, w: 36, h: 28, type: 'ptero', hp: 1, startX: 2100, range: 200, isHurt: false }
            ];

            this.decor = [
                { x: 150, y: 0, type: 'cave_top', h: 60 },
                { x: 450, y: 0, type: 'cave_top', h: 50 },
                { x: 800, y: 0, type: 'cave_top', h: 80 },
                { x: 1100, y: 0, type: 'cave_top', h: 40 },
                { x: 1450, y: 0, type: 'cave_top', h: 70 },
                { x: 1800, y: 0, type: 'cave_top', h: 60 },
                { x: 2200, y: 0, type: 'cave_top', h: 70 },
                { x: 2500, y: 0, type: 'cave_top', h: 50 },
                { x: 350, y: 390, type: 'cave_bot', h: 40 },
                { x: 1250, y: 390, type: 'cave_bot', h: 30 },
                { x: 1950, y: 390, type: 'cave_bot', h: 35 },
                { x: 2650, y: 390, type: 'cave_bot', h: 45 }
            ];

            this.goal = { x: 2700, y: 310, w: 60, h: 80, type: 'portal' };

        } else if (stageNum === 8) {
            // Stage 8 (Cyber Temple)
            this.stageWidth = 2700;
            this.foodNeeded = 15;
            this.player = this.createPlayerTemplate(80, 300);

            this.platforms = [
                { x: 0, y: 390, w: 600, h: 60 },
                { x: 750, y: 390, w: 800, h: 60 },
                { x: 1700, y: 390, w: 1000, h: 60 },
                { x: 200, y: 280, w: 150, h: 20 },
                { x: 400, y: 200, w: 160, h: 20 },
                { x: 800, y: 290, w: 180, h: 20 },
                { x: 1050, y: 210, w: 150, h: 20 },
                { x: 1250, y: 130, w: 150, h: 20 },
                { x: 1450, y: 220, w: 180, h: 20 },
                { x: 1850, y: 290, w: 150, h: 20 },
                { x: 2050, y: 200, w: 160, h: 20 },
                { x: 2250, y: 280, w: 150, h: 20 }
            ];

            this.ladders = [
                { x: 250, y: 280, w: 24, h: 110 },
                { x: 900, y: 290, w: 24, h: 100 },
                { x: 2100, y: 200, w: 24, h: 190 }
            ];

            this.foods = [
                { x: 150, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 280, y: 240, w: 30, h: 24, type: 'meat', collected: false },
                { x: 450, y: 160, w: 24, h: 24, type: 'apple', collected: false },
                { x: 820, y: 250, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 920, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1100, y: 170, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1300, y: 90, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1500, y: 180, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1800, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1900, y: 250, w: 24, h: 24, type: 'apple', collected: false },
                { x: 2100, y: 160, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2300, y: 240, w: 24, h: 24, type: 'cherry', collected: false }
            ];

            this.hiddenTriggers = [
                { x: 500, y: 280, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 1600, y: 280, w: 30, h: 30, foodType: 'meat', spawned: false }
            ];

            this.enemies = [
                { x: 350, y: 350, vx: -1.5, w: 38, h: 36, type: 'dino', hp: 2, startX: 350, range: 100, isHurt: false },
                { x: 1000, y: 350, vx: -1.3, w: 38, h: 36, type: 'dino', hp: 2, startX: 1000, range: 120, isHurt: false },
                { x: 1900, y: 350, vx: -1.5, w: 38, h: 36, type: 'dino', hp: 2, startX: 1900, range: 150, isHurt: false },
                { x: 2400, y: 350, vx: -1.8, w: 38, h: 36, type: 'dino', hp: 3, startX: 2400, range: 100, isHurt: false },
                { x: 500, y: 120, vy: 1.5, w: 26, h: 26, type: 'spider', hp: 1, startY: 80, range: 150, dir: 1 },
                { x: 1350, y: 150, vy: 1.2, w: 26, h: 26, type: 'spider', hp: 1, startY: 90, range: 130, dir: 1 },
                { x: 600, y: 80, vx: -2.5, w: 36, h: 28, type: 'ptero', hp: 1, startX: 600, range: 250, isHurt: false },
                { x: 1500, y: 100, vx: -2.6, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1500, range: 300, isHurt: false }
            ];

            this.decor = [
                { x: 100, y: 0, type: 'cave_top', h: 50 },
                { x: 400, y: 0, type: 'cave_top', h: 70 },
                { x: 800, y: 0, type: 'cave_top', h: 60 },
                { x: 1200, y: 0, type: 'cave_top', h: 80 },
                { x: 1600, y: 0, type: 'cave_top', h: 50 },
                { x: 2000, y: 0, type: 'cave_top', h: 70 },
                { x: 2400, y: 0, type: 'cave_top', h: 60 },
                { x: 300, y: 390, type: 'cave_bot', h: 40 },
                { x: 1100, y: 390, type: 'cave_bot', h: 30 },
                { x: 1800, y: 390, type: 'cave_bot', h: 35 },
                { x: 2500, y: 390, type: 'cave_bot', h: 45 }
            ];

            this.goal = { x: 2600, y: 310, w: 60, h: 80, type: 'portal' };

        } else if (stageNum === 9) {
            // Stage 9 (Crystal Mine)
            this.stageWidth = 2600;
            this.foodNeeded = 15;
            this.player = this.createPlayerTemplate(100, 300);

            this.platforms = [
                { x: 0, y: 390, w: 500, h: 60 },
                { x: 650, y: 390, w: 800, h: 60 },
                { x: 1600, y: 390, w: 1000, h: 60 },
                { x: 200, y: 290, w: 150, h: 20 },
                { x: 400, y: 210, w: 150, h: 20 },
                { x: 750, y: 280, w: 180, h: 20 },
                { x: 1000, y: 200, w: 180, h: 20 },
                { x: 1250, y: 280, w: 160, h: 20 },
                { x: 1450, y: 190, w: 150, h: 20 },
                { x: 1750, y: 280, w: 180, h: 20 },
                { x: 1950, y: 200, w: 180, h: 20 },
                { x: 2200, y: 290, w: 150, h: 20 }
            ];

            this.ladders = [
                { x: 300, y: 290, w: 24, h: 100 },
                { x: 1100, y: 200, w: 24, h: 190 },
                { x: 2300, y: 290, w: 24, h: 100 }
            ];

            this.foods = [
                { x: 150, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 250, y: 250, w: 30, h: 24, type: 'meat', collected: false },
                { x: 450, y: 170, w: 24, h: 24, type: 'apple', collected: false },
                { x: 780, y: 240, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 880, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1050, y: 160, w: 24, h: 24, type: 'apple', collected: false },
                { x: 1300, y: 240, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1500, y: 150, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 1700, y: 350, w: 30, h: 24, type: 'meat', collected: false },
                { x: 1800, y: 240, w: 24, h: 24, type: 'apple', collected: false },
                { x: 2000, y: 160, w: 30, h: 24, type: 'meat', collected: false },
                { x: 2250, y: 250, w: 24, h: 24, type: 'cherry', collected: false }
            ];

            this.hiddenTriggers = [
                { x: 600, y: 280, w: 30, h: 30, foodType: 'meat', spawned: false },
                { x: 1550, y: 280, w: 30, h: 30, foodType: 'meat', spawned: false }
            ];

            this.enemies = [
                { x: 350, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 2, startX: 350, range: 100, isHurt: false },
                { x: 1000, y: 350, vx: -1.4, w: 38, h: 36, type: 'dino', hp: 2, startX: 1000, range: 150, isHurt: false },
                { x: 1800, y: 350, vx: -1.3, w: 38, h: 36, type: 'dino', hp: 3, startX: 1800, range: 120, isHurt: false },
                { x: 500, y: 150, vy: 1.1, w: 26, h: 26, type: 'spider', hp: 1, startY: 90, range: 140, dir: 1 },
                { x: 1350, y: 180, vy: 1.3, w: 26, h: 26, type: 'spider', hp: 1, startY: 100, range: 150, dir: 1 },
                { x: 600, y: 100, vx: -2.0, w: 36, h: 28, type: 'ptero', hp: 1, startX: 600, range: 200, isHurt: false },
                { x: 1500, y: 80, vx: -2.2, w: 36, h: 28, type: 'ptero', hp: 1, startX: 1500, range: 250, isHurt: false }
            ];

            this.decor = [
                { x: 100, y: 0, type: 'cave_top', h: 60 },
                { x: 400, y: 0, type: 'cave_top', h: 50 },
                { x: 750, y: 0, type: 'cave_top', h: 80 },
                { x: 1100, y: 0, type: 'cave_top', h: 40 },
                { x: 1450, y: 0, type: 'cave_top', h: 70 },
                { x: 1800, y: 0, type: 'cave_top', h: 60 },
                { x: 2150, y: 0, type: 'cave_top', h: 70 },
                { x: 2450, y: 0, type: 'cave_top', h: 50 },
                { x: 300, y: 390, type: 'cave_bot', h: 40 },
                { x: 1200, y: 390, type: 'cave_bot', h: 30 },
                { x: 1900, y: 390, type: 'cave_bot', h: 35 }
            ];

            this.goal = { x: 2500, y: 310, w: 60, h: 80, type: 'portal' };

        } else if (stageNum === 10) {
            // Stage 10 (Final Castle & Final Boss Mega Dino King)
            this.stageWidth = 2400;
            this.foodNeeded = 10;
            this.player = this.createPlayerTemplate(100, 300);

            this.platforms = [
                { x: 0, y: 390, w: 600, h: 60 },
                { x: 700, y: 390, w: 400, h: 60 },
                { x: 1250, y: 390, w: 1150, h: 60 },
                { x: 200, y: 290, w: 150, h: 20 },
                { x: 450, y: 220, w: 150, h: 20 },
                { x: 800, y: 280, w: 180, h: 20 },
                { x: 1000, y: 190, w: 150, h: 20 },
                { x: 1400, y: 290, w: 150, h: 20 },
                { x: 1650, y: 200, w: 200, h: 20 },
                { x: 1950, y: 290, w: 150, h: 20 }
            ];

            this.ladders = [
                { x: 300, y: 290, w: 24, h: 100 },
                { x: 900, y: 280, w: 24, h: 110 }
            ];

            this.foods = [
                { x: 150, y: 350, w: 24, h: 24, type: 'cherry', collected: false },
                { x: 500, y: 180, w: 24, h: 24, type: 'apple', collected: false }
            ];

            this.hiddenTriggers = [];

            this.enemies = [
                { x: 1700, y: 280, vx: -2.0, w: 110, h: 100, type: 'boss', hp: 15, startX: 1800, range: 450, isHurt: false },
                { x: 350, y: 350, vx: -1.2, w: 38, h: 36, type: 'dino', hp: 2, startX: 350, range: 80, isHurt: false },
                { x: 850, y: 350, vx: -1.4, w: 38, h: 36, type: 'dino', hp: 2, startX: 850, range: 100, isHurt: false },
                { x: 550, y: 100, vy: 1.5, w: 26, h: 26, type: 'spider', hp: 1, startY: 80, range: 140, dir: 1 }
            ];

            this.decor = [
                { x: 100, y: 0, type: 'cave_top', h: 60 },
                { x: 400, y: 0, type: 'cave_top', h: 50 },
                { x: 700, y: 0, type: 'cave_top', h: 70 },
                { x: 1000, y: 0, type: 'cave_top', h: 40 },
                { x: 1300, y: 0, type: 'cave_top', h: 80 },
                { x: 1600, y: 0, type: 'cave_top', h: 50 },
                { x: 1900, y: 0, type: 'cave_top', h: 70 },
                { x: 2200, y: 0, type: 'cave_top', h: 60 },
                { x: 300, y: 390, type: 'cave_bot', h: 35 },
                { x: 950, y: 390, type: 'cave_bot', h: 40 }
            ];

            this.goal = { x: 2250, y: 310, w: 60, h: 80, type: 'portal' };
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
        this.hideAllScreens();
        this.hud.classList.remove('hidden');

        // Rank mode HUD setup
        if (this.isRankMode) {
            this.hud.classList.add('hud-rank-mode');
            if (this.hudTimeContainer) this.hudTimeContainer.style.display = '';
        } else {
            this.hud.classList.remove('hud-rank-mode');
            if (this.hudTimeContainer) this.hudTimeContainer.style.display = 'none';
        }

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
        this.isRankMode = false;
        this.hideAllScreens();
        this.screenStart.classList.remove('hidden');
        this.hud.classList.add('hidden');
        this.hud.classList.remove('hud-rank-mode');
        if (this.hudTimeContainer) this.hudTimeContainer.style.display = 'none';
        window.gameAudio.stopBGM();
    }

    hideAllScreens() {
        this.screenStart.classList.add('hidden');
        this.screenGameOver.classList.add('hidden');
        this.screenClear.classList.add('hidden');
        this.screenVictory.classList.add('hidden');
        if (this.screenRankRegister) this.screenRankRegister.classList.add('hidden');
        if (this.screenLeaderboard) this.screenLeaderboard.classList.add('hidden');
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
        // If rank mode, redirect to rank registration instead
        if (this.isRankMode) {
            this.triggerRankRegister();
            return;
        }

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

    // ==============================
    // RANK MODE METHODS
    // ==============================

    triggerRankRegister() {
        this.currentState = this.states.RANK_REGISTER;
        this.rankElapsedTime = Date.now() - this.rankStartTime;
        this.hud.classList.add('hidden');
        this.hideAllScreens();
        this.screenRankRegister.classList.remove('hidden');

        // Populate rank summary
        if (this.rankTimeEl) this.rankTimeEl.innerText = this.formatTime(this.rankElapsedTime);
        if (this.rankScoreEl) this.rankScoreEl.innerText = this.score.toLocaleString();
        if (this.rankPerfectRow) {
            this.rankPerfectRow.style.display = this.isPerfectRun ? '' : 'none';
        }
        if (this.rankNameInput) this.rankNameInput.value = '';

        // Save high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('caveman_highscore', this.highScore);
        }

        window.gameAudio.playVictory();
    }

    submitRankEntry() {
        const name = (this.rankNameInput ? this.rankNameInput.value.trim() : '').substring(0, 10) || 'Caveman';
        const country = this.rankCountrySelect ? this.rankCountrySelect.value : 'KR';

        const entry = {
            name: name,
            country: country,
            time: this.rankElapsedTime,
            score: this.score,
            perfect: this.isPerfectRun,
            timestamp: Date.now()
        };

        if (firebaseDB) {
            // Save to Firebase
            firebaseDB.ref('leaderboard').push(entry)
                .then(() => {
                    console.log('[CavemanAdventure] Rank entry saved to Firebase.');
                    this.showLeaderboard();
                })
                .catch(err => {
                    console.warn('[CavemanAdventure] Firebase save failed, saving locally.', err);
                    this.saveToLocalStorage(entry);
                    this.showLeaderboard();
                });
        } else {
            // Save to localStorage
            this.saveToLocalStorage(entry);
            this.showLeaderboard();
        }
    }

    saveToLocalStorage(entry) {
        let data = [];
        try {
            data = JSON.parse(localStorage.getItem('caveman_leaderboard')) || [];
        } catch (e) { data = []; }
        data.push(entry);
        localStorage.setItem('caveman_leaderboard', JSON.stringify(data));
    }

    showLeaderboard() {
        this.currentState = this.states.LEADERBOARD;
        this.hud.classList.add('hidden');
        this.hideAllScreens();
        this.screenLeaderboard.classList.remove('hidden');

        this.loadLeaderboardData((entries) => {
            this.renderLeaderboard(entries);
        });
    }

    loadLeaderboardData(callback) {
        if (firebaseDB) {
            firebaseDB.ref('leaderboard').orderByChild('time').limitToFirst(50).once('value')
                .then(snapshot => {
                    let entries = [];
                    snapshot.forEach(child => {
                        entries.push(child.val());
                    });
                    // If empty from firebase, merge with defaults
                    if (entries.length === 0) {
                        entries = [...DEFAULT_LEADERBOARD];
                    }
                    // Sort: time ascending, then score descending
                    entries.sort((a, b) => a.time - b.time || b.score - a.score);
                    callback(entries);
                })
                .catch(err => {
                    console.warn('[CavemanAdventure] Firebase read failed, using local data.', err);
                    this.loadLocalLeaderboard(callback);
                });
        } else {
            this.loadLocalLeaderboard(callback);
        }
    }

    loadLocalLeaderboard(callback) {
        let data = [];
        try {
            data = JSON.parse(localStorage.getItem('caveman_leaderboard')) || [];
        } catch (e) { data = []; }
        
        // Merge with defaults if local data is very small
        if (data.length < 3) {
            const existingNames = new Set(data.map(d => d.name));
            DEFAULT_LEADERBOARD.forEach(d => {
                if (!existingNames.has(d.name)) {
                    data.push(d);
                }
            });
        }
        
        // Sort: time ascending, then score descending
        data.sort((a, b) => a.time - b.time || b.score - a.score);
        callback(data);
    }

    renderLeaderboard(entries) {
        if (!this.leaderboardBody) return;
        this.leaderboardBody.innerHTML = '';

        const maxEntries = Math.min(entries.length, 20);
        for (let i = 0; i < maxEntries; i++) {
            const e = entries[i];
            const tr = document.createElement('tr');

            // Medal class for top 3
            if (i === 0) tr.classList.add('rank-gold');
            else if (i === 1) tr.classList.add('rank-silver');
            else if (i === 2) tr.classList.add('rank-bronze');

            const rankIcon = i === 0 ? '\ud83e\udd47' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : `${i + 1}`;

            const flag = COUNTRY_FLAGS[e.country] || '\ud83c\udff3\ufe0f';

            const badgeHTML = e.perfect ? '<span class="perfect-inline">\ud83c\udfc6 PERFECT</span>' : '-';

            tr.innerHTML = `
                <td>${rankIcon}</td>
                <td class="td-name">${this.escapeHTML(e.name)}</td>
                <td>${flag}</td>
                <td class="td-time">${this.formatTime(e.time)}</td>
                <td class="td-score">${e.score.toLocaleString()}</td>
                <td class="td-badge">${badgeHTML}</td>
            `;
            this.leaderboardBody.appendChild(tr);
        }
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const hundredths = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }


    triggerEndingScene() {
        this.currentState = this.states.ENDING;
        this.hud.classList.add('hidden');
        window.gameAudio.playBGM('ending');
        this.endingTick = 0;
        this.endingCavemanX = -50;
        this.endingCavemanY = 348; // aligned with ground y=390 (caveman height is 42)
        this.endingMeatX = -50;
        this.endingMeatY = 338;
        this.endingMeatCarried = true;
        
        // Spawn tribe members at fire area
        // Bonfire will be at x = 400
        this.tribeMembers = [
            { x: 340, y: 348, dir: 1, state: 'idle', jumpTimer: 0 },
            { x: 460, y: 348, dir: -1, state: 'idle', jumpTimer: 0 }
        ];
        
        // Bonfire sparks
        this.bonfireSparks = [];
        
        // Scrolling credits
        this.creditY = 450;
        this.credits = [
            "CAVEMAN ADVENTURE",
            "",
            "DEVELOPED BY",
            "ANTIGRAVITY DESIGN CO.",
            "",
            "AUDIO SYNTHESIS",
            "WEB AUDIO API CHIPTUNE",
            "",
            "VECTOR SPRITES",
            "HTML5 PROCEDURAL CANVAS",
            "",
            "SPECIAL THANKS",
            "TEAM EGOING",
            "AND",
            "YOU (THE BRAVE CAVEMAN!)",
            "",
            "CONGRATULATIONS!",
            "YOU SAVED THE TRIBE!",
            "",
            "- TOUCH OR CLICK TO FINISH -"
        ];
    }

    updateEndingScene() {
        this.endingTick++;
        
        // Update bonfire sparks
        if (this.endingTick % 3 === 0) {
            this.bonfireSparks.push({
                x: 400 + (Math.random() * 20 - 10),
                y: 380,
                vx: Math.random() * 1 - 0.5,
                vy: -1.5 - Math.random() * 1.5,
                life: 30 + Math.random() * 20,
                size: 2 + Math.random() * 3
            });
        }
        this.bonfireSparks.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.life--;
        });
        this.bonfireSparks = this.bonfireSparks.filter(s => s.life > 0);
        
        // Update Caveman walking from left to campfire
        if (this.endingCavemanX < 240) {
            this.endingCavemanX += 1.5;
            this.endingCavemanState = 'walk';
            this.endingMeatX = this.endingCavemanX + 4;
            this.endingMeatY = this.endingCavemanY - 6;
        } else {
            // He reached the camp!
            if (this.endingMeatCarried) {
                // Drop meat on the floor
                this.endingMeatCarried = false;
                this.endingMeatX = 270;
                this.endingMeatY = 366; // ground level for meat
                // Play victory sound once
                window.gameAudio.playVictory();
            }
            
            // Caveman dances
            this.endingCavemanState = 'jump';
            // Simple jump cycle
            const bounce = Math.abs(Math.sin(this.endingTick * 0.15)) * 10;
            this.endingCavemanY = 348 - bounce;
        }
        
        // Update Tribe members dancing
        this.tribeMembers.forEach((member, i) => {
            // Dance animation
            if (this.endingTick % 60 === i * 30) {
                member.state = 'jump';
            }
            if (member.state === 'jump') {
                member.jumpTimer += 0.15;
                const bounce = Math.abs(Math.sin(member.jumpTimer)) * 15;
                member.y = 348 - bounce;
                if (member.jumpTimer >= Math.PI) {
                    member.state = 'walk';
                    member.jumpTimer = 0;
                    member.y = 348;
                }
            } else {
                member.state = 'walk';
                member.y = 348;
            }
        });
        
        // Scroll credits
        if (this.creditY > -500) {
            this.creditY -= 0.6;
        }
    }

    drawEndingScene() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 1. Clear night sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#040410');
        gradient.addColorStop(0.6, '#140c26');
        gradient.addColorStop(1, '#2c1e45');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw twinkling stars in the sky
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
            const sx = (Math.sin(i * 123.45 + this.endingTick * 0.02) + 1) * 0.5 * this.width;
            const sy = (Math.cos(i * 543.21 + this.endingTick * 0.01) + 1) * 0.5 * 250; // upper sky
            const size = (Math.sin(this.endingTick * 0.1 + i) + 1) * 0.5 * 1.5 + 0.5;
            this.ctx.fillRect(sx, sy, size, size);
        }
        
        // 2. Draw ground
        this.ctx.fillStyle = '#60993e'; // Grass top green
        this.ctx.fillRect(0, 390, this.width, 10);
        this.ctx.fillStyle = '#4e331c'; // Dirt brown
        this.ctx.fillRect(0, 400, this.width, 50);
        
        // Grass strands decoration
        this.ctx.strokeStyle = '#82c057';
        this.ctx.lineWidth = 1.5;
        for (let px = 5; px < this.width; px += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(px, 390);
            this.ctx.lineTo(px + (px % 4 - 2), 386);
            this.ctx.stroke();
        }
        
        // 3. Draw trees
        window.Sprites.drawTree(this.ctx, 80, 390, 80);
        window.Sprites.drawTree(this.ctx, 160, 390, 95);
        window.Sprites.drawTree(this.ctx, 640, 390, 90);
        window.Sprites.drawTree(this.ctx, 720, 390, 80);
        
        // 4. Draw Bonfire
        this.ctx.strokeStyle = '#5c4033';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(385, 390); this.ctx.lineTo(415, 380);
        this.ctx.moveTo(415, 390); this.ctx.lineTo(385, 380);
        this.ctx.stroke();
        
        // Fire sparks
        this.ctx.save();
        this.bonfireSparks.forEach(s => {
            this.ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, ${s.life / 50})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
        
        // Flame body
        const flameHeight = 35 + Math.sin(this.endingTick * 0.3) * 8;
        const flameGrad = this.ctx.createLinearGradient(400, 390, 400, 390 - flameHeight);
        flameGrad.addColorStop(0, '#ef476f');
        flameGrad.addColorStop(0.5, '#ffd166');
        flameGrad.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = flameGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(385, 390);
        this.ctx.quadraticCurveTo(400, 390 - flameHeight * 1.2, 400, 390 - flameHeight);
        this.ctx.quadraticCurveTo(400, 390 - flameHeight * 1.2, 415, 390);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 5. Draw meat chunk
        window.Sprites.drawMeat(this.ctx, this.endingMeatX, this.endingMeatY, 40, 32);
        
        // 6. Draw Hero Caveman
        window.Sprites.drawCaveman(
            this.ctx,
            this.endingCavemanX,
            this.endingCavemanY,
            34,
            42,
            this.endingCavemanState,
            1, // face right
            this.endingTick,
            false
        );
        
        // 7. Draw Tribe members
        this.tribeMembers.forEach(member => {
            window.Sprites.drawCaveman(
                this.ctx,
                member.x,
                member.y,
                34,
                42,
                member.state,
                member.dir,
                this.endingTick,
                false
            );
        });
        
        // 8. Draw scrolling credits overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.fillRect(480, 0, 320, this.height);
        
        this.ctx.save();
        this.ctx.textAlign = 'center';
        let currentY = this.creditY;
        this.credits.forEach(line => {
            if (currentY > -20 && currentY < this.height + 20) {
                if (line.startsWith("-") || line.startsWith("CAVEMAN")) {
                    this.ctx.fillStyle = '#ffd166';
                    this.ctx.font = "bold 9px 'Press Start 2P', monospace";
                } else if (line === "") {
                    // spacer
                } else {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = "bold 8px 'Press Start 2P', monospace";
                }
                this.ctx.fillText(line, 640, currentY);
            }
            currentY += 22;
        });
        this.ctx.restore();
        
        // Epilogue title bar
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(0, 0, 480, 32);
        this.ctx.fillStyle = '#ffd166';
        this.ctx.font = "bold 10px 'Press Start 2P', monospace";
        this.ctx.textAlign = 'left';
        this.ctx.fillText("EPILOGUE: THE TRIBE FEAST", 15, 20);
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
        if (this.currentState === this.states.ENDING) {
            this.updateEndingScene();
            return;
        }
        if (this.currentState !== this.states.PLAYING) return;
        
        this.gameTick++;

        // Update Rank Mode timer HUD
        if (this.isRankMode && this.hudTime && this.rankStartTime > 0) {
            this.rankElapsedTime = Date.now() - this.rankStartTime;
            this.hudTime.innerText = this.formatTime(this.rankElapsedTime);
        }

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
        const keyAttack = this.keys['Space'] || this.touchControls.attack;
        const attackJustPressed = keyAttack && !this.prevAttackPressed;
        const attackJustReleased = !keyAttack && this.prevAttackPressed;
        this.prevAttackPressed = keyAttack;

        // If dashing, handle dash timing and skip regular inputs
        if (this.player.isDashing) {
            this.player.dashTimer--;
            if (this.player.dashTimer <= 0) {
                this.player.isDashing = false;
            }
            if (this.gameTick % 3 === 0) {
                this.spawnStars(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 2);
            }
            this.player.animState = 'hit'; // Use swing attack frame during dash
            return;
        }

        // Cancel charge if player falls off the ground
        if (this.player.isCharging && !this.player.isOnGround) {
            this.player.isCharging = false;
            this.player.chargeTimer = 0;
            window.gameAudio.stopChargeSound();
        }

        // Left/Right Movements
        let isMoving = false;
        
        const keyLeft = this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left;
        const keyRight = this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right;
        const keyUp = this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.up;
        const keyDown = this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.down;

        // Handle mid-air dash attack trigger
        const isAirborne = !this.player.isOnGround && !this.player.isOnLadder;
        if (isAirborne && attackJustPressed && !this.player.hasDashed) {
            this.player.isDashing = true;
            this.player.dashTimer = 12;
            this.player.hasDashed = true;
            this.player.dashDirection = this.player.direction;
            this.player.vx = this.player.dashDirection * 12.0;
            this.player.vy = 0;
            window.gameAudio.playDash();
            this.spawnStars(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 6);
            return;
        }

        // Handle ground charging trigger / progress
        if (this.player.isOnGround) {
            if (attackJustPressed && !this.player.isCharging && !this.player.isAttacking) {
                this.player.isCharging = true;
                this.player.chargeTimer = 0;
                window.gameAudio.startChargeSound();
            }
            
            if (this.player.isCharging) {
                if (keyAttack) {
                    this.player.chargeTimer++;
                    if (this.player.chargeTimer > 60) this.player.chargeTimer = 60;
                    this.player.vx = 0; // Freeze horizontal movement while charging
                }
                
                if (attackJustReleased || !keyAttack) {
                    this.finishAttackCharging();
                }
            }
        }

        // Duck (Crouch)
        this.player.isCrouching = keyDown && this.player.isOnGround && !this.player.isOnLadder && !this.player.isCharging;

        // Regular movements (only if not charging)
        if (!this.player.isCrouching && !this.player.isCharging) {
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
            if ((keyUp || keyDown) && !this.player.isCharging) {
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
        } else if (this.player.isCharging) {
            this.player.animState = 'duck'; // crouching stance for bow draw
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
        if (this.player.isDashing) {
            this.player.vx = this.player.dashDirection * 12.0;
            this.player.vy = 0;
            this.player.x += this.player.vx;
            this.player.y += this.player.vy;
            
            // Level boundary clamps
            if (this.player.x < 0) {
                this.player.x = 0;
                this.player.vx = 0;
                this.player.isDashing = false; // abort dash on wall
            }
            if (this.player.x > this.stageWidth - this.player.width) {
                this.player.x = this.stageWidth - this.player.width;
                this.player.vx = 0;
                this.player.isDashing = false; // abort dash on wall
            }
            return;
        }

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
        if (this.player.isOnLadder) {
            this.player.jumpCount = 0;
            this.player.hasDashed = false; // Reset dash on ladder
            return;
        }

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
                        if (this.player.isDashing) this.player.isDashing = false; // abort dash on wall
                    } else if (isMovingLeft && wasRight) {
                        this.player.x = platform.x + platform.w;
                        this.player.vx = 0;
                        if (this.player.isDashing) this.player.isDashing = false; // abort dash on wall
                    }
                }
            }
        });

        if (this.player.isOnGround) {
            this.player.jumpCount = 0;
            this.player.hasDashed = false; // Reset dash on landing
        }
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
            if (enemy.type === 'dino' || enemy.type === 'boss') {
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

            // Damage player or stomp enemy if touched
            if (this.checkCollision(this.player, enemy)) {
                if (this.player.isDashing) {
                    // Air dash attack hit!
                    this.damageEnemy(enemy);
                    this.player.isDashing = false;
                    this.player.vy = -5.0;
                    this.player.hasDashed = false;
                    this.player.jumpCount = 1;
                } else {
                    const isFalling = this.player.vy > 0;
                    const isAbove = (this.player.y + this.player.height - this.player.vy) <= enemy.y + 12; // 12px tolerance

                    if (isFalling && isAbove && !this.player.isHurt) {
                        // Stomp!
                        this.damageEnemy(enemy);
                        // Bounce player upward
                        this.player.vy = -8.0;
                        // Reset jump count so player can double jump again after stomping!
                        this.player.jumpCount = 1;
                    } else if (!this.player.isHurt && !enemy.isHurt) {
                        this.damagePlayer(1);
                    }
                }
            }
        });

        // Filter out dead enemies
        this.enemies = this.enemies.filter(e => e.hp > 0);

        // 3. Update goal touch
        if (this.checkCollision(this.player, this.goal)) {
            const bossAlive = (this.stage === 5 || this.stage === 10) && this.enemies.some(e => e.type === 'boss' && e.hp > 0);
            if (bossAlive) {
                if (this.gameTick % 60 === 0) {
                    this.spawnFloatingText("Defeat the Boss Dinosaur!", this.goal.x - 40, this.goal.y - 20, '#ef476f');
                }
            } else if (this.player.foodCollected >= this.foodNeeded) {
                if (this.stage === 10) {
                    this.triggerEndingScene();
                } else {
                    this.triggerStageClear();
                }
            } else {
                // Show floating helper to eat more food
                if (this.gameTick % 60 === 0) {
                    this.spawnFloatingText("Hungry! Gather more food!", this.goal.x - 40, this.goal.y - 20, '#ef476f');
                }
            }
        }

        // 3a. Update Arrows
        this.arrows.forEach(arrow => {
            arrow.x += arrow.vx;
            
            // Check out of bounds
            if (arrow.x < 0 || arrow.x > this.stageWidth || arrow.y < 0 || arrow.y > this.height) {
                arrow.dead = true;
                return;
            }
            
            // Check platform collision
            this.platforms.forEach(plat => {
                if (this.checkCollision(arrow, plat)) {
                    arrow.dead = true;
                    this.spawnDust(arrow.x, arrow.y);
                }
            });
            
            if (arrow.dead) return;
            
            // Check enemy collision
            this.enemies.forEach(enemy => {
                if (enemy.hp > 0 && this.checkCollision(arrow, enemy)) {
                    this.damageEnemy(enemy);
                    arrow.dead = true;
                }
            });
        });
        this.arrows = this.arrows.filter(arrow => !arrow.dead);

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

        // Track perfect run for rank mode
        if (amount > 0 && this.isRankMode) {
            this.isPerfectRun = false;
        }

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
        if (this.currentState === this.states.ENDING) {
            this.drawEndingScene();
            return;
        }

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
            if (enemy.type === 'dino' || enemy.type === 'boss') {
                window.Sprites.drawDinosaur(this.ctx, enemy.x, enemy.y, enemy.w, enemy.h, this.gameTick, enemy.isHurt);
            } else if (enemy.type === 'ptero') {
                window.Sprites.drawPterodactyl(this.ctx, enemy.x, enemy.y, enemy.w, enemy.h, this.gameTick);
            } else if (enemy.type === 'spider') {
                window.Sprites.drawSpider(this.ctx, enemy.x, enemy.y, enemy.w, enemy.h, this.gameTick);
            }
        });

        // Draw Arrows
        this.arrows.forEach(arrow => {
            window.Sprites.drawArrow(this.ctx, arrow.x, arrow.y, arrow.w, arrow.h, arrow.direction);
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

        // Draw Bow charging bar above player's head
        if (this.player.isCharging) {
            const bx = this.player.x;
            const by = this.player.y - 12;
            const barW = 34;
            const barH = 5;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(bx, by, barW, barH);
            const chargePct = Math.min(1.0, this.player.chargeTimer / 25);
            this.ctx.fillStyle = chargePct >= 1.0 ? '#ffb703' : '#00bbf9';
            this.ctx.fillRect(bx, by, barW * chargePct, barH);
        }

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
        } else if (this.stage === 3) {
            // Stage 3 Volcanic Cave (Dark orange/red/black gradient)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#0f0505');
            gradient.addColorStop(0.6, '#300f0f');
            gradient.addColorStop(1, '#530f0f');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Lava river glow at the bottom (pit areas)
            this.ctx.fillStyle = 'rgba(255, 94, 54, 0.15)';
            this.ctx.fillRect(0, this.height - 40, this.width, 40);

            // Stalactites and stalagmites (Volcanic)
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.8, 0);
            this.decor.forEach(d => {
                if (d.type === 'cave_top') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 0, d.h, true, true, false);
                } else if (d.type === 'cave_bot') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 390, d.h, false, true, false);
                }
            });
            this.ctx.restore();
        } else if (this.stage === 4) {
            // Stage 4 Sky City (Sunset gradient: purple/sunset pink/orange)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#1c0f30');
            gradient.addColorStop(0.5, '#481c5c');
            gradient.addColorStop(0.8, '#85327a');
            gradient.addColorStop(1, '#f77f00');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Draw clouds scrolling parallax
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.4, 0);
            this.decor.forEach(d => {
                if (d.type === 'cloud') {
                    window.Sprites.drawCloud(this.ctx, d.x, d.y, d.w);
                }
            });
            this.ctx.restore();
        } else if (this.stage === 5) {
            // Stage 5 Ice Palace (Frosty cyan/dark blue gradient)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#040b1e');
            gradient.addColorStop(0.7, '#071e3d');
            gradient.addColorStop(1, '#00b4d8');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Ice palace stalactites (Parallax)
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.8, 0);
            this.decor.forEach(d => {
                if (d.type === 'cave_top') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 0, d.h, true, false, true);
                } else if (d.type === 'cave_bot') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 390, d.h, false, false, true);
                }
            });
            this.ctx.restore();
        } else if (this.stage === 6) {
            // Stage 6 Jungle Canopy (Deep forest gradient)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#0f2027');
            gradient.addColorStop(0.5, '#203a43');
            gradient.addColorStop(1, '#2c5364');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Draw clouds & trees behind camera scroll
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.3, 0);
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
        } else if (this.stage === 7) {
            // Stage 7 Magma Core (Dark volcanic red gradient)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#0b0000');
            gradient.addColorStop(0.6, '#280505');
            gradient.addColorStop(1, '#4a0505');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Lava river glow at the bottom (pit areas)
            this.ctx.fillStyle = 'rgba(255, 60, 0, 0.18)';
            this.ctx.fillRect(0, this.height - 40, this.width, 40);

            // Stalactites and stalagmites (Volcanic)
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.8, 0);
            this.decor.forEach(d => {
                if (d.type === 'cave_top') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 0, d.h, true, true, false);
                } else if (d.type === 'cave_bot') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 390, d.h, false, true, false);
                }
            });
            this.ctx.restore();
        } else if (this.stage === 8) {
            // Stage 8 Cyber Temple (Deep violet to hot magenta gradient)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#03001e');
            gradient.addColorStop(0.5, '#7303c0');
            gradient.addColorStop(1, '#ec38bc');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Cyber grid
            this.ctx.fillStyle = 'rgba(112, 214, 255, 0.05)';
            for (let i = 0; i < this.width; i += 40) {
                this.ctx.fillRect(i - (this.cameraX * 0.2) % 40, 0, 2, this.height);
            }

            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.8, 0);
            this.decor.forEach(d => {
                if (d.type === 'cave_top') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 0, d.h, true, false, false, true);
                } else if (d.type === 'cave_bot') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 390, d.h, false, false, false, true);
                }
            });
            this.ctx.restore();
        } else if (this.stage === 9) {
            // Stage 9 Crystal Mine (Teal to emerald crystal gradient)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#061a1a');
            gradient.addColorStop(0.6, '#0f3a3a');
            gradient.addColorStop(1, '#2c7a7a');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Crystals (Ice stalactites)
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.8, 0);
            this.decor.forEach(d => {
                if (d.type === 'cave_top') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 0, d.h, true, false, true);
                } else if (d.type === 'cave_bot') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 390, d.h, false, false, true);
                }
            });
            this.ctx.restore();
        } else if (this.stage === 10) {
            // Stage 10 Final Castle (Crimson blood sky gradient)
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#0d0202');
            gradient.addColorStop(0.5, '#3a0202');
            gradient.addColorStop(1, '#780303');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Columns (Castle stalactites)
            this.ctx.save();
            this.ctx.translate(-this.cameraX * 0.8, 0);
            this.decor.forEach(d => {
                if (d.type === 'cave_top') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 0, d.h, true, false, false, false, true);
                } else if (d.type === 'cave_bot') {
                    window.Sprites.drawCaveDecor(this.ctx, d.x, 390, d.h, false, false, false, false, true);
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
            } else if (this.stage === 3) {
                // Volcanic lava platforms
                this.ctx.fillStyle = '#ff5e36'; // Hot orange-red lava top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#5c1712'; // Dark volcanic rock body
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                // Lava highlights
                this.ctx.strokeStyle = '#fcbf49';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            } else if (this.stage === 4) {
                // Sky City neon cloud platforms
                this.ctx.fillStyle = '#ff70a6'; // Neon pink top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 4);
                this.ctx.fill();

                this.ctx.fillStyle = '#70d6ff'; // Neon blue sky body
                this.ctx.fillRect(platform.x, platform.y + 4, platform.w, platform.h - 4);

                // Neon highlight
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            } else if (this.stage === 5) {
                // Ice crystal blue blocks
                this.ctx.fillStyle = '#ade8f4'; // Frosty white-blue ice top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#0077b6'; // Cold dark blue ice body
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                // Ice crystal highlights
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            } else if (this.stage === 6) {
                // Jungle Canopy platform (Forest theme with jungle green colors)
                this.ctx.fillStyle = '#38b000'; // Lime/jungle green top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#2b1a0a'; // Deep brown wood/dirt body
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                this.ctx.strokeStyle = '#70e000'; // Light lime highlight
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            } else if (this.stage === 7) {
                // Magma Core platform (Red lava top with volcanic ash body)
                this.ctx.fillStyle = '#d00000'; // Dark red lava top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#1a0f0f'; // Volcanic black body
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                this.ctx.strokeStyle = '#ffb703'; // Bright yellow lava highlights
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            } else if (this.stage === 8) {
                // Cyber Temple platform (Neon cyan border on deep purple body)
                this.ctx.fillStyle = '#70d6ff'; // Neon cyan top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#1d0f30'; // Cyber dark body
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                this.ctx.strokeStyle = '#ff70a6'; // Neon pink highlights
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            } else if (this.stage === 9) {
                // Crystal Mine platform (Amethyst purple crystals)
                this.ctx.fillStyle = '#e0aaff'; // Light lavender amethyst top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#3c096c'; // Deep amethyst purple body
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                this.ctx.strokeStyle = '#ffffff'; // White shiny highlights
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y);
                this.ctx.lineTo(platform.x + platform.w, platform.y);
                this.ctx.stroke();
            } else if (this.stage === 10) {
                // Final Castle platform (Crimson/blood stone brick style)
                this.ctx.fillStyle = '#ef476f'; // Crimson top
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#222222'; // Dark castle stone body
                this.ctx.fillRect(platform.x, platform.y + 5, platform.w, platform.h - 5);

                this.ctx.strokeStyle = '#ffd166'; // Gold brick outline highlight
                this.ctx.lineWidth = 2;
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
            const bossAlive = (this.stage === 5 || this.stage === 10) && this.enemies.some(e => e.type === 'boss' && e.hp > 0);
            if (bossAlive) {
                // Draw a locked/faded portal
                const cy = this.goal.y + this.goal.h/2;
                const cx = this.goal.x + this.goal.w/2;
                this.ctx.strokeStyle = '#555';
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, this.goal.w/2, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#666';
                this.ctx.font = "bold 8px 'Press Start 2P', monospace";
                this.ctx.textAlign = 'center';
                this.ctx.fillText("LOCKED", cx, this.goal.y - 12);
                this.ctx.restore();
                return;
            }

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
