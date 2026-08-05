import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors, fonts, radius, SKEW, space, UNSKEW } from '../ui/theme';
import type { MinigameGrade } from './applyResult';
import { gradeFromScore } from './applyResult';

type Props = {
  difficulty: 1 | 2 | 3;
  title: string;
  blurb: string;
  onDone: (grade: MinigameGrade) => void;
};

export function Header({
  kicker,
  title,
  blurb,
  howTo,
}: {
  kicker: string;
  title: string;
  blurb: string;
  howTo: string;
}) {
  return (
    <>
      <View style={styles.kickerTab}>
        <Text style={styles.kickerTabText}>{kicker}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.blurb}>{blurb}</Text>
      <View style={styles.howBox}>
        <View style={styles.howEdge} />
        <Text style={styles.howLabel}>CÓMO SE JUEGA</Text>
        <Text style={styles.howText}>{howTo}</Text>
      </View>
    </>
  );
}

export function ResultBlock({
  grade,
  onDone,
}: {
  grade: MinigameGrade;
  onDone: (g: MinigameGrade) => void;
}) {
  const label =
    grade === 'perfect'
      ? 'PERFECTO'
      : grade === 'good'
        ? 'BIEN'
        : grade === 'ok'
          ? 'PASABLE'
          : 'FALLASTE';
  // El color tiene que coincidir con el resultado: fallar no puede verse verde.
  const gradeColor =
    grade === 'perfect' || grade === 'good'
      ? colors.accent
      : grade === 'ok'
        ? colors.warn
        : colors.danger;

  return (
    <View style={styles.resultBox}>
      <Text style={[styles.resultGrade, { color: gradeColor }]}>{label}</Text>
      <Pressable style={[styles.cta, { backgroundColor: gradeColor }]} onPress={() => onDone(grade)}>
        <Text style={styles.ctaText}>Seguir carrera</Text>
      </Pressable>
    </View>
  );
}

