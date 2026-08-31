"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { COPY } from "@/lib/copy";
import { geocodePlace, reverseGeocode } from "@/lib/geocode";
import {
  DEFAULT_VIEWPORT,
  fetchNearbyVenues,
  type Venue,
  type VenueSearchResult,
} from "@/lib/venue-engine";
import { nearbyResultLine } from "@/lib/work-fit";
import { ProductHeader } from "./product-header";
import { VenueList } from "./venue-list";

const VenueMap = dynamic(() => import("./venue-map"), {
  ssr: false,
  loading: () => <div className="map-placeholder" aria-hidden="true" />,
});

type Place = {
  label: string;
  lat: number;
  lng: number;
  source: "default" | "geo" | "search";
};

const UNION_SQUARE: Place = {
  label: COPY.unionSquareLabel,
  lat: DEFAULT_VIEWPORT.lat,
  lng: DEFAULT_VIEWPORT.lng,
  source: "default",
};

const EMPTY_VENUES: Venue[] = [];

type LoadStatus = "loading" | "ok" | "error";

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5M12 2a1 1 0 0 1 1 1v1.07A8.001 8.001 0 0 1 19.93 11H21a1 1 0 0 1 0 2h-1.07A8.001 8.001 0 0 1 13 19.93V21a1 1 0 0 1-2 0v-1.07A8.001 8.001 0 0 1 4.07 13H3a1 1 0 0 1 0-2h1.07A8.001 8.001 0 0 1 11 4.07V3a1 1 0 0 1 1-1"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.5 3a7.5 7.5 0 0 1 5.96 12.16l4.19 4.19a1 1 0 0 1-1.32 1.5l-.1-.08-4.19-4.19A7.5 7.5 0 1 1 10.5 3m0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11"
      />
    </svg>
  );
}

function requestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300_000,
    });
  });
}

export function NearbyExplorer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const userPicked = useRef(false);
  const requestId = useRef(0);

  const [place, setPlace] = useState<Place>(UNION_SQUARE);
  const [query, setQuery] = useState(UNION_SQUARE.label);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [data, setData] = useState<VenueSearchResult | null>(null);
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const venues: Venue[] = status === "ok" && data ? data.venues : EMPTY_VENUES;

  async function loadPlace(next: Place) {
    const id = ++requestId.current;
    setPlace(next);
    setQuery(next.label);
    setSearchHint(null);
    setStatus("loading");
    try {
      const result = await fetchNearbyVenues({
        lat: next.lat,
        lng: next.lng,
        sort: "work_score",
      });
      if (id !== requestId.current) return;
      setData(result);
      setStatus("ok");
    } catch {
      if (id !== requestId.current) return;
      setData(null);
      setStatus("error");
    }
  }

  useEffect(() => {
    const id = ++requestId.current;
    void fetchNearbyVenues({
      lat: UNION_SQUARE.lat,
      lng: UNION_SQUARE.lng,
      sort: "work_score",
    })
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        setStatus("ok");
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setData(null);
        setStatus("error");
      });

    void requestPosition()
      .then(async (position) => {
        if (userPicked.current) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const label = (await reverseGeocode(lat, lng)) ?? COPY.nearYouLabel;
        if (userPicked.current) return;
        await loadPlace({ label, lat, lng, source: "geo" });
      })
      .catch(() => {
        /* location off — Union Square already loading / shown */
      });
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      userPicked.current = false;
      await loadPlace(UNION_SQUARE);
      return;
    }
    userPicked.current = true;
    setStatus("loading");
    setSearchHint(null);
    try {
      const found = await geocodePlace(value);
      if (!found) {
        setStatus("ok");
        setSearchHint(COPY.geocodeMiss);
        return;
      }
      await loadPlace({ ...found, source: "search" });
    } catch {
      setSearchHint(COPY.geocodeMiss);
      setStatus(data ? "ok" : "error");
    }
  }

  async function onLocate() {
    userPicked.current = true;
    setStatus("loading");
    try {
      const position = await requestPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const label = (await reverseGeocode(lat, lng)) ?? COPY.nearYouLabel;
      await loadPlace({ label, lat, lng, source: "geo" });
    } catch {
      setStatus(data ? "ok" : "error");
    }
  }

  function focusSearch() {
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  function openSpot(id: string) {
    router.push(`/spots/${encodeURIComponent(id)}`);
  }

  const emptyCoverage =
    status === "ok" &&
    data !== null &&
    (data.count === 0 || data.venues.length === 0 || data.meta.coverage === "none");

  const resultLine =
    status === "ok" && data && !emptyCoverage
      ? nearbyResultLine(place.label, data.count)
      : null;

  const searchControls = (
    <form className="search-row" onSubmit={onSearch} role="search">
      <label className="search-pill">
        <span className="search-icon">
          <SearchIcon />
        </span>
        <span className="sr-only">{COPY.searchLabel}</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={COPY.searchPlaceholder}
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <button type="submit" className="sr-only">
        Search
      </button>
      <button
        type="button"
        className="locate-btn"
        onClick={() => void onLocate()}
        aria-label={COPY.locateMe}
        title={COPY.locateMe}
      >
        <LocateIcon />
      </button>
    </form>
  );

  return (
    <div className="nearby-shell">
      <ProductHeader search={searchControls} />

      <div className="status-row">
        {place.source === "default" ? (
          <p className="location-banner">{COPY.locationOff}</p>
        ) : null}
        {resultLine ? <p className="result-line">{resultLine}</p> : null}
        {searchHint ? <p className="search-hint">{searchHint}</p> : null}
      </div>

      <div className="nearby-layout">
        <section className="map-pane" aria-label="Map of nearby work spots">
          <VenueMap
            venues={venues}
            center={{ lat: place.lat, lng: place.lng }}
            onSelect={openSpot}
          />
        </section>

        <section
          className={`list-pane list-pane--sheet${sheetExpanded ? " list-pane--expanded" : ""}`}
          aria-label="Ranked nearby work spots"
        >
          <button
            type="button"
            className="sheet-handle"
            aria-expanded={sheetExpanded}
            aria-label={sheetExpanded ? "Collapse list" : "Expand list"}
            onClick={() => setSheetExpanded((open) => !open)}
          />

          {status === "loading" ? (
            <p className="pane-status" role="status">
              {COPY.loading}
            </p>
          ) : null}

          {status === "error" ? (
            <div className="message-card" role="alert">
              <h2>{COPY.fetchErrorTitle}</h2>
              <p>{COPY.fetchErrorBody}</p>
              <button type="button" className="forest-btn" onClick={() => void loadPlace(place)}>
                {COPY.tryAgain}
              </button>
            </div>
          ) : null}

          {status === "ok" && emptyCoverage ? (
            <div className="message-card">
              <h2>{COPY.emptyTitle}</h2>
              <p>{COPY.emptyBody}</p>
              <button type="button" className="forest-btn" onClick={focusSearch}>
                {COPY.searchSomewhereElse}
              </button>
            </div>
          ) : null}

          {status === "ok" && !emptyCoverage && data ? <VenueList venues={data.venues} /> : null}
        </section>
      </div>
    </div>
  );
}
