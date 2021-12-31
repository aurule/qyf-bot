#! /usr/bin/bash

# this script is meant to be run from the bot's main directory

. ~/.nvm/nvm.sh
. ~/.profile
. ~/.bashrc

nvm exec default pm2 stop qyf-bot
nvm install
npm install
npm run migrate
nvm exec default pm2 start index.js --name qyf-bot
