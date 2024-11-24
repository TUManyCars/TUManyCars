import axios from 'axios';
import { type NextRequest, NextResponse } from 'next/server';
import type Scenario from '~/types/Scenario';

/**
 * Fetches the vehicles for a given scenario ID.
 * 
 * @param scenarioID The ID of the scenario to fetch vehicles for.
 * @returns A promise that resolves to an array of vehicles.
 */
async function fetchScenarioData(scenarioID: string): Promise<Scenario | null> {
  try {
    console.log('Updating data for scenario:', scenarioID);
    const response = await axios.get<Scenario>(`http://host.docker.internal:8090/Scenarios/get_scenario/${scenarioID}`);
    const scenario = response.data;
    if (!scenario) {
      console.error('Scenario not found:', scenarioID);
      return null;
    }
    return scenario;
  } catch {
    console.error("No connection");
    return null;
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
  const scenarioID = request.nextUrl.searchParams.get('scenarioID');

  if (!scenarioID) {
    return new NextResponse('Scenario ID is required', { status: 400 });
  }

  console.log("called GET");

  const stream = new ReadableStream({
    async start(controller) {
      let interval: NodeJS.Timeout | null = null;
      let isControllerClosed = false;

      const abort = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        if (!isControllerClosed) {
          isControllerClosed = true;
          controller.close();
        }
      };

      const sendMarkers = async (scenarioID: string) => {
          if (isControllerClosed) return;
          
          const scenario = await fetchScenarioData(scenarioID);
          if (!scenario) {
            abort();
            return;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(scenario)}\n\n`));
      };

      // Send initial state
      await sendMarkers(scenarioID);

      // Set up interval for subsequent updates
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      interval = setInterval(() => {
        void sendMarkers(scenarioID);
      }, 2000);

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        abort();
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
