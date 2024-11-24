import { HydrateClient } from "~/trpc/server";
import { ScenarioStarter } from "./_components/ScenarioStarter";

export default function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <ScenarioStarter />
      </main>
    </HydrateClient>
  );
}
