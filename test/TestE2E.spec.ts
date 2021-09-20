import { deployments, network, run } from "hardhat";

import envSetup from "@utils/env_setup";
import { BN, tokens } from "@utils/tools";
import { FEE_PRECISION, ZERO } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { isDevelopmentNetwork } from 'migrations/utils/addresses';
import { setNetwork, getDeployed, clearState } from "migrations/utils/state";
import { BasketManagerV4Instance, MassetV4Instance } from "types/generated";
import { DeploymentTags } from "migrations/utils/DeploymentTags";

const ERC20 = artifacts.require("ERC20");
const MassetV4 = artifacts.require("MassetV4");
const Token = artifacts.require("Token");
const BasketManagerV4 = artifacts.require("BasketManagerV4");

const { expect } = envSetup.configure();

const instance = "XUSD";

contract("E2E test", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let massetMock: MassetV4Instance;
    let basketManagerMock: BasketManagerV4Instance;

    before("before all", async () => {
        setNetwork(network.name);

        if (isDevelopmentNetwork(network.name)) {
            // run migrations
            await clearState();
            await deployments.fixture(DeploymentTags.Migration);
        }

        massetMock = await getDeployed(MassetV4, `${instance}_MassetProxy`);
        basketManagerMock = await getDeployed(BasketManagerV4, `${instance}_BasketManagerProxy`);

        if (isDevelopmentNetwork(network.name)) {
            // set fees
            await massetMock.setDepositFee(new BN(5));
            await massetMock.setWithdrawalFee(new BN(10));
        }
    });

    it("full flow", async () => {
        const tokenAddress = await massetMock.getToken();
        const token = await Token.at(tokenAddress);

        const feesVaultAddress = await massetMock.getFeesVault();
        const rewardsVaultAddress = await massetMock.getRewardsVault();

        expect(await massetMock.getVersion()).to.eq("4.0", "should be upgraded to proper version");
        expect(await basketManagerMock.getVersion()).to.eq("4.0", "should be upgraded to proper version");

        const [basset1] = await basketManagerMock.getBassets();
        const basset1Token = await ERC20.at(basset1);

        // initial balances
        const initialUserMassetBalance = await token.balanceOf(sa.default);
        const initialUserBasset1Balance = await basset1Token.balanceOf(sa.default);
        const initialFeesVaultBalance = await token.balanceOf(feesVaultAddress);
        const initialRewardsVaultBalance = await token.balanceOf(rewardsVaultAddress);
        const depositFeePromil = await massetMock.getDepositFee();
        const redeemFeePromil = await massetMock.getWithdrawalFee();

        // -------------------------------- DEPOSIT -------------------------------- //

        const depositAmount = tokens(10);
        const [depositAmountInMasset] = await basketManagerMock.convertBassetToMassetQuantity(basset1, depositAmount);
        const depositFee = depositAmountInMasset.mul(depositFeePromil).div(FEE_PRECISION);
        const depositReward = new BN(0); // !! call to RewardsManagerContract to get proper amount of reward !!

        const hasEnoughFunds = initialUserBasset1Balance.gte(depositAmount);
        expect(hasEnoughFunds).to.eq(true, "basset balance is not sufficient");

        await basset1Token.approve(massetMock.address, depositAmount);
        await massetMock.mint(basset1, depositAmount);

        // -- check balances after deposit --

        const basset1BalanceAfterDeposit = await basset1Token.balanceOf(sa.default);
        const massetBalanceAfterDeposit = await token.balanceOf(sa.default);

        const vaultDepositRewardIncome = depositReward.lt(ZERO) ? depositReward : ZERO;

        expect(basset1BalanceAfterDeposit).bignumber.to.eq(
            initialUserBasset1Balance.sub(depositAmount),
            "tokens should be transfered"
        );
        expect(await token.balanceOf(feesVaultAddress)).bignumber.to.eq(
            initialFeesVaultBalance.add(depositFee),
            "deposit fee should be charged"
        );
        expect(await token.balanceOf(rewardsVaultAddress)).bignumber.to.eq(
            initialRewardsVaultBalance.add(vaultDepositRewardIncome),
            "proper rewards distribution "
        );
        expect(massetBalanceAfterDeposit).bignumber.to.eq(
            initialUserMassetBalance.add(depositAmountInMasset).sub(depositFee).add(depositReward),
            "user should get proper amount of masset"
        );

        // -------------------------------- REDEEM -------------------------------- //

        const redeemAmount = tokens(5);
        const redeemFee = redeemAmount.mul(redeemFeePromil).div(FEE_PRECISION);
        const [redeemedBassets] = await basketManagerMock.convertMassetToBassetQuantity(basset1, redeemAmount.sub(redeemFee));
        const redeemReward = new BN(0); // !! call to RewardsManagerContract to get proper amount of reward !!

        await token.approve(massetMock.address, redeemAmount);
        await massetMock.redeem(basset1, redeemAmount);

        // -- check balances after redeem --

        const basset1BalanceAfterRedeem = await basset1Token.balanceOf(sa.default);
        const massetBalanceAfterRedeem = await token.balanceOf(sa.default);

        const vaultRedeemRewardIncome = redeemReward.lt(ZERO) ? redeemReward : ZERO;

        expect(basset1BalanceAfterRedeem).bignumber.to.eq(
            basset1BalanceAfterDeposit.add(redeemedBassets),
            "tokens should be transfered"
        );
        expect(await token.balanceOf(feesVaultAddress)).bignumber.to.eq(
            initialFeesVaultBalance.add(depositFee).add(redeemFee),
            "withdrawal fee should be charged"
        );
        expect(await token.balanceOf(rewardsVaultAddress)).bignumber.to.eq(
            initialRewardsVaultBalance.add(vaultDepositRewardIncome).add(vaultRedeemRewardIncome),
            "proper rewards distribution"
        );
        expect(massetBalanceAfterRedeem).bignumber.to.eq(
            massetBalanceAfterDeposit.sub(redeemAmount).add(redeemReward),
            "masset balance is invalid"
        );

        const sumOfVaults = depositFee
            .add(vaultDepositRewardIncome)
            .add(redeemFee)
            .add(vaultRedeemRewardIncome);

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
