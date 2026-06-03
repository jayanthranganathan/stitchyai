/**
 * DatePickerInput
 *
 * A styled pressable field that opens the native date picker on tap.
 * - iOS:     bottom-sheet modal with an inline spinner wheel
 * - Android: native calendar dialog (appears automatically)
 *
 * Props:
 *   label          – field label (same style as Input)
 *   value          – selected date as "YYYY-MM-DD" string, or "" for none
 *   onChangeDate   – called with "YYYY-MM-DD" string when user picks a date
 *   minimumDate    – earliest selectable date (default: today)
 *   maximumDate    – latest selectable date (optional)
 *   placeholder    – shown when no date is selected (default: "Select date")
 *   error          – validation error message
 */

import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

import { spacing, typography, useThemedStyles } from '@/theme';

type Props = {
  label?: string;
  value: string;           // "YYYY-MM-DD" or ""
  onChangeDate: (date: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  error?: string;
};

/** Convert a JS Date to "YYYY-MM-DD" string (local timezone) */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a "YYYY-MM-DD" string to a JS Date (noon local to avoid DST edge cases) */
function fromYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function DatePickerInput({
  label,
  value,
  onChangeDate,
  minimumDate,
  maximumDate,
  placeholder = 'Select date',
  error,
}: Props) {
  const [open, setOpen] = useState(false);

  // The date shown inside the native picker (defaults to today when no value)
  const pickerDate = value ? fromYMD(value) : new Date();

  const styles = useThemedStyles((c) => ({
    wrap:    { marginBottom: spacing.md },
    label:   { ...typography.caption, color: c.textMuted, marginBottom: spacing.xs, fontWeight: '500' as const },
    field: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderWidth: 1.5,
      borderColor: error ? c.danger : c.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      backgroundColor: c.surface,
    },
    valueText:       { ...typography.body, color: c.text },
    placeholderText: { ...typography.body, color: c.textMuted },
    calIcon:         { fontSize: 16 },
    error: { ...typography.caption, color: c.danger, marginTop: spacing.xs },
    // iOS modal
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingBottom: spacing.xl,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center' as const,
      marginBottom: 8,
    },
    doneRow: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      paddingHorizontal: spacing.md,
      paddingBottom: 4,
    },
    doneBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.primary,
    },
    doneTxt: { color: '#fff', fontWeight: '700' as const, fontSize: 13 },
  }));

  // ── Android: picker is rendered inline; it fires onChange and dismisses itself
  function onAndroidChange(event: DateTimePickerEvent, date?: Date) {
    setOpen(false);
    if (event.type === 'set' && date) {
      onChangeDate(toYMD(date));
    }
  }

  // ── iOS: picker lives in a modal; user taps "Done"
  const [iosDate, setIosDate] = useState<Date>(pickerDate);
  function onIosChange(_: DateTimePickerEvent, date?: Date) {
    if (date) setIosDate(date);
  }
  function confirmIos() {
    onChangeDate(toYMD(iosDate));
    setOpen(false);
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Pressable field */}
      <Pressable style={styles.field} onPress={() => { setIosDate(pickerDate); setOpen(true); }}>
        {value
          ? <Text style={styles.valueText}>{value}</Text>
          : <Text style={styles.placeholderText}>{placeholder}</Text>
        }
        <Text style={styles.calIcon}>📅</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* ── Android: render picker directly (shows as native dialog) ── */}
      {Platform.OS === 'android' && open && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onAndroidChange}
        />
      )}

      {/* ── iOS: render picker inside a bottom-sheet modal ── */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
            {/* Stop touch from propagating through the sheet */}
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheet}>
                <View style={styles.sheetHandle} />
                <View style={styles.doneRow}>
                  <Pressable style={styles.doneBtn} onPress={confirmIos}>
                    <Text style={styles.doneTxt}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={iosDate}
                  mode="date"
                  display="spinner"
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  onChange={onIosChange}
                  style={{ width: '100%' }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
