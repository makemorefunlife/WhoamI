import { logServerError } from "@/lib/security/safeLog";

export type AstrologyCoordSource =
  | "explicit"
  | "place_lookup"
  | "default_san_francisco";

export type ResolvedAstrologyCoordinates = {
  latitude: number;
  longitude: number;
  timezone: number;
  source: AstrologyCoordSource;
  matchedPlace: string | null;
  birthPlaceNormalized: string | null;
};

const DEFAULT_SAN_FRANCISCO = {
  latitude: 37.7749,
  longitude: -122.4194,
  timezone: -8,
  label: "San Francisco, CA (default)",
} as const;

type PlaceEntry = {
  keys: string[];
  label: string;
  latitude: number;
  longitude: number;
  timezone: number;
};

/** 자유 입력 birth_place → 대표 좌표 (유료 geocoding 없음) */
const PLACE_COORDINATES: PlaceEntry[] = [
  { keys: ["서울", "seoul"], label: "서울", latitude: 37.5665, longitude: 126.978, timezone: 9 },
  { keys: ["부산", "busan"], label: "부산", latitude: 35.1796, longitude: 129.0756, timezone: 9 },
  { keys: ["대구", "daegu"], label: "대구", latitude: 35.8714, longitude: 128.6014, timezone: 9 },
  { keys: ["인천", "incheon"], label: "인천", latitude: 37.4563, longitude: 126.7052, timezone: 9 },
  { keys: ["광주", "gwangju"], label: "광주", latitude: 35.1595, longitude: 126.8526, timezone: 9 },
  { keys: ["대전", "daejeon"], label: "대전", latitude: 36.3504, longitude: 127.3845, timezone: 9 },
  { keys: ["울산", "ulsan"], label: "울산", latitude: 35.5384, longitude: 129.3114, timezone: 9 },
  { keys: ["세종", "sejong"], label: "세종", latitude: 36.4801, longitude: 127.289, timezone: 9 },
  { keys: ["수원", "suwon"], label: "수원", latitude: 37.2636, longitude: 127.0286, timezone: 9 },
  { keys: ["성남", "seongnam"], label: "성남", latitude: 37.4449, longitude: 127.1389, timezone: 9 },
  { keys: ["고양", "goyang"], label: "고양", latitude: 37.6584, longitude: 126.832, timezone: 9 },
  { keys: ["용인", "yongin"], label: "용인", latitude: 37.2411, longitude: 127.1776, timezone: 9 },
  { keys: ["창원", "changwon"], label: "창원", latitude: 35.228, longitude: 128.6811, timezone: 9 },
  { keys: ["청주", "cheongju"], label: "청주", latitude: 36.6424, longitude: 127.489, timezone: 9 },
  { keys: ["전주", "jeonju"], label: "전주", latitude: 35.8242, longitude: 127.148, timezone: 9 },
  { keys: ["천안", "cheonan"], label: "천안", latitude: 36.8151, longitude: 127.1139, timezone: 9 },
  { keys: ["안산", "ansan"], label: "안산", latitude: 37.3219, longitude: 126.8309, timezone: 9 },
  { keys: ["김해", "gimhae"], label: "김해", latitude: 35.2285, longitude: 128.889, timezone: 9 },
  { keys: ["포항", "pohang"], label: "포항", latitude: 36.019, longitude: 129.3435, timezone: 9 },
  { keys: ["제주", "jeju"], label: "제주", latitude: 33.4996, longitude: 126.5312, timezone: 9 },
  { keys: ["해운대"], label: "해운대", latitude: 35.1631, longitude: 129.1635, timezone: 9 },
  { keys: ["경기"], label: "경기", latitude: 37.4138, longitude: 127.5183, timezone: 9 },
  { keys: ["강원"], label: "강원", latitude: 37.8228, longitude: 128.1555, timezone: 9 },
  { keys: ["충북", "충청북"], label: "충북", latitude: 36.8, longitude: 127.7, timezone: 9 },
  { keys: ["충남", "충청남"], label: "충남", latitude: 36.5184, longitude: 126.8, timezone: 9 },
  { keys: ["전북", "전라북"], label: "전북", latitude: 35.7175, longitude: 127.153, timezone: 9 },
  { keys: ["전남", "전라남"], label: "전남", latitude: 34.8679, longitude: 126.991, timezone: 9 },
  { keys: ["경북", "경상북"], label: "경북", latitude: 36.4919, longitude: 128.8889, timezone: 9 },
  { keys: ["경남", "경상남"], label: "경남", latitude: 35.4606, longitude: 128.2132, timezone: 9 },
  { keys: ["도쿄", "tokyo"], label: "도쿄", latitude: 35.6762, longitude: 139.6503, timezone: 9 },
  { keys: ["오사카", "osaka"], label: "오사카", latitude: 34.6937, longitude: 135.5023, timezone: 9 },
  { keys: ["뉴욕", "newyork"], label: "뉴욕", latitude: 40.7128, longitude: -74.006, timezone: -5 },
  { keys: ["로스앤젤레스", "losangeles", "la"], label: "로스앤젤레스", latitude: 34.0522, longitude: -118.2437, timezone: -8 },
  {
    keys: ["샌프란시스코", "sanfrancisco", "sf", "san francisco"],
    label: "샌프란시스코",
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: -8,
  },
  { keys: ["런던", "london"], label: "런던", latitude: 51.5074, longitude: -0.1278, timezone: 0 },
  { keys: ["파리", "paris"], label: "파리", latitude: 48.8566, longitude: 2.3522, timezone: 1 },
  { keys: ["베이징", "beijing"], label: "베이징", latitude: 39.9042, longitude: 116.4074, timezone: 8 },
  { keys: ["상하이", "shanghai"], label: "상하이", latitude: 31.2304, longitude: 121.4737, timezone: 8 },
  { keys: ["홍콩", "hongkong"], label: "홍콩", latitude: 22.3193, longitude: 114.1694, timezone: 8 },
  { keys: ["타이베이", "taipei"], label: "타이베이", latitude: 25.033, longitude: 121.5654, timezone: 8 },
  { keys: ["싱가포르", "singapore"], label: "싱가포르", latitude: 1.3521, longitude: 103.8198, timezone: 8 },
];

