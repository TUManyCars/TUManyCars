import { z } from "zod";
import axios from "axios";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type Scenario from "~/types/Scenario";
import Vehicle from "~/types/Vehicle";

const host = process.env.NEXT_PUBLIC_HOST ?? 'localhost';
const ROUTE_PYTHON = `http://${host}:8086`;
const ROUTE_API = `http://${host}:8080`;
const ROUTE_RUNNER = `http://${host}:8090`;

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
          ROUTE_API + "/scenario/create",
          null,
          {
            params: {
              numberOfVehicles: input.vehicleCount,
              numberOfCustomers: input.customerCount,
            },
          }
        );

        console.log("aaaa");
        console.log(host);
        
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
          ROUTE_RUNNER + "/Scenarios/initialize_scenario",
          scenario
        );

        if (initializeResponse.status !== 200) {
          throw new Error("Failed to initialize scenario");
        }
        console.log("Scenario initialized successfully");

        // Step 3: Launch the scenario
        const launchResponse = await axios.post(
          `${ROUTE_RUNNER}/Runner/launch_scenario/${scenario.id}?speed=${input.simulationSpeed}`
        );

        if (launchResponse.status !== 200) {
          throw new Error("Failed to launch scenario");
        }

        const startTime = (launchResponse.data as { startTime: string }).startTime;
        console.log("Scenario launched successfullyy");

        // Step 4: Call Python calculation HTTP API endpoint
        const calculationResponse = await axios.post(
          ROUTE_PYTHON + "/solve-routing",
          { scenario_id: scenario.id, solve_for_shortest_path: input.optimizationTarget === "sustainability" },
        );

        console.log("WORKED", calculationResponse);

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
    })
});
