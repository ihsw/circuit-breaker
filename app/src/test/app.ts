import { test } from "ava";
import * as supertest from "supertest";

import { pause } from "../lib/test-helper";
import getApp from "../lib/app";
import CircuitBreaker from "../lib/circuit-breaker";

const breaker = new CircuitBreaker({
  decrementDuration: 5*1000,
  upperThreshold: 5,
  cooloffPeriod: 5*1000
});
const app = getApp(breaker);
const request = supertest(app);

test("Homepage Should return standard greeting", async (t) => {
  const res = await request.get("/");
  t.is(res.status, 200);
  t.is(res.text, "Hello, world!");
});

test("Ping Should return standard ping response", async (t) => {
  const res = await request.get("/ping");
  t.is(res.status, 200);
  t.is(res.text, "Pong");
});

test("Breaker Should be tripped", async (t) => {
  let res = await request.get("/ping");
  t.is(res.status, 200);

  res = await request.post("/trip-breaker");
  t.is(res.status, 200);

  res = await request.get("/ping");
  t.is(res.status, 500);
});

test("Breaker Should trip and recover", async (t) => {
  let res = await request.get("/ping");
  t.is(res.status, 200);

  res = await request.post("/trip-breaker");
  t.is(res.status, 200);

  res = await request.get("/ping");
  t.is(res.status, 500);

  await pause(breaker.cooloffPeriod);

  res = await request.get("/ping");
  t.is(res.status, 200);
});
