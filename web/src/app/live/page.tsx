import { ScenarioLive } from "../_components/ScenarioLive";
import { HydrateClient } from "~/trpc/server";

export default function LivePage({
  searchParams,
}: {
  searchParams: { scenarioid: string };
}) {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <ScenarioLive scenarioId={searchParams.scenarioid} />
      </main>
    </HydrateClient>
  );
}
