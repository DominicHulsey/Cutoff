import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Image, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

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
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, type: string, content: string) => void;
};

// Pushpin image (you can replace this with an actual image asset)
const PUSHPIN_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

const DraggableResizableTile: React.FC<Props> = ({
  id, x, y, width, height, rotation, type, content, onUpdate, onDuplicate, onDelete, onEdit,
}) => {
  // State for the action modal
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  // Shared values for position, scale, and rotation
  const transX = useSharedValue(x);
  const transY = useSharedValue(y);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(rotation);
  const isActive = useSharedValue(false);
  const finalWidth = useSharedValue(width);
  const finalHeight = useSharedValue(height);
  const pinColor = PUSHPIN_COLORS[parseInt(id, 10) % PUSHPIN_COLORS.length];
  
  // Update shared values when props change (for persistence when navigating back)
  useEffect(() => {
    transX.value = x;
    transY.value = y;
    rotateZ.value = rotation;
    finalWidth.value = width;
    finalHeight.value = height;
  }, [x, y, width, height, rotation]);
  
  // Pan gesture (for dragging)
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true;
    })
    .onStart(() => {
      // No need to store initial position as we're using the current values
    })
    .onUpdate((event) => {
      // Update position based on gesture
      transX.value = x + event.translationX;
      transY.value = y + event.translationY;
    })
    .onEnd(() => {
      isActive.value = false;
      // Only update position, not size
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: finalWidth.value,
        height: finalHeight.value,
        rotation: rotateZ.value,
      });
    });

  // Pinch gesture (for resizing)
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      isActive.value = true;
    })
    .onUpdate((event) => {
      scale.value = event.scale;
      finalWidth.value = width * event.scale;
      finalHeight.value = height * event.scale;
    })
    .onEnd(() => {
      isActive.value = false;
      // Update with calculated final dimensions and reset scale
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: finalWidth.value,
        height: finalHeight.value,
        rotation: rotateZ.value,
      });
      // Reset scale to 1 after updating dimensions
      scale.value = 1;
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onBegin(() => {
      isActive.value = true;
    })
    .onUpdate((event) => {
      rotateZ.value = rotation + event.rotation;
    })
    .onEnd(() => {
      isActive.value = false;
      runOnJS(onUpdate)({
        x: transX.value,
        y: transY.value,
        width: finalWidth.value,
        height: finalHeight.value,
        rotation: rotateZ.value,
      });
    });
    
  // Long press gesture for showing the action modal
  const longPressGesture = Gesture.LongPress()
    .minDuration(600)
    .onStart((event) => {
      // Trigger haptic feedback
      runOnJS(ReactNativeHapticFeedback.trigger)('impactMedium', hapticOptions);
      
      // Calculate modal position near the touch point
      runOnJS(setModalPosition)({
        x: transX.value + finalWidth.value / 2,
        y: transY.value + finalHeight.value / 2
      });
      runOnJS(setActionModalVisible)(true);
    });

  // Combine gestures - make sure each gesture can work independently
  const combinedGestures = Gesture.Race(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture),
    longPressGesture
  );

  // Animated style for the tile
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: finalWidth.value * scale.value,
      height: finalHeight.value * scale.value,
      transform: [
        { translateX: transX.value },
        { translateY: transY.value },
        { scale: isActive.value ? withSpring(1.05) : withSpring(1) },
        { rotateZ: `${rotateZ.value}rad` },
      ] as any,
      opacity: isActive.value ? withTiming(0.9) : withTiming(1),
      zIndex: isActive.value ? 10 : 1,
    };
  });

  // Handle edit action
  const handleEdit = () => {
    setActionModalVisible(false);
    if (onEdit) {
      onEdit(id, type, content);
    }
  };

  // Handle duplicate action
  const handleDuplicate = () => {
    setActionModalVisible(false);
    if (onDuplicate) {
      onDuplicate(id);
    }
  };

  // Handle delete action
  const handleDelete = () => {
    setActionModalVisible(false);
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={combinedGestures}>
        <Animated.View style={[styles.tile, animatedStyle]}>
          {/* Pushpin at the top */}
          <View style={styles.pushpinContainer}>
            <View style={[styles.pushpin, { backgroundColor: pinColor }]} />
          </View>
          
          <Animated.View style={styles.contentContainer}>
            <Text style={styles.contentText}>{content}</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Action Modal */}
      <Modal
        transparent
        visible={actionModalVisible}
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setActionModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View 
              style={[
                styles.actionModal, 
                {
                  left: modalPosition.x - 75, // Center the modal horizontally
                  top: modalPosition.y - 60,  // Position above the center point
                }
              ]}
            >
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={styles.actionButton} onPress={handleDuplicate}>
                <Text style={styles.actionButtonText}>Duplicate</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fff9c4', // Light yellow sticky note color
    borderRadius: 2,
    padding: 16,
    paddingTop: 24, // Extra padding at top for pushpin
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,
    elevation: 5,
    // Subtle gradient effect via border
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    position: 'absolute',
    width: 150,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: 'rgba(255,0,0,0.05)',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  pushpinContainer: {
    position: 'absolute',
    top: 5,
    alignSelf: 'center',
    zIndex: 10,
  },
  pushpin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e74c3c', // Default red pushpin
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 1,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  contentText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default DraggableResizableTile;