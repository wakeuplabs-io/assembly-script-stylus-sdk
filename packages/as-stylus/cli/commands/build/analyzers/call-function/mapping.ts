import { CallExpression, Expression } from "ts-morph";

import { CompilationContext } from "@/cli/shared/compilation-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, IRMapGet, IRMapGet2, IRMapSet, IRMapSet2 } from "@/cli/types/ir.types.js";
import { MethodName } from "@/cli/types/method-types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";
import { parseNameWithMethod } from "../shared/utils/parse-this.js";

function getReturnType(valueType: string): SupportedType {
  switch (valueType) {
    case "Address":
      return AbiType.Address;
    case "U256":
      return AbiType.Uint256;
    case "I256":
      return AbiType.Int256;
    case "boolean":
      return AbiType.Bool;  
    default:
      return AbiType.Unknown;
  }
}

export function buildMappingIR(ctx: CompilationContext, call: CallExpression, slot: number): IRExpression | undefined {
    const { name: mappingName, method: methodName } = parseNameWithMethod(call.getText());

    const args = call.getArguments().map((arg) => {
      const builder = new ExpressionIRBuilder(arg as Expression);
      return builder.validateAndBuildIR();
    });

      const mappingTypeInfo = ctx.mappingTypes.get(mappingName);

      if (methodName === MethodName.Get && args.length === 1) {
        const valueType = mappingTypeInfo?.valueType || AbiType.Uint256;
        const returnType = getReturnType(valueType);
        return {
          kind: "map_get",
          slot,
          key: args[0],
          keyType: mappingTypeInfo?.keyType || AbiType.Address,
          valueType,
          type: AbiType.Mapping,
          returnType,
        } as IRMapGet;
      } 
      
      if (methodName === MethodName.Set && args.length === 2) {
        return {
          kind: "map_set",
          slot,
          key: args[0],
          value: args[1],
          keyType: mappingTypeInfo?.keyType || AbiType.Address,
          valueType: mappingTypeInfo?.valueType || AbiType.Uint256,
        } as IRMapSet;
      } 
      
      if (methodName === MethodName.Get && args.length === 2) {
        const valueType = mappingTypeInfo?.valueType || AbiType.Uint256;
        const returnType = getReturnType(valueType);

        return {
          kind: "map_get2",
          slot,
          key1: args[0],
          key2: args[1],
          keyType1: mappingTypeInfo?.keyType1 || AbiType.Address,
          keyType2: mappingTypeInfo?.keyType2 || AbiType.Address,
          valueType,
          type: AbiType.MappingNested,
          returnType,
        } as IRMapGet2;
      }
      
      if (methodName === MethodName.Set && args.length === 3) {
        return {
          kind: "map_set2",
          slot,
          key1: args[0],
          key2: args[1],
          value: args[2],
          keyType1: mappingTypeInfo?.keyType1 || AbiType.Address,
          keyType2: mappingTypeInfo?.keyType2 || AbiType.Address,
          valueType: mappingTypeInfo?.valueType || AbiType.Uint256,
        } as IRMapSet2;
      }

      return undefined;
  }
    