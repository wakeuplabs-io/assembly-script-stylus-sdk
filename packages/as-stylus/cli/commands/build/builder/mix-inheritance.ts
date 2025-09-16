import { Visibility } from "@/cli/types/abi.types.js";
import { IRContract, IRMethod } from "@/cli/types/ir.types.js";

function isInheritance(method: IRMethod): boolean {
  const isVisible = [Visibility.PUBLIC, Visibility.EXTERNAL, Visibility.INTERNAL];
  return isVisible.includes(method.visibility);
}

/**
 * Determines if a child method overrides a parent method.
 * In TypeScript/AssemblyScript, methods with the same name override each other.
 */
function isMethodOverridden(parentMethod: IRMethod, childMethod: IRMethod): boolean {
  return parentMethod.name === childMethod.name;
}

function mixMethods(contract: IRContract, parent: IRContract): IRMethod[] {
  const parentMethods = parent.methods.filter((method) => {
    if (!isInheritance(method)) {
      return false;
    }

    return !contract.methods.some((childMethod) => isMethodOverridden(method, childMethod));
  });

  const result = [...contract.methods, ...parentMethods];
  if (parent.constructor) {
    result.push(parent.constructor);
  }

  return result;
}

export function mixInheritance(contract: IRContract, parent?: IRContract): IRContract {
  if (!parent) {
    return contract;
  }

  return {
    ...contract,
    methods: mixMethods(contract, parent),
    storage: [...parent.storage, ...contract.storage],
    events: [...(parent.events || []), ...(contract.events || [])],
    structs: [...(parent.structs || []), ...(contract.structs || [])],
    errors: [...(parent.errors || []), ...(contract.errors || [])],
  };
}
