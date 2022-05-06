#! /usr/bin/bash

# this script is meant to be run from the bot's main directory

# . ~/.profile
# . ~/.bashrc

git branch release/$1
git checkout release/$1
npm --no-git-tag-version version $1
npm run changelog:build
