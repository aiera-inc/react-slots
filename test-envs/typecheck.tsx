/**
 * Type-level tests for react-slots against different React versions.
 * This file is compiled (noEmit) to verify type compatibility — it is never executed.
 */
import React from 'react';
import {
  getSlots,
  type SlotConstructor,
  type SlotDictionary,
  type SlotProviderInterface,
  SlottedComponent,
  type WithSlotProps,
  withSlots,
  useSlots,
} from '../../react-slots';

// --- SlotConstructor accepts a function returning React.JSX.Element | null ---
const TestSlot: SlotConstructor<{ label: string }> = ({ label }) => <span>{label}</span>;
const NullSlot: SlotConstructor = () => null;

// --- SlotDictionary accepts single, multi, and namespaced slots ---
const schema = {
  Single: TestSlot,
  Multi: [TestSlot],
  Namespaced: { TestSlot },
} as const satisfies SlotDictionary;

// --- getSlots returns slots and children ---
const { slots, children } = getSlots(<TestSlot label="hi" />, schema);
void slots.Single;
void slots.Multi;
const _children: (undefined | React.ReactNode | React.ReactNode[])[] = children;

// --- WithSlotProps merges slots into component props ---
type MyProps = { title: string };
type Slotted = WithSlotProps<MyProps, typeof schema>;
const _check: Slotted = {} as Slotted;
const _title: string = _check.title;
const _slotSingle: React.JSX.Element = _check.slots.Single;
const _slotMulti: React.JSX.Element[] = _check.slots.Multi;
// Namespaced slots should NOT appear in slots type
type SlotKeys = keyof Slotted['slots'];
const _keys: SlotKeys = '' as 'Single' | 'Multi';

// --- SlotProviderInterface works with interface extends ---
interface ExtendedProps extends SlotProviderInterface<typeof schema> {
  extra: number;
}
const _ext: ExtendedProps = {} as ExtendedProps;
const _extra: number = _ext.extra;
const _extSlotSingle: React.JSX.Element = _ext.slots.Single;
const _extSlotMulti: React.JSX.Element[] = _ext.slots.Multi;
const _extChildren: React.ReactNode | undefined = _ext.children;

// --- withSlots attaches static slot properties ---
const Wrapped = withSlots(
  (props: WithSlotProps<{ text: string }, typeof schema>) => <div>{props.text}</div>,
  schema,
);
const _staticSlot: SlotConstructor<{ label: string }> = Wrapped.Single;

// --- SlottedComponent curried form works ---
const Slotted2 = SlottedComponent(schema)<{ text: string }>((props) => (
  <div>{props.slots.Single}</div>
));

// --- useSlots hook returns correct types ---
function HookConsumer({ children: c }: { children?: React.ReactNode }) {
  const { slots: s } = useSlots(c, schema);
  return <div>{s.Single}</div>;
}

// Suppress unused variable warnings — this file is type-only
void [
  TestSlot,
  NullSlot,
  _children,
  _check,
  _title,
  _slotSingle,
  _slotMulti,
  _keys,
  _ext,
  _extra,
  _extSlotSingle,
  _extSlotMulti,
  _extChildren,
  _staticSlot,
  Slotted2,
  HookConsumer,
];
