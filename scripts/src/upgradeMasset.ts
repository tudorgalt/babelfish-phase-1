import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';

const massetProxyAddress = '0x04D92DaA8f3Ef7bD222195e8D1DbE8D89A8CebD3';
const thresholdProxyAdminAddress = '0x20bdB7607092C88b52f6E6ceCD6Dc6F226bAb570';
const basketManagerAddress ='0xaC148e5D164Ce1164e14913b329feA8e4dA0b699';
const tokenAddress = '0x0fd0D8D78CE9299eE0e5676A8D51f938c234162c';
const bridgeAddress = '0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156';
const newMassetAddress = '0x175A264f3808cFb2EFDa7D861a09b4EeBEF339EF';

const admin1 = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
const admin2 = '0x78514Eedd8678b8055Ca19b55c2711a6AACc09F8';
const admin3 = '0xfa82e8Bb8517BE31f64fe517E1E63B87183414Ad';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Masset = artifacts.require("Masset");

    //const Token = artifacts.require("Token");
    //const token = await Token.at(tokenAddress);
    //console.log('token owner: ', await token.owner());

    //const newMasset = await Masset.at(newMassetAddress);

    const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");
    const thresholdProxyAdmin = await ThresholdProxyAdmin.at(thresholdProxyAdminAddress);
/*
    try {
        await thresholdProxyAdmin.retract({ from: admin1 });
    } catch(ex) {
        // console.log(ex);
    }
    try {
        await thresholdProxyAdmin.retract({ from: admin2 });
    } catch(ex) {
        // console.log(ex);
    }
*/
/*
    console.log(1);
    await thresholdProxyAdmin.propose(1, newMassetAddress, '0x', { from: admin1 });
    console.log(2);
    await thresholdProxyAdmin.propose(1, newMassetAddress, '0x', { from: admin2 });
    console.log(3);
    await thresholdProxyAdmin.accept({ from: admin1 });
    console.log(4);
*/
    const fake = await Masset.at(massetProxyAddress);
    console.log('token ', await fake.getToken());
    console.log('basket manager ', await fake.geBasketManager());
    console.log('bridge ', await fake.geBridge());

    //await fake.migrationV1(basketManagerAddress, tokenAddress, bridgeAddress);
}
