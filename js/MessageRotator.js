export class MessageRotator {
  constructor(board) {
    this.board = board;
    this._timer = null;
    this._paused = false;
    this.currentState = null;
  }

  async fetchAndDisplay() {
    const response = await fetch('/api/state');
    if (!response.ok) throw new Error(`State fetch failed: ${response.status}`);
    const state = await response.json();
    const lines = Array.isArray(state?.lines) ? state.lines : ['', '', '', '', ''];
    const signature = JSON.stringify(lines);
    if (this.currentState !== signature) {
      this.board.displayMessage(lines);
      this.currentState = signature;
    }
  }

  start() {
    this.fetchAndDisplay().catch(console.error);
    this._timer = setInterval(() => {
      if (!this._paused && !this.board.isTransitioning) {
        this.fetchAndDisplay().catch(console.error);
      }
    }, 2000);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  next() {
    this.fetchAndDisplay().catch(console.error);
  }

  prev() {
    this.fetchAndDisplay().catch(console.error);
  }
}
