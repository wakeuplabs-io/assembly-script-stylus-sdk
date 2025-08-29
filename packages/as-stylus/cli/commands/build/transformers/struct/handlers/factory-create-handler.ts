import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression, IRStruct, IRStructField, IRVariable, Member } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

/**
 * Handles struct creation through StructFactory.create calls.
 * Allocates memory and initializes struct fields with provided values.
 */
export class StructFactoryCreateHandler extends Handler {
  private static readonly STRUCT_FACTORY_TARGET = "StructFactory.create";
  private static readonly DEFAULT_ERROR_TYPE = "usize";
  
  private structs: Map<string, IRStruct>;

  constructor(contractContext: ContractContext, structs: Map<string, IRStruct>) {
    super(contractContext);
    this.structs = structs;
  }

  /**
   * Determines if this handler can process the given expression.
   * @param expr - The expression to check
   * @returns true if this handler can process the expression
   */
  canHandle(expr: Call | Member): boolean {
    return (
      expr.kind === "call" &&
      expr.target === StructFactoryCreateHandler.STRUCT_FACTORY_TARGET &&
      expr.metadata?.isStructCreation === true
    );
  }

  /**
   * Creates a standardized error result
   */
  private createErrorResult(message: string, structType?: string): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: ${message} */`,
      valueType: structType || StructFactoryCreateHandler.DEFAULT_ERROR_TYPE,
    };
  }

  /**
   * Processes a single field and returns the generated setup lines
   */
  private processField(field: IRStructField, valueArg: IRVariable, structType: string, structPtr: string): string[] {
    const valueResult = this.contractContext.emitExpression(valueArg as unknown as IRExpression);
    const lines = [...valueResult.setupLines];

    if (field.type === AbiType.Bool) {
      lines.push(`${structType}_memory_set_${field.name}(${structPtr}, Boolean.create(${valueResult.valueExpr}));`);
    } else {
      lines.push(`${structType}_memory_set_${field.name}(${structPtr}, ${valueResult.valueExpr});`);
    }

    return lines;
  }


  /**
   * Processes all fields of a specific type
   */
  private processFieldsByType(
    args: IRVariable[], 
    struct: IRStruct, 
    structType: string, 
    structPtr: string
  ): string[] {
    const setup: string[] = [];
    
    for (let i = 0; i < Math.min(args.length, struct.fields.length); i++) {
      const field = struct.fields[i];
      const valueArg = args[i];
      if (valueArg) {
        setup.push(...this.processField(field, valueArg, structType, structPtr));
      } else {  
        throw new Error(`Missing value for field ${field.name} in StructFactory.create`);
      }
    }
    
    return setup;
  }

  /**
   * Processes struct creation expressions and returns the generated code.
   * @param expr - The struct creation call expression
   * @returns EmitResult containing setup code and the struct pointer
   */
  handle(expr: Call): EmitResult {
    const structType = expr.metadata?.structType;

    if (!structType) {
      return this.createErrorResult("Missing struct type in StructFactory.create");
    }

    const struct = this.structs.get(structType);
    if (!struct) {
      return this.createErrorResult(`Unknown struct type: ${structType}`, structType);
    }

    if (!struct.fields || !Array.isArray(struct.fields)) {
      return this.createErrorResult(`Invalid struct definition for ${structType}`, structType);
    }

    const structPtr = makeTemp("structPtr");
    const setup = [
      `// Allocate memory for ${structType} with extra space for string data`,
      `const ${structPtr}: usize = ${structType}_alloc();`,
    ];

    const args = (expr.args || []) as unknown as IRVariable[];

    setup.push(...this.processFieldsByType(args, struct, structType, structPtr));

    return {
      setupLines: setup,
      valueExpr: structPtr,
      valueType: structType,
    };
  }
}
