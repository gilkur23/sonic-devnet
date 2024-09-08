const cron = require('node-cron');
const { exec } = require('child_process');
const fetch = require('node-fetch');

const botToken = 'YOUR_BOT_TOKEN';  // Ganti dengan token bot Telegram Anda
const chatId = 'CHAT_ID';  // Ganti dengan ID chat Telegram Anda

// Fungsi untuk mengirim pesan ke Telegram
async function sendTelegramMessage(botToken, chatId, message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('Pesan berhasil dikirim ke Telegram.');
        } else {
            console.log(`Gagal mengirim pesan. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error mengirim pesan: ${error.message}`);
    }
}

// Fungsi untuk menjalankan perintah shell
function runScript(scriptPath) {
    return new Promise((resolve, reject) => {
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing script ${scriptPath}: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);
            resolve();
        });
    });
}

// Jadwalkan eksekusi ulang setiap hari pada pukul 00:15 UTC
cron.schedule('15 0 * * *', async () => {
    console.log('Menjalankan script otomatis pada pukul 00:15 UTC...');
    try {
        // Jalankan index.js dan claim.js secara bersamaan
        await Promise.all([
            runScript('index.js'),
            runScript('claim.js')
        ]);
        console.log('Semua skrip telah dijalankan dengan sukses.');
        await sendTelegramMessage(botToken, chatId, 'Semua operasi telah selesai dengan sukses.');
    } catch (error) {
        console.error(`Terjadi kesalahan: ${error}`);
        await sendTelegramMessage(botToken, chatId, `Terjadi kesalahan saat menjalankan skrip: ${error}`);
    }
});
