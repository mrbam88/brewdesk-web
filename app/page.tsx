import { NearbyProbe } from "./nearby-probe";

export default function Home() {
  return (
    <main>
      <h1>BrewDesk</h1>
      <p>
        Throwaway engine probe. Map, ranked list, and spot detail are later
        tickets. This page only proves the public client can ask for nearby
        spots.
      </p>
      <NearbyProbe />
    </main>
  );
}
