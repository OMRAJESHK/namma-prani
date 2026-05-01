import { google } from "googleapis";
import { Readable } from "stream";

const driveScope = ["https://www.googleapis.com/auth/drive.file"];

export type UploadResult = {
  url: string;
  id?: string;
};

export async function uploadToDrive(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult | null> {
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    return null;
  }

  let credentials;
  try {
    credentials = JSON.parse(rawKey);
  } catch (error) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON payload.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: driveScope,
  });

  const drive = google.drive({ version: "v3", auth });
  const readable = Readable.from(fileBuffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: ["namma-prani-reports"],
    },
    media: {
      mimeType,
      body: readable,
    },
    fields: "id,webViewLink",
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error("Google Drive upload failed to return a file ID.");
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    url: response.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    id: fileId,
  };
}
