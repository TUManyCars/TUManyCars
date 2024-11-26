import { HydrateClient } from "~/trpc/server";
import { ScenarioStarter } from "./_components/ScenarioStarter";

export default function Home() {
  return (
    <HydrateClient>
      <div className="flex flex-col min-h-screen w-screen p-0 m-0">
        <div className="h-24">
          <header className="bg-transparent w-full">
            <h1 className="text-6xl font-bold text-white text-center mt-6">T-Systems Fleet Manager</h1>
          </header>
        </div>
        <div className="flex-1">
          <main className="flex h-full flex-col items-center justify-center text-white">
            <ScenarioStarter />
          </main>
        </div>
      </div>
    </HydrateClient>
  );
}
