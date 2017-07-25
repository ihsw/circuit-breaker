import * as express from "express";
import * as HttpStatus from "http-status";

import CircuitBreaker from "./circuit-breaker";

export default (breaker: CircuitBreaker): express.Express => {
  const app = express();

  app.get("/", (_, res) => res.send("Hello, world!"));
  app.get("/ping", (_, res) => {
    if (breaker.isOpen === true) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Pong");

      return;
    }

    res.send("Pong");
  });
  app.post("/trip-breaker", (_, res) => {
    for (let i = 0; i < breaker.upperThreshold; i++) {
      breaker.increment();
    }

    res.send();
  });

  return app;
};
