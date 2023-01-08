const { MessageEmbed, MessageAttachment } = require('discord.js');
const Canvas = require('canvas')
const path = require('path')

const apiDB = require("./apiDB");
const constants = require("../data/constants.js")


const getCardEmbed = async (clientBot, cardID) => {
    let card = await apiDB.getACardFromID(cardID)

	let creatorUser = card.creatorID == "" ? "None" : clientBot.users.fetch(card.creatorID)
	let ownerUser = card.ownerID == "" ? "None" : clientBot.users.fetch(card.ownerID)

	let cardEmbed = new MessageEmbed()
	.setColor(card.embedColor)
	.setTitle(`Carte numéro ${cardID}`)
	.setImage(card.imageURL)
    .addFields(/*
	{
		name: card.playerName.toString(),
		value: card.playerID.toString()
	},
	{
		name: card.rarity,
		value: card.rarityValue.toString()
	},*/
	{
		name: "Créateur :",
		value: ` ${await creatorUser}`,
		inline: true
	},
	{
		name: "Possesseur :",
		value: ` ${await ownerUser}`,
		inline: true
	},
	{
		name: `Status :`,
		value: card.locked ? "Locked" : "Unlocked",
		inline: true
	}
	)
    .setTimestamp()
    .setFooter({ text: `Carte crée le ${new Date(card.creationStamp).toLocaleDateString("fr-FR")}`});

    return cardEmbed
}

const generateCardImage = async (cardID) => {

	let card = await apiDB.getACardFromID(cardID)

	const cardCanvas = Canvas.createCanvas(812, 1224)
	const ctx = cardCanvas.getContext('2d')

	ctx.filter = 'invert(1.0)';

	const cardImage = await Canvas.loadImage(path.join(__dirname, `../imagesBases/${card.rarity}.png`))
	let x = 0
	let y = 0
	ctx.drawImage(cardImage, x, y)
	
	const player = await Canvas.loadImage(path.join(__dirname, `../playersImages/${card.playerData.playerName}.png`))
	x = cardCanvas.width / 2 - player.width / 2 - 17
	y = cardCanvas.height / 2 - player.height / 2 + 42
	ctx.drawImage(player, x, y)


	ctx.font = 'bold 50px sans-serif'
	ctx.fillStyle = constants.PLAYERNAMECOLORDICO[card.rarity]
	let pseudo = card.playerData.playerName.toUpperCase()
	x = 331 - ctx.measureText(pseudo).width /2 + 22
	ctx.fillText(pseudo, x, 180)
	if(card.rarity.toString() != constants.SPECIALNAME){
		ctx.font = '45px sans-serif'
		ctx.fillStyle = constants.CARDSTATSCOLORDICO[card.rarity]
		let rarityValueText = `${card.rarityValue.toString()}/${constants.MAXCARDVALUEOVERALL}`
		ctx.fillText(rarityValueText, 50, 1157)
		x = 740 - ctx.measureText(cardID.toString()).width - 10
		ctx.fillText(cardID.toString(), x, 1157)
	}


	const attachment = new MessageAttachment(cardCanvas.toBuffer())

	//constants.PLAYERNAMECOLORDICO[card.rarity]

	return attachment 
}


const updateCardImageURL = async (client, cardID) => {
	let storageChannel = await client.guilds.cache.get(client.imagesStorageGuildID).channels.fetch(client.imagesStorageChannelID)

	let cardImage = await generateCardImage(cardID)
	console.log("Image pour la carte " + cardID.toString() + " générée" + Date.now().toString())
	let message = await storageChannel.send({files: [cardImage]})
	console.log("message pour la carte " + cardID.toString() + " envoyé" + Date.now().toString())
	let imgUrl = message.attachments.first().url
    console.log("lien pour la carte " + cardID.toString() + " récupéré" + Date.now().toString())

	await apiDB.setCardImageURL(cardID, imgUrl)

}



module.exports = {
    getCardEmbed,
	generateCardImage,
	updateCardImageURL
};

