// Placeholder component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ApplicationsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Applications Screen - Coming Soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, fontWeight: 'bold' },
});

export default ApplicationsScreen;