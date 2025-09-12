import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

export class DynamicArrayFactoryHandler extends Handler {
  canHandle(expr: Call): boolean {
    if (expr.kind !== "call") {
      return false;
    }

    const target = expr.target || "";
    const receiverName = expr.receiver?.kind === "var" ? expr.receiver.name : null;

    if (expr.receiver && expr.receiver.kind === "var") {
      if (receiverName === "DynamicArrayFactory") {
        const methods = ["withCapacity", "ofSize", "empty"];
        return methods.includes(target);
      } else {
        return false;
      }
    }

    return false;
  }

  handle(expr: Call): EmitResult {
    const target = expr.target || "";
    const setupLines: string[] = [];

    const argResults = (expr.args || []).map((arg) => this.contractContext.emitExpression(arg));

    argResults.forEach((result) => {
      setupLines.push(...result.setupLines);
    });

    const elementSize = 32;
    const createMethod = expr.scope === "storage" ? "createStorage" : "createMemory";
    let factoryExpr: string;

    switch (target) {
      case "withCapacity": {
        const capacity = argResults.length > 0 ? argResults[0].valueExpr : "32";
        const tempCapacity = makeTemp("capacity");

        setupLines.push(`const ${tempCapacity}: u32 = <u32>${capacity};`);
        factoryExpr = `ArrayDynamic.${createMethod}(${elementSize}, ${tempCapacity})`;
        break;
      }

      case "ofSize": {
        if (argResults.length >= 1) {
          const lengthArg = argResults[0].valueExpr;
          const tempLength = makeTemp("length");
          const tempArray = makeTemp("array");

          setupLines.push(`const ${tempLength}: u32 = <u32>${lengthArg};`);
          setupLines.push(
            `const ${tempArray}: usize = ArrayDynamic.${createMethod}(${elementSize}, ${tempLength});`,
          );

          if (argResults.length >= 2) {
            const fillValueArg = argResults[1].valueExpr;
            setupLines.push(`for (let i: u32 = 0; i < ${tempLength}; i++) {`);
            setupLines.push(`  ArrayDynamic.set(${tempArray}, i, ${fillValueArg});`);
            setupLines.push(`}`);
          }

          factoryExpr = tempArray;
        } else {
          factoryExpr = `/* Error: DynamicArrayFactory.ofSize() requires length argument */`;
        }
        break;
      }

      case "empty": {
        if (createMethod === "createStorage") {
          factoryExpr = `ArrayDynamic.createStorage()`;
        } else {
          factoryExpr = `ArrayDynamic.createMemory(${elementSize}, 0)`;
        }
        break;
      }

      default:
        factoryExpr = `/* Error: Unsupported DynamicArrayFactory method: ${target} */`;
    }

    return {
      setupLines,
      valueExpr: factoryExpr,
      valueType: "usize",
    };
  }
}
