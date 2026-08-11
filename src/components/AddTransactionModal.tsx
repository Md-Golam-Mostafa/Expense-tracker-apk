import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoriesForType } from '../constants';
import { fontFamily, Theme } from '../theme';
import { Transaction, TransactionType } from '../types';
import {
  daysInMonth,
  isToday,
  monthLabel,
  toDateKey,
  uid,
  weekdayShort,
} from '../utils';

interface Props {
  visible: boolean;
  theme: Theme;
  /** Year & month index (0-11) the calendar should show */
  calendarYear: number;
  calendarMonth: number;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

export function AddTransactionModal({
  visible,
  theme,
  calendarYear,
  calendarMonth,
  onClose,
  onSave,
}: Props) {
  const { colors } = theme;
  const [type, setType] = useState<TransactionType>('expense');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<string>('food');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateKey(new Date()),
  );
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever the modal (re)opens.
  const lastVisible = useRef(false);
  if (visible && !lastVisible.current) {
    lastVisible.current = true;
    setType('expense');
    setCategoryId('food');
    setAmountText('');
    setNote('');
    const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-`;
    const today = toDateKey(new Date());
    // Default to today when viewing the current month, otherwise the 1st.
    setSelectedDate(today.startsWith(monthPrefix) ? today : `${monthPrefix}01`);
    setError(null);
  } else if (!visible && lastVisible.current) {
    lastVisible.current = false;
  }

  const categories = useMemo(() => categoriesForType(type), [type]);
  const days = useMemo(
    () => daysInMonth(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
  );

  const switchType = (next: TransactionType) => {
    setType(next);
    setCategoryId(next === 'expense' ? 'food' : 'salary');
    setError(null);
  };

  const handleSave = () => {
    const amount = parseFloat(amountText);
    if (!amountText || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    onSave({
      id: uid(),
      type,
      amount: Math.round(amount * 100) / 100,
      categoryId,
      note: note.trim(),
      date: selectedDate,
      createdAt: Date.now(),
    });
    setAmountText('');
    setNote('');
    setSelectedDate(toDateKey(new Date()));
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                Add Transaction
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {monthLabel(calendarYear, calendarMonth)}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.surfaceAlt },
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            {/* Type toggle */}
            <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
              {(['expense', 'income'] as TransactionType[]).map(t => {
                const active = type === t;
                const label = t === 'expense' ? 'Expense' : 'Income';
                const activeColor = t === 'expense' ? colors.expense : colors.income;
                return (
                  <Pressable
                    key={t}
                    onPress={() => switchType(t)}
                    style={[
                      styles.segment,
                      active && {
                        backgroundColor: colors.surface,
                        shadowColor: colors.shadow,
                        shadowOpacity: 0.12,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 3,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? activeColor : colors.textMuted },
                        active && styles.segmentTextActive,
                      ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Amount */}
            <View
              style={[
                styles.amountWrap,
                { backgroundColor: colors.inputBg },
                error ? { borderColor: colors.expense } : null,
              ]}>
              <Text style={[styles.currencySign, { color: colors.textSecondary }]}>
                ৳
              </Text>
              <TextInput
                value={amountText}
                onChangeText={text => {
                  // Only digits and at most one decimal point.
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const firstDot = cleaned.indexOf('.');
                  const normalized =
                    firstDot === -1
                      ? cleaned
                      : cleaned.slice(0, firstDot + 1) +
                        cleaned.slice(firstDot + 1).replace(/\./g, '');
                  setAmountText(normalized);
                  if (error) {
                    setError(null);
                  }
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: colors.text }]}
                autoFocus
                maxLength={12}
              />
            </View>
            {error ? (
              <Text style={[styles.errorText, { color: colors.expense }]}>
                {error}
              </Text>
            ) : null}

            {/* Category picker */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => {
                const active = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={({ pressed }) => [
                      styles.categoryItem,
                      { backgroundColor: colors.surfaceAlt },
                      active && {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primary,
                      },
                      pressed && { opacity: 0.75 },
                    ]}>
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.categoryLabel,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date picker */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Date
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStrip}>
              {days.map(day => {
                const active = day === selectedDate;
                const today = isToday(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDate(day)}
                    style={({ pressed }) => [
                      styles.dayItem,
                      { backgroundColor: colors.surfaceAlt },
                      active && { backgroundColor: colors.primary },
                      pressed && { opacity: 0.75 },
                    ]}>
                    <Text
                      style={[
                        styles.dayWeekday,
                        { color: active ? 'rgba(255,255,255,0.8)' : colors.textMuted },
                      ]}>
                      {weekdayShort(day)}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: active ? '#fff' : colors.text },
                      ]}>
                      {day.slice(8)}
                    </Text>
                    {today ? (
                      <View
                        style={[
                          styles.todayDot,
                          { backgroundColor: active ? '#fff' : colors.primary },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Note */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Note <Text style={{ color: colors.textMuted }}>(optional)</Text>
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note…"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              maxLength={80}
            />

            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}>
              <Text style={[styles.saveBtnText, { color: colors.fabText }]}>
                Save Transaction
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD2E0',
    opacity: 0.6,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fontFamily('bold'),
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: fontFamily('regular'),
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginTop: 12,
  },
  segment: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily('medium'),
  },
  segmentTextActive: {
    fontWeight: '800',
    fontFamily: fontFamily('bold'),
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    marginTop: 16,
  },
  currencySign: {
    fontSize: 30,
    fontWeight: '700',
    marginRight: 10,
    fontFamily: fontFamily('bold'),
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    paddingVertical: 14,
    fontVariant: ['tabular-nums'],
    fontFamily: fontFamily('bold'),
  },
  errorText: {
    fontSize: 12.5,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
    fontFamily: fontFamily('regular'),
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: fontFamily('medium'),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryItem: {
    width: '31%',
    margin: '1.16%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingVertical: 10,
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: fontFamily('medium'),
  },
  dayStrip: {
    paddingVertical: 2,
    gap: 6,
  },
  dayItem: {
    width: 52,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayWeekday: {
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: fontFamily('medium'),
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    fontFamily: fontFamily('bold'),
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fontFamily('regular'),
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: fontFamily('bold'),
  },
});
