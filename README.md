# ledger.easternblu.com

![ledger.easternblu.com](http://ledger.easternblu.com/images/music-1573043801114-6636.jpg)

`ledger.easternblu.com ` is a music platform built in Node.js (Express, MongoDB) with Algorand

[**View the test server**](http://ledger.easternblu.com)

There are few files can be checked algorand code:
1. /backend/song.js
2. /backend/royalty.js
3. /backend/verify.js
4. /backend/license.js
5. /backend/deploy-cronjob.js

## Installation

1. Create a folder to hold your installation: `mkdir easternblu`
2. FTP/Copy the contents of the zip to your newly created folder
3. Enter folder: `cd easternblu `
4. Install dependencies: `npm install`
5. Start application: `node server.js`
6. Visit [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser

Keeping easternblu running after closing the terminal can be done in a few ways but we recommend using the `PM2` package. To set this up:

1. Install PM2: `npm install pm2 -g`
2. Add easternblu to PM2: `pm2 start production.js"`
3. Check PM2 has our app: `pm2 list`
4. Save the PM2 config: `pm2 save`
5. To start/stop: `pm2 start production.js ` / `pm2 stop production.js `

> Note: Node.js version 7.x or greater is needed.

## Admin

In .env file please set account id that will be admin(ADMIN_ID=?)

Visit: [http://127.0.0.1:3000/](http://127.0.0.1:3000/)

Admin can allow user create wallet and manage by them or system will manage it.

## Configuration settings

#please use these setting for test net

MainNet: 'https://mainnet-algorand.api.purestake.io/ps1',
LinkTestNet: 'https://testnet-algorand.api.purestake.io/ps1,',

## Database setting

Right now I'm using mogodb

#setting for test db
'url': ''

## Email settings

You will need to configure your SMTP details for easternblu to send email receipts to your customers.

You will need to consult your email provider for the relevant details.



