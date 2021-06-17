const dotenv = require('dotenv');
dotenv.config();

const prefix = '!';

const config = {
  prefix,
  unknownCommand: `I am having trouble understanding your command. Run \`${prefix} help\` if you need guidance for my activities.`,
  token: process.env.BOT_TOKEN,
  gameArgs: ['number', 'rating'],
  gameAPIURL: 'https://api.igdb.com/v4',
  gameAPIAuthToken: process.env.GAME_API_AUTHORIZATION_TOKEN,
  gameAPIClientID: process.env.GAME_API_CLIENT_ID,
};


module.exports = config;
