export default {
    rskTestnet: {
        bassets: [
            // ETH->RSK
            '0xcb92C8D49Ec01b92F2A766C7c3C9C501C45271E0', // DAIes
            '0xcc8Eec21ae75F1A2dE4aC7b32A7de888a45cF859', // USDCes
            '0x10C5A7930fC417e728574E334b1488b7895c4B81', // USDTes

            // BSC->RSK
            '0x407ff7d4760d3a81b4740d268eb04490c7dfe7f2', // bsDAI
            '0x3e2cf87e7ff4048a57f9cdde9368c9f4bfb43adf', // bsUSDC
            '0x43bc3f0ffff6c9bbf3c2eafe464c314d43f561de', // bsUSDT
            '0x8c9abb6c9d8d15ddb7ada2e50086e1050ab32688' // bsBUSD
        ],
        bridges: [
            // ETH->RSK
            '0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156',
            '0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156',
            '0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156',

            // BSC->RSK
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8',
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8',
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8',
            '0x2b2bcad081fa773dc655361d1bb30577caa556f8'
        ],
        factors: [1, 1, 1, 1, 1, 1, 1]
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
