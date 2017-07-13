export interface ISettings {
  decrementDuration: number;
  upperThreshold: number;
  cooloffDuration: number;
  tripThreshold?: number;
  onMaximumTrips?: () => void;
}

export default class {
  // internal state
  counter: number;
  isOpen: boolean;
  tripCounter: number;
  isCapped: boolean;

  // options
  decrementDuration: number;
  upperThreshold: number;
  cooloffPeriod: number;
  tripThreshold: number;
  onMaximumTrips: () => void;

  constructor(opts: ISettings) {
    this.decrementDuration = opts.decrementDuration;
    this.upperThreshold = opts.upperThreshold;
    this.cooloffPeriod = opts.cooloffDuration;
    this.tripThreshold = opts.tripThreshold ? opts.tripThreshold : 0;
    this.onMaximumTrips = opts.onMaximumTrips ? opts.onMaximumTrips : () => { return; };

    this.counter = 0;
    this.isOpen = false;
    this.tripCounter = 0;
    this.isCapped = false;
  }

  increment() {
    if (this.isOpen) {
      throw new Error("Do not call increment with an open breaker!");
    }

    this.counter++;

    // optionally opening the breaker
    if (this.counter === this.upperThreshold) {
      this.isOpen = true;

      // incrementing the trip counter
      this.tripCounter++;

      // optionally capping the breaker
      if (this.tripCounter === this.tripThreshold) {
        this.isCapped = true;
        this.onMaximumTrips();

        return;
      }

      setTimeout(() => this.reset(), this.cooloffPeriod);

      return;
    }

    // decrementing the counter accordingly
    setTimeout(() => this.counter--, this.decrementDuration);
  }

  reset() {
    this.counter = 0;
    this.isOpen = false;
  }

  capReset() {
    this.reset();
    this.tripCounter = 0;
    this.isCapped = false;
  }
}
