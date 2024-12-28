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
}