import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

export class StaticArrayFactoryHandler extends Handler {
  canHandle(expr: Call): boolean {
    if (expr.kind !== "call") {
      return false;
    }

    const target = expr.target || "";
    const receiverName = expr.receiver?.kind === "var" ? expr.receiver.name : null;

    if (expr.receiver && expr.receiver.kind === "var") {
      if (receiverName === "StaticArrayFactory") {
        const methods = ["create", "filled", "from"];
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

    const argResults = (expr.args || []).map((arg) => {
      if (arg.kind === "array_literal") {
        return { setupLines: [], valueExpr: "/* array_literal */", valueType: "array" };
      } else {
        return this.contractContext.emitExpression(arg);
      }
    });

    argResults.forEach((result) => {
      setupLines.push(...result.setupLines);
    });

    const elementSize = 32;
    const createMethod = expr.scope === "storage" ? "createStorage" : "createMemory";
    let factoryExpr: string;

    switch (target) {
      case "create": {
        if (argResults.length === 1) {
          const firstArg = expr.args![0];

          if (firstArg.kind === "array_literal") {
            const arrayLength = firstArg.elements.length;
            const tempVarName = makeTemp("array");

            setupLines.push(
              `const ${tempVarName}: usize = ArrayStatic.${createMethod}(${elementSize}, ${arrayLength});`,
            );

            firstArg.elements.forEach((element, index) => {
              let elementExpr: string;

              if (element.kind === "var") {
                elementExpr = element.name;
              } else if (element.kind === "literal") {
                elementExpr = `U256Factory.fromString("${element.value}")`;
              } else {
                const elementResult = this.contractContext.emitExpression(element);
                setupLines.push(...elementResult.setupLines);
                elementExpr = elementResult.valueExpr;
              }

              setupLines.push(
                `ArrayStatic.set(${tempVarName}, ${index}, ${elementExpr}, ${elementSize});`,
              );
            });

            factoryExpr = tempVarName;
          } else {
            factoryExpr = `/* Error: StaticArrayFactory.create() expects array literal */`;
          }
        } else {
          factoryExpr = `/* Error: StaticArrayFactory.create() requires exactly one argument */`;
        }
        break;
      }

      case "filled": {
        if (argResults.length === 2) {
          const valueArg = argResults[0].valueExpr;
          const lengthArg = argResults[1].valueExpr;
          const tempVarName = makeTemp("array");
          const tempLength = makeTemp("length");

          setupLines.push(`const ${tempLength}: u32 = <u32>${lengthArg};`);
          setupLines.push(
            `const ${tempVarName}: usize = ArrayStatic.${createMethod}(${elementSize}, ${tempLength});`,
          );

          setupLines.push(`for (let i: u32 = 0; i < ${tempLength}; i++) {`);
          setupLines.push(`  ArrayStatic.set(${tempVarName}, i, ${valueArg}, ${elementSize});`);
          setupLines.push(`}`);

          factoryExpr = tempVarName;
        } else {
          factoryExpr = `/* Error: StaticArrayFactory.filled() requires value and length arguments */`;
        }
        break;
      }

      case "from": {
        if (argResults.length > 0) {
          const arrayLength = argResults.length;
          const tempVarName = makeTemp("array");

          setupLines.push(
            `const ${tempVarName}: usize = ArrayStatic.${createMethod}(${elementSize}, ${arrayLength});`,
          );

          argResults.forEach((result, index) => {
            setupLines.push(
              `ArrayStatic.set(${tempVarName}, ${index}, ${result.valueExpr}, ${elementSize});`,
            );
          });

          factoryExpr = tempVarName;
        } else {
          factoryExpr = `/* Error: StaticArrayFactory.from() requires at least one argument */`;
        }
        break;
      }

      default:
        factoryExpr = `/* Error: Unsupported StaticArrayFactory method: ${target} */`;
    }

    return {
      setupLines,
      valueExpr: factoryExpr,
      valueType: "usize",
    };
  }
}
