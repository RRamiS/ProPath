/**
 * Arte del diorama hecho con Views: sin SVG, sin assets, escala perfecto.
 * Regla del set: base oscura + rim light en el borde superior + un único
 * elemento emisivo por objeto. Así la escena lee incluso en miniatura.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, tones, type Tone } from '../ui/theme';
import type { PropId } from './layout';

export interface ArtProps {
  lit: boolean;
  tone: Tone;
  stageOrder: number;
  night: boolean;
  upgrades?: {
    monitor?: boolean;
    chair?: boolean;
    glow?: boolean;
    banner?: boolean;
    desk?: boolean;
  };
}

const ABS = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;
const RIM = 'rgba(244,247,251,0.16)';
const BODY_DARK = '#0E1118';
const BODY_MID = '#161A23';
const BODY_LIGHT = '#1E232E';

/** Latido lento para pantallas y luces. */
function useIdlePulse(duration = 2600, min = 0.55) {
  const v = useSharedValue(1);
  useEffect(() => {
    v.value = withRepeat(
      withSequence(
        withTiming(min, { duration, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [duration, min, v]);
  return useAnimatedStyle(() => ({ opacity: v.value }));
}

/* ── Setup de SoloQ: escritorio, monitor, silla, underglow ─────────────── */
function Rig({ lit, tone, stageOrder, upgrades }: ArtProps) {
  const screen = useIdlePulse(2200, 0.62);
  const t = tones[tone];
  const wide = stageOrder >= 3 || !!upgrades?.monitor;

  return (
    <View style={styles.fill}>
      {/* respaldo de la silla */}
      <View style={styles.rigChair}>
        <LinearGradient colors={[BODY_LIGHT, BODY_DARK]} style={styles.fill} />
        <View
          style={[
            styles.rigChairStripe,
            {
              backgroundColor: t.fg,
              opacity: upgrades?.chair ? 1 : lit ? 0.9 : 0.4,
              width: upgrades?.chair ? 3 : 2,
            },
          ]}
        />
      </View>

      {/* monitor */}
      <View style={[styles.rigMonitor, wide && styles.rigMonitorWide]}>
        <View style={styles.rigBezel}>
          <Animated.View style={[styles.fill, screen]}>
            <LinearGradient
              colors={[t.fg, '#1B4C6B', '#08131B']}
              locations={[0, 0.4, 1]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={[styles.fill, { opacity: lit ? 0.85 : 0.5 }]}
            />
          </Animated.View>
          <View style={styles.rigScanline} />
          <View style={[styles.rigScanline, styles.rigScanline2]} />
        </View>
        <View style={styles.rigStand} />
        {wide ? <View style={[styles.rigMonitor2, { borderColor: t.border }]} /> : null}
      </View>

      {/* escritorio */}
      <View style={styles.rigDesk}>
        <LinearGradient colors={[BODY_MID, '#0A0C11']} style={styles.fill} />
        <View style={styles.rigDeskEdge} />
        <View style={[styles.rigKeyboard, { borderColor: lit ? t.border : colors.line }]} />
        <View style={[styles.rigMouse, { backgroundColor: lit ? t.fg : colors.faint }]} />
      </View>

      {/* RGB bajo el escritorio */}
      <View
        style={[
          styles.rigGlow,
          {
            backgroundColor: t.fg,
            opacity: lit ? (upgrades?.glow ? 0.75 : 0.5) : 0.22,
            height: upgrades?.glow ? 5 : 3,
          },
        ]}
      />
      <View style={styles.rigLegL} />
      <View style={styles.rigLegR} />
    </View>
  );
}

/* ── Pizarra táctica: scrims ───────────────────────────────────────────── */
function Board({ lit, tone }: ArtProps) {
  const t = tones[tone];
  return (
    <View style={styles.fill}>
      <View style={[styles.boardFrame, { borderColor: lit ? t.border : colors.line }]}>
        <LinearGradient colors={['#12161E', '#0A0D12']} style={styles.fill} />
        {/* mapa esquemático */}
        <View style={[styles.boardDiag, { backgroundColor: t.fg, opacity: lit ? 0.55 : 0.25 }]} />
        <View style={[styles.boardLane, { top: '26%', backgroundColor: RIM }]} />
        <View style={[styles.boardLane, { top: '68%', backgroundColor: RIM }]} />
        <View style={[styles.boardDot, { left: '22%', top: '30%', backgroundColor: t.fg }]} />
        <View style={[styles.boardDot, { left: '54%', top: '54%', backgroundColor: colors.danger }]} />
        <View style={[styles.boardDot, { left: '74%', top: '24%', backgroundColor: t.fg }]} />
      </View>
      <View style={[styles.boardTray, { backgroundColor: BODY_LIGHT }]} />
    </View>
  );
}

/* ── Pantalla de VOD ───────────────────────────────────────────────────── */
function Tv({ lit, tone }: ArtProps) {
  const flick = useIdlePulse(1700, 0.7);
  const t = tones[tone];
  return (
    <View style={styles.fill}>
      <View style={[styles.tvFrame, { borderColor: lit ? t.border : colors.line }]}>
        <Animated.View style={[styles.fill, flick]}>
          <LinearGradient
            colors={['#0B1C22', t.fg, '#08111A']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fill, { opacity: lit ? 0.55 : 0.3 }]}
          />
        </Animated.View>
        {/* barra de reproducción: se lee como "VOD" al instante */}
        <View style={styles.tvBarTrack}>
          <View style={[styles.tvBarFill, { backgroundColor: t.fg }]} />
        </View>
        <View style={styles.tvNotch} />
      </View>
    </View>
  );
}

/* ── Cama: descanso ────────────────────────────────────────────────────── */
function Bed({ lit, tone, night }: ArtProps) {
  const t = tones[tone];
  return (
    <View style={styles.fill}>
      <View style={styles.bedFrame}>
        <LinearGradient colors={[BODY_MID, '#090B10']} style={styles.fill} />
      </View>
      <View style={styles.bedMattress}>
        <LinearGradient
          colors={[night ? '#242A38' : '#2A3140', '#141822']}
          style={styles.fill}
        />
        <View style={[styles.bedBlanket, { backgroundColor: t.fg, opacity: lit ? 0.3 : 0.14 }]} />
      </View>
      <View style={styles.bedPillow} />
      <View style={styles.bedHead}>
        <LinearGradient colors={[BODY_LIGHT, BODY_DARK]} style={styles.fill} />
      </View>
    </View>
  );
}

/* ── Cámara + aro de luz: contenido ────────────────────────────────────── */
function Cam({ lit, tone }: ArtProps) {
  const ring = useIdlePulse(2000, 0.45);
  const t = tones[tone];
  return (
    <View style={styles.fill}>
      <Animated.View
        style={[
          styles.camRing,
          ring,
          { borderColor: t.fg, shadowColor: t.fg, opacity: lit ? 1 : 0.45 },
        ]}
      />
      <View style={styles.camBody}>
        <LinearGradient colors={[BODY_LIGHT, BODY_DARK]} style={styles.fill} />
        <View style={[styles.camLens, { borderColor: lit ? t.fg : colors.faint }]}>
          <View style={[styles.camLensDot, { backgroundColor: lit ? t.fg : colors.faint }]} />
        </View>
        <View style={[styles.camRec, { backgroundColor: colors.danger, opacity: lit ? 1 : 0.4 }]} />
      </View>
      <View style={styles.camPole} />
      <View style={[styles.camLeg, styles.camLegL]} />
      <View style={[styles.camLeg, styles.camLegR]} />
    </View>
  );
}

/* ── Puerta: match day ─────────────────────────────────────────────────── */
function Door({ lit, tone }: ArtProps) {
  const spill = useIdlePulse(1500, 0.35);
  const t = tones[tone];
  return (
    <View style={styles.fill}>
      <View style={[styles.doorFrame, { borderColor: lit ? t.border : colors.lineStrong }]}>
        <LinearGradient colors={['#141821', '#0A0D13']} style={styles.fill} />
        <View style={styles.doorPanelTop} />
        <View style={styles.doorPanelBottom} />
        <View style={[styles.doorHandle, { backgroundColor: lit ? t.fg : colors.faint }]} />
      </View>
      {/* luz que se cuela por abajo: la arena está del otro lado */}
      <Animated.View
        style={[styles.doorSpill, spill, { backgroundColor: t.fg, opacity: lit ? 0.8 : 0.3 }]}
      />
      <View style={[styles.doorSign, { backgroundColor: lit ? t.fg : colors.line }]} />
    </View>
  );
}

/* ── Decoración ────────────────────────────────────────────────────────── */
function Window({ night, tone }: ArtProps) {
  const t = tones[tone];
  return (
    <View style={[styles.winFrame, { borderColor: colors.lineStrong }]}>
      <LinearGradient
        colors={night ? ['#0A1830', '#050A16'] : ['#16283A', '#0B1420']}
        style={styles.fill}
      />
      {/* skyline */}
      <View style={styles.winCity}>
        {[38, 62, 30, 74, 48, 84, 40].map((h, i) => (
          <View
            key={i}
            style={[
              styles.winTower,
              { height: `${h}%`, backgroundColor: '#05080F', opacity: 0.9 },
            ]}
          >
            {night && i % 2 === 0 ? (
              <View style={[styles.winLight, { backgroundColor: t.fg }]} />
            ) : null}
          </View>
        ))}
      </View>
      <View style={styles.winMullionV} />
      <View style={styles.winMullionH} />
    </View>
  );
}

function Poster({ tone }: ArtProps) {
  const t = tones[tone];
  return (
    <View style={[styles.poster, { borderColor: colors.line }]}>
      <LinearGradient colors={[t.bg, '#0A0D13']} style={styles.fill} />
      <View style={[styles.posterBar, { backgroundColor: t.fg, opacity: 0.5 }]} />
      <View style={[styles.posterBar, styles.posterBar2, { backgroundColor: t.fg, opacity: 0.3 }]} />
    </View>
  );
}

function Shelf({ tone }: ArtProps) {
  const t = tones[tone];
  return (
    <View style={styles.fill}>
      <View style={styles.shelfPlank} />
      <View style={styles.shelfRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.trophy}>
            <View style={[styles.trophyCup, { backgroundColor: t.fg, opacity: 0.75 - i * 0.18 }]} />
            <View style={styles.trophyBase} />
          </View>
        ))}
      </View>
    </View>
  );
}

function Banner({ tone }: ArtProps) {
  const t = tones[tone];
  return (
    <View style={styles.bannerWrap}>
      <View style={styles.bannerRod} />
      <View style={[styles.banner, { borderColor: t.border }]}>
        <LinearGradient colors={[t.bg, '#0A0D13']} style={styles.fill} />
        <View style={[styles.bannerStripe, { backgroundColor: t.fg }]} />
        <View style={styles.bannerNotch} />
      </View>
    </View>
  );
}

function Rug({ tone }: ArtProps) {
  const t = tones[tone];
  return (
    <View style={styles.rug}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
        style={styles.fill}
      />
      <View style={[styles.rugEdge, { borderColor: t.border }]} />
    </View>
  );
}

const ART: Record<PropId, (p: ArtProps) => React.ReactElement> = {
  rig: Rig,
  board: Board,
  tv: Tv,
  bed: Bed,
  cam: Cam,
  door: Door,
  window: Window,
  poster: Poster,
  shelf: Shelf,
  banner: Banner,
  rug: Rug,
};

export function PropArt({ id, ...rest }: ArtProps & { id: PropId }) {
  const Comp = ART[id];
  return Comp ? <Comp {...rest} /> : null;
}

const styles = StyleSheet.create({
  fill: { ...ABS },

  /* rig */
  rigChair: {
    position: 'absolute',
    left: '4%',
    bottom: '4%',
    width: '26%',
    height: '52%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RIM,
  },
  rigChairStripe: {
    position: 'absolute',
    left: '38%',
    top: '10%',
    bottom: '10%',
    width: 2,
  },
  rigMonitor: { position: 'absolute', left: '34%', bottom: '30%', width: '58%', height: '52%' },
  rigMonitorWide: { left: '30%', width: '66%' },
  rigBezel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#232935',
    backgroundColor: '#05070B',
    overflow: 'hidden',
  },
  rigMonitor2: {
    position: 'absolute',
    right: -14,
    bottom: 2,
    width: 12,
    height: '70%',
    borderWidth: 1,
    backgroundColor: '#070A0F',
    transform: [{ perspective: 200 }, { rotateY: '-28deg' }],
  },
  rigScanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '34%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  rigScanline2: { top: '66%' },
  rigStand: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -8,
    width: '14%',
    height: 8,
    backgroundColor: '#1A1F29',
  },
  rigDesk: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '18%',
    height: '14%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: RIM,
  },
  rigDeskEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  rigKeyboard: {
    position: 'absolute',
    left: '34%',
    top: '22%',
    width: '38%',
    height: '42%',
    borderWidth: 1,
    backgroundColor: '#0B0E14',
  },
  rigMouse: {
    position: 'absolute',
    left: '78%',
    top: '30%',
    width: 5,
    height: 7,
    borderRadius: 3,
  },
  rigGlow: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    bottom: '14%',
    height: 3,
  },
  rigLegL: {
    position: 'absolute',
    left: '10%',
    bottom: 0,
    width: 3,
    height: '18%',
    backgroundColor: '#12151D',
  },
  rigLegR: {
    position: 'absolute',
    right: '10%',
    bottom: 0,
    width: 3,
    height: '18%',
    backgroundColor: '#12151D',
  },

  /* board */
  boardFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: '12%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  boardDiag: {
    position: 'absolute',
    left: '-20%',
    right: '-20%',
    top: '48%',
    height: 1.5,
    transform: [{ rotate: '-24deg' }],
  },
  boardLane: { position: 'absolute', left: '10%', right: '10%', height: 1 },
  boardDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3 },
  boardTray: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    bottom: '4%',
    height: 3,
  },

  /* tv */
  tvFrame: {
    flex: 1,
    borderWidth: 1.5,
    backgroundColor: '#05070B',
    overflow: 'hidden',
  },
  tvBarTrack: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    bottom: '14%',
    height: 2.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tvBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '62%' },
  tvNotch: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -5,
    width: '22%',
    height: 4,
    backgroundColor: '#1A1F29',
  },

  /* bed */
  bedFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    overflow: 'hidden',
  },
  bedMattress: {
    position: 'absolute',
    left: '4%',
    right: 0,
    bottom: '28%',
    height: '48%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: RIM,
  },
  bedBlanket: {
    position: 'absolute',
    left: '46%',
    right: 0,
    top: 0,
    bottom: 0,
  },
  bedPillow: {
    position: 'absolute',
    left: '8%',
    bottom: '58%',
    width: '22%',
    height: '20%',
    backgroundColor: '#39414F',
    borderRadius: 3,
  },
  bedHead: {
    position: 'absolute',
    left: 0,
    bottom: '26%',
    width: '7%',
    height: '58%',
    overflow: 'hidden',
  },

  /* cam */
  camRing: {
    position: 'absolute',
    alignSelf: 'center',
    top: '2%',
    width: '82%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 3,
  },
  camBody: {
    position: 'absolute',
    alignSelf: 'center',
    top: '26%',
    width: '76%',
    height: '22%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RIM,
  },
  camLens: {
    position: 'absolute',
    alignSelf: 'center',
    top: '18%',
    width: '46%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camLensDot: { width: 3, height: 3, borderRadius: 2 },
  camRec: { position: 'absolute', right: 3, top: 3, width: 3, height: 3, borderRadius: 2 },
  camPole: {
    position: 'absolute',
    alignSelf: 'center',
    top: '48%',
    bottom: '16%',
    width: 3,
    backgroundColor: '#1A1F29',
  },
  camLeg: {
    position: 'absolute',
    bottom: 0,
    width: 2.5,
    height: '20%',
    backgroundColor: '#1A1F29',
  },
  camLegL: { left: '26%', transform: [{ rotate: '14deg' }] },
  camLegR: { right: '26%', transform: [{ rotate: '-14deg' }] },

  /* door */
  doorFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: '3%',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  doorPanelTop: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: '10%',
    height: '32%',
    borderWidth: 1,
    borderColor: RIM,
  },
  doorPanelBottom: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: '52%',
    height: '32%',
    borderWidth: 1,
    borderColor: RIM,
  },
  doorHandle: {
    position: 'absolute',
    left: '10%',
    top: '48%',
    width: '14%',
    height: 3,
    borderRadius: 2,
  },
  doorSpill: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    bottom: 0,
    height: 3,
  },
  doorSign: {
    position: 'absolute',
    alignSelf: 'center',
    top: '-6%',
    width: '46%',
    height: 3,
  },

  /* window */
  winFrame: { ...ABS, borderWidth: 1.5, overflow: 'hidden' },
  winCity: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 2,
  },
  winTower: { flex: 1 },
  winLight: {
    position: 'absolute',
    left: '30%',
    top: '18%',
    width: 1.5,
    height: 1.5,
    opacity: 0.9,
  },
  winMullionV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#0A0D13',
  },
  winMullionH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '44%',
    height: 1.5,
    backgroundColor: '#0A0D13',
  },

  /* poster */
  poster: { ...ABS, borderWidth: 1, overflow: 'hidden' },
  posterBar: {
    position: 'absolute',
    left: '-30%',
    right: '-30%',
    top: '34%',
    height: 3,
    transform: [{ rotate: '-32deg' }],
  },
  posterBar2: { top: '58%' },

  /* shelf */
  shelfPlank: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: '#232935',
  },
  shelfRow: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    bottom: 3,
    top: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  trophy: { alignItems: 'center' },
  trophyCup: { width: 6, height: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  trophyBase: { width: 9, height: 2, backgroundColor: '#2C3342' },

  /* banner */
  bannerWrap: { ...ABS },
  bannerRod: {
    position: 'absolute',
    left: '-6%',
    right: '-6%',
    top: 0,
    height: 2.5,
    backgroundColor: '#2C3342',
  },
  banner: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: 3,
    bottom: '8%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  bannerStripe: {
    position: 'absolute',
    left: '40%',
    top: 0,
    bottom: 0,
    width: '20%',
    opacity: 0.55,
  },
  bannerNotch: {
    position: 'absolute',
    left: '30%',
    right: '30%',
    bottom: -1,
    height: 8,
    backgroundColor: colors.bg,
    transform: [{ rotate: '45deg' }],
  },

  /* rug */
  rug: { ...ABS, overflow: 'hidden', borderRadius: 2 },
  rugEdge: { ...ABS, borderWidth: 1, opacity: 0.35 },
});
