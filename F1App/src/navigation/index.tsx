import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Trophy, Calendar, BarChart2, Radio } from 'lucide-react-native';

import StandingsScreen from '../screens/StandingsScreen';
import TelemetryScreen from '../screens/TelemetryScreen';
import CalendarScreen from '../screens/CalendarScreen';
import LiveTrackScreen from '../screens/LiveTrackScreen';
import TrackInfoScreen from '../screens/TrackInfoScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RaceBreakdownScreen from '../screens/RaceBreakdownScreen';
import LiveRaceScreen from '../screens/LiveRaceScreen';

import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const StandingsStack = createNativeStackNavigator();
const CalendarStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const LiveStack = createNativeStackNavigator();

// ── Standings Stack ──
function StandingsNavigator() {
    return (
        <StandingsStack.Navigator screenOptions={{ headerShown: false }}>
            <StandingsStack.Screen name="Standings" component={StandingsScreen} />
            <StandingsStack.Screen name="Telemetry" component={TelemetryScreen} />
        </StandingsStack.Navigator>
    );
}

// ── Calendar Stack ──
function CalendarNavigator() {
    return (
        <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
            <CalendarStack.Screen name="Calendar" component={CalendarScreen} />
            <CalendarStack.Screen name="LiveTrack" component={LiveTrackScreen} />
            <CalendarStack.Screen name="TrackInfo" component={TrackInfoScreen} />
        </CalendarStack.Navigator>
    );
}

// ── History Stack ──
function HistoryNavigator() {
    return (
        <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
            <HistoryStack.Screen name="History" component={HistoryScreen} />
            <HistoryStack.Screen name="RaceBreakdown" component={RaceBreakdownScreen} />
        </HistoryStack.Navigator>
    );
}

// ── Live Stack ──
function LiveNavigator() {
    return (
        <LiveStack.Navigator screenOptions={{ headerShown: false }}>
            <LiveStack.Screen name="LiveRace" component={LiveRaceScreen} />
            <LiveStack.Screen name="Telemetry" component={TelemetryScreen} />
        </LiveStack.Navigator>
    );
}

// ── Root Tab Navigator ──
export default function Navigation() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: colors.s1,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
                        height: 70,
                        paddingBottom: 12,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: colors.red,
                    tabBarInactiveTintColor: colors.muted,
                    tabBarLabelStyle: {
                        fontSize: 9,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        fontFamily: 'JetBrainsMono-Regular',
                        marginTop: 2,
                    },
                    tabBarIcon: ({ color }) => {
                        if (route.name === 'StandingsTab') return <Trophy size={20} color={color} strokeWidth={1.5} />;
                        if (route.name === 'CalendarTab') return <Calendar size={20} color={color} strokeWidth={1.5} />;
                        if (route.name === 'HistoryTab') return <BarChart2 size={20} color={color} strokeWidth={1.5} />;
                        if (route.name === 'LiveTab') return <Radio size={20} color={color} strokeWidth={1.5} />;
                    },
                })}
            >
                <Tab.Screen name="StandingsTab" component={StandingsNavigator} options={{ tabBarLabel: 'Standings' }} />
                <Tab.Screen name="CalendarTab" component={CalendarNavigator} options={{ tabBarLabel: 'Calendar' }} />
                <Tab.Screen name="HistoryTab" component={HistoryNavigator} options={{ tabBarLabel: 'History' }} />
                <Tab.Screen name="LiveTab" component={LiveNavigator} options={{ tabBarLabel: 'Live' }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}