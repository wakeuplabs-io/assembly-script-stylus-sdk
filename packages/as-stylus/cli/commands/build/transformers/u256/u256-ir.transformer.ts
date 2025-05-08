// cli/transformers/u256/U256Transformer.ts
// commands/build/codegen/transformU256.ts
import fs from "fs";
import { IRContract, IRStatement, IRExpression } from "../../../../types/ir.types";
let tmpId = 0;


/** Single public entry ─ emits a fresh AssemblyScript module               */
export function transformU256(outFile: string, c: IRContract): void {
  const buf: string[] = [];

  // ── Preamble ──────────────────────────────────────────────────────────
  buf.push("// @ts-nocheck\n/* auto‑generated – DO NOT EDIT */\n");
  buf.push('import { U256 } from "@as-stylus/core/types/u256";');
  buf.push('import { storage_load_u256, storage_store_u256 } from "@as-stylus/core/modules/storage";\n');

  // ── Constructor → deploy() ────────────────────────────────────────────
  if (c.constructor) {
    buf.push("export function deploy(): void {");
    buf.push(...emitBody(c.constructor.ir, 2));
    buf.push("}\n");
  }

  // ── All contract methods ──────────────────────────────────────────────
  for (const m of c.methods) {
    buf.push(`export function ${m.name}(): void {`);
    buf.push(...emitBody(m.ir, 2));
    buf.push("}\n");
  }

  // ── flush to disk ─────────────────────────────────────────────────────
  fs.writeFileSync(outFile, buf.join("\n"));
  console.log(`[as‑stylus] ✔ contract.transformed.ts written → ${outFile}`);
}

/* ---------------------------------------------------------------------- */
/*                             helpers                                    */
/* ---------------------------------------------------------------------- */

function emitBody(stmts: IRStatement[], indent = 0): string[] {
  return stmts.flatMap(s => emitStmt(s, indent));
}

function emitStmt(s: IRStatement, i = 0): string[] {
  const t   = " ".repeat(i);
  const out: string[] = [];
  const hoist: string[] = [];            // collect helper lines

  // helper to wrap expr emission
  const E = (expr: IRExpression) => emitExpr(expr, hoist);

  switch (s.kind) {
    case "let":
      out.push(...hoist.map(l => t + l));
      out.push(`${t}const ${s.name} = ${E(s.expr)};`);
      return out;

    case "assign":
      out.push(...hoist.map(l => t + l));
      out.push(`${t}${s.target} = ${E(s.expr)};`);
      return out;

    case "expr":
      out.push(...hoist.map(l => t + l));
      out.push(`${t}${E(s.expr)};`);
      return out;

    case "return":
      out.push(...hoist.map(l => t + l));
      out.push(`${t}return ${E(s.expr)};`);
      return out;

    case "if":
      out.push(...hoist.map(l => t + l));
      out.push(`${t}if (${E(s.condition)}) {`);
      out.push(...emitBody(s.then, i + 2));
      if (s.else) {
        out.push(`${t}} else {`);
        out.push(...emitBody(s.else, i + 2));
      }
      out.push(`${t}}`);
      return out;

    default:
      throw new Error("unreachable‑stmt");
  }
}


// NOTE: we keep a counter in module scope to create unique temp names

function emitExpr(e: IRExpression, hoist: string[]): string {
  switch (e.kind) {
    /* ------------------ literals / vars ------------------ */
    case "literal": return JSON.stringify(e.value);
    case "var":     return e.name;

    /* ----------------- static calls ---------------------- */
    case "call": {
      // a) U256Factory.create()
      if (e.target === "U256Factory.create" && e.args.length === 0) {
        return "U256.create()";
      }

      // b) U256Factory.fromString("123")
      if (e.target === "U256Factory.fromString" &&
          e.args.length === 1 &&
          e.args[0].kind === "literal" &&
          typeof e.args[0].value === "string") {

        const raw   = e.args[0].value as string;
        const strId = `__str${tmpId}`;
        const uId   = `__u256${tmpId}`;
        tmpId++;

        // emit malloc + store lines into the HOIST list
        hoist.push(`const ${strId} = malloc(${raw.length});`);
        for (let i = 0; i < raw.length; i++) {
          hoist.push(`store<u8>(${strId} + ${i}, ${raw.charCodeAt(i)});`);
        }
        hoist.push(`const ${uId} = U256.create();`);
        hoist.push(`U256.setFromString(${uId}, ${strId}, ${raw.length});`);

        return uId;                 // expression becomes that temp pointer
      }

      // generic fall‑back
      return `${e.target}(${e.args.map(a => emitExpr(a, hoist)).join(", ")})`;
    }

    /* ---------------- member calls (ptr.add / sub / toString) -------- */
    case "member": {
      // We treat ".add", ".sub", ".toString" specially
      if (e.property === "add" || e.property === "sub") {
        const base = emitExpr(e.object, hoist);
        // we need to look up the parent call to get its first arg – handled in call case
        return `${base}.${e.property}`; // will be completed in parent call case
      }
      if (e.property === "toString") {
        const base = emitExpr(e.object, hoist);
        return `U256.toString(${base})`;
      }
      return `${emitExpr(e.object, hoist)}.${e.property}`;
    }

    /* ---------------- binary ------------------------------- */
    case "binary":  return `${emitExpr(e.left, hoist)} ${e.op} ${emitExpr(e.right, hoist)}`;

    default: throw new Error("unreachable‑expr");
  }
}
