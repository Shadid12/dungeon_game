import Player from './player.js';
import MenuScene from './menu.js';
import { createBloodEffect, createEnemy, spawnEnemies, performSlashAttack  } from './utils.js';
import AssetLoader from './assetLoader.js';

class MainScene extends Phaser.Scene {
    preload() {
        // Load Audio
        AssetLoader.loadAudio(this);

        // Load the assets
        this.load.image('sword', 'assets/sword.png');
        this.load.image('gun', 'assets/gun.png');

        this.load.image('blood', 'assets/blood_1.png');

        // Load goblin assets
        AssetLoader.loadGoblinAssets(this);

        // Load player sprite
        for (let i = 0; i <= 7; i++) {
            this.load.image(`pug${i}`, `assets/pug/sprite_${i}.png`);
        }

        // Load player walk animation
        for (let i = 0; i <= 3; i++) {
            this.load.image(`pug_walk${i}`, `assets/pug/walk/sprite_${i}.png`);
        }

        // Load heart animation frames correctly
        for (let i = 1; i <= 8; i++) {
            this.load.image(`heart${i}`, `assets/heart/Cuore${i}.png`);
        }

        // Load ammo icon
        this.load.image('ammo', 'assets/ammo.png');

        // Generate custom cursor
        AssetLoader.loadCustomCursor(this);

        // Load shotgun asset
        this.load.image('shotgun', 'assets/shotgun/shotgun.png');
        this.load.image('shotgun_pickup', 'assets/shotgun/shotgun.png');
    }

    constructor() {
        super({ key: 'MainScene' });

        this._handleContextMenu = (e) => {
            e.preventDefault();
        };


        this.player = null;
        this.enemies = null;
        this.moveKeys = null;  // Changed from cursors to moveKeys
        this.moveSpeed = 200;
        // Define larger world dimensions
        this.worldWidth = 2400;  // 3x original width
        this.worldHeight = 1800; // 3x original height
        this.shootCooldown = 500;

        // Add blood effects group
        this.bloodEffects = null;

        // Add damage flash overlay property
        this.damageFlash = null;

        this.bulletCount = 100;
        this.ammo = null;

        this.slashCooldown = false;
        this.slashDamage = 3;
        this.healthDrops = null;

        this.currentWeapon = 'sword';
        this.weaponSwitchCooldown = false;

        this.facingRight = false;

        this.spawnTimer = null;
        this.enemySpawningEnabled = true;
        this.gameWon = false;
        this.remainingTime = 60; // 2 minutes in seconds

        // Add new properties for shotgun
        this.shotgunPickups = null;
        this.hasShotgun = false;
        this.shotgunAmmo = 0;
        this.shotgunSpawnTimer = null;
    }

