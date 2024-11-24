import { ScenarioLive } from "../_components/ScenarioLive";
import { HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";
import { OptimizeTarget } from "~/types/OptimizeTarget";

export default async function LivePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const scenarioId = params.scenarioid;
  const optimize = params.optimize as OptimizeTarget | null;
  const returnToHub = params.returnToHub as string | null;
  const simulationSpeed = params.simulationSpeed ? parseFloat(params.simulationSpeed as string) : 1;

  if (!scenarioId || typeof scenarioId !== 'string') {
    redirect('/');
  }
  if (optimize && typeof optimize !== 'string') {
    redirect('/');
  }

  return (
    <HydrateClient>
    <div className="flex flex-col h-screen w-screen p-0 m-0">
      <header className="bg-transparent">
        <h1 className="text-6xl font-bold text-white text-center mt-6">T-Systems Fleet Manager</h1>
      </header>
      <main className="flex-grow flex h-full flex-col items-center justify-center text-white">
        <ScenarioLive 
          scenarioId={scenarioId} 
          optimize={optimize ?? "sustainability"} 
          returnToHub={returnToHub === "true"}
          simulationSpeed={simulationSpeed}
        />
      </main>
    </div>
  </HydrateClient>
  );
}
