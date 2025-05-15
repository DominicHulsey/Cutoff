import React, {
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../../../../../screens/DetailsScreen/styles';
import YoutubeIframe from 'react-native-youtube-iframe';

export const YoutubeTile = ({
  youtubePlayerHeight,
  youtubeFullscreen,
  onYoutubeStateChange,
  onYoutubeFullscreenChange,
  getYouTubeVideoId,
  tile,
}: {
  content: string;
  width: number;
  youtubePlayerHeight: number;
  youtubeFullscreen: boolean;
  onYoutubeStateChange: (state: string) => void;
  onYoutubeFullscreenChange: (fullscreen: boolean) => void;
  getYouTubeVideoId: (content: string) => string | null;
  tile: {
    content: string;
    width: number;
  };
}) => {
  return (
    <View
      style={[
        styles.youtubeContainer,
        {height: youtubeFullscreen ? youtubePlayerHeight : 'auto'},
      ]}>
      {getYouTubeVideoId(tile.content) ? (
        <YoutubeIframe
          height={youtubePlayerHeight - 12}
          width={tile.width} // Account for padding
          videoId={getYouTubeVideoId(tile.content) || ''}
          play={false}
          onChangeState={onYoutubeStateChange}
          onFullscreenChange={onYoutubeFullscreenChange}
          webViewProps={{
            androidLayerType:
              Platform.OS === 'android' ? 'hardware' : undefined,
          }}
        />
      ) : (
        <TouchableOpacity onPress={() => Linking.openURL(tile.content)}>
          <Text style={styles.linkText}>
            Invalid YouTube URL: {tile.content}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
