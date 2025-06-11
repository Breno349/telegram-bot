const TelegramBot = require('node-telegram-bot-api');
const { scrapeMercadoLivre, slugify } = require('./tools/scrape');
const { downloadTikTokVideo, deleteVideo } = require('./tools/tiktok');

const http = require('http');
http.createServer((req, res) => {
  res.write("Bot ativo");
  res.end();
}).listen(process.env.PORT || 80);

const token = '7860108959:AAGvynERIzHpdUJeWmU-aubRNnXAaiZjUno';
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/menu (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  const user = msg.from.first_name ? msg.from.first_name.toString() : '<no-name>'
  bot.sendMessage(chatId,`**${user}** -> olá ai o menu, se quiser saber procura!`)
});

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
     bot.sendMessage(chatId, '❌ Erro ao buscar por produtos');
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

bot.onText(/\/tk (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  (async () => {
    const videoPath = await downloadTikTokVideo( resp );
    if (videoPath) {
      await bot.sendVideo(chatId, videoPath, {
        caption: '🎥 Vídeo do TikTok baixado com sucesso!',
        supports_streaming: true
      });
      await deleteVideo(videoPath);
    } else {
      bot.sendMessage(chatId, '❌ Erro ao baixar videos.');
    }
  })();
});

//bot.onText(/\/ml (.+)/, (msg, match) => {
//  const chatId = msg.chat.id;
//  const resp = match[1];
//});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from.first_name ? msg.from.first_name.toString() : '<no-name>'
  console.log( user+' -> '+msg.toString() )
  //bot.sendMessage(chatId, 'Received your message '+(msg.from.first_name ? msg.from.first_name.toString() : 'no-name' ));
});
