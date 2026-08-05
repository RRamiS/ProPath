import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DraftMinigame,
  FarmMinigame,
  FocusMinigame,
  ReactionMinigame,
  VisionMinigame,
} from './Minigames';
import {
  ClutchMinigame,
  ComboMinigame,
  DodgeMinigame,
  InterviewMinigame,
  NegotiationMinigame,
} from './extra';
import { useGameStore } from '../store/gameStore';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, maxContentWidth, radius, space } from '../ui/theme';

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
      <MobaBackdrop intensity="cinematic" stageId={career?.stageId} />
      <View style={styles.bezel} pointerEvents="none" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {mg.kind === 'reaction' && <ReactionMinigame {...common} />}
          {mg.kind === 'draft' && (
            <DraftMinigame {...common} roleId={career?.profile.roleId ?? 'mid'} />
          )}
          {mg.kind === 'farm' && <FarmMinigame {...common} />}
          {mg.kind === 'vision' && <VisionMinigame {...common} />}
          {mg.kind === 'focus' && <FocusMinigame {...common} />}
          {mg.kind === 'combo' && <ComboMinigame {...common} />}
          {mg.kind === 'dodge' && <DodgeMinigame {...common} />}
          {mg.kind === 'clutch' && <ClutchMinigame {...common} />}
          {mg.kind === 'interview' && <InterviewMinigame {...common} />}
          {mg.kind === 'negotiation' && <NegotiationMinigame {...common} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: {
    paddingBottom: space.xl,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  bezel: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(157,123,255,0.22)',
    borderRadius: radius.md,
  },
});
