import Svg, { Polyline, Circle } from 'react-native-svg';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';

interface TrackData {
  track: {
    name: string;
    location: string;
    country: string;
    year: number;
    sessionName: string;
  };
  trackOutline: { x: number; y: number }[];
  sectors: {
    sector1: { x: number; y: number }[];
    sector2: { x: number; y: number }[];
    sector3: { x: number; y: number }[];
  };
  totalPoints: number;
}

export default function TrackInfoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { sessionKey, name, circuit, location, country } = route.params;

  const [data, setData] = useState<TrackData | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getTrack(sessionKey),
      api.getStandings(sessionKey),
    ])
      .then(([trackData, standingsData]) => {
        setData(trackData);
        setStandings(standingsData.standings || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionKey]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={16} color={colors.red} strokeWidth={1.5} />
          <Text style={styles.backText}>Calendar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{circuit || name}</Text>
        <Text style={styles.subtitle}>{location?.toUpperCase()} · {country?.toUpperCase()}</Text>
        <View style={styles.redLine} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Circuit Outline */}
          <View style={styles.circuitBox}>
            <CircuitOutline
              sector1={data?.sectors?.sector1 || []}
              sector2={data?.sectors?.sector2 || []}
              sector3={data?.sectors?.sector3 || []}
              fallback={data?.trackOutline || []}
            />
            <Text style={styles.pointsLabel}>
              {data?.totalPoints || 0} coordinate points
            </Text>
          </View>

          {/* Session Results */}
          {standings.length > 0 && (
            <View style={styles.resultsBox}>
              <Text style={styles.resultsTitle}>SESSION RESULTS</Text>
              {standings.map((d: any) => (
                <View key={`${d.number}-${d.position}`} style={styles.resultRow}>
                  <Text style={[styles.resultPos, d.position <= 3 && { color: colors.yellow }]}>
                    {d.position}
                  </Text>
                  <View style={[styles.resultBar, { backgroundColor: `#${d.colour}` }]} />
                  <Text style={styles.resultCode}>{d.code}</Text>
                  <Text style={styles.resultTeam}>{d.team}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Circuit Outline ──
function CircuitOutline({ sector1, sector2, sector3, fallback }: {
  sector1: { x: number; y: number }[];
  sector2: { x: number; y: number }[];
  sector3: { x: number; y: number }[];
  fallback: { x: number; y: number }[];
}) {
  const allPoints = sector1.length ? [...sector1, ...sector2, ...sector3] : fallback;
  if (!allPoints.length) {
    return (
      <View style={styles.outlinePlaceholder}>
        <Text style={styles.outlinePlaceholderText}>Circuit outline unavailable</Text>
      </View>
    );
  }

  const points = allPoints;
  // Normalise points to 260×140 box
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = 260, H = 140, pad = 12;

  const norm = points.map(p => ({
    x: pad + ((p.x - minX) / (maxX - minX || 1)) * (W - pad * 2),
    y: pad + ((p.y - minY) / (maxY - minY || 1)) * (H - pad * 2),
  }));

  // Normalise a sector's points using the same scale
  const normSector = (pts: { x: number; y: number }[]) => {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return pts.map(p => ({
      x: pad + ((p.x - minX) / (maxX - minX || 1)) * (W - pad * 2),
      y: pad + ((p.y - minY) / (maxY - minY || 1)) * (H - pad * 2),
    }));
  };

  const n1 = sector1.length ? normSector(sector1) : norm;
  const n2 = sector2.length ? normSector(sector2) : [];
  const n3 = sector3.length ? normSector(sector3) : [];

  const toPoints = (pts: { x: number; y: number }[]) =>
    pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={{ width: W, height: H, backgroundColor: '#0d0d0d', borderRadius: 8 }}>
      <Svg width={W} height={H}>
        {/* Sector 1 — Red */}
        <Polyline
          points={toPoints(n1)}
          fill="none"
          stroke="#e8002d"
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Sector 2 — Blue */}
        {n2.length > 0 && (
          <Polyline
            points={toPoints(n2)}
            fill="none"
            stroke="#4781D7"
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {/* Sector 3 — Yellow */}
        {n3.length > 0 && (
          <Polyline
            points={toPoints(n3)}
            fill="none"
            stroke="#ffd700"
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {/* S/F dot */}
        <Circle cx={norm[0]?.x || 0} cy={norm[0]?.y || 0} r={5} fill="#00d2be" />
      </Svg>
      {/* S/F label */}
      <View style={{ position: 'absolute', left: (norm[0]?.x || 0) + 8, top: (norm[0]?.y || 0) - 8 }}>
        <Text style={{ fontFamily: 'JetBrainsMono-Regular', fontSize: 7, color: '#00d2be' }}>S/F</Text>
      </View>
    </View>
  );
}

// ── Stat Box ──
function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
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
  circuitBox: {
    backgroundColor: colors.s1,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pointsLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted2,
    letterSpacing: 1, marginTop: 8,
    textTransform: 'uppercase',
  },
  resultsBox: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultsTitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#555555',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  resultPos: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16,
    color: '#888888',
    width: 28,
  },
  resultBar: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: 10,
  },
  resultCode: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 1,
    flex: 1,
  },
  resultTeam: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: '#555555',
    letterSpacing: 0.5,
  },
  outlinePlaceholder: {
    width: 260, height: 140,
    alignItems: 'center', justifyContent: 'center',
  },
  outlinePlaceholderText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10, color: colors.muted,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 6, marginBottom: 6,
  },
  statBox: {
    width: '48%',
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  statFull: {
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  statLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 22, color: colors.text, lineHeight: 24,
  },
  statSub: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.muted, marginTop: 3,
  },
});