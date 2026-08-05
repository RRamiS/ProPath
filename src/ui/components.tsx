import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from './icons';
import {
  colors,
  fonts,
  radius,
  shadowSoft,
  SKEW,
  springs,
  tones,
  UNSKEW,
  type Tone,
  valueTone,
} from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ------------------------------------------------------------------ text */

export function Title({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Body({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Eyebrow({
  children,
  tone = 'accent',
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.eyebrow, { color: tones[tone].fg }, style]}>{children}</Text>;
}

export function SectionHeader({
  eyebrow,
  title,
  tone = 'accent',
  right,
}: {
  eyebrow?: string;
  title: string;
  tone?: Tone;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        {eyebrow ? (
          <View style={styles.sectionEyebrowRow}>
            <View style={[styles.sectionEyebrowBar, { backgroundColor: tones[tone].fg }]} />
            <Eyebrow tone={tone} style={styles.sectionEyebrowText}>
              {eyebrow}
            </Eyebrow>
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

/* ----------------------------------------------------------------- atoms */

/** Etiqueta sesgada: la firma visual del sistema. */
export function Tag({
  label,
  tone = 'accent',
  solid,
  style,
}: {
  label: string;
  tone?: Tone;
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = tones[tone];
  return (
    <View
      style={[
        styles.tag,
        solid
          ? { backgroundColor: t.fg, borderColor: t.fg }
          : { backgroundColor: t.bg, borderColor: t.border },
        style,
      ]}
    >
      <Text style={[styles.tagText, { color: solid ? colors.bg : t.fg }]}>{label}</Text>
    </View>
  );
}

/** Chip recto, para efectos y metadatos. */
export function Chip({
  label,
  tone = 'muted',
  style,
}: {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <View style={[styles.chipEdge, { backgroundColor: t.fg }]} />
      <Text style={[styles.chipText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function IconBadge({
  name,
  tone = 'accent',
  size = 40,
}: {
  name: IconName;
  tone?: Tone;
  size?: number;
}) {
  const t = tones[tone];
  return (
    <View
      style={[
        styles.iconBadge,
        { width: size, height: size, backgroundColor: t.bg, borderColor: t.border },
      ]}
    >
      <Icon name={name} color={t.fg} size={size * 0.5} />
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/** Punto “en vivo” que late. */
export function LiveDot({ tone = 'danger', size = 7 }: { tone?: Tone; size?: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.18]) }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size, backgroundColor: tones[tone].fg }, style]}
    />
  );
}

/* ---------------------------------------------------------------- panels */

/**
 * Panel de broadcast: esquina viva, borde fino, barra de acento a la
 * izquierda y tab sesgado opcional montado sobre el borde superior.
 */
export function Panel({
  children,
  tone,
  label,
  glow,
  ticks = true,
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  label?: string;
  glow?: boolean;
  ticks?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = tone ? tones[tone] : null;
  return (
    <View style={[styles.panelOuter, label ? styles.panelOuterLabelled : null, style]}>
      <View
        style={[
          styles.panel,
          shadowSoft,
          t
            ? { borderColor: t.border, backgroundColor: glow ? t.bg : colors.bgElevated }
            : null,
          label ? styles.panelWithLabel : null,
        ]}
      >
        {t ? <View style={[styles.panelEdge, { backgroundColor: t.fg }]} /> : null}
        {ticks ? (
          <>
            <View style={[styles.tick, styles.tickTR, { borderColor: t?.fg ?? colors.lineStrong }]} />
            <View style={[styles.tick, styles.tickBL, { borderColor: t?.fg ?? colors.lineStrong }]} />
          </>
        ) : null}
        {children}
      </View>

      {label ? (
        <View style={[styles.panelTab, { backgroundColor: t?.fg ?? colors.muted }]}>
          <Text style={styles.panelTabText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Alias histórico: mismo panel, sin tab. */
export function Card({
  children,
  tone,
  style,
  glow,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}) {
  return (
    <Panel tone={tone} glow={glow} ticks={false} style={style}>
      {children}
    </Panel>
  );
}

/* --------------------------------------------------------------- buttons */

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'choice';
  tone?: Tone;
  hint?: string;
  selected?: boolean;
  disabled?: boolean;
  icon?: IconName;
  trailing?: ReactNode;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  tone = 'accent',
  hint,
  selected,
  disabled,
  icon,
  trailing,
  footer,
  style,
}: BtnProps) {
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);
  const t = tones[tone];

  useEffect(() => {
    selectedProgress.value = withSpring(selected ? 1 : 0, springs.select);
  }, [selected, selectedProgress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const choiceStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    return {
      borderColor: interpolateColor(p, [0, 1], [colors.line, t.fg]),
      backgroundColor: interpolateColor(p, [0, 1], [colors.bgCard, t.bg]),
      transform: [{ scale: scale.value }],
    };
  });

  const edgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(selectedProgress.value, [0, 1], [0.25, 1]),
    transform: [{ scaleY: interpolate(selectedProgress.value, [0, 1], [0.4, 1]) }],
  }));

  const isChoice = variant === 'choice';
  const hasRow = Boolean(icon || trailing);

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.975, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      style={[
        styles.btnBase,
        variant === 'primary' && [styles.btnPrimary, { backgroundColor: t.fg }],
        variant === 'ghost' && styles.btnGhost,
        isChoice && styles.btnChoice,
        isChoice ? choiceStyle : animStyle,
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      {isChoice ? (
        <Animated.View style={[styles.choiceEdge, { backgroundColor: t.fg }, edgeStyle]} />
      ) : null}

      <View style={hasRow ? styles.btnRow : undefined}>
        {icon ? (
          <View style={styles.btnIcon}>
            <Icon name={icon} color={selected ? t.fg : colors.muted} size={18} />
          </View>
        ) : null}

        <View style={hasRow ? styles.btnRowText : undefined}>
          <Text
            style={[
              styles.btnLabel,
              variant === 'primary' && styles.btnLabelPrimary,
              isChoice && styles.btnLabelChoice,
              selected && isChoice && { color: t.fg },
            ]}
          >
            {label}
          </Text>
          {hint ? <Text style={styles.btnHint}>{hint}</Text> : null}
        </View>

        {trailing ?? null}
      </View>

      {footer ? <View style={styles.btnFooter}>{footer}</View> : null}
    </AnimatedPressable>
  );
}

/** Card presionable con la misma física que Button, para layouts custom. */
export function PressCard({
  children,
  onPress,
  tone,
  selected,
  disabled,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  tone?: Tone;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const t = tone ? tones[tone] : null;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        styles.pressCard,
        shadowSoft,
        t ? { borderColor: selected ? t.fg : t.border, backgroundColor: t.bg } : null,
        disabled && styles.btnDisabled,
        animStyle,
        style,
      ]}
    >
      {t ? <View style={[styles.pressEdge, { backgroundColor: t.fg }]} /> : null}
      {children}
    </AnimatedPressable>
  );
}

/* ----------------------------------------------------------------- bars */

/** Barra animada con color según valor (o tono fijo). */
export function Meter({
  value,
  tone,
  autoTone,
  invert,
  height = 6,
  delay = 0,
  track = 'rgba(235,240,248,0.08)',
}: {
  value: number;
  tone?: Tone;
  autoTone?: boolean;
  invert?: boolean;
  height?: number;
  delay?: number;
  track?: string;
}) {
  const progress = useSharedValue(0);
  const trackW = useSharedValue(0);
  const resolved = autoTone ? valueTone(value, invert) : (tone ?? 'accent');
  const fg = tones[resolved].fg;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(Math.max(0, Math.min(100, value)) / 100, springs.progress)
    );
  }, [value, delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackW.value * progress.value,
  }));

  return (
    <View
      style={[styles.meterTrack, { height, backgroundColor: track }]}
      onLayout={(e: LayoutChangeEvent) => {
        trackW.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View style={[styles.meterFill, { backgroundColor: fg }, fillStyle]} />
    </View>
  );
}

type StatProps = {
  label: string;
  value: number;
  delay?: number;
  tone?: Tone;
  autoTone?: boolean;
};

export function StatBar({ label, value, delay = 0, tone, autoTone = true }: StatProps) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.statBarWrap}>
        <Meter value={value} delay={delay} tone={tone} autoTone={autoTone && !tone} height={6} />
      </View>
      <Text style={styles.statValue}>{Math.round(value)}</Text>
    </View>
  );
}

/** Medidor con título arriba, para forma/fatiga. */
export function Gauge({
  label,
  value,
  suffix,
  invert,
  tone,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  invert?: boolean;
  tone?: Tone;
  hint?: string;
}) {
  const resolved = tone ?? valueTone(value, invert);
  return (
    <View style={styles.gauge}>
      <View style={styles.gaugeTop}>
        <Text style={styles.gaugeLabel}>{label}</Text>
        <Text style={[styles.gaugeValue, { color: tones[resolved].fg }]}>
          {Math.round(value)}
          {suffix ?? ''}
        </Text>
      </View>
      <Meter value={value} tone={resolved} height={4} />
      {hint ? <Text style={styles.gaugeHint}>{hint}</Text> : null}
    </View>
  );
}

/** Semanas como segmentos: se lee el avance de temporada de un vistazo. */
export function SeasonStrip({
  turn,
  maxTurns,
  tone = 'accent',
}: {
  turn: number;
  maxTurns: number;
  tone?: Tone;
}) {
  const max = Math.max(1, maxTurns);
  const t = tones[tone];
  return (
    <View style={styles.seasonStrip}>
      {Array.from({ length: max }).map((_, i) => (
        <Segment key={i} filled={i < turn} current={i === turn - 1} color={t.fg} index={i} />
      ))}
    </View>
  );
}

function Segment({
  filled,
  current,
  color,
  index,
}: {
  filled: boolean;
  current: boolean;
  color: string;
  index: number;
}) {
  const grow = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    grow.value = withDelay(index * 12, withSpring(filled ? 1 : 0, springs.progress));
  }, [filled, grow, index]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(grow.value, [0, 1], [0.5, 1]),
    backgroundColor: grow.value > 0.5 ? color : colors.lineStrong,
    transform: [{ scaleY: interpolate(grow.value, [0, 1], [0.55, 1]) }],
  }));

  return <Animated.View style={[styles.segment, current && styles.segmentCurrent, style]} />;
}

