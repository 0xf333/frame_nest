require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const JSZip = require('jszip');
const upload = multer({ dest: 'uploads/' });
const { processDataAndWriteToFile } = require('./data_writer');
const { uploadImage, initGridFS } = require('./img_upload');


mongoose.connect(process.env.DB_CONNECTION_STRING);

mongoose.connection.once('open', async () => {
    try {
        await initGridFS();
        console.log("\nDatabase connected and GridFS initialized");

        const app = express();
        const port = 3000;
        const key = process.env.ASTICA_KEY;

        app.use(express.static('public'));

        app.post('/upload', upload.single('file'), async (req, res) => {
            try {
                console.log('\nFile upload received:', req.file.originalname);

                if (req.file.mimetype === 'application/zip') {
                    console.log('Processing zip folder...');
        
                    const zipData = fs.readFileSync(req.file.path);
                    const zip = await JSZip.loadAsync(zipData);
                    const imagePromises = [];
                    let imageResponses = []; 
        
                    for (const filename of Object.keys(zip.files)) {
                        if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
                            imagePromises.push(processImage(zip, filename, key));
                        }
                    }
                    
                    const batchSize = 20; 
                    for (let i = 0; i < imagePromises.length; i += batchSize) {
                        const batch = imagePromises.slice(i, i + batchSize);
                        const batchResponses = await Promise.all(batch);
                        imageResponses = imageResponses.concat(batchResponses); 
                    }
        
                    processDataAndWriteToFile(imageResponses, 'imageResponses.json');
                    res.json({ images: imageResponses });
                    fs.unlinkSync(req.file.path);

                } else {
                    const filePath = req.file.path;
                    const image_data = fs.readFileSync(filePath);
                    const image_extension = req.file.originalname.split('.').pop();
                    const astica_input = `data:image/${image_extension};base64,${image_data.toString('base64')}`;
                    const filename = req.file.originalname; 

                    console.log('\nProcessing image for Astica API, please wait...');

                    const requestData = {
                        tkn: key,
                        modelVersion: '2.1_full',
                        input: astica_input,
                        visionParams: 'gpt, describe, describe_all, tags, colors',
                        gpt_prompt: '',
                        prompt_length: 95
                    };

                    const response = await axios({
                        method: 'post',
                        url: 'https://vision.astica.ai/describe',
                        data: requestData,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.status === 200 && response.data) {
                        console.log('Astica API response received');
                        const imageId = await uploadImage(filePath, filename);

                        processDataAndWriteToFile([{
                            filename: req.file.originalname,
                            data: response.data,
                            imageFileId: imageId
                        }], 'imageResponses.json');

                        res.json(response.data);
                        fs.unlinkSync(filePath); 

                    } else {
                        console.error('API response error:', response);
                        res.status(500).send('Error processing file');
                    }
                }
            } catch (error) {
                console.error('Error during image processing:', error.message);
                res.status(500).send('Error processing file');
            }
        });

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Open http://localhost:${port} in your browser`);
        });

    } catch (error) {
        console.error('Error during GridFS initialization:', error);
    }
});


const processImage = async (zip, filename, apiKey) => {
    const fileData = await zip.files[filename].async('nodebuffer');
    const tempFilePath = `uploads/${filename}`;
    fs.writeFileSync(tempFilePath, fileData);

    const astica_input = `data:image/${filename.split('.').pop()};base64,${fileData.toString('base64')}`;
    const requestData = {
        tkn: apiKey,
        modelVersion: '2.1_full',
        input: astica_input,
        visionParams: 'gpt, describe, describe_all, tags, colors',
        gpt_prompt: '',
        prompt_length: 95
    };

    try {
        const response = await axios({
            method: 'post',
            url: 'https://vision.astica.ai/describe',
            data: requestData,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 200 && response.data) {
            console.log('Astica API response received for:', filename);
            const imageId = await uploadImage(tempFilePath, filename);
            return { filename, data: response.data, imageFileId: imageId };
        } else {
            //console.error('API response error for:', filename, response);
            console.log(`\nSkipping ${filename} due to an internet connection error\n`);
        }
    } catch (error) {
        //console.error('Error processing image:', filename, error);
        console.log(`\nSkipping ${filename} due to an internet connection error\n`);
    } finally {
        fs.unlinkSync(tempFilePath); 
    }
};
