pragma solidity ^0.5.16;
import { Table } from "../Table.sol";

contract Table_29 is Table {
    address[] public addresses = [
        0xA90ec5a79277dF482d344c2a7D95BaD9305f69d2,
0xA939AB24a70104C2abdf89d2b3caA0633e6b2178,
0xA93Ba26E8ccf94cbbFa308a7eF2d4f8F2caF540E,
0xa94454D6F5c90Ad18a2849275c04229E8354f391,
0xA97E3D39843c3454A4EC576165d6Ec1D9EF5E1bB,
0xa99Bed15Cc0AFd4fa13b0c89bc3D639E420c4Bf9,
0xA99C3e0e1D47Cd2fb62485A41CAb8Ca8F997E35D,
0xA9ab5a5E281d2DD0BA54bD1c3d95206ac7568CF0,
0xA9b0c16b23F036e5a5CAA249C301f1FF431E2A60,
0xa9B66050b923856E74c7868D266187b852729049,
0xA9bA9393e85106D708Ada13Cf12c5eBE3f6a7746,
0xa9CeF82Fe881b4F3e64C441d694f20c763bB0D95,
0xa9dbA1DEf83d92Bd2CA313DD449B514663a6e4e4,
0xA9De539a8965BAf21A19B95F802Fa59C19455015,
0xa9E3Cb8c8496d0ed9c7ADD3375D32FCF20fD70dd,
0xA9e8A657487C0A234F1dd79e52b53d9810f84baf,
0xA9F3830D57906C78EB5Da90bD8EB442b041aD1aE,
0xAa009096F4dea44748ae7fcb173f01EF92384269,
0xAa06274aB962c7fE31CD3244b85486ba02294844,
0xaa26cB9e66eDBAf69FeFC3F0847493fcec923734,
0xaa3C2fFDE0A2EAD16cd17DD820Aa0cF4A5a308CD,
0xAA45c7C94d3Dbf09e156906d606d8BdCce5c40e7,
0xaa613983FE3B8f56FfEe62b0B5eeE298Ec411b74,
0xaA63442D1a0054CA5AA5fa56ed5e4dEe87b504cF,
0xAa6Dc278F8798De8Fb00c43388428A8b756411C4,
0xaa74bB2847f69444Ad3F00Cfe86856Dda3F2F2F0,
0xaA7530686b5b9144D56b47d058Dc0330CE1EC95b,
0xaa75B8C9E01Ac2e9Fc041a39D36a6536540B2072,
0xAa788Ff2F5EB331F82a30dA69a2B3a18F61725F0,
0xAA80fA46977A32FE8f69F0e3765CD9197c1e288E,
0xaa861C33741A092F57d8b4a2145aBd2dfeE53540,
0xAaa3bDc6563c144eCC0222a7eFBE88aB9Da54C28,
0xaAB94954c6cb8750578E77BBD2Ce603a9ab35A25,
0xAABd24Aeb217E872F8A58968b550E2DC945388f2,
0xaAD4A4a165Ac449b59Ea68d81B97f1Eaf314D501,
0xAaD859940475f3c088477b59fd09C614ceeB57b6,
0xaADFC3502754DeCAf651F21f716aCedc25b0C133,
0xAaFD308B535BE3926c2A8FF22Ce9F9039107d2D7,
0xaaFdd768fA83EF7af0e19707F2BE9d1DB1924766,
0xAB020AB81d5d190A83880C0F24De769be58928B4,
0xAB068b99E95c96aAfCB007b36C919d653aB5046f,
0xAb0Ff351f6dF0197e8dd733EB7D00DA3628d9E34,
0xAb268E90200c9E899feA24E34512aD3D64ECda6e,
0xab33bbB308BDfF807f2Ae3Cba8eA4df1563B9415,
0xAb3F19f5ccB7E4780F0DaeFe1781BF9CacFAE973,
0xaB4a94857367AA0df7818b9f52ebf514289906DF,
0xAB65F166635FC971fb0E8Aa9d0204EC21Cb67B80,
0xaB6c2F14cd845bc9E5CF71497Ab41569Ef1d8029,
0xaB983528f2A152A01385d67111499aBb7166C488,
0xAbb98eE5c3dcCbCE63Cac4fcE83b55889d8344dD,
0xABBDB0624d25BD1CB49b1c3bfB0d2e4ea5c30cE0,
0xABBF8a9D5B5BfB455890c6c79C139fe1f6e95D42,
0xabcA46C0Ceb48C9dF280B20D8D097D45290D1C9b,
0xaBD64F6F5E91D42379F0d2F53606B98597AA1721,
0xaBd9Ccebd132d2D99ac97cfb95156bFf9acFFbDf,
0xAbf66b500B1C8027eFB51910dBda297A88d35972,
0xAbfB9C6e344aD3b2b41C18E3821cAEAb83EBB390,
0xac05bc19982a305f158DBb0855B163f949548811,
0xAC0D2c5CF6022AAEE4Cb41baD89f5463843eE7dE,
0xac111E501BF5540E2E9339E20BF5f42B910C3213,
0xAC17C6F9a345950D8b5Bf3eeb6DcBf7B112113dc,
0xAc186B1Fd840Aa1CA0936f834Af77017F5F4ECAC,
0xac228599C6acB688525d71b8e458DBDfCc7A2D64,
0xAc318AA66dC5445D48Fa01b5a6a4fcEC5cafaC6e,
0xaC3D3D613C7A5d093a27864dfa243a4c6229C08D,
0xAC4BA08898213273B62045d4031F1273E33F4163,
0xaC58E8b170491cd5b219214fcC96268CeC8c06aF,
0xac84B87E80670c1cdd88d177F1AF9AE0beEF4914,
0xAc875D8D94167e273044BD2295434B971a126617,
0xaC890236A54D783CD5967059d28eb0991416bAE1,
0xAC988B93303bdB8b16B4971b089a36bDB2F6e127,
0xACACeeBd6F6f224e9A9f0A62702AaAa0a4385fbf,
0xACacf1Ddc60e7d8f7952d1469879D510cE2d25F6,
0xaCb43F6FF53e3C20857EE47e78c3E20006c2CD1E,
0xAcc5c59d3644477de86337B820E3eA58f9977E9c,
0xaCeB022968D5351275d7380CEEFA7211764A5376,
0xAcEE405817131e247282F03569ceE69d58295009,
0xad098B92AF9a7347cbedd3Cf02819A35A76076f4,
0xAD0A733AE4618c460b4fC646D574E5022Bf2D08E,
0xAD1F2CdFB1d3d596ECB7fc869d37c02954fc672F,
0xAD25005f53eF1e89bB5f53C6a6520b1C6bBCF998,
0xaD334dFA23A2b06d31d53092b9E429BB2EeE99A6,
0xAD4166C6204025cE9676c7b0c9b9Fe7eb8E946c4,
0xaD5205fc6ec6656bfB1d5Eaab8A6813F962e5FFb,
0xAD5FCaff8fbEE929607ebF82664d6e3B6eE496a7,
0xaD94821279599cf33B13f598c385f85cD98daA8b,
0xad9C31757aB2F8C4247fa3Bb578946DbFAdb1c3a,
0xad9ECc0ef0FE1f1b68B9b496cf5f8A93D47fA1AB,
0xADaB2B23467E90b6e7168a5b3B2F6e825b96C9e7,
0xaDb8F994bBce44db218Dab4972f669643A6BdD6F,
0xADB9C4D8c481e2174A76Fb3DE55226Bf40CafBBb,
0xAe18fFbC542a27197B2EDeE3066Dc90220F779E9,
0xAE30d834bE2Dc2f67d809DDe43eeEc346BbA892a,
0xAe3509F122e05cDBa014b3DbA497153795cdD18D,
0xAe45B6A176971eA41F3047dDD1333aEf2Ec9f8ef,
0xAE4a1F18F2461BA512231D0a4198DA419b23EDB3,
0xAe59e3bfFF77E84B6acE014e3200510F874437E8,
0xae7ED921892C0c1B7B6ef95f4B1cA84E70a0f6Db,
0xAe8C5C72b63f7b060058E222a159Fcfd9c5Cf5F7,
0xaE99D2D0ac7ae577968900F744153f19021999Db
    ];

    uint256[] public amounts = [
        94242164071436762913,
52145079530495720993,
275000000000000000000,
1475100000000000000000,
1106320345165327786556,
189314641241568407466,
3500000000000000000,
2500000000000000000,
2929660905505340985000,
10167300000000000000000,
2400984393164053663426,
11711153507986667920968,
204185887607385937537,
6293008198793593911333,
12800000000000000000,
23907329456290793911,
810000000000000000000,
394,
43954566436071467228,
1247100073006089075350,
26153214813294984000,
38157755150664505857,
33869450195271003103,
12565311093301711800,
101862170849837237301,
3284946320074611422689,
9900000000000000000,
857582000000000000000,
11936681504334504750,
532389505981827491474,
6361498629253971727609,
1064191531429745070000,
90732126923679774380,
12520000000000000000,
671385944301135127839,
98175134977587041002,
1444596173993426375000,
11567882972555739990,
332738079226690375065,
19819136989482336106,
8700000000000000000,
1047,
7089017834839770225000,
272631753624896318194,
1423212818405916060000,
3198230073952342160000,
119830786085938481400,
312018150686286224801,
282649849460504988856,
74743753550747548300,
14500000000000000000,
1115430600000000000000,
53008808602567947010,
9319628784000000000000,
1809754000000000000000,
139038845521774862400,
310500000000000000000,
31497996200000000000,
9952817928727470464836,
3595455505341002300000,
1153781251136280671506,
97922219660866981350,
1197556440627521516925,
34717794368301380322,
1352439511835820874808,
34850000000000000000,
570145623500804888,
49520172040969813065,
263618409902906785898,
1085519142974527452000,
7292522596548890930000,
667547943714050940000,
392200000000000000000,
24309152253287986360,
165000000000000000000,
2997593429153199119,
193629163617530765510,
169506000000000000000,
4400000000000000000,
57000000000000000000,
2500000000000000000,
280970912033271264640,
2978987823893643538221,
33694094647622559335,
11392069189568210250,
1853903559734958435255,
433434247315192626526,
2178244711486025556742,
1734897801972062300000,
461159638832522794549,
33500000000000000000,
19392978784527308725,
8758923393096835856725,
2371949342645850440000,
204259344574879873779,
6100000000000000000,
130319727131020386870,
1001499630238290796000,
46656890469076906274127,
330249172740334224553
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