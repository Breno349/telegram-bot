const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadTikTokVideo(tiktokUrl) {
  try {
    const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
    const { data } = await axios.get(apiUrl);
    if (!data || !data.data || !data.data.play) {
      throw new Error("Não foi possível obter o link do vídeo.");
    }
    const videoUrl = data.data.play;
    const fileName = `video_tiktok_${Date.now()}.mp4`;
    const filePath = path.join(__dirname, fileName);
    const response = await axios.get(videoUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    return filePath;
  } catch (error) {
    return false;
  }
}

async function deleteVideo(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

module.exports = {
  downloadTikTokVideo,
  deleteVideo
};
