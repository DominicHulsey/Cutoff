import {Modal, View, Text, TouchableOpacity, TextInput, Image, Alert} from 'react-native';
import styles from '../../../../screens/DetailsScreen/styles';
import React, { useState } from 'react';
import {TileType} from '../../../../screens/DetailsScreen/types';
import {launchImageLibrary, Asset} from 'react-native-image-picker';
import { ImageCropper } from '../ImageCropper';

// Function to select an image from the device's photo library
const selectImage = (
  setSelectedImage: (image: Asset | null) => void,
  setNewContent: (content: string) => void,
) => {
  const options = {
    mediaType: 'photo' as const,
    includeBase64: false,
    maxHeight: 800,
    maxWidth: 800,
  };

  launchImageLibrary(options, response => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      Alert.alert('Error', 'There was an error selecting the image');
    } else if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      setSelectedImage(asset);
      if (asset.uri) {
        // Update the new content with the image URI
        setNewContent(asset.uri);
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
}) => {
  // State for image cropping mode
  const [isCropping, setIsCropping] = useState(false);
  const [cropShape, setCropShape] = useState<'circle' | 'square' | 'rounded'>('rounded');
  
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
              {selectedImage && selectedImage.uri ? (
                isCropping ? (
                  // Show image cropper when in cropping mode
                  <ImageCropper 
                    imageUri={selectedImage.uri} 
                    onCropComplete={(croppedUri, shape) => {
                      // Update the image with the cropped version and shape info
                      // Store the shape information in the URI as a query parameter
                      const uriWithShape = `${croppedUri}?shape=${shape}`;
                      setSelectedImage({
                        ...selectedImage,
                        uri: uriWithShape
                      });
                      setNewContent(uriWithShape);
                      setCropShape(shape);
                      setIsCropping(false);
                      // Set the type to local-image when an image is cropped
                      setNewType('local-image');
                    }} 
                  />
                ) : (
                  // Show preview of selected/cropped image
                  <>
                    <Image
                      source={{uri: selectedImage.uri}}
                      style={[styles.imagePreview, 
                        cropShape === 'circle' && { borderRadius: 75 },
                        cropShape === 'rounded' && { borderRadius: 16 }
                      ]}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={[styles.selectImageButton, { marginTop: 10 }]}
                      onPress={() => setIsCropping(true)}>
                      <Text style={styles.selectImageButtonText}>
                        Edit Image
                      </Text>
                    </TouchableOpacity>
                  </>
                )
              ) : (
                <TouchableOpacity
                  style={styles.selectImageButton}
                  onPress={() => selectImage(setSelectedImage, setNewContent)}>
                  <Text style={styles.selectImageButtonText}>
                    Select Image from Library
                  </Text>
                </TouchableOpacity>
              )}
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
