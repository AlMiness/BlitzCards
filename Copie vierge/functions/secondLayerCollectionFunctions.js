const { MessageEmbed } = require('discord.js');
const { MessageActionRow, MessageButton } = require('discord.js');

const constants = require("../data/constants.js")
const apiDB = require("./apiDB");
const buttonCenter = require("../functions/buttonCenter")
const utilsFunctions = require("../functions/utilsFunctions")



const getCollectionEmbed = async (userCollection, currentPage, username) => {


    let keysNumber = Object.keys(userCollection).length
    let totalPageNumber = keysNumber%constants.PLAYERSPERCOLLECTIONPAGE != 0 ? parseInt(keysNumber/constants.PLAYERSPERCOLLECTIONPAGE) + 1 : parseInt(keysNumber/constants.PLAYERSPERCOLLECTIONPAGE)

    if(currentPage > totalPageNumber) return

	let playerDataList = []

	for(let playerID = constants.PLAYERSPERCOLLECTIONPAGE*(currentPage-1)+1; playerID<(currentPage == totalPageNumber ? keysNumber+1 : (constants.PLAYERSPERCOLLECTIONPAGE*(currentPage-1)+1+constants.PLAYERSPERCOLLECTIONPAGE)); playerID++){
		playerDataList.push(apiDB.getPlayerDataFromID(playerID))
	}

	let playerFieldValue = (await playerDataList[0]).playerName

    let collectionFieldValue = `${userCollection[(await playerDataList[0]).playerID][constants.GLITCHEDNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[0]).playerID][constants.COMMONNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[0]).playerID][constants.RARENAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[0]).playerID][constants.EPICNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[0]).playerID][constants.LEGNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[0]).playerID][constants.PERFECTNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}`

	for(let playerIDindex = 1; playerIDindex<playerDataList.length; playerIDindex++){
		playerFieldValue = playerFieldValue + `\n${(await playerDataList[playerIDindex]).playerName}`
        collectionFieldValue = collectionFieldValue + `\n${userCollection[(await playerDataList[playerIDindex]).playerID][constants.GLITCHEDNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[playerIDindex]).playerID][constants.COMMONNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[playerIDindex]).playerID][constants.RARENAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[playerIDindex]).playerID][constants.EPICNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[playerIDindex]).playerID][constants.LEGNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}${userCollection[(await playerDataList[playerIDindex]).playerID][constants.PERFECTNAME] ? constants.HASPLAYERCHR : constants.HASNTPLAYERCHR}`
	}

    return new MessageEmbed()
    .setColor('#D72306')
    .setTitle(`Collection de ${username}`)
    .addFields({ name: 'Joueurs :', value: playerFieldValue, inline:true}, { name: 'G | C | R | E | L | P :', value: collectionFieldValue, inline:true})

    .setTimestamp()
    .setFooter({ text: `Page ${currentPage.toString()} sur ${totalPageNumber.toString()}`});
}

const getCollectionStatsEmbed = async (userCollectionStats, user) => {

    let cardsNumberValue = `${constants.GLITCHEDNAME} : ${userCollectionStats[constants.GLITCHEDNAME]}\n${constants.COMMONNAME} : ${userCollectionStats[constants.COMMONNAME]}\n${constants.RARENAME} : ${userCollectionStats[constants.RARENAME]}\n${constants.EPICNAME} : ${userCollectionStats[constants.EPICNAME]}\n${constants.LEGNAME} : ${userCollectionStats[constants.LEGNAME]}\n${constants.PERFECTNAME} : ${userCollectionStats[constants.PERFECTNAME]}`



    return new MessageEmbed()
    .setColor('#D72306')
    .setTitle(`Statistiques de collection de ${user.username}`)
    .setThumbnail(`${user.displayAvatarURL()}`)
    .addFields({ name: 'Nombre de cartes pour chaque rareté :', value: cardsNumberValue, inline:true})

    .setTimestamp()
    .setFooter({ text: `Funfact : ça me fait chier de coder cette merde`});
}

