import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../services/StorageService';
import CreateMonthModal from './CreateMonthModal';

const HomeScreen = ({ navigation }) => {
    const theme = useTheme();

    const [hasData, setHasData] = useState(false);
    const [lastMonth, setLastMonth] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const loadData = async () => {
        const data = await StorageService.getAllData();
        const years = Object.keys(data).sort((a, b) => b - a); // Descending years

        if (years.length > 0) {
            const latestYear = years[0];
            const months = Object.keys(data[latestYear]).sort((a, b) => b - a); // Descending months

            if (months.length > 0) {
                setHasData(true);
                setLastMonth({ year: latestYear, month: months[0] });
            } else {
                setHasData(false);
            }
        } else {
            setHasData(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleCreateMonth = async (monthData) => {
        try {
            await StorageService.createMonth(
                monthData.year,
                monthData.month,
                monthData.currency,
                monthData.rate,
                monthData.incomeEst,
                monthData.expenseEst
            );
            await loadData(); // Refresh state
            // Optionally navigate to the new month immediately? 
            // User didn't specify, but it's good UX.
            // But prompt says "Initial options ... disabled ... until data exists".
            // I'll just stay on Home and let user choose, or maybe just reload.
            alert('Mes creado exitosamente');
        } catch (e) {
            console.error(e);
            alert('Error al crear el mes');
        }
    };

    const navigateToMonth = (target) => {
        if (target) {
            navigation.navigate('MonthDetail', { year: target.year, month: target.month });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text variant="displaySmall" style={styles.header}>MiFinanzApp</Text>

            <View style={styles.buttonContainer}>
                <Button
                    mode="contained-tonal"
                    disabled={!hasData}
                    onPress={() => navigateToMonth(lastMonth)}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Ver Último Mes
                </Button>

                <Button
                    mode="contained-tonal"
                    disabled={!hasData}
                    onPress={() => navigation.navigate('MonthSelection')}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Ver Otros Meses
                </Button>

                <Button
                    mode="contained"
                    onPress={() => setShowCreateModal(true)}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Crear Mes Nuevo
                </Button>
            </View>

            <CreateMonthModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateMonth}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 40,
        fontWeight: 'bold',
        color: '#6200ee'
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
    },
    button: {
        marginBottom: 16,
    },
    buttonContent: {
        paddingVertical: 8
    }
});

export default HomeScreen;
