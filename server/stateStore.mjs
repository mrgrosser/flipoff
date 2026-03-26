import fs from 'node:fs/promises';
import path from 'node:path';

const STATE_FILE = process.env.STATE_FILE || path.join(process.cwd(), 'data', 'state.json');

const DEFAULT_STATE = {
  mode: 'schedule',
  weatherCity: 'Minneapolis',
  motd: null,
  schedules: [
    { id: 'motd', type: 'motd', label: 'Message of the Day', enabled: true, durationSec: 18, lines: ['', 'WELCOME HOME', 'BOB', '', ''] },
    { id: 'note', type: 'message', label: 'Note', enabled: true, durationSec: 18, lines: ['', 'HAVE A GREAT', 'DAY', '', ''] },
    { id: 'weather', type: 'weather', label: 'Weather', enabled: true, durationSec: 24 }
  ]
};

export class StateStore {
  constructor(filePath = STATE_FILE) {
    this.filePath = filePath;
    this.state = structuredClone(DEFAULT_STATE);
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.state = {
        ...structuredClone(DEFAULT_STATE),
        ...(parsed || {}),
        schedules: Array.isArray(parsed?.schedules) ? parsed.schedules : structuredClone(DEFAULT_STATE.schedules)
      };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.persist();
    }
    return this.state;
  }

  get() {
    return this.state;
  }

  async set(partial) {
    this.state = {
      ...this.state,
      ...(partial || {}),
      schedules: Array.isArray(partial?.schedules) ? partial.schedules : this.state.schedules
    };
    await this.persist();
    return this.state;
  }

  async persist() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2));
  }
}
