import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Alert, 
  StatusBar, 
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS } from '../src/constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [formVisible, setFormVisible] = useState(false);
  const [newTile, setNewTile] = useState<Partial<Tile>>({});
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [tileToDelete, setTileToDelete] = useState<string | null>(null);
  
  // Animation values
  const animatedFormOpacity = useRef(new Animated.Value(0)).current;
  const animatedFormScale = useRef(new Animated.Value(0.8)).current;
  const animatedBackdropOpacity = useRef(new Animated.Value(0)).current;
  const animatedFormTranslateY = useRef(new Animated.Value(60)).current; // Start 60px below center
  const { width, height } = Dimensions.get('window');

  React.useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('tiles');
      if (stored) setTiles(JSON.parse(stored));
      else setTiles(defaultTiles);
    })();
  }, []);

  // Save tiles to storage whenever they change
  useEffect(() => {
    AsyncStorage.setItem('tiles', JSON.stringify(tiles));
  }, [tiles]);

  // Animation functions
  const showForm = () => {
    // Reset the new tile data
    setNewTile({});
    // Show the form
    setFormVisible(true);
    
    // Start animations
    Animated.parallel([
      Animated.timing(animatedBackdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animatedFormOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(animatedFormScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideForm = () => {
    Animated.parallel([
      Animated.timing(animatedBackdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedFormOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedFormScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFormVisible(false);
    });
  };

  // Animation functions
  const showForm = () => {
    setNewTile({ title: '', subtitle: '' });
    setFormVisible(true);
    animatedFormTranslateY.setValue(60); // Reset
    Animated.parallel([
      Animated.timing(animatedBackdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(animatedFormOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(animatedFormScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.spring(animatedFormTranslateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const hideForm = () => {
    Animated.parallel([
      Animated.timing(animatedBackdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(animatedFormOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(animatedFormScale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(animatedFormTranslateY, { toValue: 60, duration: 200, useNativeDriver: true }),
    ]).start(() => setFormVisible(false));
  };

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
    hideForm();
    
    setTimeout(() => {
      navigation.navigate('Details', { tile: newTileComplete });
    }, 300); 
  };

  const confirmDeleteTile = (id: string) => {
    setTileToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const handleDeleteTile = () => {
    if (tileToDelete) {
      setTiles(prev => prev.filter(tile => tile.id !== tileToDelete));
      setTileToDelete(null);
    }
    setDeleteConfirmVisible(false);
  };

  const cancelDelete = () => {
    setTileToDelete(null);
    setDeleteConfirmVisible(false);
  };

  const renderTile = ({ item }: { item: Tile }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => item.id === 'add' ? showForm() : navigation.navigate('Details', { tile: item })}
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
        <Text style={[styles.greeting, { textAlign: 'center' }]}>What's on your mind?</Text>
      </View>
      
      <FlatList
        data={[...tiles, { id: 'add', icon: '', title: '', subtitle: '', color: '' } as Tile]}
        renderItem={renderTile}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tileGrid}
        showsVerticalScrollIndicator={false}
      />
      
      {formVisible && (
        <Animated.View 
          style={[styles.formOverlay, { opacity: animatedBackdropOpacity }]}
        >
          <Pressable style={styles.backdropPress} onPress={hideForm} />
          
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: animatedFormOpacity,
                transform: [
                  { scale: animatedFormScale },
                  { translateY: animatedFormTranslateY }
                ],
              },
            ]}
          >
            <Text style={styles.formTitle}>Create a New Tile</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newTile.title}
              onChangeText={text => setNewTile(prev => ({ ...prev, title: text }))}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Subtitle"
              value={newTile.subtitle}
              onChangeText={text => setNewTile(prev => ({ ...prev, subtitle: text }))}
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity 
              style={styles.rewireButton} 
              onPress={handleAddTile}
            >
              <View style={styles.addButtonCircle}>
                <Text style={styles.addButtonText}>+</Text>
              </View>
              <Text style={styles.addTileText}>Add New</Text>
            </TouchableOpacity>
          ) : renderTile({ item })
        }
        renderItem={renderTile}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tileGrid}
        showsVerticalScrollIndicator={false}
      />
      
      {formVisible && (
        <Animated.View 
          style={[styles.formOverlay, { opacity: animatedBackdropOpacity }]}
        >
          <Pressable style={styles.backdropPress} onPress={hideForm} />
          
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: animatedFormOpacity,
                transform: [{ scale: animatedFormScale }]
              }
            ]}
          >
            <Text style={styles.formTitle}>Create a New Tile</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newTile.title}
              onChangeText={text => setNewTile(prev => ({ ...prev, title: text }))}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Subtitle"
              value={newTile.subtitle}
              onChangeText={text => setNewTile(prev => ({ ...prev, subtitle: text }))}
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity 
              style={styles.rewireButton} 
              onPress={handleAddTile}
            >
              <Text style={styles.rewireButtonText}>Rewire</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
      
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Lato-Bold',
    color: '#333333',
  },
  tileGrid: {
    padding: 24,
  },
  tile: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addTileContent: {
    padding: 24,
    backgroundColor: '#F4F4F2',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A7D4F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 24,
    fontFamily: 'Lato-Bold',
    color: '#FFFFFF',
  },
  addTileText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: '#666666',
  },
  tileContent: {
    padding: 24,
    borderRadius: 16,
  },
  tileTitle: {
    fontSize: 18,
    fontFamily: 'Lato-Bold',
    color: '#333333',
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: '#666666',
  },
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: 'Lato-Bold',
    color: '#2A7D4F',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    width: '100%',
  },
  rewireButton: {
    backgroundColor: '#2A7D4F',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  rewireButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Lato-Bold',
    textAlign: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 22,
    fontFamily: 'Lato-Bold',
    color: '#333333',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: '#666666',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '45%',
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
