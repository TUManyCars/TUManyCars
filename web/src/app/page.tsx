import { api, HydrateClient } from "~/trpc/server";
import { ScenarioStarter } from "./_components/ScenarioStarter";
import { ScenarioLive } from "./_components/ScenarioLive";

export default async function Home() {
  const scenarios = await api.scenario.getAll();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        {scenarios?.length ? (
          <ScenarioLive scenario={scenarios[0]!} />
        ) : (
          <ScenarioStarter />
        )}
      </main>
    </HydrateClient>
  );
}
