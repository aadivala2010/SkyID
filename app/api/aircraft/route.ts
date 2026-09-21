import { NextRequest, NextResponse } from "next/server";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";

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

  const latitudeSpan = 1.2;
  const longitudeSpan = latitudeSpan / Math.max(Math.cos((latitude * Math.PI) / 180), 0.25);
  const params = new URLSearchParams({
    lamin: (latitude - latitudeSpan).toFixed(4),
    lamax: (latitude + latitudeSpan).toFixed(4),
    lomin: (longitude - longitudeSpan).toFixed(4),
    lomax: (longitude + longitudeSpan).toFixed(4),
  });

  try {
    const response = await fetch(`${OPENSKY_URL}?${params}`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`OpenSky returned ${response.status}`);

    const payload = (await response.json()) as { states?: unknown[][]; time?: number };
    const aircraft = (payload.states ?? [])
      .filter((state) => typeof state[5] === "number" && typeof state[6] === "number")
      .map((state) => ({
        icao24: String(state[0]),
        callsign: typeof state[1] === "string" ? state[1].trim() || undefined : undefined,
        longitude: Number(state[5]),
        latitude: Number(state[6]),
        altitude:
          typeof state[13] === "number"
            ? Number(state[13])
            : typeof state[7] === "number"
              ? Number(state[7])
              : undefined,
        onGround: Boolean(state[8]),
        velocity: typeof state[9] === "number" ? Number(state[9]) : undefined,
        heading: typeof state[10] === "number" ? Number(state[10]) : undefined,
        updatedAt: (payload.time ?? Math.floor(Date.now() / 1000)) * 1000,
      }))
      .slice(0, 80);

    return NextResponse.json({ aircraft, source: "OpenSky" });
  } catch {
    return NextResponse.json(
      { error: "Live aircraft data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
