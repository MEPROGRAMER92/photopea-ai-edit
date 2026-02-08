import EnemyBase from './EnemyBase.js';

class ArmoredEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy-armored', { hp: 70, speed: 60, dropChance: 0.5 });
    this.setScale(1.1);
  }
}

export default ArmoredEnemy;
