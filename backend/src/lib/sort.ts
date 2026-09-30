/**
 * Sort orders accepted by `GET /api/videos` and `GET /api/photos`.
 * Shared by the API (validation + query) and the admin list pages.
 */
export const LIST_SORTS = [
  "newest",
  "oldest",
  "uploaded_newest",
  "uploaded_oldest",
  "largest",
  "smallest",
  "title_asc",
  "title_desc",
  "most_viewed",
] as const;

export type ListSort = (typeof LIST_SORTS)[number];

export const ADMIN_SORT_OPTIONS: { group: string; options: { value: ListSort; label: string }[] }[] = [
  {
    group: "Date",
    options: [
      { value: "newest", label: "Recorded: newest first" },
      { value: "oldest", label: "Recorded: oldest first" },
      { value: "uploaded_newest", label: "Uploaded: newest first" },
      { value: "uploaded_oldest", label: "Uploaded: oldest first" },
    ],
  },
  {
    group: "Size",
    options: [
      { value: "largest", label: "Size: largest first" },
      { value: "smallest", label: "Size: smallest first" },
    ],
  },
  {
    group: "Alphabetical",
    options: [
      { value: "title_asc", label: "Title: A → Z" },
      { value: "title_desc", label: "Title: Z → A" },
    ],
  },
];

type OrderOptions = { ascending?: boolean; nullsFirst?: boolean };

const SORT_COLUMNS: Record<ListSort, [column: string, options: OrderOptions]> = {
  newest: ["recorded_at", { ascending: false, nullsFirst: false }],
  oldest: ["recorded_at", { ascending: true, nullsFirst: false }],
  uploaded_newest: ["created_at", { ascending: false }],
  uploaded_oldest: ["created_at", { ascending: true }],
  largest: ["file_size_bytes", { ascending: false, nullsFirst: false }],
  smallest: ["file_size_bytes", { ascending: true, nullsFirst: false }],
  title_asc: ["title", { ascending: true }],
  title_desc: ["title", { ascending: false }],
  most_viewed: ["views", { ascending: false }],
};

/**
 * Applies `sort` to a Supabase query. `id` is added as a final tiebreaker so
 * rows with equal values (same size, same date, …) keep a stable order and
 * never repeat or go missing between pages.
 */
export function applyListSort<Q extends { order(column: string, options?: OrderOptions): Q }>(
  builder: Q,
  sort: ListSort
): Q {
  const [column, options] = SORT_COLUMNS[sort];
  return builder.order(column, options).order("id", { ascending: true });
}
