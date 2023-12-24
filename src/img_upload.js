const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');


/**
 * This is a reference to the GridFSBucket instance that will be
 * initialized once the database connection is established.
 * 
 * @type {GridFSBucket}
 */
let gridFSBucket;

/**
 * This just initialize GridFS on the MongoDB database connection.
 * It set it up for storing and retrieving large files such as images, 
 * which exceed the BSON-document size limit. 
 * 
 * ### PLEASE NOTE:
 * This requires an established MongoDB connection via Mongoose and 
 * initializes a GridFSBucket to interact with the database under a 
 * specific collection ('uploads'). 
 * It will throws an error if the database connection is not established. 
 * I took this approach to ensure that GridFS initialization only occurs 
 * when the database is ready. That's basically it!
 *
 * @throws {Error} If the database connection is not established.
 *
 * @example
 *```
 * mongoose.connect(process.env.DB_CONNECTION_STRING).then(() => {
 *   initGridFS();
 *   // Further operations after initializing GridFS
 * });
 * ```
 */
const initGridFS = () => {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection is not established');
    }
    gridFSBucket = new GridFSBucket(db, { bucketName: 'uploads' });
};


/**
 * This is handling the uploads of image to GridFSBucket.
 *
 * @param {string} filePath - The path of the image file to upload.
 * @param {string} filename - The name to use for the uploaded file.
 * @returns {Promise<ObjectID>} - The promise that resolves to the id 
 *          of the uploaded file.
 * @throws {Error} - Throws an error if GridFSBucket is not initialized.
 * 
 * @example
 * ```
 * const filePath = 'path/to/image.jpg';
 * const filename = 'image.jpg';
 * uploadImage(filePath, filename).then((id) => {
 *  console.log(`Uploaded image with id: ${id}`);
 * });
 * ```
 */
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
