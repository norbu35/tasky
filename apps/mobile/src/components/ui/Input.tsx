import {forwardRef} from "react";
import type {TextInputProps} from "react-native";
import {StyleSheet, TextInput} from "react-native";
import {mobileTheme} from "../../design/tokenAdapter";

type Props = TextInputProps & {
    invalid?: boolean;
};

export const Input = forwardRef<TextInput, Props>(function Input(
    {invalid = false, editable = true, style, ...props},
    ref
) {
    return (
        <TextInput
            ref={ref}
            editable={editable}
            placeholderTextColor={mobileTheme.colors.mutedForeground}
            style={[
                styles.base,
                invalid && styles.invalid,
                !editable && styles.disabled,
                style
            ]}
            {...props}
        />
    );
});

const styles = StyleSheet.create({
    base: {
        minHeight: 44,
        borderRadius: mobileTheme.radius.md,
        borderWidth: 1,
        borderColor: mobileTheme.colors.input,
        backgroundColor: mobileTheme.colors.card,
        color: mobileTheme.colors.foreground,
        paddingHorizontal: mobileTheme.spacing.md,
        paddingVertical: mobileTheme.spacing.sm,
        fontSize: mobileTheme.typography.body
    },
    invalid: {
        borderColor: mobileTheme.colors.danger
    },
    disabled: {
        opacity: 0.6
    }
});
