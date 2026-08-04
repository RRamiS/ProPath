import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { springs } from './theme';

type FadeSlideProps = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fade + slide sin `entering` de Reanimated.
 * En web, `entering` saca nodos del flujo y solapa el layout.
 */
export function FadeSlide({ children, delay = 0, style }: FadeSlideProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, springs.soft));
  }, [progress, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [14, 0]) }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

export { Animated };
