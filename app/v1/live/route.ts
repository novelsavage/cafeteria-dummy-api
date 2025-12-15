import { NextResponse } from "next/server";
import table from "@/data/minute_table.json";

export const runtime = "nodejs";

const FMT = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
};

function pickRowByTimeOfDay(nowJST: Date) {
  const targetSec =
    nowJST.getUTCHours() * 3600 +
    nowJST.getUTCMinutes() * 60 +
    nowJST.getUTCSeconds();

  let best = table[0];
  let bestDiff = 1e9;

  for (const row of table as any[]) {
    const hh = Number(row.datetime.slice(11, 13));
    const mm = Number(row.datetime.slice(14, 16));
    const ss = Number(row.datetime.slice(17, 19));

    const rowSec = hh * 3600 + mm * 60 + ss;
    const diff = Math.abs(rowSec - targetSec);

    if (diff < bestDiff) {
      bestDiff = diff;
      best = row;
    }
  }
  return best;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const building_id = searchParams.get("building_id") ?? "main_building";

  // JST = UTC+9
  const now = new Date();
  const nowJST = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  // nowJST.setSeconds(0, 0);

  const row = pickRowByTimeOfDay(nowJST);

  return NextResponse.json(
    {
      building_id,
      datetime: FMT(nowJST),
      W: Number(row.W) || 0,
      in_1ave3: Number(row.in_1ave3) || 0,
      in_2ave5: Number(row.in_2ave5) || 0,
      d1: Number(row.d1) || 0,
      d2: Number(row.d2) || 0,
      d3: Number(row.d3) || 0,
      lag_sec: 0,
      stay_population: 0,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    }
  );
}
