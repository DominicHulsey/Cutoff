import React, {Image, Text, View} from 'react-native';
import styles from '../../../../../screens/DetailsScreen/styles';

export const ImageTile = (t: {content: string}) => {
  return (
    <View style={styles.imageContainer}>
      <Image
        source={{uri: t.content}}
        style={styles.tileImage}
        resizeMode="contain"
      />
    </View>
  );
};
