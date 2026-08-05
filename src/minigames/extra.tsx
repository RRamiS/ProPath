import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radius, space, SKEW, UNSKEW } from '../ui/theme';
import { gradeFromScore, type MinigameGrade } from './applyResult';
import { Header, ResultBlock } from './Minigames';

type Props = {
  difficulty: 1 | 2 | 3;
  title: string;
  blurb: string;
  onDone: (grade: MinigameGrade) => void;
};

function RoundPips({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.pip, i < current && styles.pipDone]} />
      ))}
    </View>
  );
}

/* ------------------------------------------------------- combo (Simon) */

const ABILITIES = [
  { key: 'Q', color: colors.accent },
  { key: 'W', color: colors.blue },
  { key: 'E', color: colors.violet },
  { key: 'R', color: colors.gold },
];

/** Secuencia de habilidades: mirala y repetila sin fallar. */
export function ComboMinigame({ difficulty, title, blurb, onDone }: Props) {
  const length = 3 + difficulty;
  const [sequence] = useState(() =>
    Array.from({ length }, () => Math.floor(Math.random() * ABILITIES.length))
  );
  const [phase, setPhase] = useState<'show' | 'input' | 'result'>('show');
  const [showIndex, setShowIndex] = useState(0);
  const [input, setInput] = useState<number[]>([]);
  const [grade, setGrade] = useState<MinigameGrade>('miss');

  const stepMs = 620 - difficulty * 70;

  useEffect(() => {
    if (phase !== 'show') return;
    if (showIndex >= sequence.length) {
      const id = setTimeout(() => setPhase('input'), 350);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setShowIndex((i) => i + 1), stepMs);
    return () => clearTimeout(id);
  }, [phase, showIndex, sequence.length, stepMs]);

  const press = (i: number) => {
    if (phase !== 'input') return;
    const next = [...input, i];
    setInput(next);

    if (next.length === sequence.length) {
      const hits = next.filter((v, idx) => v === sequence[idx]).length;
      setGrade(gradeFromScore(hits / sequence.length));
      setPhase('result');
    }
  };

  const lit = phase === 'show' ? sequence[showIndex] : undefined;

  return (
    <View style={styles.wrap}>
      <Header
        kicker="COMBO"
        title={title}
        blurb={blurb}
        howTo="Mirá la secuencia de habilidades y repetila en el mismo orden."
      />

      <View style={styles.statusRow}>
        <Text style={styles.status}>
          {phase === 'show'
            ? 'MEMORIZÁ'
            : phase === 'input'
              ? `TU TURNO · ${input.length}/${sequence.length}`
              : 'LISTO'}
        </Text>
        <RoundPips total={sequence.length} current={phase === 'show' ? showIndex : input.length} />
      </View>

      <View style={styles.abilityRow}>
        {ABILITIES.map((a, i) => {
          const active = lit === i;
          return (
            <Pressable
              key={a.key}
              onPress={() => press(i)}
              disabled={phase !== 'input'}
              style={[
                styles.ability,
                { borderColor: a.color },
                active && { backgroundColor: a.color },
                phase === 'show' && !active && styles.abilityDim,
              ]}
            >
              <Text style={[styles.abilityKey, { color: active ? colors.bg : a.color }]}>
                {a.key}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {phase === 'result' ? <ResultBlock grade={grade} onDone={onDone} /> : null}
    </View>
  );
}

/* ------------------------------------------------------- dodge (grid) */

/** Zona telegrafiada: movete a una celda segura antes del impacto. */
export function DodgeMinigame({ difficulty, title, blurb, onDone }: Props) {
  const rounds = 4;
  const warnMs = 1000 - difficulty * 160;

  const [round, setRound] = useState(0);
  const [danger, setDanger] = useState<number[]>([]);
  const [pos, setPos] = useState(4);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<'none' | 'safe' | 'hit'>('none');
  const [phase, setPhase] = useState<'play' | 'result'>('play');
  const posRef = useRef(4);

  const rollDanger = useCallback(() => {
    // Máximo 5 de 9 celdas: siempre hay salida.
    const count = Math.min(5, 3 + difficulty);
    const cells = new Set<number>();
    while (cells.size < count) cells.add(Math.floor(Math.random() * 9));
    return [...cells];
  }, [difficulty]);

  useEffect(() => {
    if (phase !== 'play') return;
    if (round >= rounds) {
      setPhase('result');
      return;
    }

    const zone = rollDanger();
    setDanger(zone);
    setFlash('none');

    let nextId: ReturnType<typeof setTimeout>;
    const blastId = setTimeout(() => {
      const safe = !zone.includes(posRef.current);
      setFlash(safe ? 'safe' : 'hit');
      setHits((h) => h + (safe ? 1 : 0));
      nextId = setTimeout(() => setRound((r) => r + 1), 480);
    }, warnMs);

    return () => {
      clearTimeout(blastId);
      clearTimeout(nextId);
    };
  }, [round, phase, rollDanger, warnMs]);

  const move = (i: number) => {
    if (phase !== 'play' || flash !== 'none') return;
    posRef.current = i;
    setPos(i);
  };

  return (
    <View style={styles.wrap}>
      <Header
        kicker="POSICIONAMIENTO"
        title={title}
        blurb={blurb}
        howTo="Las celdas rojas van a explotar. Tocá una celda segura antes del impacto."
      />

      <View style={styles.statusRow}>
        <Text style={styles.status}>
          {flash === 'hit' ? 'TE PEGÓ' : flash === 'safe' ? 'ESQUIVASTE' : 'REPOSICIONATE'}
        </Text>
        <RoundPips total={rounds} current={round} />
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, i) => {
          const isDanger = danger.includes(i);
          const isMe = pos === i;
          return (
            <Pressable
              key={i}
              onPress={() => move(i)}
              style={[
                styles.cell,
                isDanger && styles.cellDanger,
                flash !== 'none' && isDanger && styles.cellBlast,
              ]}
            >
              {isMe ? (
                <View
                  style={[
                    styles.token,
                    flash === 'hit' && isDanger && styles.tokenHit,
                    flash === 'safe' && styles.tokenSafe,
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {phase === 'result' ? (
        <ResultBlock grade={gradeFromScore(hits / rounds)} onDone={onDone} />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------ clutch (duel) */

/** 1v1: dos marcadores se cruzan, tocá cuando estén alineados. */
export function ClutchMinigame({ difficulty, title, blurb, onDone }: Props) {
  const rounds = 3;
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<'play' | 'result'>('play');
  const t = useSharedValue(0);
  const live = useRef(true);

  const duration = 1500 - difficulty * 260;

  useEffect(() => {
    if (phase !== 'play' || round >= rounds) return;
    live.current = true;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, true);
  }, [round, phase, t, duration]);

  const registerScore = useCallback(
    (s: number) => {
      setScores((prev) => {
        const next = [...prev, s];
        if (next.length >= rounds) setPhase('result');
        return next;
      });
      setRound((r) => r + 1);
    },
    [rounds]
  );

  const tap = () => {
    if (phase !== 'play' || !live.current) return;
    live.current = false;
    const v = t.value;
    const dist = Math.abs(v - 0.5) * 2;
    registerScore(Math.max(0, 1 - dist * 1.6));
  };

  const meStyle = useAnimatedStyle(() => ({
    left: `${interpolate(t.value, [0, 1], [4, 88])}%`,
  }));

  const themStyle = useAnimatedStyle(() => ({
    left: `${interpolate(t.value, [0, 1], [88, 4])}%`,
  }));

  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return (
    <View style={styles.wrap}>
      <Header
        kicker="CLUTCH 1V1"
        title={title}
        blurb={blurb}
        howTo="Los dos marcadores se cruzan en el centro. Tocá justo cuando se superponen."
      />

      <View style={styles.statusRow}>
        <Text style={styles.status}>RONDA {Math.min(round + 1, rounds)}/{rounds}</Text>
        <RoundPips total={rounds} current={round} />
      </View>

      <Pressable onPress={tap} style={styles.duelBoard}>
        <View style={styles.duelCenter} />
        <Animated.View style={[styles.duelMarker, styles.duelMe, meStyle]} />
        <Animated.View style={[styles.duelMarker, styles.duelThem, themStyle]} />
        <Text style={styles.duelHint}>TOCÁ EN EL CRUCE</Text>
      </Pressable>

      <View style={styles.scoreStrip}>
        {scores.map((s, i) => (
          <Text key={i} style={styles.scoreStripItem}>
            R{i + 1} {Math.round(s * 100)}%
          </Text>
        ))}
      </View>

      {phase === 'result' ? <ResultBlock grade={gradeFromScore(avg)} onDone={onDone} /> : null}
    </View>
  );
}

/* --------------------------------------------------- interview (press) */

type Question = { q: string; options: { text: string; quality: number }[] };

const QUESTIONS: Question[] = [
  {
    q: '“Perdieron el mapa 1 feo. ¿Qué pasó?”',
    options: [
      { text: 'Leímos mal el draft, es corregible', quality: 1 },
      { text: 'Preguntale al jungla', quality: 0 },
      { text: 'El servidor estaba raro', quality: 0.25 },
    ],
  },
  {
    q: '“Se habla de una oferta de afuera. ¿Confirmás?”',
    options: [
      { text: 'Hoy estoy acá y doy todo acá', quality: 1 },
      { text: 'No puedo hablar de eso', quality: 0.6 },
      { text: 'Si pagan, me voy mañana', quality: 0.1 },
    ],
  },
  {
    q: '“Tu rival dijo que sos sobrevalorado.”',
    options: [
      { text: 'Lo respondo en el server', quality: 0.9 },
      { text: 'Que siga hablando, yo entreno', quality: 0.8 },
      { text: 'Es un fraude y lo sabe', quality: 0.2 },
    ],
  },
];

/** Conferencia de prensa: contestá bien y rápido. */
export function InterviewMinigame({ difficulty, title, blurb, onDone }: Props) {
  const limit = 7 - difficulty;
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [left, setLeft] = useState(limit);
  const [phase, setPhase] = useState<'play' | 'result'>('play');

  const answer = useCallback(
    (quality: number) => {
      setTotal((t) => t + quality);
      setIndex((i) => {
        if (i + 1 >= QUESTIONS.length) {
          setPhase('result');
          return i;
        }
        return i + 1;
      });
    },
    []
  );

  useEffect(() => {
    if (phase !== 'play') return;
    setLeft(limit);

    // Quedarse callado también es una respuesta, y de las malas.
    const timeout = setTimeout(() => answer(0.15), limit * 1000);
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(tick);
    };
  }, [index, phase, limit, answer]);

  const question = QUESTIONS[index]!;

  return (
    <View style={styles.wrap}>
      <Header
        kicker="SALA DE PRENSA"
        title={title}
        blurb={blurb}
        howTo="Tenés pocos segundos por pregunta. Lo que decís mueve tu reputación."
      />

      {phase === 'play' ? (
        <>
          <View style={styles.statusRow}>
            <Text style={[styles.status, left <= 2 && { color: colors.danger }]}>
              {left}s
            </Text>
            <RoundPips total={QUESTIONS.length} current={index} />
          </View>

          <View style={styles.micBar}>
            <View style={styles.micTag}>
              <Text style={styles.micTagText}>PRESS</Text>
            </View>
            <Text style={styles.question}>{question.q}</Text>
          </View>

          {question.options.map((o) => (
            <Pressable key={o.text} onPress={() => answer(o.quality)} style={styles.answer}>
              <Text style={styles.answerText}>{o.text}</Text>
            </Pressable>
          ))}
        </>
      ) : (
        <ResultBlock grade={gradeFromScore(total / QUESTIONS.length)} onDone={onDone} />
      )}
    </View>
  );
}

/* ------------------------------------------------ negotiation (deal) */

/** Contrato: parar la aguja en la franja justa — o arriesgar por más. */
export function NegotiationMinigame({ difficulty, title, blurb, onDone }: Props) {
  const [phase, setPhase] = useState<'play' | 'result'>('play');
  const [score, setScore] = useState(0);
  const [stopped, setStopped] = useState<number | null>(null);
  const t = useSharedValue(0);
  const live = useRef(true);

  const duration = 1700 - difficulty * 300;

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t, duration]);

  const finish = useCallback((v: number) => {
    setStopped(v);
    // Franja justa 0.45–0.72 · franja codiciosa 0.86–0.95
    if (v >= 0.86 && v <= 0.95) setScore(1);
    else if (v >= 0.45 && v <= 0.72) setScore(0.75);
    else if (v > 0.95) setScore(0.1);
    else setScore(0.3);
    setPhase('result');
  }, []);

  const tap = () => {
    if (!live.current) return;
    live.current = false;
    const v = t.value;
    // Asignar corta el withRepeat y congela la aguja donde la pararon.
    t.value = v;
    finish(v);
  };

  const needle = useAnimatedStyle(() => ({
    left: `${t.value * 96}%`,
  }));

  return (
    <View style={styles.wrap}>
      <Header
        kicker="NEGOCIACIÓN"
        title={title}
        blurb={blurb}
        howTo="Verde = trato justo y seguro. Dorado = pedís de más: paga el doble o te quedás sin nada."
      />

      <Pressable onPress={tap} style={styles.dealBoard}>
        <View style={styles.dealTrack}>
          <View style={[styles.dealZone, styles.dealFair]} />
          <View style={[styles.dealZone, styles.dealGreedy]} />
          <Animated.View style={[styles.dealNeedle, needle]} />
        </View>
        <View style={styles.dealLabels}>
          <Text style={styles.dealLabel}>LOWBALL</Text>
          <Text style={[styles.dealLabel, { color: colors.accent }]}>JUSTO</Text>
          <Text style={[styles.dealLabel, { color: colors.gold }]}>AMBICIOSO</Text>
        </View>
        <Text style={styles.duelHint}>TOCÁ PARA FIRMAR</Text>
      </Pressable>

      {phase === 'result' ? (
        <>
          <Text style={styles.dealResult}>
            {score >= 1
              ? 'Firmaste por arriba del mercado.'
              : score >= 0.75
                ? 'Contrato sólido, sin dramas.'
                : stopped !== null && stopped > 0.95
                  ? 'Pediste demasiado: la org se levantó de la mesa.'
                  : 'Te subvaloraste.'}
          </Text>
          <ResultBlock grade={gradeFromScore(score)} onDone={onDone} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.lg },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  status: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  pips: { flexDirection: 'row', gap: 4 },
  pip: {
    width: 14,
    height: 4,
    backgroundColor: colors.lineStrong,
  },
  pipDone: { backgroundColor: colors.accent },

  /* combo */
  abilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  ability: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  abilityDim: { opacity: 0.5 },
  abilityKey: {
    fontFamily: fonts.display,
    fontSize: 22,
  },

  /* dodge */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  cell: {
    width: '31.5%',
    aspectRatio: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDanger: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255,59,92,0.16)',
  },
  cellBlast: { backgroundColor: 'rgba(255,59,92,0.5)' },
  token: {
    width: '46%',
    height: '46%',
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  tokenHit: { backgroundColor: colors.danger },
  tokenSafe: { backgroundColor: colors.blue },

  /* clutch */
  duelBoard: {
    height: 130,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  duelCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  duelMarker: {
    position: 'absolute',
    width: 16,
    height: 46,
    borderRadius: radius.sm,
  },
  duelMe: { backgroundColor: colors.accent, top: 22 },
  duelThem: { backgroundColor: colors.danger, bottom: 22 },
  duelHint: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  scoreStrip: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  scoreStripItem: {
    color: colors.muted,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },

  /* interview */
  micBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  micTag: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ skewX: SKEW }],
  },
  micTagText: {
    color: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    transform: [{ skewX: UNSKEW }],
  },
  question: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    lineHeight: 23,
  },
  answer: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 9,
  },
  answerText: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },

  /* negotiation */
  dealBoard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    padding: 16,
    paddingBottom: 24,
    marginBottom: 14,
  },
  dealTrack: {
    height: 34,
    backgroundColor: colors.bgSunken,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  dealZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  dealFair: {
    left: '45%',
    width: '27%',
    backgroundColor: 'rgba(204,255,51,0.28)',
  },
  dealGreedy: {
    left: '86%',
    width: '9%',
    backgroundColor: 'rgba(255,194,75,0.4)',
  },
  dealNeedle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.white,
  },
  dealLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dealLabel: {
    color: colors.faint,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  dealResult: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
});
