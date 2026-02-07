export type WaterType = "ponds" | "river" | "lake";

export const WATER_TYPES: WaterType[] = ["ponds", "river", "lake"];

export const WATER_TYPE_LABELS: Record<WaterType, string> = {
  ponds: "Ponds",
  river: "River",
  lake: "Lake",
};
