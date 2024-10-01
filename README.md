# Sonic Odyssey Devnet



## Fitur
* Otomatis send 100 tx 
* Otomatis daily login 
* Otomatis claim box tx Milestone 
* Otomatis buka semua box
* Kirim Status sukses atau gagal ke telegram

### [Link Testnet](https://odyssey.sonic.game/?join=waiivL)

### [Bot Ori](https://github.com/dante4rt/sonic-odyssey-bot) by HCA (HappyCuanAirdrop) 


### Step
1. Clone repo & masuk ke folder
```
git clone https://github.com/gilkur23/sonic && cd sonic
```

2. Install Nodejs & module
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && source ~/.bashrc && nvm install v22.3.0 && nvm use v22.3.0 && nvm alias default v22.3.0 && npm i 
```

3. Edit Private Key `privateKeys.json`
```
nano privateKeys.json
```
4. Format Private key 
```
[ 
  "privatekey1", 
  "privatekey2",
  "privatekey3"
]
```
5. Jalankan bot Manual 

Send sol 100x
```
node index.js
```
Daily Login
```
node daily.js
```
Buka Kotak Tx Milestone
```
node opentx.js
```
Buka Semua box ring
```
node openbox.js
```

6. Jalankan bot otomatis ( bisa langsung run setiap hari )
```
node auto.js
```
\
\
\
Untuk Memggunakan fitur send status ke Telegram edit file `.env`
```
nano .env
```
Format `.env`
```
TELEGRAM_BOT_TOKEN=Isi API bot kalian
TELEGRAM_CHAT_ID=Isi User id Telegram
```
Contoh `.env` \
TELEGRAM_BOT_TOKEN=123456789:AAErhakaYXXkzk1DBiksss_AgB1wGSa \
TELEGRAM_CHAT_ID=123456789 \
\
\
*Gunakan Vps mempermudah pertuyulan*
