import {Modal, View, Text, TouchableOpacity, TextInput, Image, Alert} from 'react-native';
import styles from '../../../../screens/DetailsScreen/styles';
import React, { useState } from 'react';
import {TileType} from '../../../../screens/DetailsScreen/types';
import {launchImageLibrary, Asset} from 'react-native-image-picker';
import { ImageCropper } from '../ImageCropper';
import ImageCropPicker from 'react-native-image-crop-picker';
import { sleep } from '../../constants';

// Function to select an image from the device's photo library with optional shape parameter
const selectImage = (
  setSelectedImage: (image: Asset | null) => void,
  setNewContent: (content: string) => void,
  shape?: 'circle' | 'square' | 'rounded',
  handleAddTile?: () => void,
  setNewType?: (type: TileType) => void
) => {
  launchImageLibrary({mediaType: 'photo'}, async response => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      Alert.alert('Error', 'Failed to pick image: ' + response.errorMessage);
    } else if (response.assets && response.assets.length > 0) {
      const selectedAsset = response.assets[0];
      
      if (selectedAsset.uri && shape) {
        try {
          await sleep(750);
            const croppedImage = await ImageCropPicker.openCropper({
              path: selectedAsset.uri,
              width: 200,
              height: 200,
              cropperCircleOverlay: shape === 'circle',
              cropping: true,
              mediaType: 'photo',
              includeBase64: false,
            })

          // No need to add shape to URI anymore, we'll store it separately
          const imageUri = croppedImage.path;
        
          await sleep(500);
          // Update state with the cropped image
          setSelectedImage({
            ...selectedAsset,
            uri: imageUri
          });
          
          // Store the image URI as content
          setNewContent(imageUri);
          
          // Store the shape information in a custom property
          // This will be accessed when creating the tile
          
          // Set the tile type to local-image if setNewType is provided
          if (setNewType) {
            setNewType('local-image');
          }
          
          // Set the type to local-image and add the tile
          if (handleAddTile) {
            setTimeout(() => {
              handleAddTile();
            }, 100);
          }
        } catch (error) {
          console.error('Error cropping image:', error);
          Alert.alert('Error', 'Failed to crop the image');
        }
      } else if (selectedAsset.uri) {
        setSelectedImage(selectedAsset);
        setNewContent(selectedAsset.uri);
      }
    }
  });
};

export const AddTileModal = ({
  modalVisible,
  setModalVisible,
  newType,
  setNewType,
  newContent,
  setNewContent,
  handleAddTile,
  selectedImage,
  setSelectedImage,
  cropShape,
  setCropShape,
}: {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  newType: TileType;
  setNewType: (type: TileType) => void;
  newContent: string;
  setNewContent: (content: string) => void;
  handleAddTile: () => void;
  selectedImage: Asset | null;
  setSelectedImage: (image: Asset | null) => void;
  cropShape: 'circle' | 'square' | 'rounded';
  setCropShape: (shape: 'circle' | 'square' | 'rounded') => void;
}) => {
  // State for image cropping mode
  const [isCropping, setIsCropping] = useState(false);
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Tile</Text>

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                newType === 'quote' && styles.typeBtnActive,
              ]}
              onPress={() => {
                setNewType('quote');
                setSelectedImage(null);
              }}>
              <Text
                style={[
                  styles.typeBtnText,
                  newType === 'quote' && styles.typeBtnTextActive,
                ]}>
                Quote
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                newType === 'link' && styles.typeBtnActive,
              ]}
              onPress={() => {
                setNewType('link');
                setSelectedImage(null);
              }}>
              <Text
                style={[
                  styles.typeBtnText,
                  newType === 'link' && styles.typeBtnTextActive,
                ]}>
                Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                newType === 'youtube' && styles.typeBtnActive,
              ]}
              onPress={() => {
                setNewType('youtube');
                setSelectedImage(null);
              }}>
              <Text
                style={[
                  styles.typeBtnText,
                  newType === 'youtube' && styles.typeBtnTextActive,
                ]}>
                YouTube
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeBtn,
                newType === 'local-image' && styles.typeBtnActive,
              ]}
              onPress={() => {
                setNewType('local-image');
                setNewContent('');
              }}>
              <Text
                style={[
                  styles.typeBtnText,
                  newType === 'local-image' && styles.typeBtnTextActive,
                ]}>
                Image
              </Text>
            </TouchableOpacity>
          </View>

          {newType !== 'local-image' ? (
            <TextInput
              style={styles.input}
              placeholder={
                newType === 'quote'
                  ? 'Enter quote text...'
                  : newType === 'link'
                  ? 'Enter URL...'
                  : newType === 'youtube'
                  ? 'Enter YouTube URL...'
                  : 'Enter Image URL...'
              }
              value={newContent}
              onChangeText={setNewContent}
              multiline={newType === 'quote'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : (
            <View style={styles.imagePreviewContainer}>
              <View style={styles.shapeSelectionContainer}>
                <Text style={styles.shapeSelectionTitle}>Select Image Shape</Text>
                <View style={styles.shapeButtonsRow}>
                  <TouchableOpacity
                    style={styles.shapeSelectionButton}
                    onPress={() => {
                      setCropShape('circle');
                      // Pass handleAddTile and setNewType to automatically add the tile after cropping
                      selectImage(setSelectedImage, setNewContent, 'circle', handleAddTile, setNewType);
                    }}>
                    <View style={styles.circleShapeIcon} />
                    <Text style={styles.shapeSelectionText}>Circle</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.shapeSelectionButton}
                    onPress={() => {
                      setCropShape('square');
                      // Pass handleAddTile and setNewType to automatically add the tile after cropping
                      selectImage(setSelectedImage, setNewContent, 'square', handleAddTile, setNewType);
                    }}>
                    <View style={styles.squareShapeIcon} />
                    <Text style={styles.shapeSelectionText}>Square</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.shapeSelectionButton}
                    onPress={() => {
                      setCropShape('rounded');
                      // Pass handleAddTile and setNewType to automatically add the tile after cropping
                      selectImage(setSelectedImage, setNewContent, 'rounded', handleAddTile, setNewType);
                    }}>
                    <View style={styles.roundedShapeIcon} />
                    <Text style={styles.shapeSelectionText}>Rounded</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalAddBtn}
              onPress={handleAddTile}>
              <Text style={styles.modalAddBtnText}>Add Tile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
