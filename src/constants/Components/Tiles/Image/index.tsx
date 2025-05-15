import React, {Image, Text, View, StyleSheet} from 'react-native';
import styles from '../../../../../screens/DetailsScreen/styles';

export const ImageTile = (t: {content: string; editMode?: boolean; shape?: 'circle' | 'square' | 'rounded'; tileId?: string}) => {
  // Determine image shape from props or default to 'rounded'
  // We now prioritize the shape prop passed directly from the tile data
  const getImageShape = () => {
    // If shape is explicitly provided in props, use it
    if (t.shape) {
      return t.shape;
    }
    
    // For backward compatibility, extract shape from URI if it's encoded as a query parameter
    if (t.content) {
      try {
        // Check if the URI has a shape parameter
        const match = t.content.match(/[?&]shape=([^&]+)/);
        if (match && match[1]) {
          const shape = match[1];
          if (['circle', 'square', 'rounded'].includes(shape)) {
            console.log(`Shape extracted from URI: ${shape}`);
            return shape as 'circle' | 'square' | 'rounded';
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
      // For circle, use a very large border radius and ensure width/height are equal
      return [...baseStyle, { 
        borderRadius: 1000,
        aspectRatio: 1,
        overflow: 'hidden' as const, // Type as const to satisfy TypeScript
      }];
    } else if (shape === 'square') {
      // For square, use no border radius and ensure width/height are equal
      return [...baseStyle, { 
        borderRadius: 0,
        aspectRatio: 1,
      }];
    } else {
      // Rounded rectangle (default)
      return [...baseStyle, { 
        borderRadius: 16,
        // Allow natural aspect ratio for rounded rectangles
      }];
    }
  };
  
  // Clean the URI by removing the shape parameter
  const getCleanImageUri = () => {
    if (!t.content) return '';
    return t.content.split('?')[0]; // Remove any query parameters
  };
  
  // Get container styles based on shape
  const getContainerStyle = () => {
    const baseStyle = [styles.imageContainer];
    
    if (shape === 'circle') {
      return [...baseStyle, { 
        backgroundColor: 'blue',
        borderRadius: 250,
        aspectRatio: 1,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      }];
    } else if (shape === 'square') {
      return [...baseStyle, { 
        borderRadius: 0,
        aspectRatio: 1,
      }];
    } else {
      // Rounded rectangle (default)
      return [...baseStyle, { 
        borderRadius: 16,
      }];
    }
  };
  
  return (
    <View style={getContainerStyle()}>
      <Image
        source={{uri: getCleanImageUri()}}
        style={getImageStyle()}
        resizeMode="cover"
      />
    </View>
  );
};
