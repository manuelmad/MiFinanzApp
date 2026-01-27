
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, Icon } from 'react-native-paper';
import Svg, { Path, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const SIZE = width * 0.75;
const STROKE_WIDTH = 35; // Slightly thinner than 40 for aesthetics
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;

const BalanceChart = ({ income, expense }) => {
    const theme = useTheme();
    const total = income + expense;

    // Helper to calculate coordinates
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        // -90 degrees to start at 12 o'clock
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    // Create SVG path for an arc
    const describeArc = (x, y, radius, startAngle, endAngle) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        const d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
        return d;
    };

    const formatMoney = (amount) => {
        // Format as proper currency string (e.g. $5,000)
        if (amount === undefined || amount === null) return "$0";
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Formatting Balance with commas
    const formatBalance = (amount) => {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const renderChart = () => {
        if (total === 0) {
            return (
                <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    stroke={theme.colors.surfaceVariant} // Grey
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                />
            );
        }

        const incomeRatio = income / total;
        const expenseRatio = expense / total;

        // Angles
        // Green starts at -90 (Top logic handled by polarToCartesian input logic?)
        // Wait, describeArc takes standard angles. 0 is up if I handle -90 offset there?
        // Let's stick to standard SVG angles: 0 is Right (3 o'clock). 
        // polarToCartesian subtracts 90. So Input 0 -> Output -90 (Top).
        // Correct.
        // Input: 0 to 360.

        const incomeEnd = incomeRatio * 360;
        // Gap logic?
        // If we want a gap, we reduce the arc length slightly.
        const gap = total > 0 && income > 0 && expense > 0 ? 2 : 0;

        // Income Arc: 0 to incomeEnd
        // Expense Arc: incomeEnd to 360

        return (
            <>
                {/* Income Green */}
                {incomeRatio > 0 && (
                    incomeRatio >= 1 ? (
                        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#4CAF50" strokeWidth={STROKE_WIDTH} fill="transparent" />
                    ) : (
                        <Path
                            d={describeArc(CENTER, CENTER, RADIUS, 0 + gap / 2, incomeEnd - gap / 2)}
                            stroke="#4CAF50"
                            strokeWidth={STROKE_WIDTH}
                            fill="transparent"
                            strokeLinecap="butt" // Round edges for nicer look with gaps
                        />
                    )
                )}

                {/* Expense Red */}
                {expenseRatio > 0 && (
                    expenseRatio >= 1 ? (
                        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#F44336" strokeWidth={STROKE_WIDTH} fill="transparent" />
                    ) : (
                        <Path
                            d={describeArc(CENTER, CENTER, RADIUS, incomeEnd + gap / 2, 360 - gap / 2)}
                            stroke="#F44336"
                            strokeWidth={STROKE_WIDTH}
                            fill="transparent"
                            strokeLinecap="butt"
                        />
                    )
                )}
            </>
        );
    };

    const balance = income - expense;

    return (
        <View style={styles.container}>
            <Text variant="titleLarge" style={styles.chartTitle}> </Text>
            {/* Title handled in parent usually, or we can add "Enero 2026" here if passed. 
                The user has the title in BalanceTab Card Title. 
                The chart in image has "Top: Ingresos", "Bottom: Egresos" inside. */}

            <View style={{ width: SIZE, height: SIZE, position: 'relative' }}>
                <Svg width={SIZE} height={SIZE}>
                    {renderChart()}
                </Svg>

                {/* Overlay Content */}
                <View style={[StyleSheet.absoluteFill, styles.overlay]}>

                    {/* Top Half: Income */}
                    <View style={styles.halfContainer}>
                        <Icon source="arrow-up-circle" color="#4CAF50" size={32} />
                        <Text variant="labelMedium" style={styles.label}>Total Ingresos:</Text>
                        <Text variant="headlineSmall" style={styles.value}>{formatMoney(income)}</Text>
                    </View>

                    {/* Bottom Half: Expense */}
                    <View style={styles.halfContainer}>
                        <Icon source="arrow-down-circle" color="#F44336" size={32} />
                        <Text variant="labelMedium" style={styles.label}>Total Egresos:</Text>
                        <Text variant="headlineSmall" style={styles.value}>{formatMoney(expense)}</Text>
                    </View>

                </View>
            </View>

            <View style={styles.balanceContainer}>
                <Text variant="headlineSmall" style={styles.balanceLabel}>Balance Neto:</Text>
                <Text variant="displayMedium" style={[styles.balanceValue, { color: '#000' }]}>
                    {formatBalance(balance)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    chartTitle: {
        marginBottom: 10,
        fontWeight: 'bold',
    },
    overlay: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
    },
    halfContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '40%', // Take up some space
        marginVertical: 5,
    },
    label: {
        color: '#666',
        marginTop: 2,
    },
    value: {
        fontWeight: 'bold',
    },
    balanceContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    balanceLabel: {
        fontWeight: 'normal',
    },
    balanceValue: {
        fontWeight: 'bold',
    }
});

export default BalanceChart;
