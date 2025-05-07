import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable, ImageBackground, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableResizableTile from './DraggableResizableTile';
// import * as Linking from 'expo-linking';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

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

const initialTiles: CorkTile[] = [
  { id: '1', type: 'quote', content: 'The best way out is always through. – Robert Frost', x: 40, y: 120, width: 180, height: 100, rotation: 0 },
  { id: '2', type: 'link', content: 'https://www.wikipedia.org/', x: 100, y: 300, width: 180, height: 100, rotation: 0 },
  { id: '3', type: 'youtube', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', x: 220, y: 200, width: 180, height: 100, rotation: 0 },
];

export default function DetailsScreen() {
  const [tiles, setTiles] = useState<CorkTile[]>(initialTiles);
  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState<TileType>('quote');
  const [newContent, setNewContent] = useState('');

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

  // Handler to update tile position, size, or rotation
  const updateTile = (id: string, updates: Partial<CorkTile>) => {
    setTiles(prev => prev.map(tile => tile.id === id ? { ...tile, ...updates } : tile));
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
      {/* {item.type === 'youtube' && (
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
            <Ionicons name="logo-youtube" size={56} color="#fff" style={{ opacity: 0.85 }} />
          </ImageBackground>
          <Text style={{ color: '#b97a56', marginTop: 4, textAlign: 'center', fontSize: 13 }}>Tap to open video</Text>
        </TouchableOpacity>
      )} */}
      <View style={styles.moveBtnRow}>
        <TouchableOpacity onPress={() => moveTile(index, index - 1)} disabled={index === 0} style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}>
          <Ionicons name="arrow-up" size={20} color={index === 0 ? '#ccc' : '#b97a56'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => moveTile(index, index + 1)} disabled={index === tiles.length - 1} style={[styles.moveBtn, index === tiles.length - 1 && styles.moveBtnDisabled]}>
          <Ionicons name="arrow-down" size={20} color={index === tiles.length - 1 ? '#ccc' : '#b97a56'} />
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground source={corkboardBg} style={styles.bg}>
        {/* Render each tile absolutely */}
        {tiles.map(tile => (
          <DraggableResizableTile
            key={tile.id}
            id={tile.id}
            x={tile.x || 60}
            y={tile.y || 60}
            width={tile.width || 180}
            height={tile.height || 100}
            rotation={tile.rotation || 0}
            type={tile.type}
            content={tile.content}
            onUpdate={updates => updateTile(tile.id, updates)}
          />
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={60} color="#fff" />
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
    resizeMode: 'cover',
    justifyContent: 'center',
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
