import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable, Alert, ScrollView } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Tile = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
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
  const [tiles, setTiles] = React.useState<Tile[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [newTile, setNewTile] = React.useState<Partial<Tile>>({});
  const [iconDropdownOpen, setIconDropdownOpen] = React.useState(false);

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

  const handleDeleteTile = (id: string) => {
    setTiles(prev => prev.filter(t => t.id !== id));
  };

  const renderTile = ({ item }: { item: Tile }) => (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: item.color }]}
      onPress={() => navigation.navigate('Details', { tile: item })}
      activeOpacity={0.85}
    >
      <View style={styles.tileIconWrap}>
        {/* <Ionicons name={item.icon as any} size={44} color="#2d2d2d" /> */}
      </View>
      <Text style={styles.tileTitle}>{item.title}</Text>
      <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => handleDeleteTile(item.id)}
      >
        {/* <Ionicons name="trash-outline" size={22} color="#c00" /> */}
      </Pressable>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good Afternoon 🌞</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    paddingTop: 60,
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
    borderRadius: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 18,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 4,
    zIndex: 2,
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
