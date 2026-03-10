import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RefreshCw } from 'lucide-react-native';
import { api } from '../api';
import { colors } from '../theme';

interface Driver {
    position: number;
    number: number;
    code: string;
    fullName: string;
    team: string;
    colour: string;
    headshot: string;
    tyre: string;
    tyreColour: string;
    tyreAge: number;
    gap: number | string | null;
    interval: number | string | null;
}

const TYRE_LABEL: Record<string, string> = {
    SOFT: 'S',
    MEDIUM: 'M',
    HARD: 'H',
    INTERMEDIATE: 'I',
    WET: 'W',
    UNKNOWN: '?',
};

function formatGap(gap: number | string | null): string {
    if (gap === null || gap === undefined) return '—';
    if (typeof gap === 'string') return gap;
    if (gap === 0) return 'LEADER';
    return `+${gap.toFixed(3)}`;
}

function formatInterval(interval: number | string | null): string {
    if (interval === null || interval === undefined) return '—';
    if (typeof interval === 'string') return interval;
    if (interval === 0) return '—';
    return `+${interval.toFixed(3)}`;
}

export default function LiveRaceScreen() {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<{ drivers: Driver[]; session: string; updatedAt: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchLive = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            const res = await api.getLive('latest');
            if (res.error) {
                setError(res.error);
            } else {
                setData(res);
                setError(null);
                const now = new Date();
                setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
            }
        } catch (e) {
            setError('Failed to fetch live data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLive();
        const interval = setInterval(() => fetchLive(), 10000);
        return () => clearInterval(interval);
    }, [fetchLive]);

    const renderDriver = ({ item }: { item: Driver }) => {
        const isLeader = item.position === 1;
        const teamColor = `#${item.colour}`;

        return (
            <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('Telemetry', {
                    driverNumber: item.number,
                    driverName: item.code,
                    team: item.team,
                    headshot: item.headshot,
                    session: 'latest',
                })}
                activeOpacity={0.7}
            >
                {/* Position */}
                <Text style={[styles.pos, isLeader && { color: colors.yellow }]}>
                    {item.position}
                </Text>

                {/* Headshot */}
                <View style={[styles.headshotContainer, { borderColor: teamColor }]}>
                    <Image
                        source={{ uri: item.headshot }}
                        style={styles.headshot}
                    />
                </View>

                {/* Driver info */}
                <View style={styles.driverInfo}>
                    <Text style={styles.code}>{item.code}</Text>
                    <Text style={styles.team}>{item.team.toUpperCase()}</Text>
                </View>

                {/* Tyre */}
                <View style={[styles.tyre, { borderColor: item.tyreColour }]}>
                    <Text style={[styles.tyreLabel, { color: item.tyreColour }]}>
                        {TYRE_LABEL[item.tyre] || '?'}
                    </Text>
                    <Text style={[styles.tyreAge, { color: item.tyreColour }]}>
                        {item.tyreAge}
                    </Text>
                </View>

                {/* Gap / Interval */}
                <View style={styles.gaps}>
                    <Text style={[styles.gap, isLeader && { color: colors.green }]}>
                        {formatGap(item.gap)}
                    </Text>
                    <Text style={styles.intervalText}>
                        {isLeader ? '' : formatInterval(item.interval)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.red} size="large" />
                    <Text style={styles.loadingText}>LOADING LIVE DATA...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>LIVE</Text>
                </View>
                <View style={styles.center}>
                    <Text style={styles.noData}>NO LIVE SESSION</Text>
                    <Text style={styles.noDataSub}>Live data is only available during race weekends</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLive()}>
                        <RefreshCw size={14} color={colors.red} strokeWidth={1.5} />
                        <Text style={styles.retryText}>RETRY</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>LIVE</Text>
                    <Text style={styles.subtitle}>
                        <Text style={styles.dot}>● </Text>
                        UPDATED {lastUpdated}
                    </Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchLive(true)}>
                    <RefreshCw size={16} color={colors.muted} strokeWidth={1.5} />
                </TouchableOpacity>
            </View>

            {/* Column headers */}
            <View style={styles.colHeaders}>
                <Text style={[styles.colHeader, { width: 28 }]}>POS</Text>
                <Text style={[styles.colHeader, { flex: 1, marginLeft: 52 }]}>DRIVER</Text>
                <Text style={[styles.colHeader, { width: 44 }]}>TYRE</Text>
                <Text style={[styles.colHeader, { width: 90, textAlign: 'right' }]}>GAP / INT</Text>
            </View>

            <View style={styles.divider} />

            <FlatList
                data={data?.drivers}
                keyExtractor={(item) => `driver-${item.number}`}
                renderItem={renderDriver}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchLive(true)}
                        tintColor={colors.red}
                    />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080808',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    title: {
        fontFamily: 'Rajdhani-Bold',
        fontSize: 32,
        color: '#ffffff',
        letterSpacing: 2,
    },
    subtitle: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 10,
        color: '#555555',
        letterSpacing: 1,
        marginTop: 2,
    },
    dot: {
        color: '#e8002d',
    },
    refreshBtn: {
        padding: 8,
        marginTop: 4,
    },
    colHeaders: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    colHeader: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 9,
        color: '#555555',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#e8002d',
        marginHorizontal: 16,
        marginBottom: 4,
        opacity: 0.4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    pos: {
        fontFamily: 'Rajdhani-Bold',
        fontSize: 18,
        color: '#555555',
        width: 28,
    },
    headshotContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        overflow: 'hidden',
        marginRight: 10,
    },
    headshot: {
        width: '100%',
        height: '100%',
    },
    driverInfo: {
        flex: 1,
    },
    code: {
        fontFamily: 'Rajdhani-Bold',
        fontSize: 16,
        color: '#ffffff',
        letterSpacing: 1,
    },
    team: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 9,
        color: '#555555',
        letterSpacing: 0.5,
        marginTop: 1,
    },
    tyre: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    tyreLabel: {
        fontFamily: 'Rajdhani-Bold',
        fontSize: 14,
        lineHeight: 16,
    },
    tyreAge: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 8,
        lineHeight: 9,
    },
    gaps: {
        width: 90,
        alignItems: 'flex-end',
    },
    gap: {
        fontFamily: 'JetBrainsMono-Medium',
        fontSize: 12,
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    intervalText: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 9,
        color: '#555555',
        marginTop: 2,
    },
    loadingText: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 11,
        color: '#555555',
        letterSpacing: 1,
        marginTop: 12,
    },
    noData: {
        fontFamily: 'Rajdhani-Bold',
        fontSize: 22,
        color: '#ffffff',
        letterSpacing: 2,
    },
    noDataSub: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 10,
        color: '#555555',
        letterSpacing: 0.5,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e8002d',
        borderRadius: 4,
    },
    retryText: {
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 11,
        color: '#e8002d',
        letterSpacing: 1,
    },
});