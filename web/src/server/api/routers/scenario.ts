import { z } from "zod";
import axios from "axios";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type Scenario from "~/types/Scenario";
import Vehicle from "~/types/Vehicle";
import CalculationResult from "~/types/CalculationResult";

const base_url_python = process.env.ROUTE_PYTHON ?? 'http://localhost:8086';
const base_url_api = process.env.ROUTE_API ?? 'http://localhost:8080';
const base_url_runner = process.env.ROUTE_RUNNER ?? 'http://localhost:8090';

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
        const createResponse = await axios.post<Scenario>(
          base_url_api + "/scenario/create",
          null,
          {
            params: {
              numberOfVehicles: input.vehicleCount + input.customVehicles.length,
              numberOfCustomers: input.customerCount,
            },
          }
        );

        if (createResponse.status !== 200) {
          throw new Error("Failed to create scenario");
        }
        
        const scenario = createResponse.data;
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

        if (input.startAtHub) {
          const hubX = 48.137371;
          const hubY = 11.575328;
          for (const vehicle of scenario.vehicles) {
            vehicle.coordX = hubX;
            vehicle.coordY = hubY;
          }
        }

        // Step 2: Initialize the scenario with modified JSON
        const initializeResponse = await axios.post(
          base_url_runner + "/Scenarios/initialize_scenario",
          scenario
        );

        if (initializeResponse.status !== 200) {
          throw new Error("Failed to initialize scenario");
        }
        console.log("Scenario initialized successfully");

        // Step 3: Launch the scenario
        const launchResponse = await axios.post(
          `${base_url_runner}/Runner/launch_scenario/${scenario.id}?speed=${input.simulationSpeed}`,
          null
        );

        if (launchResponse.status !== 200) {
          throw new Error("Failed to launch scenario");
        }

        console.log("Scenario launched successfully");

        return {
          scenarioId: scenario.id
        };
      } catch (error) {
        console.error("Error in scenario setup:", error);
        throw error;
      }
    }),

    calculate: publicProcedure
    .input(
      z.object({
        scenarioId: z.string(),
        optimize: z.enum(["sustainability", "customer_satisfaction"]),
        returnToHub: z.boolean()
      }),
    )
    .mutation(async ({ input }) => {
      const { data } = await axios.post<CalculationResult>(base_url_python + "/solve-routing",
        { 
          scenario_id: input.scenarioId, 
          solve_for_shortest_path: input.optimize === "sustainability",
          go_to_hub: input.returnToHub,
          start_cars: true
        },
      );
      return data;
    }),
});
