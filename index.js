const fs = require('fs');
const { token, prefix, unknownCommand } = require('./config');
const Discord = require('discord.js');
const client = new Discord.Client();

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

// Adds every command in /commands to the Map
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.on('message', (message) => {
  // Ignores any message not given to the bot
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  client.user.setActivity(`Waiting for ${prefix}`, { type: 'CUSTOM_STATUS' });
  // This is any arguments to back up the base command
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  // This is the base command
  const inputCommand = args.shift().toLowerCase();
  // This defines the command to run given the user's request - whether direct name or via an alias
  const command =
    client.commands.get(inputCommand) ||
    client.commands.find((command) => command.aliases && command.aliases.includes(inputCommand));
  // Returns the unknown command string if the root command wasn't understood
  if (!command) return message.reply(unknownCommand);
  // Prints help message for given command
  if (args.includes('help')) {
    let reply = command.description;
    if (command.args.list) {
      reply += `\n \n It can take these arguments: ${command.args.list.map((command) => `\`${command}\``)}`;
    }
    reply += `\n \n ${command.usage}`;
    return message.reply(reply);
  }
  // Checks how many arguments the command requires and sends an error message if not enough arguments given
  if (command.args.required && !args.length) {
    return message.channel.send(
      `\`${command.properName}\` requires at least ${command.args.number} ${
        command.args.number > 1 ? `arguments` : 'argument'
      } ${message.author}! \n ${command.usage}`,
    );
  }
  // Runs the command
  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.channel.send(`HELP!...THE..BOT....IS..BROKEN. CALL...${developer}....`);
  }
});





client.login(token);
