// app/login/_layout.tsx
import { Stack } from 'expo-router';

export default function LoginLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="password-reset-otp-verify" />
      <Stack.Screen name="password-reset-confirm" />
      <Stack.Screen name="password-reset-complete" />
    </Stack>
  );
}