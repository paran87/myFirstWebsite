import { NextRequest } from "next/server";
import { corsHeaders, corsPreflight } from "@/lib/cors";
import { jsonError } from "@/lib/api-response";
import { getMedia } from "@/lib/cf";
import { isMediaBucket, objectKey } from "@/lib/storage";

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

/**
 * GET /api/files/<bucket>/<path> — streams an object from R2 with Range
 * support (needed for video seeking). Used when R2_PUBLIC_URL is not set;
 * with a public custom domain on the bucket, files bypass the Worker.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const segments = (await params).path ?? [];
  const [bucket, ...rest] = segments;
  const objectPath = rest.join("/");

  if (!bucket || !objectPath || !isMediaBucket(bucket)) {
    return jsonError("File not found.", 404);
  }

  let key: string;
  try {
    key = objectKey(bucket, objectPath);
  } catch {
    return jsonError("File not found.", 404);
  }

  const object = await getMedia().get(key, {
    range: request.headers,
    onlyIf: request.headers,
  });
  if (!object) return jsonError("File not found.", 404);

  const headers = new Headers(corsHeaders(request));
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");

  // A failed If-None-Match / If-Match precondition returns metadata without a body.
  if (!("body" in object) || !object.body) {
    return new Response(null, { status: 304, headers });
  }

  let status = 200;
  if (request.headers.has("range") && object.range) {
    const { offset = 0, length = object.size - offset } = object.range as { offset?: number; length?: number };
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("Content-Length", String(length));
    status = 206;
  } else {
    headers.set("Content-Length", String(object.size));
  }

  return new Response(object.body, { status, headers });
}
