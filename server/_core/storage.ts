import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs-extra';
import path from 'path';

// S3 oder lokaler Storage
const USE_S3 = process.env.USE_S3_STORAGE === 'true';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'webprojekte-bundles';
const S3_REGION = process.env.S3_REGION || 'eu-central-1';

// S3 Client initialisieren
const s3Client = USE_S3
  ? new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  : null;

export interface UploadOptions {
  key: string; // Dateiname/Pfad in Storage
  filePath: string; // Lokaler Dateipfad
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadUrlOptions {
  key: string;
  expiresIn?: number; // Sekunden (default: 3600 = 1 Stunde)
}

/**
 * Lädt eine Datei hoch (S3 oder lokal)
 */
export async function uploadFile(options: UploadOptions): Promise<string> {
  const { key, filePath, contentType, metadata } = options;

  if (USE_S3 && s3Client) {
    // Upload zu S3
    const fileContent = await fs.readFile(filePath);

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileContent,
      ContentType: contentType || 'application/octet-stream',
      Metadata: metadata,
    });

    await s3Client.send(command);

    console.log(`✅ File uploaded to S3: ${key}`);
    return `s3://${S3_BUCKET}/${key}`;
  } else {
    // Lokaler Storage
    const localStoragePath = path.join(process.cwd(), 'storage', key);
    await fs.ensureDir(path.dirname(localStoragePath));
    await fs.copy(filePath, localStoragePath);

    console.log(`✅ File saved locally: ${localStoragePath}`);
    return localStoragePath;
  }
}

/**
 * Generiert eine Download-URL (S3 Presigned URL oder lokaler Pfad)
 */
export async function getDownloadUrl(options: DownloadUrlOptions): Promise<string> {
  const { key, expiresIn = 3600 } = options;

  if (USE_S3 && s3Client) {
    // S3 Presigned URL
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } else {
    // Lokale URL
    return `/api/download/${key}`;
  }
}

/**
 * Löscht eine Datei aus dem Storage
 */
export async function deleteFile(key: string): Promise<void> {
  if (USE_S3 && s3Client) {
    // Von S3 löschen
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`❌ Deleted from S3: ${key}`);
  } else {
    // Lokal löschen
    const localStoragePath = path.join(process.cwd(), 'storage', key);
    if (await fs.pathExists(localStoragePath)) {
      await fs.remove(localStoragePath);
      console.log(`❌ Deleted locally: ${localStoragePath}`);
    }
  }
}

/**
 * Prüft ob eine Datei existiert
 */
export async function fileExists(key: string): Promise<boolean> {
  if (USE_S3 && s3Client) {
    // S3 Check
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  } else {
    // Lokaler Check
    const localStoragePath = path.join(process.cwd(), 'storage', key);
    return await fs.pathExists(localStoragePath);
  }
}

/**
 * Gibt Datei-Informationen zurück
 */
export async function getFileInfo(key: string): Promise<{ size: number; lastModified: Date } | null> {
  if (USE_S3 && s3Client) {
    // S3 Info
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });
      const response = await s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      return null;
    }
  } else {
    // Lokale Info
    const localStoragePath = path.join(process.cwd(), 'storage', key);
    if (await fs.pathExists(localStoragePath)) {
      const stats = await fs.stat(localStoragePath);
      return {
        size: stats.size,
        lastModified: stats.mtime,
      };
    }
    return null;
  }
}

/**
 * Lädt eine Datei herunter und speichert sie lokal
 */
export async function downloadFile(key: string, targetPath: string): Promise<void> {
  if (USE_S3 && s3Client) {
    // Von S3 herunterladen
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = response.Body;

    if (body) {
      await fs.ensureDir(path.dirname(targetPath));
      // @ts-ignore
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      await fs.writeFile(targetPath, Buffer.concat(chunks));
      console.log(`✅ Downloaded from S3 to: ${targetPath}`);
    }
  } else {
    // Lokale Kopie
    const localStoragePath = path.join(process.cwd(), 'storage', key);
    if (await fs.pathExists(localStoragePath)) {
      await fs.copy(localStoragePath, targetPath);
      console.log(`✅ Copied locally to: ${targetPath}`);
    } else {
      throw new Error(`File not found: ${key}`);
    }
  }
}

/**
 * Cleanup-Funktion: Löscht alte Bundles
 */
export async function cleanupOldFiles(olderThanDays: number = 7): Promise<number> {
  const maxAge = olderThanDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let deletedCount = 0;

  if (!USE_S3) {
    // Lokales Cleanup
    const storageDir = path.join(process.cwd(), 'storage');
    if (await fs.pathExists(storageDir)) {
      const files = await fs.readdir(storageDir);

      for (const file of files) {
        const filePath = path.join(storageDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.remove(filePath);
          deletedCount++;
          console.log(`❌ Cleaned up old file: ${file}`);
        }
      }
    }
  }
  // S3 Cleanup würde ListObjectsCommand benötigen

  console.log(`🧹 Cleanup complete: ${deletedCount} files deleted`);
  return deletedCount;
}