export function normalizeBirthPlaceKey(place: string): string {
  return place
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/특별자치도|특별시|광역시|특별자치시|자치시|자치도/g, "")
    .replace(/[시도군구]/g, "");
}

function parseFiniteCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: number): boolean {
  return lon >= -180 && lon <= 180;
}

function lookupPlaceCoordinates(
  birthPlace: string,
): { entry: PlaceEntry; matchedKey: string } | null {
  const normalized = normalizeBirthPlaceKey(birthPlace);
  if (!normalized) return null;

  let best: { entry: PlaceEntry; matchedKey: string; score: number } | null =
    null;

  for (const entry of PLACE_COORDINATES) {
    for (const key of entry.keys) {
      const nk = normalizeBirthPlaceKey(key);
      if (!nk) continue;
      if (normalized === nk || normalized.includes(nk) || nk.includes(normalized)) {
        const score = nk.length;
        if (!best || score > best.score) {
          best = { entry, matchedKey: key, score };
        }
      }
    }
  }

  return best ? { entry: best.entry, matchedKey: best.matchedKey } : null;
}

export type AstrologyCoordinateInput = {
  birth_place?: string | null;
  birth_latitude?: unknown;
  birth_longitude?: unknown;
  birth_timezone?: unknown;
};

export function resolveAstrologyCoordinates(
  input: AstrologyCoordinateInput,
  logContext?: { reportId?: string; logDefaultSeoul?: boolean },
): ResolvedAstrologyCoordinates {
  const birthPlaceRaw =
    typeof input.birth_place === "string" ? input.birth_place.trim() : "";
  const birthPlaceNormalized = birthPlaceRaw
    ? normalizeBirthPlaceKey(birthPlaceRaw)
    : null;

  const lat = parseFiniteCoord(input.birth_latitude);
  const lon = parseFiniteCoord(input.birth_longitude);
  const tzStored = parseFiniteCoord(input.birth_timezone);

  if (
    lat != null &&
    lon != null &&
    isValidLatitude(lat) &&
    isValidLongitude(lon)
  ) {
    return {
      latitude: lat,
      longitude: lon,
      timezone: tzStored ?? DEFAULT_SAN_FRANCISCO.timezone,
      source: "explicit",
      matchedPlace: birthPlaceRaw || null,
      birthPlaceNormalized,
    };
  }

  if (birthPlaceRaw) {
    const hit = lookupPlaceCoordinates(birthPlaceRaw);
    if (hit) {
      return {
        latitude: hit.entry.latitude,
        longitude: hit.entry.longitude,
        timezone: hit.entry.timezone,
        source: "place_lookup",
        matchedPlace: hit.entry.label,
        birthPlaceNormalized,
      };
    }
  }

  if (logContext?.logDefaultSeoul !== false) {
    logServerError("astrology-coords", undefined, "default_san_francisco");
  }

  return {
    latitude: DEFAULT_SAN_FRANCISCO.latitude,
    longitude: DEFAULT_SAN_FRANCISCO.longitude,
    timezone: DEFAULT_SAN_FRANCISCO.timezone,
    source: "default_san_francisco",
    matchedPlace: DEFAULT_SAN_FRANCISCO.label,
    birthPlaceNormalized,
  };
}

/** persisted astrology 재사용·무효화 비교용 */
export function astrologyLocationFingerprint(
  input: AstrologyCoordinateInput,
): string {
  const resolved = resolveAstrologyCoordinates(input, {
    logDefaultSeoul: false,
  });
  const place =
    typeof input.birth_place === "string"
      ? normalizeBirthPlaceKey(input.birth_place)
      : "";
  return [
    resolved.latitude.toFixed(4),
    resolved.longitude.toFixed(4),
    resolved.timezone.toFixed(1),
    place || "-",
    resolved.source,
  ].join("|");
}

export function birthCoordinatesPatchFromPlace(
  birthPlace: string | null | undefined,
): {
  birth_latitude: number;
  birth_longitude: number;
  birth_timezone: number;
} {
  const resolved = resolveAstrologyCoordinates({ birth_place: birthPlace });
  return {
    birth_latitude: resolved.latitude,
    birth_longitude: resolved.longitude,
    birth_timezone: resolved.timezone,
  };
}
