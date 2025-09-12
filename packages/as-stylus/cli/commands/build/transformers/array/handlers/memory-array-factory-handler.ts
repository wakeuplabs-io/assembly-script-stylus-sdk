import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

export class MemoryArrayFactoryHandler extends Handler {
  canHandle(expr: Call): boolean {
    if (expr.kind !== "call") {
      return false;
    }

    const target = expr.target || "";
    const receiverName = expr.receiver?.kind === "var" ? expr.receiver.name : null;

    if (expr.receiver && expr.receiver.kind === "var") {
      if (receiverName === "MemoryArrayFactory") {
        const methods = ["ofLength", "copy"];
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
    let factoryExpr: string;

    switch (target) {
      case "ofLength": {
        if (argResults.length >= 1) {
          const lengthArg = argResults[0].valueExpr;
          const tempLength = makeTemp("length");
          const tempArray = makeTemp("array");

          setupLines.push(`const ${tempLength}: u32 = <u32>${lengthArg};`);
          setupLines.push(
            `const ${tempArray}: usize = Array.createMemory(${elementSize}, ${tempLength});`,
          );

          if (argResults.length >= 2) {
            const fillValueArg = argResults[1].valueExpr;
            setupLines.push(`for (let i: u32 = 0; i < ${tempLength}; i++) {`);
            setupLines.push(`  Array.set(${tempArray}, i, ${fillValueArg}, ${elementSize});`);
            setupLines.push(`}`);
          }

          factoryExpr = tempArray;
        } else {
          factoryExpr = `/* Error: MemoryArrayFactory.ofLength() requires length argument */`;
        }
        break;
      }

      case "copy": {
        if (argResults.length === 1) {
          const sourceArg = argResults[0].valueExpr;
          const tempArray = makeTemp("array");
          const tempLength = makeTemp("length");

          setupLines.push(`const ${tempLength}: u32 = Array.getLength(${sourceArg});`);
          setupLines.push(
            `const ${tempArray}: usize = Array.createMemory(${elementSize}, ${tempLength});`,
          );
          setupLines.push(`for (let i: u32 = 0; i < ${tempLength}; i++) {`);
          setupLines.push(`  const value = Array.get(${sourceArg}, i, ${elementSize});`);
          setupLines.push(`  Array.set(${tempArray}, i, value, ${elementSize});`);
          setupLines.push(`}`);

          factoryExpr = tempArray;
        } else {
          factoryExpr = `/* Error: MemoryArrayFactory.copy() requires source array argument */`;
        }
        break;
      }

      default:
        factoryExpr = `/* Error: Unsupported MemoryArrayFactory method: ${target} */`;
    }

    return {
      setupLines,
      valueExpr: factoryExpr,
      valueType: "usize",
    };
  }
}
