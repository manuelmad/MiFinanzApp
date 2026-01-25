import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../../services/StorageService';

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
                        <Text>Egreso Total:</Text>
                        <Text style={styles.money}>{data.expenseEst.toFixed(2)}</Text>
                    </View>

                    <Divider style={styles.divider} />

                    <Text variant="titleMedium" style={styles.sectionHeader}>Real (USD)</Text>
                    <View style={styles.row}>
                        <Text>Ingresos Reales:</Text>
                        <Text style={[styles.money, { color: 'green' }]}>{totals.realIncome.toFixed(2)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Egresos Reales:</Text>
                        <Text style={[styles.money, { color: 'red' }]}>{totals.realExpense.toFixed(2)}</Text>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={[styles.row, styles.balanceRow]}>
                        <Text variant="titleLarge">Balance:</Text>
                        <Text variant="titleLarge" style={{ color: totals.balance >= 0 ? 'green' : 'red' }}>
                            {totals.balance.toFixed(2)} USD
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            <View style={styles.actions}>
                <Button mode="contained" onPress={() => navigation.navigate('Home')} style={styles.button}>
                    Volver a Inicio
                </Button>
                <Button mode="contained-tonal" buttonColor={theme.colors.errorContainer} textColor={theme.colors.onErrorContainer} onPress={handleDeleteMonth} style={styles.button}>
                    Eliminar Mes Actual
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
        marginBottom: 10
    }
});

export default BalanceTab;
