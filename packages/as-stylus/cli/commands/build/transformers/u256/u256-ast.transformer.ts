// transformers/ast-contract-u256.ts
//---------------------------------------------------------------
//  Flatten @Contract class   +   Rewrite U256 factory / methods
//  + replace static field reads & writes with load_*/store_*.
//---------------------------------------------------------------
import {
  SourceFile, SyntaxKind, Expression, StringLiteral, PropertyAccessExpression,
  ClassDeclaration, ConstructorDeclaration, MethodDeclaration,
  PropertyDeclaration
} from "ts-morph";

/*───────────────────────────────────────────────────────────*/
/* 1. Public façade                                          */
/*───────────────────────────────────────────────────────────*/

export class U256Transformer {
  private constructor(private sf: SourceFile) {}
  static for(sf: SourceFile) { return new U256Transformer(sf); }

  factory() { transformFactoryCalls(this.sf);  return this; }
  methods() { transformInstanceCalls(this.sf); return this; }

  apply() { ensureNoCheck(this.sf); this.sf.saveSync(); }
}

export class ContractTransformer {
  private constructor(private sf: SourceFile) {}
  static for(sf: SourceFile) { return new ContractTransformer(sf); }

  flatten() { flattenContractClass(this.sf);       return this; }
  apply()   { ensureNoCheck(this.sf); this.sf.saveSync(); }
}

/*───────────────────────────────────────────────────────────*/
/* 2. U256 factory call rewriting                            */
/*───────────────────────────────────────────────────────────*/

let strCounter = 0;

/** U256Factory.create / .fromString → low‑level code  */
function transformFactoryCalls(sf: SourceFile): void {
  sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
    const calleeTxt = call.getExpression().getText();

    /* U256Factory.create() → U256.create() */
    if (calleeTxt === "U256Factory.create" && call.getArguments().length === 0) {
      call.replaceWithText("U256.create()");
      return;
    }

    /* U256Factory.fromString("...") → malloc + store + setFromString */
    if (calleeTxt === "U256Factory.fromString") {
      const arg = call.getArguments()[0] as Expression;
      if (!arg || arg.getKind() !== SyntaxKind.StringLiteral) return;

      const raw      = (arg as StringLiteral).getLiteralText();
      const mallocId = `__str${strCounter}`;
      const u256Id   = `__u256${strCounter++}`;

      const stores: string[] = [`const ${mallocId} = malloc(${raw.length});`];
      for (let i = 0; i < raw.length; i++) {
        stores.push(`store<u8>(${mallocId} + ${i}, ${raw.charCodeAt(i)});`);
      }

      /* if part of a variable declaration, rewrite full statement */
      const varDecl = call.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
      if (varDecl) {
        const vName = varDecl.getName();
        const stmt  = varDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
        stmt?.replaceWithText([
          ...stores,
          `const ${u256Id}: usize = U256.create();`,
          `U256.setFromString(${u256Id}, ${mallocId}, ${raw.length});`,
          `const ${vName}: usize = ${u256Id};`
        ].join("\n"));
      } else {
        /* fallback IIFE */
        call.replaceWithText([
          `(() => {`,
          ...stores.map(s => "  " + s),
          `  const ${u256Id}: usize = U256.create();`,
          `  U256.setFromString(${u256Id}, ${mallocId}, ${raw.length});`,
          `  return ${u256Id};`,
          `})()`
        ].join("\n"));
      }
    }
  });
}

/*───────────────────────────────────────────────────────────*/
/* 3. U256 instance‑method rewriting                         */
/*───────────────────────────────────────────────────────────*/

function transformInstanceCalls(sf: SourceFile): void {
  // Collect all call expressions first to avoid AST mutation issues
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
  calls.forEach(call => {
    // Gather all info BEFORE any replace/remove
    const expr = call.getExpression();
    const pae = expr.asKind(SyntaxKind.PropertyAccessExpression) as PropertyAccessExpression;
    if (!pae) return;

    const method = pae.getName();
    if (!["add", "sub", "toString"].includes(method)) return;

    const base = pae.getExpression().getText();
    const args = call.getArguments().map(a => a.getText());

    // If this call is part of a variable declaration, ensure the type is usize
    const varDecl = call.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
    if (varDecl && method !== "toString") {
      varDecl.setType("usize");
    }

    // Now you can safely replace
    if (method === "toString") {
      call.replaceWithText(`${base}`);
    } else if (method === "get") {
      call.replaceWithText(`${base}`);
    } else {
      call.replaceWithText(`U256.${method}(${base}, ${args.join(", ")})`);
    }
  });
}

