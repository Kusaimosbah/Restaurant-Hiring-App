import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { theme } from '../../config/theme';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const navigateToRegister = () => {
    clearError();
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    clearError();
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to find your next restaurant opportunity
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              error={!!error && error.includes('email')}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              error={!!error && error.includes('password')}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading || !email.trim() || !password.trim()}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Button
              mode="text"
              onPress={navigateToForgotPassword}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <Button
            mode="outlined"
            onPress={navigateToRegister}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoText}>Demo Accounts:</Text>
          <Text style={styles.demoInfo}>Worker: worker@demo.com / password123</Text>
          <Text style={styles.demoInfo}>Employer: employer@demo.com / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    marginBottom: theme.spacing.lg,
    elevation: theme.elevation.medium,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.xs,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  divider: {
    marginVertical: theme.spacing.lg,
  },
  registerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  registerText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  registerButton: {
    minWidth: 200,
  },
  demoSection: {
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
  },
  demoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  demoInfo: {
    fontSize: 12,
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
});

export default LoginScreen;