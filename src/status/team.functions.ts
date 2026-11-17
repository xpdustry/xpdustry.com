import { createServerFn } from "@tanstack/react-start";
import { services } from "./server/services";

export const getTeam = createServerFn({ method: "GET" }).handler(() => services().team);
