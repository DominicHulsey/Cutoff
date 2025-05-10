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
  Pressable
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

export default function DetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { tile } = route.params;
  const [tiles, setTiles] = useState<CorkTile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState<TileType>('quote');
  const [newContent, setNewContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // State for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTile, setEditingTile] = useState<{id: string, type: TileType, content: string} | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedType, setEditedType] = useState<TileType>('quote');
  
  // Create a unique storage key for each home tile's detail page
  const storageKey = `detail_tiles_${tile.id}`;

  // Animation values for tiles
  const tileAnimations = useRef<{
    [key: string]: {
      pan: Animated.ValueXY;
      scale: Animated.Value;
      rotate: Animated.Value;
      panResponder: any;
    };
  }>({}).current;

  const handleAddTile = () => {
    if (!newContent.trim()) return;
    setTiles(prev => [
      ...prev,
      { 
        id: Date.now().toString(), 
        type: newType, 
        content: newContent.trim(), 
        x: 60, 
        y: 60, 
        width: 180, 
        height: 100, 
        rotation: 0,
        zIndex: prev.length + 1 // New tiles appear on top
      },
    ]);
    setNewContent('');
    setNewType('quote');
    setModalVisible(false);
  };

  // Load tiles from storage when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadTiles = async () => {
        try {
          setIsLoading(true);
          const storedTiles = await AsyncStorage.getItem(storageKey);
          if (storedTiles) {
            setTiles(JSON.parse(storedTiles));
          } else {
            // If no stored tiles, generate default ones based on the home tile
            setTiles(generateDefaultTiles(tile));
          }
        } catch (error) {
          console.error('Error loading tiles:', error);
          // Fallback to default tiles if there's an error
          setTiles(generateDefaultTiles(tile));
        } finally {
          setIsLoading(false);
        }
      };
      
      loadTiles();
    }, [tile, storageKey])
  );

  // Save tiles to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(storageKey, JSON.stringify(tiles));
    }
  }, [tiles, storageKey, isLoading]);

  // Handler to update tile position, size, or rotation
  const updateTile = (id: string, updates: Partial<CorkTile>) => {
    setTiles(prev => prev.map(tile => tile.id === id ? { ...tile, ...updates } : tile));
  };

  // Initialize or update tile animations when tiles change
  useEffect(() => {
    // Create animations for new tiles
    tiles.forEach(tile => {
      if (!tileAnimations[tile.id]) {
        const pan = new Animated.ValueXY({ x: 0, y: 0 });
        const scale = new Animated.Value(1);
        const rotate = new Animated.Value(tile.rotation);

        // Create pan responder for this tile
        const panResponder = PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            // Bring tile to front when touched
            updateTile(tile.id, { zIndex: Math.max(...tiles.map(t => t.zIndex)) + 1 });
            // Start scale animation
            Animated.spring(scale, {
              toValue: 1.05,
              friction: 5,
              useNativeDriver: true
            }).start();
          },
          onPanResponderMove: Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
          ),
          onPanResponderRelease: (_, gestureState) => {
            // Update tile position in state
            updateTile(tile.id, { 
              x: tile.x + gestureState.dx, 
              y: tile.y + gestureState.dy 
            });
            // Reset animated values
            pan.setValue({ x: 0, y: 0 });
            // End scale animation
            Animated.spring(scale, {
              toValue: 1,
              friction: 5,
              useNativeDriver: true
            }).start();
          }
        });

        tileAnimations[tile.id] = { pan, scale, rotate, panResponder };
      }
    });
  }, [tiles]);

  // Handler to duplicate a tile
  const duplicateTile = (id: string) => {
    const tileToDuplicate = tiles.find(t => t.id === id);
    if (tileToDuplicate) {
      const newTile = {
        ...tileToDuplicate,
        id: Date.now().toString(),
        x: tileToDuplicate.x + 20,
        y: tileToDuplicate.y + 20,
        zIndex: Math.max(...tiles.map(t => t.zIndex)) + 1
      };
      setTiles(prev => [...prev, newTile]);
    }
  };

  // Handler to delete a tile
  const deleteTile = (id: string) => {
    setTiles(prev => prev.filter(tile => tile.id !== id));
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
      setTiles(prev => 
        prev.map(tile => 
          tile.id === editingTile.id 
            ? { ...tile, content: editedContent.trim(), type: editedType } 
            : tile
        )
      );
      setEditModalVisible(false);
      setEditingTile(null);
      setEditedContent('');
    }
  };

  // Handler for resizing a tile
  const handleResize = (id: string, newWidth: number, newHeight: number) => {
    updateTile(id, { 
      width: Math.max(100, newWidth), // Minimum width
      height: Math.max(60, newHeight) // Minimum height
    });
  };

  // Handler for rotating a tile
  const handleRotate = (id: string, newRotation: number) => {
    updateTile(id, { rotation: newRotation });
    if (tileAnimations[id]) {
      tileAnimations[id].rotate.setValue(newRotation);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.header, { marginTop: insets.top / 2 }]}>
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
        contentContainerStyle={styles.scrollContainer}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.workspaceContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              {tiles.map((item) => {
                const animation = tileAnimations[item.id];
                if (!animation) return null;
                
                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.draggableTile,
                      {
                        left: item.x,
                        top: item.y,
                        width: item.width,
                        height: item.height,
                        zIndex: item.zIndex,
                        transform: [
                          { translateX: animation.pan.x },
                          { translateY: animation.pan.y },
                          { scale: animation.scale },
                          { rotate: animation.rotate.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg']
                          })}
                        ]
                      }
                    ]}
                    {...animation.panResponder.panHandlers}
                  >
                    <View style={styles.tileContent}>
                      {item.type === 'quote' && (
                        <Text style={styles.tileText}>{item.content}</Text>
                      )}
                      
                      {item.type === 'link' && (
                        <TouchableOpacity 
                          onPress={() => Linking.openURL(item.content)}
                          style={styles.linkContainer}
                        >
                          <Text style={styles.linkText}>{item.content}</Text>
                        </TouchableOpacity>
                      )}
                      
                      {item.type === 'youtube' && (
                        <TouchableOpacity 
                          onPress={() => {
                            const videoId = getYouTubeVideoId(item.content);
                            if (videoId) {
                              Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
                            }
                          }}
                          style={styles.youtubeContainer}
                        >
                          <Text style={styles.linkText}>{item.content}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Tile controls */}
                    <View style={styles.tileControls}>
                      <TouchableOpacity 
                        style={styles.tileControlButton}
                        onPress={() => editTile(item.id, item.type, item.content)}
                      >
                        <Text style={styles.tileControlButtonText}>Edit</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.tileControlButton}
                        onPress={() => duplicateTile(item.id)}
                      >
                        <Text style={styles.tileControlButtonText}>Copy</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.tileControlButton, styles.deleteButton]}
                        onPress={() => deleteTile(item.id)}
                      >
                        <Text style={styles.tileControlButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Resize handle */}
                    <TouchableOpacity 
                      style={styles.resizeHandle}
                      onPressIn={() => {
                        // Create a resize pan responder
                        const resizePanResponder = PanResponder.create({
                          onStartShouldSetPanResponder: () => true,
                          onPanResponderMove: (_, gestureState) => {
                            const newWidth = item.width + gestureState.dx;
                            const newHeight = item.height + gestureState.dy;
                            handleResize(item.id, newWidth, newHeight);
                          },
                          onPanResponderRelease: () => {}
                        });
                        
                        // Apply the resize pan responder
                        resizePanResponder?.panHandlers?.onResponderGrant();
                      }}
                    >
                      <View style={styles.resizeHandleIcon} />
                    </TouchableOpacity>
                    
                    {/* Rotate handle */}
                    <TouchableOpacity 
                      style={styles.rotateHandle}
                      onPressIn={() => {
                        // Create a rotation pan responder
                        const rotatePanResponder = PanResponder.create({
                          onStartShouldSetPanResponder: () => true,
                          onPanResponderMove: (_, gestureState) => {
                            const newRotation = (item.rotation + gestureState.dx) % 360;
                            handleRotate(item.id, newRotation);
                          },
                          onPanResponderRelease: () => {}
                        });
                        
                        // Apply the rotation pan responder
                        rotatePanResponder.panHandlers.onResponderGrant();
                      }}
                    >
                      <View style={styles.rotateHandleIcon} />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginLeft: 12,
  },
  scrollContainer: {
    minWidth: windowWidth,
    minHeight: windowHeight - 100,
  },
  workspaceContainer: {
    width: windowWidth * 3, // Make it thrice as wide for horizontal scrolling
    height: windowHeight - 100,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.lightText,
  },
  draggableTile: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tileContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'center',
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
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeHandleIcon: {
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.primary,
  },
  rotateHandle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotateHandleIcon: {
    width: 10,
    height: 10,
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
  },
});
