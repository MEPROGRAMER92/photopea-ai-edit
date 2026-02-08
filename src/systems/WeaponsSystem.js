import EventBus from './EventBus.js';

const WEAPON_DATA = {
  sword: {
    name: 'Sword',
    type: 'melee',
    comboMax: 4,
    attackCooldown: 220,
    knockback: 220
  },
  ak: {
    name: 'AK-47',
    type: 'gun',
    fireRate: 120,
    bulletSpeed: 520,
    gravity: 120,
    clipSize: 20,
    reloadTime: 1000,
    knockback: 140
  },
  rpg: {
    name: 'RPG',
    type: 'launcher',
    fireRate: 700,
    bulletSpeed: 320,
    gravity: 180,
    clipSize: 4,
    reloadTime: 1400,
    knockback: 360,
    explosionRadius: 90
  }
};

class WeaponsSystem {
  constructor(scene) {
    this.scene = scene;
    this.slots = [null, null, null];
    this.activeIndex = 0;
  }

  getWeaponData(type) {
    return WEAPON_DATA[type];
  }

  getActiveWeapon() {
    return this.slots[this.activeIndex];
  }

  selectSlot(index) {
    if (this.slots[index]) {
      this.activeIndex = index;
      EventBus.emit('weapon-changed', this.slots, this.activeIndex);
    }
  }

  addWeapon(type) {
    const newWeapon = this.createWeaponInstance(type);
    const emptyIndex = this.slots.findIndex((slot) => slot === null);
    let dropped = null;

    if (emptyIndex !== -1) {
      this.slots[emptyIndex] = newWeapon;
      this.activeIndex = emptyIndex;
    } else {
      dropped = this.slots[this.activeIndex];
      this.slots[this.activeIndex] = newWeapon;
    }

    EventBus.emit('weapon-changed', this.slots, this.activeIndex);
    return dropped;
  }

  createWeaponInstance(type) {
    const data = WEAPON_DATA[type];
    if (!data) return null;

    return {
      type,
      name: data.name,
      ammo: data.clipSize || null,
      maxAmmo: data.clipSize || null,
      lastFired: 0,
      comboStep: 0,
      lastAttackTime: 0
    };
  }

  canFire(weapon, now) {
    const data = WEAPON_DATA[weapon.type];
    if (data.type === 'melee') {
      return now - weapon.lastAttackTime > data.attackCooldown;
    }

    if (weapon.ammo !== null && weapon.ammo <= 0) {
      return false;
    }

    return now - weapon.lastFired > data.fireRate;
  }

  consumeAmmo(weapon) {
    if (weapon.ammo !== null) {
      weapon.ammo = Math.max(0, weapon.ammo - 1);
    }
  }

  reloadWeapon(weapon) {
    const data = WEAPON_DATA[weapon.type];
    if (!data.clipSize) return;
    if (weapon.ammo === data.clipSize) return;

    this.scene.time.delayedCall(data.reloadTime, () => {
      weapon.ammo = data.clipSize;
      EventBus.emit('weapon-ammo', weapon);
    });
  }
}

export { WEAPON_DATA };
export default WeaponsSystem;
