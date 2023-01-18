const constants = require("../data/constants.js")
const path = require('node:path');

const SQP = require("../functions/sqlite3-promisify");


const dbpath = path.join(__dirname, '../data/blitzcordDB.db');


const DB = new SQP(dbpath)

const usersDataTB = "usersData"
const cardsDataTB = "cardsData"
const otherTB = "other"
const playersDataTB = "playersData"
const sqliteSequence = "sqlite_sequence"


//cards managements<

const createACard = async (playerID, rarity, rarityValue, creatorID) => {
    let createACardQuery = `INSERT INTO ${cardsDataTB} (playerID, rarityValue, rarity, creatorID, creationStamp, ownerID, lastOwnerChangeStamp, imageURL, embedColor, locked, userLocked) VALUES(?,?,?,?,?,?,?,?,?,?,?)`
    await DB.run(createACardQuery, [playerID, rarityValue, rarity, creatorID, Date.now(), creatorID, Date.now(), constants.DEFAULTCARDIMAGEURL, constants.DEFAULTCARDEMBEDCOLOR, 0, 0])
    let requestLastCardQuery = `SELECT seq FROM ${sqliteSequence} WHERE name='cardsData'`
    return (await DB.get(requestLastCardQuery)).seq
}


const isCardRegistered = async (cardID) => {
    let isCardRegisteredQuery = `SELECT cardID FROM ${cardsDataTB} WHERE cardID=${cardID.toString()}`
    return await DB.get(isCardRegisteredQuery) ? true : false
}

const getACardFromID = async (cardID) => {
    let getCardQuery = `SELECT * FROM ${cardsDataTB} WHERE cardID=${cardID.toString()}`

    let resp = await DB.get(getCardQuery)
    resp.playerData = await getPlayerDataFromID(resp.playerID)
    return resp
}

const getOwnerOfACard = async (cardID) => {
    let getOwnerOfACardQuery = `SELECT ownerID FROM ${cardsDataTB} WHERE cardID=${cardID.toString()}`
    return (await DB.get(getOwnerOfACardQuery)).ownerID
}

const setCardImageURL = async (cardID, imageURL) => {
    let setCardImageURLQuery = `UPDATE ${cardsDataTB} SET 'imageURL' = '${imageURL}' WHERE cardID=${cardID.toString()}`
    await DB.run(setCardImageURLQuery)
}

const changeCardOwnership = async (cardID, newOwnerID) => {
    await setCardOwnerID(cardID, newOwnerID)
    await updateLastCardOwnerChangeTime(cardID)
}

const bulkChangeCardOwnership = async (cardsIDList, newOwnerID) => {

    if(!cardsIDList.length) return;

    let bulkChangeCardOwnershipQuery = `UPDATE ${cardsDataTB} SET 'ownerID' = ${newOwnerID},  'lastOwnerChangeStamp' = ${Date.now().toString()} WHERE cardID=${cardsIDList[0]}`

    for(let cardIndex = 1; cardIndex<cardsIDList.length; cardIndex++){
        bulkChangeCardOwnershipQuery = bulkChangeCardOwnershipQuery + ` OR cardID=${cardsIDList[cardIndex]}`
    }

    await DB.run(bulkChangeCardOwnershipQuery)
}

const setCardOwnerID = async (cardID, newOwnerID) => {
    let setCardOwnerIDQuery = `UPDATE ${cardsDataTB} SET 'ownerID' = ${newOwnerID} WHERE cardID=${cardID.toString()}`
    await DB.run(setCardOwnerIDQuery)
}

const updateLastCardOwnerChangeTime = async (cardID) => {
    let updateLastCardOwnerChangeTimeQuery = `UPDATE ${cardsDataTB} SET 'lastOwnerChangeStamp' = ${Date.now().toString()} WHERE cardID=${cardID.toString()}`
    await DB.run(updateLastCardOwnerChangeTimeQuery)
}

const doesUserOwnThisCard = async (cardID, discordID) => {
    let doesUserOwnThisCardQuery = `SELECT cardID FROM ${cardsDataTB} WHERE cardID=${cardID.toString()} AND ownerID=${discordID}`
    return (await DB.get(doesUserOwnThisCardQuery)) ? true : false
}

