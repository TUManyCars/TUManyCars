import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import Scenario from '~/types/Scenario';
import Vehicle from '~/types/Vehicle';

/**
 * Fetches the vehicles for a given scenario ID.
 * 
 * @param scenarioID The ID of the scenario to fetch vehicles for.
 * @returns A promise that resolves to an array of vehicles.
 */
async function fetchScenarioVehicles(scenarioID: string): Promise<Vehicle[]> {
  try {
    console.log('Updating markers for scenario:', scenarioID);
    const response = await axios.get<Scenario>(`http://localhost:8090/Scenarios/get_scenario/${scenarioID}`);
    const scenario = response.data;
    if (!scenario) {
      console.error('Scenario not found:', scenarioID);
      return [];
    }
    console.log(scenario.vehicles);
    return scenario.vehicles;
  } catch {
    console.error("No connection");
    return [];
  }
}

/**
 * Handles GET requests to the route.
 * 
 * @param request The NextRequest object.
 * @returns A promise that resolves to a NextResponse object.
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let vehicles: Vehicle[] = [];
  const scenarioID = request.nextUrl.searchParams.get('scenarioID');

  if (!scenarioID) {
    return new NextResponse('Scenario ID is required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let interval: NodeJS.Timeout | null = null;

      const sendMarkers = async (scenarioID: string) => {
          vehicles = await fetchScenarioVehicles(scenarioID);
          if (vehicles.length === 0) {
            if (interval) clearInterval(interval);
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(vehicles)}\n\n`));
      };

      // Send initial state
      await sendMarkers(scenarioID);

      // Update every 2 seconds
      interval = setInterval(() => void sendMarkers(scenarioID), 2000);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        if (interval) clearInterval(interval);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
