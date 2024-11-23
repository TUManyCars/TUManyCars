import { z } from "zod";
import axios from "axios";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type Scenario from "~/types/Scenario";
import { observable } from '@trpc/server/observable';

const ROUTE = "http://localhost:8080";


export const scenarioRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      const response = await axios.get(`${ROUTE}/scenarios/${id}`);
      return response.data as Scenario;
    }),

  create: publicProcedure
    .input(
      z.object({
        vehicleCount: z.number(),
        customerCount: z.number(),
        simulationSpeed: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { vehicleCount, customerCount } = input;
      const response = await axios.post(
        `${ROUTE}/scenario/create?numberOfVehicles=${vehicleCount}&numberOfCustomers=${customerCount}`,
      );
      console.log("--created--");
      return response.data as string;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      const response = await axios.delete(`${ROUTE}/scenarios/${id}`);
      console.log("--delete--");
      return response.data as Scenario;
    }),

  getAll: publicProcedure.query(async () => {
    const response = await axios.get(`${ROUTE}/scenarios`);
    console.log("--getAll--");
    return response.data as Scenario[];
    }),
});
