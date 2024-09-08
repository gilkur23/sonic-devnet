const { exec } = require('child_process');

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
        console.error(`Process ${scriptName} exited with code ${code}`);
        return reject(new Error(`Process ${scriptName} exited with code ${code}`));
      }
      resolve();
    });

    process.on('error', (err) => {
      console.error(`Error executing ${scriptName}: ${err.message}`);
      reject(err);
    });
  });
}

(async () => {
  try {
    console.log('Running index.js...');
    await runScript('index.js');
    
    console.log('Running claim.js...');
    await runScript('claim.js');
    
    console.log('Both scripts have been executed successfully.');
  } catch (error) {
    console.error(`Error during script execution: ${error.message}`);
  }
})();
