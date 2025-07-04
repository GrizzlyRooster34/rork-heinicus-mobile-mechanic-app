import { publicProcedure } from "../../../create-context";

export const hiProcedure = publicProcedure.query(() => {
  return "Hello from tRPC!";
});

export default hiProcedure;