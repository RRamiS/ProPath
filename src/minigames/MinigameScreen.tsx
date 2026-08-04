import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DraftMinigame,
  FarmMinigame,
  FocusMinigame,
  ReactionMinigame,
  VisionMinigame,
} from './Minigames';
import { useGameStore } from '../store/gameStore';
import { colors } from '../ui/theme';

export function MinigameScreen() {
  const mg = useGameStore((s) => s.activeMinigame);
  const career = useGameStore((s) => s.career);
  const complete = useGameStore((s) => s.completeMinigame);

  if (!mg) {
    return <View style={styles.root} />;
  }

  const common = {
    difficulty: mg.difficulty,
    title: mg.title,
    blurb: mg.blurb,
    onDone: complete,
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#05080C', '#0A1620', '#07120E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bezel} pointerEvents="none" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {mg.kind === 'reaction' && <ReactionMinigame {...common} />}
          {mg.kind === 'draft' && (
            <DraftMinigame {...common} roleId={career?.profile.roleId ?? 'mid'} />
          )}
          {mg.kind === 'farm' && <FarmMinigame {...common} />}
          {mg.kind === 'vision' && <VisionMinigame {...common} />}
          {mg.kind === 'focus' && <FocusMinigame {...common} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bezel: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(61,220,151,0.2)',
    borderRadius: 18,
  },
});
