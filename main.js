module.exports = function(callback){

    const numBytes = 64;
    //Prime modulus used in ZoKrates (for some reason it's fixed :/ )
    const p = 21888242871839275222246405745257275088548364400416034343698204186575808495616;

    var crypto = require('crypto');
    var fs = require('fs');
    var BN = require('bn.js');
    var vorpal = require("vorpal")();


    const addresses = 
    [
    "0x8dddaaa0c8b11e835ffc0542c160d8a992721cd91950e80158eb4d93ff6a911c",
    "0xb54c4a0cfa24b08ee2b9c7f2613cbfbf7f5e44cf37f94d9a03de1cd8b0498cd8",
    "0xf4fce738d6ef5813a1b8f231803a3a8d0f8a0378b9e6f1990d5d36179bb2f76b"
    ];

    const proofFiles = 
    [
        "proof0.json",
        "proof1.json",
        "proof2.json"
    ];  


    //Data manipulation helpers

    var padHex = function(str){
        return "0".repeat(128 - str.length) + str;
    }
        
    var genSecret = function(){
        secret = crypto.randomBytes(numBytes);
        secretStr = secret.toString('hex');
        secretInt = parseInt(secretStr,16) % p;
        secretStr = secretInt.toString(16);
        return padHex(secretStr);
    }
 
    var genHash = function(hexStr){
        newBuf = new Buffer(hexStr,"hex");
        h = crypto.createHash('sha256');
        h.update(newBuf,'hex');
        return h.digest().toString('hex');
    }

    var chop = function(str,numBlocks){
        blocks = new Array();
        blockLen = str.length/numBlocks;
        for(i = 0;i<numBlocks;i++){
            blocks.push(str.substring(i*blockLen,(i+1)*blockLen));
        }
        return blocks;
    }

    var genPair = function(){
        secret = genSecret();
        hash = genHash(secret);
        return {secret: secret,hash: hash};
    }

    var genPairs = function(n){
        pairs = new Array();
        for(i =0;i<n;i++){
            pairs.push(genPair());
        }
        return pairs;
    }

    var blockToDec = function(block){
        newBlock = new Array();
        for(i = 0;i< block.length;i++){
            temp = new BN(block[i],16);
            newBlock.push(temp.toString(10));
        }
        return newBlock;
    }


    var printPair = function(pair){
        secretBlocks = chop(pair.secret,4);
        secretBlocks = blockToDec(secretBlocks);
        hashBlocks = chop(pair.hash,2);
        hashBlocks = blockToDec(hashBlocks);
        console.log("SecretBlocks");
        console.log(`${secretBlocks[0]} ${secretBlocks[1]} ${secretBlocks[2]} ${secretBlocks[3]}`);
        console.log("HashBlocks");
        console.log(`${hashBlocks[0]} ${hashBlocks[1]}`);
        console.log(`HexHash: 0x${pair.hash}`);

    }

    var createSecretExample = function(){
        pairs = genPairs(3);
        console.log("Pair 0");
        printPair(pairs[0]);
        console.log("Pair 1");
        printPair(pairs[1]);
        console.log("Pair 2");
        printPair(pairs[2]);
    }

    //ZoKrates interaction

    var readProofJSON = function(proofIndex){
        return JSON.parse(fs.readFileSync(proofFiles[proofIndex]));
    }

    //Contract interaction
    
    var getTokenContractInstance = async function(){
        HiddenToken = artifacts.require("HiddenToken");
        instance = await HiddenToken.deployed();
        return instance;
    }

    var getBalance = async function(instance,index){
        balance = await instance.getBalance(addresses[index]);
        numBalance = balance.c[0];
        return numBalance;
    }

    var sendTokens = async function(instance,fromIndex,toIndex,amt){
      pf = readProofJSON(fromIndex);
      proof = pf.proof;
      input = pf.input;
      response = await instance.sendToken(toIndex,amt,proof.A,proof.A_p,proof.B,proof.B_p,proof.C,proof.C_p,proof.H,proof.K,input);
      if(response.logs != undefined){
          console.log(response.logs[0].args.s);
      }else{
          console.log("Send failed!");
      }
    }

    clientId = undefined;
    instance = undefined;

    var main = async function(){

        vorpal
            .command('create_client')
            .option('--i <index>,','Account index')
            .action(async function(args,callback){
                if(args.options.i != undefined){
                    console.log(`Create new client with id: ${args.options.i}`);
                    clientId = args.options.i;
                    instance = await getTokenContractInstance();
                }else{
                    console.log("Error: Must create client first!");
                }
                callback();
            });

        vorpal
            .command('get_balance')
            .option('--i <index>,','Account index')
            .action(async function(args,callback){
                if((args.options.i != undefined) && (clientId != undefined)){
                    console.log(`Client ${args.options.i} balance: ${await getBalance(instance,args.options.i)}`);
                }else{
                    console.log("Error: Usage");
                }
                callback();
            });

        vorpal
            .command('send')
            .option('--t <to_index>,','To account index')
            .option('--a <amount>,','Amount to send')
            .action(async function(args,callback){
                if((args.options.t != undefined) && (args.options.a != undefined) && (clientId != undefined)){
                    await sendTokens(instance,clientId,args.options.t,args.options.a);
                }else{
                    console.log("Error: Usage");
                }
                callback();
            });

        vorpal
            .delimiter("zk-eth-playground $ ")
            .show();


        //Used mainly for debugging/testing instead of manually specifying cli arguments
        //Might have to change local vars based on ganache private keys

    }
    main();
}
