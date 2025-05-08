import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable, ImageBackground, Dimensions, StatusBar, SafeAreaView, Linking } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import DraggableResizableTile from './DraggableResizableTile';
// import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const corkboardBg = require('../assets/corkboard.png'); // Place a corkboard.jpg in your assets folder

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
};

// Generate default tiles based on the home tile that was tapped
const generateDefaultTiles = (homeTile: any): CorkTile[] => [
  { 
    id: '1', 
    type: 'quote', 
    content: homeTile.title, 
    x: 40, 
    y: 120, 
    width: 180, 
    height: 100, 
    rotation: 0 
  },
  { 
    id: '2', 
    type: 'quote', 
    content: homeTile.subtitle, 
    x: 100, 
    y: 300, 
    width: 180, 
    height: 100, 
    rotation: 0 
  },
];

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
  const [editingTile, setEditingTile] = useState<{id: string, type: string, content: string} | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedType, setEditedType] = useState<TileType>('quote');
  
  // Create a unique storage key for each home tile's detail page
  const storageKey = `detail_tiles_${tile.id}`;

  const handleAddTile = () => {
    if (!newContent.trim()) return;
    setTiles(prev => [
      ...prev,
      { id: Date.now().toString(), type: newType, content: newContent.trim(), x: 60, y: 60, width: 180, height: 100, rotation: 0 },
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
    }, [tile.id])
  );
  
  // Save tiles to storage whenever they change
  useEffect(() => {
    if (!isLoading && tiles.length > 0) {
      AsyncStorage.setItem(storageKey, JSON.stringify(tiles));
    }
  }, [tiles, storageKey, isLoading]);

  // Handler to update tile position, size, or rotation
  const updateTile = (id: string, updates: Partial<CorkTile>) => {
    setTiles(prev => prev.map(tile => tile.id === id ? { ...tile, ...updates } : tile));
  };
  
  // Handler to duplicate a tile
  const duplicateTile = (id: string) => {
    const tileToDuplicate = tiles.find(tile => tile.id === id);
    if (tileToDuplicate) {
      // Create a new tile with the same properties but slightly offset position
      const newTile: CorkTile = {
        ...tileToDuplicate,
        id: Date.now().toString(),
        x: tileToDuplicate.x + 20,
        y: tileToDuplicate.y + 20,
      };
      setTiles(prev => [...prev, newTile]);
    }
  };
  
  // Handler to delete a tile
  const deleteTile = (id: string) => {
    setTiles(prev => prev.filter(tile => tile.id !== id));
  };
  
  // Handler to edit a tile
  const editTile = (id: string, type: string, content: string) => {
    setEditingTile({ id, type, content });
    setEditedContent(content);
    setEditedType(type as TileType);
    setEditModalVisible(true);
  };
  
  // Handler to save edited tile
  const saveEditedTile = () => {
    if (editingTile && editedContent.trim()) {
      setTiles(prev => prev.map(tile => {
        if (tile.id === editingTile.id) {
          return {
            ...tile,
            type: editedType,
            content: editedContent.trim()
          };
        }
        return tile;
      }));
      
      // Reset edit state
      setEditModalVisible(false);
      setEditingTile(null);
      setEditedContent('');
    }
  };


  const moveTile = (from: number, to: number) => {
    if (to < 0 || to >= tiles.length) return;
    const updated = [...tiles];
    const moved = updated.splice(from, 1)[0];
    updated.splice(to, 0, moved);
    setTiles(updated);
  };

  const renderTile = ({ item, index }: { item: CorkTile; index: number }) => (
    <View style={styles.tile}>
      {item.type === 'quote' && (
        <Text style={styles.quoteText}>“{item.content}”</Text>
      )}
      {item.type === 'link' && (
        <Text style={styles.linkText} numberOfLines={2} onPress={() => {}}>
          {item.content}
        </Text>
      )}
      {item.type === 'youtube' && (
        <TouchableOpacity
          style={styles.youtubeWrap}
          onPress={() => {
            // Open YouTube link in browser
            const url = item.content;
            if (url) {
              Linking.openURL(url);
            }
          }}
          activeOpacity={0.85}
        >
          <ImageBackground
            source={{ uri: getYouTubeThumbnail(item.content) }}
            style={{ width: 220, height: 124, borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}
            imageStyle={{ borderRadius: 8 }}
          >
          </ImageBackground>
          <Text style={{ color: '#b97a56', marginTop: 4, textAlign: 'center', fontSize: 13 }}>Tap to open video</Text>
        </TouchableOpacity>
      )}
      <View style={styles.moveBtnRow}>
        <TouchableOpacity onPress={() => moveTile(index, index - 1)} disabled={index === 0} style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => moveTile(index, index + 1)} disabled={index === tiles.length - 1} style={[styles.moveBtn, index === tiles.length - 1 && styles.moveBtnDisabled]}>
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ImageBackground source={corkboardBg} style={styles.bg} resizeMode="cover">
        <TouchableOpacity 
          style={[styles.backButton, { top: insets.top + 10 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        {/* Render each tile absolutely */}
        {!isLoading && tiles.map(detailTile => (
          <DraggableResizableTile
            key={detailTile.id}
            id={detailTile.id}
            x={detailTile.x || 60}
            y={detailTile.y || 60}
            width={detailTile.width || 180}
            height={detailTile.height || 100}
            rotation={detailTile.rotation || 0}
            type={detailTile.type}
            content={detailTile.content}
            onUpdate={updates => updateTile(detailTile.id, updates)}
            onDuplicate={duplicateTile}
            onDelete={deleteTile}
            onEdit={editTile}
          />
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          {/* <Ionicons name="add-circle" size={60} color="#fff" /> */}
        </TouchableOpacity>
      </ImageBackground>
      {/* Modal for adding new tile */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Tile</Text>
            <View style={styles.typeSelector}>
              <Pressable onPress={() => setNewType('quote')} style={[styles.typeButton, newType === 'quote' && styles.typeButtonSelected]}>
                <Text>Quote</Text>
              </Pressable>
              <Pressable onPress={() => setNewType('link')} style={[styles.typeButton, newType === 'link' && styles.typeButtonSelected]}>
                <Text>Link</Text>
              </Pressable>
              <Pressable onPress={() => setNewType('youtube')} style={[styles.typeButton, newType === 'youtube' && styles.typeButtonSelected]}>
                <Text>YouTube</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${newType === 'quote' ? 'quote' : newType === 'link' ? 'link URL' : 'YouTube URL'}`}
              value={newContent}
              onChangeText={setNewContent}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddTile} style={styles.modalAdd}>
                <Text>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Tile</Text>
            <View style={styles.typeSelector}>
              <Pressable onPress={() => setEditedType('quote')} style={[styles.typeButton, editedType === 'quote' && styles.typeButtonSelected]}>
                <Text>Quote</Text>
              </Pressable>
              <Pressable onPress={() => setEditedType('link')} style={[styles.typeButton, editedType === 'link' && styles.typeButtonSelected]}>
                <Text>Link</Text>
              </Pressable>
              <Pressable onPress={() => setEditedType('youtube')} style={[styles.typeButton, editedType === 'youtube' && styles.typeButtonSelected]}>
                <Text>YouTube</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${editedType === 'quote' ? 'quote' : editedType === 'link' ? 'link URL' : 'YouTube URL'}`}
              value={editedContent}
              onChangeText={setEditedContent}
              multiline={editedType === 'quote'}
              numberOfLines={editedType === 'quote' ? 3 : 1}
              autoCapitalize={editedType === 'quote' ? 'sentences' : 'none'}
              keyboardType={editedType !== 'quote' ? 'url' : 'default'}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCancel}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEditedTile} style={styles.modalAdd}>
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getYouTubeThumbnail(url: string) {
  const match = url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : undefined;
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  corkContainer: {
    padding: 24,
    paddingBottom: 120,
    minHeight: windowHeight,
  },
  tile: {
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
    minWidth: 220,
    maxWidth: windowWidth * 0.8,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  activeTile: {
    opacity: 0.7,
    transform: [{ scale: 1.03 }],
  },
  quoteText: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#6d4c1b',
    textAlign: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#2a6edb',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  youtubeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 4,
  },
  addBtn: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    zIndex: 10,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    backgroundColor: '#fffbe6',
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b97a56',
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  typeBtnActive: {
    backgroundColor: '#f7b267',
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#fafcff',
    width: 240,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: '#f7b267',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  moveBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 12,
  },
  moveBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f7e7c1',
    marginHorizontal: 2,
  },
  moveBtnDisabled: {
    backgroundColor: '#f0ede5',
  },
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginVertical: 8,
    justifyContent: 'space-between',
  },
  typeButton: {
    backgroundColor: '#eee',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  typeButtonSelected: {
    backgroundColor: '#f7b267',
  },
  modalCancel: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  modalAdd: {
    backgroundColor: '#f7b267',
    padding: 10,
    borderRadius: 6,
  },
});
