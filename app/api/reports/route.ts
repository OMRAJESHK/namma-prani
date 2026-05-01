import { NextResponse } from "next/server";
import { insertReport } from "@/lib/db";
import { uploadToDrive } from "@/lib/drive";
import { notifyTelegram } from "@/lib/telegram";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

function isFile(value: unknown): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && typeof (value as any).arrayBuffer === "function";
}

function getPublicUploadPath(fileName: string) {
  const uploadsDir = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  return join(uploadsDir, fileName);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const description = formData.get("description")?.toString().trim() || null;
    const address = formData.get("address")?.toString().trim() || null;
    const latitude = formData.get("latitude")?.toString();
    const longitude = formData.get("longitude")?.toString();
    const media = formData.get("media");

    if (!description && (!media || !isFile(media))) {
      return NextResponse.json({ error: "Please provide a description or attach a photo/video." }, { status: 400 });
    }

    const gps_lat = latitude ? Number(latitude) : null;
    const gps_lng = longitude ? Number(longitude) : null;

    let media_url: string | null = null;
    let media_type: string | null = null;

    if (media && isFile(media) && media.size > 0) {
      const fileBuffer = Buffer.from(await media.arrayBuffer());
      const safeFileName = `${Date.now()}-${media.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const mimeType = media.type || "application/octet-stream";
      media_type = mimeType;

      try {
        const uploadResult = await uploadToDrive(fileBuffer, safeFileName, mimeType);
        if (uploadResult?.url) {
          media_url = uploadResult.url;
        }
      } catch (error) {
        console.error("Google Drive upload failed:", error);
      }

      if (!media_url) {
        const localPath = getPublicUploadPath(safeFileName);
        writeFileSync(localPath, fileBuffer);
        media_url = `/uploads/${safeFileName}`;
      }
    }

    const report = insertReport({
      description,
      address,
      gps_lat,
      gps_lng,
      media_url,
      media_type,
    });

    if (!report) {
      return NextResponse.json({ error: "Failed to save the report." }, { status: 500 });
    }

    await notifyTelegram(report);

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error("Report submission failed:", error);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }
}
