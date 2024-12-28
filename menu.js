export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Load any menu assets here
        this.load.image('startButton', 'assets/start_button.png');
    }

    create() {
        // Add title text
        const title = this.add.text(400, 100, 'Goblin Slayer', {
            fontSize: '64px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add instructions text
        const instructions = [
            '',
            'Use "W" "A" "S" "D" for movement',
            '',
            'COMBAT',
            'Left Click - Primary Attack',
            'Right Click - Special Attack',
            'Tab - Switch Weapons',
            '',
            'OBJECTIVE',
            'Survive and defeat the goblin hordes!',
        ];

        const instructionsText = this.add.text(400, 250, instructions, {
            fontSize: '20px',
            fill: '#fff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // Create start button
        const startButton = this.add.rectangle(400, 500, 200, 60, 0x00ff00);
        const startText = this.add.text(400, 500, 'Start Game', {
            fontSize: '32px',
            fill: '#000'
        }).setOrigin(0.5);

        // Make button interactive
        startButton.setInteractive();
        
        // Add hover effect
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x00dd00);
            this.tweens.add({
                targets: [startButton, startText],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });

        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x00ff00);
            this.tweens.add({
                targets: [startButton, startText],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        // Add click handler to start the game
        startButton.on('pointerdown', () => {
            // Add click animation
            this.tweens.add({
                targets: [startButton, startText],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    // Start fade out transition
                    this.cameras.main.fade(500, 0, 0, 0);
                    this.time.delayedCall(500, () => {
                        this.scene.start('MainScene');
                    });
                }
            });
        });
    }
}