import { createServerFn } from "@tanstack/react-start";
import { services } from "./server/services";

/** The team, as Discord last listed it. */
export const getTeam = createServerFn({ method: "GET" }).handler(() => services().team);
