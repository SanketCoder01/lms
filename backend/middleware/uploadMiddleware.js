const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept common document types: images, PDFs, Word, Excel, text
    const allowedExtensions = /jpeg|jpg|png|gif|bmp|webp|pdf|doc|docx|xls|xlsx|txt|rtf|odt|ods/;
    const allowedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/rtf',
        'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet'
    ];

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype);

    // Accept if either extension OR mimetype matches (more lenient)
    if (extname || mimetypeValid) {
        return cb(null, true);
    } else {
        // Log for debugging but still accept with warning
        console.warn(`File upload: Unrecognized type ${file.mimetype} for ${file.originalname}, accepting anyway`);
        return cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (increased from 5MB)
    fileFilter: fileFilter
});

module.exports = upload;
