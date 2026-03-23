import React from 'react';
import {
    Pressable,
    SectionList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export interface SettingsRow {
    label: string;
    value?: string;
    onPress?: () => void;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
    destructive?: boolean;
}

export interface SettingsSection {
    title?: string;
    rows: SettingsRow[];
}

export interface SettingsTemplateProps {
    sections: SettingsSection[];
    testID?: string;
}

function SettingsRowItem({ row, testID }: { row: SettingsRow; testID?: string }) {
    const isInteractive = !!row.onPress;
    const Wrapper = isInteractive ? Pressable : View;

    return (
        <Wrapper
            onPress={row.onPress}
            style={styles.row}
            testID={testID}
            {...(isInteractive ? { accessibilityRole: 'button' as const } : {})}
        >
            {row.icon && (
                <View style={styles.rowIcon}>{row.icon}</View>
            )}
            <Text
                style={[
                    styles.rowLabel,
                    row.destructive && styles.rowLabelDestructive,
                ]}
            >
                {row.label}
            </Text>
            <View style={styles.rowRight}>
                {row.rightElement ? (
                    row.rightElement
                ) : row.value ? (
                    <Text style={styles.rowValue}>{row.value}</Text>
                ) : null}
                {isInteractive && !row.rightElement && (
                    <ChevronRight
                        size={20}
                        color={colors.textTertiary}
                        style={styles.chevron}
                    />
                )}
            </View>
        </Wrapper>
    );
}

export function SettingsTemplate({
    sections,
    testID,
}: SettingsTemplateProps) {
    const sectionListData = sections.map((section, sectionIndex) => ({
        title: section.title,
        data: section.rows,
        key: section.title ?? `section-${sectionIndex}`,
    }));

    return (
        <SectionList
            style={styles.container}
            sections={sectionListData}
            keyExtractor={(item, index) => `${item.label}-${index}`}
            renderItem={({ item, index, section }) => (
                <>
                    <SettingsRowItem
                        row={item}
                        testID={testID ? `${testID}-row-${index}` : undefined}
                    />
                    {index < section.data.length - 1 && (
                        <View style={styles.separator} />
                    )}
                </>
            )}
            renderSectionHeader={({ section }) =>
                section.title ? (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {section.title.toUpperCase()}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.sectionSpacer} />
                )
            }
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            testID={testID}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    sectionHeader: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.caption,
        fontWeight: '600',
        color: colors.textTertiary,
        letterSpacing: 0.5,
    },
    sectionSpacer: {
        height: spacing.xl,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.card,
    },
    rowIcon: {
        marginRight: spacing.md,
    },
    rowLabel: {
        flex: 1,
        fontSize: typography.body,
        color: colors.primary,
    },
    rowLabelDestructive: {
        color: colors.danger,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowValue: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginRight: spacing.xs,
    },
    chevron: {
        marginLeft: spacing.xs,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: spacing.lg,
    },
});
