import { test } from "ava";
import * as request from "supertest";

import { app } from "../lib/app";

test("Homepage Should return standard greeting", async (t) => {
  const res = await request(app).get("/");
  t.is(res.status, 200);
  t.is(res.text, "Hello, world!");
});
