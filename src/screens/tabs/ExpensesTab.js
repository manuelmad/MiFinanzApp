import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { Button, DataTable, Portal, Text, TextInput, useTheme, IconButton, Switch } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../../services/StorageService';

// Generic Modal for Adding/Editing Transaction (Duplicated from IncomeTab for simplicity in this file)
const TransactionModal = ({ visible, onClose, onSubmit, initialData, rate, currencyCode, type, parentDesc, isRenamingCategory }) => {
    const theme = useTheme();
    const [desc, setDesc] = useState('');
    const [amountLocal, setAmountLocal] = useState('');
    const [amountUSD, setAmountUSD] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setDesc(initialData.description || '');
                setAmountLocal(initialData.amountLocal?.toString() || '');
                setAmountUSD(initialData.amountUSD?.toString() || '');
                setDate(initialData.date || '');
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

    const handleSave = () => {
        if (isRenamingCategory) {
            if (!desc) { alert("Ingrese una descripción"); return; }
            onSubmit({ description: desc });
            onClose();
            return;
        }

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
                        {isRenamingCategory ? 'Renombrar Categoría' : (initialData ? 'Editar ' + type : 'Agregar ' + type)}
                    </Text>

                    <TextInput label="Descripción" value={desc} onChangeText={setDesc} style={styles.input} />

                    {!isRenamingCategory && (
                        <>
                            <TextInput
                                label={`Monto (${currencyCode})`}
                                value={amountLocal}
                                keyboardType="numeric"
                                onChangeText={handleLocalChange}
                                style={styles.input}
                            />
                            <TextInput
                                label="Monto (USD)"
                                value={amountUSD}
                                keyboardType="numeric"
                                onChangeText={handleUSDChange}
                                style={styles.input}
                            />
                            <TextInput label="Fecha (YYYY-MM-DD)" value={date} onChangeText={setDate} style={styles.input} />
                        </>
                    )}

                    <View style={styles.modalButtons}>
                        <Button onPress={onClose} style={{ marginRight: 10 }}>Cancelar</Button>
                        <Button mode="contained" onPress={handleSave}>Guardar</Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const ExpensesTab = ({ route, navigation }) => {
    const { year, month } = route.params;
    const theme = useTheme();
    const [data, setData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingParent, setEditingParent] = useState(null);
    const [editingSub, setEditingSub] = useState(null);
    const [isRenaming, setIsRenaming] = useState(false);

    const loadData = async () => {
        const monthData = await StorageService.getMonth(year, month);
        setData(monthData);
    };

    useFocusEffect(useCallback(() => { loadData(); }, [year, month]));

    const recalculateTotals = (expense) => {
        const subEntries = expense.subEntries || [];
        const totalLocal = subEntries.reduce((sum, sub) => sum + sub.amountLocal, 0);
        const totalUSD = subEntries.reduce((sum, sub) => sum + sub.amountUSD, 0);
        return {
            ...expense,
            amountLocal: totalLocal,
            amountUSD: totalUSD
        };
    };

    const handleSaveItem = async (formItem) => {
        if (!data) return;
        let newExpenses = [...(data.expenses || [])];

        if (isRenaming && editingParent) {
            const index = newExpenses.findIndex(i => i.id === editingParent.id);
            if (index >= 0) {
                newExpenses[index] = { ...newExpenses[index], description: formItem.description };
            }
        } else if (editingParent) {
            // Adding/Editing sub-entry
            const parentIndex = newExpenses.findIndex(i => i.id === editingParent.id);
            if (parentIndex >= 0) {
                let parent = { ...newExpenses[parentIndex] };
                if (!parent.subEntries) {
                    parent.subEntries = [{
                        id: 'legacy-' + parent.id,
                        amountLocal: parent.amountLocal,
                        amountUSD: parent.amountUSD,
                        date: parent.date,
                        description: parent.description
                    }];
                }

                const subIndex = parent.subEntries.findIndex(s => s.id === formItem.id);
                if (subIndex >= 0) {
                    parent.subEntries[subIndex] = formItem;
                } else {
                    parent.subEntries.push(formItem);
                }
                newExpenses[parentIndex] = recalculateTotals(parent);
            }
        } else {
            // New expense category
            const newItem = {
                id: Date.now().toString(),
                description: formItem.description,
                subEntries: [formItem],
                amountLocal: formItem.amountLocal,
                amountUSD: formItem.amountUSD,
                date: formItem.date
            };
            newExpenses.push(newItem);
        }

        const newData = { ...data, expenses: newExpenses };
        await StorageService.saveMonth(year, month, newData);
        loadData();
    };

    const handleDeleteMain = async (id) => {
        Alert.alert("Eliminar Todo", "¿Borrar este grupo de egresos y todos sus valores?", [
            { text: "Cancel" },
            {
                text: "Eliminar", style: 'destructive', onPress: async () => {
                    const newExpenses = data.expenses.filter(i => i.id !== id);
                    await StorageService.saveMonth(year, month, { ...data, expenses: newExpenses });
                    loadData();
                }
            }
        ]);
    };

    const handleDeleteSub = async (parentId, subId) => {
        Alert.alert("Eliminar Valor", "¿Borrar este valor individual?", [
            { text: "Cancel" },
            {
                text: "Eliminar", style: 'destructive', onPress: async () => {
                    const newExpenses = [...data.expenses];
                    const parentIndex = newExpenses.findIndex(i => i.id === parentId);
                    if (parentIndex >= 0) {
                        const parent = { ...newExpenses[parentIndex] };
                        parent.subEntries = (parent.subEntries || []).filter(s => s.id !== subId);
                        if (parent.subEntries.length === 0) {
                            newExpenses.splice(parentIndex, 1);
                        } else {
                            newExpenses[parentIndex] = recalculateTotals(parent);
                        }
                        await StorageService.saveMonth(year, month, { ...data, expenses: newExpenses });
                        loadData();
                    }
                }
            }
        ]);
    };

    const openAddNew = () => {
        setEditingParent(null);
        setEditingSub(null);
        setIsRenaming(false);
        setModalVisible(true);
    };

    const openAddSub = (parent) => {
        setEditingParent(parent);
        setEditingSub(null);
        setIsRenaming(false);
        setModalVisible(true);
    };

    const openEditSub = (parent, sub) => {
        setEditingParent(parent);
        setEditingSub(sub);
        setIsRenaming(false);
        setModalVisible(true);
    };

    const openRenameCategory = (parent) => {
        setEditingParent(parent);
        setEditingSub({ description: parent.description });
        setIsRenaming(true);
        setModalVisible(true);
    };

    if (!data) return <View style={styles.center}><Text>Cargando...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerRow}>
                <Text variant="titleMedium">Egresos Reales</Text>
                <Button mode="contained" onPress={openAddNew}>
                    + Nuevo
                </Button>
            </View>

            <ScrollView>
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title style={{ flex: 2 }}>Descripción / Valor</DataTable.Title>
                        <DataTable.Title numeric>USD</DataTable.Title>
                        <DataTable.Title numeric>Acciones</DataTable.Title>
                    </DataTable.Header>

                    {(data.expenses || []).map((item) => (
                        <React.Fragment key={item.id}>
                            <DataTable.Row style={{ backgroundColor: theme.colors.surfaceVariant }}>
                                <DataTable.Cell style={{ flex: 2 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{item.description}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <Text style={{ fontWeight: 'bold' }}>{item.amountUSD.toFixed(2)}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <View style={{ flexDirection: 'row' }}>
                                        <IconButton style={{ marginRight: 40 }} icon="pencil-outline" size={18} onPress={() => openRenameCategory(item)} />
                                        <IconButton icon="plus" size={18} onPress={() => openAddSub(item)} />
                                        <IconButton icon="delete-sweep" size={18} onPress={() => handleDeleteMain(item.id)} />
                                    </View>
                                </DataTable.Cell>
                            </DataTable.Row>

                            {(item.subEntries || []).map((sub) => (
                                <DataTable.Row key={sub.id} onPress={() => openEditSub(item, sub)}>
                                    <DataTable.Cell style={{ flex: 2, paddingLeft: 15 }}>
                                        <View>
                                            <Text variant="bodySmall" style={{ fontWeight: '500' }}>
                                                └ {sub.description || '(Sin desc)'}
                                            </Text>
                                            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginLeft: 12 }}>
                                                {sub.date}
                                            </Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <Text variant="bodySmall">{sub.amountUSD.toFixed(2)}</Text>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <IconButton icon="delete-outline" size={16} onPress={() => handleDeleteSub(item.id, sub.id)} />
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))}
                        </React.Fragment>
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
                initialData={editingSub}
                parentDesc={editingParent ? editingParent.description : null}
                rate={data.rate}
                currencyCode={data.currency.code}
                type={editingParent ? "Valor" : "Egreso"}
                isRenamingCategory={isRenaming}
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

export default ExpensesTab;
