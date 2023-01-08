const sqlite3 = require("sqlite3").verbose()
const path = require('node:path');
const fs = require('fs');

const dbpath = path.join(__dirname, 'data/blitzcordDB.db');
const cardJSONPath = path.join(__dirname, 'data/cards.json');

const DB = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
    if(err) return console.error("erreur ouverture")
})




let deletePlayersDataTable = "DELETE FROM playersData"

let resetseq = "UPDATE sqlite_sequence SET 'seq' = 0 WHERE name='playersData'"

DB.run(deletePlayersDataTable)
DB.run(resetseq)

const JSONfile = fs.readFileSync(cardJSONPath, 'utf8');

const playersDataJSON = JSON.parse(JSONfile);

console.log()

DB.serialize(() => {

    const playerDataInsert = DB.prepare('INSERT INTO "playersData" (playerName, playerEmote) VALUES(?,?)');
    for (let id = 1; id < Object.keys(playersDataJSON.playerData).length+1; id++) {
        playerDataInsert.run([playersDataJSON.playerData[id.toString()].playerName, playersDataJSON.playerData[id.toString()].playerEmote]);
    }
    playerDataInsert.finalize();
});

/*

let rowu = ""

let a = DB.get(`SELECT * FROM cardsData WHERE cardID=10 AND rarity='Commune'`, (err, row)=>{
    row.playerData = {name:"goumba", emote:"bruh"}
    console.log(row.playerData)
})

console.log(typeof rowu)

let cardIDlist = [1, 5, 6, 8, 154, 653]

DB.serialize(() => {
    let changeCardOwnership = DB.prepare(`UPDATE cardsData SET 'ownerID' = "ownus" WHERE cardID=?`);
    cardIDlist.forEach((cardID)=>{
        changeCardOwnership.run([cardID])
    }
    )
    changeCardOwnership.finalize();
});



const SQP = require("./functions/sqlite3-promisify")

async function testdb(){
    let isUserRegisteredQuery = `SELECT discordID FROM usersData WHERE discordID="308185708982566912"}`
    let promiseQuery = UP(DB.get)
    return await promiseQuery(isUserRegisteredQuery, (err, row)=>{
        return row ? true : false
    })
}

const DBgetter = function (query, values = []) {
    const that = this;
    return new Promise(function (resolve, reject) {
      that.db.get(query, values, function (err, row) {
        if (err) {
          return reject(err);
        }
  
        return resolve(row);
      });
    });
  };


console.log(testdb())
*/