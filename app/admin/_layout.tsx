// app/login/_layout.tsx
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="manageMechanics/index" />
      <Stack.Screen name="manage/index" />
      <Stack.Screen name="services/index" />
      <Stack.Screen name="users/index" />
      <Stack.Screen name="garages/index" />
      <Stack.Screen name="bookings/index" />
      <Stack.Screen name="dashboard/index" />
    </Stack>
  );
}