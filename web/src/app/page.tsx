import { HydrateClient } from "~/trpc/server";
import { ScenarioStarter } from "./_components/ScenarioStarter";

export default function Home() {
  return (
    <HydrateClient>
      <div className="flex flex-col min-h-screen w-screen p-0 m-0">
        <header className="bg-transparent w-full py-6 sm:h-24">
          <h1 className="text-4xl sm:text-6xl font-bold text-white text-center">T-Systems Fleet Manager</h1>
        </header>
        <div className="flex-1">
          <main className="flex h-full flex-col items-center justify-center text-white">
            <ScenarioStarter />
          </main>
        </div>
      </div>
    </HydrateClient>
  );
}
