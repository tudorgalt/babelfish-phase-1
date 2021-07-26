export default {
    development: {
        XUSD: {
        },
        ETHs: {
        },
        BNBs: {
        }
    },
    rinkeby: {
        XUSD: {
        },
        ETHs: {
        },
        BNBs: {
        }
    },
    rskTestnet: {
        XUSD: {
            bassets: [
                // ETH->RSK
                '0xcb92c8d49ec01b92f2a766c7c3c9c501c45271e0', // DAIes
                '0xcc8eec21ae75f1a2de4ac7b32a7de888a45cf859', // USDCes
                '0x10c5a7930fc417e728574e334b1488b7895c4b81', // USDTes

                // BSC->RSK
                '0x407ff7d4760d3a81b4740d268eb04490c7dfe7f2', // bsDAI
                '0x3e2cf87e7ff4048a57f9cdde9368c9f4bfb43adf', // bsUSDC
                '0x43bc3f0ffff6c9bbf3c2eafe464c314d43f561de', // bsUSDT
                '0x8c9abb6c9d8d15ddb7ada2e50086e1050ab32688', // bsBUSD

                // non bridge
                '0x4d5a316d23ebe168d8f887b4447bf8dbfa4901cc' // rUSDT
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
                '0x2b2bcad081fa773dc655361d1bb30577caa556f8',

                // non bridge
                '0x0000000000000000000000000000000000000000'
            ],
            factors: [1, 1, 1, 1, 1, 1, 1, 1]
        },
        ETHs: {
            bassets: [
                // ETH->RSK
                '0x4f2fc8d55c1888a5aca2503e2f3e5d74eef37c33', // ETHes

                // BSC->RSK
                '0x793ce6f95912d5b43532c2116e1b68993d902272' // ETHbs
            ],
            bridges: [
                // ETH->RSK
                '0xc0e7a7fff4aba5e7286d5d67dd016b719dcc9156',

                // BSC->RSK
                '0x2b2bcad081fa773dc655361d1bb30577caa556f8'
            ],
            factors: [1, 1]
        },
        BNBs: {
            bassets: [
                // BSC->RSK
                '0xafa6a1eb7e2282e8854822d2bb412b6db2caba4e', // bsBNB
            ],
            bridges: [
                // BSC->RSK
                '0x2b2bcad081fa773dc655361d1bb30577caa556f8', // BNBs
            ],
            factors: [1]
        }
    },
    rsk: {
        XUSD: {
            bassets: [
                // ETH->RSK
                '0x1a37c482465e78e6dabe1ec77b9a24d4236d2a11', // DAIes
                '0x8d1f7cbc6391d95e2774380e80a666febf655d6b', // USDCes
                '0xd9665ea8f5ff70cf97e1b1cd1b4cd0317b0976e8', // USDTes

                // BSC->RSK
                '0x6a42ff12215a90f50866a5ce43a9c9c870116e76', // DAIbs
                '0x91edcee9567cd5612c9dedeaae24d5e574820af1', // USDCbs
                '0xff4299bca0313c20a61dc5ed597739743bef3f6d', // USDTbs
                '0x61e9604e31a736129d7f5c58964c75935b2d80d6', // BUSDbs

                // non bridge
                '0xef213441a85df4d7acbdae0cf78004e1e486bb96' // rUSDT
            ],
            bridges: [
                // ETH->RSK
                '0x1ccad820b6d031b41c54f1f3da11c0d48b399581',
                '0x1ccad820b6d031b41c54f1f3da11c0d48b399581',
                '0x1ccad820b6d031b41c54f1f3da11c0d48b399581',

                // BSC->RSK
                '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
                '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
                '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',
                '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350',

                // non bridge
                '0x0000000000000000000000000000000000000000'
            ],
            factors: [1, 1, 1, 1, 1, 1, 1, 1],
            multisig: '0x37a706259f5201c03f6cb556a960f30f86842d01'
        },
        ETHs: {
            bassets: [
                // ETH->RSK
                '0xfe878227c8f334038dab20a99fc3b373ffe0a755', // ETHes

                // BSC->RSK
                '0x30d1b36924c2c0cd1c03ec257d7fff31bd8c3007' // ETHbs
            ],
            bridges: [
                // ETH->RSK
                '0x1ccad820b6d031b41c54f1f3da11c0d48b399581',

                // BSC->RSK
                '0x971b97c8cc82e7d27bc467c2dc3f219c6ee2e350'
            ],
            factors: [1, 1],
            multisig: '0x37a706259f5201c03f6cb556a960f30f86842d01'
        },
        BNBs: {
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
        }
    }
};
