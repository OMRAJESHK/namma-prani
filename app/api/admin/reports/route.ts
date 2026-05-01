import { NextResponse } from "next/server";
import { getReports, updateReportStatus } from "@/lib/db";

export const runtime = "nodejs";

function verifyPassword(password: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  return typeof password === "string" && expected && password === expected;
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (!verifyPassword(payload.password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = getReports();
  return NextResponse.json({ reports });
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  if (!verifyPassword(payload.password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(payload.reportId);
  const status = payload.status?.toString();
  if (!id || !status) {
    return NextResponse.json({ error: "Missing reportId or status." }, { status: 400 });
  }

  const updated = updateReportStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, report: updated });
}
