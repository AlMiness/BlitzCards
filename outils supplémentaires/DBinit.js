const { QuickDB } = require("quick.db");
const apiDB = require("./functions/apiDB")
const fs = require('fs');
var DB = new QuickDB({filePath : "./data/json.sqlite"});




(async () => {

    let usersDataTB = apiDB.getATable(DB, "usersData") //discordID :
    let usersCardsDataTB = apiDB.getATable(DB, "usersCardsData") //pour stocker ce que les cartes que les gens déjà drop
    let cardsDataTB = apiDB.getATable(DB, "cardsData") 
    let otherTB = apiDB.getATable(DB, "other") //gros bordel
    let playersNameTable = apiDB.getATable(DB, "playersName")


    const JSONfile = fs.readFileSync("./data/cards.json", 'utf8');

    const playerNamesJSON = JSON.parse(JSONfile);


    for(var id = 1; id<playerNamesJSON.blitzers.length+1; id++){
        playersNameTable.set(id.toString(), {name:playerNamesJSON.blitzers[id-1], emote:playerNamesJSON.emotes[id-1]})
    }

    otherTB.set("notSoldCards", [])

    otherTB.set("lastCardID", 0)
    otherTB.set("lastPlayerNameID", id-1)
})();



