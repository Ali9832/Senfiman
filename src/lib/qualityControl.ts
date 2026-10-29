export type QcInspection = {
  id: string;
  userId: string;
  buildingId: string | null;
  locationType: string;
  locationValue: string;
  scores: Record<string, number>;
  overallRating: number | null;
  notes: string | null;
  photoPath: string | null;
  createdAt: string;
  building?: { id: string; name: string } | null;
};
