import { deployments, network } from "hardhat";

import envSetup from "@utils/env_setup";
import { tokens } from "@utils/tools";
import { StandardAccounts } from "@utils/standardAccounts";
import { Instances, isDevelopmentNetwork } from 'migrations/utils/addresses';
import { setNetwork, getDeployed, clearState } from "migrations/utils/state";
import { MassetV4Instance, BasketManagerV4Instance } from "types/generated";
import { DeploymentTags } from "migrations/utils/DeploymentTags";

const ERC20 = artifacts.require("ERC20");
const MassetV4 = artifacts.require("MassetV4");
const Token = artifacts.require("Token");
const BasketManagerV4 = artifacts.require("BasketManagerV4");

const { expect } = envSetup.configure();

const instance: Instances = "MYNT";

contract("version 4 E2E test", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let massetMock: MassetV4Instance;
    let basketManager: BasketManagerV4Instance;

    before("before all", async () => {
        setNetwork(network.name);

        if (isDevelopmentNetwork(network.name)) {
            // run migrations
            await clearState();
            await deployments.fixture([DeploymentTags.V2, DeploymentTags.V3]);
        }

        massetMock = await getDeployed(MassetV4, `${instance}_MassetProxy`);
        basketManager = await getDeployed(BasketManagerV4, `${instance}_BasketManagerV4`);
    });

    it("full flow", async () => {
        const tokenAddress = await massetMock.getToken();
        const token = await Token.at(tokenAddress);

        expect(await massetMock.getVersion()).to.eq("4.0", "should be upgraded to proper version");
        expect(await basketManager.getVersion()).to.eq("4.0", "should be upgraded to proper version");

        const [basset1] = await basketManager.getBassets();
        const basset1Token = await ERC20.at(basset1);

        // initial balances
        const initialUserMassetBalance = await token.balanceOf(sa.default);
        const initialUserBasset1Balance = await basset1Token.balanceOf(sa.default);

        // -------------------------------- DEPOSIT -------------------------------- //

        const depositAmount = tokens(10);
        const [depositAmountInMasset] = await basketManager.convertBassetToMassetQuantity(basset1, depositAmount);

        const hasEnoughFunds = initialUserBasset1Balance.gte(depositAmount);
        expect(hasEnoughFunds).to.eq(true, "basset balance is not sufficient");

        await basset1Token.approve(massetMock.address, depositAmount);
        await massetMock.mint(basset1, depositAmount);

        // -- check balances after deposit --

        const basset1BalanceAfterDeposit = await basset1Token.balanceOf(sa.default);
        const massetBalanceAfterDeposit = await token.balanceOf(sa.default);

        expect(basset1BalanceAfterDeposit).bignumber.to.eq(
            initialUserBasset1Balance.sub(depositAmount),
            "tokens should be transfered"
        );

        // -------------------------------- REDEEM -------------------------------- //

        const redeemAmount = tokens(5);
        const [redeemedBassets, takenMassets] = await basketManager.convertMassetToBassetQuantity(basset1, redeemAmount);

        await token.approve(massetMock.address, redeemAmount);
        await massetMock.redeem(basset1, redeemAmount);

        // -- check balances after redeem --

        const basset1BalanceAfterRedeem = await basset1Token.balanceOf(sa.default);
        const massetBalanceAfterRedeem = await token.balanceOf(sa.default);

        expect(basset1BalanceAfterRedeem).bignumber.to.eq(
            basset1BalanceAfterDeposit.add(redeemedBassets),
            "tokens should be transfered"
        );

        const initialSumOfFunds = (await basketManager.convertBassetToMassetQuantity(basset1, initialUserBasset1Balance))[0]
            .add(initialUserMassetBalance);

        const sumOfUserFundsAfterRedeem = (await basketManager.convertBassetToMassetQuantity(basset1, basset1BalanceAfterRedeem))[0]
            .add(massetBalanceAfterRedeem);
    });
});
