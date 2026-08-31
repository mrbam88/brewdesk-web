import type { Metadata } from "next";
import { fetchVenueDetail, VenueLoadError } from "@/lib/venue-engine";
import { SITE_DESCRIPTION } from "@/lib/site";
import { formatVenueType, workFitLabel } from "@/lib/work-fit";
import { SpotDetail } from "./spot-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { venue } = await fetchVenueDetail(id);
    const title = `${venue.name} — ${workFitLabel(venue.workScore)}`;
    const description = `${workFitLabel(venue.workScore)} at ${venue.name}. ${formatVenueType(venue.venueType)} in ${venue.neighborhood}. Source on every score. Free, no account.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (err: unknown) {
    if (err instanceof VenueLoadError && err.kind === "not_found") {
      return { title: "Place not found", description: SITE_DESCRIPTION };
    }
    return { title: "BrewDesk", description: SITE_DESCRIPTION };
  }
}

export default async function SpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SpotDetail venueId={id} />;
}
