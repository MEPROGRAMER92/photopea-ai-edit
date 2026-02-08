import Phaser from 'phaser';
import Player from '../entities/Player.js';
import InputSystem from '../systems/InputSystem.js';
import WeaponsSystem, { WEAPON_DATA } from '../systems/WeaponsSystem.js';
import ProjectilesSystem from '../systems/ProjectilesSystem.js';
import DropsSystem from '../systems/DropsSystem.js';
import EnemiesSystem from '../systems/EnemiesSystem.js';
import Save from '../systems/SaveSystem.js';
import EventBus from '../systems/EventBus.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1115');

    this.inputSystem = new InputSystem(this);
    this.weaponsSystem = new WeaponsSystem(this);
    this.projectilesSystem = new ProjectilesSystem(this);
    this.dropsSystem = new DropsSystem(this);
    this.enemiesSystem = new EnemiesSystem(this);

    this.player = new Player(this, 400, 300);
    this.player.setDepth(10);

    const saved = Save.load();
    if (saved) {
      this.player.hp = saved.hp;
      saved.slots.forEach((slot, index) => {
        if (slot) {
          this.weaponsSystem.slots[index] = this.weaponsSystem.createWeaponInstance(slot.type);
        }
      });
      this.weaponsSystem.activeIndex = saved.activeIndex ?? 0;
      if (!this.weaponsSystem.getActiveWeapon()) {
        this.weaponsSystem.addWeapon('sword');
      }
      EventBus.emit('weapon-changed', this.weaponsSystem.slots, this.weaponsSystem.activeIndex);
      EventBus.emit('player-hurt', this.player.hp, this.player.maxHp);
    } else {
      this.weaponsSystem.addWeapon('sword');
    }

    this.player.setWeaponSprites(this.weaponsSystem.getActiveWeapon()?.type || 'sword');
    const activeWeapon = this.weaponsSystem.getActiveWeapon();
    if (activeWeapon?.ammo !== null) {
      EventBus.emit('weapon-ammo', activeWeapon);
    }

    this.spawnEnemies();
    this.spawnInitialDrops();

    this.physics.add.overlap(this.player, this.dropsSystem.group, (player, pickup) => {
      this.handlePickup(pickup);
    });

    this.physics.add.overlap(this.projectilesSystem.bullets, this.enemiesSystem.group, (bullet, enemy) => {
      if (!bullet.active || !enemy.active) return;
      enemy.takeDamage(16);
      this.applyKnockback(enemy, bullet, WEAPON_DATA.ak.knockback);
      bullet.setActive(false);
      bullet.setVisible(false);
      bullet.body.stop();
    });

    this.physics.add.overlap(this.projectilesSystem.rockets, this.enemiesSystem.group, (rocket, enemy) => {
      if (!rocket.active || !enemy.active) return;
      this.projectilesSystem.explode(rocket);
    });

    EventBus.on('rocket-explode', (circle, force) => {
      this.enemiesSystem.group.children.iterate((enemy) => {
        if (!enemy || !enemy.active) return;
        const distance = Phaser.Math.Distance.Between(circle.x, circle.y, enemy.x, enemy.y);
        if (distance <= circle.radius) {
          enemy.takeDamage(40);
          const direction = new Phaser.Math.Vector2(enemy.x - circle.x, enemy.y - circle.y).normalize();
          enemy.applyKnockback(direction.scale(force));
        }
      });
    });

    this.input.on('pointerdown', () => {
      this.handleAttack();
    });

    this.input.keyboard.on('keydown-ONE', () => this.weaponsSystem.selectSlot(0));
    this.input.keyboard.on('keydown-TWO', () => this.weaponsSystem.selectSlot(1));
    this.input.keyboard.on('keydown-THREE', () => this.weaponsSystem.selectSlot(2));
    this.input.keyboard.on('keydown-R', () => {
      const weapon = this.weaponsSystem.getActiveWeapon();
      if (weapon) {
        this.weaponsSystem.reloadWeapon(weapon);
      }
    });

    EventBus.on('weapon-changed', (slots, activeIndex) => {
      const weapon = slots[activeIndex];
      if (weapon) {
        this.player.setWeaponSprites(weapon.type);
      }
      this.saveProgress();
    });

    this.events.on('enemy-died', (enemy) => {
      this.tryDrop(enemy);
      this.checkVictory();
    });

    EventBus.on('player-died', () => {
      this.handleDeath();
    });

    EventBus.on('restart-level', () => {
      this.scene.restart();
    });

    EventBus.on('next-level', () => {
      this.scene.restart();
    });

    this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => this.saveProgress()
    });
  }

  spawnEnemies() {
    this.enemiesSystem.spawnBasic(200, 200);
    this.enemiesSystem.spawnBasic(600, 220);
    this.enemiesSystem.spawnArmored(520, 420);
    this.enemiesSystem.spawnBasic(300, 460);
  }

  spawnInitialDrops() {
    this.dropsSystem.spawnWeaponDrop('ak', 500, 140);
    this.dropsSystem.spawnWeaponDrop('rpg', 140, 420);
    this.dropsSystem.spawnMedkit(420, 360);
  }

  handlePickup(pickup) {
    if (!pickup.active) return;
    if (pickup.data.kind === 'weapon') {
      const dropped = this.weaponsSystem.addWeapon(pickup.data.type);
      if (dropped) {
        this.dropsSystem.spawnWeaponDrop(dropped.type, this.player.x + 24, this.player.y + 10);
      }
    }

    if (pickup.data.kind === 'medkit') {
      this.player.heal(30);
    }

    pickup.destroy();
    this.saveProgress();
  }

  handleAttack() {
    const weapon = this.weaponsSystem.getActiveWeapon();
    if (!weapon) return;

    const now = this.time.now;
    const data = WEAPON_DATA[weapon.type];
    if (!this.weaponsSystem.canFire(weapon, now)) return;

    if (data.type === 'melee') {
      this.player.attemptMeleeAttack(weapon, now, this.enemiesSystem.group);
      weapon.lastAttackTime = now;
      return;
    }

    weapon.lastFired = now;
    const muzzle = this.getMuzzlePosition();

    if (weapon.type === 'ak') {
      this.projectilesSystem.spawnBullet(muzzle, this.player.smoothedAngle, weapon.type);
      this.weaponsSystem.consumeAmmo(weapon);
      EventBus.emit('weapon-ammo', weapon);
    }

    if (weapon.type === 'rpg') {
      this.projectilesSystem.spawnRocket(muzzle, this.player.smoothedAngle);
      this.weaponsSystem.consumeAmmo(weapon);
      EventBus.emit('weapon-ammo', weapon);
    }
  }

  getMuzzlePosition() {
    const offset = new Phaser.Math.Vector2(26, -2).rotate(this.player.smoothedAngle);
    return { x: this.player.x + offset.x, y: this.player.y + offset.y };
  }

  applyKnockback(enemy, projectile, strength) {
    const force = new Phaser.Math.Vector2(enemy.x - projectile.x, enemy.y - projectile.y)
      .normalize()
      .scale(strength);
    enemy.applyKnockback(force);
  }

  tryDrop(enemy) {
    if (Math.random() < enemy.dropChance) {
      const weapons = ['sword', 'ak', 'rpg'];
      const type = Phaser.Utils.Array.GetRandom(weapons);
      this.dropsSystem.spawnWeaponDrop(type, enemy.x, enemy.y);
    } else if (Math.random() < 0.3) {
      this.dropsSystem.spawnMedkit(enemy.x, enemy.y);
    }
  }

  handleDeath() {
    this.player.setActive(false);
    this.player.setVisible(false);
    this.player.upperBody.setVisible(false);
    this.player.weaponBack.setVisible(false);
    this.player.weaponFront.setVisible(false);

    let countdown = 5;
    EventBus.emit('show-countdown', countdown);

    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        countdown -= 1;
        if (countdown > 0) {
          EventBus.emit('show-countdown', countdown);
        } else {
          EventBus.emit('hide-countdown');
          timer.remove();
          this.respawnPlayer();
        }
      }
    });
  }

  respawnPlayer() {
    this.player.enableBody(true, 400, 300, true, true);
    this.player.upperBody.setVisible(true);
    this.player.weaponBack.setVisible(true);
    this.player.weaponFront.setVisible(true);
    this.player.hp = this.player.maxHp;
    EventBus.emit('player-hurt', this.player.hp, this.player.maxHp);
  }

  checkVictory() {
    const alive = this.enemiesSystem.group.countActive(true);
    if (alive === 0) {
      EventBus.emit('show-victory');
    }
  }

  saveProgress() {
    const slots = this.weaponsSystem.slots.map((slot) => (slot ? { type: slot.type } : null));
    Save.save({
      level: 1,
      hp: this.player.hp,
      slots,
      activeIndex: this.weaponsSystem.activeIndex
    });
  }

  update(time, delta) {
    if (!this.player.active) return;

    this.inputSystem && this.player.move(this.inputSystem);
    this.player.updateRig(this.input.activePointer, delta);
    this.enemiesSystem.update(this.player);
    this.projectilesSystem.update(time, delta);
  }
}

export default GameScene;
