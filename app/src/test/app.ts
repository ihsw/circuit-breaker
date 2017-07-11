import { test } from "ava";
import * as supertest from "supertest";
import * as HttpStatus from "http-status";
import * as express from "express";

import { pause } from "../lib/test-helper";
import getApp from "../lib/app";
import CircuitBreaker from "../lib/circuit-breaker";

interface ISetupSettings {
  request: supertest.SuperTest<supertest.Test>,
  breaker: CircuitBreaker,
  app: express.Express
}

const setup = (): ISetupSettings => {
  const breaker = new CircuitBreaker({
    decrementDuration: 5*1000,
    upperThreshold: 5,
    cooloffDuration: 5*1000
  });
  const app = getApp(breaker);
  return { app, breaker, request: supertest(app) };
};

test("Homepage Should return standard greeting", async (t) => {
  const { request } = setup();

  const res = await request.get("/");
  t.is(res.status, HttpStatus.OK);
  t.is(res.text, "Hello, world!");
});

test("Ping Should return standard ping response", async (t) => {
  const { request } = setup();

  const res = await request.get("/ping");
  t.is(res.status, HttpStatus.OK);
  t.is(res.text, "Pong");
});

test("Breaker Should be tripped", async (t) => {
  const { request } = setup();

  let res = await request.get("/ping");
  t.is(res.status, HttpStatus.OK);

  res = await request.post("/trip-breaker");
  t.is(res.status, HttpStatus.OK);

  res = await request.get("/ping");
  t.is(res.status, HttpStatus.INTERNAL_SERVER_ERROR);
});

test("Breaker Should trip and recover", async (t) => {
  const { request, breaker } = setup();

  let res = await request.get("/ping");
  t.is(res.status, HttpStatus.OK);

  res = await request.post("/trip-breaker");
  t.is(res.status, HttpStatus.OK);

  res = await request.get("/ping");
  t.is(res.status, HttpStatus.INTERNAL_SERVER_ERROR);

  await pause(breaker.cooloffPeriod);

  res = await request.get("/ping");
  t.is(res.status, HttpStatus.OK);
});
