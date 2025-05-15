# Assembly Script Stylus SDK - Sistema de Transformación IR

Este documento explica la jerarquía y el flujo de procesamiento de los tipos de statements y expressions en el sistema de transformación IR (Intermediate Representation) a código AssemblyScript.

## Jerarquía de Tipos

### Estructura de Alto Nivel

```
IRContract
├── name: string
├── methods: IRMethod[]
├── constructor?: IRConstructor
└── variables: IRVariable[]
```

### Tipos de Métodos y Variables

```
IRMethod
├── name: string
├── visibility: AbiVisibility
├── stateMutability: AbiStateMutability
├── inputs: AbiInput[]
├── outputs: AbiOutput[]
└── ir: IRStatement[]

IRConstructor
├── inputs: AbiInput[]
├── constructor: ts-morph.ConstructorDeclaration
└── ir: IRStatement[]

IRVariable
├── name: string
├── type: string
└── slot: number
```

### Jerarquía de Statements (IRStatement)

Los statements son instrucciones completas que componen el cuerpo de un método:

```
IRStatement
├── { kind: "let", name: string, expr: IRExpression }
├── { kind: "assign", target: string, expr: IRExpression }
├── { kind: "expr", expr: IRExpression }
├── { kind: "return", expr: IRExpression }
└── { kind: "if", condition: IRExpression, then: IRStatement[], else?: IRStatement[] }
```

### Jerarquía de Expressions (IRExpression)

Las expressions son fragmentos de código que producen valores:

```
IRExpression
├── { kind: "literal", value: string | number | boolean }
├── { kind: "var", name: string }
├── { kind: "call", target: string, args: IRExpression[] }
├── { kind: "member", object: IRExpression, property: string }
└── { kind: "binary", op: string, left: IRExpression, right: IRExpression }
```

## Flujo de Procesamiento

### 1. Análisis y Generación de IR

El código de AssemblyScript se analiza y se convierte a una representación intermedia (IR) que sigue las estructuras definidas anteriormente.

### 2. Transformación IR a AssemblyScript

#### Proceso de Emisión de Código

```
emitContractTs                           # Punto de entrada principal
├── Genera imports                       # IMPORT_BLOCK
├── Genera constantes de slot            # slotConst()
├── Genera funciones de storage          # loadFn() y storeFn()
├── Genera función deploy                # Si hay constructor
└── Genera métodos del contrato          # Para cada método en contract.methods
    └── emitStatements                   # Para procesar el cuerpo de cada método
        └── emitExpr                     # Para procesar las expresiones
```

#### Flujo de Statements (emitStatements)

Para cada statement de tipo IRStatement:

1. **let** - Genera declaración constante: `const name = expr;`
2. **assign** - Genera asignación:
   - Para propiedades de almacenamiento: `const __ptr0 = expr; store_property(__ptr0);`
   - Para variables locales: `target = expr;`
3. **expr** - Genera expresión standalone: `expr;`
4. **return** - Genera return: `return expr;`
5. **if** - Genera if/else con bloques anidados: `if (condition) { ... } else { ... }`

#### Flujo de Expressions (emitExpr)

Para cada expresión de tipo IRExpression:

1. **literal** - Valores literales: `"value"`
2. **var** - Referencias a variables: `name`
3. **member** - Acceso a propiedades:
   - Para propiedades del contrato: `load_property()`
   - Para otros objetos: `object.property`
4. **call** - Llamadas a funciones:
   - U256Factory.create: `U256.create()`
   - Métodos de U256: `U256.add(load_property(), arg)`
   - Llamadas genéricas: `target(args...)`
5. **binary** - Operaciones binarias:
   - Asignación (=): Manejada especialmente
   - Otras operaciones: `left op right`

## Casos Especiales

### Storage y Memoria

El sistema maneja automáticamente la transformación entre accesos a propiedades del contrato y las funciones `load_X()` y `store_X()` que abstraen el acceso al almacenamiento.

### Procesamiento de U256

Se manejan conversiones especiales para los tipos `U256` y operaciones relacionadas, mapeándolas a las implementaciones correspondientes en el runtime de Stylus.

## Ejemplo de Flujo Completo

Para el código de contrato:

```typescript
@External
static increment(): void {
  const delta: U256 = U256Factory.fromString("1");
  Counter.counter = Counter.counter.add(delta);
}
```

Se genera el IR:

```json
[
  {
    "kind": "let",
    "name": "delta",
    "expr": {
      "kind": "call",
      "target": "U256Factory.fromString",
      "args": [{"kind": "literal", "value": "1"}]
    }
  },
  {
    "kind": "assign",
    "target": "Counter.counter",
    "expr": {
      "kind": "call",
      "target": "Counter.counter.add",
      "args": [{"kind": "var", "name": "delta"}]
    }
  }
]
```

Y finalmente se emite el código AssemblyScript:

```typescript
const delta = U256.create(); // U256Factory.fromString transformado
U256.setFromString(delta, "1");

const __ptr0 = U256.add(load_counter(), delta);
store_counter(__ptr0);
```
