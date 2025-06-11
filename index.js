const TelegramBot = require('node-telegram-bot-api');
const { scrapeMercadoLivre, slugify } = require('./tools/scrape');
const { downloadTikTokVideo, deleteVideo } = require('./tools/tiktok');
const http = require('http');

http.createServer((req, res) => {
  res.write("Bot ativo");
  res.end();
}).listen(process.env.PORT || 80);

const token = '7860108959:AAGvynERIzHpdUJeWmU-aubRNnXAaiZjUno';
const bot = new TelegramBot(token, { polling: false });

bot.onText(/\/menu(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const user = msg.from.first_name || '<no-name>';
  bot.sendMessage(chatId, `📋 *${user}*, aqui está o menu:

1. /ml [produto] — Buscar produtos no Mercado Livre
2. /tk [link] — Baixar vídeo do TikTok
3. /echo [mensagem] — Repetir mensagem
4. /ping - Calcular a latência da mensagem`,
  { parse_mode: 'Markdown' });
});

bot.onText(/\/ping/, async (msg) => {
  const chatId = msg.chat.id;
  const start = process.hrtime(); // Alta resolução

  const sentMsg = await bot.sendMessage(chatId, '🏓 Medindo ping...');

  const diff = process.hrtime(start);
  const pingMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2); // segundos e nanos => ms

  bot.editMessageText(`🏓 Pong! Tempo de resposta: ${pingMs}ms`, {
    chat_id: sentMsg.chat.id,
    message_id: sentMsg.message_id
  });
});

// Comando /echo
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

// Comando /ml
bot.onText(/\/ml (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const termo = match[1];
  const produtos = await scrapeMercadoLivre(termo);

  if (!produtos) {
    bot.sendMessage(chatId, '❌ Erro ao buscar produtos.');
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
      console.error("Erro ao enviar produto:", err.message);
    }
  }
});

// Comando /tk
bot.onText(/\/tk (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const link = match[1];
  const videoPath = await downloadTikTokVideo(link);

  if (videoPath) {
    await bot.sendVideo(chatId, videoPath, {
      caption: '🎥 Vídeo do TikTok baixado com sucesso!',
      supports_streaming: true
    });
    await deleteVideo(videoPath);
  } else {
    bot.sendMessage(chatId, '❌ Erro ao baixar vídeo do TikTok.');
  }
});

// Qualquer mensagem recebida
bot.on('message', (msg) => {
  const user = msg.from?.first_name || '<no-name>';
  const text = msg.text || '';
  console.log(`${user} -> ${text}`);
});
