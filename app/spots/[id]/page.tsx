import { SpotDetail } from "./spot-detail";

export default async function SpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SpotDetail venueId={id} />;
}
