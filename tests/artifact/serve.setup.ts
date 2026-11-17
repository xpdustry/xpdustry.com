import type { TestProject } from "vitest/node";
import { ensureBuild } from "#tests/support/build.ts";
import { startProductionServer } from "#tests/support/server.ts";

declare module "vitest" {
  export interface ProvidedContext {
    origin: string;
  }
}

export default async function serveTheBuild(project: TestProject) {
  ensureBuild();
  const server = await startProductionServer();
  project.provide("origin", server.origin);
  return server.stop;
}
