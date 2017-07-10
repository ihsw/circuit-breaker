import * as express from "express";

import CircuitBreaker from "./circuit-breaker";

export default (breaker: CircuitBreaker): express.Express => {
  const app = express();

  app.get("/", (_, res) => res.send("Hello, world!"));
  app.get("/ping", (_, res) => {
    if (breaker.isOpen === false) {
      res.status(500);

      return;
    }

    res.send("Pong");
  });

  return app;
}
