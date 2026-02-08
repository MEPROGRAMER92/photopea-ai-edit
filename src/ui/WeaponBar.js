import Localization from '../systems/LocalizationSystem.js';
import EventBus from '../systems/EventBus.js';

class WeaponBar {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.slots = [];
    this.labels = [];

    const slotWidth = 140;
    const slotHeight = 42;
    const spacing = 12;
    const totalWidth = slotWidth * 3 + spacing * 2;
    const startX = (scene.scale.width - totalWidth) / 2;
    const y = scene.scale.height - 60;

    for (let i = 0; i < 3; i += 1) {
      const rect = scene.add.rectangle(startX + i * (slotWidth + spacing) + slotWidth / 2, y, slotWidth, slotHeight, 0x20242a).setStrokeStyle(2, 0xffffff);
      const text = scene.add.text(rect.x, rect.y, `${i + 1}: -`, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.container.add(rect);
      this.container.add(text);
      this.slots.push(rect);
      this.labels.push(text);
    }

    EventBus.on('weapon-changed', (slots, activeIndex) => {
      this.update(slots, activeIndex);
    });

    EventBus.on('language-changed', () => {
      this.applyLayout();
    });

    this.update([null, null, null], 0);
    this.applyLayout();
  }

  update(slots, activeIndex) {
    slots.forEach((slot, index) => {
      const label = slot ? slot.name : '-';
      this.labels[index].setText(`${index + 1}: ${label}`);
      const fill = index === activeIndex ? 0x2d7d46 : 0x20242a;
      this.slots[index].setFillStyle(fill);
    });
  }

  applyLayout() {
    const isRTL = Localization.isRTL();
    const order = isRTL ? [2, 1, 0] : [0, 1, 2];
    order.forEach((slotIndex, i) => {
      const rect = this.slots[slotIndex];
      const text = this.labels[slotIndex];
      const baseX = (this.scene.scale.width - 3 * 140 - 2 * 12) / 2 + i * (140 + 12) + 70;
      rect.setX(baseX);
      text.setX(baseX);
    });
  }
}

export default WeaponBar;
