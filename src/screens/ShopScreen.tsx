import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canAfford, ownsItem, SHOP_CATALOG } from '../engine/economy';
import { useGameStore } from '../store/gameStore';
import { Button, Panel, Tag } from '../ui/components';
import { MobaBackdrop } from '../ui/MobaBackdrop';
import { colors, fonts, maxContentWidth, space, tones } from '../ui/theme';

export function ShopScreen() {
  const career = useGameStore((s) => s.career);
  const buyShopItem = useGameStore((s) => s.buyShopItem);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!career) return null;

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
            Lo que comprás se ve en tu pieza. Algunos ítems también rinden un poco más.
          </Text>

          {SHOP_CATALOG.map((item) => {
            const owned = ownsItem(career, item.id);
            const ok = canAfford(career, item.id);
            return (
              <Panel key={item.id} tone={owned ? 'accent' : 'muted'} style={styles.card}>
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
  card: { gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  itemName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  cost: { fontFamily: fonts.displaySemi, fontSize: 14 },
  itemBlurb: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  buy: { marginTop: 4 },
});
