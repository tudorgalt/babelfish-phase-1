export default {
    rskTestnet: {
        bassets: [
            // BSC->RSK
            '0xafa6a1eb7e2282e8854822d2bb412b6db2caba4e', // bsBNB
        ],
        bridges: [
            // BSC->RSK
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8', // BNBs
        ],
        factors: [1],
        multisig: '0x37a706259f5201c03f6cb556a960f30f86842d01'
    },
    rsk: {
        bassets: [
            // BSC->RSK
            '0xd2a826b78200c8434b957913ce4067e6e3169385', // BNBbs
        ],
        bridges: [
            // BSC->RSK
            '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350', // BNBs
        ],
        factors: [1],
        multisig: '0x37a706259f5201c03f6cb556a960f30f86842d01'
    },
    development: {
        bassets: [
            '0xc064a7d5741dfDdAe7C6792972a5337845e180E3' // bogus
        ],
        bridges: [
            '0x0000000000000000000000000000000000000000',
        ],
        factors: [1]
    }
};
