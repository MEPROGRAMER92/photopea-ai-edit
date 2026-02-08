import Localization from '../systems/LocalizationSystem.js';
import EventBus from '../systems/EventBus.js';

class Hud {
  constructor(scene) {
    this.scene = scene;
    this.healthText = scene.add.text(20, 20, `${Localization.t('health')}: 100`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    });

    this.ammoText = scene.add.text(20, 44, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfd2d6'
    });

    EventBus.on('player-hurt', (hp, maxHp) => {
      this.healthText.setText(`${Localization.t('health')}: ${hp}/${maxHp}`);
    });

    EventBus.on('weapon-ammo', (weapon) => {
      if (weapon?.ammo !== null) {
        this.ammoText.setText(`Ammo: ${weapon.ammo}/${weapon.maxAmmo}`);
      } else {
        this.ammoText.setText('');
      }
    });

    EventBus.on('weapon-changed', (slots, activeIndex) => {
      const weapon = slots[activeIndex];
      if (weapon?.ammo !== null) {
        this.ammoText.setText(`Ammo: ${weapon.ammo}/${weapon.maxAmmo}`);
      } else {
        this.ammoText.setText('');
      }
    });

    EventBus.on('language-changed', () => {
      this.refreshLabels();
      this.applyLayout();
    });

    this.applyLayout();
  }

  refreshLabels() {
    const current = this.healthText.text.split(': ')[1] || '100';
    this.healthText.setText(`${Localization.t('health')}: ${current}`);
  }

  applyLayout() {
    const isRTL = Localization.isRTL();
    const x = isRTL ? this.scene.scale.width - 20 : 20;
    const originX = isRTL ? 1 : 0;
    this.healthText.setOrigin(originX, 0);
    this.ammoText.setOrigin(originX, 0);
    this.healthText.setX(x);
    this.ammoText.setX(x);
  }
}

export default Hud;
