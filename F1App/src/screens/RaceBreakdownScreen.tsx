import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Zap } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';

interface Result {
  position: number;
  number: number;
  code: string;
  fullName: string;
  team: string;
  colour: string;
  fastestLap: number | null;
  pits: { lap: number; duration: number }[];
  stints: { compound: string; lapStart: number; lapEnd: number }[];
}

interface RaceData {
  session: string;
  fastestLap: {
    time: number;
    driver: string;
    fullName: string;
  };
  results: Result[];
}

const TYRE: Record<string, string> = {
  SOFT: '#e8002d', MEDIUM: '#ffd700',
  HARD: '#f0f0f0', INTER: '#43b02a', WET: '#0067ff',
};

function formatLapTime(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

function posColor(p: number) {
  if (p === 1) return colors.yellow;
  if (p === 2) return '#bbbbbb';
  if (p === 3) return '#cd7f32';
  return colors.muted2;
}

export default function RaceBreakdownScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { sessionKey, raceName, raceDate } = route.params;

  const [data, setData] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRaceResult(sessionKey)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionKey]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={16} color={colors.red} strokeWidth={1.5} />
          <Text style={styles.backText}>History</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{raceName}</Text>
        <Text style={styles.subtitle}>
          RACE RESULTS · {raceDate ? new Date(raceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : ''}
        </Text>
        <View style={styles.redLine} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} size="large" />
      ) : !data ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No race data available</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Fastest Lap Card */}
          {data.fastestLap?.time && (
            <View style={styles.flCard}>
              <View style={styles.flTop}>
                <Zap size={12} color={colors.green} strokeWidth={1.5} />
                <Text style={styles.flLabel}>Fastest Lap</Text>
              </View>
              <Text style={styles.flTime}>{formatLapTime(data.fastestLap.time)}</Text>
              <Text style={styles.flDriver}>
                {data.fastestLap.fullName} · {data.fastestLap.driver}
              </Text>
            </View>
          )}

          {/* Results */}
          <Text style={styles.sectionLabel}>Race Classification</Text>
          {data.results.map(r => (
            <View key={r.number} style={styles.resultRow}>
              {/* Team bar */}
              <View style={[styles.teamBar, { backgroundColor: r.colour || colors.muted2 }]} />

              {/* Position */}
              <Text style={[styles.pos, { color: posColor(r.position) }]}>
                {r.position}
              </Text>

              {/* Headshot */}
              <Image
                source={{ uri: `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${r.fullName?.charAt(0)}/${r.code}01_${r.fullName?.replace(' ', '_')}/${r.code?.toLowerCase()}01.png` }}
                style={styles.headshot}
              />

              {/* Driver */}
              <View style={styles.driverInfo}>
                <Text style={[styles.code, { color: r.colour || colors.text }]}>
                  {r.code}
                </Text>
                <Text style={styles.team} numberOfLines={1}>{r.team}</Text>
              </View>

              {/* Right side */}
              <View style={styles.rightCol}>
                {/* Stint dots */}
                <View style={styles.stints}>
                  {r.stints.map((s, i) => (
                    <View
                      key={i}
                      style={[styles.stintDot, { backgroundColor: TYRE[s.compound] || colors.muted2 }]}
                    />
                  ))}
                </View>
                {/* Fastest lap tag */}
                {r.fastestLap && r.fastestLap === data.fastestLap?.time && (
                  <View style={styles.flTag}>
                    <Zap size={8} color={colors.green} strokeWidth={1.5} />
                    <Text style={styles.flTagText}>FL</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Tyre Legend */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Tyre Compounds</Text>
          <View style={styles.tyreLegend}>
            {Object.entries(TYRE).map(([name, color]) => (
              <View key={name} style={styles.tyreItem}>
                <View style={[styles.tyreDot, { backgroundColor: color }]} />
                <Text style={styles.tyreName}>{name}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10, color: colors.red,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 28, color: colors.text,
    textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 30,
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
  scroll: { padding: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11, color: colors.muted, letterSpacing: 1,
  },
  flCard: {
    backgroundColor: 'rgba(0,210,190,0.04)',
    borderRadius: radius.md,
    padding: 14, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(0,210,190,0.2)',
  },
  flTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  flLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.green,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  flTime: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 28, color: colors.green, lineHeight: 30,
  },
  flDriver: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.muted, marginTop: 4,
  },
  sectionLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted2,
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 6,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    marginBottom: 4, padding: 9,
    paddingHorizontal: 12, gap: 10,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', position: 'relative',
  },
  teamBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 2, borderRadius: 2,
  },
  pos: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 19, width: 22, textAlign: 'center',
  },
  headshot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.s3,
  },
  driverInfo: { flex: 1 },
  code: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 15, letterSpacing: 0.5, lineHeight: 16,
  },
  team: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2,
  },
  rightCol: { alignItems: 'flex-end', gap: 3 },
  stints: { flexDirection: 'row', gap: 2 },
  stintDot: { width: 8, height: 8, borderRadius: 2 },
  flTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  flTagText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.green, letterSpacing: 0.5,
  },
  tyreLegend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  tyreItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tyreDot: { width: 9, height: 9, borderRadius: 2 },
  tyreName: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
});