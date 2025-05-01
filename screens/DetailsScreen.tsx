import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

export default function DetailsScreen({ route }: Props) {
  const { tile } = route.params;
  return (
    <View style={[styles.container, { backgroundColor: tile.color }] }>
      <Ionicons name={tile.icon as any} size={50} color="#444" style={{ marginBottom: 20 }} />
      <Text style={styles.title}>{tile.title}</Text>
      <Text style={styles.subtitle}>{tile.subtitle}</Text>
      <Text style={styles.id}>ID: {tile.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  id: {
    fontSize: 12,
    color: '#888',
    marginTop: 16,
  },
});
