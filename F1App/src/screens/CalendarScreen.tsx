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
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';

interface Session {
  sessionKey: string;
  sessionName: string;
  sessionType: string;
  dateStart: string;
}

interface Meeting {
  round: number;
  name: string;
  location: string;
  country: string;
  countryCode: string;
  circuit: string;
  dateStart: string;
  sessions: Session[];
}

const FLAG: Record<string, string> = {
  AUS: '🇦🇺', CHN: '🇨🇳', JPN: '🇯🇵', BHR: '🇧🇭',
  SAU: '🇸🇦', MIA: '🇺🇸', ITA: '🇮🇹', MON: '🇲🇨',
  CAN: '🇨🇦', ESP: '🇪🇸', AUT: '🇦🇹', GBR: '🇬🇧',
  HUN: '🇭🇺', BEL: '🇧🇪', NLD: '🇳🇱', AZE: '🇦🇿',
  SGP: '🇸🇬', USA: '🇺🇸', MEX: '🇲🇽', BRA: '🇧🇷',
  LVG: '🇺🇸', ABD: '🇦🇪', QAT: '🇶🇦',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const [calendar, setCalendar] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCalendar('2026')
      .then(data => setCalendar(data.calendar || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getRaceSession = (sessions: Session[]) =>
    sessions.find(s => s.sessionType === 'Race' || s.sessionName === 'Race');

  const renderMeeting = ({ item }: { item: Meeting }) => {
    const raceSession = getRaceSession(item.sessions);
    const flag = FLAG[item.countryCode] || '🏁';

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHead}>
          <Text style={styles.round}>R{String(item.round).padStart(2, '0')}</Text>
          <Text style={styles.flag}>{flag}</Text>
          <View style={styles.raceInfo}>
            {/* Tap name → track info */}
            <TouchableOpacity
              onPress={() => navigation.navigate('TrackInfo', {
                sessionKey: raceSession?.sessionKey || '',
                name: item.name,
                circuit: item.circuit,
                location: item.location,
                country: item.country,
              })}
            >
              <Text style={styles.raceName}>{item.name}</Text>
            </TouchableOpacity>
            <Text style={styles.raceLocation}>{item.circuit}</Text>
          </View>
          <Text style={styles.raceDate}>{formatDate(item.dateStart)}</Text>
        </View>

        {/* Session Pills */}
        <View style={styles.pills}>
          {item.sessions.map(s => {
            const isRace = s.sessionType === 'Race' || s.sessionName === 'Race';
            return (
              <TouchableOpacity
                key={s.sessionKey}
                style={[styles.pill, isRace && styles.pillRace]}
                onPress={() => {
                  if (isRace) {
                    navigation.navigate('LiveTrack', {
                      sessionKey: s.sessionKey,
                      raceName: item.name,
                    });
                  } else {
                    navigation.navigate('TrackInfo', {
                      sessionKey: s.sessionKey,
                      name: item.name + ' · ' + s.sessionName,
                      circuit: item.circuit,
                      location: item.location,
                      country: item.country,
                    });
                  }
                }}
              >
                <Text style={[styles.pillText, isRace && styles.pillTextRace]}>
                  {s.sessionName}
                  {isRace && <ChevronRight size={8} color={colors.orange} strokeWidth={1.5} />}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>2025 FORMULA 1 SEASON · 24 ROUNDS</Text>
        <View style={styles.redLine} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} size="large" />
      ) : calendar.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No calendar data available</Text>
        </View>
      ) : (
        <FlatList
          data={calendar}
          keyExtractor={m => String(m.round)}
          renderItem={renderMeeting}
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
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 9, color: colors.muted, textAlign: 'right',
  },
  pills: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 4, paddingHorizontal: 12, paddingBottom: 10,
  },
  pill: {
    paddingVertical: 3, paddingHorizontal: 9,
    borderRadius: radius.sm,
    backgroundColor: colors.s2,
  },
  pillRace: {
    borderWidth: 1,
    borderColor: 'rgba(255,135,0,0.3)',
    backgroundColor: 'rgba(255,135,0,0.06)',
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  pillText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  pillTextRace: { color: colors.orange },
});