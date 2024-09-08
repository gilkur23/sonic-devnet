const { exec } = require('child_process');

// Fungsi untuk menjalankan skrip yang diinginkan
const runScripts = () => {
  console.log('Menjalankan skrip index.js dan claim.js...');

  // Menjalankan skrip index.js
  exec('npm run start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error saat menjalankan index.js: ${error}`);
      return;
    }
    console.log(`Output index.js:\n${stdout}`);
    if (stderr) {
      console.error(`Error index.js:\n${stderr}`);
    }

    // Menjalankan skrip claim.js
    exec('npm run claim', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error saat menjalankan claim.js: ${error}`);
        return;
      }
      console.log(`Output claim.js:\n${stdout}`);
      if (stderr) {
        console.error(`Error claim.js:\n${stderr}`);
      }
    });
  });
};

// Fungsi untuk menjadwalkan eksekusi setiap 24 jam
const scheduleDailyExecution = () => {
  // Interval eksekusi dalam milidetik (24 jam)
  const interval = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik

  // Menjalankan skrip pertama kali
  runScripts();

  // Mengatur interval untuk menjalankan skrip setiap 24 jam
  setInterval(runScripts, interval);
};

// Mulai penjadwalan
scheduleDailyExecution();

console.log('Scheduler telah dimulai. Skrip akan dijalankan setiap 24 jam.');
