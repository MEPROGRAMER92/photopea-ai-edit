import Phaser from 'phaser';

class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);
    this.scene = scene;
    this.hp = config.hp || 30;
    this.speed = config.speed || 80;
    this.dropChance = config.dropChance ?? 0.3;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
  }

  update(player) {
    if (!player || !player.active) return;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  applyKnockback(force) {
    this.body.velocity.x += force.x;
    this.body.velocity.y += force.y;
  }

  die() {
    this.disableBody(true, true);
    this.scene.events.emit('enemy-died', this);
  }
}

export default EnemyBase;
