class SaveSystem {
  constructor() {
    this.username = 'Player';
  }

  setUsername(name) {
    this.username = name || 'Player';
  }

  key() {
    return `photopea-ai-edit-save-${this.username}`;
  }

  save(data) {
    localStorage.setItem(this.key(), JSON.stringify(data));
  }

  load() {
    const raw = localStorage.getItem(this.key());
    return raw ? JSON.parse(raw) : null;
  }
}

const Save = new SaveSystem();

export default Save;
