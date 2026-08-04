import { ReactNode, useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, radius, springs } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'choice';
  hint?: string;
  selected?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  hint,
  selected,
  disabled,
  style,
}: BtnProps) {
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selectedProgress.value = withSpring(selected ? 1 : 0, springs.select);
  }, [selected, selectedProgress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const choiceStyle = useAnimatedStyle(() => {
    const t = selectedProgress.value;
    return {
      borderColor: interpolateColor(t, [0, 1], [colors.line, colors.accent]),
      backgroundColor: interpolateColor(t, [0, 1], [colors.bgCard, 'rgba(61, 220, 151, 0.16)']),
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'choice' && styles.choice,
        variant === 'choice' ? choiceStyle : animStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelPrimary,
          variant === 'choice' && styles.labelChoice,
          selected && variant === 'choice' && styles.labelSelected,
        ]}
      >
        {label}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </AnimatedPressable>
  );
}

type StatProps = { label: string; value: number; delay?: number };

export function StatBar({ label, value, delay = 0 }: StatProps) {
  const progress = useSharedValue(0);
  const trackW = useSharedValue(0);

  useEffect(() => {
    const id = setTimeout(() => {
      progress.value = withSpring(Math.max(0, Math.min(100, value)) / 100, springs.progress);
    }, delay);
    return () => clearTimeout(id);
  }, [value, delay, progress]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackW.value = e.nativeEvent.layout.width;
  };

  const fillStyle = useAnimatedStyle(() => ({
    width: trackW.value * progress.value,
  }));

  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.barTrack} onLayout={onTrackLayout}>
        <Animated.View style={[styles.barFill, fillStyle]} />
      </View>
      <Text style={styles.statValue}>{Math.round(value)}</Text>
    </View>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

type ProgressProps = {
  turn: number;
  maxTurns: number;
  stageName: string;
};

export function ProgressRail({ turn, maxTurns, stageName }: ProgressProps) {
  const progress = useSharedValue(0);
  const trackW = useSharedValue(0);

  useEffect(() => {
    const ratio = Math.max(0, Math.min(1, turn / Math.max(1, maxTurns)));
    progress.value = withSpring(ratio, springs.progress);
  }, [turn, maxTurns, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackW.value * progress.value,
  }));

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressMeta}>
        <Text style={styles.progressStage}>{stageName}</Text>
        <Text style={styles.progressTurns}>
          {turn}/{maxTurns}
        </Text>
      </View>
      <View
        style={styles.progressTrack}
        onLayout={(e) => {
          trackW.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View style={[styles.progressFill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  choice: {
    alignItems: 'flex-start',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.bgCard,
    width: '100%',
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: colors.accent,
    width: '100%',
    alignSelf: 'stretch',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    width: '100%',
    alignSelf: 'stretch',
  },
  disabled: { opacity: 0.45 },
  label: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodySemi,
  },
  labelPrimary: {
    color: '#04140E',
    fontFamily: fonts.bodyBold,
  },
  labelChoice: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  labelSelected: {
    color: colors.accent,
  },
  hint: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statLabel: {
    width: 92,
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.lineStrong,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  statValue: {
    width: 28,
    textAlign: 'right',
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.bodySemi,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.display,
    letterSpacing: -0.6,
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.body,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 10,
  },
  progressWrap: { marginBottom: 14, gap: 8 },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStage: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.bodySemi,
  },
  progressTurns: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.lineStrong,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
