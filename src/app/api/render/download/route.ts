import path from "path";
import os from "os";
import fs from "fs";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const downloadId = request.nextUrl.searchParams.get("id");
  const filename = request.nextUrl.searchParams.get("filename") || "video.mp4";

  if (!downloadId || !/^[\d]+-[a-z0-9]+$/.test(downloadId)) {
    return new Response(JSON.stringify({ error: "Invalid download ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filePath = path.join(
    os.tmpdir(),
    `remotion-render-${downloadId}.mp4`,
  );

  if (!fs.existsSync(filePath)) {
    return new Response(
      JSON.stringify({ error: "File not found or expired" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const fileBuffer = fs.readFileSync(filePath);

  fs.unlink(filePath, () => {});

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(fileBuffer.length),
    },
  });
}
