import Phaser from 'phaser';
import Localization from '../systems/LocalizationSystem.js';
import Save from '../systems/SaveSystem.js';
import EventBus from '../systems/EventBus.js';

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1b1b1f');

    this.titleText = this.add.text(0, 80, Localization.t('title'), {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#f5f5f5'
    });

    this.usernameLabel = this.add.text(0, 160, Localization.t('username'), {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#cfd2d6'
    });

    this.usernameInput = this.add.dom(0, 200).createFromHTML(
      `<input type="text" name="username" placeholder="${Localization.t('username')}" />`
    );

    this.startButton = this.add.text(0, 270, Localization.t('start'), {
      fontFamily: 'Arial',
      fontSize: '24px',
      backgroundColor: '#2d7d46',
      color: '#ffffff',
      padding: { left: 16, right: 16, top: 8, bottom: 8 }
    }).setInteractive({ useHandCursor: true });

    this.languageButton = this.add.text(0, 330, Localization.t('language'), {
      fontFamily: 'Arial',
      fontSize: '20px',
      backgroundColor: '#39404a',
      color: '#ffffff',
      padding: { left: 16, right: 16, top: 6, bottom: 6 }
    }).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', () => {
      const inputNode = this.usernameInput.getChildByName('username');
      Save.setUsername(inputNode?.value || 'Player');
      EventBus.emit('username-changed', Save.username);
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    this.languageButton.on('pointerdown', () => {
      const newLang = Localization.language === 'en' ? 'ar' : 'en';
      Localization.setLanguage(newLang);
      EventBus.emit('language-changed', newLang);
      this.refreshLayout();
    });

    this.refreshLayout();
  }

  refreshLayout() {
    const { width } = this.scale;
    const isRTL = Localization.isRTL();
    const x = isRTL ? width - 80 : 80;

    this.titleText.setText(Localization.t('title'));
    this.usernameLabel.setText(Localization.t('username'));
    this.startButton.setText(Localization.t('start'));
    this.languageButton.setText(`${Localization.t('language')}: ${Localization.language === 'en' ? Localization.t('english') : Localization.t('arabic')}`);

    [this.titleText, this.usernameLabel, this.startButton, this.languageButton].forEach((text, index) => {
      text.setOrigin(isRTL ? 1 : 0, 0.5);
      text.setX(x);
      if (index === 0) text.setY(80);
    });

    this.usernameLabel.setY(160);
    this.usernameInput.setPosition(x, 200);
    this.usernameInput.setOrigin(isRTL ? 1 : 0, 0.5);
    const inputNode = this.usernameInput.getChildByName('username');
    if (inputNode) {
      inputNode.dir = isRTL ? 'rtl' : 'ltr';
      inputNode.style.textAlign = isRTL ? 'right' : 'left';
    }
    this.startButton.setY(270);
    this.languageButton.setY(330);
  }
}

export default MenuScene;
