const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Intents } = require('discord.js');
const { token, imagesStorageGuildID, imagesStorageChannelID } = require('./config.json');

const buttonCenter = require("./functions/buttonCenter");

const logFilePath = "./logs.txt"

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });


client.commands = new Collection();

client.buttonsDictionary = {}
client.buttonGroupsDictionary = {}
client.blockBot = false
client.quickPickTimeMultiplicator = 1.00
client.imagesStorageGuildID = imagesStorageGuildID
client.imagesStorageChannelID = imagesStorageChannelID

client.once('ready', () => {
	console.log('Ready!');
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	//console.log(command.permissions)
	client.commands.set(command.data.name, command);
	//console.log(client.commands["testadmin"])
}

const commandsPathAdmin = path.join(__dirname, 'adminCommands');
const commandFilesAdmin = fs.readdirSync(commandsPathAdmin).filter(file => file.endsWith('.js'));

for (const file of commandFilesAdmin) {
	const filePath = path.join(commandsPathAdmin, file);
	const command = require(filePath);
	//console.log(command.permissions)
	client.commands.set(command.data.name, command);
	//console.log(client.commands["testadmin"])
}


/*

client.commands.get("testadmin").defaultPermission = false

console.log(client.commands.get("testadmin"))

console.log(client.commands.get("testadmin").defaultPermission);


(async () => {

	var testo = client.guilds.cache.get('909489514991460433');
	console.log(testo)
	console.log("aaaa")
})();



*/

client.on('interactionCreate', async interaction => {

	if(interaction.isButton()){
		if(client.blockBot){
			interaction.deferUpdate()
			return;
		}
		buttonCenter.buttonRedirector(client, interaction)
	}

	//var testo = client.guilds.cache.get('909489514991460433');
	//console.log(testo.commands[0])

	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	try {
		fs.writeFile(logFilePath, "\n" + interaction.commandName.toString() + " from " + interaction.user.username + " " + interaction.user.id.toString() + "\n" + JSON.stringify(interaction.options._hoistedOptions), { flag: 'a+' }, function (err) {
			if (err){
				console.log(err);
				console.log('Error writting logs for command');
			} 
		});
	} catch (error) {
		console.log("Error writting logs for command SECOND PROTECT LAYER")
	}

	let startingDate = Date.now()
	console.log(interaction.commandName.toString() + " from " + interaction.user.username + " " + interaction.user.id.toString() + " -- at " + Date.now().toString())
	console.log(interaction.options._hoistedOptions)


	if (!command) return;

	if(client.blockBot&&interaction.commandName != "blockbot"){
		interaction.reply("Le bot est actuellement en maintenance, merci de votre patience :)")
		return;
	}

	try {
		await command.execute(interaction);
        console.log(interaction.commandName.toString() + " from " + interaction.user.username + " " + interaction.user.id.toString() + " -- ENDED at " + Date.now().toString() + " -- it took " + (Date.now()-startingDate).toString() + "ms")
	} catch (error) {

		try {
			fs.writeFile(logFilePath, `CRITICAL ERROR! CAUSE : ${interaction.commandName?.toString()} FROM ${interaction.user.id.toString()}` + "\n" + error.toString(), { flag: 'a+' } ,function (err) {
				if (err){
					console.log(err);
					console.log('Error writting logs for an error');
				}
			});
		} catch (error) {
			console.log("Error writting logs for an error SECOND PROTECT LAYER")
		}

		console.log(`CRITICAL ERROR! CAUSE : ${interaction.commandName?.toString()} FROM ${interaction.user.id.toString()}`)
		console.error(error);
		return;
		//await interaction.reply({ content: "Erreur lors de l'execution de la commande", ephemeral: true });
	}
});



client.login(token);