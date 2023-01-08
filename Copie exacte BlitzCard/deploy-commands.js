const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, guildIdAdmin, token } = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}


const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');


		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();


const commandsAdmin = [];
const commandsPathAdmin = path.join(__dirname, 'adminCommands');
const commandFilesAdmin = fs.readdirSync(commandsPathAdmin).filter(file => file.endsWith('.js'));

for (const file of commandFilesAdmin) {
	const filePath = path.join(commandsPathAdmin, file);
	const command = require(filePath);
	commandsAdmin.push(command.data.toJSON());
}

const restAdmin = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) admin commands.');

		await restAdmin.put(
			Routes.applicationGuildCommands(clientId, guildIdAdmin),
			{ body: commandsAdmin },
		);

		console.log('Successfully reloaded application (/) admin commands.');
	} catch (error) {
		console.error(error);
	}
})();









/*
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
*/