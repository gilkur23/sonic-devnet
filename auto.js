const cron = require('node-cron');
const { exec } = require('child_process');
require('colors');

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const process = exec(`node ${scriptName}`);

    process.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`${data}`);
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`Process ${scriptName} exited with code ${code}`.red);
        return reject(new Error(`Process ${scriptName} exited with code ${code}`));
      }
      resolve();
    });

    process.on('error', (err) => {
      console.error(`Error executing ${scriptName}: ${err.message}`.red);
      reject(err);
    });
  });
}

cron.schedule('10 0 * * *', async () => {
  try {
    console.log('Running index.js at 07:10 WIB...'.green);
    await runScript('index.js');

    console.log('Running claim.js at 07:10 WIB...'.green);
    await runScript('claim.js');

    console.log('Both scripts have been executed successfully.'.green);
  } catch (error) {
    console.error(`Error during script execution: ${error.message}`.red);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

console.log('Cron job scheduled to run every day at 07:10 WIB.'.cyan);
