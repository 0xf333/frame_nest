const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');


let gridFSBucket;

const initGridFS = () => {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection is not established');
    }
    gridFSBucket = new GridFSBucket(db, { bucketName: 'uploads' });
};


const uploadImage = async (filePath, filename) => {
    if (!gridFSBucket) {
        throw new Error('GridFSBucket is not initialized');
    }

    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath);
        const uploadStream = gridFSBucket.openUploadStream(filename, {
            contentType: 'image/jpeg'
        });

        readStream.pipe(uploadStream);

        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
            console.log(`Uploaded image: ${filename}`);
            resolve(uploadStream.id);
        });
    });
};

module.exports = { uploadImage, initGridFS };
