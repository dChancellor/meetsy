const { prefix } = require('../config');

module.exports = {
  name: 'help',
  properName: 'Help',
  type: 'utility',
  description: 'This is a help function. Do you need help for the help function?',
  args: { required: false, number: 0 },
  usage: `For example: \`${prefix} help\``,
  aliases: ['help', '?', 'test'],
  execute(message) {
    const { commands } = message.client;
    let reply = `you can run a mashup command by typing one of the following: \n`;
    commands
      .filter(({ type }) => type != 'utility')
      .forEach((command) => {
        reply += ` \`${prefix} ${command.name}\` \n`;
      });
    return message.reply(reply);
  },
};
