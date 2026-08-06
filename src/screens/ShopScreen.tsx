import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canAfford, hasVisual, ownsItem, SHOP_CATALOG, type ShopItem } from '../engine/economy';
import { Image } from 'expo-image';
import { IsoRoom } from '../room/IsoRoom';
import { venueLayout } from '../room/layout';
import { roomPropArt } from '../room/roomArt';
import { RigUpgrades, type RigUpgradeFlags } from '../room/RigUpgrades';
import { useGameStore } from '../store/gameStore';
import { Button, Panel, Tag } from '../ui/components';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, maxContentWidth, space, tones } from '../ui/theme';

/** Vista previa: la pieza real con el setup aplicado / ítem en foco. */
function RoomPreview({
  upgrades,
  focusVisual,
}: {
  upgrades: RigUpgradeFlags & { banner?: boolean };
  focusVisual: ShopItem['visual'];
}) {
  const layout = venueLayout('home');
  const focusProp = focusVisual === 'banner' ? 'banner' : 'rig';
  return (
    <IsoRoom venueId="home" dim>
      {layout.all.map((spec) => {
        const source = roomPropArt('home', spec.id);
        if (!source) return null;
        if (spec.id === 'banner' && !upgrades.banner && focusVisual !== 'banner') return null;
        const on = spec.id === focusProp;
        return (
          <View
            key={spec.id}
            pointerEvents="none"
            style={[
              styles.previewProp,
              {
                left: `${spec.left}%`,
                top: `${spec.top}%`,
                width: `${spec.width}%`,
                height: `${spec.height}%`,
                zIndex: spec.z,
              },
            ]}
          >
            <Image
              source={source}
              style={{ width: '100%', height: '100%', opacity: on ? 1 : 0.42 }}
              contentFit="fill"
            />
            {spec.id === 'rig' ? (
              <RigUpgrades
                monitor={upgrades.monitor || focusVisual === 'monitor'}
                chair={upgrades.chair || focusVisual === 'chair'}
                glow={upgrades.glow || focusVisual === 'glow'}
                desk={upgrades.desk || focusVisual === 'desk'}
              />
            ) : null}
            {on ? (
              <Image
                source={source}
                style={styles.previewGlow}
                contentFit="fill"
                tintColor={tones.gold.fg}
              />
            ) : null}
          </View>
        );
      })}
    </IsoRoom>
  );
}

export function ShopScreen() {
  const career = useGameStore((s) => s.career);
  const buyShopItem = useGameStore((s) => s.buyShopItem);
  const setScreen = useGameStore((s) => s.setScreen);
  const [preview, setPreview] = useState<ShopItem | null>(null);

  if (!career) return null;

  const focus = preview ?? SHOP_CATALOG.find((i) => !ownsItem(career, i.id)) ?? SHOP_CATALOG[0]!;
  const upgrades = {
    monitor: hasVisual(career, 'monitor'),
    chair: hasVisual(career, 'chair'),
    glow: hasVisual(career, 'glow'),
    banner: hasVisual(career, 'banner'),
    desk: hasVisual(career, 'desk'),
  };

  return (
    <View style={styles.root}>
      <MobaBackdrop intensity="play" stageId={career.stageId} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            <Text style={styles.title}>SETUP SHOP</Text>
            <Tag label={`$${career.cash}`} tone="gold" solid />
          </View>
          <Text style={styles.blurb}>
            Lo que comprás se ve en el setup: monitores, silla, RGB, teclado y banner. Tocá un ítem
            para previsualizarlo en tu pieza.
          </Text>

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>PREVIEW · PIEZA · {focus.label}</Text>
            <View style={styles.previewStage}>
              <RoomPreview upgrades={upgrades} focusVisual={focus.visual} />
            </View>
          </View>

          {SHOP_CATALOG.map((item) => {
            const owned = ownsItem(career, item.id);
            const ok = canAfford(career, item.id);
            const on = preview?.id === item.id;
            return (
              <Pressable key={item.id} onPress={() => setPreview(item)}>
                <Panel tone={owned ? 'accent' : on ? 'gold' : 'muted'} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.itemName}>{item.label}</Text>
                    <Text style={[styles.cost, { color: owned ? colors.accent : colors.gold }]}>
                      {owned ? 'OWNED' : `$${item.cost}`}
                    </Text>
                  </View>
                  <Text style={styles.itemBlurb}>{item.blurb}</Text>
                  {!owned ? (
                    <Button
                      label={ok ? 'Comprar' : 'Sin fondos'}
                      tone="gold"
                      disabled={!ok}
                      onPress={() => buyShopItem(item.id)}
                      style={styles.buy}
                    />
                  ) : null}
                </Panel>
              </Pressable>
            );
          })}

          <Button label="Volver a la sala" variant="ghost" onPress={() => setScreen('weekHub')} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: {
    padding: space.lg,
    paddingBottom: space.xxl,
    maxWidth: maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -1,
  },
  blurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  preview: {
    borderWidth: 1,
    borderColor: tones.gold.border,
    backgroundColor: colors.bgCard,
    padding: 12,
    gap: 8,
  },
  previewLabel: {
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  previewStage: {
    height: 168,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.line,
  },
  previewProp: { position: 'absolute' },
  previewGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  card: { gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  cost: { fontFamily: fonts.bodyBold, fontSize: 13 },
  itemBlurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  buy: { alignSelf: 'flex-start' },
});
