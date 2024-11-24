import { ScenarioLive } from "../_components/ScenarioLive";
import { HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const scenarioId = params.scenarioid;

  if (!scenarioId || typeof scenarioId !== 'string') {
    redirect('/');
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <ScenarioLive scenarioId={scenarioId} />
      </main>
    </HydrateClient>
  );
}
