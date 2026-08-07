import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  CareerState,
  ContentPack,
  RelationKey,
  SituationChoice,
  SituationVerb,
} from '../engine/types';
import { currentPlayableEvent } from '../engine/applyChoice';
import { ChoiceBoard } from '../ui/ChoiceBoard';
import { DialogueSheet } from '../ui/DialogueSheet';
import { EffectChips } from '../ui/effects';
import { TimingLane } from '../ui/TimingLane';
import { SortBoard } from '../ui/SortBoard';
import { colors, fonts, space, tones } from '../ui/theme';

/**
 * Escena de situación: foco en la decisión.
 * Sin mapa/sala debajo — el diorama del hub ya cumplió su rol.
 */
export function SituationScene({
  career,
  pack,
  onChoose,
  onMinigame,
  onSoftFail,
}: {
  career: CareerState;
  pack: ContentPack;
  onChoose: (choiceId: string) => void;
  onMinigame?: () => void;
  onSoftFail?: (notice: string) => void;
}) {
  const sit = career.currentSituation;
  const event = currentPlayableEvent(pack, career);

  const [activeVerb, setActiveVerb] = useState<{
    verb: SituationVerb;
    choice: SituationChoice;
  } | null>(null);
  const [talkPending, setTalkPending] = useState<SituationChoice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const resolve = useCallback(
    (choiceId: string) => {
      setActiveVerb(null);
      setTalkPending(null);
      onChoose(choiceId);
    },
    [onChoose]
  );

  const primaryActor = useMemo(
    () => (sit?.actors?.[0] ?? null) as RelationKey | null,
    [sit?.actors]
  );

  if (!event && !sit) {
    return <Text style={styles.missing}>Sin situación activa.</Text>;
  }

  const title = sit?.title ?? event!.title;
  const body = sit?.body ?? event!.body;
  const choices: SituationChoice[] =
    sit?.choices ??
    event!.choices.map((c) => ({
      id: c.id,
      label: c.label,
      hint: c.hint,
      verb: 'choice' as const,
      effect: c.effect,
    }));

  const accent = sit?.visual.accent ?? 'accent';
  const t = tones[accent];

  const handlePick = (id: string) => {
    const choice = choices.find((c) => c.id === id);
    if (!choice) return;
    if (choice.verb === 'timing' || choice.verb === 'sort') {
      setActiveVerb({ verb: choice.verb, choice });
      return;
    }
    if (choice.verb === 'talk') {
      setTalkPending(choice);
      return;
    }
    resolve(id);
  };

  if (activeVerb?.verb === 'timing') {
    return (
      <TimingLane
        label={activeVerb.choice.hint ?? activeVerb.choice.label}
        onDone={(ok) => {
          if (ok) resolve(activeVerb.choice.id);
          else {
            setActiveVerb(null);
            onSoftFail?.(
              'Fallaste el timing. La tensión baja un poco… y tu cabeza también (-2 mentality).'
            );
          }
        }}
      />
    );
  }

  if (activeVerb?.verb === 'sort') {
    return (
      <SortBoard
        title={activeVerb.choice.label}
        items={['Prioridad A', 'Prioridad B', 'Prioridad C', activeVerb.choice.hint ?? 'Cláusula']}
        onDone={() => resolve(activeVerb.choice.id)}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { borderColor: t.border }]}>
        <Text style={[styles.family, { color: t.fg }]}>
          {(sit?.family ?? 'evento').toUpperCase()}
        </Text>
        <Text style={styles.title}>{title}</Text>
        {(detailOpen || !sit) && <Text style={styles.body}>{body}</Text>}
        {sit?.actors?.length ? (
          <Text style={styles.actors}>
            Con: {sit.actors.map((a) => career.roster[a].name).join(', ')}
          </Text>
        ) : null}
        {!detailOpen && sit ? (
          <Text style={styles.hintTap} onPress={() => setDetailOpen(true)}>
            Leer el detalle →
          </Text>
        ) : null}
      </View>

      {talkPending ? (
        <DialogueSheet
          speaker={
            primaryActor
              ? career.roster[primaryActor].name
              : (career.roster.duo?.name ?? 'Voz')
          }
          line={talkPending.hint ?? talkPending.label}
          onClose={() => resolve(talkPending.id)}
          actionLabel="Confirmar"
        />
      ) : null}

      {event?.minigame || sit?.minigame ? (
        <View style={styles.skill}>
          <Text style={styles.skillTitle}>{(sit?.minigame ?? event?.minigame)?.title}</Text>
          <Text style={styles.skillBlurb}>{(sit?.minigame ?? event?.minigame)?.blurb}</Text>
          {onMinigame ? (
            <Text style={styles.skillLink} onPress={onMinigame}>
              Jugar skill check →
            </Text>
          ) : null}
        </View>
      ) : null}

      {!talkPending ? (
        <ChoiceBoard
          items={choices.map((c) => ({
            id: c.id,
            label: c.label,
            hint: c.hint,
            verb: c.verb,
            effect: c.effect,
          }))}
          onChoose={handlePick}
          renderEffects={(effect) => (
            <EffectChips effect={effect} statLabels={pack.statLabels} />
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  missing: { color: colors.muted, fontFamily: fonts.body },
  banner: {
    borderWidth: 1,
    padding: space.md,
    backgroundColor: colors.bgCard,
    gap: 6,
  },
  family: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  body: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  actors: {
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 4,
  },
  hintTap: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    marginTop: 4,
  },
  skill: {
    padding: space.md,
    borderWidth: 1,
    borderColor: tones.gold.border,
    backgroundColor: 'rgba(200,160,40,0.08)',
    gap: 4,
  },
  skillTitle: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14 },
  skillBlurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  skillLink: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 4 },
});
