# zokrates_playground

Instructions for installing truffle + ganache can be found at: https://truffleframework.com

For starters you need to spin up a local ethereum node:
```
ganache-cli -d 
```

To compile and deploy the relevant smart contracts:
```
truffle compile
truffle migrate
```

This demo supports 3 users transferring coins so a valid index is [0,1,2]

Now you can run two different clients to try out the system

To run a client:
```
truffle exec main.js
```
This should spawn an interactive cli with a couple of options:

```
-create_client -i index (specify the client index for the client you want to create)
-get_balance -i index (get balance of the client corresponding to a given index)
-send -t to -a amount (send amont of token to another client with a given index)
```
