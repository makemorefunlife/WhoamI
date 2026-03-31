import { calculateSaju } from "@fullstackfamily/manseryeok";

export function getSaju(birthDate: string, birthTime: string) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime.split(":").map(Number);

  const result = calculateSaju(year, month, day, hour, minute);

  return result;
}
