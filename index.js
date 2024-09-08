const fs = require('fs');
const colors = require('colors');
const bs58 = require('bs58');

const {
  sendSol,
  generateRandomAddresses,
  getKeypairFromPrivateKey,
  PublicKey,
  connection,
  LAMPORTS_PER_SOL,
  delay,
} = require('./src/solanaUtils');

const { displayHeader } = require('./src/displayUtils');

(async () => {
  displayHeader();

  const addressCount = 100;
  const amountToSend = 0.001;
  const delayBetweenTx = 1000;

  const method = '1';
  let seedPhrasesOrKeys;
  if (method === '0') {
    seedPhrasesOrKeys = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
    if (!Array.isArray(seedPhrasesOrKeys) || seedPhrasesOrKeys.length === 0) {
      throw new Error(colors.red('accounts.json tidak diatur dengan benar atau kosong'));
    }
  } else if (method === '1') {
    seedPhrasesOrKeys = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));
    if (!Array.isArray(seedPhrasesOrKeys) || seedPhrasesOrKeys.length === 0) {
      throw new Error(colors.red('privateKeys.json tidak diatur dengan benar atau kosong'));
    }
  } else {
    throw new Error(colors.red('Metode input yang dipilih tidak valid'));
  }

  const randomAddresses = generateRandomAddresses(addressCount);

  let rentExemptionAmount;
  try {
    rentExemptionAmount =
      (await connection.getMinimumBalanceForRentExemption(0)) / LAMPORTS_PER_SOL;
    console.log(
      colors.yellow(
        `Saldo minimum yang diperlukan untuk pengecualian sewa: ${rentExemptionAmount} SOL`
      )
    );
  } catch (error) {
    console.error(
      colors.red(
        'Gagal mendapatkan saldo minimum untuk pengecualian sewa. Menggunakan nilai default.'
      )
    );
    rentExemptionAmount = 0.001;
  }

  if (amountToSend < rentExemptionAmount) {
    console.log(
      colors.red(
        `Jumlah yang ditentukan tidak valid. Jumlah harus setidaknya ${rentExemptionAmount} SOL untuk menghindari masalah sewa.`
      )
    );
    return;
  }

  for (const [index, privateKey] of seedPhrasesOrKeys.entries()) {
    let fromKeypair;
    try {
      fromKeypair = getKeypairFromPrivateKey(privateKey);
    } catch (error) {
      console.error(colors.red(`Gagal membuat keypair dari private key ke-${index + 1}:`), error);
      continue;
    }

    console.log(
      colors.yellow(
        `Mengirim SOL dari akun ${index + 1}: ${fromKeypair.publicKey.toString()}`
      )
    );

    for (const address of randomAddresses) {
      const toPublicKey = new PublicKey(address);
      try {
        await sendSol(fromKeypair, toPublicKey, amountToSend);
        console.log(
          colors.green(`Berhasil mengirim ${amountToSend} SOL ke ${address}`)
        );
      } catch (error) {
        console.error(colors.red(`Gagal mengirim SOL ke ${address}:`), error);
      }
      await delay(delayBetweenTx);
    }
  }

  console.log(colors.cyan('Semua transaksi selesai.'));
})();
