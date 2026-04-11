/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Server-safe entry point for react-slots. This module exports only the
 * pure functions and types that work in React Server Components — no hooks.
 *
 * For the full API including withSlots, SlottedComponent, and useSlots,
 * import from '@aiera-inc/react-slots' instead (requires 'use client').
 */
import React from 'react';

/** A narrowed version of the React.JSXElementConstructor. */
export type SlotConstructor<P = any> = (props: P) => React.JSX.Element | null;

/** A dictionary defining the types of slots on an element. Each key should
 * point to a React component or a tuple containing a React component. The
 * tuple indicates that multiple instances of the component are allowed.
 * The component type should be a function that returns a valid React element. */
export type SlotDictionary<P = any> = {
  [x: string]:
    | React.JSXElementConstructor<P>
    | readonly [React.JSXElementConstructor<P>]
    | { [x: string]: React.JSXElementConstructor<P> };
};

/** This looks deceivingly complex but it's realy just because of the nested
 * ternaries that TypeScript syntax requires.
 *
 * For every key in the SlotDictionary, we check if the value is a tuple
 * containing a SlotConstructor. If it is, we return the return type of the
 * first element of the tuple. If it's not a tuple, we check if it's an object
 * containing SlotConstructors. If it is, we return the union of all the
 * SlotConstructors. If it's not an object, we check if it's a single
 * SlotConstructor and return it's return type.
 */
export type Slots<T extends SlotDictionary> = {
  [Property in keyof T]: T[Property] extends [SlotConstructor]
    ? ReturnType<T[Property]['0']> | ReturnType<T[Property]['0']>[]
    : T[Property] extends { [x: string]: SlotConstructor }
      ? T[Property][keyof T[Property]]
      : T[Property] extends SlotConstructor
        ? ReturnType<T[Property]> | ReturnType<T[Property]>[]
        : any;
};

/** A utility type that will merge the slot definitions from
 * your Slot Schema into the component props. */
export type WithSlotProps<P, T extends SlotDictionary> = React.PropsWithChildren<
  P & {
    slots: {
      [K in keyof T as T[K] extends { readonly [x: string]: SlotConstructor }
        ? never
        : K]: T[K] extends readonly [React.JSXElementConstructor<any>]
        ? React.JSX.Element[]
        : React.JSX.Element;
    };
  }
>;

/** Alternative utility type if you prefer to declare your component props
 * using the `interface` keyword. */
export interface SlotProviderInterface<T extends SlotDictionary> {
  children?: React.ReactNode | undefined;
  slots: {
    [K in keyof T as T[K] extends { readonly [x: string]: SlotConstructor }
      ? never
      : K]: T[K] extends readonly [React.JSXElementConstructor<any>]
      ? React.JSX.Element[]
      : React.JSX.Element;
  };
}

/**
 * Runtime-agnostic development mode check. Works across Node, Deno, Bun,
 * Cloudflare Workers, and browsers. Returns false if NODE_ENV is not available.
 */
const __DEV__: boolean = /* @__PURE__ */ (() => {
  try {
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    if (g?.process?.env?.NODE_ENV === 'production') return false;
    if (g?.__DEV__ === true) return true;
    // Only enable dev mode if NODE_ENV is explicitly set to something other than 'production'
    return g?.process?.env?.NODE_ENV != null && g.process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

/** Reference to the React Fragment type via public API. */
const ReactFragmentType = React.Fragment;

/** Recursively flattens React.Fragment wrappers from a children array. */
function flattenFragments(nodes: React.ReactNode[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  for (const node of nodes) {
    if (
      node &&
      typeof node === 'object' &&
      'type' in node &&
      (node as any).type === ReactFragmentType
    ) {
      const nested = (node as any).props?.children ?? [];
      result.push(...flattenFragments(Array.isArray(nested) ? nested : [nested]));
    } else {
      result.push(node);
    }
  }
  return result;
}

/**
 * Creates a record containing the JSX elements
 * passed as children on the component. This is a pure function
 * with no hooks — safe for use in React Server Components.
 * @param children
 * @param schema
 * @returns
 */
export function getSlots<D extends SlotDictionary>(
  children: undefined | React.ReactNode | React.ReactNode[],
  schema: D,
): {
  slots: Slots<D>;
  children: (undefined | React.ReactNode | React.ReactNode[])[];
} {
  const sortedChildren: (undefined | React.ReactNode | React.ReactNode[])[] = [];
  const sortedSlots: Partial<Slots<D>> = {};
  const constructorMap = new WeakMap();

  let _children: React.ReactNode[];

  if (!children) {
    _children = [];
  } else if (!Array.isArray(children)) {
    _children = [children];
  } else {
    _children = children;
  }

  // Track namespaced component constructors so we don't warn about them
  const namespacedConstructors = new WeakSet();

  for (const slot in schema) {
    const value = schema[slot];
    if (Array.isArray(value)) {
      if (__DEV__ && typeof value[0] !== 'function') {
        console.warn(
          `[react-slots] Schema key "${slot}" has an invalid array value. Expected [ComponentFunction].`,
        );
      }
      constructorMap.set(value[0], slot);
      sortedSlots[slot] = [] as Partial<Slots<D>>[Extract<keyof D, string>];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Namespaced slot — register inner components to suppress false-positive warnings
      for (const inner of Object.values(value)) {
        if (typeof inner === 'function') namespacedConstructors.add(inner);
      }
    } else if (__DEV__ && typeof value !== 'function') {
      console.warn(
        `[react-slots] Schema key "${slot}" has an invalid value. Expected a component function, [component] array, or { component } object.`,
      );
    } else {
      constructorMap.set(value, slot);
    }
  }

  // Flatten fragments recursively, then filter out falsy values
  const flattened = flattenFragments(_children.filter((c) => c)).filter((c) => c) as any[];

  return flattened.reduce(
    (p, cv) => {
      const childType = cv.type;

      if (typeof childType !== 'string' && constructorMap.has(childType)) {
        const key = constructorMap.get(childType);
        const allowMultiple = Array.isArray(schema[key]);

        if (!allowMultiple) {
          if (__DEV__ && key in p.slots) {
            const name = childType.displayName || childType.name || 'Unknown';
            console.warn(
              `[react-slots] Duplicate slot "${key}" detected (component: ${name}). Only the last instance will be rendered. To allow multiple, use array syntax: { ${key}: [${name}] }`,
            );
          }
          // Only one instance of element. Insert
          p.slots[key] = cv;
        } else {
          // Multiple allowed - array is pre-initialized in schema setup
          (p.slots[key] as React.JSX.Element[]).push(cv);
        }
      } else {
        if (__DEV__ && typeof childType === 'function' && !namespacedConstructors.has(childType)) {
          const name = childType.displayName || childType.name || 'Unknown';
          const schemaKeys = Object.keys(schema).join(', ');
          console.warn(
            `[react-slots] Component "${name}" was passed as a child but doesn't match any slot in the schema. It will be treated as a generic child. Available slots: [${schemaKeys}]`,
          );
        }
        p.children.push(cv);
      }

      return p;
    },
    { children: sortedChildren, slots: sortedSlots as Slots<D> },
  );
}
