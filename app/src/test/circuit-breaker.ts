import { test } from "ava";

import { pause } from "../lib/test-helper";
import { default as CircuitBreaker } from "../lib/circuit-breaker";

test("Circuit breaker default values should be sane", async (t) => {
  const breaker = new CircuitBreaker({ cooloffDuration: 0, decrementDuration: 0, upperThreshold: 0 });
  t.is(breaker.isOpen, false);
  t.is(breaker.counter, 0);
});

test("Circuit breaker default values should increment and decrement over a given period", async (t) => {
  // setting up the circuit breaker
  const upperThreshold = 5;
  const decrementDuration = 1 * 1000;
  const breaker = new CircuitBreaker({
    cooloffDuration: 5 * 1000,
    decrementDuration: decrementDuration,
    upperThreshold: upperThreshold
  });

  // incrementing the breaker up
  for (let i = 0; i < upperThreshold - 1; i++) {
    breaker.increment();
    t.is(breaker.isOpen, false);
    t.is(breaker.counter, i + 1);
  }

  // waiting for the breaker to drain out the counter
  await pause(decrementDuration);

  // expecting the counter to be back to normal
  t.is(breaker.counter, 0);
});

test("Circuit breaker should break and cool off", async (t) => {
  // setting up the circuit breaker
  const upperThreshold = 5;
  const decrementDuration = 1 * 1000;
  const cooloffPeriod = 5 * 1000;
  const breaker = new CircuitBreaker({
    cooloffDuration: cooloffPeriod,
    decrementDuration: decrementDuration,
    upperThreshold: upperThreshold
  });

  // incrementing the breaker up to trip it
  for (let i = 0; i < upperThreshold; i++) {
    breaker.increment();
  }
  t.is(breaker.isOpen, true);

  // waiting for the breaker to cool off
  await pause(cooloffPeriod);
  t.is(breaker.isOpen, false);
});

test("Circuit breaker should call maximum trip callback", async (t) => {
  // setting up the circuit breaker params
  const upperThreshold = 5;
  const decrementDuration = 5000;
  const cooloffDuration = 1000;
  const tripThreshold = 3;

  return new Promise<void>((resolve, reject) => {
    // setting up a timeout for failure mode
    const tId = setTimeout(() => reject(new Error("Test timeout!")), tripThreshold * cooloffDuration + 1000);

    // setting up a circuit breaker
    const breaker = new CircuitBreaker({
      cooloffDuration: cooloffDuration,
      decrementDuration: decrementDuration,
      onMaximumTrips: () => {
        // clearing the test rejection timeout
        clearTimeout(tId);

        // validating that the breaker is now capped and still open
        t.is(breaker.isCapped, true);
        t.is(breaker.isOpen, true);

        // pausing momentarily to prevent race condition
        pause(100).then(() => {
          // resetting the cap
          breaker.capReset();
          t.is(breaker.isCapped, false);
          t.is(breaker.isOpen, false);

          resolve();
        });
      },
      tripThreshold: tripThreshold,
      upperThreshold: upperThreshold
    });

    // creating a recursive func to trip the breaker sequentially
    const tripBreaker = () => {
      // validating that the breaker is closed before continuing
      t.is(breaker.isOpen, false);

      // tripping the breaker
      for (let i = 0; i < upperThreshold; i++) {
        breaker.increment();
      }

      // optionally halting when the breaker is capped
      if (breaker.isCapped) {
        return;
      }

      // validating that the breaker is open
      t.is(breaker.isOpen, true);

      // waiting for the breaker to cool off and tripping it again
      pause(cooloffDuration).then(() => {
        t.is(breaker.isOpen, false);
        tripBreaker();
      });
    };

    // starting up the recursive breaking of the breaker
    tripBreaker();
  });
});

test("Circuit breaker should not continue decrementing after cooloff", async (t) => {
  // setting up the circuit breaker
  const upperThreshold = 5;
  const decrementDuration = 5 * 1000;
  const cooloffPeriod = 1 * 1000;
  const breaker = new CircuitBreaker({
    cooloffDuration: cooloffPeriod,
    decrementDuration: decrementDuration,
    upperThreshold: upperThreshold
  });

  // incrementing the breaker up to trip it
  for (let i = 0; i < upperThreshold; i++) {
    breaker.increment();
  }
  t.is(breaker.isOpen, true);

  // waiting for the breaker to cool off
  await pause(cooloffPeriod);
  t.is(breaker.isOpen, false);
  t.is(breaker.counter, 0);

  // waiting for the decrement duration to finish and double checking the counter is not negative
  await pause(decrementDuration - cooloffPeriod);
  t.is(breaker.counter, 0, "Counter is at 0 after cooloff and decrement duration");
});

test("Circuit breaker should remove decrement timeout ids after decrementing", async (t) => {
  // setting up the circuit breaker
  const upperThreshold = 5;
  const decrementDuration = 5 * 1000;
  const breaker = new CircuitBreaker({
    cooloffDuration: 1 * 1000,
    decrementDuration: decrementDuration,
    upperThreshold: 5
  });

  // incrementing the breaker up to trip it
  for (let i = 0; i < upperThreshold - 1; i++) {
    breaker.increment();
  }

  await pause(decrementDuration);
  t.is(breaker.decrementTimeoutIds.length, 0, "Decrement timeout id list should be empty");
});

test("Circuit breaker should remove invalid timeout ids after decrementing", async (t) => {
  // setting up the circuit breaker
  const upperThreshold = 5;
  const decrementDuration = 5 * 1000;
  const breaker = new CircuitBreaker({
    cooloffDuration: 1 * 1000,
    decrementDuration: decrementDuration,
    upperThreshold: upperThreshold
  });

  // incrementing the breaker up to trip it
  for (let i = 0; i < upperThreshold - 1; i++) {
    breaker.increment();
  }

  await pause(decrementDuration);
  t.is(breaker.invalidTimeoutIds.length, 0, "Invalid timeout id list should be empty");
});

test("Circuit breaker should throw error when calling increment on an open breaker", async (t) => {
  // setting up the circuit breaker
  const breaker = new CircuitBreaker({
    cooloffDuration: 1 * 1000,
    decrementDuration: 5 * 1000,
    upperThreshold: 5
  });

  breaker.trip();
  try {
    breaker.increment();
  } catch (err) {
    t.true(err instanceof Error);
  }
});

test("Circuit breaker should throw error when calling trip on an open breaker", async (t) => {
  // setting up the circuit breaker
  const breaker = new CircuitBreaker({
    cooloffDuration: 1 * 1000,
    decrementDuration: 5 * 1000,
    upperThreshold: 5
  });

  breaker.trip();
  try {
    breaker.trip();
  } catch (err) {
    t.true(err instanceof Error);
  }
});

test("Circuit breaker should throw error when calling reset on a closed breaker", async (t) => {
  // setting up the circuit breaker
  const breaker = new CircuitBreaker({
    cooloffDuration: 1 * 1000,
    decrementDuration: 5 * 1000,
    upperThreshold: 5
  });

  try {
    breaker.reset();
  } catch (err) {
    t.true(err instanceof Error);
  }
});
