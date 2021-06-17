const { prefix, movieAPIAuthToken, movieAPIURL } = require('../config');
const Discord = require('discord.js');

const fetch = require('node-fetch');

let numberOfAttempts = 0;

module.exports = {
  name: 'movie',
  properName: 'Movie',
  type: 'movie',
  description:
    'The `movie` command mashes up multiple movies for a fun creative thought prompt. \n The default values is 2 movies with over a 7 TMDB rating.',
  args: {
    required: false,
    number: 0,
    list: [
      'number(2-4)',
      'minimum-rating(0-10)',
      'maximum-rating(0-10)',
      'year(2020)',
      'minimum-date(1987-07-02)',
      'maximum-date(1987-07-02)',
      'with-person(1461) - this is the TMDB person ID number',
    ],
  },
  usage: `For example: \`${prefix} movie number=2 minimum-rating=7\``,
  aliases: ['movie', 'movies'],
  async execute(message, args) {
    let movies = [];
    const { filter, numberOfMovies, error } = parseArgs(args);
    if (error) return errorHandler(message, error);
    // Loading message
    message.channel.send(`*Mashing up ${numberOfMovies} movies for ${message.author.username}...*`);
    // Gets games
    while (movies.length < numberOfMovies) {
      let { movie, error } = await getMovie(filter, Math.ceil(Math.random() * 500));
      if (error) return errorHandler(message, error);
      movies.push(movie);
    }
    // Gets covers and creates embeds for each game
    movies.forEach(async (movie, index) => {
      const embed = await createEmbed(movie, message);
      message.channel.send(embed);
      if (index < movies.length - 1) message.channel.send('>>> ***vs***');
    });
  },
};

const createEmbed = async (movie) => {
  return new Discord.MessageEmbed()
    .setColor('RANDOM')
    .setTitle(`${movie.original_title}`)
    .setURL(`https://www.themoviedb.org/movie/${movie.id}`)
    .setImage(`https://www.themoviedb.org/t/p/w1280/${movie.poster_path}`)
    .setDescription(`${movie.overview.slice(0, 1024)}`)
    .setTimestamp()
    .setFooter('Courtesy of TMDB');
};

const getMovie = async (filter, randomizer) => {
  let url = movieAPIURL.replace('page=1', `page=${randomizer}`);
  url += filter;
  return fetch(url, {
    method: 'get',
    headers: {
      Authorization: movieAPIAuthToken,
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((json) => {
      numberOfAttempts += 1;
      if (numberOfAttempts > 10)
        throw `Something went terribly wrong and we are stuck in a loop. Check your parameters and contact ${developer}`;
      if (json.total_pages === 0)
        throw 'No results found - something went wrong with the API call. Check your parameters';
      if (json.results?.length > 0) return { movie: json.results[Math.floor(Math.random() * json.results.length)] };
      return getMovie(filter, Math.ceil(Math.random() * json.total_pages));
    })
    .catch((error) => {
      return { error };
    });
};

const parseArgs = (args) => {
  let filter = '';
  let numberOfMovies = 2;
  try {
    args.forEach((arg) => {
      // Handles incorrect syntax
      if (!arg.includes('=')) throw `Your argument should be in the format of "x"="y" \n For example: \`number=3\``;
      //Splits parameter and input
      const [parameter, input] = arg.split('=');
      //Sets number of games requested
      if (parameter === 'number') {
        if (2 > input > 4)
          throw 'Due to rate limiting, please enter a number between 2 and 4 for the number of movies.';
        return (numberOfMovies = input);
      }
      //Translates the parameter to the endpoint for the API
      filter += reducer(parameter, input);
    });
  } catch (error) {
    console.log(error);
    return { error };
  }
  if (!filter.includes('vote_average_gte=')) filter += '&vote_average_gte=7';
  return { filter, numberOfMovies };
};

const reducer = (parameter, input) => {
  switch (parameter) {
    case 'minimum-rating':
      if (input < 0) input = 0;
      if (input > 10) input = 10;
      return `&vote_average.gte=${input}`;
    case 'maximum-rating':
      if (input < 0) input = 0;
      if (input > 10) input = 10;
      return `&vote_average.lte=${input}`;
    case 'year':
      return `&primary_release_year=${input}`;
    case 'minimum-date':
      return `&primary_release_date.gte=${input}`;
    case 'maximum-date':
      return `&primary_release_date.lte=${input}`;
    case 'with-person':
      return `&with_people=${input}`;
    default:
  }
};
