export type MealScoutContext = {
  user: {
    id: string;
    roles: string[];
  };
  location: {
    city?: string;
    county?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  scoutBridge: {
    execute: (command: string, params?: unknown) => Promise<unknown>;
  };
};
