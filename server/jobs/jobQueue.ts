type Job = {
  id: string;
  name: string;
  run: () => Promise<void>;
  enqueuedAt: number;
};

const queue: Job[] = [];
let active = 0;
const MAX_CONCURRENCY = Math.max(1, Number(process.env.JOB_QUEUE_CONCURRENCY || 2) || 2);

function nextJobId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function pumpQueue() {
  while (active < MAX_CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    if (!job) return;
    active += 1;
    void (async () => {
      try {
        await job.run();
      } catch (error) {
        console.warn(`[jobs] ${job.name} failed`, error);
      } finally {
        active -= 1;
        if (queue.length > 0) {
          setImmediate(() => {
            void pumpQueue();
          });
        }
      }
    })();
  }
}

export function enqueueInProcessJob(name: string, run: () => Promise<void>) {
  const job: Job = {
    id: nextJobId(),
    name,
    run,
    enqueuedAt: Date.now(),
  };
  queue.push(job);
  setImmediate(() => {
    void pumpQueue();
  });
  return job.id;
}

export function getJobQueueStats() {
  return {
    queued: queue.length,
    active,
    maxConcurrency: MAX_CONCURRENCY,
  };
}