/** Escapar un gank: tocá en la ventana verde para flashear el muro. */
export function ReactionMinigame({ difficulty, title, blurb, onDone }: Props) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'result'>('ready');
  const [grade, setGrade] = useState<MinigameGrade | null>(null);
  const pos = useSharedValue(0);
  const started = useRef(false);
  const speed = 0.55 + difficulty * 0.18;
  const zoneStart = 0.62;
  const zoneEnd = 0.78;

  useEffect(() => {
    if (phase !== 'running') return;
    started.current = true;
    pos.value = 0;
    pos.value = withTiming(1, { duration: 1100 / speed, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(finishMiss)();
    });
  }, [phase, pos, speed]);

  function finishMiss() {
    if (!started.current) return;
    started.current = false;
    setGrade('miss');
    setPhase('result');
  }

  function tap() {
    if (phase !== 'running') return;
    started.current = false;
    const v = pos.value;
    let score = 0;
    if (v >= zoneStart && v <= zoneEnd) {
      const mid = (zoneStart + zoneEnd) / 2;
      const dist = Math.abs(v - mid) / ((zoneEnd - zoneStart) / 2);
      score = 1 - dist * 0.35;
    } else if (v > zoneStart - 0.08 && v < zoneEnd + 0.08) {
      score = 0.5;
    } else {
      score = 0.15;
    }
    setGrade(gradeFromScore(score));
    setPhase('result');
  }

  const needle = useAnimatedStyle(() => ({
    left: `${pos.value * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      <Header
        kicker="MINIJUEGO · ESCAPE"
        title={title}
        blurb={blurb}
        howTo="Cuando la marca blanca entre en la zona verde, tocá el botón. Eso es flashear a tiempo (el teleport corto de escape)."
      />

      <View style={styles.laneHud}>
        <Text style={styles.laneTag}>JUNGLA EN RIVER</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.zone,
              { left: `${zoneStart * 100}%`, width: `${(zoneEnd - zoneStart) * 100}%` },
            ]}
          />
          {phase === 'running' ? <Animated.View style={[styles.needle, needle]} /> : null}
        </View>
        <View style={styles.trackLabels}>
          <Text style={styles.trackLab}>llega</Text>
          <Text style={[styles.trackLab, styles.trackLabHot]}>¡ahora!</Text>
          <Text style={styles.trackLab}>tarde</Text>
        </View>
      </View>

      {phase === 'ready' && (
        <Pressable style={styles.cta} onPress={() => setPhase('running')}>
          <Text style={styles.ctaText}>Empezar</Text>
        </Pressable>
      )}
      {phase === 'running' && (
        <Pressable style={[styles.cta, styles.ctaHot]} onPress={tap}>
          <Text style={styles.ctaText}>Flashear muro</Text>
          <Text style={styles.ctaSub}>escape corto · reposition</Text>
        </Pressable>
      )}
      {phase === 'result' && grade && <ResultBlock grade={grade} onDone={onDone} />}
    </View>
  );
}

type DraftProps = Props & { roleId: string };

const DRAFT_SETS = [
  {
    prompt: 'El rival arma un equipo de engage temprano. ¿Qué draft conviene?',
    options: [
      { id: 'peel', label: 'Protección + daño a largo plazo', score: 0.9 },
      { id: 'mirror', label: 'Pegarles engage contra engage', score: 0.55 },
      { id: 'greedy', label: 'Tres carries frágiles', score: 0.2 },
    ],
  },
  {
    prompt: 'Tu jungla quiere invadir temprano. El mid rival controla la oleada.',
    options: [
      { id: 'prio', label: 'Elegir picks que empujen la línea', score: 0.9 },
      { id: 'dive', label: 'All-in a nivel 3 sin visión', score: 0.45 },
      { id: 'ignore', label: 'Farmear solo de lado e ignorar', score: 0.35 },
    ],
  },
  {
    prompt: 'Banearon tu pick cómodo. Quedan segundos en el reloj.',
    options: [
      { id: 'flex', label: 'Pick flexible que abre el mapa', score: 0.88 },
      { id: 'comfort', label: 'Forzar un comfort débil en el matchup', score: 0.4 },
      { id: 'troll', label: 'Pick raro solo para tilt', score: 0.15 },
    ],
  },
];

/** Draft bajo presión de tiempo. */
export function DraftMinigame({ difficulty, title, blurb, onDone, roleId }: DraftProps) {
  const set = DRAFT_SETS[Math.abs(roleId.length + difficulty) % DRAFT_SETS.length]!;
  const [left, setLeft] = useState(7 + (3 - difficulty));
  const [done, setDone] = useState(false);
  const [grade, setGrade] = useState<MinigameGrade | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    if (done) return;
    if (left <= 0) {
      locked.current = true;
      setGrade('miss');
      setDone(true);
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done]);

  function pick(score: number) {
    if (locked.current || done) return;
    locked.current = true;
    const timeBonus = left / (7 + (3 - difficulty));
    setGrade(gradeFromScore(score * 0.75 + timeBonus * 0.25));
    setDone(true);
  }

  return (
    <View style={styles.wrap}>
      <Header
        kicker="MINIJUEGO · DRAFT"
        title={title}
        blurb={blurb}
        howTo="Leé la situación y elegí UNA opción antes de que se acabe el tiempo. La mejor respuesta + velocidad = mejor nota."
      />
      <Text style={styles.timer}>{done ? '—' : `${left}s`}</Text>
      <Text style={styles.prompt}>{set.prompt}</Text>
      {!done &&
        set.options.map((o) => (
          <Pressable key={o.id} style={styles.option} onPress={() => pick(o.score)}>
            <Text style={styles.optionText}>{o.label}</Text>
          </Pressable>
        ))}
      {done && grade && <ResultBlock grade={grade} onDone={onDone} />}
    </View>
  );
}

/** Last-hit de oleada: tocá cuando el minion está listo. */
export function FarmMinigame({ difficulty, title, blurb, onDone }: Props) {
  const rounds = 5;
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [grade, setGrade] = useState<MinigameGrade | null>(null);
  const windowMs = 560 - difficulty * 70;
  const scale = useSharedValue(0.4);

  useEffect(() => {
    if (finished || round >= rounds) return;
    setActive(false);
    scale.value = 0.4;
    const delay = 450 + Math.random() * (650 - difficulty * 80);
    const start = setTimeout(() => {
      setActive(true);
      scale.value = withTiming(1.12, { duration: windowMs, easing: Easing.out(Easing.quad) });
      const end = setTimeout(() => {
        setActive(false);
        setRound((r) => r + 1);
      }, windowMs);
      return () => clearTimeout(end);
    }, delay);
    return () => clearTimeout(start);
  }, [round, finished, difficulty, scale, windowMs]);

  useEffect(() => {
    if (round < rounds || finished) return;
    setGrade(gradeFromScore(hits / rounds));
    setFinished(true);
  }, [round, rounds, hits, finished]);

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: active ? 1 : 0.28,
  }));

  function hit() {
    if (!active || finished) return;
    setHits((h) => h + 1);
    setActive(false);
    setRound((r) => r + 1);
  }

  return (
    <View style={styles.wrap}>
      <Header
        kicker="MINIJUEGO · FARM"
        title={title}
        blurb={blurb}
        howTo="Cuando el círculo brille, tocá para last-hittear el minion. Si tocás tarde o temprano, se pierde el oro."
      />
      <Text style={styles.hint}>
        Acertados {hits}/{rounds} · minion {Math.min(round + 1, rounds)}/{rounds}
      </Text>
      <Pressable onPress={hit} style={styles.farmHit}>
        <Animated.View style={[styles.orb, pulse]} />
        <Text style={styles.farmLabel}>{active ? '¡YA!' : 'esperá'}</Text>
      </Pressable>
      {finished && grade && <ResultBlock grade={grade} onDone={onDone} />}
    </View>
  );
}

/** Visión: tapear puntos de niebla antes de que se cierren. */
export function VisionMinigame({ difficulty, title, blurb, onDone }: Props) {
  const total = 4 + difficulty;
  const lifetime = 1400 - difficulty * 180;
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const [done, setDone] = useState(false);
  const [grade, setGrade] = useState<MinigameGrade | null>(null);
  const armed = useRef(false);

  useEffect(() => {
    if (done || idx >= total) return;
    armed.current = false;
    setSpot(null);
    const spawn = setTimeout(() => {
      setSpot({
        x: 12 + Math.random() * 70,
        y: 18 + Math.random() * 55,
      });
      armed.current = true;
      const expire = setTimeout(() => {
        armed.current = false;
        setSpot(null);
        setIdx((i) => i + 1);
      }, lifetime);
      return () => clearTimeout(expire);
    }, 350);
    return () => clearTimeout(spawn);
  }, [idx, done, total, lifetime]);

  useEffect(() => {
    if (idx < total || done) return;
    setGrade(gradeFromScore(hits / total));
    setDone(true);
  }, [idx, total, hits, done]);

  function tapSpot() {
    if (!armed.current || !spot || done) return;
    armed.current = false;
    setHits((h) => h + 1);
    setSpot(null);
    setIdx((i) => i + 1);
  }

  return (
    <View style={styles.wrap}>
      <Header
        kicker="MINIJUEGO · VISIÓN"
        title={title}
        blurb={blurb}
        howTo="Aparecen huecos en la niebla. Tocá cada uno rápido para poner visión (ward). Si se apaga solo, perdés ese punto."
      />
      <Text style={styles.hint}>
        Wards {hits}/{total} · punto {Math.min(idx + 1, total)}/{total}
      </Text>
      <View style={styles.fogMap}>
        <Text style={styles.fogLabel}>MAPA · NIEBLA</Text>
        {spot && (
          <Pressable
            onPress={tapSpot}
            style={[styles.fogSpot, { left: `${spot.x}%`, top: `${spot.y}%` }]}
          >
            <Text style={styles.fogSpotText}>WARD</Text>
          </Pressable>
        )}
      </View>
      {done && grade && <ResultBlock grade={grade} onDone={onDone} />}
    </View>
  );
}

const FOCUS_ROUNDS = [
  { call: 'Foco al carry de atrás', correct: 'adc', options: ['tanque', 'adc', 'support'] },
  { call: 'Primero el engage del rival', correct: 'engage', options: ['adc', 'engage', 'jungla'] },
  { call: 'Limpien al mago de control', correct: 'mago', options: ['mago', 'tanque', 'adc'] },
  { call: 'No peguén al tanque primero', correct: 'adc', options: ['tanque', 'adc', 'support'] },
];

/** Teamfight: elegí el foco correcto según el call. */
export function FocusMinigame({ difficulty, title, blurb, onDone }: Props) {
  const rounds = FOCUS_ROUNDS.slice(0, 2 + difficulty);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(4);
  const [done, setDone] = useState(false);
  const [grade, setGrade] = useState<MinigameGrade | null>(null);
  const locked = useRef(false);
  const current = rounds[i];

  const shuffled = useMemo(() => {
    if (!current) return [];
    return [...current.options].sort(() => Math.random() - 0.5);
  }, [current, i]);

  useEffect(() => {
    if (done || !current) return;
    locked.current = false;
    setLeft(5 - difficulty);
  }, [i, done, current, difficulty]);

  useEffect(() => {
    if (done || !current) return;
    if (left <= 0) {
      locked.current = true;
      setI((n) => n + 1);
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done, current]);

  useEffect(() => {
    if (i < rounds.length || done) return;
    setGrade(gradeFromScore(hits / rounds.length));
    setDone(true);
  }, [i, rounds.length, hits, done]);

  function pick(id: string) {
    if (locked.current || done || !current) return;
    locked.current = true;
    if (id === current.correct) setHits((h) => h + 1);
    setI((n) => n + 1);
  }

  if (done && grade) {
    return (
      <View style={styles.wrap}>
        <Header
          kicker="MINIJUEGO · TEAMFIGHT"
          title={title}
          blurb={blurb}
          howTo="Escuchá el call y tocá el objetivo correcto."
        />
        <ResultBlock grade={grade} onDone={onDone} />
      </View>
    );
  }

  if (!current) return null;

  return (
    <View style={styles.wrap}>
      <Header
        kicker="MINIJUEGO · TEAMFIGHT"
        title={title}
        blurb={blurb}
        howTo="Sale un call de pelea. Tocá a quién hay que pegarle primero. El tanque suele ser señuelo."
      />
      <Text style={styles.timer}>{left}s</Text>
      <Text style={styles.prompt}>{current.call}</Text>
      <Text style={styles.hint}>
        Ronda {i + 1}/{rounds.length} · aciertos {hits}
      </Text>
      {shuffled.map((id) => (
        <Pressable key={id} style={styles.option} onPress={() => pick(id)}>
          <Text style={styles.optionText}>{id.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl },
  kickerTab: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
    transform: [{ skewX: SKEW }],
  },
  kickerTabText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    transform: [{ skewX: UNSKEW }],
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  blurb: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  howBox: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 12,
    paddingLeft: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
  },
  howEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.accent,
  },
  howLabel: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  howText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  track: {
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
    marginBottom: 4,
    justifyContent: 'center',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(204,255,51,0.3)',
  },
  needle: {
    position: 'absolute',
    width: 4,
    top: 0,
    bottom: 0,
    marginLeft: -2,
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  hint: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginBottom: 12,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaHot: { backgroundColor: colors.blue },
  ctaText: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ctaSub: {
    marginTop: 4,
    color: 'rgba(11,18,0,0.7)',
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  laneHud: { marginBottom: 8 },
  laneTag: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  trackLab: {
    color: colors.faint,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  trackLabHot: { color: colors.accent },
  resultBox: { marginTop: 12 },
  resultGrade: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 12,
  },
  timer: {
    color: colors.danger,
    fontFamily: fonts.display,
    fontSize: 34,
    marginBottom: 8,
  },
  prompt: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  option: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  optionText: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  farmHit: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  farmLabel: {
    position: 'absolute',
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  fogMap: {
    height: 260,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fogLabel: {
    position: 'absolute',
    top: 10,
    left: 12,
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  fogSpot: {
    position: 'absolute',
    width: 64,
    height: 64,
    marginLeft: -32,
    marginTop: -32,
    borderRadius: 999,
    backgroundColor: 'rgba(47,230,224,0.22)',
    borderWidth: 2,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fogSpotText: {
    color: colors.blue,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
});
