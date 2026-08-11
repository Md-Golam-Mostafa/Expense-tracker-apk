/**
 * Expense Tracker — React Native
 *
 * A clean, offline-first expense & income tracker with BDT currency,
 * monthly summaries and local persistence via AsyncStorage.
 *
 * @format
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { AddTransactionModal } from './src/components/AddTransactionModal';
import { SummaryCard } from './src/components/SummaryCard';
import { TransactionItem } from './src/components/TransactionItem';
import { darkTheme, lightTheme, fontFamily, Theme } from './src/theme';
import { Transaction } from './src/types';
import {
  addMonths,
  formatLongDate,
  monthKeyOf,
  monthLabel,
  sortTransactions,
  summaryForMonth,
  toDateKey,
} from './src/utils';
import { loadTransactions, saveTransactions } from './src/storage';

type Section = { kind: 'header'; key: string } | { kind: 'item'; transaction: Transaction };

function groupIntoSections(transactions: Transaction[]): Section[] {
  const sections: Section[] = [];
  let currentDate: string | null = null;
  for (const tx of transactions) {
    if (tx.date !== currentDate) {
      currentDate = tx.date;
      sections.push({ kind: 'header', key: tx.date });
    }
    sections.push({ kind: 'item', transaction: tx });
  }
  return sections;
}

function HomeScreen({ theme }: { theme: Theme }) {
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const today = new Date();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [modalVisible, setModalVisible] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    loadTransactions().then(data => {
      if (mounted) {
        setTransactions(data);
        setHydrated(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveTransactions(transactions);
    }
  }, [transactions, hydrated]);

  useEffect(() => {
    // Entrance animation on mount, so the FAB is visible from the start.
    Animated.spring(fabAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 30,
      bounciness: 6,
    }).start();
  }, [fabAnim]);

  const monthKey = monthKeyOf(viewMonth);
  const summary = useMemo(
    () => summaryForMonth(transactions, monthKey),
    [transactions, monthKey],
  );
  const monthTransactions = useMemo(
    () =>
      sortTransactions(transactions.filter(tx => monthKeyOf(tx.date) === monthKey)),
    [transactions, monthKey],
  );
  const sections = useMemo(
    () => groupIntoSections(monthTransactions),
    [monthTransactions],
  );

  const handleSave = useCallback((tx: Transaction) => {
    setTransactions(prev => [...prev, tx]);
    // Jump to the month of the new transaction so it's visible.
    const txDate = tx.date.split('-');
    setViewMonth(new Date(Number(txDate[0]), Number(txDate[1]) - 1, 1));
    setModalVisible(false);
  }, []);

  const handleLongPress = useCallback(
    (tx: Transaction) => {
      const doDelete = () =>
        setTransactions(prev => prev.filter(t => t.id !== tx.id));
      const message = `${tx.type === 'income' ? '+' : '−'} ${tx.amount} on ${formatLongDate(tx.date)}`;

      if (Platform.OS === 'web') {
        // react-native-web's Alert is a no-op; use a native confirm dialog.
        const confirmDialog = (globalThis as unknown as {
          confirm?: (msg?: string) => boolean;
        }).confirm;
        if (confirmDialog?.(`Delete transaction?\n\n${message}`)) {
          doDelete();
        }
        return;
      }

      Alert.alert('Delete transaction?', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    },
    [],
  );

  const changeMonth = (delta: number) => {
    setViewMonth(prev => addMonths(prev, delta));
  };

  const isCurrentMonth =
    viewMonth.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {isCurrentMonth ? 'This month' : 'Overview'}
          </Text>
          <View style={styles.monthRow}>
            <Pressable
              onPress={() => changeMonth(-1)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.monthArrow,
                { backgroundColor: colors.surface },
                pressed && { opacity: 0.6 },
              ]}>
              <Text style={[styles.monthArrowText, { color: colors.primary }]}>
                ‹
              </Text>
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {monthLabel(viewMonth.getFullYear(), viewMonth.getMonth())}
            </Text>
            <Pressable
              onPress={() => changeMonth(1)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.monthArrow,
                { backgroundColor: colors.surface },
                pressed && { opacity: 0.6 },
              ]}>
              <Text style={[styles.monthArrowText, { color: colors.primary }]}>
                ›
              </Text>
            </Pressable>
          </View>
        </View>
        <View
          style={[
            styles.logoBadge,
            { backgroundColor: colors.primarySoft },
          ]}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>
      </View>

      <SummaryCard
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
        theme={theme}
      />

      {/* Transaction list */}
      <Text style={[styles.listTitle, { color: colors.text }]}>
        Transactions
        <Text style={{ color: colors.textMuted, fontWeight: '400' }}>
          {'  '}
          {monthTransactions.length}
        </Text>
      </Text>

      <FlatList
        data={sections}
        keyExtractor={item =>
          item.kind === 'header' ? `h-${item.key}` : `t-${item.transaction.id}`
        }
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <Text style={[styles.dateHeader, { color: colors.textSecondary }]}>
              {formatLongDate(item.key)}
              {item.key === toDateKey(new Date()) ? '  •  Today' : ''}
            </Text>
          ) : (
            <TransactionItem
              transaction={item.transaction}
              theme={theme}
              onPress={handleLongPress}
            />
          )
        }
        ListEmptyComponent={
          hydrated ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗂️</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Tap the + button to add your first expense or income.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Animated.View
        style={[
          styles.fabWrap,
          {
            bottom: insets.bottom + 24,
            opacity: fabAnim,
            transform: [
              {
                translateY: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          },
        ]}>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.fab, shadowColor: colors.primary },
            pressed && { transform: [{ scale: 0.92 }] },
          ]}>
          <Text style={[styles.fabText, { color: colors.fabText }]}>+</Text>
        </Pressable>
      </Animated.View>

      <AddTransactionModal
        visible={modalVisible}
        theme={theme}
        calendarYear={viewMonth.getFullYear()}
        calendarMonth={viewMonth.getMonth()}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <HomeScreen theme={theme} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: fontFamily('medium'),
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  monthArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: -2,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '800',
    marginHorizontal: 12,
    fontFamily: fontFamily('bold'),
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 4,
    paddingHorizontal: 16,
    fontFamily: fontFamily('bold'),
  },
  dateHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: fontFamily('medium'),
  },
  listContent: {
    paddingTop: 4,
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fontFamily('bold'),
  },
  emptySub: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    fontFamily: fontFamily('regular'),
  },
  fabWrap: {
    position: 'absolute',
    right: 24,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 34,
    marginTop: -2,
  },
});

export default App;
