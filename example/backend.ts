import { type } from "arktype";
import { router, rpc } from "../index.ts";

const users = new Map<string, { password: string; emoji: string }>();

const api = router({
  createUser: rpc.input(type({ username: "string", password: "string" }))
    .execute((input) => {
      if (users.has(input.username)) {
        throw new Error("User already exists");
      }
      users.set(input.username, {
        password: input.password,
        emoji: getEmoji(),
      });
    }),
  getUser: rpc.input(type({ username: "string", password: "string" })).execute(
    (input) => {
      const user = users.get(input.username);
      if (!user || user.password !== input.password) {
        throw new Error("Unauthorized");
      }
      return { ...user, username: input.username };
    },
  ),
  listUsers: rpc.execute(() => {
    return Array.from(
      users.keys().map((username) => ({
        username,
        emoji: users.get(username)!.emoji,
      })),
    );
  }),
});

function getEmoji() {
  const emojis = ["😀", "😂", "🥺", "😍", "😎", "🤔", "😭", "😜", "😋", "💀"];
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

export type Routes = typeof api.routes;
export default api.app;
