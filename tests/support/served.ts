import { JSDOM } from "jsdom";
import { inject } from "vitest";
import { httpGet } from "./http.ts";

export const origin = inject("origin");

export const HOSTILE_VISITOR = {
  cookie:
    "generaltranslation.enable-i18n=false; generaltranslation.locale=ru; generaltranslation.region=US; generaltranslation.reset-locale=true",
  "accept-language": "ru-RU,ru;q=0.9,fr;q=0.8"
};

export const get = (path: string, headers?: Record<string, string>) =>
  httpGet(origin + path, headers);
export const head = (path: string, headers?: Record<string, string>) =>
  httpGet(origin + path, headers, "HEAD");

export async function html(path: string, headers?: Record<string, string>): Promise<string> {
  return (await get(path, headers)).text();
}

export async function documentOf(path: string, headers?: Record<string, string>) {
  return new JSDOM(await html(path, headers)).window.document;
}

const ASCII_WHITESPACE = /[\t\n\f\r ]+/g;

export const textOf = (element: Element | null | undefined) =>
  (element?.textContent ?? "").replaceAll(ASCII_WHITESPACE, " ").trim();
