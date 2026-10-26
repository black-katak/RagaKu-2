/**
 * Dialog konfirmasi yang BENAR-BENAR tampil di web.
 *
 * `Alert.alert` dari react-native adalah no-op di react-native-web
 * (node_modules/react-native-web/dist/exports/Alert/index.js: `static alert() {}`),
 * jadi tombol destruktif (keluar akun, hapus semua data) tidak melakukan apa pun di web
 * kalau memakai Alert. Komponen ini memakai `Modal`, yang didukung di web maupun native.
 */
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Tombol konfirmasi dirender dengan warna peringatan (dipakai untuk hapus data). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Pressable kosong agar tap di dalam kartu tidak menutup dialog (stopPropagation web). */}
        <Pressable onPress={() => {}}>
          <Card style={styles.card}>
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {message}
            </ThemedText>
            <View style={styles.actions}>
              <PillButton label={cancelLabel} variant="outline" onPress={onCancel} style={styles.action} />
              <PillButton
                label={confirmLabel}
                onPress={onConfirm}
                style={[styles.action, destructive && { backgroundColor: theme.warning }]}
              />
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: Math.min(MaxContentWidth, 420),
    gap: Spacing.three,
  },
  title: {
    fontSize: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
