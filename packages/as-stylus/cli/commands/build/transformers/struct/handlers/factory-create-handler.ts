import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRStruct, Member } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

export class StructFactoryCreateHandler extends Handler {
  private structs: Map<string, IRStruct>;

  constructor(contractContext: ContractContext, structs: Map<string, IRStruct>) {
    super(contractContext);
    this.structs = structs;
  }

  canHandle(expr: Call | Member): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "StructFactory.create" &&
      expr.metadata?.isStructCreation === true
    );
  }

  handle(expr: Call): EmitResult {
    const structType = expr.metadata?.structType;

    if (!structType) {
      return {
        setupLines: [],
        valueExpr: `/* Missing struct type in StructFactory.create */`,
        valueType: "usize",
      };
    }

    const struct = this.structs.get(structType);
    if (!struct) {
      return {
        setupLines: [],
        valueExpr: `/* Unknown struct type: ${structType} */`,
        valueType: "usize",
      };
    }

    const structPtr = makeTemp("structPtr");
    const setup = [
      `// Allocate memory for ${structType} with extra space for string data`,
      `const ${structPtr}: usize = ${structType}_alloc();`,
    ];

    const initialValues = expr.args || [];

    for (let i = 0; i < Math.min(initialValues.length, struct.fields.length); i++) {
      const field = struct.fields[i];
      const valueArg = initialValues[i];

      // TODO: Skip string fields - we'll handle them specially for ABI encoding
      if (field.type === AbiType.String || field.type === "Str") {
        continue;
      }
      
      const valueResult = this.contractContext.emitExpression(valueArg);
      setup.push(...valueResult.setupLines);
      setup.push(`${structType}_memory_set_${field.name}(${structPtr}, ${valueResult.valueExpr});`);
    }

    // TODO: Skip complex ABI encoding for now to avoid gas issues
    for (let i = 0; i < Math.min(initialValues.length, struct.fields.length); i++) {
      const field = struct.fields[i];
      const valueArg = initialValues[i];

      if (field.type === AbiType.String || field.type === "Str") {
        const valueResult = this.contractContext.emitExpression(valueArg);
        setup.push(...valueResult.setupLines);
        setup.push(
          `${structType}_memory_set_${field.name}(${structPtr}, ${valueResult.valueExpr});`,
        );
      }
    }

    return {
      setupLines: setup,
      valueExpr: structPtr,
      valueType: structType,
    };
  }
}
