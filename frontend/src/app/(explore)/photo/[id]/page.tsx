import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPhoto } from "@/lib/api";
import { PhotoStage } from "@/components/photo/photo-stage";
import { siteConfig } from "@/lib/config";

async function loadPhoto(id: string) {
  try {
    return await getPhoto(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/photo/[id]">): Promise<Metadata> {
  const { id } = await params;
  const photo = await loadPhoto(id);
  if (!photo) return { title: "Photo not found" };
  return {
    title: photo.title,
    description: photo.description?.slice(0, 160) || `${photo.title} — ${siteConfig.name}`,
    openGraph: { title: photo.title, images: [{ url: photo.image_url }] },
  };
}

export default async function PhotoDetailPage({ params }: PageProps<"/photo/[id]">) {
  const { id } = await params;
  const photo = await loadPhoto(id);
  if (!photo) notFound();
  return <PhotoStage photo={photo} />;
}
