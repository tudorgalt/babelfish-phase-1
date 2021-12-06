import { expectRevert } from "@openzeppelin/test-helpers";
import { toWei } from "web3-utils";
import { TokenInstance } from "types/generated";

const Token = artifacts.require("Token");
const MockCallReceiver = artifacts.require("MockCallReceiver");

contract("Token", async (accounts) => {
    const [owner, user, receiver, forwarder, paymaster] = accounts;

    let token: TokenInstance;

    before("before all", async () => {
        token = await Token.new("Test Token", "TT", 18, forwarder, paymaster);
    });

    describe("mint", async () => {
        context("should succeed", async () => {
            it("when it's called by owner", async () => {
                await token.mint(user, toWei("100"), { from: owner });
            });
        });

        context("should fail", async () => {
            it("when it's not called by owner", async () => {
                await expectRevert(token.mint(user, toWei("100"), { from: user }), "caller is not the owner");
            });
        });
    });

    describe("burn", async () => {
        context("should succeed", async () => {
            it("when it's called by owner", async () => {
                await token.burn(user, toWei("50"), { from: owner });
            });
        });

        context("should fail", async () => {
            it("when it's not called by owner", async () => {
                await expectRevert(token.burn(user, toWei("50"), { from: user }), "caller is not the owner");
            });
        });
    });

    describe("approveAndCall", async () => {
        context("should succeed", async () => {
            it("always", async () => {
                const amount = 10000000;
                const mockCallReceiver = await MockCallReceiver.new();

                await token.approveAndCall(mockCallReceiver.address, amount, "0x");

                const allowance = await token.allowance(owner, mockCallReceiver.address);
                assert(allowance.toNumber() === amount);
            });
        });
    });

    describe("revokePaymaster", async () => {
        context("should succeed", async () => {
            it("when called", async () => {
                await token.revokePaymaster(true, { from: user });
                let revoked = await token.paymasterRevoked(user);
                assert(revoked === true);
                await token.revokePaymaster(false, { from: user });
                revoked = await token.paymasterRevoked(user);
                assert(revoked === false);
            });
        });
    });

    describe("transferFrom", async () => {
        const amount = "1000000";

        beforeEach(async () => {
            await token.mint(user, amount);
        });
        context("should succeed", async () => {
            it("when from paymaster and not revoked", async () => {
                const initialBalance = await token.balanceOf(paymaster);
                await token.transferFrom(user, paymaster, amount, { from: paymaster });
                const finalBalance = await token.balanceOf(paymaster);
                assert(finalBalance.sub(initialBalance).toNumber() === parseInt(amount, 10));
            });

            it("when not from paymaster and allowance", async () => {
                await token.approve(receiver, amount, { from: user });
                const initialBalance = await token.balanceOf(paymaster);
                await token.transferFrom(user, paymaster, amount, { from: receiver });
                const finalBalance = await token.balanceOf(paymaster);
                assert(finalBalance.sub(initialBalance).toNumber() === parseInt(amount, 10));
            });
        });

        context("should fail", async () => {
            it("when not from paymaster and no allowance", async () => {
                await expectRevert(
                    token.transferFrom(user, paymaster, amount, { from: receiver }),
                    "ERC20: transfer amount exceeds allowance"
                );
            });

            it("when from paymaster and revoked", async () => {
                await token.revokePaymaster(true, { from: user });
                await expectRevert(
                    token.transferFrom(user, paymaster, amount, { from: paymaster }),
                    "ERC20: transfer amount exceeds allowance"
                );
            });
        });
    });

    describe("_msgSender", async () => {
        const amount = "100000";
        let data: string;

        beforeEach(async () => {
            await token.mint(user, amount);
            // Call data for a transfer transaction for `amount` to `receiver`
            data = web3.eth.abi.encodeFunctionCall(
                {
                    name: "transfer",
                    type: "function",
                    inputs: [
                        {
                            type: "address",
                            name: "recipient"
                        },
                        {
                            type: "uint256",
                            name: "amount"
                        }
                    ]
                },
                [receiver, amount]
            );
        });

        context("should succeed", async () => {
            it("when from address is appended to data and sender is trusted forwarder", async () => {
                // Append the address of `user` so the contract will consider it is the sender
                const dataWithAddress = data + user.substr(2);

                // Transaction object with `forwarder` as sender
                const rawTransaction = {
                    from: forwarder,
                    to: token.address,
                    data: dataWithAddress
                };

                const initialBalance = await token.balanceOf(receiver);
                await web3.eth.sendTransaction(rawTransaction);
                const finalBalance = await token.balanceOf(receiver);

                assert(finalBalance.sub(initialBalance).toNumber() === parseInt(amount, 10));
            });

            it("when no address appended to data and sender is not trusted forwarder", async () => {
                // Transaction object with `user` as sender
                const rawTransaction = {
                    from: user,
                    to: token.address,
                    data
                };

                const initialBalance = await token.balanceOf(receiver);
                await web3.eth.sendTransaction(rawTransaction);
                const finalBalance = await token.balanceOf(receiver);

                assert(finalBalance.sub(initialBalance).toNumber() === parseInt(amount, 10));
            });
        });

        context("should fail", async () => {
            it("when from address is appended to data and sender is not trusted forwarder", async () => {
                // Append the address of `user` so the contract will consider it is the sender
                const dataWithAddress = data + user.substr(2);

                // Transaction object with `receiver` as sender
                const rawTransaction = {
                    from: receiver,
                    to: token.address,
                    data: dataWithAddress
                };

                const initialBalance = await token.balanceOf(receiver);
                // Won't make the test fail
                await web3.eth.sendTransaction(rawTransaction);
                const finalBalance = await token.balanceOf(receiver);

                // The transaction is supposed to be reverted so no change for the balance
                assert(finalBalance.sub(initialBalance).toNumber() === 0);
            });
        });
    });
});
