class Pickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, data) {
    super(scene, x, y, texture);
    this.scene = scene;
    this.data = data;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
  }
}

export default Pickup;
