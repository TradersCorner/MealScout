import { Router } from "express";
export var healthRouter = Router();
healthRouter.get("/health", function (_req, res) {
    res.json({ status: "ok", ts: Date.now() });
});
healthRouter.get("/health/realtime", function (_req, res) {
    res.json({ status: "ok", realtime: "ready", ts: Date.now() });
});
