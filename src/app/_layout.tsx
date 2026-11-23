import { IBMPlexSans_700Bold, useFonts } from '@expo-google-fonts/ibm-plex-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Intro } from '@/kit/Intro';
import { prefsStore } from '@/kit/prefs';
import { KitRoot } from '@/kit/Root';
import { useTheme } from '@/kit/theme';
import { brand } from '@/brand';
import { todayKey } from '@/kit/dates';
import { syncScheduled } from '@/kit/reminders';
import { PREFIX, shiftReminders } from '@/domain/reminders';
import { useLedger } from '@/state/ledger';

SplashScreen.preventAutoHideAsync().catch(() => {});
const usePrefs = prefsStore('shiftledger', 21);
const Art = ({ children }: { children: string }) => <Text style={{ fontSize: 88 }}>{children}</Text>;

function useShiftReminders() {
  const shifts = useLedger((s) => s.shifts);
  const jobs = useLedger((s) => s.jobs);
  const prefs = useLedger((s) => s.reminders);
  useEffect(() => {
    // Keeps leave, break and rota reminders in step with the rota. Does nothing on web or without permission.
    syncScheduled(PREFIX, shiftReminders(shifts, jobs, prefs, todayKey())).catch(() => {});
  }, [shifts, jobs, prefs]);
}

function Shell() {
  const { c } = useTheme();
  useShiftReminders();
  const onboarded = usePrefs((s) => s.onboarded);
  const header = { headerShown: true, headerTintColor: c.text, headerStyle: { backgroundColor: c.bg }, headerShadowVisible: false } as const;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job" options={{ ...header, title: 'Your job', presentation: 'modal' }} />
        <Stack.Screen name="shift" options={{ ...header, title: 'Shift', presentation: 'modal' }} />
      </Stack>
      {!onboarded ? (
        <View style={StyleSheet.absoluteFill}>
          <Intro
            cta="Add my job"
            onDone={() => usePrefs.getState().setOnboarded()}
            steps={[
              { title: 'Log a shift in seconds', body: 'Plan your rota, then confirm each shift with one tap. Several jobs? That works too.', art: <Art>🕘</Art> },
              { title: 'Know your take-home', body: 'See what you have earned but not been paid yet, and an estimate of your next payslip after tax and NI.', art: <Art>💷</Art> },
              { title: 'Check your payslip', body: 'Enter what you were paid and ShiftLedger flags anything that looks short, calmly.', art: <Art>🧾</Art> },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ IBMPlexSans_700Bold });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <KitRoot brand={brand}>
      <Shell />
    </KitRoot>
  );
}
