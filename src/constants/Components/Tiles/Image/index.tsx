import React, {Image, Text, View, StyleSheet} from 'react-native';
import styles from '../../../../../screens/DetailsScreen/styles';

export const ImageTile = (t: {content: string; editMode?: boolean; shape?: string; tileId?: string}) => {
  // Determine image shape from URI or props
  // If the URI contains shape information, extract it
  // Otherwise use the shape prop or default to 'rounded'
  const getImageShape = () => {
    if (t.shape) {
      return t.shape;
    }
    
    // Extract shape from URI if it's encoded as a query parameter
    if (t.content) {
      try {
        // Check if the URI has a shape parameter
        const match = t.content.match(/[?&]shape=([^&]+)/);
        if (match && match[1]) {
          const shape = match[1];
          if (['circle', 'square', 'rounded'].includes(shape)) {
            return shape;
          }
        }
      } catch (error) {
        console.error('Error extracting shape from URI:', error);
      }
    }
    
    // Default shape
    return 'rounded';
  };
  
  const shape = getImageShape();
  
  // Apply different styles based on shape
  const getImageStyle = () => {
    const baseStyle = [styles.tileImage];
    
    if (shape === 'circle') {
      return [...baseStyle, { borderRadius: 1000 }];
    } else if (shape === 'square') {
      return [...baseStyle, { borderRadius: 0 }];
    } else {
      // Rounded rectangle (default)
      return [...baseStyle, { borderRadius: 16 }];
    }
  };
  
  // Clean the URI by removing the shape parameter
  const getCleanImageUri = () => {
    if (!t.content) return '';
    return t.content.split('?')[0]; // Remove any query parameters
  };
  
  return (
    <View style={[styles.imageContainer, 
      shape === 'circle' && { borderRadius: 1000 },
      shape === 'square' && { borderRadius: 0 },
      shape === 'rounded' && { borderRadius: 16 }
    ]}>
      <Image
        source={{uri: getCleanImageUri()}}
        style={getImageStyle()}
        resizeMode="cover"
      />
    </View>
  );
};
