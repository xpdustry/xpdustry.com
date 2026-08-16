/**
 * The request chain in front of every render.
 *
 * `createAPIHandler` matches the `GET` exports under `src/routes`. The API
 * endpoints and `/healthz`. Anything it does not match falls through to the
 * page render.
 */

import { createAPIHandler } from "filesystem-routing/api";
import routes from "virtual:file-routes";

export default [createAPIHandler(routes)];
