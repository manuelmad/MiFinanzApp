import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, Button, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StorageService } from '../services/StorageService';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const YearSelectionScreen = ({ navigation }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [allData, setAllData] = useState({});
    const [selectedYear, setSelectedYear] = useState(null);

    const loadData = async () => {
        const data = await StorageService.getAllData();
        setAllData(data);
        const years = Object.keys(data).sort((a, b) => b - a);
        if (years.length > 0 && !selectedYear) {
            setSelectedYear(years[0]);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const chartData = useMemo(() => {
        if (!selectedYear || !allData[selectedYear]) return null;

        const yearData = allData[selectedYear];
        const monthlyStats = Array(12).fill(0).map(() => ({ income: 0, expense: 0, balance: 0 }));

        Object.keys(yearData).forEach(mStr => {
            const mIdx = parseInt(mStr) - 1;
            const month = yearData[mStr];
            const income = (month.incomes || []).reduce((sum, i) => sum + (i.amountUSD || 0), 0);
            const expense = (month.expenses || []).reduce((sum, e) => sum + (e.amountUSD || 0), 0);

            monthlyStats[mIdx] = {
                income,
                expense,
                balance: income - expense
            };
        });

        const accumulatedStats = [];
        let accIncome = 0;
        let accExpense = 0;

        monthlyStats.forEach(stat => {
            accIncome += stat.income;
            accExpense += stat.expense;
            accumulatedStats.push({
                income: accIncome,
                expense: accExpense,
                balance: accIncome - accExpense
            });
        });

        return { monthly: monthlyStats, accumulated: accumulatedStats };
    }, [selectedYear, allData]);

    const renderLineChart = (dataEntries, title) => {
        if (!dataEntries) return null;

        const chartConfig = {
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`, // theme.colors.primary color roughly
            labelColor: (opacity = 1) => theme.colors.onSurface,
            propsForDots: { r: "4", strokeWidth: "2", stroke: theme.colors.primary },
            useShadowColorFromDataset: true
        };

        const datasets = [
            {
                data: dataEntries.map(d => d.income),
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green
                strokeWidth: 2
            },
            {
                data: dataEntries.map(d => d.expense),
                color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red
                strokeWidth: 2
            },
            {
                data: dataEntries.map(d => d.balance),
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue
                strokeWidth: 3
            }
        ];

        return (
            <Card style={styles.chartCard}>
                <Card.Title title={title} />
                <Card.Content>
                    <LineChart
                        data={{
                            labels: monthLabels,
                            datasets: datasets,
                            legend: ["Ingresos", "Egresos", "Balance"]
                        }}
                        width={width - 40}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        yAxisLabel="$"
                    />
                </Card.Content>
            </Card>
        );
    };

    const years = Object.keys(allData).sort((a, b) => b - a);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
        >
            <View style={styles.yearSelector}>
                <Text variant="titleMedium">Año:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
                    {years.map(y => (
                        <Button
                            key={y}
                            mode={selectedYear === y ? "contained" : "outlined"}
                            onPress={() => setSelectedYear(y)}
                            style={styles.yearButton}
                        >
                            {y}
                        </Button>
                    ))}
                </ScrollView>
            </View>

            {chartData ? (
                <>
                    {renderLineChart(chartData.monthly, "Flujo Mensual (USD)")}
                    {renderLineChart(chartData.accumulated, "Flujo Acumulado (USD)")}
                </>
            ) : (
                <View style={styles.empty}>
                    <Text>No hay datos suficientes para mostrar gráficas.</Text>
                </View>
            )}

            <View style={styles.footer}>
                <Button mode="outlined" onPress={() => navigation.goBack()}>
                    Volver
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    yearSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    yearScroll: { marginLeft: 10 },
    yearButton: { marginRight: 8 },
    chartCard: { marginBottom: 20 },
    chart: { marginVertical: 8, borderRadius: 16 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    footer: { padding: 20, alignItems: 'center' }
});

export default YearSelectionScreen;
