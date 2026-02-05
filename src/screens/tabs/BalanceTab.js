import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, useTheme, IconButton, Portal, Dialog, TextInput } from 'react-native-paper';
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

    // Edit logic states
    const [incomeDialogVisible, setIncomeDialogVisible] = useState(false);
    const [expenseDialogVisible, setExpenseDialogVisible] = useState(false);
    const [rateDialogVisible, setRateDialogVisible] = useState(false);
    const [tempIncome, setTempIncome] = useState('');
    const [tempRate, setTempRate] = useState('');
    const [editingExpenseIndex, setEditingExpenseIndex] = useState(null);
    const [tempExpenseDescription, setTempExpenseDescription] = useState('');
    const [tempExpenseAmount, setTempExpenseAmount] = useState('');

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

    const handleSaveIncome = async () => {
        const incomeValue = parseFloat(tempIncome);
        if (isNaN(incomeValue)) {
            Alert.alert("Error", "Por favor ingresa un monto válido.");
            return;
        }

        const updatedData = { ...data, incomeEst: incomeValue };
        await StorageService.saveMonth(year, month, updatedData);
        setData(updatedData);
        setIncomeDialogVisible(false);
    };

    const handleSaveExpense = async () => {
        const amountValue = parseFloat(tempExpenseAmount);
        if (isNaN(amountValue) || !tempExpenseDescription.trim()) {
            Alert.alert("Error", "Por favor ingresa una descripción y un monto válido.");
            return;
        }

        const updatedItems = [...data.expenseEstItems];
        if (editingExpenseIndex !== null) {
            updatedItems[editingExpenseIndex] = {
                description: tempExpenseDescription,
                amount: amountValue
            };
        }

        const newExpenseEst = updatedItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const updatedData = {
            ...data,
            expenseEstItems: updatedItems,
            expenseEst: newExpenseEst
        };

        await StorageService.saveMonth(year, month, updatedData);
        setData(updatedData);
        setExpenseDialogVisible(false);
    };

    const handleSaveRate = async () => {
        const rateValue = parseFloat(tempRate);
        if (isNaN(rateValue) || rateValue <= 0) {
            Alert.alert("Error", "Por favor ingresa una tasa válida.");
            return;
        }

        // Deep clone to avoid direct state mutation
        const updatedData = JSON.parse(JSON.stringify(data));
        updatedData.rate = rateValue;

        // Recalculate incomes
        if (updatedData.incomes) {
            updatedData.incomes = updatedData.incomes.map(income => {
                if (income.subEntries) {
                    income.subEntries = income.subEntries.map(sub => ({
                        ...sub,
                        amountUSD: sub.amountLocal / rateValue
                    }));
                    income.amountUSD = income.subEntries.reduce((sum, s) => sum + s.amountUSD, 0);
                    income.amountLocal = income.subEntries.reduce((sum, s) => sum + s.amountLocal, 0);
                } else {
                    income.amountUSD = income.amountLocal / rateValue;
                }
                return income;
            });
        }

        // Recalculate expenses
        if (updatedData.expenses) {
            updatedData.expenses = updatedData.expenses.map(expense => {
                if (expense.subEntries) {
                    expense.subEntries = expense.subEntries.map(sub => ({
                        ...sub,
                        amountUSD: sub.amountLocal / rateValue
                    }));
                    expense.amountUSD = expense.subEntries.reduce((sum, s) => sum + s.amountUSD, 0);
                    expense.amountLocal = expense.subEntries.reduce((sum, s) => sum + s.amountLocal, 0);
                } else {
                    expense.amountUSD = expense.amountLocal / rateValue;
                }
                return expense;
            });
        }

        await StorageService.saveMonth(year, month, updatedData);
        setData(updatedData);

        // Update local totals for chart
        const realIncome = (updatedData.incomes || []).reduce((sum, item) => sum + (item.amountUSD || 0), 0);
        const realExpense = (updatedData.expenses || []).reduce((sum, item) => sum + (item.amountUSD || 0), 0);

        setTotals({
            realIncome,
            realExpense,
            balance: realIncome - realExpense
        });

        setRateDialogVisible(false);
    };

    const handleDeleteExpense = (index) => {
        Alert.alert(
            "Eliminar Egreso",
            "¿Estás seguro de que quieres eliminar este egreso estimado?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const updatedItems = data.expenseEstItems.filter((_, i) => i !== index);
                        const newExpenseEst = updatedItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
                        const updatedData = {
                            ...data,
                            expenseEstItems: updatedItems,
                            expenseEst: newExpenseEst
                        };

                        await StorageService.saveMonth(year, month, updatedData);
                        setData(updatedData);
                    }
                }
            ]
        );
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
                <Card.Title
                    title={`Balance - ${month}/${year}`}
                    subtitle={
                        <View style={styles.subtitleContainer}>
                            <Text style={styles.subtitleText}>{`Tasa: ${data.rate} ${data.currency.code}/USD`}</Text>
                            <IconButton
                                icon="pencil"
                                size={14}
                                onPress={() => {
                                    setTempRate(data.rate.toString());
                                    setRateDialogVisible(true);
                                }}
                                style={styles.subtitleIcon}
                            />
                        </View>
                    }
                />
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionHeader}>Estimado (USD)</Text>
                    <View style={styles.row}>
                        <View style={styles.labelContainer}>
                            <Text>Ingreso Total:</Text>
                            <IconButton
                                icon="pencil"
                                size={16}
                                onPress={() => {
                                    setTempIncome(data.incomeEst.toString());
                                    setIncomeDialogVisible(true);
                                }}
                            />
                        </View>
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
                                    <View style={styles.expenseItemLabel}>
                                        <Text style={styles.breakdownLabel}>• {item.description}</Text>
                                        <View style={styles.itemActions}>
                                            <IconButton
                                                icon="pencil"
                                                size={14}
                                                onPress={() => {
                                                    setEditingExpenseIndex(index);
                                                    setTempExpenseDescription(item.description);
                                                    setTempExpenseAmount(item.amount.toString());
                                                    setExpenseDialogVisible(true);
                                                }}
                                            />
                                            <IconButton
                                                icon="delete"
                                                size={14}
                                                iconColor={theme.colors.error}
                                                onPress={() => handleDeleteExpense(index)}
                                            />
                                        </View>
                                    </View>
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

            <Portal>
                <Dialog visible={incomeDialogVisible} onDismiss={() => setIncomeDialogVisible(false)}>
                    <Dialog.Title>Editar Ingreso Estimado</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Ingreso Estimado (USD)"
                            value={tempIncome}
                            onChangeText={setTempIncome}
                            keyboardType="numeric"
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setIncomeDialogVisible(false)}>Cancelar</Button>
                        <Button onPress={handleSaveIncome}>Guardar</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={expenseDialogVisible} onDismiss={() => setExpenseDialogVisible(false)}>
                    <Dialog.Title>Editar Egreso Estimado</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Descripción"
                            value={tempExpenseDescription}
                            onChangeText={setTempExpenseDescription}
                            mode="outlined"
                            style={{ marginBottom: 10 }}
                        />
                        <TextInput
                            label="Monto (USD)"
                            value={tempExpenseAmount}
                            onChangeText={setTempExpenseAmount}
                            keyboardType="numeric"
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setExpenseDialogVisible(false)}>Cancelar</Button>
                        <Button onPress={handleSaveExpense}>Guardar</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={rateDialogVisible} onDismiss={() => setRateDialogVisible(false)}>
                    <Dialog.Title>Editar Tasa de Cambio</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label={`Tasa (${data.currency.code}/USD)`}
                            value={tempRate}
                            onChangeText={setTempRate}
                            keyboardType="numeric"
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setRateDialogVisible(false)}>Cancelar</Button>
                        <Button onPress={handleSaveRate}>Guardar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

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
        fontWeight: 'bold',
        alignSelf: 'center'
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
        alignItems: 'center',
        marginVertical: -4,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#666',
        maxWidth: '60%'
    },
    breakdownValue: {
        fontSize: 14,
        color: '#666',
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expenseItemLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemActions: {
        flexDirection: 'row',
    },
    subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtitleText: {
        fontSize: 14,
        color: '#666',
    },
    subtitleIcon: {
        margin: 0,
        marginLeft: 4,
    }
});

export default BalanceTab;
