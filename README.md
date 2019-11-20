# Spectrumledger

![Spectrumledger](https://raw.githubusercontent.com/mrvautin/expressCart/master/public/images/logo.png)

`Spectrumledger ` is a music platform built in Node.js (Express, MongoDB) with ethereal

[**View the test server**](https://spectrumledger-stg.tk/)
[**View the live server**](https://spectrumledger.com/)


## Installation

1. Create a folder to hold your installation: `mkdir spectrumledger`
2. FTP/Copy the contents of the zip to your newly created folder
3. Enter folder: `cd spectrumledger `
4. Install dependencies: `npm install`
5. Start application: `node server.js`
6. Visit [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser

Keeping spectrumledger running after closing the terminal can be done in a few ways but we recommend using the `PM2` package. To set this up:

1. Install PM2: `npm install pm2 -g`
2. Add spectrumledger to PM2: `pm2 start production.js"`
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

MainNet: 'https://ropsten.infura.io/v3/9cfbe3fa8dd94ac3a3da71498a27ae1d',
LinkTestNet: 'https://ropsten.infura.io/v3/9cfbe3fa8dd94ac3a3da71498a27ae1d',

#please use these setting for main net

MainNet: 'https://mainnet.infura.io/v3/9cfbe3fa8dd94ac3a3da71498a27ae1d',
LinkTestNet: 'https://mainnet.infura.io/v3/9cfbe3fa8dd94ac3a3da71498a27ae1d',

## Database setting

Right now I'm using https://mlab.com

#setting for test db
'url': 'mongodb://dovu:2GEbAjCFtSAQuX9u@ds121203.mlab.com:21203/spectrumledger-dev'

#setting for live db 
'url': 'mongodb://dovu:2GEbAjCFtSAQuX9u@ds141872.mlab.com:41872/spectrumledger'

## Email settings

You will need to configure your SMTP details for spectrumledger to send email receipts to your customers.

You will need to consult your email provider for the relevant details.

##### Gmail settings

- `Email SMTP Host` = smtp.gmail.com
- `Email SMTP Port` = 465
- `Email SMTP secure` = True/Checked
- `Email SMTP Username` = example@gmail.com
- `Email SMTP Password` = yourpassword (you may need to setup an application specific password for this to work)

##### Zoho settings

- `Email SMTP Host` = smtp.zoho.com
- `Email SMTP Port` = 465
- `Email SMTP secure` = True/Checked
- `Email SMTP Username` = example@zoho.com
- `Email SMTP Password` = yourpassword

##### Outlook settings

- `Email SMTP Host` = smtp-mail.outlook.com
- `Email SMTP Port` = 587
- `Email SMTP secure` = False/Unchecked
- `Email SMTP Username` = example@outlook.com
- `Email SMTP Password` = yourpassword

You can use the `Send test email` button to ensure your email settings are correct.


