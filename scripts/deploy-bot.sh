#! /usr/bin/bash

# this script is meant to be run from the bot's main directory

. ~/.profile
. ~/.bashrc

npm install
npm run migrate
pm2 reload qyf-bot
