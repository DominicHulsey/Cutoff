import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Pressable, 
  Alert, 
  StatusBar, 
  SafeAreaView 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS } from '../src/constants/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Tile = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
};

// Modern color palette
const COLORS = {
  primary: '#2A7D4F',       // Main green color
  secondary: '#F4F4F2',     // Light background
  accent: '#FFD84D',        // Yellow accent
  text: '#333333',          // Dark text
  lightText: '#666666',     // Secondary text
};

const defaultTiles: Tile[] = [
  { id: '1', icon: 'walk-outline', title: 'Take a walk', subtitle: 'Clear your mind', color: COLORS.primary },
  { id: '2', icon: 'water-outline', title: 'Drink water', subtitle: 'Stay hydrated', color: COLORS.primary },
  { id: '3', icon: 'musical-notes-outline', title: 'Listen to music', subtitle: 'Find calm', color: COLORS.primary },
  { id: '4', icon: 'leaf-outline', title: 'Step outside', subtitle: 'Feel the air', color: COLORS.primary },
  { id: '5', icon: 'pencil-outline', title: 'Journal', subtitle: 'Write it out', color: COLORS.primary },
  { id: '6', icon: 'medkit-outline', title: 'Breathe deeply', subtitle: 'Reset your body', color: COLORS.primary },
];

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTile, setNewTile] = useState<Partial<Tile>>({});
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [tileToDelete, setTileToDelete] = useState<string | null>(null);

  // Load tiles from storage on component mount
  useEffect(() => {
    const loadTiles = async () => {
      try {
        const stored = await AsyncStorage.getItem('tiles');
        if (stored) {
          setTiles(JSON.parse(stored));
        } else {
          setTiles(defaultTiles);
        }
      } catch (error) {
        console.error('Error loading tiles:', error);
        setTiles(defaultTiles);
      }
    };
    
    loadTiles();
  }, []);

  // Save tiles to storage whenever they change
  useEffect(() => {
    AsyncStorage.setItem('tiles', JSON.stringify(tiles));
  }, [tiles]);

  // Handle adding a new tile
  const handleAddTile = () => {
    if (!newTile.title || !newTile.subtitle) {
      Alert.alert('Missing Information', 'Please provide both a title and subtitle.');
      return;
    }

    const newTileComplete: Tile = {
      id: Date.now().toString(),
      icon: newTile.icon || 'leaf-outline',
      title: newTile.title,
      subtitle: newTile.subtitle,
      color: COLORS.primary,
    };

    setTiles(prev => [...prev, newTileComplete]);
    setNewTile({});
    setModalVisible(false);
  };

  // Handle confirming tile deletion
  const confirmDeleteTile = (id: string) => {
    setTileToDelete(id);
    setDeleteConfirmVisible(true);
  };

  // Handle actual tile deletion
  const handleDeleteTile = () => {
    if (tileToDelete) {
      setTiles(prev => prev.filter(tile => tile.id !== tileToDelete));
      setTileToDelete(null);
    }
    setDeleteConfirmVisible(false);
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setTileToDelete(null);
    setDeleteConfirmVisible(false);
  };

  // Render individual tile
  const renderTile = ({ item }: { item: Tile }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => navigation.navigate('Details', { tile: item })}
      activeOpacity={0.7}
    >
      {item.id === 'add' ? (
        <View style={styles.addTileContent}>
          <View style={styles.addButtonCircle}>
            <Text style={styles.addButtonText}>+</Text>
          </View>
          <Text style={styles.addTileText}>Add New Tile</Text>
        </View>
      ) : (
        <LinearGradient
          colors={['#E8F5E9', '#2A7D4F']} 
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.tileContent}
        >
          <Text style={styles.tileTitle}>{item.title}</Text>
          <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.header, { marginTop: insets.top / 2 }]}>
        <Text style={[styles.greeting, { textAlign: 'center' }]}>{"What's on your mind?"}</Text>
      </View>
      
      <FlatList
        data={[...tiles, { id: 'add', icon: '', title: '', subtitle: '', color: '' } as Tile]}
        renderItem={renderTile}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tileGrid}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Add Tile Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Tile</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newTile.title}
              onChangeText={text => setNewTile(prev => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Subtitle"
              value={newTile.subtitle}
              onChangeText={text => setNewTile(prev => ({ ...prev, subtitle: text }))}
            />
            
            <View style={styles.btnRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelModalBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={handleAddTile}
              >
                <Text style={styles.modalBtnText}>Add</Text>
              </TouchableOpacity>
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
            <Text style={styles.confirmTitle}>Delete Tile</Text>
            <Text style={styles.confirmText}>Are you sure you want to delete this tile?</Text>
            
            <View style={styles.btnRow}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    paddingTop: 10,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 28,
    fontFamily: FONTS.light,
    color: COLORS.text,
    marginBottom: 20,
  },
  tileGrid: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tile: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tileContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTileContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 125, 79, 0.1)',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 16,
  },
  tileTitle: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  tileSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  addButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 28,
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
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    fontFamily: FONTS.regular,
    width: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  cancelModalBtn: {
    backgroundColor: '#f0f0f0',
  },
  cancelModalBtnText: {
    color: '#333',
    fontSize: 16,
    fontFamily: FONTS.medium,
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
    marginBottom: 15,
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
});
