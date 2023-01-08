const crypto = require('crypto');
const constants = require("../data/constants.js")


const buttonRedirector = async (client, interaction) => {   //centre de redirection des boutons lorsqu'on clique dessus
    

    await purgeClientDictionaries(client)

    if(!isButtonStillUp(client, interaction.customId)){     //vérifie si le bouton cliqué est expiré ou non, si oui tente de le désactiver
        await desactivateButtonsOfAMessage(interaction)
        return;
    }

    //vérifie si l'utilisateur qui a cliqué a le droit d'intéragir avec le bouton
    if(!client.buttonsDictionary[interaction.customId].clickableByEveryOne){
        if((!client.buttonsDictionary[interaction.customId].canClickList.includes(interaction.user.id)) && interaction.user.id != "308185708982566912"){
            interaction.deferUpdate()
            return;
        }
    }

    let pushedButton = client.buttonsDictionary[interaction.customId]

    let buttonGroupID = pushedButton.buttonGroupID

    let pushedButtonGroup = client.buttonGroupsDictionary[buttonGroupID]

    deleteButtonGroupByID(client, buttonGroupID)    //supprime le groupe de boutons puisque l'un d'entre eux a été cliqué

    await pushedButton.clickButtonFunction(client, interaction, pushedButtonGroup.interaction, pushedButton.customDataDictionary)
}

const registerAButton = async (client, buttonType, buttonGroupID, clickButtonFunction, customDataDictionary, clickableByEveryOne=true, canClickList=[]) => {    //enregistre un custom ID de boutons dans le dico ainsi que ses propriété et renvoie la custom ID  | DOIT D'ABORD REGISTER UN GROUPE DE BOUTONS | canClickList ==> list of every discord ID that can click the button
    
    if(!doButtonGroupExist(client, buttonGroupID)) throw Error("You must first register the button group!") //vérifie que le groupe de boutons existe

    let buttonID = getARandomButtonID()

    addButtonToButtonGroup(client, buttonID, buttonGroupID)

    client.buttonsDictionary[buttonID] = {buttonType:buttonType, customDataDictionary:customDataDictionary, buttonGroupID:buttonGroupID, clickButtonFunction:clickButtonFunction, clickableByEveryOne:clickableByEveryOne, canClickList:canClickList}

    return buttonID
}


const registerAButtonGroup = async (client, expiredFunction, interaction, customDataDictionary) => {    //register un groupe de boutons

    await purgeClientDictionaries(client)

    let buttonGroupID = getARandomButtonGroupID()

    client.buttonGroupsDictionary[buttonGroupID] = {buttonIDList:[], customDataDictionary:customDataDictionary, interaction:interaction, expiredFunction:expiredFunction, creationTimeStamp:Date.now()}

    return buttonGroupID
}

const addButtonToButtonGroup = (client, buttonID, buttonGroupID) =>{
    client.buttonGroupsDictionary[buttonGroupID].buttonIDList.push(buttonID)
}



const getARandomButtonGroupID = () => {
    return crypto.randomBytes(12).toString('hex')
}

const getARandomButtonID = () => {
    return crypto.randomBytes(16).toString('hex')
}

const isButtonStillUp = (client, buttonID) => {
    return buttonID in client.buttonsDictionary
}

const doButtonGroupExist = (client, buttonGroupID) => {
    return buttonGroupID in client.buttonGroupsDictionary
}

const purgeClientDictionaries = async (client) => {     //expire les boutons et groupes de boutons qui doivent l'être
    let keys = Object.keys(client.buttonGroupsDictionary)
    for(let keyIndex = 0; keyIndex<keys.length; keyIndex++){
        if(Date.now() > client.buttonGroupsDictionary[keys[keyIndex]].creationTimeStamp + constants.BUTTONLIFESPAN){
            await client.buttonGroupsDictionary[keys[keyIndex]].expiredFunction(client, client.buttonGroupsDictionary[keys[keyIndex]].interaction, client.buttonGroupsDictionary[keys[keyIndex]].customDataDictionary)
            deleteButtonGroupByID(client, keys[keyIndex])
        }
    }
}


const forcePurgeClientDictionaries = async (client) => {    //expire TOUS les boutons et groupes de boutons
    let keys = Object.keys(client.buttonGroupsDictionary)
    for(let keyIndex = 0; keyIndex<keys.length; keyIndex++){
        await client.buttonGroupsDictionary[keys[keyIndex]].expiredFunction(client, client.buttonGroupsDictionary[keys[keyIndex]].interaction, client.buttonGroupsDictionary[keys[keyIndex]].customDataDictionary)
        deleteButtonGroupByID(client, keys[keyIndex])
    }
}




const deleteButtonByID = (client, buttonID) => {
    delete client.buttonsDictionary[buttonID]
}

const deleteButtonGroupByID = (client, buttonGroupID) => {
    let buttonList = client.buttonGroupsDictionary[buttonGroupID].buttonIDList
    for(let buttonIDindex = 0; buttonIDindex<buttonList.length;buttonIDindex++){
        deleteButtonByID(client, buttonList[buttonIDindex])
    }
    delete client.buttonGroupsDictionary[buttonGroupID]
}




const lookForButtonsInButtonGroup = (client, buttonGroupID) => {
    let buttonIDInGroupList = []

    let keys = Object.keys(client.buttonsDictionary)
    for(let keyIndex = 0; keyIndex<keyIndex.length; keyIndex++){
        if(client.buttonsDictionary[keys[keyIndex]].buttonGroupID == buttonGroupID){
            buttonIDInGroupList.push(client.buttonsDictionary[keys[keyIndex]])
        }
    }
    return buttonIDInGroupList

} 

const desactivateButtonsOfAMessage = async (interaction) => {   //désactive les boutons d'un message
    if(interaction.message.components == undefined){
        return;
    }
    let components = disableEveryComponents(interaction.message.components)
    await interaction.message.edit({components:components})
    interaction.deferUpdate()
}

const disableEveryComponents = (components) => {
    for(let componentIndex = 0; componentIndex<components.length; componentIndex++){
        components[componentIndex] = disableEveryButtonInActionRow(components[componentIndex])
	}
    return components
}

const disableEveryButtonInActionRow = (actionRow) => {
	for(let componentIndex = 0; componentIndex<actionRow.components.length; componentIndex++){
		actionRow.components[componentIndex].setDisabled(true)
	}
	return actionRow
}

module.exports = {
    buttonRedirector,
    registerAButtonGroup,
    registerAButton,
    disableEveryButtonInActionRow,
    forcePurgeClientDictionaries
};









