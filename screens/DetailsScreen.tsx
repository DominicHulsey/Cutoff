import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable, ImageBackground, Dimensions, StatusBar, SafeAreaView, Linking } from 'react-native';
import { FONTS } from '../src/constants/fonts';
// import { Ionicons } from '@expo/vector-icons';
import DraggableResizableTile from './DraggableResizableTile';
// import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Modern color palette based on the screenshots
const COLORS = {
  primary: '#2A7D4F',       // Main green color
  secondary: '#F4F4F2',     // Light background
  accent: '#FFD84D',        // Yellow accent
  text: '#333333',          // Dark text
  lightText: '#666666',     // Secondary text
  cardBg1: '#E8F5E9',       // Light green card
  cardBg2: '#FFF8E1',       // Light yellow card
  cardBg3: '#E3F2FD',       // Light blue card
  cardBg4: '#F3E5F5',       // Light purple card
};

// Background image (optional)
const corkboardBg = require('../assets/corkboard.png');

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{tile.title}</Text>
        </View>
        
        {/* Render each tile absolutely */}
        {!isLoading && (
          <View style={styles.tilesContainer}>
            {tiles.map((item, index) => renderTile({ item, index }))}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.addBtnInner}>
            <Text style={styles.addBtnText}>+</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
      
      {/* Modal for adding new tile */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Tile</Text>
            
            <View style={styles.typeRow}>
              <TouchableOpacity 
                style={[styles.typeBtn, newType === 'quote' && styles.typeBtnActive]}
                onPress={() => setNewType('quote')}
              >
                <Text style={styles.typeBtnText}>Quote</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, newType === 'link' && styles.typeBtnActive]}
                onPress={() => setNewType('link')}
              >
                <Text style={styles.typeBtnText}>Link</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, newType === 'youtube' && styles.typeBtnActive]}
                onPress={() => setNewType('youtube')}
              >
                <Text style={styles.typeBtnText}>YouTube</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder={newType === 'quote' ? 'Enter quote...' : newType === 'link' ? 'Enter URL...' : 'Enter YouTube URL...'}
              value={newContent}
              onChangeText={setNewContent}
              multiline={newType === 'quote'}
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddTile}>
                <Text style={styles.modalAddBtnText}>Add</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Balance with back button width
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  tilesContainer: {
    padding: 16,
    paddingBottom: 100,
    minHeight: windowHeight,
  },
  tile: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
    minWidth: 220,
    maxWidth: windowWidth * 0.8,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  activeTile: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  quoteText: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  youtubeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 8,
  },
  addBtn: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    zIndex: 10,
  },
  addBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  addBtnText: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 6,
  },
  typeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  typeBtnText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    width: 260,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelBtnText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  modalAddBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modalAddBtnText: {
    color: 'white',
    fontFamily: FONTS.medium,
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
