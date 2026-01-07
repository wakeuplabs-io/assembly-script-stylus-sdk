import {
  Contract,
  ErrorFactory,
  External,
  Str,
  Mapping,
  U256,
  U256Factory,
  View,
  Address,
  msg,
  StrFactory,
} from "@wakeuplabs/as-stylus";

const VoterAlreadyVoted = ErrorFactory.create<[address: Address]>();

@Contract
export class Voting {
  a: U256;
  b: U256;
  proposalCount: U256 = U256Factory.create();
  voters: Mapping<Address, boolean> = new Mapping<Address, boolean>();
  votesFor: Mapping<U256, U256> = new Mapping<U256, U256>();
  votesAgainst: Mapping<U256, U256> = new Mapping<U256, U256>();
  votersNames: Mapping<Address, Str> = new Mapping<Address, Str>();

  constructor() {
    this.a = U256Factory.fromString("3");
    this.b = U256Factory.fromString("2");
  }

  @External
  createProposal(): void {
    this.proposalCount = this.proposalCount.add(U256Factory.fromString("1"));
  }

  @View
  getProposalCount(): U256 {
    return this.proposalCount;
  }

  @External
  voteFor(proposalId: U256, name: Str): void {
    if (this.voters.get(msg.sender)) {
      VoterAlreadyVoted.revert(msg.sender);
    }
    const newResult = this.votesFor.get(proposalId).add(U256Factory.fromString("1"));
    this.votesFor.set(proposalId, newResult);
    this.voters.set(msg.sender, true);
    this.votersNames.set(msg.sender, name);
  }

  @External
  voteAgainst(proposalId: U256, name: Str): void {
    if (this.voters.get(msg.sender)) {
      VoterAlreadyVoted.revert(msg.sender);
    }
    const newResult = this.votesAgainst.get(proposalId).add(U256Factory.fromString("1"));
    this.votesAgainst.set(proposalId, newResult);
    this.voters.set(msg.sender, true);
    this.votersNames.set(msg.sender, name);
  }

  @View
  hasWon(proposalId: U256): boolean {
    const votesFor = this.votesFor.get(proposalId);
    const votesAgainst = this.votesAgainst.get(proposalId);
    const result = votesFor.greaterThan(votesAgainst);
    return result;
  }

  @View
  getVotesFor(proposalId: U256): U256 {
    return this.votesFor.get(proposalId);
  }

  @View
  getVotesAgainst(proposalId: U256): U256 {
    return this.votesAgainst.get(proposalId);
  }

  @View
  getVoterName(address: Address): Str {
    return this.votersNames.get(address);
  }
}
