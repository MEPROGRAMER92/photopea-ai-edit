import Phaser from 'phaser';
import EventBus from '../systems/EventBus.js';
import { WEAPON_DATA } from '../systems/WeaponsSystem.js';

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-body');
    this.scene = scene;
    this.maxHp = 100;
    this.hp = 100;
    this.speed = 180;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);

    this.upperBody = scene.add.sprite(x, y, 'player-upper');
    this.upperBody.setOrigin(0.5, 0.7);

    this.weaponBack = scene.add.sprite(x, y, 'weapon-sword-back');
    this.weaponFront = scene.add.sprite(x, y, 'weapon-sword-front');

    this.weaponBack.setOrigin(0.15, 0.5);
    this.weaponFront.setOrigin(0.15, 0.5);

    this.rigOffsets = {
      upper: new Phaser.Math.Vector2(0, -6),
      weapon: new Phaser.Math.Vector2(18, -2)
    };

    this.aimAngle = 0;
    this.smoothedAngle = 0;
    this.comboWindow = 600;
    this.lastComboTime = 0;
  }

  setWeaponSprites(type) {
    this.weaponBack.setTexture(`weapon-${type}-back`);
    this.weaponFront.setTexture(`weapon-${type}-front`);
  }

  updateRig(pointer, delta) {
    const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    this.aimAngle = targetAngle;
    this.smoothedAngle = Phaser.Math.Angle.RotateTo(this.smoothedAngle, targetAngle, 0.005 * delta);

    const offset = this.rigOffsets.upper.clone().rotate(this.smoothedAngle);
    this.upperBody.setPosition(this.x + offset.x, this.y + offset.y);
    this.upperBody.setRotation(this.smoothedAngle);

    const weaponOffset = this.rigOffsets.weapon.clone().rotate(this.smoothedAngle);
    this.weaponBack.setPosition(this.upperBody.x + weaponOffset.x, this.upperBody.y + weaponOffset.y);
    this.weaponFront.setPosition(this.upperBody.x + weaponOffset.x, this.upperBody.y + weaponOffset.y);
    this.weaponBack.setRotation(this.smoothedAngle);
    this.weaponFront.setRotation(this.smoothedAngle);

    const facingLeft = this.smoothedAngle > Math.PI / 2 || this.smoothedAngle < -Math.PI / 2;
    this.upperBody.setFlipY(facingLeft);
    this.weaponBack.setFlipY(facingLeft);
    this.weaponFront.setFlipY(facingLeft);

    this.weaponBack.setDepth(this.depth - 1);
    this.weaponFront.setDepth(this.depth + 1);
    this.upperBody.setDepth(this.depth);
  }

  move(input) {
    const move = input.getMoveVector();
    const vector = new Phaser.Math.Vector2(move.x, move.y).normalize();
    this.body.setVelocity(vector.x * this.speed, vector.y * this.speed);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    EventBus.emit('player-hurt', this.hp, this.maxHp);
    if (this.hp <= 0) {
      EventBus.emit('player-died');
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    EventBus.emit('player-hurt', this.hp, this.maxHp);
  }

  attemptMeleeAttack(weapon, now, enemies) {
    const data = WEAPON_DATA.sword;
    if (now - weapon.lastAttackTime < data.attackCooldown) return false;

    if (now - this.lastComboTime > this.comboWindow) {
      weapon.comboStep = 0;
    }

    weapon.comboStep = (weapon.comboStep % data.comboMax) + 1;
    weapon.lastAttackTime = now;
    this.lastComboTime = now;

    const range = 50 + weapon.comboStep * 4;
    const arc = Phaser.Math.DegToRad(80);
    const hits = [];

    enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (distance > range) return;
      const angleToEnemy = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
      const delta = Phaser.Math.Angle.Wrap(angleToEnemy - this.smoothedAngle);
      if (Math.abs(delta) <= arc / 2) {
        hits.push(enemy);
      }
    });

    hits.forEach((enemy) => {
      enemy.takeDamage(8 + weapon.comboStep * 4);
      const force = new Phaser.Math.Vector2(enemy.x - this.x, enemy.y - this.y)
        .normalize()
        .scale(data.knockback + weapon.comboStep * 20);
      enemy.applyKnockback(force);
    });

    EventBus.emit('combo-step', weapon.comboStep);
    return true;
  }
}

export default Player;
