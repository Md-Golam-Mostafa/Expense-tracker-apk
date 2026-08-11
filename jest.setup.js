/* eslint-env jest */
const mockStore = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async key =>
      mockStore.has(key) ? mockStore.get(key) : null,
    ),
    setItem: jest.fn(async (key, value) => {
      mockStore.set(key, String(value));
    }),
    removeItem: jest.fn(async key => {
      mockStore.delete(key);
    }),
    clear: jest.fn(async () => {
      mockStore.clear();
    }),
    getAllKeys: jest.fn(async () => Array.from(mockStore.keys())),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
  },
}));
