const { SlashCommandBuilder } = require('@discordjs/builders');
const apiDB = require("../functions/apiDB")

const cardFunctions = require("../functions/secondLayerCardFunctions")

module.exports = {  //update l'image d'une carte
    data: new SlashCommandBuilder()
        .setName("updatecardimage")
        .setDescription("update l'image d'une carte")
        .addIntegerOption(option => option.setName("cardid").setDescription("ID de la carte à update").setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        let cardID = interaction.options.getInteger("cardid").toString()
        if(!(await apiDB.isCardRegistered(cardID))){
            await interaction.editReply(`Carte introuvable`)
            return;
        }
        await cardFunctions.updateCardImageURL(interaction.client, cardID)
        await interaction.editReply({embeds:[await cardFunctions.getCardEmbed(interaction.client, cardID)]})
    },
};