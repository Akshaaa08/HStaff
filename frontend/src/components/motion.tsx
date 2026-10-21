import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import {Animated, Easing, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedViewNative from '@react-native-masked-view/masked-view';
// the package's class typing clashes with @types/react 19; runtime is fine
const MaskedView = MaskedViewNative as unknown as React.ComponentType<any>;
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {colors} from '../theme';

/** `page-in`: 280ms fade + 10px rise whenever the screen key changes. */
export function PageIn({children, k, style}: {children: ReactNode; k: string; style?: StyleProp<ViewStyle>}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, {toValue: 1, duration: 280, easing: Easing.bezier(0.22, 0.8, 0.25, 1), useNativeDriver: true}).start();
  }, [k, v]);
  return (
    <Animated.View style={[style, {opacity: v, transform: [{translateY: v.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}]}]}>
      {children}
    </Animated.View>
  );
}

/** Generic 0 -> 1 -> 0 ping-pong loop used by float / pulse animations. */
export function usePingPong(duration: number, delay = 0, easing = Easing.inOut(Easing.ease)) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {toValue: 1, duration: duration / 2, easing, useNativeDriver: true}),
        Animated.timing(v, {toValue: 0, duration: duration / 2, easing, useNativeDriver: true}),
      ]),
    );
    const t = setTimeout(() => loop.start(), Math.max(0, delay));
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [duration, delay, easing, v]);
  return v;
}

/** `float` keyframes: drift (20,30) and scale 1.1 at the midpoint. */
export function Floating({children, duration = 6000, delay = 0, style}: {children: ReactNode; duration?: number; delay?: number; style?: StyleProp<ViewStyle>}) {
  const v = usePingPong(duration, -delay);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {translateX: v.interpolate({inputRange: [0, 1], outputRange: [0, 20]})},
            {translateY: v.interpolate({inputRange: [0, 1], outputRange: [0, 30]})},
            {scale: v.interpolate({inputRange: [0, 1], outputRange: [1, 1.1]})},
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

/** `wait` keyframes (opacity 1 -> .5 -> 1). */
export function Pulse({children, duration = 2000, style}: {children: ReactNode; duration?: number; style?: StyleProp<ViewStyle>}) {
  const v = usePingPong(duration);
  return <Animated.View style={[style, {opacity: v.interpolate({inputRange: [0, 1], outputRange: [1, 0.5]})}]}>{children}</Animated.View>;
}

/** Soft radial blob, replaces CSS `filter: blur(40px)` circles. */
export function Blob({size, color, style}: {size: number; color: string; style?: StyleProp<ViewStyle>}) {
  const s = size + 80;
  return (
    <View pointerEvents="none" style={[{position: 'absolute', width: s, height: s}, style]}>
      <Svg width={s} height={s}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.85" />
            <Stop offset="0.55" stopColor={color} stopOpacity="0.55" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={s / 2} cy={s / 2} r={s / 2} fill="url(#g)" />
      </Svg>
    </View>
  );
}

/** Slowly drifting multi-stop gradient (the `aurora` keyframes on the landing screen and footer). */
export function Aurora({colorsList, duration = 12000, style, children}: {colorsList: string[]; duration?: number; style?: StyleProp<ViewStyle>; children?: ReactNode}) {
  const {width} = useWindowDimensions();
  const [size, setSize] = useState({w: width, h: 800});
  const v = usePingPong(duration, 0, Easing.inOut(Easing.sin));
  const onLayout = (e: LayoutChangeEvent) => setSize({w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height});
  const gw = size.w * 2;
  const gh = size.h * 2;
  return (
    <View style={[{overflow: 'hidden'}, style]} onLayout={onLayout}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: gw,
          height: gh,
          transform: [
            {translateX: v.interpolate({inputRange: [0, 1], outputRange: [0, -(gw - size.w)]})},
            {translateY: v.interpolate({inputRange: [0, 1], outputRange: [-(gh - size.h) * 0.3, -(gh - size.h) * 0.7]})},
          ],
        }}>
        <LinearGradient colors={colorsList} start={{x: 0, y: 0}} end={{x: 0.4, y: 1}} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {children}
    </View>
  );
}

/** Horizontal marquee: content is rendered twice and slides by exactly half its width, looping. */
export function Marquee({children, duration = 30000}: {children: ReactNode; duration?: number}) {
  const x = useRef(new Animated.Value(0)).current;
  const [half, setHalf] = useState(0);
  useEffect(() => {
    if (!half) return;
    x.setValue(0);
    const loop = Animated.loop(Animated.timing(x, {toValue: -half, duration, easing: Easing.linear, useNativeDriver: true}));
    loop.start();
    return () => loop.stop();
  }, [half, duration, x]);
  return (
    <MaskedView
      style={{marginHorizontal: -24, marginVertical: 14, height: 40}}
      maskElement={
        <LinearGradient colors={['transparent', '#000', '#000', 'transparent']} locations={[0, 0.15, 0.85, 1]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{flex: 1}} />
      }>
      <Animated.View style={{flexDirection: 'row', alignSelf: 'flex-start', transform: [{translateX: x}]}} onLayout={e => setHalf(e.nativeEvent.layout.width / 2)}>
        {children}
      </Animated.View>
    </MaskedView>
  );
}

export const palette = colors;
