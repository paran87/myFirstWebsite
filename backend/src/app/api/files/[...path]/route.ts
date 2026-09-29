import { Readable } from "node:stream";
import { NextRequest } from "next/server";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { jsonError } from "@/lib/api-response";
import { openLocalUploadStream, statLocalUpload } from "@/lib/local-storage";

export const runtime = "nodejs";

const MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

export async function GET(request: NextRequest, { params }: Params) {
  const segments = (await params).path ?? [];
  const [bucket, ...rest] = segments;
  const objectPath = rest.join("/");

  if (!bucket || !objectPath) {
    return jsonError("File not found.", 404);
  }

  try {
    const fileStat = await statLocalUpload(bucket, objectPath);
    const size = fileStat.size;
    const ext = objectPath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
    const cors = corsHeaders(request);
    const range = request.headers.get("range");

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Number(match[2]) : size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}`, ...cors },
        });
      }

      const stream = openLocalUploadStream(bucket, objectPath, { start, end });
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
          ...cors,
        },
      });
    }

    const stream = openLocalUploadStream(bucket, objectPath);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...cors,
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return jsonError("File not found.", 404);
    }
    return jsonError(error instanceof Error ? error.message : "File not found.", 404);
  }
}