const getSwitchPagesButtons = async (client, interaction, currentPage, userCollection, requestedUser) => {
    let buttonGroupID = await buttonCenter.registerAButtonGroup(client, expirationFunction, interaction, {})

	let nextPageButtonID = await buttonCenter.registerAButton(client, "NextPageCollection", buttonGroupID, nextPageFunction, {userCollection:userCollection, currentPage:currentPage, requestedUser:requestedUser}, false, [interaction.user.id])

	let previousPageButton = await buttonCenter.registerAButton(client, "PreviousPageCollection", buttonGroupID, preivousPageFunction, {userCollection:userCollection, currentPage:currentPage, requestedUser:requestedUser}, false, [interaction.user.id])

	let buttonRows = new MessageActionRow()
	.addComponents(
		new MessageButton()
		.setCustomId(previousPageButton)
		.setLabel("")
		.setStyle('PRIMARY')
        .setEmoji("⬅️"),

		new MessageButton()
			.setCustomId(nextPageButtonID)
			.setLabel("")
			.setStyle('PRIMARY')
            .setEmoji("➡️"),
	);

    if(currentPage == 1){
        buttonRows.components[0].setDisabled(true)
    }
    let keysNumber = Object.keys(userCollection).length
    if(currentPage == (keysNumber%constants.PLAYERSPERCOLLECTIONPAGE != 0 ? parseInt(keysNumber/constants.PLAYERSPERCOLLECTIONPAGE) + 1 : parseInt(keysNumber/constants.PLAYERSPERCOLLECTIONPAGE))){
        buttonRows.components[1].setDisabled(true)
    }

	return buttonRows
}


const expirationFunction = async (client, genesisInteraction, customDataDictionary) => {
    //rien je suppose...
}

const nextPageFunction = async (client, currentInteraction, genesisInteraction, customDataDictionary) => {
    let buttonRows = await getSwitchPagesButtons(client, genesisInteraction, customDataDictionary.currentPage + 1, customDataDictionary.userCollection, customDataDictionary.requestedUser)
    await genesisInteraction.editReply({embeds:[await getCollectionEmbed(customDataDictionary.userCollection, customDataDictionary.currentPage + 1, customDataDictionary.requestedUser.username)], components:[buttonRows]})
    currentInteraction.deferUpdate()
}

const preivousPageFunction = async (client, currentInteraction, genesisInteraction, customDataDictionary) => {
    let buttonRows = await getSwitchPagesButtons(client, genesisInteraction, customDataDictionary.currentPage - 1, customDataDictionary.userCollection, customDataDictionary.requestedUser)
    await genesisInteraction.editReply({embeds:[await getCollectionEmbed(customDataDictionary.userCollection, customDataDictionary.currentPage - 1, customDataDictionary.requestedUser.username)], components:[buttonRows]})
    currentInteraction.deferUpdate()
}


const getCollectionOfAUser = async (discordID) => {
	let userCollection = await getEmptyCollection()
	let distinctCardsList = await apiDB.getDistinctPlayerIDAndRarityInUserInventory(discordID)
	return fillCardsCollection(userCollection, distinctCardsList)
}

const fillCardsCollection = (collection, distinctCardsList) => {
    distinctCardsList.forEach((cardData) => {
        collection[cardData.playerID][cardData.rarity] = true
    })
    return collection
}


const getEmptyCollection = async () => {
    let collection = {}
    let lastPickablePlayerID = await apiDB.getLastPickablePlayerID()

    for(let playerID = 1; playerID<lastPickablePlayerID+1; playerID++){
        collection[playerID] = {}
    }

    return collection
}

const getEachRarityCardsNumbers = async (discordID) => {

    let distinctCardsList = await apiDB.getDistinctPlayerIDAndRarityInUserInventory(discordID)

    let collectionStats = {}

    collectionStats[constants.GLITCHEDNAME] = 0
    collectionStats[constants.COMMONNAME] = 0
    collectionStats[constants.RARENAME] = 0
    collectionStats[constants.EPICNAME] = 0
    collectionStats[constants.LEGNAME] = 0
    collectionStats[constants.PERFECTNAME] = 0

    for (let index = 0; index < distinctCardsList.length; index++) {
        collectionStats[distinctCardsList[index].rarity]++
    }

    return collectionStats

}

module.exports = {
	getCollectionOfAUser,
    getCollectionEmbed,
    getSwitchPagesButtons,
    getEachRarityCardsNumbers,
    getCollectionStatsEmbed
};