# LORIS shared component library

Reusable, presentation-only React components for all LORIS groups (A: Auth & Organisations, B: Catalogue, C: User features & Reading, D: Offline & Chatbot).

Live reference with every variant and state: run the app and open **`/showcase`** (`src/pages/dev/ComponentShowcase.tsx`).

## Principles

- **Presentation only.** No fetching, no business logic, no endpoint knowledge. Data and callbacks come in through props. Connectivity, user, role and notifications are supplied by the caller.
- **Configurable, not Group-specific.** Labels, icons, links and actions are props or slots. No Group D wording lives in this folder.
- **One typeface: Crimson Pro** (`font-sans` and `font-serif` both resolve to it, set in `src/index.css`). Hierarchy comes from size, weight and case. Do not add fonts.
- **Editorial-minimalist.** Flat surfaces, thin dividers, a coloured rule instead of tinted boxes, restrained palette (`ink`, `deep`, `mint`, `brand`, `badge`, `rose-*` tokens). Don't wrap things in cards by default.
- **Accessible by default.** Roles, labels, focus rings, keyboard handling (Escape/arrow keys/focus trap) are built in.

## Importing

```tsx
import { Button, PageHeader, MaterialList, Pagination } from '../../components/shared'; // adjust the relative path
```

Everything is exported from `index.ts` together with its prop types (`ButtonProps`, `NotificationItem`, …). Internal helpers live in `utils/` and are not exported.

Navigation components use `react-router-dom` (`Link`, `useLocation`), so render them inside a Router.

## Components

### Navigation (`navigation/`)
| Component | Purpose / key props |
|---|---|
| `NavigationItem` | `label`, `to` \| `href` \| `onClick`, `icon`, `badge`, `active` (derived from route if omitted), `end`, `variant`: `underline` \| `pill` \| `sidebar` \| `bottom`. |
| `Sidebar` | `sections: { id, title?, roles?, entries: { id, label, to, icon, badge, roles? }[] }[]`, `role` (hides entries/sections not allowed for it), `brand`, `footer`, `collapsed`. |
| `Topbar` | Slots: `brand`, `navigation`, `actions`, `userControls`. `tone`: `light` \| `dark` \| `transparent`; `sticky`; `contentClassName` **replaces** the default `h-16 px-8`. |
| `Breadcrumbs` | `items: { label, to? }[]` (last item is the current page), `tone`: `default` \| `inverse`. |
| `PageHeader` | `title`, `description`, `breadcrumbs`, `eyebrow`, `icon`, `meta`, `actions`, `aside`, `tone`, `size` (`sm`/`md`/`lg`), `accent`. |
| `UserMenu` | `user: { name?, email?, initials?, imageUrl? }`, `items: ({ label, to \| href \| onClick, icon?, tone? } \| { divider: true })[]`, `align`. |
| `NotificationPanel` | `notifications: { id, title, description?, time?, status: 'info'\|'success'\|'warning'\|'error', read? }[]`, `onMarkAllRead`, `onNotificationClick`, `onDismiss`, `emptyMessage`. |

### Buttons (`buttons/`)
`Button` is the only button component. `variant`: `primary` \| `secondary` \| `outline` \| `text` \| `danger` \| `icon`; `size`: `sm`/`md`/`lg`; `loading`; `disabled`; `leftIcon`/`rightIcon`; `fullWidth`; `to` (renders a router link); `tone="inverse"` for dark surfaces; `shape="pill"` only where a design calls for it. `variant="icon"` **requires `aria-label`** (enforced by TypeScript); add `filled` for a solid icon button.

### Feedback (`feedback/`)
`ToastNotification` (`variant`, `message`, `duration`, `placement`, `onClose`) · `Alert` (`severity`, `title`, `action`, `onDismiss`) · `Modal` (`open`, `onClose`, `title`, `description`, `actions`, `size`) · `ConfirmationDialog` (`title`, `description`, `confirmLabel`, `tone`, `loading`, `onConfirm`, `onCancel`) · `LoadingIndicator` (`size`, `label`, `centered`) · `EmptyState` (`icon` \| `illustration`, `title`, `description`, `action`) · `ErrorState` (`message`, `onRetry`) · `OfflineIndicator` (`isOnline`, `variant`: `dot`/`badge`/`banner`).

### Data display (`data-display/`)
`DataTable<T>` (`columns`, `rows`, `getRowKey`, `caption`, `loading`, `emptyState`, `sort`/`onSortChange`, `onRowClick`) · `StatusBadge` (`label`, `variant`, `dot`, `size`) · `Pagination` (`page`, `pageCount` or `totalItems`+`pageSize`, `pageSizeOptions`, `onPageChange`) · `SearchBar` (`placeholder`, `value`/`onChange`, `onSearch`, `debounceMs`, `appearance`) · `FilterDropdown` (`label`, `options`, `value`, `onChange`, `multiple`) · `DetailRow` (`label`, `value`, `layout`, `divider`) · `StatDisplay` (`label`, `value`, `unit`, `supporting`, `size`, `tone`).

### Content (`content/`)
`MaterialItem` (`title`, `subtitle`, `cover`, `coverOverlay`, `tag`, `details`, `metadata`, `status`, `statusAside`, `aside`, `actions`, `layout`: `card`/`row`/`compact`, `framed`) · `MaterialList` (`materials`, `layout`: `grid`/`list`/`compact`, `columns`, `loading`, `emptyState`, `renderItem`) · `MaterialMetadata` (`author`, `publishedAt`, `fileType`, `category`, `fileSize`, `items`, `layout`) · `SectionHeader` (`title`, `description`, `eyebrow`, `actions`, `size`) · `TabNavigation` (`tabs`, `activeId`, `onChange`, `variant`, required `aria-label`) · `ProgressIndicator` (`value`/`max` or `segments`, `label`, `showValue`, `size`, `tone`) · `UserAvatar` (`name`, `initials`, `imageUrl`, `size`, `tone`).

## Usage pattern: map your data onto a slot-based component

```tsx
// Keep domain mapping in your feature code, not in the shared component.
const entries = materials.map((m) => ({
  id: m.id, title: m.title, subtitle: m.author,
  cover: <img src={m.coverUrl} alt="" className="size-full object-cover" />,
  tag: { label: m.format.toUpperCase() },
  actions: <Button onClick={() => open(m.id)}>Open</Button>,
}));
<MaterialList materials={entries} layout="grid" columns={3} />
```
See `src/components/offline/materialEntry.tsx` for a complete example.

## Guidelines for adding or changing components

1. **Check first.** Can an existing component do it with a prop or slot? Prefer extending over adding. Do not add a component to serve a single page.
2. **Stay presentational and generic.** No API calls, no feature wording, no mock data. If a design needs domain behaviour, compose the shared pieces in your own feature folder.
3. **Props:** export a typed `XProps` interface, document each non-obvious prop with a `/** … */` comment, and add the component and its types to `index.ts`.
4. **Style:** Crimson Pro only; use the existing colour tokens; avoid shadows, gradients, pastel icon tiles and default card/border wrapping. Use `cx()` from `utils/` to join classes.
5. **Class conflicts:** Tailwind utilities that target the same property cannot be reliably overridden via `className`. If a consumer needs a different look, add a typed prop (as `Button` does with `tone`, `shape`, `filled`) rather than relying on overrides.
6. **Accessibility:** correct roles/labels, visible focus, keyboard support, and required `aria-label` where the visual has no text.
7. **Document it:** add a live example with a short code snippet to `/showcase`.
8. **Review:** changes to this folder affect every group; get them reviewed before merging into `develop`.
