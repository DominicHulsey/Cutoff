import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import {Asset} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import styles from './styles';
import {renderTiles} from '../../src/constants/Components/Tiles';
import {CorkTile, Props, TileType} from './types';
import {AddTileModal} from '../../src/constants/Components/AddTileModal';
import {EditTileModal} from '../../src/constants/Components/EditTileModal';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

function DetailsScreen({navigation, route}: Props) {
  const [editMode, setEditMode] = useState(false);
  const rotateRefs = useRef<{[id: string]: Animated.Value}>({});
  const backgroundColorRefs = useRef<{[id: string]: Animated.Value}>({});
  const insets = useSafeAreaInsets();
  const {tile} = route.params;
  const [tiles, setTiles] = useState<CorkTile[]>([]);
  const tilesRef = useRef<CorkTile[]>([]); // ✅ Track live tiles
  const [isLoading, setIsLoading] = useState(true);
  const storageKey = `detail_tiles_${tile.id}`;
  const panRefs = useRef<{[id: string]: Animated.ValueXY}>({});
  const scaleRefs = useRef<{[id: string]: Animated.Value}>({});
  const panResponderRefs = useRef<{[id: string]: any}>({});
  const containerRef = useRef<View>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState<TileType>('quote');
  const [newContent, setNewContent] = useState('');
  const [cropShape, setCropShape] = useState<'circle' | 'square' | 'rounded'>('rounded');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTile, setEditingTile] = useState<{
    id: string;
    type: TileType;
    content: string;
  } | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedType, setEditedType] = useState<TileType>('quote');

  // YouTube player state
  const [youtubeFullscreen, setYoutubeFullscreen] = useState(false);
  const [youtubePlayerHeight, setYoutubePlayerHeight] = useState(195); // Default height

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);

  // Helper function to handle YouTube player state change
  const onYoutubeStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      // Video has ended
      console.log('video has ended');
    }
  }, []);

  // Handle YouTube fullscreen toggle
  const onYoutubeFullscreenChange = useCallback(
    (isFullscreen: boolean) => {
      setYoutubeFullscreen(isFullscreen);
      // Adjust player height based on fullscreen state
      setYoutubePlayerHeight(isFullscreen ? windowHeight : 195);
    },
    [windowHeight],
  );

  const createPanResponder = (tileId: string) => {
    let initialDistance = 1;
    let initialAngle = 0;
    let initialScale = 1;
    let initialRotation = 0;
    let isDragging = false;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Darken the background when dragging starts
        backgroundColorRefs.current[tileId]?.setValue(0.8);
        panRefs.current[tileId]?.extractOffset();
        isDragging = true;
      },
      onPanResponderMove: (e, gestureState) => {
        const touches = e.nativeEvent.touches;

        if (touches.length === 1) {
          // Single finger drag - update position in real-time
          Animated.event(
            [
              null,
              {dx: panRefs.current[tileId].x, dy: panRefs.current[tileId].y},
            ],
            {useNativeDriver: false},
          )(e, gestureState);
        }

        if (touches.length === 2) {
          const [touch1, touch2] = touches;

          const dx = touch2.pageX - touch1.pageX;
          const dy = touch2.pageY - touch1.pageY;

          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          if (initialDistance === 1) {
            initialDistance = distance;
            initialAngle = angle;
            //@ts-ignore
            initialScale = scaleRefs.current[tileId]?._value || 1;
            //@ts-ignore
            initialRotation = rotateRefs.current[tileId]?._value || 0;
          }

          const scale = (distance / initialDistance) * initialScale;
          const rotation = angle - initialAngle + initialRotation;

          // Apply scale and rotation in real-time
          scaleRefs.current[tileId]?.setValue(scale);
          rotateRefs.current[tileId]?.setValue(rotation);
        }
      },
      onPanResponderRelease: () => {
        // Reset background color when interaction ends
        backgroundColorRefs.current[tileId]?.setValue(1);
        panRefs.current[tileId]?.flattenOffset();
        isDragging = false;

        const currentTile = tilesRef.current.find(t => t.id === tileId);
        if (!currentTile) return;

        // Get the final position values
        panRefs.current[tileId]?.stopAnimation(pos => {
          const nx = Math.max(
            0,
            Math.min(pos.x, windowWidth - currentTile.width),
          );
          const ny = Math.max(
            0,
            Math.min(pos.y, windowHeight - 150 - currentTile.height),
          );

          //@ts-ignore
          const scaleVal = scaleRefs.current[tileId]?._value || 1;
          //@ts-ignore
          const rotateVal = rotateRefs.current[tileId]?._value || 0;

          // Calculate new dimensions based on scaling
          const newWidth = Math.max(60, currentTile.width * scaleVal);
          const newHeight = Math.max(40, currentTile.height * scaleVal);

          // Update the animated values to match the final position
          panRefs.current[tileId].setValue({x: nx, y: ny});
          scaleRefs.current[tileId].setValue(1);

          // Update the tile data in state
          const updatedTiles = tilesRef.current.map(tile =>
            tile.id === tileId
              ? {
                  ...tile,
                  x: nx,
                  y: ny,
                  width: newWidth,
                  height: newHeight,
                  rotation: rotateVal,
                }
              : tile,
          );

          // Save the updated tiles
          saveTiles(updatedTiles);
        });

        // Reset values for next interaction
        initialDistance = 1;
        initialAngle = 0;
      },
    });
  };

  const loadTiles = async () => {
    //@ts-ignore
    rotateRefs.current[tile.id] = new Animated.Value(tile.rotation || 0);
    backgroundColorRefs.current[tile.id] = new Animated.Value(1); // 1 is normal, < 1 is darker
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      let loadedTiles: CorkTile[] = stored ? JSON.parse(stored) : [];

      loadedTiles.forEach((t: CorkTile) => {
        panRefs.current[t.id] = new Animated.ValueXY({x: t.x, y: t.y});
        scaleRefs.current[t.id] = new Animated.Value(1);
        panResponderRefs.current[t.id] = createPanResponder(t.id);
      });

      setTiles(loadedTiles);
      tilesRef.current = loadedTiles; // Sync ref
    } catch (error) {
      console.error('Error loading tiles:', error);
    }
    setIsLoading(false);
  };

  const saveTiles = async (updated: CorkTile[]) => {
    setTiles(updated);
    tilesRef.current = updated; // ✅ Sync ref
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving tiles:', error);
    }
  };

  useEffect(() => {
    loadTiles();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTiles();
    }, [tile.id]),
  );

  useEffect(() => {
    return () => {
      if (tilesRef.current.length > 0) {
        AsyncStorage.setItem(storageKey, JSON.stringify(tilesRef.current));
      }
    };
  }, []);

  const handleAddTile = () => {
    // For local-image type, check if an image is selected
    if (newType === 'local-image') {
      if (!selectedImage || !selectedImage.uri) {
        Alert.alert('No Image Selected', 'Please select an image first');
        return;
      }
    } else if (newType === 'youtube') {
      // Validate YouTube URL
      const videoId = getYouTubeVideoId(newContent);
      if (!videoId) {
        Alert.alert(
          'Invalid YouTube URL',
          'Please enter a valid YouTube URL',
        );
        return;
      }
    } else if (newType !== 'quote' && !newContent.trim()) {
      // For other types, ensure content is not empty
      Alert.alert('Empty Content', 'Please enter some content');
      return;
    }
    
    // Set appropriate initial dimensions based on tile type
    let initialWidth = 180;
    let initialHeight = 100;
    
    // For link tiles, set a larger initial size to accommodate the preview
    if (newType === 'link') {
      initialWidth = 300;
      initialHeight = 350;
    } else if (newType === 'youtube') {
      initialWidth = 320;
      initialHeight = 240;
    } else if (newType === 'local-image') {
      // For local-image tiles, use the selected shape
      if (selectedImage && selectedImage.uri) {
        // Get the current shape from the modal's state
        const shape = cropShape;
        
        if (shape === 'circle') {
          // Make circle images square
          initialWidth = 180;
          initialHeight = 180;
        } else if (shape === 'square') {
          initialWidth = 180;
          initialHeight = 180;
        } else {
          // Rounded rectangle
          initialWidth = 220;
          initialHeight = 150;
        }
      } else {
        // Default image size if no shape is specified
        initialWidth = 250;
        initialHeight = 200;
      }
    }
    
    // Use the selected image URI for local-image type
    const tileContent = newType === 'local-image' && selectedImage?.uri 
      ? selectedImage.uri 
      : newContent.trim();
      
    // Create a new tile with the content from the modal
    const newTile: CorkTile = {
      id: Date.now().toString(),
      type: newType,
      content: tileContent,
      x: 60,
      y: 60,
      width: initialWidth,
      height: initialHeight,
      rotation: 0,
      zIndex: tilesRef.current.length + 1,
      // Include shape information for image tiles
      ...(newType === 'local-image' ? { shape: cropShape } : {}),
    };

    // Create pan/scale/responders immediately so it's interactive
    panRefs.current[newTile.id] = new Animated.ValueXY({
      x: newTile.x,
      y: newTile.y,
    });
    scaleRefs.current[newTile.id] = new Animated.Value(1);
    rotateRefs.current[newTile.id] = new Animated.Value(0); // Initialize rotation for new tile
    backgroundColorRefs.current[newTile.id] = new Animated.Value(1); // Initialize background color
    panResponderRefs.current[newTile.id] = createPanResponder(newTile.id);

    const updated = [...tilesRef.current, newTile];
    setTiles(updated);
    tilesRef.current = updated;

    AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    setNewContent('');
    setNewType('quote');
    setSelectedImage(null);
    setModalVisible(false);
  };

  const deleteTile = (id: string) => {
    const updated = tilesRef.current.filter((tile: CorkTile) => tile.id !== id);
    setTiles(updated);
    tilesRef.current = updated;
    AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const editTile = (id: string, type: TileType, content: string) => {
    setEditingTile({id, type, content});
    setEditedContent(content);
    setEditedType(type);
    setEditModalVisible(true);
  };

  const saveEditedTile = () => {
    if (editingTile && editedContent.trim()) {
      const updated = tilesRef.current.map((tile: CorkTile) =>
        tile.id === editingTile.id
          ? {...tile, type: editedType, content: editedContent.trim()}
          : tile,
      );
      setTiles(updated);
      tilesRef.current = updated;
      AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      setEditModalVisible(false);
      setEditingTile(null);
      setEditedContent('');
      setEditedType('quote');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, {marginTop: insets.top / 4}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={[styles.editToggleText, editMode && {color: 'red'}]}>
            {editMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContainer}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}>
        <View ref={containerRef} style={styles.workspaceContainer}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <>
              {renderTiles(
                tiles,
                backgroundColorRefs,
                panRefs,
                scaleRefs,
                rotateRefs,
                editMode,
                panResponderRefs,
                editTile,
                deleteTile,
                youtubePlayerHeight,
                youtubeFullscreen,
                onYoutubeStateChange,
                onYoutubeFullscreenChange,
                getYouTubeVideoId,
              )}
            </>
          )}
        </View>
      </ScrollView>

      {editMode && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}>
          <View style={styles.addBtnInner}>
            <Text style={styles.addBtnText}>+</Text>
          </View>
        </TouchableOpacity>
      )}

      <AddTileModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        newType={newType}
        setNewType={setNewType}
        newContent={newContent}
        setNewContent={setNewContent}
        handleAddTile={handleAddTile}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        cropShape={cropShape}
        setCropShape={setCropShape}
      />

      <EditTileModal
        editModalVisible={editModalVisible}
        setEditModalVisible={setEditModalVisible}
        editedType={editedType}
        setEditedType={setEditedType}
        editedContent={editedContent}
        setEditedContent={setEditedContent}
        saveEditedTile={saveEditedTile}
      />
    </SafeAreaView>
  );
}

export default DetailsScreen;
