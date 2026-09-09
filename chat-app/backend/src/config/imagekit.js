import ImageKit, { toFile } from '@imagekit/nodejs';

let client;

function getClient() {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    const error = new Error('ImageKit is not configured. Add IMAGEKIT_PRIVATE_KEY to .env.');
    error.status = 503;
    throw error;
  }

  if (!client) {
    client = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      maxRetries: 0,
      timeout: 30_000,
    });
  }

  return client;
}

/** Uploads a Multer memory buffer to ImageKit; no local file is created. */
export async function uploadBufferToImageKit({ buffer, originalname, mimetype, size }, options) {
  const { folder, fileName, mediaType } = options;
  const file = await toFile(buffer, fileName, { type: mimetype });
  const response = await getClient().files.upload({
    file,
    fileName,
    folder,
    tags: ['chatly-ai', mediaType],
  });

  if (!response.url || !response.fileId) {
    throw new Error('ImageKit did not return the uploaded file information.');
  }

  return {
    url: response.url,
    fileId: response.fileId,
    mediaType,
    fileName: originalname,
    mimeType: mimetype,
    sizeBytes: size,
  };
}

/** Deletes an ImageKit asset. Callers decide whether a deletion failure is fatal. */
export async function deleteImageKitFile(fileId) {
  if (!fileId) return;
  await getClient().files.delete(fileId);
}
