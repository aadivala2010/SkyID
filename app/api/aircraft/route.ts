import { NextRequest, NextResponse } from "next/server";

const ADSB_FI_URL = "https://opendata.adsb.fi/api/v3";
const SEARCH_RADIUS_NM = 100;

interface AdsbFiAircraft {
  hex?: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  alt_geom?: number;
  gs?: number;
  track?: number;
  seen?: number;
  r?: string;
  t?: string;
}

interface AdsbFiResponse {
  ac?: AdsbFiAircraft[];
  now?: number;
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lon"));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  // Coarse coordinates improve cache sharing and avoid sending unnecessary precision upstream.
  const coarseLatitude = latitude.toFixed(2);
  const coarseLongitude = longitude.toFixed(2);
  const url = `${ADSB_FI_URL}/lat/${coarseLatitude}/lon/${coarseLongitude}/dist/${SEARCH_RADIUS_NM}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`adsb.fi returned ${response.status}`);

    const payload = (await response.json()) as AdsbFiResponse;
    const receivedAt = payload.now ?? Date.now();
    const aircraft = (payload.ac ?? [])
      .filter((item) => typeof item.lat === "number" && typeof item.lon === "number" && item.hex)
      .map((item) => {
        const altitudeFeet = typeof item.alt_geom === "number"
          ? item.alt_geom
          : typeof item.alt_baro === "number"
            ? item.alt_baro
            : undefined;

        return {
          icao24: item.hex as string,
          callsign: item.flight?.trim() || undefined,
          longitude: item.lon as number,
          latitude: item.lat as number,
          altitude: altitudeFeet === undefined ? undefined : altitudeFeet * 0.3048,
          onGround: item.alt_baro === "ground",
          velocity: typeof item.gs === "number" ? item.gs * 0.514444 : undefined,
          heading: item.track,
          registration: item.r,
          aircraftType: item.t,
          updatedAt: receivedAt - (item.seen ?? 0) * 1_000,
        };
      })
      .slice(0, 100);

    return NextResponse.json({ aircraft, source: "adsb.fi" });
  } catch {
    return NextResponse.json(
      { error: "Live aircraft data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
