import { generateProxy } from "./proxy.ts";
import { hc } from "@hono/hono/client";
import { HTTPException } from "@hono/hono/http-exception";
import { ContentfulStatusCode } from "@hono/hono/utils/http-status";

export function client<T extends Record<string, CallableFunction>>(
  baseUrl = "",
) {
  const client = hc(baseUrl, {
    async fetch(input: RequestInfo | URL, requestInit?: RequestInit) {
      const inputPath = input.toString().replace(baseUrl, "");
      const targetUrl = baseUrl + inputPath;
      const res = await fetch(targetUrl, {
        ...requestInit,
      });
      if (!res.ok) {
        throw new HTTPException(res.status as ContentfulStatusCode, {
          message: await res.text(),
        });
      }
      return res.json();
    },
  });
  return generateProxy(client) as unknown as {
    [K in keyof T]: T[K];
  };
}
