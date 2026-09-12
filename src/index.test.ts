import { describe, expect, it } from 'vitest'
import * as publicApi from './index'

/**
 * The consumer-facing export surface, pinned.
 *
 * Why this exists
 * ---------------
 * `src/index.ts` and `src/components/ui/index.ts` are ~190 lines of
 * hand-maintained re-exports, and nothing else in the repo reads them. Deleting
 * `export { StatCard }` type-checks, lints, builds and publishes clean — the
 * first sign of trouble is a red build in sidekick-web or sidekick-harness,
 * both of which pin `^0.13.0` and so auto-install a `0.13.1` that quietly
 * dropped an export.
 *
 * This test makes that failure loud and local: it imports the package entry the
 * way a consumer does and pins the sorted list of runtime exports.
 *
 * How to update it
 * ----------------
 * ADDING an export is meant to be easy and intentional: run
 * `npm run test:run -- -u` (or `npx vitest -u src/index.test.ts`) and commit the
 * regenerated snapshot alongside the new component. The diff should show only
 * additions.
 *
 * REMOVING or RENAMING one is the case this guards. If the snapshot loses a
 * name, that is a BREAKING change for consumers — do not just re-record it.
 * Either keep a back-compat alias, or bump the major version in package.json
 * and open paired PRs in sidekick-web and sidekick-harness (see the
 * "Consumer impact sweep" in CLAUDE.md).
 *
 * Scope: runtime values only. `Object.keys` cannot see type-only exports
 * (`ChatMessageProps`, `PaginationMetadata`, …) — those are erased before this
 * file runs, and the `dist/index.d.ts` guard in `scripts/verify-dist.mjs`
 * covers the type rollup instead.
 */
describe('package entry point', () => {
  it('exports the pinned public API surface', () => {
    expect(Object.keys(publicApi).sort()).toMatchInlineSnapshot(`
      [
        "Accordion",
        "AccordionContent",
        "AccordionItem",
        "AccordionTrigger",
        "AlertDialog",
        "AlertDialogAction",
        "AlertDialogCancel",
        "AlertDialogContent",
        "AlertDialogDescription",
        "AlertDialogFooter",
        "AlertDialogHeader",
        "AlertDialogOverlay",
        "AlertDialogPortal",
        "AlertDialogTitle",
        "AlertDialogTrigger",
        "Avatar",
        "AvatarFallback",
        "AvatarImage",
        "Badge",
        "Blockquote",
        "Breadcrumb",
        "BreadcrumbItem",
        "BreadcrumbLink",
        "BreadcrumbList",
        "BreadcrumbPage",
        "BreadcrumbSeparator",
        "Button",
        "Callout",
        "Card",
        "CardContent",
        "CardDescription",
        "CardFooter",
        "CardHeader",
        "CardTitle",
        "ChatMessage",
        "Checkbox",
        "DataTable",
        "DataTableView",
        "Dialog",
        "DialogClose",
        "DialogContent",
        "DialogDescription",
        "DialogFooter",
        "DialogHeader",
        "DialogOverlay",
        "DialogPortal",
        "DialogTitle",
        "DialogTrigger",
        "DropdownMenu",
        "DropdownMenuCheckboxItem",
        "DropdownMenuContent",
        "DropdownMenuGroup",
        "DropdownMenuItem",
        "DropdownMenuLabel",
        "DropdownMenuPortal",
        "DropdownMenuRadioGroup",
        "DropdownMenuRadioItem",
        "DropdownMenuSeparator",
        "DropdownMenuShortcut",
        "DropdownMenuSub",
        "DropdownMenuSubContent",
        "DropdownMenuSubTrigger",
        "DropdownMenuTrigger",
        "EmptyState",
        "FormField",
        "FormInput",
        "FormLabel",
        "FormSelect",
        "FormTextarea",
        "JsonEditor",
        "List",
        "ListItem",
        "ListItemDescription",
        "ListItemMeta",
        "ListItemTitle",
        "ListSection",
        "ModelListItem",
        "PageHeader",
        "Pagination",
        "PlatformSwitcher",
        "Popover",
        "PopoverContent",
        "PopoverTrigger",
        "ProgressBar",
        "SectionHeader",
        "Separator",
        "SortableList",
        "StatCard",
        "StatsGrid",
        "Status",
        "TableBody",
        "TableCell",
        "TableHead",
        "TableHeader",
        "TableRow",
        "Tabs",
        "TabsContent",
        "TabsList",
        "TabsTrigger",
        "Time",
        "TimezoneProvider",
        "Tooltip",
        "TooltipContent",
        "TooltipProvider",
        "TooltipTrigger",
        "cn",
        "createColumnHelper",
        "flexRender",
        "formatDate",
        "formatDateTime",
        "formatDateTimeWithTimezone",
        "formatJson",
        "formatRelativeTime",
        "getLocalTimezone",
        "parseJsonError",
        "useDebounce",
        "useTimezone",
      ]
    `)
  })
})
