## **1. Documentation**

Documentation for contracts can be found in /docs directory.
To generate documentation use "yarn docgen" command.

The letest version is published here: https://babelfishprotocol.github.io/babelfish-phase-1/#/
## **2. Scripts**

Project scripts are defined in _pachage.json_ file. To execute the script run the following command: _yarn command_, for example _'yarn migrate'_. 
Here is the list of available scripts:
-    "migrate" - run migrations, development network
-    "migrate:ropsten" - run migrations, ropsten network
-    "migrate:kovan" - run migrations, kowan network
-    "migrate:rskTestnet" - run migrations, rsk testnet network
     "migrate-governance" - run migrations of governance contracts, development network
     "migrate-governance:ropsten" - run migrations of governance contracts, ropsten network
     "migrate-governance:kovan" - run migrations of governance contracts, kovan network
     "migrate-governance:rskTestnet" - run migrations of governance contracts, rskTestnet network
-    "lint" - run linter
-    "lint-ts" - run typescript linter
-    "lint-sol" - run solidity linter
-    "coverage" - check unit test coverage
-    "script" - run custom script development network
-    "script:rskTestnet" - run custom script, rsk testnet
-    "script:rsk" - run custom script, rsk testnet
-    "test" - run all tests
-    "test-file" - run just one test file
-    "test:fork" run tests on fork network
-    "compile" - install project dependencies and compile
-    "prettify" - run prettifyier on source files
-    "flatten" - run flattener on source files
-    "prepublishOnly" - compile
-    "docgen" - generate documentation from solidity Natspecs

## **3. Governance migration**

##### Here are the steps needed to properly deploy and integrate governance system:
-   Run contracts migrations: `yarn migrate-governance` (this script will queue the transferAdmin call)
-   To set the proper admin you need to execute the "transferAdmin" script after sufficient time delay. `yarn script transferAdmin`
-   Change owner of BasketManager and Masset contracts by executing `yarn script transferOwnership`
## **4. Graph**

<img src="images/UML_diagram.png" />
