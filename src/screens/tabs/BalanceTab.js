import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../../services/StorageService';
import BalanceChart from '../../components/BalanceChart';


const BalanceTab = ({ route, navigation }) => {
    const { year, month } = route.params;
    const theme = useTheme();

    const [data, setData] = useState(null);
    const [totals, setTotals] = useState({
        realIncome: 0,
        realExpense: 0,
        balance: 0
    });

    const loadData = async () => {
        const monthData = await StorageService.getMonth(year, month);
        if (monthData) {
            setData(monthData);

            const realIncome = (monthData.incomes || []).reduce((sum, item) => sum + (item.amountUSD || 0), 0);
            const realExpense = (monthData.expenses || []).reduce((sum, item) => sum + (item.amountUSD || 0), 0);

            setTotals({
                realIncome,
                realExpense,
                balance: realIncome - realExpense
            });
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [year, month])
    );

    const handleDeleteMonth = () => {
        Alert.alert(
            "Eliminar Mes",
            "¿Estás seguro de que quieres eliminar este mes? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        await StorageService.deleteMonth(year, month);
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    }
                }
            ]
        );
    };

    if (!data) return <View style={styles.loading}><Text>Cargando...</Text></View>;

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card style={styles.card}>
                <Card.Title title={`Balance - ${month}/${year}`} subtitle={`Tasa: ${data.rate} ${data.currency.code}/USD`} />
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionHeader}>Estimado (USD)</Text>
                    <View style={styles.row}>
                        <Text>Ingreso Total:</Text>
                        <Text style={styles.money}>{data.incomeEst.toFixed(2)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.totalLabel}>Egreso Total:</Text>
                        <Text style={styles.money}>{data.expenseEst.toFixed(2)}</Text>
                    </View>

                    {data.expenseEstItems && data.expenseEstItems.length > 0 && (
                        <View style={styles.breakdownContainer}>
                            {data.expenseEstItems.map((item, index) => (
                                <View key={index} style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>• {item.description}</Text>
                                    <Text style={styles.breakdownValue}>{parseFloat(item.amount).toFixed(2)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Divider style={styles.divider} />

                    <BalanceChart
                        income={totals.realIncome}
                        expense={totals.realExpense}
                    />

                </Card.Content>
            </Card>

            <View style={styles.actions}>
                <Button mode="contained-tonal" buttonColor={theme.colors.errorContainer} textColor={theme.colors.onErrorContainer} onPress={handleDeleteMonth} style={styles.button}>
                    Eliminar Mes Actual
                </Button>
                <Button mode="contained" onPress={() => navigation.navigate('Home')} style={styles.button}>
                    Volver a Inicio
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flexGrow: 1
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    card: {
        marginBottom: 20
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4
    },
    money: {
        fontWeight: 'bold'
    },
    sectionHeader: {
        marginTop: 10,
        marginBottom: 5,
        fontWeight: 'bold',
        color: '#666'
    },
    divider: {
        marginVertical: 10
    },
    balanceRow: {
        marginTop: 10,
        alignItems: 'center'
    },
    actions: {
        marginTop: 20
    },
    button: {
        marginBottom: 10,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    breakdownContainer: {
        marginLeft: 15,
        marginTop: 5,
        marginBottom: 10,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#666',
    },
    breakdownValue: {
        fontSize: 14,
        color: '#666',
    }
});

export default BalanceTab;
