pragma solidity 0.5.17;

contract IMockImplementation {
    bool initialized = false;

    function initialize() public {
        initialized = true;
    }

    function isInitialized() public view returns(bool) {
        return initialized;
    }

    function getVersion() external pure returns(string memory);
}

contract MockProxyImplementation1 is IMockImplementation {
    function getVersion() external pure returns (string memory) {
        return "1";
    }
}

contract MockProxyImplementation2 is IMockImplementation {
    function getVersion() external pure returns (string memory) {
        return "2";
    }
}
