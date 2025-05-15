import React, {View, Text, Animated, TouchableOpacity} from 'react-native';
import styles from '../../../../screens/DetailsScreen/styles';
import {ImageTile} from './Image';
import {LinkTile} from './Link';
import {QuoteTile} from './Quote';
import {YoutubeTile} from './YouTube';
import {CorkTile, TileType} from '../../../../screens/DetailsScreen/types';
import Icon from 'react-native-vector-icons/Entypo';

export const renderTiles = (
  tiles: CorkTile[],
  backgroundColorRefs: any,
  panRefs: any,
  scaleRefs: any,
  rotateRefs: any,
  editMode: boolean,
  panResponderRefs: any,
  editTile: (id: string, type: TileType, content: string) => void,
  deleteTile: (id: string) => void,
  youtubePlayerHeight: number,
  youtubeFullscreen: boolean,
  onYoutubeStateChange: (state: string) => void,
  onYoutubeFullscreenChange: (fullscreen: boolean) => void,
  getYouTubeVideoId: (content: string) => string | null,
) => {
  if (tiles.length === 0)
    return (
      <View style={styles.noTilesContainer}>
        <Text style={styles.noTilesText}>No tiles yet!</Text>
      </View>
    );
  return tiles.map(t => (
    <Animated.View
      key={t.id}
      style={[
        styles.tile,
        {
          borderRadius: t.shape === 'circle' ? 250 : 25,
          width: t.width,
          height: t.type === 'link' ? 'auto' : t.height,
          zIndex: t.zIndex,
          backgroundColor:
            backgroundColorRefs.current[t.id]?.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(230, 230, 230, 1)', 'rgba(255, 255, 255, 1)'],
            }) || 'white',
          transform: [
            {translateX: panRefs.current[t.id]?.x || 0},
            {translateY: panRefs.current[t.id]?.y || 0},
            {scale: scaleRefs.current[t.id] || 1},
            {
              rotate:
                rotateRefs.current[t.id]?.interpolate({
                  inputRange: [-Math.PI, Math.PI],
                  outputRange: ['-180deg', '180deg'],
                }) || '0deg',
            },
          ],
        },
      ]}
      {...(editMode ? panResponderRefs.current[t.id]?.panHandlers : {})}>
      <View style={styles.tileContent}>
        {t.type === 'quote' && <QuoteTile content={t.content} editMode={editMode} />}

        {t.type === 'link' && <LinkTile content={t.content} editMode={editMode} tileId={t.id} />}

        {t.type === 'youtube' && (
          <YoutubeTile
            content={t.content}
            width={t.width}
            youtubePlayerHeight={youtubePlayerHeight}
            youtubeFullscreen={youtubeFullscreen}
            onYoutubeStateChange={onYoutubeStateChange}
            onYoutubeFullscreenChange={onYoutubeFullscreenChange}
            getYouTubeVideoId={getYouTubeVideoId}
            tile={t}
            editMode={editMode}
          />
        )}

        {t.type === 'local-image' && <ImageTile content={t.content} editMode={editMode} tileId={t.id} shape={t.shape} />}
      </View>

      {editMode && (
        <View style={styles.tileControls}>
          <TouchableOpacity
            style={styles.tileControlButton}
            onPress={() => editTile(t.id, t.type, t.content)}>
            <Icon name="edit" size={20} color="#4A90E2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tileControlButton]}
            onPress={() => deleteTile(t.id)}>
            <Icon name="trash" size={20} color="#E53935" />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  ));
};
