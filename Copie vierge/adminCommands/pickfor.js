const { SlashCommandBuilder } = require('@discordjs/builders');
const apiDB = require("../functions/apiDB")

const pickFunctions = require("../functions/secondLayerPickFunctions")



module.exports = {  //effectue un pick pour un utilisateur; n'intéragis JAMAIS avec le cooldown du /pick; donne l'argent et la carte comme un /pick
    data: new SlashCommandBuilder()
        .setName("pickfor")
        .setDescription("pick une carte pour un utilisateur")
        .addStringOption(option => option.setName("discordid").setDescription("L'id discord de l'utilisateur").setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        let requestedUserID = interaction.options.getString("discordid")

        await apiDB.prepareUser(requestedUserID)

        let pickForRes = await pickFunctions.makePickFor(interaction.client, requestedUserID)

        await interaction.editReply({embeds:pickForRes.embeds})
    },
};