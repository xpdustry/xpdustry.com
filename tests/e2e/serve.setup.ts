import { ensureBuild } from "#tests/support/build.ts";
import { startProductionServer } from "#tests/support/server.ts";

export default async function serveTheBuild() {
  ensureBuild();
  const server = await startProductionServer();
  process.env.XPD_TEST_ORIGIN = server.origin;
  return server.stop;
}
