import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Zap } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';

interface Race {
  round: number;
  name: string;
  location: string;
  country: string;
  circuit: string;
  date: string;
  sessionKey: string;
}

const FLAG: Record<string, string> = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦', Miami: '🇺🇸', Italy: '🇮🇹', Monaco: '🇲🇨',
  Canada: '🇨🇦', Spain: '🇪🇸', Austria: '🇦🇹', 'Great Britain': '🇬🇧',
  Hungary: '🇭🇺', Belgium: '🇧🇪', Netherlands: '🇳🇱', Azerbaijan: '🇦🇿',
  Singapore: '🇸🇬', 'United States': '🇺🇸', Mexico: '🇲🇽', Brazil: '🇧🇷',
  'United Arab Emirates': '🇦🇪', Qatar: '🇶🇦',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHistory('2026')
      .then(data => setHistory(data.history || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const renderRace = ({ item }: { item: Race }) => {
    const flag = FLAG[item.country] || '🏁';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RaceBreakdown', {
          sessionKey: item.sessionKey,
          raceName: item.name,
          raceDate: item.date,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <Text style={styles.round}>R{String(item.round).padStart(2, '0')}</Text>
          <Text style={styles.flag}>{flag}</Text>
          <View style={styles.raceInfo}>
            <Text style={styles.raceName}>{item.name}</Text>
            <Text style={styles.raceLocation}>{item.circuit}</Text>
          </View>
          <Text style={styles.raceDate}>{formatDate(item.date)}</Text>
          <ChevronRight size={14} color={colors.muted2} strokeWidth={1.5} />
        </View>

        {/* Winner placeholder — real data loads in breakdown */}
        <View style={styles.cardBottom}>
          <View style={styles.winnerRow}>
            <Text style={styles.winnerLabel}>🥇</Text>
            <Text style={styles.winnerText}>Tap to view full results</Text>
          </View>
          <View style={styles.flRow}>
            <Zap size={10} color={colors.green} strokeWidth={1.5} />
            <Text style={styles.flText}>Fastest lap inside</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>2025 SEASON · {history.length} RACES COMPLETED</Text>
        <View style={styles.redLine} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} size="large" />
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No race history available</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={r => String(r.round)}
          renderItem={renderRace}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 30, color: colors.text,
    textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10, color: colors.muted,
    letterSpacing: 1.5, marginTop: 3,
  },
  redLine: {
    height: 1, marginTop: 10,
    backgroundColor: colors.red,
    opacity: 0.6, width: '60%',
  },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11, color: colors.muted, letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    marginBottom: 6,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 10,
  },
  round: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.red,
    letterSpacing: 1, minWidth: 28,
  },
  flag: { fontSize: 22 },
  raceInfo: { flex: 1 },
  raceName: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 15, color: colors.text,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  raceLocation: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2,
  },
  raceDate: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.muted,
  },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 10,
    gap: 8,
  },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  winnerLabel: { fontSize: 12 },
  winnerText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  flRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.green,
    letterSpacing: 0.8,
  },
});