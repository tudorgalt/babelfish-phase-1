import { expectRevert } from "@openzeppelin/test-helpers";
import { toWei } from "web3-utils";
import { MyntTokenInstance } from "types/generated";

const MyntToken = artifacts.require("MyntToken");

contract("MyntToken", async (accounts) => {
    const [owner, user, marketMaker, presale] = accounts;

    let token: MyntTokenInstance;

    before("before all", async () => {
        token = await MyntToken.new({ from: owner});
        await token.setMarketMaker(marketMaker, { from: owner });
        await token.setPresale(presale, { from: owner });
    });

    describe("mint", async () => {
        context("should fail", async () => {
            it("when it's not called by presale or market maker", async () => {
                await expectRevert(
                    token.mint(user, toWei("100"), { from: user }),
                    "not allowed",
                );
            });
        });

        context("should succeed", async () => {
            it("when it's called by presale", async () => {
                await token.mint(user, toWei("100"), { from: presale });
            });
            it("when it's called by marketMaker", async () => {
                await token.mint(user, toWei("100"), { from: marketMaker });
            });
        });
    });

    describe("burn", async () => {
        context("should fail", async () => {
            it("when it's not called by presale or by a user", async () => {
                await expectRevert(
                    token.burn(user, toWei("50"), { from: owner }),
                    "not allowed",
                );
            });
        });

        context("should succeed", async () => {
            it("when it's called by the market maker", async () => {
                await token.mint(user, toWei("50"), { from: marketMaker });
                await token.burn(user, toWei("50"), { from: marketMaker });
            });
            it("when it's called by the user for his own tokens", async () => {
                await token.mint(user, toWei("50"), { from: marketMaker });
                await token.burn(user, toWei("50"), { from: user });
            });
        });

    });
});
