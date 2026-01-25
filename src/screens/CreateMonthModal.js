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
    const [expenseEst, setExpenseEst] = useState('');

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
            setExpenseEst('');
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
            expenseEst: parseFloat(expenseEst)
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

                        <TextInput
                            label="Egreso Total Estimado (USD)"
                            value={expenseEst}
                            keyboardType="numeric"
                            onChangeText={setExpenseEst}
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
    }
});

export default CreateMonthModal;
