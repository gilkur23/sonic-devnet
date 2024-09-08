const fs = require('fs');
require('colors');
const solana = require('@solana/web3.js');
const axios = require('axios').default;
const base58 = require('bs58');
const nacl = require('tweetnacl');
const { connection, delay } = require('./src/solanaUtils');
const { HEADERS } = require('./src/headers');
const { displayHeader } = require('./src/displayUtils');
const readlineSync = require('readline-sync');
const moment = require('moment');
const fetch = require('node-fetch'); // Import node-fetch

// Konfigurasi Telegram
const botToken = 'YOUR_BOT_TOKEN';
const chatId = 'YOUR_CHAT_ID';

const PRIVATE_KEYS = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));

// Struktur untuk melacak status
const status = {
  sendSol: { success: 0, failed: 0 },
  dailyLogin: { success: 0, failed: 0 },
  openBoxes: { total: 0, opened: 0 },
};

function getKeypair(privateKey) {
  const decodedPrivateKey = base58.decode(privateKey);
  return solana.Keypair.fromSecretKey(decodedPrivateKey);
}

async function getToken(privateKey) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/auth/sonic/challenge',
      params: { wallet: getKeypair(privateKey).publicKey.toBase58() },
      headers: HEADERS,
    });

    const sign = nacl.sign.detached(Buffer.from(data.data), getKeypair(privateKey).secretKey);
    const signature = Buffer.from(sign).toString('base64');
    const publicKey = getKeypair(privateKey).publicKey;
    const encodedPublicKey = Buffer.from(publicKey.toBytes()).toString('base64');
    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/auth/sonic/authorize',
      method: 'POST',
      headers: HEADERS,
      data: { address: publicKey.toBase58(), address_encoded: encodedPublicKey, signature },
    });

    return response.data.data.token;
  } catch (error) {
    console.error(`Error fetching token: ${error.message}`.red);
  }
}

async function getProfile(token) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/info',
      method: 'GET',
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });

    return data.data;
  } catch (error) {
    console.error(`Error fetching profile: ${error.message}`.red);
  }
}

async function doTransactions(tx, keypair, retries = 3) {
  try {
    const bufferTransaction = tx.serialize();
    const signature = await connection.sendRawTransaction(bufferTransaction);
    await connection.confirmTransaction(signature);
    return signature;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying transaction... (${retries} retries left)`.yellow);
      await new Promise((res) => setTimeout(res, 1000));
      return doTransactions(tx, keypair, retries - 1);
    } else {
      console.error(`Error in transaction: ${error.message}`.red);
      throw error;
    }
  }
}

async function openMysteryBox(token, keypair, retries = 3) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/mystery-box/build-tx',
      method: 'GET',
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });

    const txBuffer = Buffer.from(data.data.hash, 'base64');
    const tx = solana.Transaction.from(txBuffer);
    tx.partialSign(keypair);
    const signature = await doTransactions(tx, keypair);
    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/rewards/mystery-box/open',
      method: 'POST',
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      data: { hash: signature },
    });

    return response.data;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying opening mystery box... (${retries} retries left)`.yellow);
      await new Promise((res) => setTimeout(res, 1000));
      return openMysteryBox(token, keypair, retries - 1);
    } else {
      console.error(`Error opening mystery box: ${error.message}`.red);
      throw error;
    }
  }
}

async function fetchDaily(token) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/transactions/state/daily',
      method: 'GET',
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });

    return data.data.total_transactions;
  } catch (error) {
    console.error(`[ ${moment().format('HH:mm:ss')} ] Error in daily fetching: ${error.response?.data?.message}`.red);
  }
}

