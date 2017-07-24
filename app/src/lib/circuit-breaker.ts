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
  decrementTimeoutIds: NodeJS.Timer[];
  invalidTimeoutIds: NodeJS.Timer[];

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
    this.decrementTimeoutIds = [];
    this.invalidTimeoutIds = [];
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
    const timerId = setTimeout(() => {
      // optionally halting on this timer id being flagged as invalid
      for (let i = 0; i < this.invalidTimeoutIds.length; i++) {
        // halting and removing the entry from the list of invalid timeout ids
        if (timerId === this.invalidTimeoutIds[i]) {
          this.invalidTimeoutIds.splice(i, 1);

          return;
        }
      }

      this.counter--;
    }, this.decrementDuration);
    this.decrementTimeoutIds.push(timerId);
  }

  reset() {
    this.counter = 0;
    this.isOpen = false;

    // flagging all current decrement timeout ids as invalid
    for (const timeoutId of this.decrementTimeoutIds) {
      this.invalidTimeoutIds.push(timeoutId);
    }
  }

  capReset() {
    this.reset();
    this.tripCounter = 0;
    this.isCapped = false;
  }
}
