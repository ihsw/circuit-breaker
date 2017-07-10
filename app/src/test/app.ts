import { test } from "ava";
import * as request from "supertest";
import * as express from "express";

import getApp from "../lib/app";
import CircuitBreaker from "../lib/circuit-breaker";

let app: express.Express;
test.before(() => {
  app = getApp(new CircuitBreaker({
    decrementDuration: 5*1000,
    upperThreshold: 5,
    cooloffPeriod: 5*1000
  }));
});

test("Homepage Should return standard greeting", async (t) => {
  const res = await request(app).get("/");
  t.is(res.status, 200);
  t.is(res.text, "Hello, world!");
});
