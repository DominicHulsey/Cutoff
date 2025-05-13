import React, { useState, useRef, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { FONTS } from '../src/constants/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Modern color palette
const COLORS = {
  primary: '#2A7D4F',       // Main green color
  secondary: '#F4F4F2',     // Light background
  accent: '#FFD84D',        // Yellow accent
  text: '#333333',          // Dark text
  lightText: '#666666',     // Secondary text
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

// Generate default tiles based on the home tile that was tapped
const generateDefaultTiles = (homeTile: any): CorkTile[] => [
  { 
    id: 'default-quote-tile',
    type: 'quote', 
    content: homeTile.title || 'Your Inspiring Quote', 
    x: windowWidth * 0.1, // Position towards the left of the initial view
    y: windowHeight * 0.2, 
    width: windowWidth * 0.6, // Make it a bit larger by default
    height: 150, 
    rotation: 0,
    zIndex: 1
  },
];

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper function to get YouTube thumbnail
const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/0.jpg`;
};

function DetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { tile } = route.params;
  const [tiles, setTiles] = useState<CorkTile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const storageKey = `detail_tiles_${tile.id}`;
  const panRefs = useRef<{ [id: string]: Animated.ValueXY }>({});
  const scaleRefs = useRef<{ [id: string]: Animated.Value }>({});
  const panResponderRefs = useRef<{ [id: string]: any }>({});
  const containerRef = useRef<View>(null);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState<TileType>('quote');
  const [newContent, setNewContent] = useState('');
  
  // State for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTile, setEditingTile] = useState<{id: string, type: TileType, content: string} | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedType, setEditedType] = useState<TileType>('quote');
  
  // Animation values for tiles
  const tileAnimations = useRef<{
    [key: string]: {
      pan: Animated.ValueXY;
      scale: Animated.Value;
      rotate: Animated.Value;
      panResponder: any;
    };
  }>({}).current;
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // Load tiles from storage or default
  const loadTiles = async () => {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setTiles(JSON.parse(stored));
      } else {
        setTiles(generateDefaultTiles(tile));
      }
    } catch {
      setTiles(generateDefaultTiles(tile));
    }
    setIsLoading(false);
  };

  // Save tiles to storage
  const saveTiles = async (updated: CorkTile[]) => {
    setTiles(updated);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Initialize pan/scale and panResponder for each tile
  useEffect(() => {
    tiles.forEach(t => {
      if (!panRefs.current[t.id]) {
        panRefs.current[t.id] = new Animated.ValueXY({ x: t.x, y: t.y });
      } else {
        panRefs.current[t.id].setValue({ x: t.x, y: t.y });
      }
      if (!scaleRefs.current[t.id]) {
        scaleRefs.current[t.id] = new Animated.Value(1);
      }
      // PanResponder
      if (!panResponderRefs.current[t.id]) {
        panResponderRefs.current[t.id] = PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            scaleRefs.current[t.id].setValue(1.07);
            panRefs.current[t.id].extractOffset();
          },
          onPanResponderMove: Animated.event([
            null,
            { dx: panRefs.current[t.id].x, dy: panRefs.current[t.id].y }
          ], { useNativeDriver: false }),
          onPanResponderRelease: () => {
            panRefs.current[t.id].flattenOffset();
            scaleRefs.current[t.id].setValue(1);
            panRefs.current[t.id].stopAnimation((finalValue: { x: number; y: number }) => {
              const nx = Math.max(0, Math.min(finalValue.x, windowWidth - t.width));
              const ny = Math.max(0, Math.min(finalValue.y, windowHeight - 150 - t.height));
              panRefs.current[t.id].setValue({ x: nx, y: ny });
              saveTiles(
                tiles.map(tileObj =>
                  tileObj.id === t.id ? { ...tileObj, x: nx, y: ny } : tileObj
                )
              );
            });
          }
        });
      }
    });
    // Clean up removed tiles
    Object.keys(panRefs.current).forEach(id => {
      if (!tiles.find(t => t.id === id)) {
        delete panRefs.current[id];
        delete scaleRefs.current[id];
        delete panResponderRefs.current[id];
      }
    });
  }, [tiles]);

  // Load tiles when the component mounts
  useEffect(() => {
    loadTiles();
  }, []);  // Empty dependency array to only run once on mount
  
  // Reload tiles when the screen is focused or tile/storageKey changes
  useFocusEffect(
    React.useCallback(() => {
      loadTiles();
      return () => {
        // Cleanup
      };
    }, [tile.id])
  );

  // Save tiles to storage whenever component unmounts
  useEffect(() => {
    return () => {
      if (tiles.length > 0) {
        AsyncStorage.setItem(storageKey, JSON.stringify(tiles));
      }
    };
  }, [tiles, storageKey]);

  // Set up component mount/unmount tracking
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handler to add a new tile
  const handleAddTile = () => {
    if (!newContent.trim()) return;
    
    const newTile = { 
      id: Date.now().toString(), 
      type: newType, 
      content: newContent.trim(), 
      x: 60, 
      y: 60, 
      width: 180, 
      height: 100, 
      rotation: 0,
      zIndex: tiles.length + 1 // New tiles appear on top
    };
    
    const updatedTiles = [...tiles, newTile];
    setTiles(updatedTiles);
    
    // Save to storage immediately
    if (isMounted.current) {
      AsyncStorage.setItem(storageKey, JSON.stringify(updatedTiles));
    }
    
    setNewContent('');
    setNewType('quote');
    setModalVisible(false);
  };

  // Handler to delete a tile
  const deleteTile = (id: string) => {
    const updatedTiles = tiles.filter(tile => tile.id !== id);
    setTiles(updatedTiles);
    
    // Save to storage immediately
    if (isMounted.current) {
      AsyncStorage.setItem(storageKey, JSON.stringify(updatedTiles));
    }
    
    // Clean up animation references
    if (tileAnimations[id]) {
      delete tileAnimations[id];
    }
  };

  // Handler to edit a tile
  const editTile = (id: string, type: TileType, content: string) => {
    setEditingTile({ id, type, content });
    setEditedContent(content);
    setEditedType(type);
    setEditModalVisible(true);
  };

  // Handler to save edited tile
  const saveEditedTile = () => {
    if (editingTile && editedContent.trim()) {
      const updatedTiles = tiles.map(tile => 
        tile.id === editingTile.id ? 
        { ...tile, type: editedType, content: editedContent.trim() } : 
        tile
      );
      
      setTiles(updatedTiles);
      
      // Save to storage immediately
      if (isMounted.current) {
        AsyncStorage.setItem(storageKey, JSON.stringify(updatedTiles));
      }
      
      setEditModalVisible(false);
      setEditingTile(null);
      setEditedContent('');
      setEditedType('quote');
    }
  };

  // Handler for resizing a tile
  const handleResize = (id: string, newWidth: number, newHeight: number) => {
    // Ensure minimum size
    const width = Math.max(100, newWidth);
    const height = Math.max(60, newHeight);
    
    // Find the tile we're updating
    const tileToUpdate = tiles.find(t => t.id === id);
    if (tileToUpdate) {
      // Create a new tiles array with the updated tile
      const updatedTiles = tiles.map(tile => 
        tile.id === id ? { ...tile, width, height } : tile
      );
      
      // Update state directly instead of using updateTile
      setTiles(updatedTiles);
      
      // Save to storage
      if (isMounted.current) {
        AsyncStorage.setItem(storageKey, JSON.stringify(updatedTiles));
      }
    }
  };

  // Handler for rotating a tile
  const handleRotate = (id: string, newRotation: number) => {
    // Find the tile we're updating
    const tileToUpdate = tiles.find(t => t.id === id);
    if (tileToUpdate) {
      // Create a new tiles array with the updated tile
      const updatedTiles = tiles.map(tile => 
        tile.id === id ? { ...tile, rotation: newRotation } : tile
      );
      
      // Update state directly instead of using updateTile
      setTiles(updatedTiles);
      
      // Update the animation value
      if (tileAnimations[id]) {
        tileAnimations[id].rotate.setValue(newRotation);
      }
      
      // Save to storage
      if (isMounted.current) {
        AsyncStorage.setItem(storageKey, JSON.stringify(updatedTiles));
      }
    }
  };

  // Render tiles
  const renderTiles = () => {
    if (tiles.length === 0) return (
      <View style={styles.noTilesContainer}><Text style={styles.noTilesText}>No tiles yet!</Text></View>
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
              { translateX: panRefs.current[t.id] ? panRefs.current[t.id].x : 0 },
              { translateY: panRefs.current[t.id] ? panRefs.current[t.id].y : 0 },
              { scale: scaleRefs.current[t.id] || 1 }
            ]
          }
        ]}
        {...(panResponderRefs.current[t.id]?.panHandlers || {})}
      >
        <View style={styles.tileContent}>
          <Text style={styles.tileText}>{t.content}</Text>
        </View>
      </Animated.View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.header, { marginTop: insets.top / 4 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tile.title}</Text>
      </View>
      
      <ScrollView 
        horizontal
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContainer}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View ref={containerRef} style={styles.workspaceContainer}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <>
              {renderTiles()}
            </>
          )}
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.addBtnInner}>
          <Text style={styles.addBtnText}>+</Text>
        </View>
      </TouchableOpacity>
      
      {/* Modal for adding new tile */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Tile</Text>
            
            <View style={styles.typeRow}>
              <Pressable 
                style={[styles.typeBtn, newType === 'quote' && styles.typeBtnActive]}
                onPress={() => setNewType('quote')}
              >
                <Text style={[styles.typeBtnText, newType === 'quote' && styles.typeBtnTextActive]}>Quote</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.typeBtn, newType === 'link' && styles.typeBtnActive]}
                onPress={() => setNewType('link')}
              >
                <Text style={[styles.typeBtnText, newType === 'link' && styles.typeBtnTextActive]}>Link</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.typeBtn, newType === 'youtube' && styles.typeBtnActive]}
                onPress={() => setNewType('youtube')}
              >
                <Text style={[styles.typeBtnText, newType === 'youtube' && styles.typeBtnTextActive]}>YouTube</Text>
              </Pressable>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder={newType === 'quote' ? "Enter quote text..." : newType === 'link' ? "Enter URL..." : "Enter YouTube URL..."}
              value={newContent}
              onChangeText={setNewContent}
              multiline={newType === 'quote'}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalAddBtn}
                onPress={handleAddTile}
              >
                <Text style={styles.modalAddBtnText}>Add Tile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal for editing a tile */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Tile</Text>
            
            <View style={styles.typeRow}>
              <Pressable 
                style={[styles.typeBtn, editedType === 'quote' && styles.typeBtnActive]}
                onPress={() => setEditedType('quote')}
              >
                <Text style={[styles.typeBtnText, editedType === 'quote' && styles.typeBtnTextActive]}>Quote</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.typeBtn, editedType === 'link' && styles.typeBtnActive]}
                onPress={() => setEditedType('link')}
              >
                <Text style={[styles.typeBtnText, editedType === 'link' && styles.typeBtnTextActive]}>Link</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.typeBtn, editedType === 'youtube' && styles.typeBtnActive]}
                onPress={() => setEditedType('youtube')}
              >
                <Text style={[styles.typeBtnText, editedType === 'youtube' && styles.typeBtnTextActive]}>YouTube</Text>
              </Pressable>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder={editedType === 'quote' ? "Enter quote text..." : editedType === 'link' ? "Enter URL..." : "Enter YouTube URL..."}
              value={editedContent}
              onChangeText={setEditedContent}
              multiline={editedType === 'quote'}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalAddBtn}
                onPress={saveEditedTile}
              >
                <Text style={styles.modalAddBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 4 },
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
  }
});

export default DetailsScreen;
