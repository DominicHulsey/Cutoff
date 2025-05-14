import React, { Linking, Text, TouchableOpacity } from "react-native"
import styles from "../../../../../screens/DetailsScreen/styles"

export const LinkTile = (t: { content: string }) => {
  return (            <TouchableOpacity 
                onPress={() => Linking.openURL(t.content)}
                style={styles.linkContainer}
              >
                <Text style={styles.linkText}>{t.content}</Text>
              </TouchableOpacity>
)
}