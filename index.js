const fs = require('fs');
const colors = require('colors');

const {
  sendSol,
  generateRandomAddresses,
  getKeypairFromSeed,
  PublicKey,
  connection,
  LAMPORTS_PER_SOL,
  delay,
} = require('./src/solanaUtils');

const { displayHeader } = require('./src/displayUtils');

(async () => {
  // Tampilkan header
  displayHeader();

  // Parameter otomatis
  const addressCount = 100; // Jumlah alamat acak
  const amountToSend = 0.001; // Jumlah SOL yang dikirim
  const delayBetweenTx = 1000; // Delay antara transaksi dalam milidetik

  // Ambil seed phrases dari file
  const seedPhrases = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
  if (!Array.isArray(seedPhrases) || seedPhrases.length === 0) {
    throw new Error(colors.red('accounts.json tidak diatur dengan benar atau kosong'));
  }

  // Generate alamat acak
  const randomAddresses = generateRandomAddresses(addressCount);

  // Dapatkan jumlah minimum saldo untuk pengecualian sewa
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

  // Proses setiap seed phrase
  for (const [index, seedPhrase] of seedPhrases.entries()) {
    let fromKeypair;
    try {
      fromKeypair = await getKeypairFromSeed(seedPhrase);
    } catch (error) {
      console.error(colors.red(`Gagal membuat keypair dari seed phrase ke-${index + 1}:`), error);
      continue; // Lanjutkan ke seed phrase berikutnya jika terjadi kesalahan
    }

    console.log(
      colors.yellow(
        `Mengirim SOL dari akun ${index + 1}: ${fromKeypair.publicKey.toString()}`
      )
    );

    // Kirim SOL ke setiap alamat acak
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