/** Pasos de una secuencia (fases del partido). */
export function Stepper({
  steps,
  current,
  tone = 'accent',
}: {
  steps: string[];
  current: number;
  tone?: Tone;
}) {
  const t = tones[tone];
  return (
    <View style={styles.stepper}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={s} style={styles.stepItem}>
            <View
              style={[
                styles.stepBlock,
                { borderColor: done || active ? t.fg : colors.lineStrong },
                done && { backgroundColor: t.fg },
                active && { backgroundColor: t.bg },
              ]}
            />
            <Text
              style={[styles.stepLabel, (done || active) && { color: active ? t.fg : colors.muted }]}
              numberOfLines={1}
            >
              {s}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------------- motion */

/** Aparición con “pop” para resultados y badges. */
export function PopIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(delay, withSequence(withTiming(0, { duration: 0 }), withSpring(1, springs.bouncy)));
  }, [delay, p]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.6),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.86, 1]) }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

/** Revelado tipo persiana: crece desde la izquierda. */
export function Shutter({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [delay, p]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scaleX: interpolate(p.value, [0, 1], [0.9, 1]) }],
  }));

  return (
    <Animated.View style={[{ transformOrigin: 'left' } as ViewStyle, style, animStyle]}>
      {children}
    </Animated.View>
  );
}

