import { StyleSheet } from "react-native";
import { mobileTheme } from "../design/tokenAdapter";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background
  },
  container: {
    paddingHorizontal: mobileTheme.spacing.xl,
    paddingVertical: mobileTheme.spacing.xl,
    gap: mobileTheme.spacing.lg
  },
  title: {
    fontSize: mobileTheme.typography.heading,
    fontWeight: "700",
    color: mobileTheme.colors.foreground
  },
  subtitle: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.mutedForeground
  },
  panel: {
    gap: mobileTheme.spacing.md,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    padding: mobileTheme.spacing.lg,
    backgroundColor: mobileTheme.colors.card
  },
  sectionTitle: {
    fontSize: mobileTheme.typography.body,
    fontWeight: "700",
    color: mobileTheme.colors.foreground
  },
  rowActions: {
    flexDirection: "row",
    gap: mobileTheme.spacing.md,
    flexWrap: "wrap"
  },
  metaText: {
    fontSize: mobileTheme.typography.caption,
    color: mobileTheme.colors.mutedForeground
  },
  taskCard: {
    gap: mobileTheme.spacing.sm,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.md,
    padding: mobileTheme.spacing.md,
    backgroundColor: mobileTheme.colors.secondary
  },
  taskTitle: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.secondaryForeground,
    fontWeight: "600"
  }
});
