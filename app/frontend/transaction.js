const _ = require('lodash');
var Web3 = require('web3');
var ethWallet = require('ethereumjs-wallet');
var ethUtil = require('ethereumjs-util');
const Tx = require('ethereumjs-tx');
var SolFunction = require('web3/lib/web3/function');
var Cookie = require('../backend/cookie-functions.js');
var cookie = Cookie.Cookie;

var SPXTokenAddress = '0x6321f5051b7ffedbd0f58f56f5b7dbfdb55e6413'; // link ropsten

var Sol_SPXTokenABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"tokens","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"exchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_recipient","type":"address"},{"name":"_voucherIDs","type":"bytes32[]"}],"name":"vouchers2Tokens","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_message","type":"bytes32"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"},{"name":"_voucherIDs","type":"bytes32[]"},{"name":"_value","type":"uint256[]"},{"name":"_timeStarts","type":"uint256[]"}],"name":"tokens2Vouchers","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getIcoAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"buy","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_recipient","type":"address"},{"name":"_value","type":"uint256"},{"name":"_ratePerETH","type":"uint256"}],"name":"transferTokens","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_icoAddress","type":"address"}],"name":"setIcoAddress","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"tokens","type":"uint256"},{"name":"data","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newExchangeRate","type":"uint256"}],"name":"setExchangeRate","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"tokenAddress","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transferAnyERC20Token","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"tokenOwner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"tokens","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"tokenOwner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"tokens","type":"uint256"}],"name":"Approval","type":"event"}];
var Sol_SPXTokenData = '0x606060405261961160025560126005556040805190810160405280600381526020017f312e300000000000000000000000000000000000000000000000000000000000815250600a90805190602001906200005c92919062000218565b5034156200006957600080fd5b6040516200261c3803806200261c83398101604052808051906020019091908051820191906020018051820191905050828282336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508060039080519060200190620000f492919062000218565b5081600490805190602001906200010d92919062000218565b50600554600a0a8302600681905550600654600860008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef6006546040518082815260200191505060405180910390a3505050505050620002c7565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200025b57805160ff19168380011785556200028c565b828001600101855582156200028c579182015b828111156200028b5782518255916020019190600101906200026e565b5b5090506200029b91906200029f565b5090565b620002c491905b80821115620002c0576000816000905550600101620002a6565b5090565b90565b61234580620002d76000396000f30060606040526004361061013e576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde0314610148578063095ea7b3146101d657806318160ddd14610230578063313ce567146102595780633ba0b9a914610282578063538eac9a146102ab57806354fd4d5014610379578063580768221461040757806370a082311461056957806379ba5097146105b65780638182692f146105cb5780638da5cb5b1461062057806395d89b4114610675578063a6f2ae3a14610703578063a9059cbb1461070d578063a9f7e66414610767578063bd792db3146107ca578063cae9ca511461081b578063d4ee1d90146108b8578063db068e0e1461090d578063dc39d06d14610948578063dd62ed3e146109a2578063e6aa216c14610a0e578063f2fde38b14610a37575b610146610a70565b005b341561015357600080fd5b61015b610cc6565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561019b578082015181840152602081019050610180565b50505050905090810190601f1680156101c85780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34156101e157600080fd5b610216600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610d64565b604051808215151515815260200191505060405180910390f35b341561023b57600080fd5b610243610e56565b6040518082815260200191505060405180910390f35b341561026457600080fd5b61026c610ea1565b6040518082815260200191505060405180910390f35b341561028d57600080fd5b610295610ea7565b6040518082815260200191505060405180910390f35b34156102b657600080fd5b610322600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001908201803590602001908080602002602001604051908101604052809392919081815260200183836020028082843782019150505050505091905050610ead565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b8381101561036557808201518184015260208101905061034a565b505050509050019250505060405180910390f35b341561038457600080fd5b61038c6111cb565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103cc5780820151818401526020810190506103b1565b50505050905090810190601f1680156103f95780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561041257600080fd5b610512600480803560001916906020019091908035600019169060200190919080356000191690602001909190803560ff16906020019091908035906020019082018035906020019080806020026020016040519081016040528093929190818152602001838360200280828437820191505050505050919080359060200190820180359060200190808060200260200160405190810160405280939291908181526020018383602002808284378201915050505050509190803590602001908201803590602001908080602002602001604051908101604052809392919081815260200183836020028082843782019150505050505091905050611269565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b8381101561055557808201518184015260208101905061053a565b505050509050019250505060405180910390f35b341561057457600080fd5b6105a0600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050611725565b6040518082815260200191505060405180910390f35b34156105c157600080fd5b6105c961176e565b005b34156105d657600080fd5b6105de61190d565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561062b57600080fd5b610633611997565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561068057600080fd5b6106886119bc565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156106c85780820151818401526020810190506106ad565b50505050905090810190601f1680156106f55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61070b610a70565b005b341561071857600080fd5b61074d600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050611a5a565b604051808215151515815260200191505060405180910390f35b341561077257600080fd5b6107b0600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091908035906020019091905050611c29565b604051808215151515815260200191505060405180910390f35b34156107d557600080fd5b610801600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050611c58565b604051808215151515815260200191505060405180910390f35b341561082657600080fd5b61089e600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001909190803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050611d25565b604051808215151515815260200191505060405180910390f35b34156108c357600080fd5b6108cb611f6b565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b341561091857600080fd5b61092e6004808035906020019091905050611f91565b604051808215151515815260200191505060405180910390f35b341561095357600080fd5b610988600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050612009565b604051808215151515815260200191505060405180910390f35b34156109ad57600080fd5b6109f8600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050612148565b6040518082815260200191505060405180910390f35b3415610a1957600080fd5b610a216121cf565b6040518082815260200191505060405180910390f35b3415610a4257600080fd5b610a6e600480803573ffffffffffffffffffffffffffffffffffffffff169060200190919050506121d9565b005b6000806000600254111515610a8457600080fd5b60003273ffffffffffffffffffffffffffffffffffffffff1614151515610aaa57600080fd5b60003414151515610aba57600080fd5b610ad5670de0b6b3a76400003461227890919063ffffffff16565b9150610af3600554600a0a600254028361229c90919063ffffffff16565b90506000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc349081150290604051600060405180830381858888f193505050501515610b5657600080fd5b610bc981600860008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122cd90919063ffffffff16565b600860008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610c7f81600860003273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122e990919063ffffffff16565b600860003273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505050565b60048054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610d5c5780601f10610d3157610100808354040283529160200191610d5c565b820191906000526020600020905b815481529060010190602001808311610d3f57829003601f168201915b505050505081565b600081600960003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b6000600860008073ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205460065403905090565b60055481565b60025481565b610eb5612305565b6000806000806000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141515610f1657600080fd5b6064865111151515610f2757600080fd5b600b60008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549350600084111515610f7857600080fd5b60009250600091505b855182101561105257600c60008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008784815181101515610fd957fe5b906020019060200201516000191660001916815260200190815260200160002090508060020160009054906101000a900460ff16151561101857600080fd5b600081600001541415151561102c57600080fd5b6110438160000154846122e990919063ffffffff16565b92508180600101925050610f81565b6110c583600860008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122cd90919063ffffffff16565b600860008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555061117b83600860008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122e990919063ffffffff16565b600860008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508594505050505092915050565b600a8054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156112615780601f1061123657610100808354040283529160200191611261565b820191906000526020600020905b81548152906001019060200180831161124457829003601f168201915b505050505081565b611271612305565b600080600080606488511115151561128857600080fd5b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff161415156112e357600080fd5b60018c8a8d8d604051600081526020016040526040518085600019166000191681526020018460ff1660ff1681526020018360001916600019168152602001826000191660001916815260200194505050505060206040516020810390808403906000865af1151561135457600080fd5b50506020604051035193506000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16141515156113bb57600080fd5b875187511415156113cb57600080fd5b60009250600091505b87518210156114fc57600c60008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000898481518110151561142c57fe5b906020019060200201516000191660001916815260200190815260200160002090506000816000015414151561146157600080fd5b868281518110151561146f57fe5b90602001906020020151816000018190555060018160020160006101000a81548160ff02191690831515021790555062278d0086838151811015156114b057fe5b906020019060200201510181600101819055506114ed87838151811015156114d457fe5b90602001906020020151846122e990919063ffffffff16565b925081806001019250506113d4565b8261150685611725565b11151561151257600080fd5b61156483600b60008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122e990919063ffffffff16565b600b60008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506115f983600860008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122cd90919063ffffffff16565b600860008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506116af83600860008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122e990919063ffffffff16565b600860008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555087945050505050979650505050505050565b6000600860008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415156117ca57600080fd5b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff166000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff1614151561196e5760009050611994565b600760009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690505b90565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60038054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015611a525780601f10611a2757610100808354040283529160200191611a52565b820191906000526020600020905b815481529060010190602001808311611a3557829003601f168201915b505050505081565b60008082111515611a6a57600080fd5b60008373ffffffffffffffffffffffffffffffffffffffff1614151515611a9057600080fd5b611ae282600860003273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122cd90919063ffffffff16565b600860003273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550611b7782600860008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546122e990919063ffffffff16565b600860008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905092915050565b600080611c3f838561229c90919063ffffffff16565b9050611c4b8582611a5a565b5060019150509392505050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141515611cb557600080fd5b60008273ffffffffffffffffffffffffffffffffffffffff1614151515611cdb57600080fd5b81600760006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060019050919050565b600082600960003273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508373ffffffffffffffffffffffffffffffffffffffff163273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925856040518082815260200191505060405180910390a38373ffffffffffffffffffffffffffffffffffffffff16638f4ffcb1328530866040518563ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018481526020018373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200180602001828103825283818151815260200191508051906020019080838360005b83811015611f02578082015181840152602081019050611ee7565b50505050905090810190601f168015611f2f5780820380516001836020036101000a031916815260200191505b5095505050505050600060405180830381600087803b1515611f5057600080fd5b5af11515611f5d57600080fd5b505050600190509392505050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141515611fee57600080fd5b600082111515611ffd57600080fd5b81600281905550919050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561206657600080fd5b8273ffffffffffffffffffffffffffffffffffffffff1663a9059cbb6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff16846040518363ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200182815260200192505050602060405180830381600087803b151561212957600080fd5b5af1151561213657600080fd5b50505060405180519050905092915050565b6000600960008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b6000600254905090565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561223457600080fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000808211151561228857600080fd5b818381151561229357fe5b04905092915050565b6000818302905060008314806122bc57508183828115156122b957fe5b04145b15156122c757600080fd5b92915050565b60008282111515156122de57600080fd5b818303905092915050565b600081830190508281101515156122ff57600080fd5b92915050565b6020604051908101604052806000815250905600a165627a7a72305820d147dd6fd2bd011e430e36815db37d333bc1097ece48611f090e20bd48ca06890029';

