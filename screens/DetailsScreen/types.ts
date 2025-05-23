import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

export type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

export type TileType = 'quote' | 'link' | 'youtube' | 'local-image';

export type ImageShape = 'circle' | 'square' | 'rounded';

export type CorkTile = {
  id: string;
  type: TileType;
  content: string; // quote text, link URL, or YouTube URL
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number; // Added for stacking order
  shape?: ImageShape; // Shape for image tiles
};