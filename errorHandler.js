module.exports = errorHandler = (message, error) => {
  console.error('\x1b[33m%s\x1b[0m', `INFO: ${message.author.username} sent the following command - ${message.content}`);
  console.error('\x1b[31m%s\x1b[0m', `ERROR: ${error}`);
  return message.reply(error);
};
