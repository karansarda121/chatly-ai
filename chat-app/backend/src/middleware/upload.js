import multer from 'multer';

export const avatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
export const documentMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-zip-compressed', 'text/plain'];

export const chatMediaMimeTypes = [
  ...avatarMimeTypes,
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  ...documentMimeTypes,
];

const configuredSizeMb = Number.parseInt(process.env.MAX_FILE_SIZE_MB, 10);
const maxFileSizeMb = Number.isFinite(configuredSizeMb) && configuredSizeMb > 0
  ? configuredSizeMb
  : 25;

function createUpload(allowedMimeTypes, description) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeMb * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
      if (allowedMimeTypes.includes(file.mimetype)) return callback(null, true);

      const error = new Error(`Only ${description} files are allowed.`);
      error.status = 415;
      return callback(error);
    },
  });
}

export const uploadAvatar = createUpload(avatarMimeTypes, 'JPEG, PNG, or WebP image');
export const uploadChatMedia = createUpload(
  chatMediaMimeTypes,
  'JPEG, PNG, WebP, GIF, MP4, WebM, MOV, PDF, Word, Excel, PowerPoint, ZIP, or TXT',
);
