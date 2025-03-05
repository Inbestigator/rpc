import { Type, type } from "arktype";
import { Hono } from "@hono/hono";
import { generateProxy } from "./proxy.ts";
import { hc } from "@hono/hono/client";
import { HTTPException } from "@hono/hono/http-exception";
import { ContentfulStatusCode } from "@hono/hono/utils/http-status";
import superjson from "superjson";

type RouterMethod = "query" | "mutate";

export function router<
  T extends Record<
    string,
    { execute: { [k in RouterMethod]: CallableFunction }; method: RouterMethod }
  >,
>(
  routes: T,
  options?: {
    basePath?: string;
  },
) {
  const app = new Hono();
  for (const [key, value] of Object.entries(routes)) {
    app[value.method === "mutate" ? "post" : "get"](
      options?.basePath ? `${options.basePath}/${key}` : key,
      async (c) => {
        const parsedInput: Record<string, unknown> = {};

        try {
          const rawInput = c.req.method === "GET"
            ? c.req.query()
            : await c.req.json();

          for (const [key, value] of Object.entries(rawInput)) {
            try {
              parsedInput[key] = superjson.parse(value as string);
            } catch {
              parsedInput[key] = value;
            }
          }
        } catch {
          // pass
        }

        try {
          const res = await value.execute[value.method](parsedInput);
          return c.json(res ?? null);
        } catch (e) {
          if (e instanceof Error) {
            return c.json({ error: e.message }, 400);
          }
          return c.json({ error: e }, 400);
        }
      },
    );
  }
  return {
    app,
    routes,
  };
}

export function client<
  T extends Record<
    string,
    { execute: { [k in RouterMethod]: CallableFunction }; method: RouterMethod }
  >,
>(baseUrl = "") {
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
    [K in keyof T]: T[K]["execute"];
  };
}

export const rpc = {
  input: <T extends Type>(schema: T) => ({
    mutate: activate(schema, "mutate"),
    query: activate(schema, "query"),
  }),
  mutate: activate(type("undefined"), "mutate"),
  query: activate(type("undefined"), "query"),
};

function activate<T extends Type>(schema: T, method: RouterMethod) {
  type Schema = typeof schema.infer;
  return function <R>(execute: (input: Schema) => Promise<R> | R) {
    return {
      method,
      execute: {
        [method]: schema.ifEquals("undefined")
          ? () => execute(undefined as Schema)
          : (i: T["infer"]) => execute(schema.assert(i)),
      } as {
        [v in RouterMethod]: Schema extends undefined ? () => Promise<R>
          : (input: Schema) => Promise<R>;
      },
    };
  };
}
