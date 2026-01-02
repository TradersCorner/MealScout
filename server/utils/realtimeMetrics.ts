type Counters = {
  connects: number;
  disconnects: number;
  subscribeNearby: number;
  lastWarnAt: number;
};

const counters: Counters = {
  connects: 0,
  disconnects: 0,
  subscribeNearby: 0,
  lastWarnAt: 0,
};

const WARN_INTERVAL_MS = 60_000;

export function incConnect() {
  counters.connects++;
}

export function incDisconnect() {
  counters.disconnects++;
}

export function incSubscribeNearby() {
  counters.subscribeNearby++;
}

export function maybeWarnIfChurn(logger: (msg: string) => void) {
  const now = Date.now();
  if (now - counters.lastWarnAt < WARN_INTERVAL_MS) return;

  if (counters.disconnects > counters.connects * 1.5 && counters.disconnects > 20) {
    counters.lastWarnAt = now;
    logger(
      `[realtime] churn warning: connects=${counters.connects}, disconnects=${counters.disconnects}, subscribeNearby=${counters.subscribeNearby}`
    );
  }
}

export function snapshot() {
  return { ...counters };
}
