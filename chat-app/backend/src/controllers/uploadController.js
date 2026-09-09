import { randomUUID } from 'crypto';

import { deleteImageKitFile, uploadBufferToImageKit } from '../config/imagekit.js';

function safeFileName(name) {
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  return `${randomUUID()}${extension.toLowerCase()}`;
}

function mediaTypeFor(mimeType) {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'file';
}

async function uploadRequestFile(file, folder) {
  const mediaType = mediaTypeFor(file.mimetype);
  return uploadBufferToImageKit(file, {
    folder,
    fileName: safeFileName(file.originalname),
    mediaType,
  });
}

/** PUT /api/auth/avatar */
export async function updateAvatar(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'Please select an avatar image.' });

  let uploaded;
  try {
    uploaded = await uploadRequestFile(req.file, '/chat-app/avatars');
    const previousFileId = req.user.avatarFileId;

    req.user.avatarUrl = uploaded.url;
    req.user.avatarFileId = uploaded.fileId;
    await req.user.save();

    if (previousFileId) {
      deleteImageKitFile(previousFileId).catch((error) => {
        console.error('Failed to delete replaced ImageKit avatar:', error.message);
      });
    }

    return res.json({
      message: 'Avatar updated successfully.',
      avatarUrl: uploaded.url,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    if (uploaded?.fileId) {
      deleteImageKitFile(uploaded.fileId).catch(() => {});
    }
    if (error.status) return next(error);

    console.error('ImageKit avatar upload failed:', error.message);
    return res.status(502).json({ message: 'Avatar upload failed. Please try again.' });
  }
}

/** POST /api/uploads/media - reusable image/video upload for the future message feature. */
export async function uploadMedia(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'Please select an image, video, or document.' });

  try {
    const mediaType = mediaTypeFor(req.file.mimetype);
    const folder = mediaType === 'video' ? '/chat-app/videos' : mediaType === 'image' ? '/chat-app/images' : '/chat-app/files';
    const media = await uploadRequestFile(req.file, folder);
    return res.status(201).json({ media });
  } catch (error) {
    if (error.status) return next(error);

    console.error('ImageKit media upload failed:', error.message);
    return res.status(502).json({ message: 'Media upload failed. Please try again.' });
  }
}
