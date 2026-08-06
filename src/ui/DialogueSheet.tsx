import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space, tones } from './theme';

export function DialogueSheet({
  speaker,
  line,
  onClose,
  actionLabel = 'Seguir',
}: {
  speaker: string;
  line: string;
  onClose: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sheet}>
      <Text style={styles.speaker}>{speaker.toUpperCase()}</Text>
      <Text style={styles.line}>{line}</Text>
      <Pressable onPress={onClose} style={styles.btn} accessibilityRole="button">
        <Text style={styles.btnText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginTop: space.sm,
    padding: space.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: tones.blue.border,
    borderRadius: radius.md,
    gap: 8,
  },
  speaker: {
    color: tones.blue.fg,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  line: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  btn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: tones.blue.fg,
  },
  btnText: {
    color: colors.onAccent,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});
