import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Linking, LayoutChangeEvent } from 'react-native';
import { getLinkPreview } from 'link-preview-js';
import styles from '../../../../../screens/DetailsScreen/styles';
import Icon from 'react-native-vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string | null;
  images: string[];
  siteName: string | null;
  mediaType: string;
  contentType: string;
  favicons: string[];
}

export const LinkTile = (t: { content: string; editMode?: boolean; tileId?: string }) => {
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [contentWidth, setContentWidth] = useState<number>(0);
  const [hasAdjustedSize, setHasAdjustedSize] = useState<boolean>(false);

  // Function to update tile dimensions in AsyncStorage
  const updateTileDimensions = useCallback(async (width: number, height: number) => {
    if (!t.tileId) return;
    
    try {
      // Get the storage key for the current board
      const storageKeys = await AsyncStorage.getAllKeys();
      const detailTileKeys = storageKeys.filter(key => key.startsWith('detail_tiles_'));
      
      // Find the right storage key and update the tile dimensions
      for (const key of detailTileKeys) {
        const tilesJSON = await AsyncStorage.getItem(key);
        if (tilesJSON) {
          const tiles = JSON.parse(tilesJSON);
          const updatedTiles = tiles.map((tile: any) => {
            if (tile.id === t.tileId) {
              // Only update if dimensions have actually changed
              if (tile.width !== width || tile.height !== height) {
                return { ...tile, width, height };
              }
            }
            return tile;
          });
          
          // Save the updated tiles back to AsyncStorage
          await AsyncStorage.setItem(key, JSON.stringify(updatedTiles));
          
          // We found and updated the tile, no need to check other keys
          break;
        }
      }
      
      setHasAdjustedSize(true);
    } catch (error) {
      console.error('Error updating tile dimensions:', error);
    }
  }, [t.tileId]);

  // Handle layout changes to measure content size
  const onLayoutChange = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    
    // Only proceed if we have valid measurements
    if (width <= 0 || height <= 0) return;
    
    setContentWidth(width);
    setContentHeight(height);
    
    // Update tile dimensions if we have content
    if (previewData) {
      // Calculate exact dimensions needed for the content
      // We only add the padding that's already in the container (12px on each side)
      const newHeight = height;
      const newWidth = Math.max(width, 250);  // Ensure minimum width of 250
      
      // Always update dimensions when we get a valid measurement
      updateTileDimensions(newWidth, newHeight);
      setHasAdjustedSize(true);
    }
  }, [previewData, updateTileDimensions]);

  useEffect(() => {
    const fetchLinkPreview = async () => {
      try {
        setLoading(true);
        const data = await getLinkPreview(t.content, {
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          timeout: 5000,
        });
        setPreviewData(data as LinkPreviewData);
        setLoading(false);
        
        // Reset the adjustment flag when we get new preview data
        setHasAdjustedSize(false);
      } catch (err) {
        console.error('Error fetching link preview:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchLinkPreview();
    
    // Reset adjustment state when content changes
    return () => {
      setHasAdjustedSize(false);
    };
  }, [t.content]);

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (e) {
      return url;
    }
  };

  const handlePress = () => {
    Linking.openURL(t.content).catch(err => console.error('Error opening URL:', err));
  };

  if (loading) {
    return (
      <TouchableOpacity 
        style={styles.linkContainer} 
        onPress={handlePress}
        disabled={t.editMode}
      >
        <View style={styles.linkPreviewLoading} onLayout={onLayoutChange}>
          <ActivityIndicator size="small" color="#4A90E2" />
          <Text style={[styles.linkPreviewDomain, { marginTop: 8 }]}>Loading preview...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (error || !previewData) {
    return (
      <TouchableOpacity 
        style={styles.linkContainer} 
        onPress={handlePress}
        disabled={t.editMode}
      >
        <View style={styles.linkPreviewContainer} onLayout={onLayoutChange}>
          <Text style={styles.linkPreviewTitle}>Unable to load preview</Text>
          <Text style={styles.linkText}>{t.content}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.linkContainer]} 
      onPress={handlePress}
      disabled={t.editMode}
    >
      <View 
        style={[styles.linkPreviewContainer]} 
        onLayout={onLayoutChange}
      >
        {previewData.images && previewData.images.length > 0 && (
          <Image 
            source={{ uri: previewData.images[0] }} 
            style={styles.linkPreviewImage} 
            resizeMode="cover"
          />
        )}
        
        <Text style={styles.linkPreviewTitle} numberOfLines={2}>
          {previewData.title || 'No title available'}
        </Text>
        
        {previewData.description && (
          <Text style={styles.linkPreviewDescription} numberOfLines={2}>
            {previewData.description}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
          <Icon name="link" size={12} color="#888" style={{ marginRight: 4 }} />
          <Text style={styles.linkPreviewDomain}>
            {getDomainFromUrl(t.content)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}