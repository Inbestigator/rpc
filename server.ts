import { Type, type } from "arktype";
import { Hono } from "@hono/hono";
import { parse } from "superjson";

export function router<T extends Record<string, CallableFunction>>(
  routes: T,
  options?: {
    basePath?: string;
  },
) {
  const app = new Hono();
  for (const [key, value] of Object.entries(routes)) {
    app.post(
      options?.basePath ? `${options.basePath}/${key}` : key,
      async (c) => {
        const parsedInput: Record<string, unknown> = {};

        try {
          for (const [key, value] of Object.entries(await c.req.json())) {
            try {
              parsedInput[key] = parse(value as string);
            } catch {
              parsedInput[key] = value;
            }
          }
        } catch {
          // pass
        }

        try {
          const res = await value(parsedInput);
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

export const rpc = {
  input: <T extends Type>(schema: T) => ({
    execute: createHandler(schema),
  }),
  execute: createHandler(type("undefined")),
};

function createHandler<T extends Type>(schema: T) {
  type Schema = typeof schema.infer;
  return function <R>(execute: (input: Schema) => Promise<R> | R) {
    return (
      schema.ifEquals("undefined")
        ? () => execute(undefined)
        : (i: T["infer"]) => execute(schema.assert(i))
    ) as Schema extends undefined ? () => Promise<R>
      : (input: Schema) => Promise<R>;
  };
}