async function dailyClaim(token) {
  let counter = 1;
  const maxCounter = 3;

  try {
    const fetchDailyResponse = await fetchDaily(token);
    console.log(`[ ${moment().format('HH:mm:ss')} ] Total transaksi Anda: ${fetchDailyResponse}`.blue);

    if (fetchDailyResponse > 10) {
      while (counter <= maxCounter) {
        try {
          const { data } = await axios({
            url: 'https://odyssey-api-beta.sonic.game/user/transactions/rewards/claim',
            method: 'POST',
            headers: { ...HEADERS, Authorization: `Bearer ${token}` },
            data: { stage: counter },
          });

          console.log(`[ ${moment().format('HH:mm:ss')} ] Klaim harian untuk tahap ${counter} berhasil! Tahap: ${counter} | Status: ${data.data.claimed}`.green);
          counter++;
        } catch (error) {
          if (error.response?.data?.message === 'interact task not finished') {
            console.log(`[ ${moment().format('HH:mm:ss')} ] Error klaim tahap ${counter}: ${error.response.data.message}`.red);
            counter++;
          } else if (error.response && (error.response.data.code === 100015 || error.response.data.code === 100016)) {
            console.log(`[ ${moment().format('HH:mm:ss')} ] Sudah diklaim untuk tahap ${counter}, melanjutkan ke tahap berikutnya...`.cyan);
            counter++;
          } else {
            console.error(`[ ${moment().format('HH:mm:ss')} ] Error klaim: ${error.response?.data?.message}`.red);
          }
        } finally {
          await delay(1000);
        }
      }

      console.log(`Semua tahap telah diproses atau tahap maksimal tercapai.`.green);
    } else {
      throw new Error('Tidak cukup transaksi untuk klaim hadiah.');
    }
  } catch (error) {
    console.error(`[ ${moment().format('HH:mm:ss')} ] Error dalam klaim harian: ${error.message}`.red);
  }
}

async function dailyLogin(token, keypair, retries = 3) {
  try {
    const { data } = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/check-in/transaction',
      method: 'GET',
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });

    const txBuffer = Buffer.from(data.data.hash, 'base64');
    const tx = solana.Transaction.from(txBuffer);
    tx.partialSign(keypair);
    const signature = await doTransactions(tx, keypair);
    const response = await axios({
      url: 'https://odyssey-api-beta.sonic.game/user/check-in',
      method: 'POST',
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      data: { hash: signature },
    });

    return response.data;
  } catch (error) {
    if (error.response?.data?.message === 'current account already checked in') {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Error dalam login harian: ${error.response.data.message}`.red);
      status.dailyLogin.failed++;
    } else {
      console.error(`[ ${moment().format('HH:mm:ss')} ] Error klaim: ${error.response?.data?.message}`.red);
      status.dailyLogin.failed++;
    }
  }
}

async function processPrivateKey(privateKey) {
  try {
    const publicKey = getKeypair(privateKey).publicKey.toBase58();
    const token = await getToken(privateKey);
    const profile = await getProfile(token);

    if (profile.wallet_balance > 0) {
      const balance = profile.wallet_balance / solana.LAMPORTS_PER_SOL;
      const ringBalance = profile.ring;
      const availableBoxes = profile.ring_monitor;
      console.log(`Halo ${publicKey}! Selamat datang di bot kami. Berikut detail Anda:`.green);
      console.log(`Saldo Solana: ${balance} SOL`.cyan);
      console.log(`Saldo Ring: ${ringBalance}`.cyan);
      console.log(`Kotak Misteri Tersedia: ${availableBoxes}`.cyan);

      // Operasi harian
      await dailyClaim(token);
      await dailyLogin(token, getKeypair(privateKey));

      // Menggunakan kotak misteri
      if (availableBoxes > 0) {
        const boxResult = await openMysteryBox(token, getKeypair(privateKey));
        console.log(`Hasil kotak misteri: ${boxResult.data}`.cyan);
        status.openBoxes.opened++;
      }
    }
  } catch (error) {
    console.error(`[ ${moment().format('HH:mm:ss')} ] Error dalam pemrosesan private key ${privateKey}: ${error.message}`.red);
  }
}

async function sendTelegramMessage(botToken, chatId, message) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });
    console.log('Pesan Telegram berhasil dikirim.'.green);
  } catch (error) {
    console.error(`Error mengirim pesan ke Telegram: ${error.message}`.red);
  }
}

(async () => {
  try {
    displayHeader();
    for (const privateKey of PRIVATE_KEYS) {
      await processPrivateKey(privateKey);
    }

    const summaryMessage = `
    Ringkasan Operasi:
    - Solana Terkirim: ${status.sendSol.success} Berhasil, ${status.sendSol.failed} Gagal
    - Login Harian: ${status.dailyLogin.success} Berhasil, ${status.dailyLogin.failed} Gagal
    - Kotak Misteri: ${status.openBoxes.opened} Dibuka

    Bot By HCA EDIT By SKW
    `.trim();

    await sendTelegramMessage(botToken, chatId, summaryMessage);

    console.log('Semua private key telah diproses.'.cyan);
  } catch (error) {
    console.log(`Terjadi kesalahan dalam operasi bot: ${error}`.red);
  } finally {
    console.log('Bot By HCA EDIT By SKW '.magenta);
  }
})();
