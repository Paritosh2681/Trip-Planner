export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string; // Unique ID for mapping
  time: string;
  title: string;
  description: string;
  locationName: string;
  coordinates: GeoPoint;
  duration: string;
  costEstimate: string;
  type: 'sightseeing' | 'nature' | 'culture' | 'food' | 'shopping' | 'entertainment' | 'relax' | 'transit';
  // Extended fields for expandable cards
  images?: string[];
  fullDescription?: string;
  openingHours?: {
    today?: string;
    weekly?: { day: string; hours: string }[];
  };
  suggestedDuration?: string;
  ticketPrice?: string;
  bestTimeToVisit?: string;
  address?: string;
  transportToNext?: string;
  tags?: string[];
}

export interface DaySchedule {
  dayNumber: number;
  theme: string;
  activities: Activity[];
}

export interface TripBudget {
  accommodation: string;
  food: string;
  activities: string;
  total: string;
  currency: string;
}

export interface Trip {
  destination: string;
  durationDays: number;
  summary: string;
  bestTimeToVisit: string;
  budget: TripBudget;
  schedule: DaySchedule[];
}

export interface TripRequest {
  destination: string;
  days: number;
}