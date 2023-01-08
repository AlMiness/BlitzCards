const { QuickDB } = require("quick.db");
const fs = require('fs');
const path = require('node:path');

const oldDBPath = path.join(__dirname, 'data/json.sqlite');
const cardJSONPath = path.join(__dirname, 'data/cards.json');

var DB = new QuickDB({filePath : oldDBPath});



(async () => {

    

    let playersNameTable = DB.table("playersName")
    let otherTB = DB.table("other") //gros bordel


    const JSONfile = fs.readFileSync(cardJSONPath, 'utf8');

    const playerNamesJSON = JSON.parse(JSONfile);


    for(var id = 1; id<playerNamesJSON.blitzers.length+1; id++){
        playersNameTable.set(id.toString(), {name:playerNamesJSON.blitzers[id-1], emote:playerNamesJSON.emotes[id-1]})
    }
    
    otherTB.set("lastPlayerNameID", id-1)
})();



