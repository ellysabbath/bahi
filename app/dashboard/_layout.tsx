// app/login/_layout.tsx
import { Stack } from 'expo-router';

export default function Dashboard() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="about" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="help" />
      <Stack.Screen name="index" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="safety" />
      <Stack.Screen name="services" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="user-profiles" />
      <Stack.Screen name="whats-new" />
      <Stack.Screen name="requests/index" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="payments/index" />
      <Stack.Screen name="garages/index" />
      <Stack.Screen name="chat/index" />
      <Stack.Screen name="bookings/index" />
      <Stack.Screen name="addresses/index" />

    </Stack>
  );
}