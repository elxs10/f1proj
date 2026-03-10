import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, teamColors, spacing, radius } from '../theme';
import { api } from '../api';

const SESSION = 'latest';

interface Driver {
  position: number;
  number: number;
  code: string;
  fullName: string;
  team: string;
  colour: string;
  headshot: string;
  gap?: string;
}

export default function StandingsScreen() {
  const navigation = useNavigation<any>();
  const [standings, setStandings] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStandings(SESSION)
      .then(data => setStandings(data.standings || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const posColor = (p: number) => {
    if (p === 1) return colors.yellow;
    if (p === 2) return '#bbbbbb';
    if (p === 3) return '#cd7f32';
    return colors.muted2;
  };

  const renderDriver = ({ item }: { item: Driver }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        navigation.navigate('Telemetry', {
          driverNumber: item.number,
          driverCode: item.code,
          driverName: item.fullName,
          team: item.team,
          headshot: item.headshot,
          session: SESSION,
        })
      }
      activeOpacity={0.7}
    >
      {/* Team colour bar */}
      <View
        style={[
          styles.teamBar,
          { backgroundColor: item.colour || teamColors[item.team] || colors.muted2 },
        ]}
      />

      {/* Position */}
      <Text style={[styles.pos, { color: posColor(item.position) }]}>
        {item.position}
      </Text>

      {/* Headshot */}
      <Image
        source={
          item.headshot
            ? { uri: item.headshot }
            : { uri: 'https://via.placeholder.com/40x40/111111/666666' }
        }
        style={styles.headshot}
      />

      {/* Driver info */}
      <View style={styles.info}>
        <Text style={[styles.code, { color: item.colour || colors.text }]}>
          {item.code}
        </Text>
        <Text style={styles.team} numberOfLines={1}>
          {item.team}
        </Text>
      </View>

      {/* Gap */}
      <Text style={[styles.gap, item.position === 1 && styles.leader]}>
        {item.position === 1 ? 'LEADER' : item.gap ? `+${item.gap}` : '—'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Standings</Text>
        <Text style={styles.subtitle}>2025 AUSTRALIAN GP · RACE</Text>
        <View style={styles.redLine} />
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.red}
          style={{ marginTop: 40 }}
          size="large"
        />
      ) : standings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No standings data available</Text>
        </View>
      ) : (
        <FlatList
          data={standings}
          keyExtractor={d => String(d.number)}
          renderItem={renderDriver}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  title: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 30,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.5,
    marginTop: 3,
  },
  redLine: {
    height: 1,
    marginTop: 10,
    backgroundColor: colors.red,
    opacity: 0.6,
    width: '60%',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    marginBottom: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 10,
    overflow: 'hidden',
  },
  teamBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 10,
  },
  pos: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 20,
    width: 22,
    textAlign: 'center',
  },
  headshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.s3,
  },
  info: {
    flex: 1,
  },
  code: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 17,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  team: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  gap: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
  },
  leader: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.text,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1,
  },
});