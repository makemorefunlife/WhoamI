import { logServerError } from "@/lib/security/safeLog";
import { getUnknownBirthFallback } from "@/lib/v2/onboarding/birthFallbackPolicy";

export type AstrologyCoordSource =
  | "explicit"
  | "place_lookup"
  // Historical tag name from when the only fallback was San Francisco —
  // kept as-is (not renamed) since it's compared against as a literal in
  // several other files; what it actually resolves to is now locale-aware
  // (see getUnknownBirthFallback), not always San Francisco.
  | "default_san_francisco";

export type ResolvedAstrologyCoordinates = {
  latitude: number;
  longitude: number;
  timezone: number;
  source: AstrologyCoordSource;
  matchedPlace: string | null;
  birthPlaceNormalized: string | null;
};

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

  // 1. Exact match on raw trimmed key or normalized key
  const trimmed = birthPlace.trim().toLowerCase();
  for (const entry of PLACE_COORDINATES) {
    if (entry.label.toLowerCase() === trimmed) {
      return { entry, matchedKey: entry.label };
    }
    for (const key of entry.keys) {
      if (key.toLowerCase() === trimmed) {
        return { entry, matchedKey: key };
      }
    }
  }

  for (const entry of PLACE_COORDINATES) {
    for (const key of entry.keys) {
      const nk = normalizeBirthPlaceKey(key);
      if (nk && nk === normalized) {
        return { entry, matchedKey: key };
      }
    }
  }

  // 2. Partial substring match (fallback)
  let best: { entry: PlaceEntry; matchedKey: string; score: number } | null =
    null;

  for (const entry of PLACE_COORDINATES) {
    for (const key of entry.keys) {
      const nk = normalizeBirthPlaceKey(key);
      if (!nk) continue;
      if (normalized.includes(nk) || nk.includes(normalized)) {
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
  logContext?: { reportId?: string; logDefaultSeoul?: boolean; locale?: string },
): ResolvedAstrologyCoordinates {
  const birthPlaceRaw =
    typeof input.birth_place === "string" ? input.birth_place.trim() : "";
  const birthPlaceNormalized = birthPlaceRaw
    ? normalizeBirthPlaceKey(birthPlaceRaw)
    : null;

  const lat = parseFiniteCoord(input.birth_latitude);
  const lon = parseFiniteCoord(input.birth_longitude);
  const tzStored = parseFiniteCoord(input.birth_timezone);
  // Only reached when lat/lon are explicit but timezone alone is missing,
  // or when place text matched nothing in the table below — ko-KR (/kr)
  // falls back to Seoul, everything else to New York.
  const fallback = getUnknownBirthFallback(logContext?.locale ?? "en-US");

  if (
    lat != null &&
    lon != null &&
    isValidLatitude(lat) &&
    isValidLongitude(lon)
  ) {
    return {
      latitude: lat,
      longitude: lon,
      timezone: tzStored ?? fallback.timezone,
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
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    timezone: fallback.timezone,
    source: "default_san_francisco",
    matchedPlace: `${fallback.place} (default)`,
    birthPlaceNormalized,
  };
}

/** persisted astrology 재사용·무효화 비교용 */
export function astrologyLocationFingerprint(
  input: AstrologyCoordinateInput,
  locale?: string,
): string {
  const resolved = resolveAstrologyCoordinates(input, {
    logDefaultSeoul: false,
    locale,
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
  locale?: string,
): {
  birth_latitude: number;
  birth_longitude: number;
  birth_timezone: number;
} {
  const resolved = resolveAstrologyCoordinates({ birth_place: birthPlace }, { locale });
  return {
    birth_latitude: resolved.latitude,
    birth_longitude: resolved.longitude,
    birth_timezone: resolved.timezone,
  };
}

export type SupportedPlaceOption = {
  value: string;
  labelKo: string;
  labelEn: string;
  latitude: number;
  longitude: number;
  timezone: number;
};

/**
 * 17 Korean administrative regions (특별시·광역시·특별자치시·도·특별자치도)
 */
export const KOREAN_REGIONS: readonly SupportedPlaceOption[] = [
  { value: "서울", labelKo: "서울", labelEn: "Seoul", latitude: 37.5665, longitude: 126.978, timezone: 9 },
  { value: "경기", labelKo: "경기", labelEn: "Gyeonggi", latitude: 37.4138, longitude: 127.5183, timezone: 9 },
  { value: "인천", labelKo: "인천", labelEn: "Incheon", latitude: 37.4563, longitude: 126.7052, timezone: 9 },
  { value: "부산", labelKo: "부산", labelEn: "Busan", latitude: 35.1796, longitude: 129.0756, timezone: 9 },
  { value: "대구", labelKo: "대구", labelEn: "Daegu", latitude: 35.8714, longitude: 128.6014, timezone: 9 },
  { value: "광주", labelKo: "광주", labelEn: "Gwangju", latitude: 35.1595, longitude: 126.8526, timezone: 9 },
  { value: "대전", labelKo: "대전", labelEn: "Daejeon", latitude: 36.3504, longitude: 127.3845, timezone: 9 },
  { value: "울산", labelKo: "울산", labelEn: "Ulsan", latitude: 35.5384, longitude: 129.3114, timezone: 9 },
  { value: "세종", labelKo: "세종", labelEn: "Sejong", latitude: 36.4801, longitude: 127.289, timezone: 9 },
  { value: "강원", labelKo: "강원", labelEn: "Gangwon", latitude: 37.8228, longitude: 128.1555, timezone: 9 },
  { value: "충북", labelKo: "충북", labelEn: "Chungbuk", latitude: 36.8, longitude: 127.7, timezone: 9 },
  { value: "충남", labelKo: "충남", labelEn: "Chungnam", latitude: 36.5184, longitude: 126.8, timezone: 9 },
  { value: "전북", labelKo: "전북", labelEn: "Jeonbuk", latitude: 35.7175, longitude: 127.153, timezone: 9 },
  { value: "전남", labelKo: "전남", labelEn: "Jeonnam", latitude: 34.8679, longitude: 126.991, timezone: 9 },
  { value: "경북", labelKo: "경북", labelEn: "Gyeongbuk", latitude: 36.4919, longitude: 128.8889, timezone: 9 },
  { value: "경남", labelKo: "경남", labelEn: "Gyeongnam", latitude: 35.4606, longitude: 128.2132, timezone: 9 },
  { value: "제주", labelKo: "제주", labelEn: "Jeju", latitude: 33.4996, longitude: 126.5312, timezone: 9 },
] as const;

/**
 * Standard Global Cities supported for astrological mapping in EN locale
 */
export const GLOBAL_CITIES: readonly SupportedPlaceOption[] = [
  { value: "New York, NY", labelKo: "뉴욕", labelEn: "New York, NY, USA", latitude: 40.7128, longitude: -74.006, timezone: -5 },
  { value: "Los Angeles, CA", labelKo: "로스앤젤레스", labelEn: "Los Angeles, CA, USA", latitude: 34.0522, longitude: -118.2437, timezone: -8 },
  { value: "San Francisco, CA", labelKo: "샌프란시스코", labelEn: "San Francisco, CA, USA", latitude: 37.7749, longitude: -122.4194, timezone: -8 },
  { value: "London, UK", labelKo: "런던", labelEn: "London, UK", latitude: 51.5074, longitude: -0.1278, timezone: 0 },
  { value: "Paris, France", labelKo: "파리", labelEn: "Paris, France", latitude: 48.8566, longitude: 2.3522, timezone: 1 },
  { value: "Tokyo, Japan", labelKo: "도쿄", labelEn: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503, timezone: 9 },
  { value: "Osaka, Japan", labelKo: "오사카", labelEn: "Osaka, Japan", latitude: 34.6937, longitude: 135.5023, timezone: 9 },
  { value: "Seoul, South Korea", labelKo: "서울", labelEn: "Seoul, South Korea", latitude: 37.5665, longitude: 126.978, timezone: 9 },
  { value: "Busan, South Korea", labelKo: "부산", labelEn: "Busan, South Korea", latitude: 35.1796, longitude: 129.0756, timezone: 9 },
  { value: "Singapore", labelKo: "싱가포르", labelEn: "Singapore", latitude: 1.3521, longitude: 103.8198, timezone: 8 },
  { value: "Hong Kong", labelKo: "홍콩", labelEn: "Hong Kong", latitude: 22.3193, longitude: 114.1694, timezone: 8 },
  { value: "Taipei, Taiwan", labelKo: "타이베이", labelEn: "Taipei, Taiwan", latitude: 25.033, longitude: 121.5654, timezone: 8 },
  { value: "Beijing, China", labelKo: "베이징", labelEn: "Beijing, China", latitude: 39.9042, longitude: 116.4074, timezone: 8 },
  { value: "Shanghai, China", labelKo: "상하이", labelEn: "Shanghai, China", latitude: 31.2304, longitude: 121.4737, timezone: 8 },
] as const;

