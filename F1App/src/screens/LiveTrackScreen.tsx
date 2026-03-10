import Svg, { Path, Circle } from 'react-native-svg';
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
import { ChevronLeft, Radio } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';

interface Position {
  position: number;
  number: number;
  code: string;
  fullName: string;
  team: string;
  colour: string;
}

interface TrackPoint {
  x: number;
  y: number;
}

const TYRE_COLOR: Record<string, string> = {
  SOFT: '#e8002d',
  MEDIUM: '#ffd700',
  HARD: '#f0f0f0',
  INTER: '#43b02a',
  WET: '#0067ff',
};

const TYRE_LABEL: Record<string, string> = {
  SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTER: 'I', WET: 'W',
};

export default function LiveTrackScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { sessionKey, raceName } = route.params;

  const [positions, setPositions] = useState<Position[]>([]);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStandings(sessionKey),
      api.getTrack(sessionKey),
    ])
      .then(([standingsData, trackData]) => {
        setPositions(standingsData.standings || []);
        setTrackPoints(trackData.trackOutline || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionKey]);

  // Normalise track points to fit in 300×180 box
  const normalisedTrack = () => {
    if (!trackPoints.length) return [];
    const xs = trackPoints.map(p => p.x);
    const ys = trackPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const W = 300, H = 160, pad = 16;
    return trackPoints.map(p => ({
      x: pad + ((p.x - minX) / (maxX - minX)) * (W - pad * 2),
      y: pad + ((p.y - minY) / (maxY - minY)) * (H - pad * 2),
    }));
  };

  // Build SVG path string from normalised points
  const trackPath = () => {
    const pts = normalisedTrack();
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={16} color={colors.red} strokeWidth={1.5} />
          <Text style={styles.backText}>Calendar</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Live Track</Text>
          <View style={styles.liveBadge}>
            <Radio size={10} color={colors.red} strokeWidth={1.5} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{raceName?.toUpperCase()}</Text>
        <View style={styles.redLine} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Track Map */}
          <View style={styles.trackBox}>
            <Text style={styles.trackLabel}>{raceName}</Text>
            {trackPoints.length > 0 ? (
              <TrackMap path={trackPath()} positions={positions} />
            ) : (
              <View style={styles.trackPlaceholder}>
                <Text style={styles.trackPlaceholderText}>Track map unavailable</Text>
              </View>
            )}
          </View>

          {/* Gap Table */}
          <Text style={styles.sectionLabel}>Race Order</Text>
          {positions.map(p => (
            <View key={p.number} style={styles.gapRow}>
              <Text style={[styles.gapPos, p.position <= 3 && { color: colors.yellow }]}>
                {p.position}
              </Text>
              <Text style={[styles.gapCode, { color: p.colour || colors.text }]}>
                {p.code}
              </Text>
              <View style={[styles.tyre, { backgroundColor: TYRE_COLOR.MEDIUM }]}>
                <Text style={styles.tyreLabel}>{TYRE_LABEL.MEDIUM}</Text>
              </View>
              <Text style={styles.gapTeam} numberOfLines={1}>{p.team}</Text>
              <Text style={styles.gapTime}>
                {p.position === 1 ? 'Leader' : '—'}
              </Text>
            </View>
          ))}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Track Map (SVG) ──
function TrackMap({ path, positions }: { path: string; positions: Position[] }) {
  const W = 300, H = 180;
  return (
    <View style={styles.trackMapContainer}>
      <Text style={styles.trackMapNote}>
        {positions.length} cars · {path ? 'Track outline loaded' : 'Loading...'}
      </Text>
      <Svg width={W} height={H}>
        {path ? (
          <Path
            d={path}
            fill="none"
            stroke="#333333"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {/* Car dots require live location data — shown when available */}
      </Svg>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 30, color: colors.text,
    textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 32,
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.red,
    borderRadius: radius.pill,
    paddingVertical: 3, paddingHorizontal: 8,
    backgroundColor: 'rgba(232,0,45,0.06)',
  },
  liveText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.red,
    letterSpacing: 1.5, textTransform: 'uppercase',
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
  trackBox: {
    backgroundColor: colors.s1,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    padding: spacing.md,
  },
  trackLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8,
  },
  trackMapContainer: { alignItems: 'center' },
  trackMapNote: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted2,
    letterSpacing: 1, marginBottom: 8,
    textAlign: 'center',
  },
  trackOval: {
    width: 240, height: 140,
    position: 'relative',
    borderWidth: 8, borderColor: colors.s3,
    borderRadius: 70,
    backgroundColor: 'transparent',
  },
  trackOvalInner: {
    position: 'absolute',
    top: 12, left: 12, right: 12, bottom: 12,
    borderWidth: 2, borderColor: colors.s2,
    borderRadius: 60,
  },
  carDot: {
    position: 'absolute',
    width: 10, height: 10,
    borderRadius: 5,
  },
  trackPlaceholder: {
    height: 140, alignItems: 'center', justifyContent: 'center',
  },
  trackPlaceholderText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10, color: colors.muted,
  },
  sectionLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted2,
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 6,
  },
  gapRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.s1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 4, gap: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  gapPos: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 16, color: colors.muted2,
    width: 18, textAlign: 'center',
  },
  gapCode: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 15, fontWeight: '700',
    width: 40,
  },
  tyre: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  tyreLabel: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 8, color: '#000', fontWeight: '800',
  },
  gapTeam: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted,
    flex: 1, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  gapTime: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10, color: colors.muted,
    minWidth: 50, textAlign: 'right',
  },
});