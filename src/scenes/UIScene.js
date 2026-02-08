import Phaser from 'phaser';
import Hud from '../ui/Hud.js';
import WeaponBar from '../ui/WeaponBar.js';
import Overlays from '../ui/Overlays.js';
import Localization from '../systems/LocalizationSystem.js';
import EventBus from '../systems/EventBus.js';

class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.hud = new Hud(this);
    this.weaponBar = new WeaponBar(this);
    this.overlays = new Overlays(this);

    this.languageToggle = this.add.text(this.scale.width - 20, 20, this.getLanguageLabel(), {
      fontFamily: 'Arial',
      fontSize: '14px',
      backgroundColor: '#39404a',
      color: '#ffffff',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    this.languageToggle.on('pointerdown', () => {
      const newLang = Localization.language === 'en' ? 'ar' : 'en';
      Localization.setLanguage(newLang);
      EventBus.emit('language-changed', newLang);
      this.languageToggle.setText(this.getLanguageLabel());
    });

    EventBus.on('language-changed', () => {
      this.languageToggle.setText(this.getLanguageLabel());
    });
  }

  getLanguageLabel() {
    return `${Localization.t('language')}: ${Localization.language === 'en' ? Localization.t('english') : Localization.t('arabic')}`;
  }
}

export default UIScene;
