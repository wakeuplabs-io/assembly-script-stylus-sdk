import { SourceFile } from "ts-morph";
import { analyzeContract, AnalyzedMethod } from "./analyze-contract";

/**
 * Construye un grafo de llamadas entre métodos por nombre.
 */
export function buildCallGraph(analyzed: AnalyzedMethod[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const { name, method } of analyzed) {
    const body = method.getBodyText() || "";
    const calls = new Set<string>();

    for (const { name: otherName } of analyzed) {
      if (name === otherName) continue;
      const regex = new RegExp(`\\b${otherName}\\b`, "g");
      if (regex.test(body)) {
        calls.add(otherName);
      }
    }

    graph.set(name, calls);
  }

  return graph;
}

/**
 * Verifica que ninguna función llame a métodos @external.
 */
export function validateExternalCalls(analyzed: AnalyzedMethod[], graph: Map<string, Set<string>>): void {
  const externalFuncs = new Set(
    analyzed.filter(fn => fn.visibility === "external").map(fn => fn.name)
  );

  for (const { name } of analyzed) {
    const called = graph.get(name);
    if (!called) continue;

    for (const target of called) {
      if (externalFuncs.has(target)) {
        throw new Error(
          `[semantic] Method "${name}" illegally calls @external method "${target}". External methods must only be entrypoints.`
        );
      }
    }
  }
}

/**
 * Entrada unificada
 */
export function analyzeCallGraph(sourceFile: SourceFile): void {
  const analyzed = analyzeContract(sourceFile);
  const graph = buildCallGraph(analyzed);
  validateExternalCalls(analyzed, graph);
}
