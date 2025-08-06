import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression, IRStruct, Member } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

type Arg = {
  name?: string;
  value?: string;
};
/**
 * Handler for property_set calls like property_set(structTemp, "fieldName", value)
 * This is used to set the value of a field on a struct
 */
export class StructPropertySetHandler extends Handler {
  private structs: Map<string, IRStruct>;

  constructor(contractContext: ContractContext, structs: Map<string, IRStruct>) {
    super(contractContext);
    this.structs = structs;
  }

  canHandle(expr: Call | Member): boolean {
    if (expr.kind !== "call") return false;

    const target = expr.target || "";
    return target === "property_set" && expr.args && expr.args.length === 3;
  }

  handle(expr: Call): EmitResult {
    const objectArg = expr.args[0] as IRExpression;
    const fieldNameArg = expr.args[1] as IRExpression;
    const valueArg = expr.args[2] as IRExpression;

    const objectResult = this.contractContext.emit(objectArg);
    const valueResult = this.contractContext.emit(valueArg);

    const fieldName = (fieldNameArg as Arg)?.value || (fieldNameArg as Arg).name;

    if (!fieldName) {
      return {
        setupLines: [...objectResult.setupLines, ...valueResult.setupLines],
        valueExpr: `/* property_set: missing field name */`,
        valueType: "void",
      };
    }

    const structNames = Array.from(this.structs.keys());
    if (structNames.length === 0) {
      return {
        setupLines: [...objectResult.setupLines, ...valueResult.setupLines],
        valueExpr: `/* property_set: no structs registered */`,
        valueType: "void",
      };
    }

    const structName = structNames[0];

    const isStorageStruct = this.isStorageStruct(objectArg);

    const setterPrefix = isStorageStruct ? `${structName}_set_` : `${structName}_memory_set_`;
    const setterCall = `${setterPrefix}${fieldName}(${objectResult.valueExpr}, ${valueResult.valueExpr})`;

    return {
      setupLines: [...objectResult.setupLines, ...valueResult.setupLines, setterCall + ";"],
      valueExpr: "/* void */",
      valueType: "void",
    };
  }

  private isStorageStruct(objectArg: unknown): boolean {
    if (objectArg && (objectArg as { scope?: string }).scope === "storage") {
      return true;
    }

    return false;
  }
}
