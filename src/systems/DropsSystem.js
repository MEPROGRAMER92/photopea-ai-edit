import Pickup from '../entities/Pickups.js';

class DropsSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.group();
  }

  spawnWeaponDrop(type, x, y) {
    const pickup = new Pickup(this.scene, x, y, `pickup-${type}-1`, { type, kind: 'weapon' });
    this.group.add(pickup);
    pickup.play(`pickup-${type}`);
    return pickup;
  }

  spawnMedkit(x, y) {
    const pickup = new Pickup(this.scene, x, y, 'medkit', { kind: 'medkit' });
    this.group.add(pickup);
    return pickup;
  }
}

export default DropsSystem;
