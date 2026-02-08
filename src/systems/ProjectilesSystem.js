import Phaser from 'phaser';
import { WEAPON_DATA } from './WeaponsSystem.js';
import EventBus from './EventBus.js';

class ProjectilesSystem {
  constructor(scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({ classType: Phaser.Physics.Arcade.Image, runChildUpdate: true });
    this.rockets = scene.physics.add.group({ classType: Phaser.Physics.Arcade.Image, runChildUpdate: true });
  }

  spawnBullet(origin, angle, weaponType) {
    const data = WEAPON_DATA[weaponType];
    const bullet = this.bullets.get(origin.x, origin.y, 'bullet');
    if (!bullet) return null;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setRotation(angle);
    bullet.body.setAllowGravity(true);
    bullet.body.setGravityY(data.gravity);
    this.scene.physics.velocityFromRotation(angle, data.bulletSpeed, bullet.body.velocity);
    bullet.lifespan = 1400;
    return bullet;
  }

  spawnRocket(origin, angle) {
    const data = WEAPON_DATA.rpg;
    const rocket = this.rockets.get(origin.x, origin.y, 'rocket');
    if (!rocket) return null;

    rocket.setActive(true);
    rocket.setVisible(true);
    rocket.setRotation(angle);
    rocket.body.setAllowGravity(true);
    rocket.body.setGravityY(data.gravity);
    this.scene.physics.velocityFromRotation(angle, data.bulletSpeed, rocket.body.velocity);
    rocket.lifespan = 2000;
    return rocket;
  }

  update(time, delta) {
    const groups = [this.bullets, this.rockets];
    groups.forEach((group) => {
      group.children.iterate((projectile) => {
        if (!projectile || !projectile.active) return;
        projectile.lifespan -= delta;
        if (projectile.lifespan <= 0) {
          projectile.setActive(false);
          projectile.setVisible(false);
          projectile.body.stop();
        }
      });
    });
  }

  explode(rocket) {
    const data = WEAPON_DATA.rpg;
    const circle = new Phaser.Geom.Circle(rocket.x, rocket.y, data.explosionRadius);
    EventBus.emit('rocket-explode', circle, data.knockback);
    rocket.setActive(false);
    rocket.setVisible(false);
    rocket.body.stop();
  }
}

export default ProjectilesSystem;
