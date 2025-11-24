import { Trip } from '../types';

const STORAGE_KEY = 'arch_trip_planner_history';

export interface HistoryItem extends Trip {
  historyId: string;
  timestamp: number;
}

export const getTripHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Failed to load history', error);
    return [];
  }
};

export const saveTripToHistory = (trip: Trip): HistoryItem[] => {
  const currentHistory = getTripHistory();
  
  // Avoid exact duplicates at the top of the stack (same destination + days created within last minute)
  const isDuplicate = currentHistory.length > 0 && 
    currentHistory[0].destination === trip.destination && 
    currentHistory[0].durationDays === trip.durationDays &&
    (Date.now() - currentHistory[0].timestamp) < 60000;

  if (isDuplicate) return currentHistory;

  const newItem: HistoryItem = {
    ...trip,
    historyId: Date.now().toString() + Math.random().toString(36).substring(2),
    timestamp: Date.now(),
  };

  // Add to top, limit to 20 items
  const updatedHistory = [newItem, ...currentHistory].slice(0, 20);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save history', error);
  }
  
  return updatedHistory;
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history', error);
  }
};