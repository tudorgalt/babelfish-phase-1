pragma solidity ^0.5.16;

contract RbtcSender {
    function send(address payable _address) public payable {
        _address.send(msg.value);
    }
}
