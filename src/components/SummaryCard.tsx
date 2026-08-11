import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, Theme } from '../theme';
import { formatBDT, formatBDTShort } from '../utils';

interface Props {
  income: number;
  expense: number;
  balance: number;
  theme: Theme;
}

export function SummaryCard({ income, expense, balance, theme }: Props) {
  const { colors } = theme;
  const total = income + expense;
  const expensePct = total > 0 ? (expense / total) * 100 : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <Text style={styles.eyebrow}>Balance</Text>
      <Text style={styles.balance}>{formatBDT(balance)}</Text>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: colors.surface,
              width: `${Math.min(100, Math.max(2, expensePct))}%`,
            },
          ]}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={styles.statValue}>{formatBDTShort(income)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.primarySoft }]} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Expense</Text>
          <Text style={styles.statValue}>{formatBDTShort(expense)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: fontFamily('medium'),
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
    fontFamily: fontFamily('bold'),
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 18,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily('regular'),
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    fontFamily: fontFamily('bold'),
  },
  divider: {
    width: 1,
    height: 34,
    opacity: 0.35,
    marginHorizontal: 16,
  },
});
