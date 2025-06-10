const axios = require('axios');
const cheerio = require('cheerio');

const url_base = "https://lista.mercadolivre.com.br";

function iden_name($, pr) {
  const nm = $(pr).find('a.poly-component__title').first();
  return nm.length ? nm.text().trim() : false;
}

function iden_price($, pr) {
  const pc0 = $(pr).find('span.andes-money-amount__fraction').first().text();
  const pc1 = $(pr).find('span.andes-money-amount__cents').first().text() || '00';
  if (!pc0) return false;
  return `${pc0},${pc1}`;
}

function iden_img($, pr) {
  const img = $(pr).find('img.poly-component__picture').first();

  if (!img || img.length === 0) return false;

  let src = img.attr('src');
  if (!src || !src.includes('http')) {
    src = img.attr('data-src');
  }

  if (src && src.startsWith('http')) {
    return src;
  }

  return false;
}

function iden_link($, pr) {
  const a = $(pr).find('a.poly-component__title').first();
  return a.length ? a.attr('href') : false;
}

function iden_rat($, pr) {
  const rt = $(pr).find('span.poly-reviews__rating').first();
  return rt.length ? parseFloat(rt.text().trim()) : 0.0;
}

async function procura(prd) {
  try {
    const url = `${url_base}/${encodeURIComponent(prd)}`;
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(html);
    const produtos = $('li.ui-search-layout__item');
    const results = [];

    produtos.each((i, el) => {
      if (i >= 5) return false;

      const name = iden_name($, el);
      const price = iden_price($, el);
      const link = iden_link($, el);
      const image = iden_img($, el);
      const stars = iden_rat($, el);

      if (name && price && link && image) {
        results.push({ name, price, link, image, stars });
      }
    });

    return results.length ? results : false;
  } catch (err) {
    return false;
  }
}

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

module.exports = {
  scrapeMercadoLivre: procura,
  slugify
};