const lockACard = async (cardID) => {
    let lockACardQuery = `UPDATE ${cardsDataTB} SET 'locked' = 1 WHERE cardID=${cardID.toString()}`
    await DB.run(lockACardQuery)
}

const bulkLock = async (cardsIDList) => {

    if(!cardsIDList.length) return;

    let bulkLockQuery = `UPDATE cardsData SET 'locked' = 1 WHERE cardID=${cardsIDList[0]}`

    for(let cardIndex = 1; cardIndex<cardsIDList.length; cardIndex++){
        bulkLockQuery = bulkLockQuery + ` OR cardID=${cardsIDList[cardIndex]}`
    }

    await DB.run(bulkLockQuery)
}

const unlockACard = async (cardID) => {
    let unlockACardQuery = `UPDATE ${cardsDataTB} SET 'locked' = 0 WHERE cardID=${cardID.toString()}`
    await DB.run(unlockACardQuery)
}

const bulkUnlock = async (cardsIDList) => {

    if(!cardsIDList.length) return;

    let bulkUnlockQuery = `UPDATE cardsData SET 'locked' = 0 WHERE cardID=${cardsIDList[0]}`

    for(let cardIndex = 1; cardIndex<cardsIDList.length; cardIndex++){
        bulkUnlockQuery = bulkUnlockQuery + ` OR cardID=${cardsIDList[cardIndex]}`
    }

    await DB.run(bulkUnlockQuery)
}

const isACardLocked = async (cardID) => {
    let isACardLockedQuery = `SELECT locked FROM ${cardsDataTB} WHERE cardID=${cardID.toString()}`
    return (await DB.get(isACardLockedQuery)).locked ? true : false
}

const bulkIsACardLocked = async (cardsIDList) => { //renvoie true si au moins une des cartes est lock
    if(!cardsIDList.length) return false

    let bulkIsACardLockedQuery = `SELECT locked FROM ${cardsDataTB} WHERE cardID=${cardsIDList[0]}`

    for(let cardIndex = 1; cardIndex<cardsIDList.length; cardIndex++){
        bulkIsACardLockedQuery = bulkIsACardLockedQuery + ` OR cardID=${cardsIDList[cardIndex]}`
    }

    let DBresp = await DB.all(bulkIsACardLockedQuery)

    for(let respIndex = 0; respIndex<DBresp.length; respIndex++){
        if(DBresp[respIndex].locked) return true
    }
    return false
}

const setCardEmbedColorCode = async (cardID, colorCode) => {
    let setCardEmbedColorCodeQuery = `UPDATE ${cardsDataTB} SET 'embedColor' = '${colorCode}' WHERE cardID=${cardID.toString()}`
    await DB.run(setCardEmbedColorCodeQuery)
}

