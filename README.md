# Quote Your Friends bot

A Discord bot for recording quotes from your friends.

# Requirements

Node 17+

# ENVVARS

BOT_TOKEN
REDIS_URL
NODE_ENV
CLIENT_ID
DEV_GUILDS = [ "snowflake number" ]

# Deploy process

push code
install squelize-cli
run `npx sequelize db:migrate`
