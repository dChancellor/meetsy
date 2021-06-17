const { prefix, gameAPIAuthToken, gameAPIClientID, gameAPIURL } = require('../config');
const Discord = require('discord.js');

const fetch = require('node-fetch');

module.exports = {
  name: 'game',
  properName: 'Game',
  type: 'game',
  description:
    'The `game` command mashes up multiple games for a fun creative thought prompt. \n The default values are 2 games over 80 rating.',
  args: { required: false, number: 0, list: ['number(2-4)', 'minimum-rating(0-100)', 'maximum-rating(0-100)'] },
  usage: `For example: \`${prefix} game number=3\``,
  aliases: ['game', 'games', 'video games'],
  async execute(message, args) {
    let games = [];
    const { filter, numberOfGames, error } = parseArgs(args);
    // Error handling
    if (error) message.reply(`Your argument should be in the format of "x"="y" \n For example: \`number=3\``);
    if (numberOfGames > 4)
      return message.channel.send(
        'Due to rate limiting, please enter a number between 2 and 4 for the number of games.',
      );
    // Loading message
    message.channel.send(`*Mashing up ${numberOfGames} games for ${message.author.username}...*`);
    // Gets games
    while (games.length < numberOfGames) {
      let randomizer = Math.floor(Math.random() * 5000);
      games.push(await getGame(filter, randomizer));
    }
    // Gets covers and creates embeds for each game
    games.forEach(async (game, index) => {
      const embed = await createEmbed(game, message);
      message.channel.send(embed);
      if (index < games.length - 1) message.channel.send('>>> ***vs***');
    });
  },
};

const createEmbed = async (game) => {
  let cover = await getCover(game.cover);
  return new Discord.MessageEmbed()
    .setColor('RANDOM')
    .setTitle(`${game.name}`)
    .setURL(`${game.url}`)
    .setImage(`https://${cover}`)
    .setDescription(`${game.summary.replace(/(\r\n|\n|\r)/gm, '').slice(0, 1024)}`)
    .setTimestamp();
};

const getCover = async (coverID) => {
  return fetch(`${gameAPIURL}/covers`, {
    method: 'post',
    body: `fields url; \n where id = ${coverID};`,
    headers: {
      Authorization: gameAPIAuthToken,
      'Client-ID': gameAPIClientID,
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then(([{ url }]) => {
      return url.slice(2, url.length).replace('t_thumb', 't_cover_big');
    });
};
const getGame = async (filter, randomizer) => {
  let game = await fetch(`${gameAPIURL}/games`, {
    method: 'post',
    body: `fields name, cover, summary, url; \n limit 1; \n offset ${randomizer}; \n ${filter};`,
    headers: {
      Authorization: gameAPIAuthToken,
      'Client-ID': gameAPIClientID,
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((res) => {
      // If game is found, return the game
      if (res.length > 0) return res[0];
      // If game is not found, run this function again but reducing the randomizer by half
      console.log('Did not find game, trying again...');
      return getGame(filter, Math.floor(randomizer / 2));
    })
    .catch((err) => {
      console.log(err);
    });
  return game;
};

const parseArgs = (args) => {
  let filter = `where `;
  let numberOfGames = 2;
  let error = false;
  args.forEach((arg) => {
    // Handles incorrect syntax
    if (!arg.includes('=')) return (error = true);
    //Splits parameter and input
    const [parameter, input] = arg.split('=');
    //Sets number of games requested
    if (parameter === 'number') return (numberOfGames = input);
    //Translates the parameter to the endpoint for the API
    filter += reducer(parameter, input);
  });
  if (!filter.includes('aggregated_rating')) filter += 'aggregated_rating > 80';
  return { filter, numberOfGames, error };
};

const reducer = (parameter, input) => {
  switch (parameter) {
    case 'minimum-rating':
      if (input < 0) input = 0;
      if (input > 100) input = 100;
      return `aggregated_rating > ${input}`;
    case 'maximum-rating':
      if (input < 0) input = 0;
      if (input > 100) input = 100;
      return `aggregated_rating < ${input}`;
    default:
  }
};
