const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('master')
		.setDescription("OwO")
		.setDMPermission(false),
	async execute(interaction) {
        interaction.reply("`Welcome back goshujin sama \*-\*`")
	},
};