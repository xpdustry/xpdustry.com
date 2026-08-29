import { env } from "virtual:env/server";
import { getRuntime, type Runtime } from "#app/server/runtime";

export function initializeRuntime(): Runtime {
  const runtime = getRuntime();
  if (!env.XPD_DISABLE_STATUS) runtime.start();
  return runtime;
}
