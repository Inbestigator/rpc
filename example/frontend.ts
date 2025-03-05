import { client } from "../index.ts";
import { Routes } from "./backend.ts";

export const myClient = client<Routes>("http://0.0.0.0:8000");

const res = await myClient.addUser.mutate({ id: "1" });
console.log("addUser res", res);
try {
  await myClient.addPost.mutate();
} catch (e) {
  (e instanceof Error) &&
    console.error("addPost error", e.message);
}
