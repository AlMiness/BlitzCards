const { SlashCommandBuilder } = require('@discordjs/builders');

const apiDB = require("../functions/apiDB")

const collectionFunctions = require("../functions/secondLayerCollectionFunctions")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("collection")
        .setDescription("Afficher la collection d'un utilisateur")
        .addUserOption(option => option.setName("user").setDescription("The user"))
        .setDMPermission(false),
    async execute(interaction) {
        const userRequested = interaction.options.getUser("user", false) == null ? interaction.user : interaction.options.getUser("user", false)
        await apiDB.prepareUser(userRequested.id.toString(), userRequested.username)

        let userCollection = await collectionFunctions.getCollectionOfAUser(userRequested.id)

        let collectionEmbed = await collectionFunctions.getCollectionEmbed(userCollection, 1, userRequested.username)

        let buttonRows = await collectionFunctions.getSwitchPagesButtons(interaction.client, interaction, 1, userCollection, userRequested)

        await interaction.reply({ embeds: [collectionEmbed],  components: [buttonRows]})
    },
};