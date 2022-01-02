# Policies Implementation Guide

This is a bare-bones guide to the elements of a qyf-bot policy.

The policy object looks like this:

```ts
{
    allow(interaction): boolean
    errorMessage: string
}
```

(format is written in typescript, even though qyf-bot uses javascript)

Requirements:

* The `errorMessage` can be any descriptive string. Shown when a user's command is rejected.

## File Locations

Policies live in the `/policies` directory.
