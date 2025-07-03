import { IRContract } from "@/cli/types/ir.types.js";

import { ProjectBuilder } from "./project-builder.js";
import { ErrorManager } from "../analyzers/shared/error-manager.js";

export function buildProject(userIndexPath: string, contract: IRContract): void {
  const errorManager = new ErrorManager();
  const builder = new ProjectBuilder(userIndexPath, contract, errorManager);
  builder.build();
}
