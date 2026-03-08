import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const ExcelExport = {
    generateMonthlyExcel: async (data, year, month) => {
        const rate = data.rate || 1;
        const currencyCode = data.currency?.code || 'VES';

        // 1. Summary Sheet
        const summaryData = [
            ['Resumen del Mes', `${month}/${year}`],
            ['Tasa de Cambio', `${rate} ${currencyCode}/USD`],
            [],
            ['Categoría', 'Monto (USD)', `Monto (${currencyCode})`],
            ['Ingreso Estimado Total', data.incomeEst, data.incomeEst * rate],
            ['Egreso Estimado Total', data.expenseEst, data.expenseEst * rate],
            ['Balance Estimado', data.incomeEst - data.expenseEst, (data.incomeEst - data.expenseEst) * rate],
            [],
            ['Ingreso Real Total',
                (data.incomes || []).reduce((sum, i) => sum + (i.amountUSD || 0), 0),
                (data.incomes || []).reduce((sum, i) => sum + (i.amountLocal || 0), 0)
            ],
            ['Egreso Real Total',
                (data.expenses || []).reduce((sum, i) => sum + (i.amountUSD || 0), 0),
                (data.expenses || []).reduce((sum, i) => sum + (i.amountLocal || 0), 0)
            ],
            ['Balance Real',
                ((data.incomes || []).reduce((sum, i) => sum + (i.amountUSD || 0), 0)) - ((data.expenses || []).reduce((sum, i) => sum + (i.amountUSD || 0), 0)),
                ((data.incomes || []).reduce((sum, i) => sum + (i.amountLocal || 0), 0)) - ((data.expenses || []).reduce((sum, i) => sum + (i.amountLocal || 0), 0))
            ]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

        // 2. Estimated Expenses Sheet
        const estHeader = [['Descripción', 'Monto (USD)', `Monto (${currencyCode})`]];
        const estRows = (data.expenseEstItems || []).map(item => [
            item.description,
            item.amount,
            item.amount * rate
        ]);
        const wsEstimated = XLSX.utils.aoa_to_sheet([...estHeader, ...estRows]);

        // 3. Real Incomes Sheet
        const incomeHeader = [['Fecha', 'Descripción', 'Monto (USD)', `Monto (${currencyCode})`, 'Detalle']];
        const incomeRows = [];
        (data.incomes || []).forEach(income => {
            if (income.subEntries && income.subEntries.length > 0) {
                income.subEntries.forEach((sub, idx) => {
                    incomeRows.push([
                        sub.date || income.date,
                        idx === 0 ? income.description : '',
                        sub.amountUSD,
                        sub.amountLocal,
                        sub.description || ''
                    ]);
                });
            } else {
                incomeRows.push([
                    income.date,
                    income.description,
                    income.amountUSD,
                    income.amountLocal,
                    ''
                ]);
            }
        });
        const wsIncomes = XLSX.utils.aoa_to_sheet([...incomeHeader, ...incomeRows]);

        // 4. Real Expenses Sheet
        const expenseHeader = [['Fecha', 'Descripción', 'Monto (USD)', `Monto (${currencyCode})`, 'Detalle']];
        const expenseRows = [];
        (data.expenses || []).forEach(expense => {
            if (expense.subEntries && expense.subEntries.length > 0) {
                expense.subEntries.forEach((sub, idx) => {
                    expenseRows.push([
                        sub.date || expense.date,
                        idx === 0 ? expense.description : '',
                        sub.amountUSD,
                        sub.amountLocal,
                        sub.description || ''
                    ]);
                });
            } else {
                expenseRows.push([
                    expense.date,
                    expense.description,
                    expense.amountUSD,
                    expense.amountLocal,
                    ''
                ]);
            }
        });
        const wsExpenses = XLSX.utils.aoa_to_sheet([...expenseHeader, ...expenseRows]);

        // Create Workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
        XLSX.utils.book_append_sheet(wb, wsEstimated, 'Egresos Estimados');
        XLSX.utils.book_append_sheet(wb, wsIncomes, 'Ingresos Reales');
        XLSX.utils.book_append_sheet(wb, wsExpenses, 'Egresos Reales');

        // Generate base64
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const uri = FileSystem.cacheDirectory + `Balance_${month}_${year}.xlsx`;

        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
        });

        await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: `Balance ${month}/${year}`,
            UTI: 'com.microsoft.excel.xlsx',
        });
    }
};
