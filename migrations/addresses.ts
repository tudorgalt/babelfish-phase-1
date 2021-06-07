export default {
    rskTestnet: {
        bassets: [
            // ETH->RSK
            '0xcb92c8d49ec01b92f2a766c7c3c9c501c45271e0', // DAIes
            '0xcc8eec21ae75f1a2de4ac7b32a7de888a45cf859', // USDCes
            '0x10c5a7930fc417e728574e334b1488b7895c4b81', // USDTes

            // BSC->RSK
            '0x407ff7d4760d3a81b4740d268eb04490c7dfe7f2', // bsDAI
            '0x3e2cf87e7ff4048a57f9cdde9368c9f4bfb43adf', // bsUSDC
            '0x43bc3f0ffff6c9bbf3c2eafe464c314d43f561de', // bsUSDT
            '0x8c9abb6c9d8d15ddb7ada2e50086e1050ab32688' // bsBUSD
        ],
        bridges: [
            // ETH->RSK
            '0xc0e7a7fff4aba5e7286d5d67dd016b719dcc9156',
            '0xc0e7a7fff4aba5e7286d5d67dd016b719dcc9156',
            '0xc0e7a7fff4aba5e7286d5d67dd016b719dcc9156',

            // BSC->RSK
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8',
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8',
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8',
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8'
        ],
        factors: [1, 1, 1, 1, 1, 1, 1]
    },
    rsk: {
        bassets: [
            // ETH->RSK
            '0x1A37c482465e78E6DAbE1Ec77B9a24D4236D2A11', // DAIes
            '0x8D1f7CbC6391D95E2774380e80A666FEbf655D6b', // USDCes
            '0xD9665EA8F5fF70Cf97E1b1Cd1B4Cd0317b0976e8', // USDTes

            // BSC->RSK
            '0x6A42Ff12215a90f50866A5cE43A9c9C870116e76', // DAIbs
            '0x91EDceE9567cd5612c9DEDeaAE24D5e574820af1', // USDCbs
            '0xFf4299bCA0313C20A61dc5eD597739743BEf3f6d', // USDTbs
            '0x61e9604e31a736129d7f5C58964c75935b2d80D6', // BUSDbs

            // non bridge
            '0xEf213441a85DF4d7acBdAe0Cf78004E1e486BB96' // RUSDT
        ],
        bridges: [
            // ETH->RSK
            '0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581',
            '0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581',
            '0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581',

            // BSC->RSK
            '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
            '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
            '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
            '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',

            // non bridge
            '0x0000000000000000000000000000000000000000'
        ],
        factors: [1, 1, 1, 1, 1, 1, 1, 1],
        multisig: '0x37A706259F5201C03f6Cb556A960F30F86842d01'
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
