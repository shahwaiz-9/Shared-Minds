import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Custom hook to manage the logo spinning animation loops.
 * Toggles spinning based on the loading state.
 */
export function useSpinAnimation(isSpinning: boolean) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isSpinning) {
      // Start loop
      spinValue.setValue(0);
      animationRef.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animationRef.current.start();
    } else {
      // Stop loop gracefully
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      // Return back to 0
      Animated.timing(spinValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isSpinning, spinValue]);

  // Map 0 -> 1 value to degrees rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return spin;
}