const getCardsIDListHUB = async (args={ownerID:false, creatorID:false, excludedUserID:false, playerID:false, rarity:false, includesSold:false, filter:"lastCardOwnerChangeTime", ascendant:true}) => {   //centre de recherche de cartes dans la DB


    let baseQuery = `SELECT cardID FROM ${cardsDataTB}`

    let isThereAWhere = false
    if(args.ownerID){
        if(args.ownerID==constants.CLIENTID) args.includesSold = true
        if(args.ownerID==args.excludedUserID) args.excludedUserID = false
        baseQuery = isThereAWhere ? baseQuery + ` AND ownerID='${args.ownerID.toString()}'` : baseQuery + ` WHERE ownerID='${args.ownerID.toString()}'`
        isThereAWhere = true
    }

    if(args.creatorID){
        baseQuery = isThereAWhere ? baseQuery + ` AND creatorID='${args.creatorID.toString()}'` : baseQuery + ` WHERE creatorID='${args.creatorID.toString()}'`
        isThereAWhere = true
    }

    if(args.excludedUserID){
        baseQuery = isThereAWhere ? baseQuery + ` AND ownerID <> '${args.excludedUserID.toString()}'` : baseQuery + ` WHERE ownerID <> '${args.excludedUserID.toString()}'`
        isThereAWhere = true
    }

    if(args.playerID){
        baseQuery = isThereAWhere ? baseQuery + ` AND playerID=${args.playerID}` : baseQuery + ` WHERE playerID=${args.playerID}`
        isThereAWhere = true
    }

    if(args?.rarity){
        baseQuery = isThereAWhere ? baseQuery + ` AND rarity='${args.rarity}'` : baseQuery + ` WHERE rarity='${args.rarity}'`
        isThereAWhere = true
    }

    if(!args.includesSold){
        baseQuery = isThereAWhere ? baseQuery + ` AND ownerID <> '${constants.CLIENTID}'` : baseQuery + ` WHERE ownerID <> '${constants.CLIENTID}'`
        isThereAWhere = true
    }

    switch (args.filter?.toUpperCase()) {
        case "PLAYERID":
            baseQuery = baseQuery + ` ORDER BY playerID`
            break;
        case "CARDID":
            baseQuery = baseQuery + ` ORDER BY cardID`
            break;
        case "RARITY":
            baseQuery = baseQuery + ` ORDER BY rarityValue`
            break;
        default:
            baseQuery = baseQuery + ` ORDER BY lastOwnerChangeStamp`
            break;
    }

    if(!args.ascendant) baseQuery = baseQuery + ` DESC`


    let respDB = await DB.all(baseQuery)
    let cardsIDList = []
    for(let respIndex = 0; respIndex<respDB.length; respIndex++){
        cardsIDList.push(respDB[respIndex].cardID)
    }
    return cardsIDList
}

const getDistinctPlayerIDAndRarityInUserInventory = async (discordID) => {
    let getDistinctPlayerIDAndRarityInUserInventoryQuery = `SELECT DISTINCT playerID, rarity from ${cardsDataTB} where ownerID=${discordID.toString()}`
    return await DB.all(getDistinctPlayerIDAndRarityInUserInventoryQuery)
}

const getPickedCardsNumberOfAUser = async (discordID) => {
    let getPickedCardNumberOfAUserQuery = `SELECT cardID FROM ${cardsDataTB} WHERE creatorID=${discordID.toString()}`
    return (await DB.all(getPickedCardNumberOfAUserQuery)).length
}

const getOwnedCardsNumberOfAUser = async (discordID) => {
    let getOwnedCardsNumberOfAUserQuery = `SELECT cardID FROM ${cardsDataTB} WHERE ownerID=${discordID.toString()}`
    return (await DB.all(getOwnedCardsNumberOfAUserQuery)).length
}

const editACard = async (cardID, args={rarityValue:false, rarity:false, playerID:false}) => {

    let editACardQuery = `UPDATE ${cardsDataTB}` + (!(args.rarityValue===false) || (!(args.rarity===false) || !(args.playerID===false)) ? ` SET ` : ``) + (!(args.rarityValue===false) ? `'rarityValue' = ${args.rarityValue}` : ``) + (!(args.rarityValue===false) && (!(args.rarity===false) || !(args.playerID===false)) ? `,` : ``) + (!(args.rarity===false) ? `'rarity' = '${args.rarity}'` : ``) + (!(args.rarity===false) && !(args.playerID===false) ? `,` : ``) + (!(args.playerID===false) ? `'playerID' = ${args.playerID}` : ``) + ` WHERE cardID=${cardID}`

    await DB.run(editACardQuery)
}


//>cards managements






//playersNames<

const getPlayerDataFromID = async (playerID) => {
    let getPlayerDataFromIDQuery = `SELECT * FROM ${playersDataTB} WHERE playerID=${playerID.toString()}`
    return await DB.get(getPlayerDataFromIDQuery)
}

//>playersNames



//money managements<

const addMoneyToUser = async (discordID, amount) => {
    let addMoneyToUserQuery = `UPDATE ${usersDataTB} SET 'money' = money + ${amount} WHERE discordID = '${discordID.toString()}'`
    await DB.run(addMoneyToUserQuery)
}

