import 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CreateScreen, EndingScreen, HomeScreen, PlayScreen } from './src/screens';
import { WeekHubScreen } from './src/screens/WeekHub';
import { LiveMatchScreen } from './src/match/LiveMatch';
import { MinigameScreen } from './src/minigames/MinigameScreen';
import { CinematicOverlay } from './src/ui/Cinematic';
import { useGameStore } from './src/store/gameStore';
import { colors } from './src/ui/theme';

function ActiveScreen() {
  const screen = useGameStore((s) => s.screen);

  if (screen === 'create') return <CreateScreen />;
  if (screen === 'weekHub') return <WeekHubScreen />;
  if (screen === 'play') return <PlayScreen />;
  if (screen === 'match') return <LiveMatchScreen />;
  if (screen === 'minigame') return <MinigameScreen />;
  if (screen === 'ending') return <EndingScreen />;
  return <HomeScreen />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <ActiveScreen />
        <CinematicOverlay />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