/*───────────────────────────────────────────────────────────*/
/* 4. Flatten @Contract class  +  replace Counter.counter    */
/*───────────────────────────────────────────────────────────*/

function flattenContractClass(sf: SourceFile): void {
  const cls = sf.getClasses().find(c =>
    c.getDecorators().some(d => d.getName() === "Contract")
  ) as ClassDeclaration | undefined;
  if (!cls) return;

  const clsName = cls.getName()!;
  // const staticProps = [...cls.getStaticProperties()];  // keep list before removal
  const staticPropNames = cls.getStaticProperties().map(p => p.getName());
  /* 4.1 helper + slot generation */
  let slotIdx = 0;
  cls.getStaticProperties().forEach(prop => {
    const pName     = prop.getName();            // "counter"
    const slotConst = `__SLOT${slotIdx.toString(16).padStart(2,"0")}`;
    sf.insertStatements(0, `const ${slotConst}: u64 = ${slotIdx};`);

    sf.insertStatements(1, [
      `function ${toFn(pName,true)}(): usize {`,
      `  const ptr = U256.create();`,
      `  storage_load_bytes32(createStorageKey(${slotConst}), ptr);`,
      `  return ptr;`,
      `}`,
      `function ${toFn(pName,false)}(ptr: usize): void {`,
      `  storage_cache_bytes32(createStorageKey(${slotConst}), ptr);`,
      `  storage_flush_cache(0);`,
      `}`,
      ``
    ].join("\n"));

    prop.remove();   // remove static field from class
    slotIdx++;
  });

  /* 4.2 constructor => deploy() */
  const ctor = cls.getConstructors()[0] as ConstructorDeclaration | undefined;
  let ctorBody = "";
  if (ctor) {
    ctorBody = ctor.getBodyText() ?? "";
    ctor.remove();
  }

  /* 4.3 patch methods + add them as free functions */
  cls.getStaticMethods().forEach(m => {
    const bodyPatched = patchBody(m.getBodyText() ?? "", clsName, staticPropNames);
    sf.addFunctions([{
      name: m.getName(),
      isExported: true,
      returnType: m.getReturnType().getText(),
      parameters: m.getParameters().map(p => ({
        name: p.getName(),
        type: p.getType().getText()
      })),
      statements: bodyPatched
    }]);
    m.remove();
  });

  /* 4.4 deploy() function */
  if (ctorBody !== "") {
    const deployBody = patchBody(ctorBody, clsName, staticPropNames);
    sf.addFunctions([{ name:"deploy", isExported:true, returnType:"void", statements: deployBody }]);
  }

  /* 4.5 drop class & decorators */
  cls.remove();
}

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
/*───────────────────────────────────────────────────────────*/

function toFn(name: string, load: boolean) {
  return load ? `load_${name}` : `store_${name}`;
}

/** Replace reads & writes inside a function/constructor body */
function patchBody(body: string, clsName: string, propNames: string[]): string {
  propNames.forEach(p => {
    /* First: replace every read  Counter.counter → load_counter() */
    body = body.replace(
      new RegExp(`${clsName}\\.${p}`, "g"),
      `${toFn(p,true)}()`
    );

    /* Then: replace assignments: load_counter() = <expr>; → const ptr0 = <expr>; store_counter(ptr0); */
    let assignIdx = 0;
    body = body.replace(
      new RegExp(`${toFn(p,true).replace("(","\\(").replace(")","\\)")}\s*=\s*([\s\S]*?);`, "gmi"),
      (match, rhs) => {
        const tempName = `ptr${assignIdx++}`;
        // Preserve any indentation of the original assignment
        const indent = match.match(/^(\s*)/)?.[1] || '';
        return `${indent}const ${tempName} = ${rhs.trim()};\n${indent}${toFn(p,false)}(${tempName});`;
      }
    );
  });
  return body;
}

/** Ensure the file starts with // @ts-nocheck once */
export function ensureNoCheck(sf: SourceFile) {
  // Get the full text and remove any existing // @ts-nocheck (even with leading/trailing whitespace)
  let text = sf.getFullText().replace(/^\s*\/\/\s*@ts-nocheck\s*\n?/gm, "");
  // Prepend // @ts-nocheck as the very first line
  text = `// @ts-nocheck\n${text.trimStart()}`;
  sf.replaceWithText(text);
}
