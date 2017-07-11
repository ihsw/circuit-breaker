import { test } from "ava";

import { default as CircuitBreaker } from "../lib/circuit-breaker";

const pause = (delay: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, delay));

test("Circuit breaker default values should be sane", async (t) => {
  const breaker = new CircuitBreaker({ cooloffPeriod: 0, decrementDuration: 0, upperThreshold: 0 });
  t.is(breaker.isOpen, false);
  t.is(breaker.counter, 0);
});

test("Circuit breaker default values should increment and decrement over a given period", async (t) => {
  // setting up the circuit breaker
  const upperThreshold = 5;
  const decrementDuration = 1*1000;
  const breaker = new CircuitBreaker({
    cooloffPeriod: 5*1000,
    decrementDuration: decrementDuration,
    upperThreshold: upperThreshold
  });

  // incrementing the breaker up
  for (let i = 0; i < upperThreshold; i++) {
    breaker.increment();
    t.is(breaker.isOpen, false);
    t.is(breaker.counter, i+1);
  }

  // waiting for the breaker to drain out the counter
  await pause(decrementDuration);

  // expecting the counter to be back to normal
  t.is(breaker.counter, 0);
});

test("Circuit breaker should break and cool off", async (t) => {
  // setting up the circuit breaker
  const upperThreshold = 5;
  const decrementDuration = 1*1000;
  const cooloffPeriod = 5*1000;
  const breaker = new CircuitBreaker({
    cooloffPeriod: cooloffPeriod,
    decrementDuration: decrementDuration,
    upperThreshold: upperThreshold
  });

  // incrementing the breaker up to trip it
  for (let i = 0; i < upperThreshold+1; i++) {
    breaker.increment();
  }
  t.is(breaker.isOpen, true);

  // waiting for the breaker to cool off
  await pause(cooloffPeriod);
  t.is(breaker.isOpen, false);
});
