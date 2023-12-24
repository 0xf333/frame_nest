const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');


/**
 * This basically processes an array of response objects from the 
 * computer vision API and then writes the processed data to a JSON.
 * The way this work is each response is transformed into a structured 
 * format, extracting key information such as:
 *  - image metadata
 *  - tags
 *  - colors
 *  - captions
 *  - etc...
 * And then the processed data is then saved in a JSON within a temp 
 * directory, and then a database upload script is executed.
 *
 * @param {Object[]} responses - An array of response objects from the 
 *        computer vision API.
 * @param {string} filename - The name of the file where the processed 
 *        data will be written.
 * 
 * @example
 * ```
 * const responses = [
 *   {
 *     filename: 'image1.jpg',
 *     data: {
 *       caption_GPTS: 'A scenic view of mountains.',
 *       tags: [{ name: 'mountain' }, { name: 'nature' }],
 *       colors: [{ color: 'blue' }, { color: 'green' }],
 *       metadata: { width: 1920, height: 1080, format: 'jpg' },
 *       imageFileId: '12345'
 *     }
 *   },
 *   // ...other response objects
 * ];
 * const filename = 'processedData.json';
 * processDataAndWriteToFile(responses, filename);
 * ```
 */
const processDataAndWriteToFile = (responses, filename) => {
    const processedData = responses.map(response => {

        const {
            caption_GPTS,
            tags,
            colors,
            metadata,
            imageFileId
        } = response.data;

        return {
            filename: response.filename,
            imageFileId,
            data: {
                Categories: tags ? tags.map(tag => tag.name) : [],
                GPT_S_Description: caption_GPTS,
                Tags: tags || [],
                Colours: colors || [],
                Width: metadata ? metadata.width : undefined,
                Height: metadata ? metadata.height : undefined,
                Format: metadata ? metadata.format : undefined
            }
        };
    });

    const jsonFilePath = path.join(
        __dirname,
        '..',
        checkForDirectory('tmp'),
        filename
    );

    fs.writeFileSync(
        jsonFilePath,
        JSON.stringify({ images: processedData }, null, 2)
    );
    //console.log(`Data saved to JSON file: ${jsonFilePath}`);

    execDbUploadScript(jsonFilePath);

};


/**
 * This basically executes the database upload script using the provided 
 * JSON file path.
 * It's bassically doing it by invoking an external shell script that 
 * handles the upload of JSON data to the database.(`db_upload.sh`) 
 * And then after the script execution, the JSON file is deleted to clean 
 * up the temp directory.
 *
 * @param {string} jsonFilePath - The path to the JSON file containing 
 *        the data to be uploaded.
 * 
 * @example
 * ```
 * const jsonFilePath = 'path/to/data.json';
 * execDbUploadScript(jsonFilePath);
 * ```
 */
const execDbUploadScript = (jsonFilePath) => {
    exec('./db_upload.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        fs.unlinkSync(jsonFilePath);
    });
};


/**
 * This just checking if the specified directory exists, and creates it 
 * if it does't. that's all!
 * The reason for this is because it's essential to make sure that the 
 * required directory structure is in place before the application try 
 * to write files to it, otherwise it will throw an error.
 *
 * @param {string} dir - The path of the directory to check/create.
 * @returns {string} - The directory path that was checked or created.
 * 
 * @example
 * ```
 * const tempDirectory = 'path/to/temp';
 * const checkedDirectory = checkForDirectory(tempDirectory);
 * ```
 */
const checkForDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

module.exports = { processDataAndWriteToFile, checkForDirectory };
