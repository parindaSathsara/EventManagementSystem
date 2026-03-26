import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, RADII } from '../../theme';
import { FONT_FAMILY } from '../../theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  helper,
  variant = 'dark',
  style,
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const isLight = variant === 'light';

  const inputContainerStyles = [
    styles.inputContainer,
    isLight && styles.inputContainerLight,
    focused && (isLight ? styles.inputFocusedLight : styles.inputFocused),
    error && styles.inputError,
  ];

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={[styles.label, isLight && styles.labelLight]}>{label}</Text> : null}
      <View style={inputContainerStyles}>
        <TextInput
          style={[styles.input, isLight && styles.inputLight]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isLight ? COLORS.inkMuted : COLORS.textMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setHidden(!hidden)}
            style={styles.toggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  secureTextEntry: PropTypes.bool,
  keyboardType: PropTypes.string,
  autoCapitalize: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  variant: PropTypes.oneOf(['dark', 'light']),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 48,
    paddingHorizontal: SPACING.base,
  },
  inputFocused: {
    borderColor: COLORS.accent,
  },
  inputFocusedLight: {
    borderColor: COLORS.accent,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textPrimary,
    height: '100%',
  },
  inputLight: {
    color: COLORS.ink,
  },
  inputContainerLight: {
    backgroundColor: COLORS.paperSoft,
    borderColor: COLORS.paperLine,
  },
  labelLight: {
    color: COLORS.ink,
  },
  toggle: {
    paddingLeft: SPACING.sm,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.accent,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
