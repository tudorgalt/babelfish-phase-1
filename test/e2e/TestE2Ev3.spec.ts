import { deployments, network } from "hardhat";

import envSetup from "@utils/env_setup";
import { tokens } from "@utils/tools";
import { FEE_PRECISION } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { isDevelopmentNetwork } from 'migrations/utils/addresses';
import { setNetwork, getDeployed, clearState } from "migrations/utils/state";
import { FeesManagerInstance, MassetV3Instance, BasketManagerV3Instance } from "types/generated";
import { DeploymentTags } from "migrations/utils/DeploymentTags";

const ERC20 = artifacts.require("ERC20");
const MassetV3 = artifacts.require("MassetV3");
const Token = artifacts.require("Token");
const BasketManagerV3 = artifacts.require("BasketManagerV3");
const FeesManager = artifacts.require("FeesManager");

const { expect } = envSetup.configure();

const instance = "XUSD";

contract("version 3 E2E test", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let massetMock: MassetV3Instance;
    let basketManagerMock: BasketManagerV3Instance;
    let feesmanagerMock: FeesManagerInstance;

    before("before all", async () => {
        setNetwork(network.name);

        if (isDevelopmentNetwork(network.name)) {
            // run migrations
            await clearState();
            await deployments.fixture([DeploymentTags.V2, DeploymentTags.V3]);
        }

        massetMock = await getDeployed(MassetV3, `${instance}_MassetProxy`);
        basketManagerMock = await getDeployed(BasketManagerV3, `${instance}_BasketManagerProxy`);
        feesmanagerMock = await getDeployed(FeesManager, `${instance}_FeesManagerProxy`);
    });

    it("full flow", async () => {
        const tokenAddress = await massetMock.getToken();
        const token = await Token.at(tokenAddress);

        const feesVaultAddress = await massetMock.getFeesVault();

        expect(await massetMock.getVersion()).to.eq("3.0", "should be upgraded to proper version");
        expect(await basketManagerMock.getVersion()).to.eq("3.0", "should be upgraded to proper version");

        const [basset1] = await basketManagerMock.getBassets();
        const basset1Token = await ERC20.at(basset1);

        // initial balances
        const initialUserMassetBalance = await token.balanceOf(sa.default);
        const initialUserBasset1Balance = await basset1Token.balanceOf(sa.default);
        const initialFeesVaultBalance = await token.balanceOf(feesVaultAddress);
        const depositFeePromil = await feesmanagerMock.getDepositFee();
        const redeemFeePromil = await feesmanagerMock.getWithdrawalFee();

        // -------------------------------- DEPOSIT -------------------------------- //

        const depositAmount = tokens(10);
        const [depositAmountInMasset] = await basketManagerMock.convertBassetToMassetQuantity(basset1, depositAmount);
        const depositFee = depositAmountInMasset.mul(depositFeePromil).div(FEE_PRECISION);

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
        expect(await token.balanceOf(feesVaultAddress)).bignumber.to.eq(
            initialFeesVaultBalance.add(depositFee),
            "deposit fee should be charged"
        );
        expect(massetBalanceAfterDeposit).bignumber.to.eq(
            initialUserMassetBalance.add(depositAmountInMasset).sub(depositFee),
            "user should get proper amount of masset"
        );

        // -------------------------------- REDEEM -------------------------------- //

        const redeemAmount = tokens(5);
        const redeemFee = redeemAmount.mul(redeemFeePromil).div(FEE_PRECISION);
        const massetsToTake = redeemAmount.sub(redeemFee);
        const [redeemedBassets, takenMassets] = await basketManagerMock.convertMassetToBassetQuantity(basset1, massetsToTake);

        await token.approve(massetMock.address, redeemAmount);
        await massetMock.redeem(basset1, redeemAmount);

        // -- check balances after redeem --

        const basset1BalanceAfterRedeem = await basset1Token.balanceOf(sa.default);
        const massetBalanceAfterRedeem = await token.balanceOf(sa.default);

        const reminder = massetsToTake.sub(takenMassets);

        expect(basset1BalanceAfterRedeem).bignumber.to.eq(
            basset1BalanceAfterDeposit.add(redeemedBassets),
            "tokens should be transfered"
        );
        expect(await token.balanceOf(feesVaultAddress)).bignumber.to.eq(
            initialFeesVaultBalance.add(depositFee).add(redeemFee),
            "withdrawal fee should be charged"
        );

        expect(massetBalanceAfterRedeem).bignumber.to.eq(
            massetBalanceAfterDeposit.sub(redeemAmount).add(reminder),
            "masset balance is invalid"
        );

        const sumOfVaults = depositFee
            .add(redeemFee);

        const initialSumOfFunds = (await basketManagerMock.convertBassetToMassetQuantity(basset1, initialUserBasset1Balance))[0]
            .add(initialUserMassetBalance);

        const sumOfUserFundsAfterRedeem = (await basketManagerMock.convertBassetToMassetQuantity(basset1, basset1BalanceAfterRedeem))[0]
            .add(massetBalanceAfterRedeem);

        expect(initialSumOfFunds).bignumber.to.eq(
            sumOfUserFundsAfterRedeem.add(sumOfVaults),
            "sum of funds in the system should be the same as before test"
        );
    });
});
