const BN = require('bn.js');
const files = require("./files")

function map(list, action, map) {
    let numberOfUniqueStakerEntries = 0
    for(const entry of list) {
        const stakerAddress = entry.staker
        if(!map[stakerAddress]) {
            map[stakerAddress] = []
            numberOfUniqueStakerEntries++
        }
        entry.action = action

        if(entry.amount) {
            entry.amountString = entry.amount
            entry.amount = new BN(entry.amount)
        }
        map[stakerAddress].push(entry)
    }
    console.log("new unique", action, ":", numberOfUniqueStakerEntries)
}

function sort(map) {
    const sortedMap = {}
    for(const stakerAddress in map) {
        sortedMap[stakerAddress] = map[stakerAddress].sort((a, b) => {
            if(a.block < b.block) {
                return -1
            }else if(a.block > b.block) {
                return 1
            }
            return 0
        })
    }
    return sortedMap
}

function reduce(map) {
    const reducedMap = {}
    for(const stakerAddress in map) {
        const staker = map[stakerAddress]

        reducedMap[stakerAddress] = []

        const reducedStaker = reducedMap[stakerAddress]
        
        for(const action of staker) {
            if(action.action == "stake") {
                const stakerAction = reducedStaker.find((stakerAction => {
                    return stakerAction.locked_until == action.locked_until
                }))

                if(stakerAction) {
                    const duplicateIndex = reducedStaker.find((stakerAction => {
                        return stakerAction.block == action.block
                    }))
                    if(duplicateIndex) {
                        console.log("Duplicate found!")
                        continue
                    }
                }
                if(!stakerAction) {
                    reducedStaker.push({
                        locked_until: action.locked_until,
                        amount: action.amount,
                        block: action.block
                    })
                }else {
                    stakerAction.amount = stakerAction.amount.add(action.amount)
                }
            }else if(action.action == "extend") {
                const stakerAction = reducedStaker.find((stakerAction => {
                    return stakerAction.locked_until == action.old_date
                }))

                if(stakerAction) {
                    const duplicateIndex = reducedStaker.find((stakerAction => {
                        return stakerAction.block == action.block
                    }))
                    if(duplicateIndex) {
                        console.log("Duplicate found!")
                        continue
                    }
                }

                if(!stakerAction) {
                    reducedStaker.push({
                        locked_until: action.new_date,
                        amount: action.amount,
                        block: action.block
                    })
                }else {
                    stakerAction.locked_until = action.new_date
                }
            }else if(action.action == "withdraw") {
                const stakerAction = reducedStaker.find((stakerAction => {
                    return stakerAction.locked_until == action.locked_until
                }))

                if(stakerAction) {
                    const duplicateIndex = reducedStaker.find((stakerAction => {
                        return stakerAction.block == action.block
                    }))
                    if(duplicateIndex) {
                        console.log("Duplicate found!")
                        continue
                    }
                }
                if(!stakerAction) {
                    continue
                }
                
                stakerAction.amount = stakerAction.amount.sub(action.amount)
                if(stakerAction.amount.isNeg()) {
                    stakerAction.amount = new BN(0)
                }
            }
        }
    }
    return reducedMap
}

const DAY = new BN(60 * 60 * 24)

const WEIGHT_FACTOR = new BN(10)
const MAX_VOTING_WEIGHT = new BN(9)
const MAX_DURATION = new BN(1092)
const MAX_DURATION_POW2 = MAX_DURATION.sqr()


function calculateWeightV2(remainingTime) {
    const x = MAX_DURATION.mul(DAY).sub(new BN(remainingTime)).div(DAY)
    const xPOW2 = x.mul(x)
    const b = MAX_DURATION_POW2.sub(xPOW2)
    const a = MAX_VOTING_WEIGHT.mul(WEIGHT_FACTOR)
    const c = a.mul(b)
    const d = c.div(MAX_DURATION_POW2)
    const weight = WEIGHT_FACTOR.add(d)
    return weight
}

function calculateWeight(remainingTime) {
    const x = MAX_DURATION.mul(DAY).sub(new BN(remainingTime)).div(DAY)

    const x1 = MAX_DURATION.sub(x)
    const x2 = MAX_DURATION.add(x)
    
    const weight = MAX_VOTING_WEIGHT.mul(WEIGHT_FACTOR).mul(x1).mul(x2).div(MAX_DURATION_POW2).add(WEIGHT_FACTOR)
    return weight
}

let debugList = []
function calculatePower(map, date) {
    const stakerPowerList = []

    
    for(const stakerAddress in map) {
        const staker = map[stakerAddress]

        let stakerPower = new BN("0") 
        for(const stake of staker) {
            const remainingTime = parseInt(stake.locked_until) - date

            let weight = new BN(0)
            if(remainingTime >= 0) {
                weight = calculateWeightV2(remainingTime)
            }

            stake.power = stake.amount.mul(weight)
            stake.weight = weight
            stake.time = remainingTime
            debugList.push({
                weight: stake.amount.toString()
            })

            stakerPower = stakerPower.add(stake.power)
        }
        
        if(stakerPower.gt(new BN("0"))) {
            stakerPowerList.push({
                address: stakerAddress,
                power: stakerPower
            })
        }
    }

    return stakerPowerList
}

async function main() {
    const stakersMap = {}
    const stakersList = await files.readCsv("./data/staking.csv")
    map(stakersList, "stake", stakersMap)

    const extendStakerList = await files.readCsv("./data/extending.csv")
    map(extendStakerList, "extend", stakersMap)

    const withdrawStakerList = await files.readCsv("./data/withdrawing.csv")
    map(withdrawStakerList, "withdraw", stakersMap)

    const sortedStakersMap = sort(stakersMap)

    const reducedStakersMap = reduce(sortedStakersMap)
    

    //Konrad: 1624233600 Michałke: 1624319993
    const dateTimestamp = new BN("1624233600")


    // const kickoffTS = new BN("1613125695");
    // const TWO_WEEKS = new BN("1209600");
    // const periodFromKickoff = dateTimestamp.sub(kickoffTS).div(TWO_WEEKS);
    // const alignedTimestamp = periodFromKickoff.mul(TWO_WEEKS).add(kickoffTS);

    const stakersPowers = calculatePower(reducedStakersMap, dateTimestamp.toNumber())

    files.saveCsv(stakersPowers, "./data/powers.csv")

    files.saveCsv(debugList, "./data/debug.csv")
    return true
}


main().then(result => {
    console.log("Finished")
})