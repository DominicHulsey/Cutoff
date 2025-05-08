import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Image, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { FONTS } from '../src/constants/fonts';
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

// Modern color palette based on the screenshots
const COLORS = {
  primary: '#2A7D4F',       // Main green color
  secondary: '#F4F4F2',     // Light background
  accent: '#FFD84D',        // Yellow accent
  text: '#333333',          // Dark text
  lightText: '#666666',     // Secondary text
  cardBg1: '#E8F5E9',       // Light green card
  cardBg2: '#FFF8E1',       // Light yellow card
  cardBg3: '#E3F2FD',       // Light blue card
  cardBg4: '#F3E5F5',       // Light purple card
};

// Accent colors for tile elements
const ACCENT_COLORS = ['#2A7D4F', '#FF9800', '#5E35B1', '#1E88E5', '#43A047'];

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
  const accentColor = ACCENT_COLORS[parseInt(id, 10) % ACCENT_COLORS.length];
  
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
          <Animated.View style={styles.contentContainer}>
            {/* Header with accent color */}
            <View style={[styles.tileHeader, { backgroundColor: accentColor }]}>
              <View style={styles.headerDot} />
            </View>
            
            {/* Content area */}
            <View style={styles.textContainer}>
              <Text style={styles.contentText}>{content}</Text>
            </View>
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
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    position: 'absolute',
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,59,48,0.05)',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  tileHeader: {
    height: 12,
    width: '100%',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginRight: 4,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default DraggableResizableTile;