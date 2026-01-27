import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Button, DataTable, Portal, Text, TextInput, useTheme, IconButton, Switch } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../../services/StorageService';

// Generic Modal for Adding/Editing Transaction
const TransactionModal = ({ visible, onClose, onSubmit, initialData, rate, currencyCode, type }) => {
    const theme = useTheme();
    const [desc, setDesc] = useState('');
    const [amountLocal, setAmountLocal] = useState('');
    const [amountUSD, setAmountUSD] = useState('');
    const [date, setDate] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [addition, setAddition] = useState('');

    useEffect(() => {
        if (visible) {
            setIsAdding(false);
            setAddition('');
            if (initialData) {
                setDesc(initialData.description);
                setAmountLocal(initialData.amountLocal.toString());
                setAmountUSD(initialData.amountUSD.toString());
                setDate(initialData.date);
            } else {
                setDesc('');
                setAmountLocal('');
                setAmountUSD('');
                setDate(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
            }
        }
    }, [visible, initialData]);

    const handleLocalChange = (val) => {
        setAmountLocal(val);
        if (val && !isNaN(val)) {
            const usd = parseFloat(val) / rate;
            setAmountUSD(usd.toFixed(2));
        } else {
            setAmountUSD('');
        }
    };

    const handleUSDChange = (val) => {
        setAmountUSD(val);
        if (val && !isNaN(val)) {
            const local = parseFloat(val) * rate;
            setAmountLocal(local.toFixed(2));
        } else {
            setAmountLocal('');
        }
    };

    const handleAdditionChange = (val) => {
        setAddition(val);
        if (initialData) {
            const base = parseFloat(initialData.amountLocal);
            const add = parseFloat(val) || 0;
            const newTotal = base + add;
            handleLocalChange(newTotal.toString());
        }
    };

    const handleSave = () => {
        if (!desc || !amountLocal || !amountUSD || !date) {
            alert("Complete todos los campos");
            return;
        }
        onSubmit({
            id: initialData ? initialData.id : Date.now().toString(),
            description: desc,
            amountLocal: parseFloat(amountLocal),
            amountUSD: parseFloat(amountUSD),
            date: date
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>
                        {initialData ? 'Editar' : 'Agregar'} {type}
                    </Text>

                    {initialData && (
                        <View style={styles.switchContainer}>
                            <Text>Sumar valor</Text>
                            <Switch value={isAdding} onValueChange={setIsAdding} />
                        </View>
                    )}

                    <TextInput label="Descripción" value={desc} onChangeText={setDesc} style={styles.input} />

                    {isAdding && (
                        <TextInput
                            label={`Monto a sumar (${currencyCode})`}
                            value={addition}
                            keyboardType="numeric"
                            onChangeText={handleAdditionChange}
                            style={styles.input}
                            autoFocus
                        />
                    )}

                    <TextInput
                        label={`Monto Total (${currencyCode})`}
                        value={amountLocal}
                        keyboardType="numeric"
                        onChangeText={handleLocalChange}
                        style={styles.input}
                        editable={!isAdding}
                    />
                    <TextInput
                        label="Monto Total (USD)"
                        value={amountUSD}
                        keyboardType="numeric"
                        onChangeText={handleUSDChange}
                        style={styles.input}
                        editable={!isAdding}
                    />
                    <TextInput label="Fecha (YYYY-MM-DD)" value={date} onChangeText={setDate} style={styles.input} />

                    <View style={styles.modalButtons}>
                        <Button onPress={onClose} style={{ marginRight: 10 }}>Cancelar</Button>
                        <Button mode="contained" onPress={handleSave}>Guardar</Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const IncomeTab = ({ route, navigation }) => {
    const { year, month } = route.params;
    const theme = useTheme();
    const [data, setData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const loadData = async () => {
        const monthData = await StorageService.getMonth(year, month);
        setData(monthData);
    };

    useFocusEffect(useCallback(() => { loadData(); }, [year, month]));

    const handleSaveItem = async (item) => {
        if (!data) return;
        const newIncomes = [...(data.incomes || [])];
        const index = newIncomes.findIndex(i => i.id === item.id);

        if (index >= 0) {
            newIncomes[index] = item;
        } else {
            newIncomes.push(item);
        }

        const newData = { ...data, incomes: newIncomes };
        await StorageService.saveMonth(year, month, newData);
        loadData();
    };

    const handleDelete = async (id) => {
        Alert.alert("Eliminar", "¿Borrar este ingreso?", [
            { text: "Cancel" },
            {
                text: "Eliminar", style: 'destructive', onPress: async () => {
                    const newIncomes = data.incomes.filter(i => i.id !== id);
                    await StorageService.saveMonth(year, month, { ...data, incomes: newIncomes });
                    loadData();
                }
            }
        ]);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    if (!data) return <View style={styles.center}><Text>Cargando...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerRow}>
                <Text variant="titleMedium">Ingresos Reales</Text>
                <Button mode="contained" onPress={() => { setEditingItem(null); setModalVisible(true); }}>
                    + Nuevo
                </Button>
            </View>

            <ScrollView>
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Desc</DataTable.Title>
                        <DataTable.Title numeric>USD</DataTable.Title>
                        <DataTable.Title numeric>Actions</DataTable.Title>
                    </DataTable.Header>

                    {(data.incomes || []).map((item) => (
                        <DataTable.Row key={item.id} onPress={() => openEdit(item)}>
                            <DataTable.Cell>{item.description}</DataTable.Cell>
                            <DataTable.Cell numeric>{item.amountUSD.toFixed(2)}</DataTable.Cell>
                            <DataTable.Cell numeric>
                                <IconButton icon="delete" size={20} onPress={() => handleDelete(item.id)} />
                            </DataTable.Cell>
                        </DataTable.Row>
                    ))}
                </DataTable>
            </ScrollView>

            <View style={{ padding: 10 }}>
                <Button mode="outlined" onPress={() => navigation.navigate('Home')}>
                    Volver a Inicio
                </Button>
            </View>

            <TransactionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSaveItem}
                initialData={editingItem}
                rate={data.rate}
                currencyCode={data.currency.code}
                type="Ingreso"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 20, borderRadius: 8 },
    modalTitle: { marginBottom: 15, textAlign: 'center' },
    input: { marginBottom: 10 },
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }
});

export default IncomeTab;
