import EnemyBase from '../entities/EnemyBase.js';
import ArmoredEnemy from '../entities/ArmoredEnemy.js';

class EnemiesSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.group();
  }

  spawnBasic(x, y) {
    const enemy = new EnemyBase(this.scene, x, y, 'enemy-basic', { hp: 35, speed: 90, dropChance: 0.35 });
    this.group.add(enemy);
    return enemy;
  }

  spawnArmored(x, y) {
    const enemy = new ArmoredEnemy(this.scene, x, y);
    this.group.add(enemy);
    return enemy;
  }

  update(player) {
    this.group.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      enemy.update(player);
    });
  }
}

export default EnemiesSystem;
