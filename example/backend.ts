import { type } from "arktype";
import { router, rpc } from "../index.ts";

const api = router({
  addUser: rpc.input(type({ id: "string" })).query((input) => {
    console.log("Adding user", input);
    return 1;
  }),
  addPost: rpc.mutate(() => {
    console.log("Making a post");
    throw new Error("Test failure");
  }),
});

export type Routes = typeof api.routes;
export default api.app;
