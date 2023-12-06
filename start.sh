#!/bin/bash

# Here before starting the app I'm basically 
# checking if MongoDB is installed and running.
# If it's not, the aim is to either start it
# if it's already installed, or exit with the 
# message to install MongoDB CLI.

if ! pgrep -x "mongod" >/dev/null
then
    echo "MongoDB is not running... Trying to start it now..."
    sudo systemctl start mongod

    if [ $? -ne 0 ]; then

        if ! command -v mongod &> /dev/null
        then
            echo "MongoDB is not installed... Please install MongoDB before running this app."
            exit 1
        fi

    fi
fi

npm start