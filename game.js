class MainScene extends Phaser.Scene {
    preload() {
        // Load the assets
        this.load.image('sword', 'assets/sword.png');
        this.load.audio('hitSound', 'assets/hit.wav');
        this.load.image('gun', 'assets/gun.png');
        this.load.audio('damage', 'assets/damage.wav');
        this.load.audio('damage2', 'assets/damage2.wav');
        this.load.audio('damage3', 'assets/damage3.wav');
        this.load.audio('retro_metal', 'assets/retro_metal.ogg');


        // Create a custom cursor texture programmatically
        const cursorGraphics = this.add.graphics();
        
        // Draw outer circle
        cursorGraphics.lineStyle(2, 0xFFFFFF); // White color, 2px thickness
        cursorGraphics.strokeCircle(16, 16, 12); // Center at 16,16, radius 12
        
        // Draw inner circle
        cursorGraphics.lineStyle(2, 0xFFFFFF);
        cursorGraphics.strokeCircle(16, 16, 4);
        
        // Draw crosshair lines
        cursorGraphics.lineStyle(2, 0xFFFFFF);
        // Horizontal line
        cursorGraphics.lineBetween(0, 16, 32, 16);
        // Vertical line
        cursorGraphics.lineBetween(16, 0, 16, 32);
        
        cursorGraphics.generateTexture('cursor', 32, 32);
        cursorGraphics.destroy();
    }

    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.enemies = null;
        this.moveKeys = null;  // Changed from cursors to moveKeys
        this.moveSpeed = 200;
        // Define larger world dimensions
        this.worldWidth = 2400;  // 3x original width
        this.worldHeight = 1800; // 3x original height
        this.shootCooldown = 500;
    }

    create() {
        this.gameOver = false;

        this.backgroundMusic = this.sound.add('retro_metal', {
            volume: 0.3,        // 30% volume
            loop: true,         // Music will loop
            delay: 0            // Start immediately
        });

        this.backgroundMusic.play();

        // Hide the default cursor
        this.input.setDefaultCursor('none');
        
        // Create the cursor sprite and make it follow the pointer
        this.cursor = this.add.sprite(0, 0, 'cursor');
        this.cursor.setDepth(999); // Make sure it's always on top
        
        // Update cursor position in the game loop
        this.input.on('pointermove', (pointer) => {
            this.cursor.x = pointer.x + this.cameras.main.scrollX;
            this.cursor.y = pointer.y + this.cameras.main.scrollY;
        });
        
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
                this.shootProjectile(pointer);
            }
        });

        // Create player graphics and texture (same as before)
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0000FF);
        graphics.fillRect(0, 0, 32, 32);
        
        // Create enemy texture
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0xFFA500);
        enemyGraphics.fillCircle(16, 16, 16);
        enemyGraphics.generateTexture('enemy', 32, 32);
        enemyGraphics.destroy();

        graphics.generateTexture('player', 32, 32);
        graphics.destroy();

        // Create player in the center of the larger world
        this.player = this.add.sprite(
            this.worldWidth / 2,
            this.worldHeight / 2,
            'player'
        );
        
        this.player.health = 10;
        
        this.healthText = this.add.text(16, 16, 'Health: 10', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0);

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
        
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Initialize enemies with more spread across the map
        this.enemies = this.physics.add.group();
        
        // Create initial enemies spread across the map
        this.createEnemy(200, 200);
        this.createEnemy(1200, 800);
        this.createEnemy(2000, 1000);
        this.createEnemy(600, 1500);
        this.createEnemy(1800, 400);

        this.physics.add.overlap(this.weapon, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitByEnemy, null, this);
        
        // Adjust spawn timer for larger map (more frequent spawns)
        this.time.addEvent({
            delay: 3000,  // Spawn every 3 seconds
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true
        });

        // Add collision between projectiles and enemies
        this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHitEnemy, null, this);

        // Add collision between projectiles and terrain
        this.physics.add.collider(this.projectiles, this.terrain, (projectile) => {
            projectile.destroy();
        });

         // Create the gun
         this.gun = this.add.sprite(this.player.x, this.player.y, 'gun');
         // Set the origin to the gun's grip/rotation point (adjust these values based on your gun sprite)
         this.gun.setOrigin(0.3, 0.5);
         // You might need to adjust scale depending on your sprite size
         this.gun.setScale(0.2);
    }

    update() {
        if (this.gameOver) {
            return;
        }
        
        this.player.body.setVelocity(0);

        // Calculate weapon offset based on an angle
        const weaponOffsetX = -40;  // Horizontal distance from player
        const weaponOffsetY = -10;   // Vertical distance from player
        const targetX = this.player.x + weaponOffsetX;
        const targetY = this.player.y + weaponOffsetY;

        const lerpFactor = 0.1;
        this.weapon.x = Phaser.Math.Linear(this.weapon.x, targetX, lerpFactor);
        this.weapon.y = Phaser.Math.Linear(this.weapon.y, targetY, lerpFactor);

        const gunOffsetX = 20;  // Horizontal distance from player
        const gunOffsetY = -10;   // Vertical distance from player

        const targetXGun = this.player.x + gunOffsetX;
        const targetYGun = this.player.y + gunOffsetY;

        this.gun.x = Phaser.Math.Linear(this.gun.x, targetXGun, lerpFactor);
        this.gun.y = Phaser.Math.Linear(this.gun.y, targetYGun, lerpFactor);

        // Calculate angle between gun and cursor for gun rotation
        const angle = Phaser.Math.Angle.Between(
            this.gun.x,
            this.gun.y,
            this.input.activePointer.x + this.cameras.main.scrollX,
            this.input.activePointer.y + this.cameras.main.scrollY
        );

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
            enemy.healthText.x = enemy.x;
            enemy.healthText.y = enemy.y - 20;
            
            const distance = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );
            
            if (distance <= enemy.detectionRadius) {
                const angle = Phaser.Math.Angle.Between(
                    enemy.x, enemy.y,
                    this.player.x, this.player.y
                );
                
                enemy.body.setVelocity(
                    Math.cos(angle) * enemy.moveSpeed,
                    Math.sin(angle) * enemy.moveSpeed
                );
            } else {
                enemy.body.setVelocity(0, 0);
            }
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

        this.player.body.velocity.normalize().scale(this.moveSpeed);
      
        // Keep player within the visible bounds
        const camera = this.cameras.main;
        const cameraBounds = {
            left: camera.scrollX,
            right: camera.scrollX + camera.width,
            top: camera.scrollY,
            bottom: camera.scrollY + camera.height
        };
      
        // Clamp player position to stay within camera bounds
        this.player.x = Phaser.Math.Clamp(
            this.player.x,
            cameraBounds.left + this.player.width/2,
            cameraBounds.right - this.player.width/2
        );
        this.player.y = Phaser.Math.Clamp(
            this.player.y,
            cameraBounds.top + this.player.height/2,
            cameraBounds.bottom - this.player.height/2
        );
        
        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
            this.doMeleeAttack();
        }

        // Update cursor position relative to camera
        this.cursor.x = this.input.activePointer.x + this.cameras.main.scrollX;
        this.cursor.y = this.input.activePointer.y + this.cameras.main.scrollY;

        
    }


    shootProjectile(pointer) {
        if (this.gameOver) return;
    
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
    }

    screenShake() {
        this.cameras.main.shake(200, 0.005);  // Duration: 200ms, Intensity: 0.005
    }

    projectileHitEnemy(projectile, enemy) {
        // Destroy the projectile
        projectile.destroy();
    
        // Reuse existing hitEnemy logic but pass null as weapon
        this.hitEnemy('projectile', enemy);
    }
    
    // The rest of the methods remain unchanged
    spawnEnemies() {
        if (this.gameOver) {
            return;
        }
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(50, this.worldWidth - 50);
            const y = Phaser.Math.Between(50, this.worldHeight - 50);
            this.createEnemy(x, y);
        }
    }

    createEnemy(x, y) {
        const enemy = this.physics.add.sprite(x, y, 'enemy');
        enemy.hitPoints = 3;
        enemy.detectionRadius = 200;
        enemy.moveSpeed = 100;
        
        enemy.healthText = this.add.text(x, y - 20, '3', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 2, y: 2 }
        });
        enemy.healthText.setOrigin(0.5);
        
        this.enemies.add(enemy);
        return enemy;
    }
  
    doMeleeAttack() {
        this.weapon.body.enable = true;

        this.tweens.add({
            targets: this.weapon,
            angle: { from: 0, to: -120 },
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
            if (weapon === 'projectile') {
                this.sound.play('hitSound', { volume: 0.20 });
            } else {
                this.sound.play('hitSound', { volume: 0.20 });
            }
            enemy.hitPoints--;
            enemy.healthText.setText(enemy.hitPoints.toString());

            this.tweens.add({
                targets: enemy,
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    enemy.isHit = false;
                    if (enemy.hitPoints <= 0) {
                        enemy.healthText.destroy();
                        enemy.destroy();
                    }
                }
            });
        }
    }
  
    playerHitByEnemy(player, enemy) {
        if (!player.isInvulnerable) {
            if (this.gameOver) {
                return
            }
            // Add screen shake here
            this.screenShake();

            // Pick a random damage sound
            const soundKey = Phaser.Math.RND.pick(['damage', 'damage2', 'damage3']);
            this.sound.play(soundKey, { volume: 0.20 });

            player.health--;
            this.healthText.setText('Health: ' + player.health);

            player.isInvulnerable = true;
            player.alpha = 0.5;

            this.tweens.add({
                targets: player,
                alpha: { from: 0.5, to: 1 },
                duration: 100,
                repeat: 5,
                yoyo: true,
                onComplete: () => {
                    player.isInvulnerable = false;
                    player.alpha = 1;
                }
            });

            if (player.health <= 0) {
                this.gameOver = true;
                this.backgroundMusic.stop();
                
                const gameOverText = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY,
                    'GAME OVER',
                    {
                        fontSize: '64px',
                        fill: '#ff0000',
                        backgroundColor: '#000',
                        padding: { x: 20, y: 10 }
                    }
                );
                gameOverText.setOrigin(0.5);
                gameOverText.setScrollFactor(0);
              
                const restartButton = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY + 50,
                    'Click to Restart',
                    {
                        fontSize: '32px',
                        fill: '#fff',
                        backgroundColor: '#00aa00',
                        padding: { x: 20, y: 10 }
                    }
                );
                restartButton.setOrigin(0.5);
                restartButton.setScrollFactor(0);
                restartButton.setInteractive({ useHandCursor: true });
              
                restartButton.on('pointerover', () => {
                    restartButton.setStyle({ fill: '#ff0' });
                });
                restartButton.on('pointerout', () => {
                    restartButton.setStyle({ fill: '#fff' });
                });

                restartButton.on('pointerdown', () => {
                    this.scene.restart();
                });
                
                this.enemies.getChildren().forEach(enemy => {
                    enemy.body.setVelocity(0, 0);
                });
            }
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
    scene: MainScene
};

const game = new Phaser.Game(config);