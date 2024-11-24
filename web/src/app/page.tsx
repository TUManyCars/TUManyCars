import { HydrateClient } from "~/trpc/server";
import { ScenarioStarter } from "./_components/ScenarioStarter";

export default function Home() {
  return (
    <HydrateClient>
      <div className="flex flex-col h-screen w-screen p-0 m-0">
        <header className="bg-transparent">
          <h1 className="text-6xl font-bold text-white text-center mt-6">T-Systems Fleet Manager</h1>
        </header>
        <main className="flex-grow flex h-full flex-col items-center justify-center text-white">
          <ScenarioStarter />
        </main>
      </div>
    </HydrateClient>
  );
}
