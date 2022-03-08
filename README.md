# disclosure-bot
Simple Highly Configurable and Customizable Discord Bot with no bullsht involved. And it's on TypeScript

## Getting Started

### Requirements
- [Nodejs](https://nodejs.org/) LTS.
- `curl`
- `tar`

### Download Files
The first step in this process is to create the folder where the Bot will live and then move ourselves into that newly created folder. Below is an example of how to perform this operation.
```sh
mkdir disclosure-bot
cd disclosure-bot
```
Once you have created a new directory for the Bot and moved into it you'll need to download the Bot files.
This is as simple as using curl to download our pre-packaged content.
Once it is downloaded you'll need to unpack the archive.
Once it is unpacked you'll need to delete the archive for future updates.

```sh
curl -Lo disclosure-bot.tar.gz https://github.com/oadpoaw/disclosure-bot/releases/latest/download/disclosure-bot.tar.gz
tar -xzvf disclosure-bot.tar.gz
rm disclosure-bot.tar.gz
```

### Installation
Now that all of the files have been downloaded we need to configure some core aspects of the Bot.

```sh
# Only run the command below if you are installing this for
# the first time and do not have any data in the database.
# Simply run the command below and follow any prompts.
npm run env
```

### Starting
```sh
npm start
```

## Updating

Just run this and it will update everything including it's dependencies and it's code.
```sh
npm run update
```

> Just like that! and just restart your bot to apply the changes!

## License
[See here](LICENSE)