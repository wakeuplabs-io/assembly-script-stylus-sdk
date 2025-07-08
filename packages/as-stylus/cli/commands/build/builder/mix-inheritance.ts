import { Visibility } from "@/cli/types/abi.types.js";
import { IRContract, IRMethod } from "@/cli/types/ir.types.js";

function isInheritance(method: IRMethod): boolean {
  const isVisible = [Visibility.PUBLIC, Visibility.EXTERNAL, Visibility.INTERNAL];
  return isVisible.includes(method.visibility);
}

export function mixInheritance(contract: IRContract, parent?: IRContract): IRContract {
  if (!parent) {
    return contract;
  }

  const parentMethods = parent.methods.filter((method) => isInheritance(method));


  return {
    ...contract,
    methods: [...parentMethods, ...contract.methods],
    storage: [...parent.storage, ...contract.storage],
    events: [...(parent.events || []), ...(contract.events || [])],
    structs: [...(parent.structs || []), ...(contract.structs || [])],
    errors: [...(parent.errors || []), ...(contract.errors || [])],
  };
}