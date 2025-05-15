import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  PanResponder,
  Animated,
  TouchableOpacity,
  Text,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import styles from '../../../../screens/DetailsScreen/styles';
import ImageCropPicker from 'react-native-image-crop-picker';

type CropShape = 'circle' | 'square' | 'rounded';

interface ImageCropperProps {
  imageUri: string;
  onCropComplete: (croppedUri: string, shape: CropShape) => void;
}

export const ImageCropper = ({ imageUri, onCropComplete }: ImageCropperProps) => {
  const [shape, setShape] = useState<CropShape>('rounded');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: 150, height: 150 });
  
  // Animation values for image position
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width - 48; // Accounting for padding
  
  // Calculate the frame position to be centered
  const framePosition = {
    x: (screenWidth - frameSize.width) / 2,
    y: (250 - frameSize.height) / 2, // 250 is the height of cropContainer
  };
  
  // Set up pan responder for image dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x as unknown as number,
          y: pan.y as unknown as number,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;
  
  // Get image dimensions on load
  useEffect(() => {
    Image.getSize(imageUri, (width, height) => {
      setImageSize({ width, height });
    });
  }, [imageUri]);
  
  // Function to crop the image based on current position and shape
  const cropImage = async () => {
    try {
      // Calculate crop area based on current pan position and frame size
      const xOffset = -(pan.x as unknown as number) + framePosition.x;
      const yOffset = -(pan.y as unknown as number) + framePosition.y;
      
      // Use image-crop-picker to crop the image
      const croppedImage = await ImageCropPicker.openCropper({
        path: imageUri,
        width: frameSize.width,
        height: frameSize.height,
        cropperCircleOverlay: shape === 'circle',
        cropping: true,
        mediaType: 'photo',
        includeBase64: false,
      });
      
      // Pass the cropped image URI back to parent
      onCropComplete(croppedImage.path, shape);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };
  
  // Change the crop shape
  const changeShape = (newShape: CropShape) => {
    setShape(newShape);
    
    // Adjust frame size based on shape
    if (newShape === 'circle') {
      setFrameSize({ width: 150, height: 150 });
    } else if (newShape === 'square') {
      setFrameSize({ width: 150, height: 150 });
    } else {
      setFrameSize({ width: 180, height: 120 });
    }
  };
  
  // Get the appropriate frame style based on selected shape
  const getFrameStyle = () => {
    const baseStyle = {
      ...styles.cropFrame,
      width: frameSize.width,
      height: frameSize.height,
      left: framePosition.x,
      top: framePosition.y,
    };
    
    if (shape === 'circle') {
      return [baseStyle, styles.cropFrameCircle];
    } else if (shape === 'square') {
      return [baseStyle, styles.cropFrameSquare];
    } else {
      return [baseStyle, styles.cropFrameRounded];
    }
  };
  
  return (
    <View>
      <View style={styles.cropContainer}>
        {/* The image that can be moved */}
        <Animated.View
          style={{
            transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
          }}
          {...panResponder.panHandlers}
        >
          <Image source={{ uri: imageUri }} style={styles.cropImage} />
        </Animated.View>
        
        {/* Overlay with transparent crop area */}
        <View style={styles.cropOverlay}>
          <View style={getFrameStyle()} />
        </View>
      </View>
      
      {/* Shape selection controls */}
      <View style={styles.cropControls}>
        <TouchableOpacity
          style={[
            styles.cropShapeButton,
            shape === 'circle' && styles.cropShapeButtonActive,
          ]}
          onPress={() => changeShape('circle')}
        >
          <Text
            style={[
              styles.cropShapeButtonText,
              shape === 'circle' && styles.cropShapeButtonTextActive,
            ]}
          >
            Circle
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.cropShapeButton,
            shape === 'square' && styles.cropShapeButtonActive,
          ]}
          onPress={() => changeShape('square')}
        >
          <Text
            style={[
              styles.cropShapeButtonText,
              shape === 'square' && styles.cropShapeButtonTextActive,
            ]}
          >
            Square
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.cropShapeButton,
            shape === 'rounded' && styles.cropShapeButtonActive,
          ]}
          onPress={() => changeShape('rounded')}
        >
          <Text
            style={[
              styles.cropShapeButtonText,
              shape === 'rounded' && styles.cropShapeButtonTextActive,
            ]}
          >
            Rounded
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Apply crop button */}
      <TouchableOpacity
        style={[styles.selectImageButton, { marginTop: 8 }]}
        onPress={cropImage}
      >
        <Text style={styles.selectImageButtonText}>Apply Crop</Text>
      </TouchableOpacity>
    </View>
  );
};
