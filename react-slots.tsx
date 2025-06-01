/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A simple library to add named slots to React components. Wrapping your
 * component export in the `withSlots()` method will automatically add
 * (and effectively namespace) the slot components to the parent.
 *
 * _e.g._ export default withSlots(MemberNav, {
 *      ErrorMsg: MemberNavErrorMsg,
 *      SuccessMsg: MemberNavSuccessMsg,
 *      EditButton: MemberNavEditButton
 *    });
 *
 * Any component importing the MemberNav can then pass the slots using
 * <MemberNav>
 *  <MemberNav.ErrorMsg></MemberNav.ErrorMsg>
 *  <MemberNav.SuccessMsg></MemberNav.SuccessMsg>
 *  <MemberNav.EditButton></MemberNav.EditButton>
 * </MemberNav>
 *
 * Named slotted children can be retrieved by calling `getSlots()` in the
 * parent component and passing in the children prop and the same schema used
 * in the export statement.
 *
 * The returned object will map the slot name to the JSX Element. From the
 * above example slots.ErrorMsg would link to the MemberNav.ErrorMsg child.
 *
 * You can allow for repeat slots by wrapping the component type in your schema,
 * in square brackets.
 *
 * _e.g._ export default withSlots(MemberNav, {
 *      ...
 *      SuccessMsg: [MemberNavSuccessMsg],
 *    });
 *
 * This indicates that multiple Success message components can be slotted and
 * returned.
 *
 * Namespaced components are also supported. These are intended to be used when you
 * want to add a child component to the parent's namespace but don't particularly
 * care about where it is surfaced in the Parent JSX. Namespaced components will
 * still be passed to the `getSlots()` method but will not be included in the
 * returned slots object.
 *
 * _e.g._ export default withSlots(MemberNav, {
 *     ...
 *    SuccessMsg: {MemberNavSuccessMsg},
 *    });
 *
 * __Warning__: This does not support nested fragments. Wrapping a slotted child
 * two levels deep in a fragment will cause it to be treated as a generic child.
 */
import React, { type JSXElementConstructor, type ReactNode, useMemo } from 'react';

/** A narrowed version of the React.JSXElementConstructor. */
export type SlotConstructor<P = any> = (props: P) => React.ReactElement | null;

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
type Slots<T extends SlotDictionary> = {
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
        ? JSX.Element[]
        : JSX.Element;
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
      : K]: T[K] extends readonly [React.JSXElementConstructor<any>] ? JSX.Element[] : JSX.Element;
  };
}

/** Reference to the React Fragment type. */
const ReactFragmentSymbol = Symbol.for('react.fragment');

/**
 * Creates a record containing the JSX elements
 * passed as children on the component
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

  for (const slot in schema) {
    if (Array.isArray(schema[slot])) {
      constructorMap.set(schema[slot][0], slot);
      sortedSlots[slot] = [] as Partial<Slots<D>>[Extract<keyof D, string>];
    } else {
      constructorMap.set(schema[slot], slot);
    }
  }

  return (
    _children
      // Excludes all falsy values from the children array (null, undefined, etc)
      .filter((c) => c)
      // @ts-expect-error - A react element's type is not a string... it's a symbol.
      .flatMap((e) => (e.type === ReactFragmentSymbol ? (e.props?.children ?? []) : e))
      .reduce(
        (p, cv) => {
          const childType = cv.type;

          if (typeof childType !== 'string' && constructorMap.has(childType)) {
            const key = constructorMap.get(childType);
            const allowMultiple = Array.isArray(schema[key]);

            if (!allowMultiple) {
              // Only one instance of element. Insert
              p.slots[key] = cv;
            } else if (!(key in p.slots)) {
              // Multiple allowed - first ecounter
              p.slots[key] = [cv];
            } else if (Array.isArray(p.slots[key])) {
              // Multiple allowed - stack 'em
              (p.slots[key] as JSX.Element[]).push(cv);
            } else {
              // Multiple allowed - encounter second instance of element
              p.slots[key] = [p.slots[key] as JSX.Element, cv];
            }
          } else {
            p.children.push(cv);
          }

          return p;
        },
        { children: sortedChildren, slots: sortedSlots as Slots<D> },
      )
  );
}

/**
 * Resolves a child slot from various possible input types.
 *
 * This utility function accepts a child slot which can be:
 * - A React component constructor,
 * - A tuple containing a single React component constructor,
 * - An object with a single property whose value is a React component constructor.
 *
 * The function normalizes the input and returns the underlying React component constructor.
 *
 * @typeParam C - The type of the child slot, which can be a React component constructor,
 *                a tuple of one React component constructor, or an object mapping strings
 *                to React component constructors.
 * @param child - The child slot to resolve.
 * @returns The resolved React component constructor.
 */
function resolveChildSlot<
  T extends
    | React.JSXElementConstructor<any>
    | readonly [React.JSXElementConstructor<any>]
    | { [x: string]: React.JSXElementConstructor<any> },
>(child: T) {
  if (Array.isArray(child)) return child[0];

  if (typeof child === 'object' && Object.keys(child).length === 1) {
    return Object.values(child)[0];
  }

  return child;
}

/**
 * Automatically applies a Slot Signature to the
 * parent component
 * @param parent
 * @param schema
 * @returns
 */
export function withSlots<P extends { children?: ReactNode }, T extends SlotDictionary>(
  Parent: JSXElementConstructor<P>,
  schema: T,
) {
  /** Takes the incoming children and separates out any with element
   * constructors matching definitions used in the schema. The separated
   * elements are stored under the slots */
  function SlotProvider(props: {
    [K in keyof P as K extends 'slots' ? never : K]: P[K];
  }) {
    const { slots, children } = useMemo(() => getSlots(props?.children, schema), [props?.children]);

    return (
      <Parent {...(props as P)} slots={slots}>
        {children}
      </Parent>
    );
  }

  const slots = Object.fromEntries(
    Object.entries(schema).map(([key, val]) => [key, resolveChildSlot(val)]),
  ) as {
    readonly [Property in keyof T]: T[Property] extends readonly [SlotConstructor]
      ? T[Property]['0']
      : T[Property] extends { [x: string]: React.JSXElementConstructor<infer P> }
        ? SlotConstructor<P>
        : T[Property];
  };

  return Object.assign(SlotProvider, slots);
}

/**
 * A higher order component that wraps a parent component
 * and automatically applies the slot schema to the parent
 * component. This allows for a more declarative way of
 * defining slots in your components.
 *
 * @param schema - The slot schema to apply to the parent component.
 * @returns A higher order component that wraps the parent component.
 */
export function SlottedComponent<T extends SlotDictionary>(schema: T) {
  return function <P>(Parent: JSXElementConstructor<WithSlotProps<P, T>>) {
    return withSlots(Parent, schema);
  };
}
