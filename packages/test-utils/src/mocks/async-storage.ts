const store: Record<string, string> = {};

export default {
  getItem: async (key: string) => store[key] ?? null,
  setItem: async (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: async (key: string) => {
    delete store[key];
  },
  clear: async () => {
    Object.keys(store).forEach((key) => delete store[key]);
  },
  getAllKeys: async () => Object.keys(store),
  multiGet: async (keys: string[]) =>
    keys.map((key) => [key, store[key] ?? null] as [string, string | null]),
  multiSet: async (entries: [string, string][]) => {
    entries.forEach(([key, value]) => {
      store[key] = value;
    });
  },
  multiRemove: async (keys: string[]) => {
    keys.forEach((key) => delete store[key]);
  },
};
