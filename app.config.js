// The repository root is an npm workspace, not an Expo app: the app lives in
// apps/mobile. Expo started from here finds no entry point and fails with
// 'Unable to resolve "../../App" from "node_modules/expo/AppEntry.js"', so stop
// before that and print the command that works.
const error = new Error(
  'This is the repository root, not the Expo app. Start the mobile app from apps/mobile:\n\n' +
    '  cd apps/mobile && npx expo start\n\n' +
    'or from the root: npm run dev:mobile'
);
// The Expo CLI prints a ConfigError as its message alone, without a stack trace.
error.name = 'ConfigError';
throw error;
