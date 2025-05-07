import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
} from 'react-native-gesture-handler';

type Props = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: string;
  content: string;
  onUpdate: (updates: { x: number; y: number; width: number; height: number; rotation: number }) => void;
};

const DraggableResizableTile: React.FC<Props> = ({
  id, x, y, width, height, rotation, type, content, onUpdate,
}) => {
  // Shared values for position, scale, and rotation
  const transX = useSharedValue(x);
  const transY = useSharedValue(y);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(rotation);

  // Drag handler
  const panHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = transX.value;
      ctx.startY = transY.value;
    },
    onActive: (event, ctx: any) => {
      transX.value = ctx.startX + event.translationX;
      transY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: width * scale.value,
        height: height * scale.value,
        rotation: rotateZ.value,
      });
    },
  });

  // Pinch handler for resizing
  const pinchHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: width * scale.value,
        height: height * scale.value,
        rotation: rotateZ.value,
      });
    },
  });

  // Rotation handler
  const rotationHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      rotateZ.value = rotation + event.rotation;
    },
    onEnd: () => {
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: width * scale.value,
        height: height * scale.value,
        rotation: rotateZ.value,
      });
    },
  });

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: width * scale.value,
    height: height * scale.value,
    transform: [
      { translateX: transX.value },
      { translateY: transY.value },
      { scale: scale.value },
      { rotateZ: `${rotateZ.value}rad` },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={panHandler}>
      <Animated.View style={[styles.tile, animatedStyle]}>
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={{ flex: 1 }}>
            <RotationGestureHandler onGestureEvent={rotationHandler}>
              <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>{content}</Text>
              </Animated.View>
            </RotationGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fffbe7',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d4a373',
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 2, height: 2 },
    elevation: 3,
  },
});

export default DraggableResizableTile;