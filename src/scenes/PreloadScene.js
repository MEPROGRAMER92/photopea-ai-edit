import Phaser from 'phaser';

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create() {
    this.scene.start('MenuScene');
  }
}

export default PreloadScene;
