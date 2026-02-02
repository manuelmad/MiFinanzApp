import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Text, TextInput, Button, HelperText, Card, useTheme } from 'react-native-paper';
import currencies from '../data/currencies';

const CreateMonthModal = ({ visible, onClose, onSubmit }) => {
    const theme = useTheme();

    // Form State
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [currencyName, setCurrencyName] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [rate, setRate] = useState('');
    const [incomeEst, setIncomeEst] = useState('');
    const [expenseItems, setExpenseItems] = useState([{ description: '', amount: '' }]);
    const [expenseEst, setExpenseEst] = useState('0');

    // UI State
    const [showCurrencyList, setShowCurrencyList] = useState(false);
    const [filteredCurrencies, setFilteredCurrencies] = useState([]);

    useEffect(() => {
        if (visible) {
            // Reset form on open
            setYear(new Date().getFullYear().toString());
            setMonth((new Date().getMonth() + 1).toString());
            setCurrencyName('');
            setSelectedCurrency(null);
            setRate('');
            setIncomeEst('');
            setExpenseItems([{ description: '', amount: '' }]);
            setExpenseEst('0');
            setShowCurrencyList(false);
        }
    }, [visible]);

    useEffect(() => {
        if (currencyName && !selectedCurrency) {
            const filtered = currencies.filter(c =>
                c.name.toLowerCase().includes(currencyName.toLowerCase()) ||
                c.code.toLowerCase().includes(currencyName.toLowerCase())
            );
            setFilteredCurrencies(filtered);
            setShowCurrencyList(true);
        } else {
            setShowCurrencyList(false);
        }
    }, [currencyName, selectedCurrency]);

    useEffect(() => {
        const total = expenseItems.reduce((sum, item) => {
            const val = parseFloat(item.amount);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
        setExpenseEst(total.toString());
    }, [expenseItems]);

    const addExpenseItem = () => {
        setExpenseItems([...expenseItems, { description: '', amount: '' }]);
    };

    const removeExpenseItem = (index) => {
        if (expenseItems.length > 1) {
            const newItems = [...expenseItems];
            newItems.splice(index, 1);
            setExpenseItems(newItems);
        } else {
            setExpenseItems([{ description: '', amount: '' }]);
        }
    };

    const updateExpenseItem = (index, field, value) => {
        const newItems = [...expenseItems];
        newItems[index][field] = value;
        setExpenseItems(newItems);
    };

    const handleCurrencySelect = (curr) => {
        setSelectedCurrency(curr);
        setCurrencyName(curr.name);
        setShowCurrencyList(false);
    };

    const handleCreate = () => {
        if (!year || !month || !selectedCurrency || !rate || !incomeEst || !expenseEst) {
            // Basic validation: alert or showing errors (handled better in real app)
            alert('Por favor complete todos los campos');
            return;
        }

        const monthNum = parseInt(month);
        if (monthNum < 1 || monthNum > 12) {
            alert('Mes inválido (1-12)');
            return;
        }

        onSubmit({
            year,
            month,
            currency: selectedCurrency,
            rate: parseFloat(rate),
            incomeEst: parseFloat(incomeEst),
            expenseEst: parseFloat(expenseEst),
            expenseEstItems: expenseItems.filter(item => item.description.trim() !== '' && !isNaN(parseFloat(item.amount)))
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <Text variant="headlineMedium" style={styles.title}>Crear Nuevo Mes</Text>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.row}>
                            <TextInput
                                label="Año"
                                value={year}
                                keyboardType="numeric"
                                onChangeText={setYear}
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                mode="outlined"
                            />
                            <TextInput
                                label="Mes (1-12)"
                                value={month}
                                keyboardType="numeric"
                                onChangeText={setMonth}
                                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                                mode="outlined"
                            />
                        </View>

                        <View style={styles.currencyContainer}>
                            <TextInput
                                label="Moneda Local"
                                value={currencyName}
                                onChangeText={(text) => {
                                    setCurrencyName(text);
                                    setSelectedCurrency(null); // Reset selection on edit
                                }}
                                style={styles.input}
                                mode="outlined"
                                right={selectedCurrency ? <TextInput.Icon icon="check" /> : null}
                            />
                            {showCurrencyList && (
                                <Card style={styles.currencyList}>
                                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                                        {filteredCurrencies.map((item) => (
                                            <TouchableOpacity key={item.code} onPress={() => handleCurrencySelect(item)}>
                                                <View style={styles.currencyItem}>
                                                    <Text>{item.name} ({item.code})</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </Card>
                            )}
                        </View>

                        <TextInput
                            label="Tasa de Cambio (Local / USD)"
                            value={rate}
                            keyboardType="numeric"
                            onChangeText={setRate}
                            style={styles.input}
                            mode="outlined"
                        />

                        <TextInput
                            label="Ingreso Total Estimado (USD)"
                            value={incomeEst}
                            keyboardType="numeric"
                            onChangeText={setIncomeEst}
                            style={styles.input}
                            mode="outlined"
                        />

                        <Text variant="titleMedium" style={styles.sectionTitle}>Egresos Estimados</Text>
                        {expenseItems.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <TextInput
                                    label="Descripción"
                                    value={item.description}
                                    onChangeText={(text) => updateExpenseItem(index, 'description', text)}
                                    style={[styles.input, { flex: 2, marginRight: 8 }]}
                                    mode="outlined"
                                />
                                <TextInput
                                    label="Monto (USD)"
                                    value={item.amount}
                                    keyboardType="numeric"
                                    onChangeText={(text) => updateExpenseItem(index, 'amount', text)}
                                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                                    mode="outlined"
                                />
                                <TouchableOpacity onPress={() => removeExpenseItem(index)} style={styles.removeIcon}>
                                    <TextInput.Icon icon="delete" color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <Button icon="plus" mode="outlined" onPress={addExpenseItem} style={styles.addButton}>
                            Agregar Item de Egreso
                        </Button>

                        <TextInput
                            label="Egreso Total Estimado (USD)"
                            value={expenseEst}
                            editable={false}
                            style={styles.input}
                            mode="outlined"
                        />

                        <View style={styles.buttonRow}>
                            <Button mode="text" onPress={onClose} style={styles.button}>
                                Cancelar
                            </Button>
                            <Button mode="contained" onPress={handleCreate} style={styles.button}>
                                Crear
                            </Button>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        padding: 20,
        borderRadius: 10,
        maxHeight: '90%',
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    scrollContent: {
        paddingBottom: 20
    },
    input: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 0
    },
    currencyContainer: {
        position: 'relative',
        zIndex: 10,
        marginBottom: 15
    },
    currencyList: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 20,
        maxHeight: 150
    },
    currencyItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10
    },
    button: {
        marginLeft: 10
    },
    sectionTitle: {
        marginTop: 10,
        marginBottom: 10,
        fontWeight: 'bold'
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5
    },
    removeIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        width: 40
    },
    addButton: {
        marginBottom: 20,
        marginTop: 5
    }
});

export default CreateMonthModal;
