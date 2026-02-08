import Localization from '../systems/LocalizationSystem.js';
import EventBus from '../systems/EventBus.js';

class Overlays {
  constructor(scene) {
    this.scene = scene;
    this.countdownText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, '', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5).setVisible(false);

    this.victoryContainer = scene.add.container(scene.scale.width / 2, scene.scale.height / 2 + 40);
    const panel = scene.add.rectangle(0, 0, 320, 200, 0x111417, 0.9).setStrokeStyle(2, 0xffffff);
    this.title = scene.add.text(0, -60, Localization.t('victory'), {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#f3d36c'
    }).setOrigin(0.5);

    this.nextButton = scene.add.text(0, 10, Localization.t('nextLevel'), {
      fontFamily: 'Arial',
      fontSize: '20px',
      backgroundColor: '#2d7d46',
      color: '#ffffff',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.restartButton = scene.add.text(0, 60, Localization.t('restart'), {
      fontFamily: 'Arial',
      fontSize: '18px',
      backgroundColor: '#39404a',
      color: '#ffffff',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.victoryContainer.add([panel, this.title, this.nextButton, this.restartButton]);
    this.victoryContainer.setVisible(false);

    this.nextButton.on('pointerdown', () => {
      this.victoryContainer.setVisible(false);
      EventBus.emit('next-level');
    });

    this.restartButton.on('pointerdown', () => {
      this.victoryContainer.setVisible(false);
      EventBus.emit('restart-level');
    });

    EventBus.on('show-countdown', (value) => {
      this.countdownText.setVisible(true);
      this.countdownText.setText(`${Localization.t('respawnIn')} ${value}`);
    });

    EventBus.on('hide-countdown', () => {
      this.countdownText.setVisible(false);
    });

    EventBus.on('show-victory', () => {
      this.victoryContainer.setVisible(true);
    });

    EventBus.on('hide-victory', () => {
      this.victoryContainer.setVisible(false);
    });

    EventBus.on('language-changed', () => {
      this.title.setText(Localization.t('victory'));
      this.nextButton.setText(Localization.t('nextLevel'));
      this.restartButton.setText(Localization.t('restart'));
    });
  }
}

export default Overlays;
