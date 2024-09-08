require('colors');

function displayHeader() {
  process.stdout.write('\x1Bc');
  console.log('========================================'.cyan);
  console.log('=           Sonic Odyssey BOT          ='.cyan);
  console.log('=     Created by HappyCuanAirdrop      ='.cyan);
  console.log('=    Edited by  SKW Airdrop Hunter     ='.cyan);
  console.log('========================================'.cyan);
  console.log();
}

module.exports = {
  displayHeader,
};
