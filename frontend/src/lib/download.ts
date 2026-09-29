function filenameFromTitle(title: string, url: string) {
  const extension = url.split("?")[0].split(".").pop()?.toLowerCase();
  const safeExtension = extension && /^(jpe?g|png|webp|gif|avif)$/.test(extension) ? extension : "jpg";
  const safeTitle = title.replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, " ").trim() || "photo";
  return `${safeTitle}.${safeExtension}`;
}

export async function downloadImage(url: string, title: string) {
  const filename = filenameFromTitle(title, url);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download failed.");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
