import { hc } from "@hono/hono/client";
import superjson from "superjson";

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
          Object.entries(data).map((
            [key, value],
          ) => [key, superjson.stringify(value)]),
        );
      }

      switch (key) {
        case "query":
          return (...args: unknown[]) => {
            const [data, options] = args;
            return (target as unknown as { $get: CallableFunction }).$get(
              { query: serialize(data) },
              options,
            );
          };
        case "mutate":
          return (...args: unknown[]) => {
            const [data, options] = args;
            return (target as unknown as { $post: CallableFunction }).$post(
              { json: serialize(data) },
              options,
            );
          };
      }
      return generateProxy(client[key]);
    },
  });
}
