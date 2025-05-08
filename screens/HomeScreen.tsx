import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable, Alert, ScrollView, StatusBar, SafeAreaView, Image } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Tile = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  imageUrl?: string;
};

const defaultTiles: Tile[] = [
  { id: '1', icon: 'walk-outline', title: 'Take a walk', subtitle: 'Clear your mind', color: '#FFE5B4' },
  { id: '2', icon: 'water-outline', title: 'Drink water', subtitle: 'Stay hydrated', color: '#D0F0C0' },
  { id: '3', icon: 'musical-notes-outline', title: 'Listen to music', subtitle: 'Find calm', color: '#F2D0F7' },
  { id: '4', icon: 'leaf-outline', title: 'Step outside', subtitle: 'Feel the air', color: '#B4E0FF' },
  { id: '5', icon: 'pencil-outline', title: 'Journal', subtitle: 'Write it out', color: '#F7D6E0' },
  { id: '6', icon: 'medkit-outline', title: 'Breathe deeply', subtitle: 'Reset your body', color: '#F9F5B4' },
];

const IONICON_OPTIONS = [
  'walk-outline', 'water-outline', 'musical-notes-outline', 'leaf-outline', 'pencil-outline', 'medkit-outline',
  'book-outline', 'sunny-outline', 'moon-outline', 'heart-outline', 'happy-outline', 'sad-outline',
  'alarm-outline', 'bicycle-outline', 'cafe-outline', 'cloud-outline', 'flame-outline', 'flower-outline',
  'glasses-outline', 'hand-left-outline', 'headset-outline', 'ice-cream-outline', 'key-outline', 'rocket-outline',
  'star-outline', 'tennisball-outline', 'umbrella-outline', 'wine-outline', 'color-palette-outline', 'camera-outline',
];

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tiles, setTiles] = React.useState<Tile[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [newTile, setNewTile] = React.useState<Partial<Tile>>({});
  const [iconDropdownOpen, setIconDropdownOpen] = React.useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState(false);
  const [tileToDelete, setTileToDelete] = React.useState<string | null>(null);
  const [isLongPressing, setIsLongPressing] = React.useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  const [imagePrompt, setImagePrompt] = React.useState('');
  const [imageModalVisible, setImageModalVisible] = React.useState(false);
  const [tileForImage, setTileForImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('tiles');
      if (stored) setTiles(JSON.parse(stored));
      else setTiles(defaultTiles);
    })();
  }, []);

  React.useEffect(() => {
    AsyncStorage.setItem('tiles', JSON.stringify(tiles));
  }, [tiles]);

  const handleAddTile = () => {
    if (!newTile.icon || !newTile.title || !newTile.subtitle || !newTile.color) {
      Alert.alert('All fields are required');
      return;
    }
    setTiles(prev => [
      ...prev,
      { ...newTile, id: Date.now().toString() } as Tile,
    ]);
    setNewTile({});
    setModalVisible(false);
  };

  const confirmDeleteTile = (id: string) => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
    setTileToDelete(id);
    setDeleteConfirmVisible(true);
  };
  
  const handleDeleteTile = () => {
    if (tileToDelete) {
      setTiles(prev => prev.filter(t => t.id !== tileToDelete));
      setTileToDelete(null);
      setDeleteConfirmVisible(false);
    }
  };
  
  const cancelDelete = () => {
    setTileToDelete(null);
    setDeleteConfirmVisible(false);
  };
  
  const handleLongPress = (id: string) => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
    setIsLongPressing(id);
    setTimeout(() => setIsLongPressing(null), 500);
  };
  
  // Generate AI image for a tile
  const openImagePromptModal = (id: string) => {
    setTileForImage(id);
    setImagePrompt('');
    setImageModalVisible(true);
  };
  
  // Generate image using pollinations.ai
  const generateImage = async () => {
    if (!imagePrompt.trim() || !tileForImage) return;
    
    try {
      setIsGeneratingImage(true);
      
      // Encode the prompt for URL
      const encodedPrompt = encodeURIComponent(imagePrompt.trim());
      
      // Create the image URL from pollinations.ai
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
      
      // Update the tile with the image URL
      setTiles(prev => prev.map(tile => {
        if (tile.id === tileForImage) {
          return { ...tile, imageUrl };
        }
        return tile;
      }));
      
      // Close modal and reset state
      setImageModalVisible(false);
      setTileForImage(null);
      setImagePrompt('');
      
      // Save the updated tiles to AsyncStorage
      AsyncStorage.setItem('tiles', JSON.stringify(
        tiles.map(t => t.id === tileForImage ? { ...t, imageUrl } : t)
      ));
      
    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const renderTile = ({ item }: { item: Tile }) => (
    <TouchableOpacity
      style={[
        styles.tile, 
        { backgroundColor: item.color },
        isLongPressing === item.id && styles.tileLongPress
      ]}
      onPress={() => navigation.navigate('Details', { tile: item })}
      onLongPress={() => handleLongPress(item.id)}
      delayLongPress={500}
      activeOpacity={0.85}
    >
      {/* Pushpin at the top */}
      <View style={styles.pushpinContainer}>
        <View style={[styles.pushpin, { backgroundColor: getPushpinColor(item.id) }]} />
      </View>
      
      {item.imageUrl ? (
        <View style={styles.tileImageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.tileImage} />
        </View>
      ) : (
        <View style={styles.tileIconWrap}>
          {/* <Ionicons name={item.icon as any} size={44} color="#2d2d2d" /> */}
        </View>
      )}
      <Text style={styles.tileTitle}>{item.title}</Text>
      <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
      
      {/* Image generation button */}
      <Pressable
        style={styles.imageGenBtn}
        onPress={() => openImagePromptModal(item.id)}
      >
        <Text style={styles.imageGenBtnText}>🖼️</Text>
      </Pressable>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => confirmDeleteTile(item.id)}
      >
        <Text style={styles.deleteBtnText}>×</Text>
      </Pressable>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Text style={[styles.greeting, { marginTop: insets.top }]}>Good Afternoon 🌞</Text>
      <FlatList
        data={[...tiles, { id: 'add', icon: '', title: '', subtitle: '', color: '' } as Tile]}
        renderItem={({ item }) =>
          item.id === 'add' ? (
            <TouchableOpacity
              style={[styles.tile, styles.addTile]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              {/* <Ionicons name="add" size={44} color="#4A90E2" style={{ marginBottom: 8 }} /> */}
              <Text style={styles.addTileText}>Add</Text>
            </TouchableOpacity>
          ) : renderTile({ item })
        }
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.tileGrid}
      />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Add New Tile</Text>
            <Pressable
              style={styles.input}
              onPress={() => setIconDropdownOpen(!iconDropdownOpen)}
            >
              <Text style={{ color: newTile.icon ? '#222' : '#aaa' }}>
                {newTile.icon ? newTile.icon : 'Pick an icon'}
              </Text>
            </Pressable>
            {iconDropdownOpen && (
              <ScrollView style={styles.iconDropdown}>
                {IONICON_OPTIONS.map(iconName => (
                  <Pressable
                    key={iconName}
                    style={styles.iconOption}
                    onPress={() => {
                      setNewTile(nt => ({ ...nt, icon: iconName }));
                      setIconDropdownOpen(false);
                    }}
                  >
                    {/* <Ionicons name={iconName as any} size={22} color="#222" style={{ marginRight: 8 }} /> */}
                    <Text>{iconName}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <TextInput
              placeholder="Title"
              value={newTile.title || ''}
              onChangeText={text => setNewTile(nt => ({ ...nt, title: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Subtitle"
              value={newTile.subtitle || ''}
              onChangeText={text => setNewTile(nt => ({ ...nt, subtitle: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Color (hex or color name)"
              value={newTile.color || ''}
              onChangeText={text => setNewTile(nt => ({ ...nt, color: text }))}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Pressable style={styles.modalBtn} onPress={handleAddTile}>
                <Text style={{ color: '#fff' }}>Add</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#ccc' }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#333' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalBg}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmTitle}>Delete Tile?</Text>
            <Text style={styles.confirmText}>This action cannot be undone.</Text>
            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.cancelBtn]} 
                onPress={cancelDelete}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.deleteConfirmBtn]} 
                onPress={handleDeleteTile}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Generation Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Generate AI Image</Text>
            <TextInput
              placeholder="Describe the image you want"
              value={imagePrompt}
              onChangeText={setImagePrompt}
              style={styles.input}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Pressable 
                style={[styles.modalBtn, { backgroundColor: '#ccc' }]} 
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={{ color: '#333' }}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalBtn, isGeneratingImage && { opacity: 0.7 }]} 
                onPress={generateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
              >
                <Text style={{ color: '#fff' }}>
                  {isGeneratingImage ? 'Generating...' : 'Generate'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Function to get a color for the pushpin based on tile ID
const getPushpinColor = (id: string) => {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
  const numericId = parseInt(id, 10) || 0;
  return colors[numericId % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tileGrid: {
    paddingBottom: 20,
  },
  tile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 4,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 18,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    // Sticky note appearance
    backgroundColor: '#fff9c4',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingTop: 24, // Space for pushpin
  },
  tileIconWrap: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  addTile: {
    backgroundColor: '#e7f0fd',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginTop: 2,
    textAlign: 'center',
  },
  tileSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  deleteBtnText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  tileLongPress: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  pushpinContainer: {
    position: 'absolute',
    top: 5,
    alignSelf: 'center',
    zIndex: 10,
  },
  pushpin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e74c3c',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 1,
    elevation: 2,
  },
  confirmModalContent: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  confirmText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: '500',
  },
  deleteConfirmBtn: {
    backgroundColor: '#FF3B30',
  },
  deleteConfirmText: {
    color: '#fff',
    fontWeight: '500',
  },
  tileImageContainer: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGenBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  imageGenBtnText: {
    fontSize: 16,
  },
  addBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'transparent',
    borderRadius: 28,
    elevation: 5,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#fafcff',
  },
  iconDropdown: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 10,
    marginTop: 2,
  },
  iconOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalBtn: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
