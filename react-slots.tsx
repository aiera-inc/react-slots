'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Client entry point for react-slots. This module re-exports everything from
 * the server module and adds client-only APIs that use React hooks:
 * withSlots, SlottedComponent, and useSlots.
 *
 * For React Server Components, import from '@aiera-inc/react-slots/server'
 * to use getSlots directly without the 'use client' boundary.
 */
import React, { useMemo } from 'react';
import {
  getSlots,
  type SlotConstructor,
  type SlotDictionary,
  type WithSlotProps,
} from './react-slots-server';

// Re-export everything from the server module
export {
  getSlots,
  type SlotConstructor,
  type SlotDictionary,
  type Slots,
  type WithSlotProps,
  type SlotProviderInterface,
} from './react-slots-server';

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
export function withSlots<
  C extends (props: WithSlotProps<any, T>) => React.JSX.Element,
  T extends SlotDictionary,
  P extends React.PropsWithChildren<Parameters<C>[0]> = React.PropsWithChildren<Parameters<C>[0]>,
  _P = { [K in keyof P as K extends 'slots' ? never : K]: P[K] },
  _S = {
    readonly [Property in keyof T]: T[Property] extends readonly [SlotConstructor]
      ? T[Property]['0']
      : T[Property] extends { [x: string]: React.JSXElementConstructor<infer P> }
        ? SlotConstructor<P>
        : T[Property];
  },
>(Parent: C, schema: T): React.FC<_P> & _S {
  /** Takes the incoming children and separates out any with element
   * constructors matching definitions used in the schema. The separated
   * elements are stored under the slots */
  function SlotProvider(props: React.PropsWithChildren<_P>): React.JSX.Element {
    const { slots, children } = useMemo(() => getSlots(props?.children, schema), [props?.children]);

    return <Parent {...({ ...props, slots } as P)}>{children}</Parent>;
  }

  for (const key in schema) {
    (SlotProvider as any)[key] = resolveChildSlot(schema[key]);
  }
  return SlotProvider as React.FC<_P> & _S;
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
  return function <P>(Parent: (props: WithSlotProps<P, T>) => React.JSX.Element) {
    return withSlots(Parent, schema);
  };
}

/**
 * A custom React hook that extracts and organizes slot components from the given children
 * based on a provided slot schema. Returns an object containing the extracted slots and
 * the remaining children that do not match any slot in the schema.
 *
 * @experimental
 * @param children - The React children elements to be processed for slot extraction.
 * @param schema - An object defining the expected slots and their types.
 * @returns An object with two properties:
 *   - slots: An object mapping slot names to their corresponding React elements.
 *   - children: The remaining React children that were not matched to any slot.
 */
export function useSlots<T extends SlotDictionary>(children: React.ReactNode, schema: T) {
  const { slots, children: filteredChildren } = useMemo(
    () => getSlots(children, schema),
    [children, schema],
  );

  return { slots, children: filteredChildren };
}
