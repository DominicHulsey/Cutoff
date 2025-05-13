import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  PanResponder,
  Linking,
  Pressable,
  Alert,
} from 'react-native';
import {FONTS} from '../src/constants/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

// Modern color palette
const COLORS = {
  primary: '#2A7D4F', // Main green color
  secondary: '#F4F4F2', // Light background
  accent: '#FFD84D', // Yellow accent
  text: '#333333', // Dark text
  lightText: '#666666', // Secondary text
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

type TileType = 'quote' | 'link' | 'youtube';

type CorkTile = {
  id: string;
  type: TileType;
  content: string; // quote text, link URL, or YouTube URL
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number; // Added for stacking order
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Helper function to get YouTube thumbnail
const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/0.jpg`;
};

function DetailsScreen({navigation, route}: Props) {
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
  const isMounted = useRef(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState<TileType>('quote');
  const [newContent, setNewContent] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTile, setEditingTile] = useState<{
    id: string;
    type: TileType;
    content: string;
  } | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedType, setEditedType] = useState<TileType>('quote');

  const createPanResponder = (tileId: string) => {
    const onPanResponderRelease = (updates: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }) => {
      panRefs.current[updates.id]?.flattenOffset();
      scaleRefs.current[updates.id]?.setValue(1);
      panRefs.current[updates.id]?.stopAnimation(
        (finalValue: {x: number; y: number}) => {
          const currentTile = tilesRef.current.find(t => t.id === updates.id); // ✅ Use ref

          if (!currentTile) return;

          const nx = Math.max(
            0,
            Math.min(finalValue.x, windowWidth - currentTile.width),
          );
          const ny = Math.max(
            0,
            Math.min(finalValue.y, windowHeight - 150 - currentTile.height),
          );
          panRefs.current[updates.id].setValue({x: nx, y: ny});

          const updatedTiles = tilesRef.current.map(tileObj =>
            tileObj.id === currentTile.id
              ? {...tileObj, x: nx, y: ny}
              : tileObj,
          );
          saveTiles(updatedTiles);
        },
      );
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scaleRefs.current[tileId]?.setValue(1.07);
        panRefs.current[tileId]?.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, {dx: panRefs.current[tileId].x, dy: panRefs.current[tileId].y}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: () => {
        onPanResponderRelease({
          id: tileId,
          x: (panRefs.current[tileId].x as any)._value,
          y: (panRefs.current[tileId].y as any)._value,
          width: 0,
          height: 0,
          rotation: 0,
        });
      },
    });
  };

  const loadTiles = async () => {
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
      tilesRef.current = loadedTiles; // ✅ Sync ref
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
    if (!newContent.trim()) return;
    const newTile: CorkTile = {
      id: Date.now().toString(),
      type: newType,
      content: newContent.trim(),
      x: 60,
      y: 60,
      width: 180,
      height: 100,
      rotation: 0,
      zIndex: tilesRef.current.length + 1,
    };
    const updated = [...tilesRef.current, newTile];
    setTiles(updated);
    tilesRef.current = updated;
    AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    setNewContent('');
    setNewType('quote');
    setModalVisible(false);
  };

  const deleteTile = (id: string) => {
    const updated = tilesRef.current.filter(tile => tile.id !== id);
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
      const updated = tilesRef.current.map(tile =>
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

  const handleResize = (id: string, newWidth: number, newHeight: number) => {
    const width = Math.max(100, newWidth);
    const height = Math.max(60, newHeight);
    const updated = tilesRef.current.map(tile =>
      tile.id === id ? {...tile, width, height} : tile,
    );
    setTiles(updated);
    tilesRef.current = updated;
    AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleRotate = (id: string, newRotation: number) => {
    const updated = tilesRef.current.map(tile =>
      tile.id === id ? {...tile, rotation: newRotation} : tile,
    );
    setTiles(updated);
    tilesRef.current = updated;
    AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const renderTiles = () => {
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
            width: t.width,
            height: t.height,
            zIndex: t.zIndex,
            transform: [
              {translateX: panRefs.current[t.id]?.x || 0},
              {translateY: panRefs.current[t.id]?.y || 0},
              {scale: scaleRefs.current[t.id] || 1},
            ],
          },
        ]}
        {...(panResponderRefs.current[t.id]?.panHandlers || {})}>
        <View style={styles.tileContent}>
          <Text style={styles.tileText}>{t.content}</Text>
        </View>
      </Animated.View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderTiles()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContainer: {
    minWidth: windowWidth,
    minHeight: windowHeight - 150,
  },
  workspaceContainer: {
    width: windowWidth,
    height: windowHeight - 150,
    backgroundColor: '#F9F9F9',
    position: 'relative',
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 10,
  },
  tileContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  noTilesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTilesText: {
    fontSize: 18,
    color: '#888',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 40,
  },
  linkContainer: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  youtubeContainer: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  tileControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    opacity: 0.8,
  },
  tileControlButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  tileControlButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  deleteButton: {
    backgroundColor: '#FFEEEE',
  },
  resizeHandle: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 8,
    zIndex: 10,
  },
  resizeHandleIcon: {
    width: 12,
    height: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.primary,
  },
  rotateHandle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomLeftRadius: 8,
    zIndex: 10,
  },
  rotateHandleIcon: {
    width: 12,
    height: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.primary,
  },
  addBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 10,
  },
  addBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  addBtnText: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
  },
  typeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  typeBtnText: {
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 80,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalAddBtnText: {
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
});

export default DetailsScreen;
