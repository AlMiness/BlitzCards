const { MessageEmbed } = require('discord.js');

const apiDB = require("./apiDB");
const constants = require("../data/constants.js")

const cardFunctions = require("../functions/secondLayerCardFunctions")
const transactionFunctions = require("../functions/secondLayerTransactionFunctions")

const tryQuickPick = async (client, user) => {

    let discordID = user.id
    let userDB = await apiDB.getAUserFromDiscordID(discordID)

    if(await isLateEnoughQuickPick(client, userDB)){

        await apiDB.updateQuickPickTime(discordID)
        let quickPickRes = await quickPick(client, discordID)
        await transactionFunctions.giveMoney(discordID, quickPickRes.givenMoney)
        return {picked:true, embeds: [await cardFunctions.getCardEmbed(client, quickPickRes.pickedCardID), transactionFunctions.getBalanceModificationEmbed(user, quickPickRes.givenMoney)]}

    }
    else{
        return {picked:false, timeLeft:msToTime(parseInt(userDB.lastQuickPick)+Math.trunc(constants.RANKIDTORANKQUICKPICKTIMEDICO[userDB.rankID]*client.quickPickTimeMultiplicator)-Date.now())}
    }
}

const makeBuyPick = async (client, user) => {
    
    let discordID = user.id
    await transactionFunctions.subMoney(discordID, constants.BUYPICKPRICE)

    let cardID = (await anyPick(client, constants.MINCARDVALUEBUYPICK, constants.MAXCARDVALUEBUYPICK, discordID)).newCardID

    return {embeds:[await cardFunctions.getCardEmbed(client, cardID), transactionFunctions.getBalanceModificationEmbed(user, -constants.BUYPICKPRICE)]}
}

const makePickFor = async (client, discordID) => {

    discordID = discordID.toString()
    let quickPickRes = await quickPick(client, discordID)
    await transactionFunctions.giveMoney(discordID, quickPickRes.givenMoney)
    return {picked:true, embeds: [await cardFunctions.getCardEmbed(client, quickPickRes.pickedCardID), transactionFunctions.getBalanceModificationEmbed(await client.users.fetch(discordID), quickPickRes.givenMoney)]}
}


const quickPick = async (client, discordID) => {

    let anyPickRes = await anyPick(client, constants.MINCARDVALUEQUICKPICK, constants.MAXCARDVALUEQUICKPICK, discordID)

    let card = await apiDB.getACardFromID(anyPickRes.newCardID)

    let givenMoney

    if(card.rarity == constants.GLITCHEDNAME){
        givenMoney =  Math.floor(Math.random()*(1+constants.BASEMAXMONEYGLITCHED-constants.BASEMINMONEYGLITCHED))+constants.BASEMINMONEYGLITCHED
    }
    else{
        givenMoney = anyPickRes.wasAlreadyPicked ? constants.BASEMONEYLOOTTABLE[card.rarity]/2 : constants.BASEMONEYLOOTTABLE[card.rarity]
    }

    return {pickedCardID:anyPickRes.newCardID, givenMoney:givenMoney}
}

const isLateEnoughQuickPick = async (client, userDB) => { //required time en ms
    return parseInt(userDB.lastQuickPick) + Math.trunc(constants.RANKIDTORANKQUICKPICKTIMEDICO[userDB.rankID] * client.quickPickTimeMultiplicator) < Date.now() ? true : false
}

