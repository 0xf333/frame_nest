#!/bin/bash

DB_NAME="images_db"

COLLECTION_NAME="batch_$(date +%Y_%m-%+d_%H-%M)"

JSON_FILE="tmp/imageResponses.json"

if [ ! -f "$JSON_FILE" ]; then
    echo "JSON file not found: $JSON_FILE"
    exit 1
fi

mongoimport --db "$DB_NAME" --collection "$COLLECTION_NAME" --file "$JSON_FILE"

echo "Data imported into database '$DB_NAME' --> collection '$COLLECTION_NAME'"
