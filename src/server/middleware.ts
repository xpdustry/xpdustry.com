import { createAPIHandler } from "filesystem-routing/api";
import routes from "virtual:file-routes";
import { initializeRuntime } from "#app/server/bootstrap";

initializeRuntime();

export default [createAPIHandler(routes)];
