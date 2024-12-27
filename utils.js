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