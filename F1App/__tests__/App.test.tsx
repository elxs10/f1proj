import 'react-native';
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock fetch so no real API calls are made
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Trophy: () => null,
  Calendar: () => null,
  BarChart2: () => null,
  Radio: () => null,
  ChevronLeft: () => null,
  Wind: () => null,
  Zap: () => null,
}));

// Mock react-native-svg
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
    render(<App />);
  });
});
