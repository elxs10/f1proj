module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|lucide-react-native|react-native-svg|react-native-screens|react-native-safe-area-context|react-native-reanimated|react-native-worklets)/)',
  ],
};
