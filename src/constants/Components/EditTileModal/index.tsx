import React from 'react';
import {Modal, View, Text, TouchableOpacity, TextInput} from 'react-native';
import styles from '../../../../screens/DetailsScreen/styles';
import {TileType} from '../../../../screens/DetailsScreen/types';

export const EditTileModal = ({
  editModalVisible,
  setEditModalVisible,
  editedType,
  setEditedType,
  editedContent,
  setEditedContent,
  saveEditedTile,
}: {
  editModalVisible: boolean;
  setEditModalVisible: (visible: boolean) => void;
  editedType: string;
  setEditedType: (type: TileType) => void;
  editedContent: string;
  setEditedContent: (content: string) => void;
  saveEditedTile: () => void;
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Tile</Text>

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                editedType === 'quote' && styles.typeBtnActive,
              ]}
              onPress={() => setEditedType('quote')}>
              <Text
                style={[
                  styles.typeBtnText,
                  editedType === 'quote' && styles.typeBtnTextActive,
                ]}>
                Quote
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                editedType === 'link' && styles.typeBtnActive,
              ]}
              onPress={() => setEditedType('link')}>
              <Text
                style={[
                  styles.typeBtnText,
                  editedType === 'link' && styles.typeBtnTextActive,
                ]}>
                Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                editedType === 'youtube' && styles.typeBtnActive,
              ]}
              onPress={() => setEditedType('youtube')}>
              <Text
                style={[
                  styles.typeBtnText,
                  editedType === 'youtube' && styles.typeBtnTextActive,
                ]}>
                YouTube
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                editedType === 'image' && styles.typeBtnActive,
              ]}
              onPress={() => setEditedType('image')}>
              <Text
                style={[
                  styles.typeBtnText,
                  editedType === 'image' && styles.typeBtnTextActive,
                ]}>
                Image
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={
              editedType === 'quote'
                ? 'Enter quote text...'
                : editedType === 'link'
                ? 'Enter URL...'
                : 'Enter YouTube URL...'
            }
            value={editedContent}
            onChangeText={setEditedContent}
            multiline={editedType === 'quote'}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalAddBtn}
              onPress={saveEditedTile}>
              <Text style={styles.modalAddBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
