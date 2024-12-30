export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        // Store a reference to the scene
        this.scene = scene;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);

        // Initialize player stats
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.isInvulnerable = false;

        // Create health display container
        this.healthDisplay = scene.add.container(16, 8);
        this.healthDisplay.setScrollFactor(0);
        this.healthDisplay.setDepth(999);

        // Create heart sprite
        this.heartSprite = scene.add.sprite(32, 32, 'heart1');
        this.heartSprite.setScale(2);
        this.heartSprite.play('heartBeat');
        this.healthDisplay.add(this.heartSprite);

        // Create health number display
        this.healthText = scene.add.text(64, 18, this.health.toString(), {
            fontSize: '16px',
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
        }).setFontStyle('bold');

        this.healthText.setScale(2);
        this.healthText.setScrollFactor(0);
        this.healthText.setDepth(999);
    }

    update(cameraBounds) {
        if (!cameraBounds) return;
        
        // Clamp to camera bounds
        this.x = Phaser.Math.Clamp(
            this.x,
            cameraBounds.left + this.width / 2,
            cameraBounds.right - this.width / 2
        );
        this.y = Phaser.Math.Clamp(
            this.y,
            cameraBounds.top + this.height / 2,
            cameraBounds.bottom - this.height / 2
        );
    }

    collectHealth(healthPickup) {
        if (this.health < this.maxHealth) {
            this.health += 1;
            this.updateHealthDisplay();
            
            // Add healing effect
            this.scene.tweens.add({
                targets: this.heartSprite,
                scale: { from: 2.5, to: 2 },
                duration: 200,
                ease: 'Bounce.Out'
            });
            
            // Optional: Add heal sound if you have one
            // this.scene.sound.play('heal', { volume: 0.2 });
        }

        healthPickup.destroy();
    }

    updateHealthDisplay() {
        this.healthText.setText(this.health.toString());
        
        // Add visual feedback
        this.scene.tweens.add({
            targets: this.heartSprite,
            scale: { from: 2.5, to: 2 },
            duration: 200,
            ease: 'Bounce.Out'
        });
    }

    playerHitByEnemy(enemy) {
        // Make sure we can't take damage too frequently
        if (this.isInvulnerable || this.scene.gameOver) return;
        
        // Set invulnerable immediately to prevent multiple hits
        this.isInvulnerable = true;
        
        // Add knockback to separate player from enemy immediately
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            this.x, this.y
        );
        const knockbackForce = 200;
        this.body.setVelocity(
            Math.cos(angle) * knockbackForce,
            Math.sin(angle) * knockbackForce
        );

        // Shake the screen
        this.scene.screenShake();

        // Flash the screen red
        this.scene.damageFlash.setAlpha(0.3);
        this.scene.tweens.add({
            targets: this.scene.damageFlash,
            alpha: 0,
            duration: 100,
            ease: 'Linear'
        });

        // Pick a random damage sound
        const soundKey = Phaser.Math.RND.pick(['damage', 'damage2', 'damage3']);
        this.scene.sound.play(soundKey, { volume: 0.20 });

        // Reduce player health and update UI
        this.health--;
        this.updateHealthDisplay();

        // Set visual feedback for invulnerability
        this.isInvulnerable = true;
        this.alpha = 0.5;

        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.5, to: 1 },
            duration: 100,
            repeat: 5,
            yoyo: true,
            onComplete: () => {
                this.isInvulnerable = false;
                this.alpha = 1;
            }
        });

        // Check if player died
        if (this.health <= 0) {
            this.scene.gameOver = true;
            this.scene.backgroundMusic.stop();

            const gameOverText = this.scene.add.text(
                this.scene.cameras.main.centerX,
                this.scene.cameras.main.centerY,
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

            const restartButton = this.scene.add.text(
                this.scene.cameras.main.centerX,
                this.scene.cameras.main.centerY + 50,
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
                this.scene.scene.restart();
            });

            // Stop enemies in their tracks
            this.scene.enemies.getChildren().forEach(enemy => {
                enemy.body.setVelocity(0, 0);
            });
        }
    }
}