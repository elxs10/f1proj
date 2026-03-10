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
import { ChevronLeft, Wind, Zap } from 'lucide-react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { colors, spacing, radius } from '../theme';
import { api } from '../api';

interface TelemetryData {
  latest: {
    speed: number;
    rpm: number;
    gear: number;
    throttle: number;
    brake: boolean;
    drs: number | null;
    time: string;
  };
  chartData: {
    speed: number;
    rpm: number;
    throttle: number;
    time: string;
  }[];
}

export default function TelemetryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { driverNumber, driverName, team, headshot, session } = route.params;

  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTelemetry(driverNumber, session)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [driverNumber, session]);

  const drsOpen = data?.latest?.drs === 1;
  const braking = data?.latest?.brake;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={16} color={colors.red} strokeWidth={1.5} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Telemetry</Text>
        <Text style={styles.subtitle}>{driverName?.toUpperCase()} · SESSION {session}</Text>
        <View style={styles.redLine} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} size="large" />
      ) : !data ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No telemetry available</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Driver Hero */}
          <View style={styles.hero}>
            <Image source={{ uri: headshot }} style={styles.heroShot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>
                {driverName?.split(' ').pop()?.toUpperCase()}
              </Text>
              <Text style={styles.heroTeam}>{team}</Text>
            </View>
            <Text style={[styles.heroNum, { color: colors.red }]}>
              {driverNumber}
            </Text>
          </View>

          {/* DRS + Brake pills */}
          <View style={styles.pillRow}>
            <View style={[styles.pill, drsOpen && styles.pillGreen]}>
              <Wind size={12} color={drsOpen ? colors.green : colors.muted} strokeWidth={1.5} />
              <Text style={[styles.pillText, drsOpen && { color: colors.green }]}>
                AERO {drsOpen ? 'ACTIVE' : 'STOWED'}
              </Text>
            </View>
            <View style={[styles.pill, braking && styles.pillRed]}>
              <Zap size={12} color={braking ? colors.red : colors.muted} strokeWidth={1.5} />
              <Text style={[styles.pillText, braking && { color: colors.red }]}>
                {braking ? 'BRAKING' : 'NO BRAKE'}
              </Text>
            </View>
          </View>

          {/* Stat Grid */}
          <View style={styles.grid}>
            <StatCard
              label="Speed"
              value={data.latest.speed}
              unit="km/h"
              fill={data.latest.speed / 360}
              barColor={colors.red}
            />
            <StatCard
              label="RPM"
              value={(data.latest.rpm / 1000).toFixed(1)}
              unit="k"
              fill={data.latest.rpm / 13000}
              barColor={colors.orange}
            />
            <StatCard
              label="Gear"
              value={data.latest.gear}
              unit=""
              fill={data.latest.gear / 8}
              barColor={colors.green}
            />
            <StatCard
              label="Throttle"
              value={data.latest.throttle}
              unit="%"
              fill={data.latest.throttle / 100}
              barColor={colors.orange}
            />
          </View>

          {/* Speed Chart */}
          <LineChart
            title="Speed Trace"
            unit="km/h"
            data={data.chartData.map(p => p.speed)}
            color={colors.red}
            min={0}
            max={360}
            yLabels={['0', '120', '240', '360']}
          />

          {/* RPM Chart */}
          <LineChart
            title="RPM"
            unit="rpm"
            data={data.chartData.map(p => p.rpm)}
            color={colors.orange}
            min={0}
            max={13000}
            yLabels={['0', '4k', '8k', '13k']}
          />

          {/* Throttle Chart */}
          <LineChart
            title="Throttle %"
            unit="%"
            data={data.chartData.map(p => p.throttle)}
            color={colors.green}
            min={0}
            max={100}
            yLabels={['0', '25', '50', '75', '100']}
          />

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Line Chart ──
function LineChart({ title, unit, data, color, min, max, yLabels }: {
  title: string;
  unit: string;
  data: number[];
  color: string;
  min: number;
  max: number;
  yLabels: string[];
}) {
  const W = 320;
  const H = 100;
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const n = data.length;
  if (!n) return null;

  const range = max - min || 1;

  // Build polyline points
  const pts = data.map((v, i) => {
    const x = padL + (i / Math.max(n - 1, 1)) * chartW;
    const y = padT + (1 - Math.max(0, Math.min(1, (v - min) / range))) * chartH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Peak value
  const peak = Math.max(...data);
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / n);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title.toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Text style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>AVG </Text>
            <Text style={{ color }}>{avg}{unit}</Text>
          </Text>
          <Text style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>PEAK </Text>
            <Text style={{ color }}>{peak}{unit}</Text>
          </Text>
        </View>
      </View>

      <Svg width={W} height={H}>
        {/* Y axis grid lines + labels */}
        {yLabels.map((label, i) => {
          const y = padT + (1 - i / (yLabels.length - 1)) * chartH;
          return (
            <React.Fragment key={label}>
              <Line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#222222"
                strokeWidth={1}
              />
              <SvgText
                x={padL - 4}
                y={y + 4}
                fontSize={8}
                fill="#555555"
                textAnchor="end"
                fontFamily="JetBrainsMono-Regular"
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X axis */}
        <Line
          x1={padL}
          y1={padT + chartH}
          x2={W - padR}
          y2={padT + chartH}
          stroke="#333333"
          strokeWidth={1}
        />

        {/* Line */}
        <Polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Latest value dot */}
        {data.length > 0 && (() => {
          const last = data[data.length - 1];
          const x = padL + chartW;
          const y = padT + (1 - Math.max(0, Math.min(1, (last - min) / range))) * chartH;
          return <Circle cx={x} cy={y} r={3} fill={color} />;
        })()}
      </Svg>
    </View>
  );
}

// ── Stat Card ──
function StatCard({ label, value, unit, fill, barColor }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statUnit}>{unit}</Text>
      </Text>
      <View style={styles.statBar}>
        <View
          style={[
            styles.statFill,
            {
              width: `${Math.min(fill * 100, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
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
  scroll: { padding: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11, color: colors.muted, letterSpacing: 1,
  },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.s1, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  heroShot: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: colors.red,
    backgroundColor: colors.s1,
  },
  heroName: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 24, color: colors.text,
    textTransform: 'uppercase', lineHeight: 26,
  },
  heroTeam: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 2,
  },
  heroNum: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 44, lineHeight: 44, opacity: 0.5,
  },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  pillGreen: { borderColor: colors.green, backgroundColor: 'rgba(0,210,190,0.06)' },
  pillRed: { borderColor: colors.red, backgroundColor: 'rgba(232,0,45,0.06)' },
  pillText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9, color: colors.muted,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  statCard: {
    width: '48%', backgroundColor: colors.s1,
    borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  statLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 30, color: colors.text, lineHeight: 32,
  },
  statUnit: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12, color: colors.muted,
  },
  statBar: { height: 2, backgroundColor: colors.border, borderRadius: 2, marginTop: 8 },
  statFill: { height: '100%', borderRadius: 2 },
  chartCard: {
    backgroundColor: colors.s1, borderRadius: radius.md,
    padding: 14, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  chartTitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8, color: colors.muted, letterSpacing: 2,
  },
  chartStat: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
  },
  chartStatLabel: {
    color: colors.muted,
  },
});