    create() {

        // --- 1) Re-enable input systems in case they were disabled before ---
        this.input.enabled = true;
        this.input.keyboard.enabled = true;
        this.input.mouse.enabled = true;

        // --- 2) Remove any leftover keyboard listeners from previous scenes ---
        this.input.keyboard.removeAllListeners();

        // --- 3) (Optional) Restore the default cursor, or set a custom one if you prefer ---
        // If you want to start with no cursor in MainScene, you can set it to 'none' again later.
        this.input.setDefaultCursor('default');

        // (Now your input system is back in a “fresh” state.)

        // Use the stored reference when adding:
        this.game.canvas.addEventListener('contextmenu', this._handleContextMenu);

        // Create animation for goblins
        this.anims.create({
            key: 'goblin_idle',
            frames: [
                { key: 'goblin1' },
                { key: 'goblin2' },
                { key: 'goblin3' }
            ],
            frameRate: 8, // Adjust this value to make animation faster or slower
            repeat: -1 // -1 means loop forever
        });

        this.anims.create({
            key: 'pug_walk',
            frames: [
                { key: 'pug_walk0' },
                { key: 'pug_walk1' },
                { key: 'pug_walk2' },
                { key: 'pug_walk3' }
            ],
            frameRate: 8,
            repeat: -1
        });

        // Create run animation for goblin run
        this.anims.create({
            key: 'goblin_run',
            frames: [
                { key: 'goblin_run0' },
                { key: 'goblin_run1' },
                { key: 'goblin_run2' },
                { key: 'goblin_run3' },
                { key: 'goblin_run4' },
                { key: 'goblin_run5' }
            ],
            frameRate: 8,
            repeat: -1
        });

         // Create heart animation
        this.anims.create({
            key: 'heartBeat',
            frames: [
                { key: 'heart1' },
                { key: 'heart2' },
                { key: 'heart3' },
                { key: 'heart4' },
                { key: 'heart5' },
                { key: 'heart6' },
                { key: 'heart7' },
                { key: 'heart8' }
            ],
            frameRate: 12,
            repeat: -1
        });
        

        this.gameOver = false;

        // Add this after other group creations
        this.bloodEffects = this.add.group();

        // Pick a random background music
        this.backgroundMusic = this.sound.add('goblin_theme', {
            volume: 0.3,        // 30% volume
            loop: true,         // Music will loop
            delay: 2           // Start immediately
        });

        this.backgroundMusic.play();

        // Hide the default cursor
        this.input.setDefaultCursor('none');
        
        // Create the cursor sprite and make it follow the pointer
        this.cursor = this.add.sprite(0, 0, 'cursor');
        this.cursor.setDepth(999); // Make sure it's always on top
        this.cursor.setVisible(false);
        
        // Set the physics world bounds to match our larger world
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // Create multiple terrain objects spread across the larger map
        this.terrain = this.physics.add.staticGroup();
        // Add more terrain objects across the map
        this.terrain.add(this.add.rectangle(100, 300, 40, 400, 0xFFFF00));
        this.terrain.add(this.add.rectangle(800, 500, 40, 400, 0xFFFF00));
        this.terrain.add(this.add.rectangle(1500, 800, 40, 400, 0xFFFF00));
        this.terrain.add(this.add.rectangle(2000, 400, 40, 400, 0xFFFF00));
        this.terrain.add(this.add.rectangle(400, 1200, 40, 400, 0xFFFF00));
        this.terrain.add(this.add.rectangle(1200, 1500, 40, 400, 0xFFFF00));

        // Create projectile texture
        const projectileGraphics = this.add.graphics();
        projectileGraphics.fillStyle(0x00FF00); // Green color
        projectileGraphics.fillCircle(0, 0, 8); // 8px radius circle
        projectileGraphics.generateTexture('projectile', 16, 16);
        projectileGraphics.destroy();

        // Create projectiles group
        this.projectiles = this.physics.add.group();

        // Add mouse input
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                if (this.currentWeapon === 'gun' || this.currentWeapon === 'shotgun') {
                    this.shootProjectile(pointer);
                } else if (this.currentWeapon === 'sword') {
                    this.doMeleeAttack();
                }
            } else if (pointer.rightButtonDown() && this.currentWeapon === 'sword' && !this.slashCooldown) {
                performSlashAttack(this, this.weapon, this.player, this.facingRight);
            }
        });

        
        // Create enemy texture
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0xFFA500);
        enemyGraphics.fillCircle(16, 16, 16);
        enemyGraphics.generateTexture('enemy', 32, 32);
        enemyGraphics.destroy();


        this.anims.create({
            key: 'pug_idle',
            frames: [
                { key: 'pug0' },
                { key: 'pug1' },
                { key: 'pug2' },
                { key: 'pug3' },
                { key: 'pug4' },
                { key: 'pug5' },
                { key: 'pug6' },
                { key: 'pug7' }
            ],
            frameRate: 10,
            repeat: -1
        });

        // Create a Player instance
        this.player = new Player(
            this,                         // Reference to the scene
            this.worldWidth / 2,         // X position
            this.worldHeight / 2,        // Y position
            'pug0'                     // Texture key
        );

        this.physics.add.existing(this.player);
        this.physics.add.collider(this.player, this.terrain);

        // Update camera settings for larger world
        this.cameras.main.startFollow(this.player, false, 1, 1.5);
        this.cameras.main.setZoom(1);
        this.cameras.main.setDeadzone(0, 0);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // Setup WASD keys
        this.moveKeys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Weapon setup
        const weaponGraphics = this.add.graphics();
        weaponGraphics.fillStyle(0xFF0000);
        weaponGraphics.fillRect(0, 0, 2, 120);
        weaponGraphics.generateTexture('weapon', 10, 30);
        weaponGraphics.destroy();

        this.weapon = this.add.sprite(this.player.x, this.player.y, 'sword');
        this.weapon.setScale(1.5); // Scale up the weapon
        this.weapon.setOrigin(0.5, 0.5);
        
        this.physics.add.existing(this.weapon);
        this.weapon.body.enable = false; // Disable the physics body by default
        
        
        // Initialize enemies with more spread across the map
        this.enemies = this.physics.add.group();
        
        // Create initial enemies spread across the map
        createEnemy(this, 400, 400, this.enemies);
        createEnemy(this, 400, 800, this.enemies);
        createEnemy(this, 2000, 1000, this.enemies);
        createEnemy(this, 600, 1500, this.enemies);
        createEnemy(this, 1800, 400, this.enemies);

        this.physics.add.overlap(this.weapon, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(
            this.player,
            this.enemies,
            (player, enemy) => {
                player.playerHitByEnemy(enemy);
            },
            null,
            this
        );
        
        this.spawnTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
                if (this.enemySpawningEnabled) {
                    spawnEnemies(this, 3);
                }
            },
            loop: true
        });

        // Add countdown timer
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Add timer display
        this.timerText = this.add.text(16, 110, '1:00', { 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(999);


        // Create victory text (hidden initially)
        this.victoryText = this.add.text(400, 300, 'LEVEL CLEARED!', {
            fontSize: '64px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000)
        .setAlpha(0); // Initially hidden

        // Add collision between projectiles and enemies
        this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHitEnemy, null, this);

        // Add collision between projectiles and terrain
        this.physics.add.collider(this.projectiles, this.terrain, (projectile) => {
            projectile.destroy();
        });

        // Gun setup
        this.gun = this.add.sprite(this.player.x, this.player.y, 'gun');
        this.gun.setOrigin(0.3, 0.5); // Adjust origin for better rotation
        this.gun.setScale(0.2);       // Adjust scale to match your player size


        this.damageFlash = this.add.rectangle(0, 0, this.worldWidth * 2, this.worldHeight * 2, 0xff0000);
        this.damageFlash.setAlpha(0);
        this.damageFlash.setScrollFactor(0);
        this.damageFlash.setDepth(999); // Make sure it's above everything except the cursor

        this.ammoDrops = this.physics.add.group();
    
        // Add collision detection for ammo pickup
        this.physics.add.overlap(this.player, this.ammoDrops, this.collectAmmo, null, this);


        // Create health drops group
        this.healthDrops = this.physics.add.group();
    
        // Add collision for health pickup
        this.physics.add.overlap(this.player, this.healthDrops, (player, health) => {
            player.collectHealth(health);
        }, null, this);


        this.ammoDisplay = this.add.container(34, 70);
        this.ammoDisplay.setScrollFactor(0);

        // Create ammo icon
        this.ammoIcon = this.add.sprite(0, 0, 'ammo');
        this.ammoIcon.setScale(0.8);
        this.ammoIcon.setOrigin(0, 0.5);

        // Create bullet count text
        this.bulletText = this.add.text(30, 0, `${this.bulletCount}`, {
            fontSize: '16px',  // Smaller base size like health text
            fill: '#ffffff',
            fontFamily: 'monospace, "Courier New"',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 0,
                fill: true
            }
        }).setOrigin(0, 0.5).setScale(2); // Scale up like health text

        // Add both to the container
        this.ammoDisplay.add([this.ammoIcon, this.bulletText]);

        // Initially hide ammo display since sword is selected first
        this.ammoDisplay.setVisible(false);

        // When setting initial visibility of weapons
        this.gun.setVisible(false);
        this.weapon.setVisible(true);

        // Set initial weapon visibility based on currentWeapon
        if (this.currentWeapon === 'gun') {
            this.weapon.setVisible(false);
            this.gun.setVisible(true);
        } else {
            this.weapon.setVisible(true);
            this.gun.setVisible(false);
        }

        // Add Tab key binding
        this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);


        // Create shotgun pickups group
        this.shotgunPickups = this.physics.add.group();

        // Start spawning shotgun pickups
        this.shotgunSpawnTimer = this.time.addEvent({
            delay: 20000,  // Spawn every 20 seconds
            callback: this.spawnShotgunPickup,
            callbackScope: this,
            loop: true
        });


        // Add collision for shotgun pickup
        this.physics.add.overlap(
            this.player,
            this.shotgunPickups,
            this.collectShotgun,
            null,
            this
        );

        // Create shotgun sprite (initially hidden)
        this.shotgun = this.add.sprite(this.player.x, this.player.y, 'shotgun');
        this.shotgun.setOrigin(0.3, 0.5);
        this.shotgun.setScale(0.8);
        this.shotgun.setVisible(false);

        // Modify weapon switch logic to include shotgun
        this.input.keyboard.on('keydown-TAB', () => {
            if (!this.weaponSwitchCooldown) {
                this.cycleWeapons();
            }
        });
        
    }

    update() {
        if (this.gameOver || this.gameWon) return;

        if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
            this.switchWeapon();
        }

        
        
        this.player.body.setVelocity(0);

        // Check horizontal movement
        if (this.moveKeys.right.isDown) {
            this.facingRight = true;
        } else if (this.moveKeys.left.isDown) {
            this.facingRight = false;
        }

        // Set weapon position based on facing direction
        const weaponOffsetX = this.facingRight ? 40 : -40;
        const weaponOffsetY = -10;   // Vertical offset stays constant
        const targetX = this.player.x + weaponOffsetX;
        const targetY = this.player.y + weaponOffsetY;
        

        this.weapon.x = Phaser.Math.Linear(this.weapon.x, targetX, 0.1);
        this.weapon.y = Phaser.Math.Linear(this.weapon.y, targetY, 0.1);


        this.weapon.setFlipX(this.facingRight);

        const gunOffsetDistance = 40; // Distance from player center
        const angle = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            this.input.activePointer.x + this.cameras.main.scrollX,
            this.input.activePointer.y + this.cameras.main.scrollY
        );

        // Calculate gun position around player
        const targetXGun = this.player.x + Math.cos(angle) * gunOffsetDistance;
        const targetYGun = this.player.y + Math.sin(angle) * gunOffsetDistance;

        // Smooth movement of gun using linear interpolation
        const lerpFactor2 = 0.2; // Adjust this value to change how quickly gun follows mouse
        this.gun.x = Phaser.Math.Linear(this.gun.x, targetXGun, lerpFactor2);
        this.gun.y = Phaser.Math.Linear(this.gun.y, targetYGun, lerpFactor2);

        // Convert angle to degrees
        const angleDeg = Phaser.Math.RadToDeg(angle);

        // Flip the gun sprite instead of doing full rotation
        if (angleDeg > 90 || angleDeg < -90) {
            // Pointing left
            this.gun.setFlipX(true);
            this.gun.setRotation(angle + Math.PI);
        } else {
            // Pointing right
            this.gun.setFlipX(false);
            this.gun.setRotation(angle);
        }


        this.enemies.getChildren().forEach(enemy => {
            enemy.updateDirection();
            enemy.healthText.x = enemy.x;
            enemy.healthText.y = enemy.y - 40;
            
            const distance = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );
            
            // Enhanced swarming behavior
            const angle = Phaser.Math.Angle.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );
            
            // Calculate base speed - faster when spawning is disabled
            let baseSpeed = this.enemySpawningEnabled ? enemy.moveSpeed : enemy.moveSpeed * 1.5;
            
            // Add "swarming" effect by considering other enemies
            let swarmAngle = angle;
            const nearbyEnemies = this.enemies.getChildren().filter(other => 
                other !== enemy && 
                Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y) < 100
            );
            
            if (nearbyEnemies.length > 0) {
                // Average the angles to nearby enemies to create a swarming effect
                let avgX = 0;
                let avgY = 0;
                nearbyEnemies.forEach(other => {
                    avgX += other.x - enemy.x;
                    avgY += other.y - enemy.y;
                });
                const avoidanceAngle = Math.atan2(avgY, avgX) + Math.PI;
                swarmAngle = Phaser.Math.Angle.Wrap(
                    angle * 0.8 + avoidanceAngle * 0.2
                );
            }
            
            // Set velocity with swarming behavior
            enemy.body.setVelocity(
                Math.cos(swarmAngle) * baseSpeed,
                Math.sin(swarmAngle) * baseSpeed
            );
            
            // Add slight randomness for more organic movement
            enemy.body.velocity.x += Phaser.Math.Between(-20, 20);
            enemy.body.velocity.y += Phaser.Math.Between(-20, 20);
        });

        // Handle WASD movement
        if (this.moveKeys.left.isDown) {
            this.player.body.setVelocityX(-this.moveSpeed);
        }
        if (this.moveKeys.right.isDown) {
            this.player.body.setVelocityX(this.moveSpeed);
        }
        if (this.moveKeys.up.isDown) {
            this.player.body.setVelocityY(-this.moveSpeed);
        }
        if (this.moveKeys.down.isDown) {
            this.player.body.setVelocityY(this.moveSpeed);
        }

        if (this.moveKeys.left.isDown || this.moveKeys.right.isDown || 
            this.moveKeys.up.isDown || this.moveKeys.down.isDown) {
            // Player is moving, play walk animation
            if (!this.player.anims.isPlaying || this.player.anims.getName() !== 'pug_walk') {
                this.player.play('pug_walk');
            }
        } else {
            // Player is idle
            if (!this.player.anims.isPlaying || this.player.anims.getName() !== 'pug_idle') {
                this.player.play('pug_idle');
            }
        }

        if (this.moveKeys.left.isDown) {
            this.player.setFlipX(true);
        } else if (this.moveKeys.right.isDown) {
            this.player.setFlipX(false);
        }

        this.player.body.velocity.normalize().scale(this.moveSpeed);
      
        // Keep player within the visible bounds
        const camera = this.cameras.main;
        const cameraBounds = {
            left: camera.scrollX,
            right: camera.scrollX + camera.width,
            top: camera.scrollY,
            bottom: camera.scrollY + camera.height
        };
      
        this.player.update(cameraBounds);

        // Update cursor position relative to camera
        this.cursor.x = this.input.activePointer.x + this.cameras.main.scrollX;
        this.cursor.y = this.input.activePointer.y + this.cameras.main.scrollY;

        // Update shotgun position similar to gun
        if (this.hasShotgun) {
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                this.input.activePointer.x + this.cameras.main.scrollX,
                this.input.activePointer.y + this.cameras.main.scrollY
            );

            const offsetDistance = 40;
            const targetXShotgun = this.player.x + Math.cos(angle) * offsetDistance;
            const targetYShotgun = this.player.y + Math.sin(angle) * offsetDistance;

            const lerpFactor = 0.2;
            this.shotgun.x = Phaser.Math.Linear(this.shotgun.x, targetXShotgun, lerpFactor);
            this.shotgun.y = Phaser.Math.Linear(this.shotgun.y, targetYShotgun, lerpFactor);

            const angleDeg = Phaser.Math.RadToDeg(angle);
            if (angleDeg > 90 || angleDeg < -90) {
                this.shotgun.setFlipX(true);
                this.shotgun.setRotation(angle + Math.PI);
            } else {
                this.shotgun.setFlipX(false);
                this.shotgun.setRotation(angle);
            }
        }
        
    }

    collectAmmo(player, ammo) {
        ammo.destroy();
        this.bulletCount += 20;
        this.updateBulletDisplay();  // Update display when collecting ammo
        this.sound.play('reload', { volume: 0.20 });
    }

    spawnShotgunPickup() {
        // Only spawn if player doesn't have shotgun
        if (!this.hasShotgun) {
            // Get a random position within the world bounds
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);
            
            const pickup = this.shotgunPickups.create(x, y, 'shotgun_pickup');
            pickup.setScale(0.6);
            
            // Add floating animation
            this.tweens.add({
                targets: pickup,
                y: pickup.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    collectShotgun(player, pickup) {
        pickup.destroy();
        this.hasShotgun = true;
        this.shotgunAmmo = 30;
        this.currentWeapon = 'shotgun';
        this.updateWeaponVisibility();
        
        // Show pickup message
        const pickupText = this.add.text(player.x, player.y - 50, 'Shotgun Acquired!', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: pickupText,
            alpha: 0,
            y: pickupText.y - 20,
            duration: 1000,
            onComplete: () => pickupText.destroy()
        });
    }


    cycleWeapons() {
        this.weaponSwitchCooldown = true;

        // Determine next weapon
        const weapons = ['sword'];
        if (this.bulletCount > 0) weapons.push('gun');
        if (this.hasShotgun && this.shotgunAmmo > 0) weapons.push('shotgun');

        const currentIndex = weapons.indexOf(this.currentWeapon);
        const nextIndex = (currentIndex + 1) % weapons.length;
        this.currentWeapon = weapons[nextIndex];

        this.updateWeaponVisibility();
        
        // Reset cooldown after 500ms
        this.time.delayedCall(500, () => {
            this.weaponSwitchCooldown = false;
        });
    }


    updateWeaponVisibility() {
        this.weapon.setVisible(this.currentWeapon === 'sword');
        this.gun.setVisible(this.currentWeapon === 'gun');
        this.shotgun.setVisible(this.currentWeapon === 'shotgun');
        this.cursor.setVisible(this.currentWeapon === 'gun' || this.currentWeapon === 'shotgun');
        this.ammoDisplay.setVisible(this.currentWeapon === 'gun' || this.currentWeapon === 'shotgun');
        
        // Update ammo display text
        if (this.currentWeapon === 'shotgun') {
            this.bulletText.setText(`${this.shotgunAmmo}`);
        } else if (this.currentWeapon === 'gun') {
            this.bulletText.setText(`${this.bulletCount}`);
        }
    }


    updateTimer() {
        if (this.gameOver || this.gameWon) return;

        this.remainingTime--;
        
        if (this.remainingTime <= 0) {
            this.enemySpawningEnabled = false;
            this.spawnTimer.remove();
            
            // Format and display final time
            this.timerText.setText('0:00');
            
            // Check for win condition periodically after spawning stops
            this.time.addEvent({
                delay: 500,
                callback: this.checkWinCondition,
                callbackScope: this,
                loop: true
            });
        } else {
            // Update timer display
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
            this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
    }

    checkWinCondition() {
        if (this.gameWon || this.gameOver) return;

        if (this.enemies.getChildren().length === 0) {
            this.gameWon = true;
            this.showVictoryScreen();
        }
    }


    showVictoryScreen() {
        // Flash the victory text
        this.tweens.add({
            targets: this.victoryText,
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            yoyo: false
        });
    
        // Add screen effects
        this.cameras.main.flash(1000, 255, 255, 255, true);
        this.cameras.main.shake(500, 0.01);
    
        // Optional: Add a restart prompt
        const restartText = this.add.text(400, 400, 'Press SPACE to return to menu', {
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setAlpha(0);
    
        this.tweens.add({
            targets: restartText,
            alpha: 1,
            duration: 1000,
            delay: 1000,
            ease: 'Power2'
        });
    
        // Add return to menu functionality with proper cleanup
        this.input.keyboard.once('keydown-SPACE', () => {
            // Stop the background music
            if (this.backgroundMusic) {
                this.backgroundMusic.stop();
            }
            
            // Add a fade out effect
            this.cameras.main.fadeOut(500);
            
            // Wait for fade out to complete before switching scenes
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.gameWon = false;
                this.gameOver = false;
                this.remainingTime = 60;
                // Clean up the current scene
                this.scene.stop('MainScene');
                // Start the menu scene fresh
                this.scene.start('MenuScene');
            });
        });
    }


    switchWeapon() {
        if (this.weaponSwitchCooldown) return;
    
        this.weaponSwitchCooldown = true;
        // this.sound.play('weapon_switch', { volume: 0.2 });
    
        if (this.currentWeapon === 'gun') {
            this.currentWeapon = 'sword';

            // Hide cursor when switching to sword
            this.cursor.setVisible(false);
            
            // Hide ammo display
            this.ammoDisplay.setVisible(false);
    
            // Animate gun out
            this.tweens.add({
                targets: this.gun,
                alpha: 0,
                y: this.gun.y - 20,
                duration: 200,
                onComplete: () => {
                    this.gun.setVisible(false);
                    this.gun.setAlpha(1);
                    this.gun.y += 20;
                }
            });
    
            // Animate sword in
            this.weapon.setAlpha(0);
            this.weapon.setVisible(true);
            this.weapon.y += 20;
            this.tweens.add({
                targets: this.weapon,
                alpha: 1,
                y: this.weapon.y - 20,
                duration: 200
            });
            
        } else {
            this.currentWeapon = 'gun';

            // Show cursor when switching to gun
            this.cursor.setVisible(true);
            
            // Show ammo display
            this.ammoDisplay.setVisible(true);
    
            // Animate sword out
            this.tweens.add({
                targets: this.weapon,
                alpha: 0,
                y: this.weapon.y - 20,
                duration: 200,
                onComplete: () => {
                    this.weapon.setVisible(false);
                    this.weapon.setAlpha(1);
                    this.weapon.y += 20;
                }
            });
    
            // Animate gun in
            this.gun.setAlpha(0);
            this.gun.setVisible(true);
            this.gun.y += 20;
            this.tweens.add({
                targets: this.gun,
                alpha: 1,
                y: this.gun.y - 20,
                duration: 200
            });
        }
    
        // Add visual feedback
        const switchText = this.add.text(this.player.x, this.player.y - 50, 'Weapon Switched!', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
    
        this.tweens.add({
            targets: switchText,
            alpha: 0,
            y: switchText.y - 20,
            duration: 1000,
            onComplete: () => switchText.destroy()
        });
    
        // Reset cooldown after 500ms
        this.time.delayedCall(500, () => {
            this.weaponSwitchCooldown = false;
        });
    }

    updateBulletDisplay() {
        if (this.bulletText) {
            this.bulletText.setText(`${this.bulletCount}`);
        }
    }

    shootProjectile(pointer) {
        if (this.gameOver) return;


        if (this.currentWeapon === 'shotgun') {
            if (this.shotgunAmmo <= 0) {
                this.sound.play('empty_gun', { volume: 0.20 });
                return;
            }

            // Shoot multiple pellets in a spread pattern
            const spreadAngle = 30; // Total spread angle in degrees
            const pelletCount = 8; // Number of pellets per shot
            
            const baseAngle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                pointer.x + this.cameras.main.scrollX,
                pointer.y + this.cameras.main.scrollY
            );

            for (let i = 0; i < pelletCount; i++) {
                const angleOffset = (Math.random() - 0.5) * spreadAngle * (Math.PI / 180);
                const angle = baseAngle + angleOffset;

                const offsetDistance = 40;
                const projectileX = this.shotgun.x + Math.cos(angle) * offsetDistance;
                const projectileY = this.shotgun.y + Math.sin(angle) * offsetDistance;

                const projectile = this.projectiles.create(projectileX, projectileY, 'projectile');
                projectile.setScale(0.6); // Make pellets smaller than regular bullets
                
                const speed = 300 + (Math.random() - 0.5) * 50; // Add some random speed variation
                projectile.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );

                // Destroy pellet after shorter distance than regular bullets
                this.time.delayedCall(300, () => {
                    projectile.destroy();
                });
            }

            // Add strong screen shake for shotgun
            this.cameras.main.shake(100, 0.01);

            this.shotgunAmmo--;
            this.updateWeaponVisibility();

        } else {

            if (this.bulletCount <= 0) {
                this.sound.play('empty_gun', { volume: 0.20 });
                return;
            }
        
            // Get world position of pointer
            const worldPoint = pointer.position;
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                worldPoint.x + this.cameras.main.scrollX,
                worldPoint.y + this.cameras.main.scrollY
            );
        
            // Calculate the position at the end of the gun barrel
            const offsetDistance = 40; // Adjust based on your gun sprite
            const projectileX = this.gun.x + Math.cos(angle) * offsetDistance;
            const projectileY = this.gun.y + Math.sin(angle) * offsetDistance;
    
            // Create projectile at gun's position
            const projectile = this.projectiles.create(projectileX, projectileY, 'projectile');
            
            // Set projectile properties
            const speed = 300;
            projectile.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        
            // Optional: Add rotation to the projectile
            projectile.setRotation(angle);
        
            // Destroy projectile after 2 seconds
            this.time.delayedCall(500, () => {
                projectile.destroy();
            });
    
            this.bulletCount--;
            this.updateBulletDisplay();
        }
    }

    screenShake() {
        this.cameras.main.shake(200, 0.005);  // Duration: 200ms, Intensity: 0.005
    }

    projectileHitEnemy(projectile, enemy) {
        projectile.destroy();
        // Reuse existing hitEnemy logic but pass null as weapon
        this.hitEnemy('projectile', enemy);
    }
  
    doMeleeAttack() {
        this.weapon.body.enable = true;
    
        // Adjust rotation based on facing direction
        const startAngle = this.facingRight ? 0 : 0;
        const endAngle = this.facingRight ? 120 : -120;
    
        this.tweens.add({
            targets: this.weapon,
            angle: { from: startAngle, to: endAngle },
            duration: 190,
            yoyo: true,
            onComplete: () => {
                this.weapon.body.enable = false;
            }
        });
    }
  
    hitEnemy(weapon, enemy) {
        if (!enemy.isHit) {
            enemy.isHit = true;
            
            // Check if this is from a slash attack
            const damage = this.slashCooldown ? this.slashDamage : 1;
            
            if (weapon === 'projectile') {
                this.sound.play('bullet_hit', { volume: 0.20 });
            } else {
                this.sound.play('hitSound', { volume: 0.20 });
            }
            
            // Apply damage
            enemy.hitPoints -= damage;
            enemy.healthText.setText(enemy.hitPoints.toString());
    
            // Create time freeze effect if it's a slash attack
            if (this.slashCooldown) {
                // Slow down time
                this.time.timeScale = 0.8; // Slow everything to 80% speed
    
                // Add a slight desaturation or color tint to everything
                const enemies = this.enemies.getChildren();
                enemies.forEach(e => {
                    e.setTint(0xcccccc);
                });
    
                // Return to normal after a short delay
                this.time.delayedCall(200, () => { // 200ms in real time (feels longer due to time scale)
                    this.time.timeScale = 1; // Return to normal speed
                    enemies.forEach(e => {
                        e.clearTint();
                    });
                });
    
                // Add extra screen shake during time freeze
                this.cameras.main.shake(300, 0.004);
            }
    
            // Add blood effect at enemy position
            createBloodEffect(enemy.x, enemy.y, this.bloodEffects, this.tweens);
    
            // Check if what weapon hit the enemy
            if (weapon !== 'projectile') {
                // Calculate knockback direction from player to enemy
                const angle = Phaser.Math.Angle.Between(
                    this.player.x, this.player.y,
                    enemy.x, enemy.y
                );
    
                // Apply knockback force
                const knockbackForce = this.slashCooldown ? 700 : 500; // Extra knockback for slash attack
                enemy.body.setVelocity(
                    Math.cos(angle) * knockbackForce,
                    Math.sin(angle) * knockbackForce
                );
    
                // Add jitter effect to the enemy
                this.tweens.add({
                    targets: enemy,
                    x: { from: enemy.x - 2, to: enemy.x + 2 },
                    y: { from: enemy.y - 2, to: enemy.y + 2 },
                    duration: 50,
                    yoyo: true,
                    repeat: 2,
                    ease: 'Linear'
                });
            }
    
            this.tweens.add({
                targets: enemy,
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    enemy.isHit = false;
                    if (enemy.hitPoints <= 0) {
                        // Check for drops
                        const roll = Phaser.Math.Between(1, 100);
                        if (roll <= 20) { // 5% chance for health
                            const health = this.healthDrops.create(enemy.x, enemy.y, 'heart1');
                            health.setScale(1);
                            
                            // Add a floating animation to make it more visible
                            this.tweens.add({
                                targets: health,
                                y: health.y - 10,
                                duration: 1000,
                                yoyo: true,
                                repeat: -1,
                                ease: 'Sine.easeInOut'
                            });
                        } else if (roll <= 35) { // 30% chance for ammo (as before)
                            const ammo = this.ammoDrops.create(enemy.x, enemy.y, 'ammo');
                            ammo.setScale(0.8);
                        }
                        
                        enemy.healthText.destroy();
                        enemy.destroy();
                    }
                }
            });
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, MainScene] // Add MenuScene as the first scene
};

const game = new Phaser.Game(config);


const originalMainSceneCreate = MainScene.prototype.create;
MainScene.prototype.create = function() {
    // Add fade-in effect
    this.cameras.main.fadeIn(500);
    
    // Call the original create method
    originalMainSceneCreate.call(this);
};