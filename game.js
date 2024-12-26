class MainScene extends Phaser.Scene {
    preload() {
        // Load the sword sprite
        this.load.image('sword', 'assets/sword.png');
    }

    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.enemies = null;
        this.cursors = null;
        this.moveSpeed = 200;
        // Define larger world dimensions
        this.worldWidth = 2400;  // 3x original width
        this.worldHeight = 1800; // 3x original height
    }

    create() {
        this.gameOver = false;
        
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

        this.cursors = this.input.keyboard.createCursorKeys();
        
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

        // Update weapon position relative to player
        // this.weapon.x = this.player.x + weaponOffsetX;
        // this.weapon.y = this.player.y + weaponOffsetY;

        const lerpFactor = 0.1;
        this.weapon.x = Phaser.Math.Linear(this.weapon.x, targetX, lerpFactor);
        this.weapon.y = Phaser.Math.Linear(this.weapon.y, targetY, lerpFactor);
        
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

        // Handle movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-this.moveSpeed);
        }
        if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(this.moveSpeed);
        }
        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-this.moveSpeed);
        }
        if (this.cursors.down.isDown) {
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
    }
    
    // The rest of the methods remain the same, but update spawnEnemies to use new world bounds
    spawnEnemies() {
        if (this.gameOver) {
            return;
        }
        for (let i = 0; i < 2; i++) {
            const x = Phaser.Math.Between(50, this.worldWidth - 50);
            const y = Phaser.Math.Between(50, this.worldHeight - 50);
            this.createEnemy(x, y);
        }
    }

    // Include all other existing methods (createEnemy, doMeleeAttack, hitEnemy, playerHitByEnemy)
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