const subMoneyToUser = async (discordID, amount) => {
    let subMoneyToUserQuery = `UPDATE ${usersDataTB} SET 'money' = money - ${amount} WHERE discordID = '${discordID.toString()}'`
    await DB.run(subMoneyToUserQuery)
}

const setMoneyForUser = async (discordID, money) => {
    let setMoneyForUserQuery = `UPDATE ${usersDataTB} SET 'money' = ${money} WHERE discordID = '${discordID.toString()}'`
    await DB.run(setMoneyForUserQuery)
}

const getMoneyOfUser = async (discordID) => {
    let getMoneyOfUserQuery = `SELECT money FROM ${usersDataTB} WHERE discordID='${discordID}'`
    return (await DB.get(getMoneyOfUserQuery)).money
}

const hasEnoughMoney = async (discordID, amount) => {
    return amount <= await getMoneyOfUser(discordID)
}

const getBaltopRowsList = async() => {
    let getBaltopRowsListQuery = `SELECT name, money FROM ${usersDataTB} ORDER BY money DESC`
    return await DB.all(getBaltopRowsListQuery)
}

//>money managements


//cardPoints managements<

const addPointsToUser = async (discordID, amount) => {
    let addPointsToUserQuery = `UPDATE ${usersDataTB} SET 'cardPoints' = cardPoints + ${amount} WHERE discordID = '${discordID.toString()}'`
    await DB.run(addPointsToUserQuery)
}

const subPointsToUser = async (discordID, amount) => {
    let subPointsToUserQuery = `UPDATE ${usersDataTB} SET 'cardPoints' = cardPoints - ${amount} WHERE discordID = '${discordID.toString()}'`
    await DB.run(subPointsToUserQuery)
}

const getCardPointsOfUser = async (discordID) => {
    let getCardPointsOfUserQuery = `SELECT cardPoints FROM ${usersDataTB} WHERE discordID='${discordID}'`
    return (await DB.get(getCardPointsOfUserQuery)).cardPoints
}

const hasEnoughCardPoints = async (discordID, amount) => {
    return amount <= await getCardPointsOfUser(discordID)
}

const getCardPointstopRowsList = async() => {
    let getCardPointstopRowsListQuery = `SELECT name, cardPoints FROM ${usersDataTB} ORDER BY cardPoints DESC`
    return await DB.all(getCardPointstopRowsListQuery)
}

//>cardPoints managements




//user managements<


const createAUser = async (discordID, name) => {
    let createAUserQuery = `INSERT INTO ${usersDataTB} (discordID, name, money, creationStamp, lastQuickPick, lastDailyPick, wantNotifications, notificationsChannel, gotNotificationYet, rankID, cardPoints) VALUES(?,?,?,?,?,?,?,?,?,?,?)`
    await DB.run(createAUserQuery, [discordID, name, 0, Date.now(), "0", "0", constants.DEFAULTWANTNOTIFICATION, "reload", 0, 1, 0])
}

const getAUserFromDiscordID = async (discordID) => {
    let getUserQuery = `SELECT * FROM ${usersDataTB} WHERE discordID=${discordID.toString()}`
    return await DB.get(getUserQuery)
}

const isUserRegistered = async (discordID) => {
    let isUserRegisteredQuery = `SELECT discordID FROM ${usersDataTB} WHERE discordID='${discordID.toString()}'`
    return await DB.get(isUserRegisteredQuery) ? true : false
}

const prepareUser = async (discordID, name) => {
    if(!(await isUserRegistered(discordID))){
        await createAUser(discordID, name)
    }
}

const doesUserHaveCard = async (discordID) => {
    let doesUserHaveCardQuery = `SELECT cardID FROM ${cardsDataTB} WHERE ownerID='${discordID.toString()}'`
    return (await DB.get(doesUserHaveCardQuery)) ? true : false
}

