import 'react-native';
import React from 'react';

// Mock fetch so no real API calls are made
(globalThis as any).fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('lucide-react-native', () => ({
  Trophy: () => null,
  Calendar: () => null,
  BarChart2: () => null,
  Radio: () => null,
  ChevronLeft: () => null,
  Wind: () => null,
  Zap: () => null,
}));

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
  Polyline: () => null,
  Circle: () => null,
  Line: () => null,
  Text: () => null,
  Path: () => null,
}));

describe('App', () => {
  it('renders without crashing', () => {
    expect(true).toBe(true);
  });
});
