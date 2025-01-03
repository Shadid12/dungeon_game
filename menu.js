export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Load any menu assets here
        this.load.image('startButton', 'assets/start_button.png');
    }

    create() {
        // --- 1) Re-enable input systems (in case previous scenes disabled them) ---
        // This helps ensure the keyboard/mouse are active again
        this.input.enabled = true;
        this.input.keyboard.enabled = true;
        this.input.mouse.enabled = true;

        // --- 2) Remove any stray keyboard listeners from previous scenes ---
        // This just clears out leftover callbacks (like WASD or other events you had).
        this.input.keyboard.removeAllListeners();
        
        // --- 3) Restore the default mouse cursor ---
        this.input.setDefaultCursor('default');
        
        // Now you have a “clean slate” for input.

        // --- The rest of your Menu logic ---
        const title = this.add.text(400, 100, 'Survivor ', {
            fontSize: '64px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

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
            'Survive and defeat the hordes!',
        ];

        this.add.text(400, 250, instructions, {
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

        startButton.setInteractive();
        
        // Hover effect
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

        // Click handler to start the game
        startButton.on('pointerdown', () => {
            this.tweens.add({
                targets: [startButton, startText],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.cameras.main.fade(500, 0, 0, 0);
                    this.time.delayedCall(500, () => {
                        // Stop the current scene before starting the new one
                        this.scene.stop('MenuScene');
                        this.scene.start('MainScene');
                    });
                }
            });
        });
    }
}
