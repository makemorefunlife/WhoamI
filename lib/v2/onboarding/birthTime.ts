export type AmPm = "am" | "pm";

/** 12시간제(오전/오후) → DB용 HH:MM (24시간) */
export function convert12hTo24h(
  period: AmPm,
  hour12: number,
  minute: number,
): string | null {
  if (!Number.isInteger(hour12) || hour12 < 1 || hour12 > 12) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;

  let h24 = hour12 % 12;
  if (period === "pm") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parse24hTo12h(time24: string): {
  period: AmPm;
  hour: string;
  minute: string;
} | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time24.trim());
  if (!m) return null;
  const h24 = Number(m[1]);
  const min = Number(m[2]);
  if (h24 < 0 || h24 > 23 || min < 0 || min > 59) return null;

  const period: AmPm = h24 >= 12 ? "pm" : "am";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  return {
    period,
    hour: String(h12),
    minute: String(min).padStart(2, "0"),
  };
}
