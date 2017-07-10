export interface ISettings {
  decrementDuration: number;
  upperThreshold: number;
  cooloffPeriod: number;
}

export default class {
  // internal state
  counter: number;
  isOpen: boolean;

  // options
  decrementDuration: number;
  upperThreshold: number;
  cooloffPeriod: number;

  constructor(opts: ISettings) {
    this.decrementDuration = opts.decrementDuration;
    this.upperThreshold = opts.upperThreshold;
    this.cooloffPeriod = opts.cooloffPeriod;

    this.counter = 0;
    this.isOpen = false;
  }

  increment() {
    if (this.isOpen) {
      return;
    }

    this.counter++;

    if (this.counter > this.upperThreshold) {
      this.isOpen = true;
      setTimeout(() => this.reset(), this.cooloffPeriod);

      return;
    }

    setTimeout(() => this.counter--, this.decrementDuration);
  }

  reset() {
    this.counter = 0;
    this.isOpen = false;
  }
}
