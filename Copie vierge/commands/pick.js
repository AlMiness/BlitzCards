const { SlashCommandBuilder } = require('@discordjs/builders');

const pickFunctions = require("../functions/secondLayerPickFunctions")

const apiDB = require("../functions/apiDB");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pick')
		.setDescription("Tirer la carte d'un joueur")
		.setDMPermission(false),
	async execute(interaction) {
		await interaction.deferReply();
		await apiDB.prepareUser(interaction.user.id, interaction.user.username)
		let tryPick = await pickFunctions.tryQuickPick(interaction.client, interaction.user)
		if(tryPick.picked){
			await interaction.editReply({ embeds: tryPick.embeds});
		}
		else{
			await interaction.editReply(`Il vous reste ${tryPick.timeLeft.toString()} avant de pouvoir à nouveau tirer une carte!`)
		}
	},
};