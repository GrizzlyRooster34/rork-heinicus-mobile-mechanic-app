import { publicProcedure } from "../../../trpc";

export const hiProcedure = publicProcedure.query(() => {
  return "Hello from tRPC!";
});

export default hiProcedure;