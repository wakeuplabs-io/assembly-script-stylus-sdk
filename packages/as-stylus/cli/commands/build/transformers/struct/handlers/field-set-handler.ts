import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRStruct, Member } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

export class StructFieldSetHandler extends Handler {
  private structs: Map<string, IRStruct>;

  constructor(contractContext: ContractContext, structs: Map<string, IRStruct>) {
    super(contractContext);
    this.structs = structs;
  }

  canHandle(expr: Call | Member): boolean {
    if (expr.kind !== "call") return false;
    
    const target = expr.target;
    
    // Detect setter calls: StructName_set_field
    if (target.includes("_set_")) {
      const parts = target.split("_set_");
      if (parts.length === 2) {
        const structName = parts[0];
        const fieldName = parts[1];
        const struct = this.structs.get(structName);
        
        if (struct) {
          // Check if the field exists
          const field = struct.fields.find(f => f.name === fieldName);
          return !!field;
        }
      }
    }
    
    return false;
  }

  handle(expr: Call): EmitResult {
    const target = expr.target;
    const parts = target.split("_set_");
    const structName = parts[0];
    const fieldName = parts[1];
    
    if (!expr.args || expr.args.length !== 2) {
      return {
        setupLines: [],
        valueExpr: `/* Invalid args for ${target} */`,
        valueType: "void"
      };
    }
    
    const objectArg = this.contractContext.emit(expr.args[0]);
    const valueArg = this.contractContext.emit(expr.args[1]);
    
    return {
      setupLines: [
        ...objectArg.setupLines,
        ...valueArg.setupLines,
        `${structName}_set_${fieldName}(${objectArg.valueExpr}, ${valueArg.valueExpr});`
      ],
      valueExpr: "/* void */",
      valueType: "void"
    };
  }
} 