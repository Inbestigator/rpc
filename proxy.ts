import { hc } from "@hono/hono/client";
import { stringify } from "superjson";

export function generateProxy(client: ReturnType<typeof hc>) {
  return new Proxy(client, {
    get: (target, key) => {
      if (typeof key !== "string") {
        return void 0;
      }
      function serialize(data: unknown) {
        if (typeof data !== "object" || data === null) {
          return data;
        }
        return Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, stringify(value)]),
        );
      }

      const fn = (...args: unknown[]) => {
        const [data, options] = args;
        return (target[key] as unknown as { $post: CallableFunction }).$post(
          { json: serialize(data) },
          options,
        );
      };
      Object.assign(fn, generateProxy(client[key]));
      return fn;
    },
  });
}
