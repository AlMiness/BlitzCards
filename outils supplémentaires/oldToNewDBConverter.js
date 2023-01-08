const sqlite3 = require("sqlite3").verbose()
const path = require('node:path');
const fs = require('fs');

const oldDBPath = path.join(__dirname, 'data/json.sqlite');

const { QuickDB } = require("quick.db");
var oldDB = new QuickDB({filePath : oldDBPath});

const SQP = require("./functions/sqlite3-promisify");
const newDBpath = path.join(__dirname, 'data/blitzcordDB.db');


const botID = "994751469360259092"
const addedMS = 1800000

var userOwnedCardList = {}
var usersData
var cardsData


const newDB = new SQP(newDBpath)

async function main(){
    await getOldData()
    await setUpUserOwnedCardList()
    console.log(userOwnedCardList["308185708982566912"])
    await usersConverter()
    await cardsDataConverter()
}

async function getOldData(){
    let userTB = oldDB.table("usersData")
    usersData = await userTB.all()
    let cardsDataTB = oldDB.table("cardsData")
    cardsData = await cardsDataTB.all()
}

async function setUpUserOwnedCardList(){
    for(let userIndex=0; userIndex<usersData.length; userIndex++){
        let currentUserID
        if(usersData[userIndex].id != ""){
            currentUserID = usersData[userIndex].id
            console.log(currentUserID)
            if(usersData[userIndex].value.ownedCardsID.length){
                userOwnedCardList[currentUserID] = {}
                userOwnedCardList[currentUserID].cardsDico = {}
                userOwnedCardList[currentUserID].cardsDico[usersData[userIndex].value.ownedCardsID[0].toString()] = cardsData[usersData[userIndex].value.ownedCardsID[0]].value.creationDate
                for(let cardIndex = 1; cardIndex<usersData[userIndex].value.ownedCardsID.length; cardIndex++){
                    userOwnedCardList[currentUserID].cardsDico[usersData[userIndex].value.ownedCardsID[cardIndex].toString()] = cardsData[usersData[userIndex].value.ownedCardsID[cardIndex]-1].value.creationDate < userOwnedCardList[currentUserID].cardsDico[usersData[userIndex].value.ownedCardsID[cardIndex-1].toString()] + addedMS ? userOwnedCardList[currentUserID].cardsDico[usersData[userIndex].value.ownedCardsID[cardIndex-1].toString()] + addedMS : cardsData[usersData[userIndex].value.ownedCardsID[cardIndex]-1].value.creationDate
                }
            }
        }
        else{
            currentUserID = botID
            let botcardsList = []
            for(let cardIndex = 0; cardIndex<cardsData.length;cardIndex++){
                if(cardsData[cardIndex].value.owner == ""){
                    botcardsList.push(parseInt(cardsData[cardIndex].id))
                }
            }
            userOwnedCardList[currentUserID] = {}
            userOwnedCardList[currentUserID].cardsList = botcardsList
            userOwnedCardList[currentUserID].cardsDico = {}
            userOwnedCardList[currentUserID].cardsDico[botcardsList[0].toString()] = cardsData[botcardsList[0]].value.creationDate
            for(let cardIndex = 1; cardIndex<botcardsList.length; cardIndex++){
                userOwnedCardList[currentUserID].cardsDico[botcardsList[cardIndex].toString()] = cardsData[botcardsList[cardIndex]-1].value.creationDate < userOwnedCardList[currentUserID].cardsDico[botcardsList[cardIndex-1].toString()] + addedMS ? userOwnedCardList[currentUserID].cardsDico[botcardsList[cardIndex-1].toString()] + addedMS : cardsData[botcardsList[cardIndex]-1].value.creationDate
            }
        }
    }

    for(let userIndex=0; userIndex<usersData.length; userIndex++){
        currentUserID = usersData[userIndex].id
        console.log(currentUserID + " --  " + userOwnedCardList[currentUserID]?.lastStamp)
    }
    return;
}


async function usersConverter(){
    const playerDataInsertQuery = 'INSERT INTO "usersData" (discordID, name, money, creationStamp, lastQuickPick, lastDailyPick, wantNotifications, notificationsChannel, gotNotificationYet) VALUES(?,?,?,?,?,?,?,?,?)'
    for (let userIndex = 0; userIndex < usersData.length; userIndex++) {
        let cu = usersData[userIndex]
        let cuv = cu.value
        if(cu.id != ""){
            await newDB.run(playerDataInsertQuery, [cu.id, "reload", cuv.money, cuv.creationDate, cuv.lastQuickPickTime, cuv.lastSlowPickTime, 0, "reload", 0]);
        }
    }
}

async function cardsDataConverter(){
    const cardDataInsertQuery = 'INSERT INTO "cardsData" (cardID, playerID, rarityValue, rarity, creatorID, creationStamp, ownerID, lastOwnerChangeStamp, imageURL, embedColor, locked, userLocked) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
    for (let cardIndex = 0; cardIndex < cardsData.length; cardIndex++) {
        let cu = cardsData[cardIndex]
        let cuv = cu.value
        let currentOwner = cuv.owner != "" ? cuv.owner : botID
        let lastChangeStamp = userOwnedCardList[currentOwner].cardsDico[cu.id.toString()]

        await newDB.run(cardDataInsertQuery, [cu.id, cuv.playerID, cuv.rarityValue, cuv.rarity, cuv.creatorID, cuv.creationDate, currentOwner, lastChangeStamp, cuv.imageURL, cuv.embedColor, cuv.locked ? 1 : 0, 0]); //ajouter le système pour le lastOwnerChangeStamp
    }
    let cardsDataSeqUpdate = `UPDATE sqlite_sequence SET 'seq' = ${cardsData.length} WHERE name='cardsData'`
    await newDB.run(cardsDataSeqUpdate)
}

main()
