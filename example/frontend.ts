import { client } from "../index.ts";
import { Routes } from "./backend.ts";

export const myClient = client<Routes>("http://0.0.0.0:8000");

await myClient.createUser.mutate({
  username: "foo",
  password: "bar",
});
console.log("Created user");
const user = await myClient.getUser.query({
  username: "foo",
  password: "bar",
});
console.log("Userdata:", user);

const users = await myClient.listUsers.query();
console.log("Users:", users);
