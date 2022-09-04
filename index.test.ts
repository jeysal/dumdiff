import { diff } from ".";

test("todo", () => {
  diff(1, 2);
  diff("abc", "ac");
});
