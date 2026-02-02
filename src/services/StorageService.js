import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'MiFinanzApp';

export const StorageService = {
    // Get all data
    getAllData: async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : {};
        } catch (e) {
            console.error('Error reading data', e);
            return {};
        }
    },

    // Save all data
    saveAllData: async (data) => {
        try {
            const jsonValue = JSON.stringify(data);
            await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
        } catch (e) {
            console.error('Error saving data', e);
        }
    },

    // Get specific month
    getMonth: async (year, month) => {
        const data = await StorageService.getAllData();
        if (data[year] && data[year][month]) {
            return data[year][month];
        }
        return null;
    },

    // Save/Update specific month
    saveMonth: async (year, month, monthData) => {
        const data = await StorageService.getAllData();
        if (!data[year]) {
            data[year] = {};
        }
        data[year][month] = monthData;
        await StorageService.saveAllData(data);
    },

    // Delete specific month
    deleteMonth: async (year, month) => {
        const data = await StorageService.getAllData();
        if (data[year] && data[year][month]) {
            delete data[year][month];
            // Clean up year if empty
            if (Object.keys(data[year]).length === 0) {
                delete data[year];
            }
            await StorageService.saveAllData(data);
        }
    },

    // Create new month (initial data)
    createMonth: async (year, month, currency, rate, incomeEst, expenseEst, expenseEstItems = []) => {
        const newMonth = {
            currency,
            rate,
            incomeEst,
            expenseEst,
            expenseEstItems,
            incomes: [],
            expenses: []
        };
        await StorageService.saveMonth(year, month, newMonth);
    }
};
