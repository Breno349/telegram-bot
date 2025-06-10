const TelegramBot = require('node-telegram-bot-api');
const { scrapeMercadoLivre, slugify } = require('./tools/scrape');

const token = '7860108959:AAGvynERIzHpdUJeWmU-aubRNnXAaiZjUno';
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

bot.onText(/\/ml (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  (async () => {
    const produtos = await scrapeMercadoLivre(resp);
    if (!produtos) {
     bot.sendMessage(chatId, 'Erro ao buscar por produtos');
     return;
    }
    for (const prd of produtos) {
     try {
      if (!prd.image) continue;
       await bot.sendPhoto(chatId, prd.image, {
        caption: `📦 *${prd.name}*\n💸 *R$ ${prd.price}*\n⭐ ${prd.stars} estrelas`,
        parse_mode: 'Markdown'
       });
      } catch (err) {
      continue;
     }
    }
  })();

});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Received your message '+(msg.from.first_name ? msg.from.first_name.toString() : 'no-name' ));
});
