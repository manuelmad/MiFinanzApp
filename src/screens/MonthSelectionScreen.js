import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../services/StorageService';

const getMonthName = (monthNum) => {
    const dates = new Date(2023, monthNum - 1, 1);
    return dates.toLocaleString('es-ES', { month: 'long' });
};

const MonthSelectionScreen = ({ navigation }) => {
    const theme = useTheme();
    const [data, setData] = useState({});

    const loadData = async () => {
        const allData = await StorageService.getAllData();
        // Sort years descending
        const sortedData = {};
        Object.keys(allData).sort((a, b) => b - a).forEach(year => {
            sortedData[year] = allData[year];
        });
        setData(sortedData);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleMonthPress = (year, month) => {
        navigation.navigate('MonthDetail', { year, month });
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {Object.keys(data).length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="bodyLarge">No hay meses cargados.</Text>
                </View>
            ) : (
                Object.keys(data).map(year => (
                    <Card key={year} style={styles.yearCard}>
                        <Card.Title title={year} titleVariant="titleLarge" />
                        <Card.Content>
                            <View style={styles.monthsGrid}>
                                {Object.keys(data[year]).sort((a, b) => b - a).map(month => (
                                    <TouchableOpacity
                                        key={`${year}-${month}`}
                                        style={styles.monthItem}
                                        onPress={() => handleMonthPress(year, month)}
                                    >
                                        <View style={[styles.monthButton, { backgroundColor: theme.colors.primaryContainer }]}>
                                            <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                                                {getMonthName(month).toUpperCase()}
                                            </Text>
                                            <Text variant="labelSmall">
                                                {data[year][month].currency.code}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>
                ))
            )}
            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50
    },
    yearCard: {
        marginBottom: 15
    },
    monthsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    monthItem: {
        width: '48%', // Approx 2 columns
        marginBottom: 10
    },
    monthButton: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center'
    }
});

export default MonthSelectionScreen;
