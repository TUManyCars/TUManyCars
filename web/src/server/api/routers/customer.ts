import { z } from "zod";
import axios from "axios";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type Customer from "~/types/Customer";

const ROUTE = "http://host.docker.internal:8085";

export const customerRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      const response = await axios.get(`${f}/customers/${id}`);
      return response.data as Customer;
    }),
});
