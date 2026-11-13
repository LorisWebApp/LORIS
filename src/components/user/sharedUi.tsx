/**
 * SINGLE POINT OF CONTACT with the team's shared UI library.
 *
 * Group C components import shared UI elements through this file.
 * The original shared components remain untouched.
 */

export {
  Alert,
  Button,
  ConfirmationDialog,
  EmptyState,
  LoadingIndicator,
  MaterialItem,
  MaterialList,
  OfflineIndicator,
  PageHeader,
  ProgressIndicator,
  SectionHeader,
  StatDisplay,
  StatusBadge,
  TabNavigation,
  ToastNotification,
} from "../../../shared";

export type {
  MaterialListEntry,
  StatusVariant,
  TabItem,
} from "../../../shared";

export { cx } from "../../../shared/utils/cx";
