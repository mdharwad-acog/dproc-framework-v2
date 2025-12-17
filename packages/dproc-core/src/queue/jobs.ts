import { Queue, QueueEvents } from "bullmq";
import type { ExecutionContext } from "@dproc/types";
import createDebug from "debug";

const debug = createDebug("dproc:jobs");

export interface ReportJobData extends ExecutionContext {
  jobId: string;
  userId?: string;
}

export class JobQueue {
  private queue: Queue<ReportJobData>;
  private events: QueueEvents;

  constructor(redisConnection: { host: string; port: number }) {
    this.queue = new Queue<ReportJobData>("report-generation", {
      connection: redisConnection,
    });

    this.events = new QueueEvents("report-generation", {
      connection: redisConnection,
    });

    debug("Job queue initialized");
  }

  async addReportJob(data: ReportJobData) {
    const job = await this.queue.add("generate-report", data, {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });

    debug(`Job ${job.id} added to queue`);
    return job;
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
    };
  }

  getQueue() {
    return this.queue;
  }

  getEvents() {
    return this.events;
  }

  async close() {
    await this.queue.close();
    await this.events.close();
  }
}
