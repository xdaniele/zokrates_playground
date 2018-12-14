pragma solidity ^0.4.16;
pragma experimental ABIEncoderV2;

import './Verifier.sol';

contract HiddenToken is Verifier{

    //Constructor initially gives money to addresses
    

    mapping (uint => bytes32) addressMap;
    mapping (bytes32 => uint) balances;

    constructor(bytes32[] members,uint amount) public{
        uint amountEach = amount / members.length;
        for(uint i = 0;i < members.length;i++){
            addressMap[i] = members[i];
            balances[members[i]] = amountEach;
        }
    }

    function getBalance(bytes32 userAddress) public view returns (uint){
        return balances[userAddress];
    }

    modifier proveOwnership(
            uint[2] a,
            uint[2] a_p,
            uint[2][2] b,
            uint[2] b_p,
            uint[2] c,
            uint[2] c_p,
            uint[2] h,
            uint[2] k,
            uint[2] input){
                require(verifyTx(a, a_p, b, b_p, c, c_p, h, k, input) == true);
                _;
            }

    event SendEvent(string s);

    function sendToken(uint to,uint amount,
            uint[2] a,
            uint[2] a_p,
            uint[2][2] b,
            uint[2] b_p,
            uint[2] c,
            uint[2] c_p,
            uint[2] h,
            uint[2] k,
            uint[2] input) public returns (bool){
                emit SendEvent("Sent success!");
                require(verifyTx(a, a_p, b, b_p, c, c_p, h, k, input) == true);
                bytes32 fromAddress = addressMap[input[0]];
                bytes32 toAddress = addressMap[to];

                require(amount > 0,"Must try to deduct something");
                require((balances[fromAddress] - amount) >= 0,"Don't have enough balance to deduct");

                balances[fromAddress]-=amount;
                balances[toAddress]+=amount;
                return true;
            }
    
}
    