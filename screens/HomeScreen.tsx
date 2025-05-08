import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable, Alert, ScrollView, StatusBar, SafeAreaView, Image } from 'react-native';
import { FONTS } from '../src/constants/fonts';
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

const defaultTiles: Tile[] = [
  { id: '1', icon: 'walk-outline', title: 'Take a walk', subtitle: 'Clear your mind', color: COLORS.cardBg1 },
  { id: '2', icon: 'water-outline', title: 'Drink water', subtitle: 'Stay hydrated', color: COLORS.cardBg2 },
  { id: '3', icon: 'musical-notes-outline', title: 'Listen to music', subtitle: 'Find calm', color: COLORS.cardBg3 },
  { id: '4', icon: 'leaf-outline', title: 'Step outside', subtitle: 'Feel the air', color: COLORS.cardBg4 },
  { id: '5', icon: 'pencil-outline', title: 'Journal', subtitle: 'Write it out', color: COLORS.cardBg1 },
  { id: '6', icon: 'medkit-outline', title: 'Breathe deeply', subtitle: 'Reset your body', color: COLORS.cardBg2 },
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
      <View style={styles.tileContent}>
        {item.imageUrl ? (
          <View style={styles.tileImageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.tileImage} />
          </View>
        ) : (
          <View style={styles.tileIconWrap}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>{item.title.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        )}
        <Text style={styles.tileTitle}>{item.title}</Text>
        <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
      </View>
      
      {/* Action buttons */}
      <View style={styles.tileActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => openImagePromptModal(item.id)}
        >
          <Text style={styles.actionButtonText}>🖼️</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => confirmDeleteTile(item.id)}
        >
          <Text style={styles.actionButtonText}>×</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: 24 }}>
        
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={[styles.greeting, { marginTop: insets.top / 2, textAlign: 'center' }]}>{"What's on your mind?"}</Text>
      </View>
      <FlatList
        data={[...tiles, { id: 'add', icon: '', title: '', subtitle: '', color: '' } as Tile]}
        renderItem={({ item }) =>
          item.id === 'add' ? (
            <TouchableOpacity
              style={[styles.tile, styles.addTile]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.addButtonCircle}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
              <Text style={styles.addTileText}>Add New</Text>
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
         </View>
 </SafeAreaView>
  );
}

// Function to get a color for the pushpin based on tile ID
const getPushpinColor = (id: string) => {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
  const numericId = parseInt(id, 10) || 0;
  return colors[numericId % colors.length];
};

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    paddingTop: 10,
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  greeting: {
    fontSize: 28,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tileGrid: {
    paddingBottom: 20,
  },
  tile: {
    width: '48%',
    aspectRatio: 0.9,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  tileContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
  },
  tileIconWrap: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tileTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  tileSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.lightText,
    textAlign: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: 'rgba(255,59,48,0.1)',
  },
  actionButtonText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  tileLongPress: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  tileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addTile: {
    backgroundColor: 'rgba(42, 125, 79, 0.1)',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 32,
    fontFamily: FONTS.bold,
  },
  addTileText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: FONTS.semiBold,
    marginBottom: 10,
    color: '#333',
  },
  confirmText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666',
    textAlign: 'center',
    shadowRadius: 15,
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
    fontFamily: FONTS.medium,
  },
  deleteConfirmBtn: {
    backgroundColor: '#FF3B30',
  },
  deleteConfirmText: {
    color: '#fff',
    fontFamily: FONTS.medium,
  },
  iconDropdown: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#fafcff',
    width: 240,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    fontFamily: FONTS.regular,
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
  modalBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modalBtnText: {
    color: '#fff',
    fontFamily: FONTS.medium,
  }
});
