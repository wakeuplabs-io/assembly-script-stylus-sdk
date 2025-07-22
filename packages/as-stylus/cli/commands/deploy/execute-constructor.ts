import { Logger } from "@/cli/services/logger.js";

export function executeConstructor(contractPath: string) {
  Logger.getInstance().info(`Executing constructor for ${contractPath}`);
}
