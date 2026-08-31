"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COPY } from "@/lib/copy";
import {
  fetchVenueDetail,
  VenueLoadError,
  type Venue,
} from "@/lib/venue-engine";
import {
  formatHours,
  formatVenueType,
  hasWorkFitSignal,
  mapsSearchUrl,
  provenanceLine,
  scoreTier,
  seatingDetailCopy,
  workFitLabel,
  workFitPieces,
  formatClaimValue,
} from "@/lib/work-fit";
import { ProductHeader } from "../../product-header";

type DetailState =
  | { status: "loading" }
  | { status: "ok"; venue: Venue }
  | { status: "missing" }
  | { status: "error" };

export function SpotDetail({ venueId }: { venueId: string }) {
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchVenueDetail(venueId)
      .then((result) => {
        if (!cancelled) setState({ status: "ok", venue: result.venue });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof VenueLoadError && err.kind === "not_found") {
          setState({ status: "missing" });
          return;
        }
        setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  function retry() {
    setState({ status: "loading" });
    fetchVenueDetail(venueId)
      .then((result) => setState({ status: "ok", venue: result.venue }))
      .catch((err: unknown) => {
        if (err instanceof VenueLoadError && err.kind === "not_found") {
          setState({ status: "missing" });
          return;
        }
        setState({ status: "error" });
      });
  }

  return (
    <div className="spot-shell">
      <ProductHeader />
      <main className="spot-page">
        <p>
          <Link href="/" className="back-to-map">
            ← {COPY.backToMap}
          </Link>
        </p>

        {state.status === "loading" ? (
          <p className="pane-status" role="status">
            {COPY.loading}
          </p>
        ) : null}

        {state.status === "missing" ? (
          <div className="message-card" role="status">
            <h2>{COPY.missingSpot}</h2>
            <Link href="/" className="forest-btn">
              ← {COPY.backToMap}
            </Link>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="message-card" role="alert">
            <h2>{COPY.fetchErrorTitle}</h2>
            <p>{COPY.fetchErrorBody}</p>
            <button type="button" className="forest-btn" onClick={retry}>
              {COPY.tryAgain}
            </button>
          </div>
        ) : null}

        {state.status === "ok" ? <SpotEvidence venue={state.venue} /> : null}
      </main>
    </div>
  );
}

function SpotEvidence({ venue }: { venue: Venue }) {
  const hours = formatHours(venue.hoursRaw);
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!venue.address) return;
    try {
      await navigator.clipboard.writeText(venue.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="spot-article">
      <div className="spot-hero">
        <div className="spot-hero-copy">
          <h1>{venue.name}</h1>
          <p className="type-chip">{formatVenueType(venue.venueType)}</p>
          <p className="muted">
            {venue.neighborhood}
            {venue.borough ? `, ${venue.borough}` : ""}
          </p>
          {hours ? <p className="spot-hours">{hours}</p> : null}
          {venue.address ? <p className="spot-address">{venue.address}</p> : null}
          <div className="spot-actions">
            <a
              className="forest-btn"
              href={mapsSearchUrl(venue)}
              target="_blank"
              rel="noreferrer"
            >
              {COPY.openInMaps}
            </a>
            {venue.address ? (
              <button type="button" className="ghost-btn" onClick={() => void copyAddress()}>
                {copied ? COPY.copied : COPY.copyAddress}
              </button>
            ) : null}
          </div>
        </div>
        <p
          className={`work-fit-badge work-fit-badge--lg work-fit-badge--${scoreTier(venue.workScore)}`}
          aria-label={`${workFitLabel(venue.workScore)} out of 100`}
        >
          <strong>{venue.workScore}</strong>
          <span>Work Fit</span>
        </p>
      </div>

      <h2>Why it scored that way</h2>
      <ul className="evidence-list">
        {workFitPieces(venue).map((piece) => {
          if (piece.key === "seating") {
            const seating = seatingDetailCopy(piece.claim);
            return (
              <li key={piece.key} className="evidence-row">
                <div className="evidence-head">
                  <span>{piece.title}</span>
                  <strong className={seating.muted ? "muted" : undefined}>{seating.value}</strong>
                </div>
                {seating.provenance ? (
                  <p className="muted evidence-source">{seating.provenance}</p>
                ) : null}
              </li>
            );
          }

          const claim = piece.claim;
          const hasSignal = hasWorkFitSignal(claim);
          return (
            <li key={piece.key} className="evidence-row">
              <div className="evidence-head">
                <span>{piece.title}</span>
                <strong className={!hasSignal ? "muted" : undefined}>
                  {hasSignal && claim ? formatClaimValue(claim.value) : COPY.notEnoughSignal}
                </strong>
              </div>
              {hasSignal && claim ? (
                <p className="muted evidence-source">{provenanceLine(claim)}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="spot-footer">{COPY.footer}</p>
    </article>
  );
}
