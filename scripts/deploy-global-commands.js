const parseArgs = require("minimist")

const commandService = require("../services/command-deploy");

/**
 * Deploy the global commands to Discord
 *
 * Args:
 *   --hash HASH  The hash of existing command JSON. Optional.
 */
(async () => {
  const argv = parseArgs(process.argv.slice(2))
  await commandService.deployGlobals(argv.hash)
})()