var Sol_SPXTROSInterface = [ { "constant": false, "inputs": [ { "name": "spender", "type": "address" }, { "name": "tokens", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "success", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_recipient", "type": "address" }, { "name": "_voucherIDs", "type": "bytes32[]" } ], "name": "vouchers2Tokens", "outputs": [ { "name": "", "type": "bytes32[]" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_message", "type": "bytes32" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" }, { "name": "v", "type": "uint8" }, { "name": "_voucherIDs", "type": "bytes32[]" }, { "name": "_value", "type": "uint256[]" }, { "name": "_timeStarts", "type": "uint256[]" } ], "name": "tokens2Vouchers", "outputs": [ { "name": "", "type": "bytes32[]" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "balance", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "buy", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": false, "inputs": [ { "name": "to", "type": "address" }, { "name": "tokens", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "success", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_recipient", "type": "address" }, { "name": "_value", "type": "uint256" }, { "name": "_ratePerETH", "type": "uint256" } ], "name": "transferTokens", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "tokenOwner", "type": "address" }, { "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "remaining", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "getExchangeRate", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "tokens", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "tokenOwner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "tokens", "type": "uint256" } ], "name": "Approval", "type": "event" } ];

//buy & sell
var decimals = 10 ** 18;
var transfer_from;
var transfer_to;
var amount;
var unit;

var LinkTestNet = 'https://ropsten.infura.io/Z4It2Ma8e6CaZDeRH2HB'; // link ropsten
var web3 = new Web3(new Web3.providers.HttpProvider(LinkTestNet));
var account;

window.Transaction = {
	refreshBalanceEther: function refreshBalanceEther(callback) {
    	account = document.getElementById('accountaddress_session').value;
    	if (account == undefined || account.length == 0) return;
    	web3.eth.getBalance(account, function (error, result) {
	      	if (!error) {
	        	var ether_balance = web3.fromWei(result, 'ether').valueOf();
	        	callback(ether_balance);
	      	} else {
	        	console.error(error);
	      	}
    	});
  	},

  	refreshBalanceSPXToken: function refreshBalanceSPXToken(callback) {
    	account = document.getElementById('accountaddress_session').value;
    	if (account == undefined || account.length == 0) return;
    	var eSPXInterface = web3.eth.contract(Sol_SPXTROSInterface);
    	var eSPXI = eSPXInterface.at(SPXTokenAddress);
    	eSPXI.balanceOf.call(account, { from: account }, function (err, value) {
	      	if (value) {
	        	balance = value.valueOf();
		        if (balance != web3.fromWei(value, "ether").valueOf()) {
		          	balance = web3.fromWei(value, "wei").valueOf() / 10 ** 18;
		          	callback(balance);
		        }
	      	}
    	});
  	},

  	loadBalanceWallet: function loadBalanceWallet() {
	    var eth = '';
	    var enc = '';
	    if (cookie.getCookie("ENC-balance")) {
	      enc = parseFloat(cookie.getCookie("ENC-balance"));
	    }
	    if (cookie.getCookie("ETH-balance")) {
	      eth = parseFloat(cookie.getCookie("ETH-balance"));
	    }

	    var balanceSPX1 = document.getElementById('balance_enc_tab1');
	    var balanceETH1 = document.getElementById('balance_eth_tab1');
	    var balanceSPX2 = document.getElementById('balance_enc_tab2');
	    var balanceETH2 = document.getElementById('balance_eth_tab2');
	    var rate1 = document.getElementById('rate1');
	    var rate2 = document.getElementById('rate2');
	    if (balanceSPX1) {
	      balanceSPX1.innerText = enc + ' SP8';
	    }
	    if (balanceSPX2) {
	      balanceSPX2.innerText = enc + ' SP8';
	    }
	    if (balanceETH1) {
	      balanceETH1.innerText = eth + ' ETH';
	    }
	    if (balanceETH2) {
	      balanceETH2.innerText = eth + ' ETH';
	    }

	    setTimeout(function(){
	      Transaction.refreshBalanceSPXToken(res => {
	        console.log(res);
	        if(res <= 0) return;
	        if (balanceSPX1) {
	          balanceSPX1.innerText = res + ' SP8';
	        }
	        if (balanceSPX2) {
	          balanceSPX2.innerText = res + ' SP8';
	        }
	      });

	      Transaction.refreshBalanceEther(res => {
	        console.log(res);
	        if(res <= 0) return;
	        if (balanceETH1) {
	          balanceETH1.innerText = res + ' ETH';
	        }
	        if (balanceETH2) {
	          balanceETH2.innerText = res + ' ETH';
	        }
	      });
	    }, 1000);

	    //get rate
	    if (account == undefined) return;
	    var eSPXInterface = web3.eth.contract(Sol_SPXTROSInterface);
	    var eSPXI = eSPXInterface.at(SPXTokenAddress);
	    eSPXI.getExchangeRate.call({ from: account }, function (err, value) {
	      console.log(err, value);
	      console.log(1 / value.valueOf());
	      if (rate1) {
	        rate1.innerHTML = 1 / value.valueOf() == Infinity ? 0 : 1 / value.valueOf();
	      }
	      if (rate2) {
	        rate2.innerHTML = 1 / value.valueOf() == Infinity ? 0 : 1 / value.valueOf();
	      }
	      var rate = document.getElementById('rate');
	      if(rate != undefined) {
	        rate.value = 1 / value.valueOf() == Infinity ? 0 : 1 / value.valueOf();
	      }
	    });
  },

	//validate transfer currency
  validate_transfer_currency: function validate_transfer_currency() {
    var eth = '';
    var enc = '';
    var role = document.getElementById('role').value;
    transfer_from = role;
    transfer_to = document.getElementById('transfer_to').value;
    amount = document.getElementById('receive_amount').value;
    var currency_type_select = document.getElementById('currency_type');
    unit = currency_type_select.options[currency_type_select.selectedIndex].value;
    var privateKey = document.getElementById('private_key').value;

    if (cookie.getCookie("ENC-balance")) {
      enc = parseFloat(cookie.getCookie("ENC-balance"));
    }
    if (cookie.getCookie("ETH-balance")) {
      eth = parseFloat(cookie.getCookie("ETH-balance"));
    }
    if (amount.length == 0 || parseFloat(amount) <= 0.0) {
      alert('Please enter correct amount');
      return false;
    }
    if (unit == 'ENC' && enc <= 0) {
      alert('Your balance is not enough');
      return false;
    } else if (unit == 'ENC' && parseFloat(amount) > enc) {
      alert('Your balance is not enough');
      return false;
    }
    if (unit == 'ETH' && eth <= 0) {
      alert('Your balance is not enough');
      return false;
    } else if (unit == 'ETH' && parseFloat(amount) > eth) {
      alert('Your balance is not enough');
      return false;
    }
    if (role.length == 0 || transfer_to.length == 0) {
      alert('Address invalid');
      return false;
    }
    if (role.length != 0 && privateKey.length == 64) {
      var myWallet = ethWallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      var walletAddress = myWallet.getAddressString();
      if (walletAddress != role) {
        alert('Your private key does not match');
        return false;
      }
    } else {
      alert('Your private key does not match');
      return false;
    }
    transfer_from = role;
    return true;
  },

  // deploy transaction
  deploy_transfer_currency: function deploy_transfer_currency() {
    var transfer_speed = $("input[name='transfer_speed']:checked").val();
    var privateKey = document.getElementById('private_key').value;
		if (privateKey.length != 64) {
			alert('Your private key does not match');
			return;
		}
    var wallet = ethWallet.fromPrivateKey(Buffer(privateKey, 'hex'));

    var gas = 1;
    if (transfer_speed == 'Fast') {
      gas = 10;
    } else if (transfer_speed == 'Normal') {
      gas = 4;
    }
    if (unit == 'ETH') {
      var rawTx = {
        from: wallet.getAddressString(),
        to: transfer_to.toLowerCase(),
        value: web3.toWei(amount, 'ether'),
        gasPrice: web3.toWei(gas, gasUnit)
      };

      var tx = new Tx(rawTx);
      tx.sign(Buffer(wallet.getPrivateKey(), 'hex'));
      var serialized = tx.serialize();

      web3.eth.sendRawTransaction('0x' + serialized.toString('hex'), function (err, hash) {
        console.log(err);
        if (hash) {
          this.create_new_transaction(hash);
        } else {
          alert('Deploy contract failed');
        }
      });
    } else if (unit == 'ENC') {
      var solFunction = new SolFunction('', _.find(Sol_SPXTROSInterface, { name: 'transfer' }), '');
      console.log(solFunction);

      var payloadData = solFunction.toPayload([transfer_to.toLowerCase(), amount * decimals]).data;
      console.log(payloadData);

      var gasPrice = web3.toWei(gas, gasUnit);
      var gasPriceHex = web3.toHex(gasPrice);
      var gasLimitHex = web3.toHex(gasLimitFunction);

      var nonce = web3.eth.getTransactionCount(wallet.getAddressString());
      var nonceHex = web3.toHex(nonce);

      var rawTx = {
        nonce: nonceHex,
        gasPrice: gasPriceHex,
        gasLimit: gasLimitHex,
        data: payloadData,
        from: wallet.getAddressString(),
        to: SPXTokenAddress
      };

      var tx = new Tx(rawTx);
      tx.sign(Buffer(wallet.getPrivateKey(), 'hex'));
      var serialized = tx.serialize();

      web3.eth.sendRawTransaction('0x' + serialized.toString('hex'), function (err, hash) {
        console.log(err, hash);
        if (hash) {
          Transaction.create_new_transaction(hash);
        } else {
          alert('Deploy contract failed');
        }
      });
    }
  },

  //save transaction to db
  create_new_transaction: function create_new_transaction(hash) {
    $.post('/create-transfer-amount', {
      txHash: hash,
      from_address: transfer_from.toLowerCase(),
      to_address: transfer_to.toLowerCase(),
      amount: amount,
      unit: unit,
      status: 1, //pending
      date_time: Date.now()
    }, function (data) {
      console.log(data);
      if (data.error == 0) {
        window.location.href = '/transactions';
      } else {
        alert("Error. Please try again.");
      }
    });
  },

  //validate buy transaction
  validate_buy_tokens: function validate_buy_tokens() {
    var eth_amount = document.getElementById('op_buy_enc').innerHTML;
    amount = parseFloat(eth_amount);
    if (amount <= 0.0) {
      alert('Amount invalid');
      return false;
    }
    return true;
  },

  //deploy buy transaction
  deploy_buy_tokens: function deploy_buy_tokens() {
    var privateKey = prompt('Please enter your private key');
    if (privateKey && privateKey.length == 64) {
      var wallet = ethWallet.fromPrivateKey(Buffer(privateKey, 'hex'));
      var solFunction =  new SolFunction('', _.find(Sol_SPXTROSInterface, { name: 'buy' }), '');
      console.log(solFunction);

      var payloadData = solFunction.toPayload([]).data;
      console.log(payloadData);

      var gasPrice = web3.toWei(gasPriceDefault, gasUnit);
      var gasPriceHex = web3.toHex(gasPrice);
      var gasLimitHex = web3.toHex(gasLimitFunction);

      var nonce = web3.eth.getTransactionCount(wallet.getAddressString());
      var nonceHex = web3.toHex(nonce);

      var rawTx = {
        nonce: nonceHex,
        gasPrice: gasPriceHex,
        gasLimit: gasLimitHex,
        data: payloadData,
        from: wallet.getAddressString(),
        value: web3.toWei(amount, 'ether')
      };

      var tx = new Tx(rawTx);
      tx.sign(Buffer(wallet.getPrivateKey(), 'hex'));
      var serialized = tx.serialize();

      web3.eth.sendRawTransaction('0x' + serialized.toString('hex'), function (err, hash) {
        console.log(err);
        if (hash) {
          Transaction.create_buy_token_transaction(hash, wallet.getAddressString());
        } else {
          alert('Deploy contract failed');
        }
      });
    } else {
      alert('Your private key does not match');
      return;
    }
  },

  //save buy transaction to db
  create_buy_token_transaction: function create_buy_token_transaction(hash, address_to) {
    $.post('/create-transfer-amount', {
      txHash: hash,
      from_address: SPXTokenAddress,
      to_address: address_to,
      amount: amount,
      unit: 'ETH',
      status: 1,
      date_time: Date.now()
    }, function (data) {
      if (data.error == 0) {
        window.location.href = '/transactions';
      } else {
        alert("Error. Please try again.");
      }
    });
  },

  // validate sell transaction
  validate_sell_tokens: function validate_sell_tokens() {
    var eth_amount = document.getElementById('op_sell_enc').innerHTML;
    amount = parseFloat(eth_amount);
    if (amount <= 0.0) {
      alert('Amount invalid');
      return false;
    }
    return true;
  },

  //save sell transaction to db
  create_sell_token_transaction: function create_sell_token_transaction(hash, address_to) {
    $.post('/create-transfer-amount', {
      txHash: hash,
      from_address: SPXTokenAddress,
      to_address: address_to,
      amount: amount,
      unit: 'ETH',
      status: 1,
      date_time: Date.now()
    }, function (data) {
      if (data.error == 0) {
        window.location.href = '/transactions';
      } else {
        alert("Error. Please try again.");
      }
    });
  }
}
