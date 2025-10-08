// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Counter {
  uint public x;

  function inc() public {
    x++;
  }

  function incBy(uint by) public {
    x += by;
  }
}
