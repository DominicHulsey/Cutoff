import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
  RotationGestureHandlerEventPayload,
  GestureUpdateEvent,
  GestureStateChangeEvent,
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
  
  // Pan gesture (for dragging)
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Initialize
    })
    .onStart(() => {
      // Store initial position
    })
    .onUpdate((event) => {
      // Update position based on gesture
      transX.value = x + event.translationX;
      transY.value = y + event.translationY;
    })
    .onEnd(() => {
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: width * scale.value,
        height: height * scale.value,
        rotation: rotateZ.value,
      });
    });

  // Pinch gesture (for resizing)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: width * scale.value,
        height: height * scale.value,
        rotation: rotateZ.value,
      });
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onUpdate((event) => {
      rotateZ.value = rotation + event.rotation;
    })
    .onEnd(() => {
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: width * scale.value,
        height: height * scale.value,
        rotation: rotateZ.value,
      });
    });
    
  // Combine gestures - make sure each gesture can work independently
  const combinedGestures = Gesture.Race(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture)
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
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
      ] as any, // Type assertion to avoid TypeScript errors with transform properties
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={combinedGestures}>
        <Animated.View style={[styles.tile, animatedStyle]}>
          <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{content}</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
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