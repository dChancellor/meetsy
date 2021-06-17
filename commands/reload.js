const { unknownCommand, prefix } = require('../config');

module.exports = {
  name: 'reload',
  properName: 'Reload',
  type: 'utility',
  description: 'This is an administrative function to quick reload commands after code changes.',
  args: { required: true, number: 2 },
  usage: `For example: \`${prefix} reload help\``,
  execute(message, args) {
    const { commands } = message.client;
    const commandInput = args[0].toLowerCase();
    const selectedCommand =
      commands.get(commandInput) ||
      commands.find((command) => {
        command.aliases && command.aliases.includes(commandInput);
      });

    if (!selectedCommand) return message.reply(unknownCommand);

    delete require.cache[require.resolve(`./${selectedCommand.name}.js`)];

    try {
      const newCommand = require(`./${selectedCommand.name}.js`);
      commands.set(newCommand.name, newCommand);
      message.channel.send(`Command \`${newCommand.name}\` was reloaded!`);
    } catch (error) {
      console.error(error);
      message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
    }
  },
};
