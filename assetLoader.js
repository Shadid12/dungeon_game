export default class AssetLoader {
    static loadAudio(scene) {
        scene.load.audio('hitSound', 'assets/hit.wav');
        scene.load.audio('damage', 'assets/damage.wav');
        scene.load.audio('damage2', 'assets/damage2.wav');
        scene.load.audio('damage3', 'assets/damage3.wav');
        // scene.load.audio('retro_metal', 'assets/retro_metal.ogg');
        scene.load.audio('goblin_theme', 'assets/goblin_theme.wav');
        scene.load.audio('empty_gun', 'assets/empty.mp3');
        scene.load.audio('reload', 'assets/reload.mp3');
        scene.load.audio('bullet_hit', 'assets/bullet_hit.mp3');
    }

    /**
     * Loads goblin-related assets, including idle and run frames.
     */
    static loadGoblinAssets(scene) {
        // Goblin idle frames
        scene.load.image('goblin1', 'assets/goblin/goblin_1.png');
        scene.load.image('goblin2', 'assets/goblin/goblin_2.png');
        scene.load.image('goblin3', 'assets/goblin/goblin_3.png');

        // Goblin run frames
        for (let i = 0; i < 6; i++) {
            scene.load.image(`goblin_run${i}`, `assets/goblin/goblin_run${i}.png`);
        }
    }


    static loadCustomCursor(scene) {
        const cursorGraphics = scene.add.graphics();
        
        // Draw outer circle
        cursorGraphics.lineStyle(2, 0xffffff);
        cursorGraphics.strokeCircle(16, 16, 12);
        
        // Draw inner circle
        cursorGraphics.lineStyle(2, 0xffffff);
        cursorGraphics.strokeCircle(16, 16, 4);

        // Crosshair lines
        cursorGraphics.lineStyle(2, 0xffffff);
        cursorGraphics.lineBetween(0, 16, 32, 16);
        cursorGraphics.lineBetween(16, 0, 16, 32);

        // Generate a texture called 'cursor'
        cursorGraphics.generateTexture('cursor', 32, 32);
        cursorGraphics.destroy();
    }
}