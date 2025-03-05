import { client } from "../index.ts";
import { Routes } from "./backend.ts";

export const myClient = client<Routes>("http://0.0.0.0:8000");

try {
  await myClient.createUser({
    username: "foo",
    password: "bar",
  });
  console.log("Created user");
} catch {
  console.log("User already exists");
}
const user = await myClient.getUser({
  username: "foo",
  password: "bar",
});
console.log("Userdata:", user);

const users = await myClient.listUsers();
console.log("Users:", users);
