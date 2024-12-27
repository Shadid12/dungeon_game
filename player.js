export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        // Store a reference to the scene so we can access scene variables/methods
        this.scene = scene;
        
        // Add the sprite to the scene
        scene.add.existing(this);
        
        // Enable physics for the player
        scene.physics.add.existing(this);
        
        // Optional: collide with world bounds
        this.setCollideWorldBounds(true);

        // Initialize health and invulnerability on the player itself
        this.health = 10;
        this.isInvulnerable = false;
    }

    update(cameraBounds) {
        if (!cameraBounds) return;
        
        // Example clamp to camera
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

    /**
     * Handle when the player is overlapped by an enemy
     */
    playerHitByEnemy(enemy) {
        // Make sure we can't take damage too frequently
        if (this.isInvulnerable) return;

        // If the game is already over, skip
        if (this.scene.gameOver) {
            return;
        }

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
        this.scene.updateHealthDisplay(this.health);

        // Set player temporarily invulnerable
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
