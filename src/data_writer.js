const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');


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


const checkForDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

module.exports = { processDataAndWriteToFile, checkForDirectory };
