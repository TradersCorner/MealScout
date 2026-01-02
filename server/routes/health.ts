import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

healthRouter.get("/health/realtime", (_req, res) => {
  res.json({ status: "ok", realtime: "ready", ts: Date.now() });
});
