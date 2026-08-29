import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/constants/design';
import { useTheme } from '@/context/ThemeContext';
import type { HeaderProps } from './Header.types';

export function Header({
  title,
  showBack,
  rightElement,
  style,
  titleStyle
}: HeaderProps) {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <View style={[
      styles.container,
      isDark && styles.containerDark,
      style
    ]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
            style={styles.backBtn}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? '#F1F5F9' : colors.text} 
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        {title && (
          <Text 
            style={[
              styles.title, 
              isDark && styles.titleDark,
              titleStyle
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: '#334155',
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backBtn: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  titleDark: {
    color: '#F1F5F9',
  }
});
