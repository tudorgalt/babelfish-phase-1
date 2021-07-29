import { deployments, network } from "hardhat";

import envSetup from "@utils/env_setup";
import { BN, tokens } from "@utils/tools";
import { FEE_PRECISION } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { isDevelopmentNetwork } from 'migrations/utils/addresses';
import { setNetwork, getDeployed, clearState } from "migrations/utils/state";
import { BasketManagerV3Instance, MassetV3Instance } from "types/generated";

const ERC20 = artifacts.require("ERC20");
const MassetV3 = artifacts.require("MassetV3");
const Token = artifacts.require("Token");
const BasketManagerV3 = artifacts.require("BasketManagerV3");

const { expect } = envSetup.configure();

const instance = "XUSD";

contract("E2E test", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let massetMock: MassetV3Instance;
    let basketManagerMock: BasketManagerV3Instance;

    before("before all", async () => {
        setNetwork(network.name);

        if (isDevelopmentNetwork(network.name)) {
            // run migrations
            clearState();
            await deployments.fixture("migration");
        }

        massetMock = await getDeployed(MassetV3, `${instance}_MassetProxy`);
        basketManagerMock = await getDeployed(BasketManagerV3, `${instance}_BasketManagerProxy`);

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
        const rewardsVaultAddress = await massetMock.getFeesVault();

        expect(await massetMock.getVersion()).to.eq("3.0", "should be upgraded to proper version");
        expect(await basketManagerMock.getVersion()).to.eq("3.0", "should be upgraded to proper version");

        const [basset1] = await basketManagerMock.getBassets();
        const basset1Token = await ERC20.at(basset1);

        // initial balances
        const initialUserBasset1Balance = await basset1Token.balanceOf(sa.default);
        const initialFeesVaultBalance = await basset1Token.balanceOf(tokenAddress);
        const depositFeePromil = await massetMock.getDepositFee();
        const redeemFeePromil = await massetMock.getWithdrawalFee();

        // ---------------- deposit ---------------- //

        const depositAmount = tokens(10);
        const depositAmountInMasset = await basketManagerMock.convertBassetToMassetQuantity(basset1, depositAmount);
        const depositFee = depositAmountInMasset.mul(depositFeePromil).div(FEE_PRECISION);

        await basset1Token.approve(massetMock.address, depositAmount);
        await massetMock.mint(basset1, depositAmount);

        expect(await basset1Token.balanceOf(sa.default)).bignumber.to.eq(
            initialUserBasset1Balance.sub(depositAmount),
            "tokens should be transfered"
        );
        expect(await token.balanceOf(feesVaultAddress)).bignumber.to.eq(
            initialFeesVaultBalance.add(depositFee),
            "deposit fee should be charged"
        );

        // TODO: CHECK REWARDS | ASSERT PROPER BALANCE AFTER DEPOSIT
        const basset1BalanceAfterDeposit = await basset1Token.balanceOf(sa.default);
        const massetBalanceAfterDeposit = await token.balanceOf(sa.default);

        // ---------------- redeem ---------------- //

        const redeemAmount = tokens(5);
        const redeemFee = redeemAmount.mul(redeemFeePromil).div(FEE_PRECISION);

        await token.approve(massetMock.address, redeemAmount);
        await massetMock.redeem(basset1, redeemAmount);

        expect(await token.balanceOf(feesVaultAddress)).bignumber.to.eq(
            initialFeesVaultBalance.add(depositFee).add(redeemFee),
            "withdrawal fee should be charged"
        );

        // TODO: CHECK REWARDS | ASSERT PROPER BALANCE AFTER DEPOSIT
        const basset1BalanceAfterWithdrawal = await basset1Token.balanceOf(sa.default);
        const massetBalanceAfterWithdrawal = await token.balanceOf(sa.default);
    });
});
