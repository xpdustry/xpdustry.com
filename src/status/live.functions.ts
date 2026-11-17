import { createServerFn } from "@tanstack/react-start";
import { services } from "./server/services";

export const getLiveData = createServerFn({ method: "GET" }).handler(() => services().live);
