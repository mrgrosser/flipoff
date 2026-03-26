export class Clock {
  constructor(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'clock-overlay';
    this.container.appendChild(this.el);
    this.tick();
    this._interval = setInterval(() => this.tick(), 1000);
  }

  tick() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    this.el.innerHTML = `<div class="clock-date">${date}</div><div class="clock-time">${time}</div>`;
  }

  destroy() {
    clearInterval(this._interval);
    this.el.remove();
  }
}
