import React, { Text } from "react-native"
import styles from "../../../../../screens/DetailsScreen/styles"

export const QuoteTile = (t: { content: string; editMode?: boolean }) => {
  return (<Text style={styles.tileText}>{t.content}</Text>
)
}