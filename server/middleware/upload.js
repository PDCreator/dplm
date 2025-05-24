const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Функция для преобразования имени файла
function sanitizeFileName(originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  // Удалить/заменить все небезопасные символы
  const safeBase = base.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${Date.now()}-${safeBase}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const sanitized = sanitizeFileName(file.originalname);
    cb(null, sanitized);
  }
});

const upload = multer({ storage });
module.exports = upload;