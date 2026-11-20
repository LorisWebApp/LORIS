/**
 * Shared UI Library – Main Export File
 *
 * Exports reusable UI components for all project groups.
 * Components are organised by category.
 */

// Buttons
export { Button } from "./buttons/Button";

// Content
export { MaterialItem } from "./content/MaterialItem";
export { MaterialList } from "./content/MaterialList";
export { MaterialMetadata } from "./content/MaterialMetadata";
export { ProgressIndicator } from "./content/ProgressIndicator";
export { SectionHeader } from "./content/SectionHeader";
export { TabNavigation } from "./content/TabNavigation";
export { UserAvatar } from "./content/UserAvatar";

// Data Display
export { DataTable } from "./data-display/DataTable";
export { DetailRow } from "./data-display/DetailRow";
export { FilterDropdown } from "./data-display/FilterDropdown";
export { Pagination } from "./data-display/Pagination";
export { SearchBar } from "./data-display/SearchBar";
export { StatDisplay } from "./data-display/StatDisplay";
export { StatusBadge } from "./data-display/StatusBadge";

// Feedback
export { Alert } from "./feedback/Alert";
export { ConfirmationDialog } from "./feedback/ConfirmationDialog";
export { EmptyState } from "./feedback/EmptyState";
export { ErrorState } from "./feedback/ErrorState";
export { LoadingIndicator } from "./feedback/LoadingIndicator";
export { Modal } from "./feedback/Modal";
export { OfflineIndicator } from "./feedback/OfflineIndicator";
export { ToastNotification } from "./feedback/ToastNotification";

// Navigation
export { Breadcrumbs } from "./navigation/Breadcrumbs";
export { NavigationItem } from "./navigation/NavigationItem";
export { NotificationPanel } from "./navigation/NotificationPanel";
export { PageHeader } from "./navigation/PageHeader";
export { Sidebar } from "./navigation/Sidebar";
export { Topbar } from "./navigation/Topbar";
export { UserMenu } from "./navigation/UserMenu";

// Utilities
export { cx } from "./utils/cx";
export { usePopover } from "./utils/usePopover";

// Shared component types
export type { DataTableColumn, SortState } from "./data-display/DataTable";

export type { FilterOption } from "./data-display/FilterDropdown";

export type { MaterialListEntry } from "./content/MaterialList";

export type { StatusVariant } from "./data-display/StatusBadge";

export type { TabItem } from "./content/TabNavigation";
