const path = require('node:path');
const { isMainThread } = require('node:worker_threads');

const SQP = require("./functions/sqlite3-promisify");
const fs = require('fs');


const dbpath = path.join(__dirname, './data/blitzcordDB.db');


const DB = new SQP(dbpath)

const usersDataTB = "usersData"
const cardsDataTB = "cardsData"
const otherTB = "other"
const playersDataTB = "playersData"
const sqliteSequence = "sqlite_sequence"

async function main(){
    let cardList = await getCardList()
    if(cardList.length == 0) return;
    let cardsPerDayList = []
    let currentDate = new Date(cardList[0].creationStamp).setHours(0,0,0,0)
    let currentCardsNumberThisDay = 1
    for(let cardIndex = 1; cardIndex<cardList.length; cardIndex++){
        if(currentDate == new Date(cardList[cardIndex].creationStamp).setHours(0,0,0,0)){
            currentCardsNumberThisDay++
        }
        else{
            cardsPerDayList.push(currentCardsNumberThisDay)
            currentCardsNumberThisDay = 0
            currentDate = new Date(cardList[cardIndex].creationStamp).setHours(0,0,0,0)
        }
    }

    console.log(cardsPerDayList)
    console.log(cardList.length/cardsPerDayList.length)

    fs.writeFile('stats.txt', cardsPerDayList.toString(), function (err) {
        if (err) return console.log(err);
        console.log('Hello World > helloworld.txt');
    });

}

async function getCardList() {
    let getCardQuery = `SELECT * FROM ${cardsDataTB}`
    return await DB.all(getCardQuery)
}




main()