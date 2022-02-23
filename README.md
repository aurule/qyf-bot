# Quote Your Friends bot

qyf-bot is a Discord bot for recording quotes from your friends. It's designed to be easy to use and powerful, with a few uniquely powerful features.

## Get qyf-bot

So you want to add qyf-bot to your server? Great! Follow these steps to get started.

1. Click this link to [Install qyf-bot](https://discord.com/api/oauth2/authorize?client_id=912439771312308264&permissions=277025392704&scope=bot%20applications.commands) on a server
2. Choose the server you want qyf-bot to be on and allow it to have its default permissions. These permissions are pretty restrictive, and limit qyf-bot to receiving commands and looking up usernames of people who use it.
3. Set up one or more games. Qyf-bot creates a default "No Game", uh, game for each server, but you probably have some games of your own in mind. Use the `/add-game` command to create them.
4. Start quoting! Use the `/quote` command to add quotes and `/list-quotes` to view the quotes you've saved.

## Features

* **Multiple games in a server**: Each Discord server can have multiple games configured at once, and you can add quotes to any game at any time
* **Attribution**: qyf-bot saves the current nickname of the person who said the quote, so it isn't lost to a future name change
* **Default games**: You can set the default game for quotes that are recorded from a specific channel, channel group, or for the whole server
* **Anonymous quotes**: Need to quote someone who isn't on discord, or whose identity is a closely guarded secret? No problem! Use the @qyf-bot user itself as the speaker and the quote will be marked as anonymous
* **Built-in help**: The `/qyf-help` command explains the ins and outs of each command in qyf-bot, as well as its trickier features

## Getting Help

Since qyf-bot uses slash commands, Discord can help you complete command names, argument names, and some argument values. Just type a single `/` character and the command list will pop up. Select or start typing an argument name and Discord will help you fill it in!

Qyf-bot comes with a built-in help system in the form of the `/qyf-help` command. You can use `/qyf-help` to see how any command works, including its arguments and exact behavior, as well as to learn about qyf-bot's trickier features. Try browsing the `Commands` help topic (using `/qyf-help topic:Commands`) to see all of what qyf-bot can do!

## Giving Feedback

Want to compliment the dev, suggest a new feature, or complain because something broke? Well, you can. Use the `/qyf-feedback` command to let me know if something's great, not behaving right, or if you have a cool idea you'd like me to think about for qyf-bot. Each bit of feedback is saved with the user who submitted it, just in case I need to reach out for clarification.

## Privacy

I take privacy pretty dang seriously! Qyf-bot specifically does not request permission to read all messages in a server, nor to browse the member list, or anything else invasive. I've requested the minimum possible permissions to get the job done. That said, all quotes stored by qyf-bot are accessible to a third party (me!), and are viewable by *everyone* in the server that the quote came from. Be mindful of what you quote and if it wouldn't be good for your whole server to read it, just don't quote it.

# Development

## Requirements

Node 17+

## Dev Installation

run `npm install`
run `npm run migrate`
ensure DEV_GUILDS is correct

## ENVVARS

* BOT_TOKEN: discord bot application token 
* REDIS_URL: URL of the redis instance to use 
* NODE_ENV: one of "development", "test", "ci", or "production"
* CLIENT_ID: ID of the bot's discord user 
* DEV_GUILDS: [ "guild_snowflake" ] 
* DB_HOST: Host for the postgres database (only used in production) 
* DB_PW: password for the postgres database (only used in production)

## Versioning

qyf-bot uses [semantic versioning](https://semver.org/). In addition to the standard version increment rules, the minor version may be bumped for new commands and database changes.

## Deployment

* copy code 
* run `npm install` 
* run `npm run migrate` 
* run `npm run commands:deploy-globals` 
* run `npm run commands:deploy-guilds` 
* restart daemon (`node index.js`)
