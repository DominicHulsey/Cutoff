import { Widget, WidgetText, WidgetLink, WidgetStack } from 'expo-widgets';
import { Ionicons } from '@expo/vector-icons';

const tiles = [
  { id: '1', icon: 'walk-outline', title: 'Take a walk', color: '#FFE5B4' },
  { id: '2', icon: 'water-outline', title: 'Drink water', color: '#D0F0C0' },
  { id: '3', icon: 'musical-notes-outline', title: 'Listen to music', color: '#F2D0F7' },
  { id: '4', icon: 'leaf-outline', title: 'Step outside', color: '#B4E0FF' },
  { id: '5', icon: 'pencil-outline', title: 'Journal', color: '#F7D6E0' },
  { id: '6', icon: 'medkit-outline', title: 'Breathe deeply', color: '#F9F5B4' },
];

export default function CutoffWidget() {
  return (
    <Widget backgroundColor="#FFFDF8">
      <WidgetStack spacing={10} padding={12}>
        {tiles.map(tile => (
          <WidgetLink
            key={tile.id}
            url={`cutoff://details/${tile.id}`}
            style={{
              backgroundColor: tile.color,
              borderRadius: 18,
              padding: 12,
              alignItems: 'center',
              width: 80,
              marginBottom: 8,
            }}
          >
            <Ionicons name={tile.icon as any} size={30} color="#2d2d2d" />
            <WidgetText style={{ fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>{tile.title}</WidgetText>
          </WidgetLink>
        ))}
      </WidgetStack>
    </Widget>
  );
}
