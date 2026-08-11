import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategory } from '../constants';
import { fontFamily, Theme } from '../theme';
import { Transaction } from '../types';
import { formatBDT } from '../utils';

interface Props {
  transaction: Transaction;
  theme: Theme;
  onPress: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, theme, onPress }: Props) {
  const { colors } = theme;
  const category = getCategory(transaction.categoryId);
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? colors.income : colors.expense;
  const sign = isIncome ? '+' : '−';

  return (
    <Pressable
      onPress={() => onPress(transaction)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.75 },
      ]}
      android_ripple={{ color: colors.surfaceAlt }}>
      <View
        style={[
          styles.emojiWrap,
          { backgroundColor: isIncome ? colors.incomeSoft : colors.surfaceAlt },
        ]}>
        <Text style={styles.emoji}>{category.emoji}</Text>
      </View>
      <View style={styles.details}>
        <Text
          style={[styles.label, { color: colors.text }]}
          numberOfLines={1}>
          {category.label}
        </Text>
        {transaction.note ? (
          <Text
            style={[styles.note, { color: colors.textMuted }]}
            numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {sign}
        {formatBDT(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 22,
  },
  details: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamily('medium'),
  },
  note: {
    fontSize: 12.5,
    marginTop: 2,
    fontFamily: fontFamily('regular'),
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily('bold'),
    fontVariant: ['tabular-nums'],
  },
});
