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

/**
 * ORDER BY fragments for D1. Values come from a fixed map (never from user
 * input), `id` is added as a final tiebreaker so rows with equal values keep a
 * stable order and never repeat or go missing between pages.
 */
export const LIST_SORT_SQL: Record<ListSort, string> = {
  newest: "recorded_at DESC NULLS LAST",
  oldest: "recorded_at ASC NULLS LAST",
  uploaded_newest: "created_at DESC",
  uploaded_oldest: "created_at ASC",
  largest: "file_size_bytes DESC NULLS LAST",
  smallest: "file_size_bytes ASC NULLS LAST",
  title_asc: "title COLLATE NOCASE ASC",
  title_desc: "title COLLATE NOCASE DESC",
  most_viewed: "views DESC",
};
