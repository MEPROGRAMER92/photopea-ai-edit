import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const makeRect = (key, width, height, color, alpha = 1) => {
      const gfx = this.add.graphics();
      gfx.fillStyle(color, alpha);
      gfx.fillRoundedRect(0, 0, width, height, 4);
      gfx.generateTexture(key, width, height);
      gfx.destroy();
    };

    makeRect('player-body', 28, 34, 0x4aa3df);
    makeRect('player-upper', 24, 20, 0x2b7eb8);

    makeRect('enemy-basic', 26, 30, 0xdb4c40);
    makeRect('enemy-armored', 30, 34, 0x8a3fbc);

    makeRect('weapon-sword-front', 30, 6, 0xdedede);
    makeRect('weapon-sword-back', 30, 6, 0x9aa0a5);
    makeRect('weapon-ak-front', 36, 8, 0x3a3f44);
    makeRect('weapon-ak-back', 36, 8, 0x23272b);
    makeRect('weapon-rpg-front', 40, 10, 0x4c6f44);
    makeRect('weapon-rpg-back', 40, 10, 0x324b2d);

    makeRect('bullet', 8, 4, 0xf4e86d);
    makeRect('rocket', 12, 6, 0xff944d);
    makeRect('medkit', 18, 18, 0x7bc96f);

    const pickupColors = {
      sword: [0xdedede, 0xbac0c3, 0x9aa0a5],
      ak: [0x3a3f44, 0x4c535a, 0x2d3338],
      rpg: [0x4c6f44, 0x5c8752, 0x3d5e36]
    };

    Object.entries(pickupColors).forEach(([type, colors]) => {
      colors.forEach((color, index) => {
        makeRect(`pickup-${type}-${index + 1}`, 18, 18, color);
      });
    });

    Object.keys(pickupColors).forEach((type) => {
      this.anims.create({
        key: `pickup-${type}`,
        frames: [
          { key: `pickup-${type}-1` },
          { key: `pickup-${type}-2` },
          { key: `pickup-${type}-3` }
        ],
        frameRate: 6,
        repeat: -1
      });
    });
  }

  create() {
    this.scene.start('PreloadScene');
  }
}

export default BootScene;
