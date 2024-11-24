import { z } from "zod";
import axios from "axios";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type Scenario from "~/types/Scenario";
import { observable } from '@trpc/server/observable';
import Vehicle from "~/types/Vehicle";

const ROUTE = "http://host.docker.internal:8080";

export const scenarioRouter = createTRPCRouter({
  setup: publicProcedure
    .input(
      z.object({
        optimizationTarget: z.enum(["sustainability", "customer_satisfaction"]),
        returnToHub: z.boolean(),
        startAtHub: z.boolean(),
        customerCount: z.number().min(1),
        vehicleCount: z.number().min(1),
        customVehicles: z.custom<Vehicle[]>(),
        simulationSpeed: z.number().min(0.1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Step 1: Create the scenario
        const createResponse = await axios.post(
          "http://host.docker.internal:8080/scenario/create",
          null,
          {
            params: {
              numberOfVehicles: input.vehicleCount,
              numberOfCustomers: input.customerCount,
            },
          }
        );
        
        if (createResponse.status !== 200) {
          throw new Error("Failed to create scenario");
        }
        
        const scenario = createResponse.data as Scenario;
        console.log("Scenario created with ID:", scenario.id);

        // Replace the positions of the last vehicles with custom positions
        const numCustomVehicles = input.customVehicles.length;
        const startIdx = scenario.vehicles.length - numCustomVehicles;

        for (let i = 0; i < numCustomVehicles; i++) {
          const customVehicle = input.customVehicles[i]!;
          const vehicleToUpdate = scenario.vehicles[startIdx + i];
          if (vehicleToUpdate) {
            vehicleToUpdate.coordX = customVehicle.coordX;
            vehicleToUpdate.coordY = customVehicle.coordY;
          }
        }

        // Step 2: Initialize the scenario with modified JSON
        const initializeResponse = await axios.post(
          "http://host.docker.internal:8090/Scenarios/initialize_scenario",
          scenario
        );

        if (initializeResponse.status !== 200) {
          throw new Error("Failed to initialize scenario");
        }
        console.log("Scenario initialized successfully");

        // Step 3: Launch the scenario
        const launchResponse = await axios.post(
          `http://host.docker.internal:8090/Runner/launch_scenario/${scenario.id}?speed=${input.simulationSpeed}`
        );

        if (launchResponse.status !== 200) {
          throw new Error("Failed to launch scenario");
        }

        const startTime = (launchResponse.data as { startTime: string }).startTime;
        console.log("Scenario launched successfully");

        // TODO: Call Python calculation HTTP API endpoint

        return {
          success: true,
          scenarioId: scenario.id,
          startTime: startTime,
          config: input,
        };
      } catch (error) {
        console.error("Error in scenario setup:", error);
        throw error;
      }
    }),

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
