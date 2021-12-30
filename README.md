# Quote Your Friends bot

A Discord bot for recording quotes from your friends.

# Requirements

Node 17+

## Dev Installation

run `npm install`
run `npm run migrate`
ensure DEV_GUILDS is correct

## Versioning

qyf-bot uses [semantic versioning](https://semver.org/). In addition to the standard version increment rules, the minor version may be bumped for new commands and database changes.

# ENVVARS

BOT_TOKEN: discord bot application token
REDIS_URL: URL of the redis instance to use
NODE_ENV: one of "development", "test", "ci", or "production"
CLIENT_ID: ID of the bot's discord user
DEV_GUILDS = [ "guild_snowflake" ]

# Deployment

copy code
run `npm install`
run `npm run migrate`
run `npm run commands:deploy-globals`
run `npm run commands:deploy-guilds`
restart daemon (`node index.js`)
