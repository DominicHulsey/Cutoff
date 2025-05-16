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
  Dimensions,
  Modal,
  Easing,
  Image
} from 'react-native';
import { FONTS } from '../../src/constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Tile = {
  id: string;
  icon: string;
  title: string;
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
  { id: '1', icon: 'walk-outline', title: 'Take a walk', color: COLORS.primary },
];

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [newTile, setNewTile] = useState<Partial<Tile>>({});
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [tileToDelete, setTileToDelete] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tileToEdit, setTileToEdit] = useState<Tile | null>(null);
  
  // Title animations
  const titleOpacity = useRef(new Animated.Value(0.25)).current;
  const line1TranslateX = useRef(new Animated.Value(-100)).current;
  const line2TranslateX = useRef(new Animated.Value(100)).current;
  const line3TranslateY = useRef(new Animated.Value(20)).current;
  
  // Card animations
  const cardAnimationsRef = useRef<Animated.Value[]>([]);
  const [cardAnimations, setCardAnimations] = useState<Animated.Value[]>([]);
  
  // Form animations
  const animatedFormOpacity = useRef(new Animated.Value(0)).current;
  const animatedFormScale = useRef(new Animated.Value(0.8)).current;
  const animatedBackdropOpacity = useRef(new Animated.Value(0)).current;
  const animatedFormTranslateY = useRef(new Animated.Value(60)).current; // Start 60px below center
  const { width, height } = Dimensions.get('window');

  // Function to run the animations
  const runAnimations = () => {
    // Set animating state
    setIsAnimating(true);
    
    // Reset animation values
    titleOpacity.setValue(0.25);
    line1TranslateX.setValue(-100);
    line2TranslateX.setValue(100);
    line3TranslateY.setValue(20);
    
    // Reset card animations
    cardAnimations.forEach(anim => anim.setValue(0));
    
    // Start title and card animations in parallel
    Animated.parallel([
      // Title animations
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(0.25))
      }),
      // Line animations
      Animated.parallel([
        // Line 1 from left
        Animated.timing(line1TranslateX, {
          toValue: 0,
          duration: 650,
          delay: 0, // Small delay to let title start fading in
          useNativeDriver: true,
          easing: Easing.out(Easing.back(0))
        }),
        // Line 2 from right
        Animated.timing(line2TranslateX, {
          toValue: 0,
          duration: 650,
          delay: 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(0))
        }),
        // Line 3 from bottom
        Animated.timing(line3TranslateY, {
          toValue: 0,
          duration: 650,
          delay: 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(0))
        })
      ])
    ]).start(() => {
      // Animation complete
      setIsAnimating(false);
    });
  };

  // Load tiles and start animations when component mounts
  React.useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('tiles');
      if (stored) setTiles(JSON.parse(stored));
    })();
    
    // Run animations on initial load
    runAnimations();
  }, []);

  // Save tiles to storage whenever they change
  useEffect(() => {
    AsyncStorage.setItem('tiles', JSON.stringify(tiles));
    // Update card animations array when tiles change
    const newAnimations = tiles.map((_, i) => {
      if (i >= cardAnimations.length) {
        return new Animated.Value(0);
      }
      return cardAnimations[i];
    });
    
    // Animate new cards
    if (newAnimations.length > cardAnimations.length) {
      const newCardIndex = newAnimations.length - 1;
      Animated.timing(newAnimations[newCardIndex], {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();
    }
    
    // Update animations state
    setCardAnimations(newAnimations);
    cardAnimationsRef.current = newAnimations;
  }, [tiles]);
  
  // Initialize and start card animations when component mounts
  useEffect(() => {
    if (tiles.length > 0 && cardAnimations.length === 0) {
      // Create animations for initial cards
      const initialAnimations = tiles.map(() => new Animated.Value(0));
      setCardAnimations(initialAnimations);
      cardAnimationsRef.current = initialAnimations;
      
      // Animate all cards with staggered timing
      Animated.stagger(
        100, // Stagger each card by 100ms
        initialAnimations.map((anim, index) => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            delay: 200, // Start around the same time as the title
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
          })
        )
      ).start();
    }
  }, [tiles.length]);

  // Animation functions
  const showForm = () => {
    openFormForNewTile();
  };

  // Open form for creating a new tile
  const openFormForNewTile = () => {
    setFormVisible(true);
    
    setIsEditing(false);
    setTileToEdit(null);
    setNewTile({})
    
    // Reset animations
    animatedFormOpacity.setValue(0);
    animatedFormScale.setValue(0.8);
    animatedBackdropOpacity.setValue(0);
    animatedFormTranslateY.setValue(60);
    
    // Start animations
    Animated.parallel([
      Animated.timing(animatedBackdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(animatedFormOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(animatedFormScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(animatedFormTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ])
      ])
    ]).start();
  };

  // Open form for editing an existing tile
  const openFormForEdit = (tile: Tile) => {
    setFormVisible(true);
    setIsEditing(true);
    setTileToEdit(tile);
    setNewTile({
      title: tile.title,
      icon: tile.icon,
      color: tile.color
    });
    
    // Reset animations
    animatedFormOpacity.setValue(0);
    animatedFormScale.setValue(0.8);
    animatedBackdropOpacity.setValue(0);
    animatedFormTranslateY.setValue(60);
    
    // Start animations
    Animated.parallel([
      Animated.timing(animatedBackdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(animatedFormOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(animatedFormScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(animatedFormTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ])
      ])
    ]).start();
  };

  const hideForm = () => {
    Animated.parallel([
      Animated.timing(animatedBackdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(animatedFormOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(animatedFormScale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(animatedFormTranslateY, {
        toValue: 60,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setFormVisible(false);
      setIsEditing(false);
      setTileToEdit(null);
    });
  };

  const handleAddTile = () => {
    if (!newTile.title) {
      Alert.alert('Please enter a title');
      return;
    }
    
    if (isEditing && tileToEdit) {
      // Update existing tile
      const updatedTiles = tiles.map(tile => {
        if (tile.id === tileToEdit.id) {
          return {
            ...tile,
            title: newTile.title || tile.title,
            icon: newTile.icon || tile.icon,
            color: newTile.color || tile.color
          };
        }
        return tile;
      });
      
      setTiles(updatedTiles);
    } else {
      // Add new tile
      const newTileWithDefaults: Tile = {
        id: Date.now().toString(),
        icon: newTile.icon || 'walk-outline',
        title: newTile.title,
        color: newTile.color || COLORS.primary
      };
      
      setTiles(prev => [...prev, newTileWithDefaults]);
      
      // Create new animation for the new tile
      const newAnim = new Animated.Value(0);
      setCardAnimations(prev => [...prev, newAnim]);
      
      // Start animation for the new tile
      Animated.timing(newAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }).start();
    }
    
    hideForm();
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

  // Render individual tile
  const renderTile = ({ item, index }: { item: Tile, index: number }) => {
    // Use existing animation for existing cards, create new one for new cards
    const animation = index < cardAnimations.length ? cardAnimations[index] : new Animated.Value(0);
    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: animation,
            transform: [
              { translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Details', { tile: item })}
          activeOpacity={0.7}
        >
          <View style={styles.bracketLeft} />
          <View style={styles.cardContent}>
            <Text style={styles.cardText}>{item.title}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openFormForEdit(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={() => confirmDeleteTile(item.id)}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bracketRight} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Animated Title */}
      <View style={styles.titleContainer}>
        <Animated.Text style={[styles.titleText, { opacity: titleOpacity }]}>
          Let's Rewrite
        </Animated.Text>
        <View style={styles.linesContainer}>
          <Animated.View 
            style={[styles.titleLine1, { 
              transform: [{ translateX: line1TranslateX }] 
            }]}
          />
          <Animated.View 
            style={[styles.titleLine2, { 
              transform: [{ translateX: line2TranslateX }] 
            }]}
          />
          <Animated.View 
            style={[styles.titleLine3, { 
              transform: [{ translateY: line3TranslateY }] 
            }]}
          />
        </View>
        {/* <View style={{flexDirection: 'row', gap: 10, position: 'absolute', top: -60}}>
        <TouchableOpacity 
          style={styles.animateButton}
          onPress={runAnimations}
          disabled={isAnimating}
        >
          <Text style={styles.animateButtonText}>
            {isAnimating ? 'Animating...' : 'Replay Animation'}
          </Text>
        </TouchableOpacity>
                <TouchableOpacity 
          style={styles.animateButton}
          onPress={async() => {
          await AsyncStorage.clear()
          setTiles([]);
          }}
          disabled={isAnimating}
        >
          <Text style={styles.animateButtonText}>
            Reset Tiles
          </Text>
        </TouchableOpacity>
      </View> */}
              </View>

      <FlatList
        data={tiles}
        renderItem={renderTile}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity 
        style={styles.addCardButton}
        onPress={showForm}
        activeOpacity={0.7}
      >
<Image source={require('../../assets/images/add-new.png')} style={{width: 75, height: 75}} />      </TouchableOpacity>
      
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
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newTile.title}
              onChangeText={text => setNewTile(prev => ({ ...prev, title: text }))}
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity 
              style={styles.rewireButton} 
              onPress={handleAddTile}
            >
              <Image source={require('../../assets/images/create-tile.png')} style={{ width: 110, height: 60 }} />
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
    alignItems: 'center',
    position: 'relative',
  },
  addCardButton: {
    borderRadius: 10,
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addCardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Title styles
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  animateButton: {
    backgroundColor: '#2A7D4F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  animateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  titleText: {
    fontSize: 48,
    fontFamily: FONTS.bold,
    color: '#000',
    marginBottom: 10,
  },
  linesContainer: {
    alignItems: 'center',
    width: '100%',
    height: 30,
  },
  titleLine1: {
    position: 'absolute',
    top: 0,
    width: 300,
    height: 3,
    backgroundColor: '#000',
  },
  titleLine2: {
    position: 'absolute',
    top: 10,
    width: 200,
    height: 3,
    backgroundColor: '#000',
  },
  titleLine3: {
    position: 'absolute',
    top: 20,
    width: 100,
    height: 3,
    backgroundColor: '#000',
  },
  // Card styles
  cardsContainer: {
    paddingBottom: 40,
    width: '100%',
  },
  cardContainer: {
    marginBottom: 30,
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  bracketLeft: {
    width: 30,
    height: 100,
    borderLeftWidth: 5,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#000',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  bracketRight: {
    width: 30,
    height: 100,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#000',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  cardContent: {
    width: '50%',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
    height: 75,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2A7D4F',
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  deleteActionButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: FONTS.medium,
  },
  cardText: {
    fontSize: 22,
    fontFamily: FONTS.medium,
    color: '#000',
    textAlign: 'center',
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
    backgroundColor: '#FFFFFF',
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
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderRadius: 10,
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