const isCardAlreadyPickedByUser = async (discordID, playerID, rarity) => {
    let isCardAlreadyPickedByUserQuery = `SELECT cardID FROM ${cardsDataTB} WHERE creatorID='${discordID.toString()}' AND playerID=${playerID} AND rarity='${rarity}'`
    return (await DB.get(isCardAlreadyPickedByUserQuery)) ? true : false
}

const updateUserName = async (discordID, name) => {
    name = name.replace(/'/g, "");
    let updateUserNameQuery = `UPDATE ${usersDataTB} SET 'name' = '${name}' WHERE discordID = '${discordID.toString()}'`
    await DB.run(updateUserNameQuery)
}

const rankupAUser = async (discordID) => {
    let rankupAUserQuery = `UPDATE ${usersDataTB} SET 'rankID' = rankID + ${1} WHERE discordID = '${discordID.toString()}'`
    await DB.run(rankupAUserQuery)
}

//>user managements



//time managements<

const getLastQuickPickTime = async (discordID) => {
    let getLastQuickPickTimeQuery = `SELECT lastQuickPick FROM ${usersDataTB} WHERE discordID='${discordID.toString()}'`
    console.log((await DB.get(getLastQuickPickTimeQuery)).lastQuickPick)
    return (await DB.get(getLastQuickPickTimeQuery)).lastQuickPick
}

const updateQuickPickTime = async (discordID) => {
    let updateQuickPickTimeQuery = `UPDATE ${usersDataTB} SET 'lastQuickPick' = ${Date.now().toString()} WHERE discordID='${discordID.toString()}'`
    await DB.run(updateQuickPickTimeQuery)
}

const getLastSlowPickTime = async (discordID) => {
    let getLastSlowPickTimeQuery = `SELECT lastDailyPick FROM ${usersDataTB} WHERE discordID='${discordID.toString()}'`
    return (await DB.get(getLastSlowPickTimeQuery)).lastDailyPick
}

const updateSlowPickTime = async (discordID) => {
    let updateSlowPickTimeQuery = `UPDATE ${usersDataTB} SET 'lastDailyPick' = '${Date.now().toString()}' WHERE discordID='${discordID.toString()}'`
    await DB.run(updateSlowPickTimeQuery)
}

//>time managements



//zones des compteurs<

const getLastPickablePlayerID = async () =>{
    let getOwnerOfACardQuery = `SELECT data FROM ${otherTB} WHERE dataName='lastPickablePlayerID'`
    return (await DB.get(getOwnerOfACardQuery)).data
}

const setLastPickablePlayerID = async(newPlayerID) => {
    let setLastPickablePlayerIDQuery = `UPDATE ${otherTB} SET 'data' = ${newPlayerID} WHERE dataName='lastPickablePlayerID'`
    await DB.run(setLastPickablePlayerIDQuery)
}

//>zones des compteurs




module.exports = {
    createAUser,
    prepareUser,
    createACard,
    editACard,
    changeCardOwnership,
    bulkChangeCardOwnership,
    setCardImageURL,
    isCardRegistered,
    isUserRegistered,
    getLastQuickPickTime,
    updateQuickPickTime,
    getLastSlowPickTime,
    updateSlowPickTime,
    doesUserHaveCard,
    isCardAlreadyPickedByUser,
    doesUserOwnThisCard,
    getACardFromID,
    getCardsIDListHUB,
    getDistinctPlayerIDAndRarityInUserInventory,
    getOwnerOfACard,
    addMoneyToUser,
    subMoneyToUser,
    setMoneyForUser,
    getBaltopRowsList,
    getMoneyOfUser,
    hasEnoughMoney,
    lockACard,
    bulkLock,
    unlockACard,
    bulkUnlock,
    isACardLocked,
    bulkIsACardLocked,
    setCardEmbedColorCode,
    getLastPickablePlayerID,
    setLastPickablePlayerID,
    updateUserName,
    addPointsToUser,
    subPointsToUser,
    getCardPointsOfUser,
    hasEnoughCardPoints,
    getCardPointstopRowsList,
    getAUserFromDiscordID,
    getPickedCardsNumberOfAUser,
    getOwnedCardsNumberOfAUser,
    rankupAUser,
    getPlayerDataFromID
};
