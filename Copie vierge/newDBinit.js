const sqlite3 = require("sqlite3").verbose()
const path = require('node:path');
const fs = require('fs');

const dbpath = path.join(__dirname, 'data/blitzcordDB.db');
const cardJSONPath = path.join(__dirname, 'data/cards.json');

const DB = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
    if(err) return console.error("erreur ouverture")
})

var createUserTB = 'CREATE TABLE "usersData"("discordID" TEXT NOT NULL UNIQUE, "name" TEXT, "money" INTEGER DEFAULT 0, "creationStamp" INTEGER, "lastQuickPick" TEXT, "lastDailyPick" TEXT, "wantNotifications" INTEGER, "notificationsChannel" TEXT, "gotNotificationYet" INTEGER, "rankID" INTEGER, "cardPoints" INTEGER, PRIMARY KEY("discordID"))'

var createCardsDataTB = `CREATE TABLE "cardsData" (
	"cardID"	INTEGER NOT NULL UNIQUE,
	"playerID"	INTEGER,
	"rarityValue"	INTEGER,
	"rarity"	TEXT,
	"creatorID"	TEXT,
	"creationStamp" INTEGER,
	"ownerID"	TEXT,
	"lastOwnerChangeStamp" INTEGER,
	"imageURL"	TEXT,
	"embedColor"	TEXT,
	"locked"	INTEGER DEFAULT 0,
	"userLocked"	INTEGER DEFAULT 0,
	PRIMARY KEY("cardID" AUTOINCREMENT)
);`

var createOtherTB = `CREATE TABLE "other" (
	"dataName"	TEXT,
	"data"	INTEGER
);`

var CreatePlayerDataTB = `CREATE TABLE "playersData" (
	"playerID"	INTEGER NOT NULL UNIQUE,
	"playerName"	TEXT,
	"playerEmote"	TEXT,
	PRIMARY KEY("playerID" AUTOINCREMENT)
);`;

DB.run(createUserTB)
DB.run(createCardsDataTB)
DB.run(createOtherTB)

const JSONfile = fs.readFileSync(cardJSONPath, 'utf8');

const playersDataJSON = JSON.parse(JSONfile);

DB.serialize(() => {
    DB.run(CreatePlayerDataTB);


	const playerDataInsert = DB.prepare('INSERT INTO "playersData" (playerName, playerEmote) VALUES(?,?)');
	for (let id = 1; id < Object.keys(playersDataJSON.playerData).length+1; id++) {
		playerDataInsert.run([playersDataJSON.playerData[id.toString()].playerName, playersDataJSON.playerData[id.toString()].playerEmote]);
	}
	playerDataInsert.finalize();
});

let insertLastPickablePlayerQuery = 'INSERT INTO "other" (dataName, data) VALUES(?,?)'

DB.run(insertLastPickablePlayerQuery, ["lastPickablePlayerID", 57])