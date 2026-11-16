/**
 * SINGLE POINT OF CONTACT with the team's shared UI library
 * for all Group C components.
 *
 * The shared library is located in the project-root /shared folder.
 *
 * Group C components must import shared UI components through
 * this adapter. Do not modify the shared library.
 */

export {
  Alert,
  Button,
  ConfirmationDialog,
  DataTable,
  DetailRow,
  EmptyState,
  FilterDropdown,
  LoadingIndicator,
  MaterialItem,
  MaterialList,
  MaterialMetadata,
  Modal,
  OfflineIndicator,
  PageHeader,
  Pagination,
  ProgressIndicator,
  SearchBar,
  SectionHeader,
  StatDisplay,
  StatusBadge,
  TabNavigation,
  ToastNotification,
  UserAvatar,
} from "../../../shared";

export type {
  DataTableColumn,
  FilterOption,
  MaterialListEntry,
  SortState,
  StatusVariant,
  TabItem,
} from "../../../shared";

export { cx } from "../../../shared/utils/cx";
