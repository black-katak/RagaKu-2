import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  isPassword?: boolean;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  isPassword,
  errorText,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(!!isPassword);
  const [focused, setFocused] = useState(false);

  const borderColor = errorText ? theme.warning : focused ? theme.primary : theme.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>

      <View
        style={[
          styles.fieldRow,
          { backgroundColor: theme.backgroundElement, borderColor },
        ]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((value) => !value)} hitSlop={10}>
            <ThemedText type="smallBold" themeColor="primary">
              {hidden ? 'Lihat' : 'Sembunyikan'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {errorText ? (
        <ThemedText type="small" themeColor="warning" style={styles.error}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    marginLeft: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  error: {
    marginLeft: 4,
  },
});
