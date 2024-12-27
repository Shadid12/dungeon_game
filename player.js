export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
      // Pass required arguments to Phaser.Physics.Arcade.Sprite
      super(scene, x, y, texture);
  
      // Add the sprite to the scene
      scene.add.existing(this);
  
      // Enable physics for the player
      scene.physics.add.existing(this);
  
      // Optional: If you want the player to collide with world bounds
      this.setCollideWorldBounds(true);
    }
  
    // If your player has any custom update logic, you can add it here
    update(cameraBounds) {
        // Example: Move player or handle animations if needed

        // Make sure cameraBounds is a valid Phaser.Geom.Rectangle
        if (!cameraBounds) return;

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
  }
  