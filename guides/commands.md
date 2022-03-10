# Command Implementation Guide

This is a bare-bones guide to the elements of a qyf-bot command.

The command object looks like this:

```ts
{
    name: string,                       // "command-name"
    description: string,                // "user visible description"
    type?: string,                      // "slash"
    policy?: Object|Array<Object>,      // ManagerPolicy
    data(options?): Builder,            // SlashCommandBuilder
    autocomplete?: Collection,          // new Collection([['game', GameNameCompleter]])
    async execute(interaction): Promise,
    async dm(interaction): Promise,
    help(options): string,              // "my very long help text"
}
```

(format is written in typescript, even though qyf-bot uses javascript)

Requirements:

* The `name` *must* be the same as used in the builder.setName() call within `data`
* The `description` should be the same as used in the builder.setDescription() call
* `type` is optional and describes the type of command: "menu" or "slash". `Undefined` is interpreted as `"slash"`.
* `policy` is optional and contains a policy object (or array of them) for allowing access to the command. `Undefined` allows all users.
* `data` must return an instance of a discordjs command builder
* `data` receives a `guild` argument for guild commands. This can be discarded if the command arguments don't need it. It does not receive arguments for global commands.
* `autocomplete` must be present if any options are marked with `.setAutocomplete(true)`
* the entries in `autocomplete` must use the name of the autocompleted option as the key, and an object with the `.complete()` method as the value
* `execute` should return `interaction.reply()` or similar
* `dm` is an optional method similar to `execute` which is run when the command is invoked in a DM
    - DM channels do not have a guild, so certain policies may fail before `dm` is called
* `help` receives an options object with the following attributes
* `help` must return a string

Help options object:

```ts
{
    command_name: string, // "/formatted-command-name"
}
```

The command_name attribute is populated by `CommandHelpPresenter.present()`.

## File Locations

Global commands live in the `/commands` directory. Guild commands live in `/commands/global`.

## Error Handling

The `interactionCreate` event handler catches any errors and replies with a friendly message to the user. Commands only need to catch errors if there is some special logic to apply, and can otherwise throw up the chain.