/** Numeral grande que sube contando: se siente “scoreboard”. */
export function BigNumber({
  value,
  duration = 700,
  style,
  prefix,
  suffix,
}: {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
}) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return (
    <Text style={[styles.bigNumber, style]}>
      {prefix ?? ''}
      {shown}
      {suffix ?? ''}
    </Text>
  );
}

/* ---------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  /* text */
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fonts.display,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.body,
  },
  sectionLabel: {
    color: colors.faint,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionHeaderText: { flex: 1 },
  sectionEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 7,
  },
  sectionEyebrowBar: { width: 14, height: 2 },
  sectionEyebrowText: { marginBottom: 0 },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.7,
    textTransform: 'uppercase',
  },

  /* atoms */
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    transform: [{ skewX: SKEW }],
    alignSelf: 'flex-start',
  },
  tagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    transform: [{ skewX: UNSKEW }],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 7,
    paddingRight: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    gap: 6,
  },
  chipEdge: { width: 2, height: 10 },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 14,
  },

  /* panels */
  panelOuter: { position: 'relative' },
  panelOuterLabelled: { marginTop: 9 },
  panel: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    paddingLeft: 18,
    overflow: 'hidden',
  },
  panelWithLabel: { paddingTop: 20 },
  panelEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  tick: {
    position: 'absolute',
    width: 10,
    height: 10,
    opacity: 0.5,
  },
  tickTR: { top: 5, right: 5, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  tickBL: { bottom: 5, left: 8, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  panelTab: {
    position: 'absolute',
    top: -9,
    left: 14,
    paddingHorizontal: 9,
    paddingVertical: 2,
    transform: [{ skewX: SKEW }],
  },
  panelTabText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    transform: [{ skewX: UNSKEW }],
  },

  /* buttons */
  btnBase: {
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  btnPrimary: {
    width: '100%',
    alignSelf: 'stretch',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    width: '100%',
    alignSelf: 'stretch',
  },
  btnChoice: {
    alignItems: 'stretch',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgCard,
    width: '100%',
    alignSelf: 'stretch',
    paddingLeft: 20,
  },
  choiceEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  btnDisabled: { opacity: 0.4 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  btnRowText: { flex: 1 },
  btnIcon: { width: 28, alignItems: 'center' },
  btnLabel: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.2,
  },
  btnLabelPrimary: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  btnLabelChoice: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    letterSpacing: 0,
  },
  btnHint: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  btnFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  pressCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    paddingLeft: 16,
    overflow: 'hidden',
  },
  pressEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },

  /* bars */
  meterTrack: {
    width: '100%',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  statLabel: {
    width: 84,
    color: colors.faint,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontFamily: fonts.bodyBold,
  },
  statBarWrap: { flex: 1 },
  statValue: {
    width: 26,
    textAlign: 'right',
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.displaySemi,
  },
  gauge: { flex: 1, gap: 6 },
  gaugeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  gaugeLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  gaugeValue: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
  },
  gaugeHint: {
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  seasonStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 9,
  },
  segment: {
    flex: 1,
    height: 4,
    backgroundColor: colors.lineStrong,
  },
  segmentCurrent: { height: 9 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBlock: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  stepLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  bigNumber: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -1.6,
  },
});
