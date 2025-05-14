import {Modal, View, Text, TouchableOpacity, TextInput} from 'react-native';
import styles from '../../../../screens/DetailsScreen/styles';
import React from 'react';
import {TileType} from '../../../../screens/DetailsScreen/types';

export const AddTileModal = ({
  modalVisible,
  setModalVisible,
  newType,
  setNewType,
  newContent,
  setNewContent,
  handleAddTile,
}: {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  newType: TileType;
  setNewType: (type: TileType) => void;
  newContent: string;
  setNewContent: (content: string) => void;
  handleAddTile: () => void;
}) => {
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
              onPress={() => setNewType('quote')}>
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
              onPress={() => setNewType('link')}>
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
              onPress={() => setNewType('youtube')}>
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
                newType === 'image' && styles.typeBtnActive,
              ]}
              onPress={() => setNewType('image')}>
              <Text
                style={[
                  styles.typeBtnText,
                  newType === 'image' && styles.typeBtnTextActive,
                ]}>
                Image
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={
              newType === 'quote'
                ? 'Enter quote text...'
                : newType === 'link'
                ? 'Enter URL...'
                : 'Enter YouTube URL...'
            }
            value={newContent}
            onChangeText={setNewContent}
            multiline={newType === 'quote'}
            autoCapitalize="none"
            autoCorrect={false}
          />

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
