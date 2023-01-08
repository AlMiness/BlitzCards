
const GLITCHEDVALUE = 0
const MINVALUEFORCOMMON = 1
const MINVALUEFORRARE = 700
const MINVALUEFOREPIC = 900
const MINVALUEFORLEG = 985
const PERFECTVALUE = 1000

var glitchedNB = 0
var communeNB = 0
var rareNB = 0
var epicNB = 0
var legNB = 0
var perfectNB = 0


const cardChooser = (minValue, maxValue) => {

    let rarityValue = Math.floor(Math.random()*(1+maxValue-minValue))+minValue

    switch (true){
        case(rarityValue==PERFECTVALUE):
            perfectNB++
            break;
        case(rarityValue>=MINVALUEFORLEG):
            legNB++
            break;
        case(rarityValue>=MINVALUEFOREPIC):
            epicNB++
            break;
        case(rarityValue>=MINVALUEFORRARE):
            rareNB++
            break;
        case(rarityValue>=MINVALUEFORCOMMON):
            communeNB++
            break;
        default:
        glitchedNB++
    };
}



function mainCount(loopNB){

    for(let i = 0; i<loopNB; i++){
        cardChooser(0, 1000)
    }

    console.log(`Tirages de ${loopNB.toString()} cartes`)

    console.log(`${glitchedNB.toString()} cartes glitched pour ${(glitchedNB/loopNB*100).toString()}%`)
    console.log(`${communeNB.toString()} cartes communes pour ${(communeNB/loopNB*100).toString()}%`)
    console.log(`${rareNB.toString()} cartes rares pour ${(rareNB/loopNB*100).toString()}%`)
    console.log(`${epicNB.toString()} cartes epiques pour ${(epicNB/loopNB*100).toString()}%`)
    console.log(`${legNB.toString()} cartes legendaires pour ${(legNB/loopNB*100).toString()}%`)
    console.log(`${perfectNB.toString()} cartes parfaites pour ${(perfectNB/loopNB*100).toString()}%`)
}

//mainCount(10000000000)


function moyenneDaily(loopNB){

    let total = 0

    let above50 = 0
    let above100 = 0
    let above150 = 0
    let above200 = 0
    let above250 = 0
    let above300 = 0
    let above310 = 0

    for(let i = 0; i<loopNB; i++){
        let currentvalue = dailyGivenValue(Math.random()*406.5)
        total = total + currentvalue
        if(currentvalue>50) above50++
        if(currentvalue>100) above100++
        if(currentvalue>150) above150++
        if(currentvalue>200) above200++
        if(currentvalue>250) above250++
        if(currentvalue>300) above300++
        if(currentvalue>310) above310++
    }

    console.log(`Moyenne gagné par /daily : ${total/loopNB}`)

    console.log(`Tirage au dessus de 50 : ${above50/loopNB*100}%`)
    console.log(`Tirage au dessus de 100 : ${above100/loopNB*100}%`)
    console.log(`Tirage au dessus de 150 : ${above150/loopNB*100}%`)
    console.log(`Tirage au dessus de 200 : ${above200/loopNB*100}%`)
    console.log(`Tirage au dessus de 250 : ${above250/loopNB*100}%`)
    console.log(`Tirage au dessus de 300 : ${above300/loopNB*100}%`)
    console.log(`Tirage au dessus de 310 : ${above310/loopNB*100}%`)

}

const dailyGivenValue = (randomNumber) => {
    return Math.trunc(Math.exp(randomNumber/50+2)/100 + randomNumber/10 + 25)
}

moyenneDaily(100000000)