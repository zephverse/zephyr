import { signUpSchema } from "./schemas";

const result = signUpSchema.safeParse({
  email: "hello@example.com",
  username: "valid_user_123",
  password: "ValidPassword123!",
});
console.log(result);
