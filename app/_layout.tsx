// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { UserProvider } from '../context/UserContext';
import '../global.css';

export default function RootLayout() {
  return (
    <UserProvider>
      <ThemeProvider>
        <Stack 
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          {/* Authentication screens */}
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="login/index" options={{ title: 'Login' }} />
          <Stack.Screen name="register/register" options={{ title: 'Register' }} />
          <Stack.Screen name="login/verify" options={{ title: 'Verify Account' }} />
          <Stack.Screen name="login/forgot-password/index" options={{ title: 'Forgot Password' }} />
          {/* <Stack.Screen name="register/_layout" options={{ title: 'Register' }} /> */}
          <Stack.Screen name="verify-otp/index" options={{ title: 'Verify OTP' }} />
          
          {/* Dashboard routes - Handled by app/dashboard/_layout.tsx */}
          <Stack.Screen name="dashboard/_layout" />
                <Stack.Screen 
        name="register/index" 
        options={{ 
          headerShown: false,
          title: 'Register'
        }} 
      />
      <Stack.Screen 
        name="register/verify" 
        options={{ 
          headerShown: false,
          title: 'Verify Account'
        }} 
      />
          {/* Admin routes - Handled by app/admin/_layout.tsx */}
          <Stack.Screen name="admin/_layout" />
          
          {/* Mechanic routes */}
          <Stack.Screen name="Mechanic/bookings/index" />
        </Stack>
      </ThemeProvider>
    </UserProvider>
  );
}