pragma solidity ^0.5.16;
import { Table } from "../Table.sol";

contract Table_24 is Table {
    address[] public addresses = [
        0x8a43e8F99ac07BcD68BF79bdCBD193757fdE65Ec,
0x8a463ED9F43Af67A72fb417bFB2C4047CA6a855b,
0x8a5187A77d3896C18dFE48C4B34Dac0a9eEEb89D,
0x8a556b640E6D4Cb16882c39B3b205FD36dd54DdB,
0x8a81A44103D8FdEC75eBE730bF53aC7Bd30cdf48,
0x8A85EFB08cEEB7Fa94bb3322763bBBFbBA154aEd,
0x8A90a67374Ced66b6698033869C19b32597FcB34,
0x8aa4785E233167e16F94676c38491B1391d40fa7,
0x8aa6E3140dF81b7b965775D7af3c466362644eFa,
0x8Ad34e8e5d9eeC5132E64430b072938f7Fea4bac,
0x8AE7070950FC8B4e7d7Ec4c7FC030988b5c02ff2,
0x8aE9e107EAfAd53e536807D0DfC62fA4AF4842e6,
0x8aeB5835d92cfE93EDe77faD7C93CB17b2d9231b,
0x8AEc22bc8db042c376Ed219bc36Ae1aF17FdfEeC,
0x8Af124f8DC85A0Fe43C5a4FDe3cb9fBDC03a6dbA,
0x8afc577d35929bE04945BF44993B2e66C3aEb332,
0x8b0fD6484Dc29691f1c9216E256945925092aC15,
0x8b13aEE492A857982a3A78a3543650E8C53ad221,
0x8b1634f5Eb88CF249feBf0d266d2689A7f1AA342,
0x8B3CB96f798a9ac37B46f2432257d454afA77397,
0x8b44D5Cc61750e94255E14C1c39F41256210646c,
0x8b46924A0d6D610A46CAf0a5D13DAbdD25B68645,
0x8b765a02a7F7D5D659e0328e66A65E8877be5fBa,
0x8B7cac4855C767a12E92Db2cC5b656c0a72Df72F,
0x8b9E1a49A4Ba4a6051f1DD185abb176884A8E8dF,
0x8BA00BE74561cF87aD4B7d69E52D4bBD5b83C7b6,
0x8Bb9f9a10559B0ec544fdB86F4357af7B21ADA36,
0x8bbC0882B98a403983b4144314a97bd94C484657,
0x8bc3491E7D5AE64ebb59f6A1D2d19d89b166021d,
0x8bCb0f003e68B8778c75f40861d54373847ec22D,
0x8bCeF13C3195C59Ee104625EC66d54C93B8EEF61,
0x8BDfA3E7c4F0fc2B162BbCbeA71e63B5302A11c0,
0x8bdfc5d2E1611B7565F5D58D5CE4Ead446412aD0,
0x8BfB772983CDDF4403296d214F19c47778a24e25,
0x8c002592e11E3f8cc3c2db4a15618C7d67AC6fcd,
0x8C0b201F36F5ED56d6Ffaf918DeF6Ff3a86a9462,
0x8c1c963b372c3b86528DaB061055BA453dF67E44,
0x8C1D48E3cdf032D6738129CBfD701d167f2e2134,
0x8c1f5E4056B0FCC53D6A9231268854DB42C3496A,
0x8c22908E1FA26E5bD070899E38e00B34b533B63F,
0x8C460Ea1fFC2E494f44B65535DfFd0C7159128Fa,
0x8c478616d7f45a05cfFaE28d6Bc8fD2Da8A683f1,
0x8C5810938679770Fbe8352eb543a2471F0255Ce7,
0x8C6409615A2Ca9223476aa826008d8395DA89761,
0x8C64e51c9bCa21E2D2E4E9ecFE3Dc6499804A5f5,
0x8C661B3085777ef1Bd0B4f565C6A581789a5BdE6,
0x8c81b1Bec0D8046C177b415086F5dEd2d0162BA8,
0x8C8863975372a3A3b2e59d7a7FA8d656420f0ee5,
0x8C9354C9495812B619B8DC4a790D823f5b9E9e0B,
0x8c9FB3Fb6f8E0a4E6BDCaDb53e239eD584f2bdCb,
0x8cAc342DcD543FDDb7C291E13B14C265Ef4dCcf8,
0x8CB3D1e9ba08D258eC4E80d4A2Bc815e0b07e3F2,
0x8Cc4F1e23c34e5FD21107E46E21E8558f69B635F,
0x8cD3CDAC5F72E8A59317d653e5D35C08B151c589,
0x8Cd61931108bF5E467623b71a06cd2687e43a419,
0x8cf8DAa0e72ACA8fe5928A943C8C9096d14Fb237,
0x8d4826d55B0aa13e43d912fE04eCF78a8CB6a88A,
0x8D51cC24A8cA14d48982b9859077188a9a819671,
0x8d549dfa7eA7AbA384eC2B98f293E3D3c784Bdf9,
0x8d61bED27fB70B7805545b865F58c0238DafbCaB,
0x8D852702a091f4F78bc36Ec2A3242C17f2Bbf09A,
0x8d85Cd80bd195E182B825144D58b4aE0d800B632,
0x8D92888660A6EAFe0E3E7690A08373B2414D7EB9,
0x8d92fd0b59507fc89776ae4e77DED194EA876b6D,
0x8da4368654EAad65871b23069d1566b3712cB62D,
0x8da5b713890eBe4e080BB5E1f5c7F62eCe88Fcb4,
0x8dA6fCbf183F865e5e3db4b574b79800FebDC570,
0x8dB3bE4772E13c76FA170eEAB71118fbAF9e8045,
0x8DC693666b3a6f5028E32C54b987109CAc717010,
0x8DD8AAc24Fd5775A882089cd4b0Dd0fd8960e728,
0x8dEAa64Dd47F766B561A4ca767A2974FFC56f4cE,
0x8df7ea3068D3163d700ea4610FB9348bD4AfD230,
0x8E1C9F1c1a6b6a1C5ac02ee00848dDD8CeE6180a,
0x8E2d04B6Af5Fb2dF9CEBd4Bf34813E63Af529EdC,
0x8E2eb609f6dBA4cb220fba7666D2dEc34296D6af,
0x8E435f391982cFFa9c2164ae338105cE7CBd41b0,
0x8E55381c229479600c0796CacbB51dD053e4996F,
0x8E7C6faaCD4C30b0ea7E1982FDc9d003E3df3336,
0x8E8ec6222DB224C4456673373Cd5667c40Ee33b7,
0x8eA4574BA7Fc1803EAc18C7CF47cFd3E98F4a12F,
0x8eb6F99ef7Bb0bcdaBBE30126e0932E87b88d9f8,
0x8eBCb7ade69FB06C1e9f3fBCC06c0D2653D8Fcd6,
0x8EC1Efb8465E2f120D744936e3bBe45174910868,
0x8Ed63ABf801D1ea4c5E8ccb980883BFD7E21A2e2,
0x8Edf99d8a9FaCb03a5e8dfa9DB4E528dF1A2A2A4,
0x8eEA53Fc41B248AF0CB8DC72eC17EB2Caf9f32c0,
0x8f0D1D011Ef84DaD5810b8f6C8a2FE54EFa4d01e,
0x8f30B11067892772EdbE8A5eA5355C3CB59Be0C4,
0x8F3a35405F4fAD547c1DDAc898322616659724dF,
0x8f4030D8503f30aCc1246a63bBf06D380705c183,
0x8F5FEbEbE68991Cd553014e174af4F60E382624F,
0x8fA04d50aBba8d888bbBe57459Dde52aBE97F83A,
0x8FcDe195A7B32BA1D5C0e5D3a5D8Bdb9425c6d58,
0x8fDcF43ec42A6Ab0E73d288F74032F70962fbaCa,
0x8Fe248C19972559c1c554C6825ce4C724141aa06,
0x8FeBB77242f57e259666F777fDBC2485cd5455Af,
0x9004Cb741bc2b87877De9D5f819fAe5568f10449,
0x904061C0f227eF06BB6B7C82F423A133bB28b9C3,
0x904741012D539bef640ce16a8364d1C3c2c773a5,
0x904Ee3B250a3bc18a834F839d42970B2f5ACFD7F
    ];

    uint256[] public amounts = [
        1184431256694102450,
594000000000000000,
1658740932835657992514,
2430900000000000000000,
144096906803615482200,
11187894497821912276913,
5600000000000000000,
17603113655796308717864,
728688000000000000000,
1110651184123823583766,
829745606622749801111,
67210000000000000000,
10410175851795857970992,
118300582192325981500,
61137258622036583330,
705872516704688694547,
1540727100000000000000,
350000000000000000000,
3509419877639248492,
1660531743633610591128,
23459933417578628835,
29730309217804912759563,
2364748000000000000000,
9900000000000000000,
222982341276635524211,
5600000000000000000,
21006371507984896245,
50443650469030329500,
3316338796280731353313,
482112378416551156065,
20317536026886479001,
828,
2536620200274175662,
12466656492859912904760,
16067,
5135579293344289000000,
115469857112981196442,
124975956979795914721,
60562735624067869832,
80500000000000000000,
2737317404517460863164,
688535787805801454350,
811126248195838255700,
695396970082484860586,
303269824970499575932,
21000,
620741374469457285000,
508422350041084670400,
50395630535015966574,
24813233188399279381,
18889578642400755113812,
2567789645000000000000,
9042761024000000000000,
33000000000000000000,
10027260000000000000,
94371523768283245865,
9300000000000000000,
659294371405094500000,
105774413281555901335,
24869060285305119749,
56297469285231002400,
448000000000000000000,
51040016576401006982,
388112170112692790244,
44179504221857571000,
585005931679815353401,
32579158846437971685,
187050900000000000000,
62038324000000000000000,
18434623892145977257,
3184059159800000000000,
19360000000000000000000,
80092734668208117293,
54280444501286462246,
55862560396293378000,
179007567176056495259,
700000000000000000000,
10994,
91890258192480946431,
47928405777454709100,
796693871049736954562,
600406343580284353996,
158992280296859552088,
8429622961210356359664,
458841831174614432080,
64350000000000000000,
85155586497906660084,
990000000000000000000,
16716966262510941672511,
46651035876482629778,
19641689860309444978350,
51782449749726996072,
8832200000000000000000,
5600000000000000000,
26235112547125520806,
231215845503480659013,
7832356699389630558,
80856538687518134077,
62806387748528228542,
106304864420610284871
    ];

    uint256 public totalValue;
    uint256 public totalLength;

    constructor () public {
        totalLength = addresses.length;

        uint256 total = 0;
        for (uint256 i = 0; i < totalLength; i ++) {
            total += amounts[i];
        }

        totalValue = total;
    }

    function getRecipentInfo(uint256 index) public view returns(address, uint256, bool) {
        return (addresses[index], amounts[index], index == totalLength -1);
    } 

    function totalAmount() public view returns(uint256 total) {
        return totalValue;
    }

    function getSize() public view returns(uint256 size) {
        return totalLength;
    }

    function destroy() public onlyOwner {
        selfdestruct(msg.sender);
    }
}