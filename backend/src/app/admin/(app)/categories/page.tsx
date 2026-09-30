"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<Category[]>("/api/categories")
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      toast.success("Category created.");
      setName("");
      setDescription("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create category.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      await apiFetch(`/api/categories/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null }),
      });
      toast.success("Category updated.");
      setEditingId(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update category.");
    }
  }

  async function toggleActive(category: Category) {
    try {
      await apiFetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !category.is_active }),
      });
      toast.success(category.is_active ? "Category deactivated." : "Category activated.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update category.");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/categories/${toDelete.id}`, { method: "DELETE" });
      toast.success("Category deleted.");
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Categories</h1>
        <p className="text-sm text-muted">Organize videos into browsable categories.</p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Category name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Landmarks & Monuments"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </form>

      {loading && <TableSkeleton rows={4} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && categories && categories.length === 0 && <EmptyState title="No categories yet." description="Add your first category above." />}

      {!loading && !error && categories && categories.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-background/50">
                  {editingId === category.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-muted">—</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={saveEdit} className="rounded-md p-2 text-success hover:bg-border">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="rounded-md p-2 text-muted hover:bg-border">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{category.name}</td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-muted">{category.description || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(category)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            category.is_active ? "bg-success/10 text-success" : "bg-muted/10 text-muted"
                          }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => startEdit(category)} className="rounded-md p-2 text-muted hover:bg-border hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setToDelete(category)} className="rounded-md p-2 text-muted hover:bg-border hover:text-danger">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this category?"
        description={`"${toDelete?.name}" will be removed. Videos in this category will become uncategorized.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
