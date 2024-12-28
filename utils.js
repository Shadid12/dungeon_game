export function createBloodEffect(x, y, bloodEffects, tweens) {
    const blood = bloodEffects.create(x, y, 'blood');
    blood.setAlpha(0.5);
    blood.setScale(1.5); // Adjust scale as needed
    
    // Random rotation for variety
    blood.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    
    // Fade out and destroy effect
    tweens.add({
        targets: blood,
        alpha: 0,
        scale: 0.8,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
            blood.destroy();
        }
    });
}


export function createEnemy(scene, x, y, enemiesGroup) {
    const enemy = scene.physics.add.sprite(x, y, 'goblin1');

    // Start the idle animation
    enemy.play('goblin_idle');

    // Adjust scale and stats
    enemy.setScale(0.2);
    enemy.hitPoints = 3;
    enemy.detectionRadius = 200;
    enemy.moveSpeed = 100;
    enemy.maxSpeed = 140;

    // Add health text above the goblin
    enemy.healthText = scene.add.text(x, y - 40, '3', {
        fontSize: '16px',
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 2, y: 2 }
    }).setOrigin(0.5);

    // Define an updateDirection method to handle flipping and animation states
    enemy.updateDirection = () => {
        const isMoving = enemy.body.velocity.length() > 0;
        
        // Switch between run/idle animations
        if (isMoving) {
            if (enemy.anims.currentAnim?.key !== 'goblin_run') {
                enemy.play('goblin_run');
            }
        } else {
            if (enemy.anims.currentAnim?.key !== 'goblin_idle') {
                enemy.play('goblin_idle');
            }
        }

        // Flip sprite if moving left
        if (enemy.body.velocity.x < 0) {
            enemy.setFlipX(true);
        } else if (enemy.body.velocity.x > 0) {
            enemy.setFlipX(false);
        }
    };

    // Finally, add the enemy to the specified group
    enemiesGroup.add(enemy);

    return enemy;
}


// At the bottom of util.js (or anywhere you like in that file):

export function spawnEnemies(scene) {
    if (scene.gameOver) {
        return;
    }

    const MIN_SPAWN_DISTANCE = 400; // Minimum distance from player (in pixels)
    const MAX_ATTEMPTS = 10; // Maximum attempts to find a valid spawn position

    for (let i = 0; i < 5; i++) {
        let validPosition = false;
        let attempts = 0;
        let x, y;

        // Keep trying until we find a valid position or run out of attempts
        while (!validPosition && attempts < MAX_ATTEMPTS) {
            // Generate random position
            x = Phaser.Math.Between(50, scene.worldWidth - 50);
            y = Phaser.Math.Between(50, scene.worldHeight - 50);

            // Calculate distance from player
            const distance = Phaser.Math.Distance.Between(
                x, 
                y,
                scene.player.x, 
                scene.player.y
            );

            // Check if position is far enough from player
            if (distance >= MIN_SPAWN_DISTANCE) {
                validPosition = true;
            }

            attempts++;
        }

        // Only create enemy if we found a valid position
        if (validPosition) {
            createEnemy(scene, x, y, scene.enemies);
        }
    }
}