const msToTime = (duration) => { //volé de https://stackoverflow.com/questions/19700283/how-to-convert-time-in-milliseconds-to-hours-min-sec-format-in-javascript
    var milliseconds = Math.floor((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}



const cardChooser = async (minValue, maxValue) => {

    let rarityValue = Math.floor(Math.random()*(1+maxValue-minValue))+minValue

    let playerNumber = await apiDB.getLastPickablePlayerID()

    let randomPlayerID = Math.floor(Math.random()*(playerNumber))+1

    let rarity = getRarityFromRarityValue(rarityValue);

    return {playerID:randomPlayerID, rarity:rarity, rarityValue:rarityValue}
}


const getRarityFromRarityValue = (rarityValue) => {

    let rarity;

    switch (true){
        case(rarityValue==constants.PERFECTVALUE):
            rarity=constants.PERFECTNAME;
            break;
        case(rarityValue>=constants.MINVALUEFORLEG):
            rarity=constants.LEGNAME;
            break;
        case(rarityValue>=constants.MINVALUEFOREPIC):
            rarity=constants.EPICNAME;
            break;
        case(rarityValue>=constants.MINVALUEFORRARE):
            rarity=constants.RARENAME;
            break;
        case(rarityValue>=constants.MINVALUEFORCOMMON):
            rarity=constants.COMMONNAME;
            break;
        default:
        rarity=constants.GLITCHEDNAME;
    };
    return rarity
}


const anyPick = async (client, minValue, maxValue, creatorID) => {
    console.log("Creating card...")
    let cardInfos = await cardChooser(minValue, maxValue)
    let wasAlreadyPicked =  await apiDB.isCardAlreadyPickedByUser(creatorID, cardInfos.playerID, cardInfos.rarity)
    let newCardID = await apiDB.createACard(cardInfos.playerID, cardInfos.rarity, cardInfos.rarityValue, creatorID)
    console.log("Carte " + newCardID.toString() + " crée " + Date.now().toString())
    await apiDB.changeCardOwnership(newCardID, creatorID)
    await cardFunctions.updateCardImageURL(client, newCardID)
    return {newCardID:newCardID, wasAlreadyPicked:wasAlreadyPicked}
}

const tryDaily = async (user) => {
    let discordID = user.id
    let userDB = await apiDB.getAUserFromDiscordID(discordID)

    if(await isLateEnoughDaily(userDB)){

        await apiDB.updateSlowPickTime(discordID)
        let givenMoney = await daily(discordID)
        return {picked:true, embeds: [transactionFunctions.getBalanceModificationEmbed(user, givenMoney)]}

    }
    else{
        return {picked:false}
        //return {picked:false, timeLeft:msToTime(parseInt(userDB.lastDailyPick)+constants.TIMEBETWEENSLOWPICK-Date.now())}
    }
}

const isLateEnoughDaily = async (userDB) => { //required time en ms

    return !(new Date().setHours(0,0,0,0) == new Date(parseInt(userDB.lastDailyPick)).setHours(0,0,0,0))

    return parseInt(userDB.lastDailyPick) + constants.TIMEBETWEENSLOWPICK < Date.now() ? true : false
}

const daily = async (discordID) => {
    let givenMoney = dailyGivenValue(Math.random()*constants.DAILYRANDOMMULTIPLICATOR)
    await transactionFunctions.giveMoney(discordID, givenMoney)
    return givenMoney
}


const dailyGivenValue = (randomNumber) => {
    return Math.trunc(Math.exp(randomNumber/50+2)/100 + randomNumber/10 + 25)
}


const getNotEnoughMoneyToBuyPickEmbed = (user) => {
    return new MessageEmbed()
    .setColor('#D72306')
    .setTitle(`Erreur lors de l'achat du buypick`)
    .setThumbnail(`${user.displayAvatarURL()}`)
    .addFields({ name: "L'achat du buypick n'a pas pu être effectué", value: `Vous n'avez pas assez d'argent (prix : ${constants.BUYPICKPRICE.toString()}$)` })
    .setTimestamp()
    .setFooter({ text: `Fun fact : Vous êtes pauvre!`});
}











//BULK PICK

/*
  //POUR TIRER DE MULTIPLES CARTES EN UN /PICK
    //ATTENTION CA FAIT CRASH LE BOT

const anyPick = async (client, minValue, maxValue, creatorID) => {
    let cardGeneratedNumber = 10
    for(let i =0; i<cardGeneratedNumber; i++){
        let cardInfos = await cardChooser(minValue, maxValue)
        let newCardID = await apiDB.createACard(DB, cardInfos.playerID, cardInfos.name, cardInfos.rarity, cardInfos.rarityValue, creatorID, creatorID)

        await apiDB.addCardToUser(DB, creatorID, newCardID)
        let wasAlreadyPicked = await apiDB.addCardToAlreadyPicked(DB, creatorID, cardInfos.playerID, cardInfos.rarity)
        await cardFunctions.updateCardImageURL(client, newCardID)
    }
    console.log(cardGeneratedNumber.toString() + " ont été générées pour " + creatorID.toString())
    let cardInfos = await cardChooser(minValue, maxValue)
    let newCardID = await apiDB.createACard(DB, cardInfos.playerID, cardInfos.name, cardInfos.rarity, cardInfos.rarityValue, creatorID, creatorID)
    await apiDB.addCardToUser(DB, creatorID, newCardID)
    await cardFunctions.updateCardImageURL(client, newCardID)
    let wasAlreadyPicked = await apiDB.addCardToAlreadyPicked(DB, creatorID, cardInfos.playerID, cardInfos.rarity)
    return {newCardID:newCardID, wasAlreadyPicked:wasAlreadyPicked}
}

*/


module.exports = {
    tryQuickPick,
    makeBuyPick,
    makePickFor,
    getNotEnoughMoneyToBuyPickEmbed,
    tryDaily,
    getRarityFromRarityValue
};