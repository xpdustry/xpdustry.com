import { createServerFn } from "@tanstack/react-start";
import { services } from "./server/services";

/** The latest server status, Discord counts and releases, as the background services last saw them. */
export const getLiveData = createServerFn({ method: "GET" }).handler(() => services().live);
