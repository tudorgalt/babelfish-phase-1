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

## **3. Graph**

<img src="images/UML_diagram.png" />
