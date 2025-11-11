import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { theme } from '../../config/theme';

const RegisterScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Register Screen</Text>
          <Text style={styles.subtitle}>Registration form will be implemented here</Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  card: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
});

export default RegisterScreen;