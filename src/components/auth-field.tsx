// 로그인/회원가입 공용 입력 필드
import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { KarrotColors, Radius } from '@/theme/karrot';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
}

export const AuthField = forwardRef<TextInput, Props>(function AuthField(
  { label, error, style, ...rest },
  ref,
) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor={KarrotColors.lightText}
        {...rest}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: KarrotColors.subText, marginBottom: 8 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    color: KarrotColors.text,
    backgroundColor: KarrotColors.bgGray,
  },
  inputError: { borderColor: KarrotColors.danger },
  error: { fontSize: 12, color: KarrotColors.danger, marginTop: 6 },
});
