export type ApproximateBirthPlace = {
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
};

/** 장소 미입력 시 브라우저 위치로 대략 좌표 확보 (실패 시 null) */
export async function resolveApproximateBirthPlaceClient(): Promise<ApproximateBirthPlace | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10_000,
        maximumAge: 300_000,
      });
    });

    const { latitude, longitude } = pos.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      birthPlace: "Near your current location",
      birthLatitude: latitude,
      birthLongitude: longitude,
    };
  } catch {
    return null;
  }
}
