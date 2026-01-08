// app/register/_layout.tsx
import { Stack } from 'expo-router';

export default function RegisterLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="index" /> {/* Personal Info */}
      <Stack.Screen name="location" /> {/* Location - Step 2 */}
      <Stack.Screen name="contact" /> {/* Contact - Step 3 */}
      <Stack.Screen name="terms" /> {/* Terms & Security - Step 4 */}
      <Stack.Screen name="verify-otp" /> {/* OTP Verification */}
    </Stack>
  );
}