import '@testing-library/jest-dom';
import React from 'react';
import {
  getSlots,
  type SlotProviderInterface,
  SlottedComponent,
  type WithSlotProps,
  withSlots,
} from './react-slots';
import { render } from '@testing-library/react';
import { expectTypeOf } from 'expect-type';

const GenericDiv: React.FC<{ text?: string }> = ({ text = 'slot' }) => <div>{text}</div>;
const SLOT_SCHEMA = { GenericDiv: [GenericDiv] } as const;

describe('WithSlotProps', function () {
  test('WithSlotProps should have correct type', () => {
    type WrappedProps = { myProp: string };
    type SlottedProps = WithSlotProps<
      WrappedProps,
      { readonly GenericDiv: () => React.JSX.Element }
    >;

    expectTypeOf<SlottedProps>().toEqualTypeOf<
      WrappedProps & { slots: { readonly GenericDiv: React.JSX.Element } } & {
        children?: React.ReactNode | undefined;
      }
    >();
  });

  test('WithSlotProps should have correct type with multiple slots', () => {
    type WrappedProps = { myProp: string };
    type SlottedProps = WithSlotProps<WrappedProps, typeof SLOT_SCHEMA>;

    expectTypeOf<SlottedProps>().toEqualTypeOf<
      WrappedProps & { slots: { readonly GenericDiv: React.JSX.Element[] } } & {
        children?: React.ReactNode | undefined;
      }
    >();
  });

  test('WithSlotProps should not have namespaced slot types', () => {
    type WrappedProps = { myProp: string };
    type SlottedProps = WithSlotProps<
      WrappedProps,
      { readonly Namespaced: { GenericDiv: () => React.JSX.Element } }
    >;

    expectTypeOf<SlottedProps>().toEqualTypeOf<
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      WrappedProps & { slots: {} } & { children?: React.ReactNode | undefined }
    >();
  });
});

describe('SlotProviderInterface', () => {
  test('SlotProviderInterface should have correct type', () => {
    interface ExtendedProps extends SlotProviderInterface<{
      readonly GenericDiv: () => React.JSX.Element;
    }> {
      myProp: string;
    }

    expectTypeOf<ExtendedProps['myProp']>().toEqualTypeOf<string>();
    expectTypeOf<ExtendedProps['slots']>().toEqualTypeOf<{
      readonly GenericDiv: React.JSX.Element;
    }>();
    expectTypeOf<ExtendedProps['children']>().toEqualTypeOf<React.ReactNode | undefined>();
  });

  test('SlotProviderInterface should have correct type with multiple slots', () => {
    interface ExtendedProps extends SlotProviderInterface<typeof SLOT_SCHEMA> {
      myProp: string;
    }

    expectTypeOf<ExtendedProps['myProp']>().toEqualTypeOf<string>();
    expectTypeOf<ExtendedProps['slots']>().toEqualTypeOf<{
      readonly GenericDiv: React.JSX.Element[];
    }>();
    expectTypeOf<ExtendedProps['children']>().toEqualTypeOf<React.ReactNode | undefined>();
  });

  test('SlotProviderInterface should not have namespaced slot types', () => {
    interface ExtendedProps extends SlotProviderInterface<{
      readonly Namespaced: { GenericDiv: () => React.JSX.Element };
    }> {
      myProp: string;
    }

    expectTypeOf<ExtendedProps['myProp']>().toEqualTypeOf<string>();
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    expectTypeOf<ExtendedProps['slots']>().toEqualTypeOf<{}>();
    expectTypeOf<ExtendedProps['children']>().toEqualTypeOf<React.ReactNode | undefined>();
  });
});

describe('getSlots', () => {
  test('handles undefined children', () => {
    const { children } = getSlots(undefined, SLOT_SCHEMA);

    expect(Array.isArray(children)).toBeTruthy();
    expect(children).toHaveLength(0);
  });

  test('handles single child', () => {
    const _children = <GenericDiv />;

    const { children } = getSlots(_children, {});

    expect(Array.isArray(children)).toBeTruthy();
    expect(children).toHaveLength([_children].length);
  });

  test('handles multiple children', () => {
    const _children = [<GenericDiv />, <GenericDiv />];

    const { children } = getSlots(_children, {});

    expect(Array.isArray(children)).toBeTruthy();
    expect(children).toHaveLength(_children.length);
  });

  test('handles single of slot', () => {
    const _children = <GenericDiv />;

    const { children, slots } = getSlots(_children, SLOT_SCHEMA);

    expect(Array.isArray(children)).toBeTruthy();
    expect(children).toHaveLength(0);

    expect(slots).toHaveProperty('GenericDiv');
    expect(Array.isArray(slots.GenericDiv)).toBeTruthy();
    expect(slots.GenericDiv).toHaveLength(1);
    expect(slots.GenericDiv[0]).toMatchObject(_children);
  });

  test('handles multiples of slot', () => {
    const _children = [
      <GenericDiv key="1" />,
      <GenericDiv key="2" />,
      <GenericDiv key="3" />,
      <div key="4" />,
    ];

    const { children, slots } = getSlots(_children, SLOT_SCHEMA);

    expect(Array.isArray(children)).toBeTruthy();
    expect(children).toHaveLength(1);

    expect(slots).toHaveProperty('GenericDiv');
    expect(Array.isArray(slots.GenericDiv)).toBeTruthy();
    expect(slots.GenericDiv).toHaveLength(_children.length - 1);
  });

  test('handles namespaced slot', () => {
    const _children = <GenericDiv />;
    const { children, slots } = getSlots(_children, { Namespaced: { GenericDiv } });

    expect(children).toHaveLength([_children].length);
    expect(slots).not.toHaveProperty('Namespaced');
  });

  test('flattens fragments', () => {
    const _children = [
      <GenericDiv key="1" />,
      <GenericDiv key="2" />,
      <GenericDiv key="3" />,
      <div key="4" />,
      <React.Fragment key="5">
        <GenericDiv key="6" />
        <GenericDiv key="7" />
        <GenericDiv key="8" />
      </React.Fragment>,
    ];

    const { children, slots } = getSlots(_children, SLOT_SCHEMA);

    expect(Array.isArray(children)).toBeTruthy();
    expect(children).toHaveLength(1);

    expect(slots).toHaveProperty('GenericDiv');
    expect(Array.isArray(slots.GenericDiv)).toBeTruthy();
    expect(slots.GenericDiv).toHaveLength(6);
  });

  test('getSlots handles falsy children (null, false, undefined)', () => {
    const _children = [null, false, undefined, <GenericDiv key="1" />];
    const { children, slots } = getSlots(_children, SLOT_SCHEMA);
    expect(children).toHaveLength(0);
    expect(slots.GenericDiv).toBeDefined();
  });

  test('flattens nested fragments recursively', () => {
    const _children = [
      <React.Fragment key="1">
        <React.Fragment>
          <GenericDiv key="2" />
        </React.Fragment>
      </React.Fragment>,
    ];
    const { children, slots } = getSlots(_children, SLOT_SCHEMA);
    expect(children).toHaveLength(0);
    expect(Array.isArray(slots.GenericDiv)).toBeTruthy();
    expect(slots.GenericDiv).toHaveLength(1);
  });

  test('flattens deeply nested fragments', () => {
    const _children = [
      <React.Fragment key="1">
        <React.Fragment>
          <React.Fragment>
            <GenericDiv key="2" />
            <div key="3" />
          </React.Fragment>
        </React.Fragment>
      </React.Fragment>,
      <GenericDiv key="4" />,
    ];
    const { children, slots } = getSlots(_children, SLOT_SCHEMA);
    expect(children).toHaveLength(1);
    expect(slots.GenericDiv).toHaveLength(2);
  });

  test('getSlots handles aliased children', () => {
    const GenericDiv = ({ text = 'slot' }) => <div>{text}</div>;

    const HOC = SlottedComponent({ GenericDiv: [GenericDiv] })(({ slots }) => {
      return (
        <div>
          <div data-testid="slot">{slots.GenericDiv}</div>
        </div>
      );
    });

    const Parent = () => {
      const slot = <HOC.GenericDiv text="generic" />;
      return (
        <HOC>
          {slot}
          <HOC.GenericDiv text=" times two!" />
          <span>child</span>
        </HOC>
      );
    };

    const { getByTestId } = render(<Parent />);
    expect(getByTestId('slot').textContent).toBe('generic times two!');
  });

  test('getSlots converts single element in multi-slot to array', () => {
    const _children = <GenericDiv />;
    const { slots } = getSlots(_children, SLOT_SCHEMA);

    expect(slots.GenericDiv).toBeDefined();
    expect(Array.isArray(slots.GenericDiv)).toBeTruthy();
    expect(slots.GenericDiv).toHaveLength(1);
  });

  test('getSlots converts null element in multi-slot to empty array', () => {
    const _children = null;
    const { slots } = getSlots(_children, SLOT_SCHEMA);

    expect(slots.GenericDiv).toBeDefined();
    expect(Array.isArray(slots.GenericDiv)).toBeTruthy();
    expect(slots.GenericDiv).toHaveLength(0);
  });

  test('getSlots converts undefined element in multi-slot to empty array', () => {
    const _children = undefined;
    const { slots } = getSlots(_children, SLOT_SCHEMA);

    expect(slots.GenericDiv).toBeDefined();
    expect(Array.isArray(slots.GenericDiv)).toBeTruthy();
    expect(slots.GenericDiv).toHaveLength(0);
  });
});

describe('dev-mode warnings', () => {
  let warnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('warns on duplicate single-slot', () => {
    const SingleSchema = { GenericDiv } as const;
    const _children = [<GenericDiv key="1" />, <GenericDiv key="2" />];
    const { slots } = getSlots(_children, SingleSchema);

    // Behavior: last instance wins
    expect(slots.GenericDiv).toBeDefined();

    // Warning fired for the duplicate
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate slot "GenericDiv"'));
  });

  test('warns on unmatched function component', () => {
    const UnknownComponent = () => <span>unknown</span>;
    const _children = [<UnknownComponent key="1" />];
    getSlots(_children, SLOT_SCHEMA);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Component "UnknownComponent" was passed as a child'),
    );
  });

  test('does not warn on unmatched native elements', () => {
    const _children = [<div key="1" />, <span key="2" />];
    getSlots(_children, SLOT_SCHEMA);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('does not warn on namespaced component children', () => {
    const _children = <GenericDiv />;
    getSlots(_children, { Namespaced: { GenericDiv } });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('warns on invalid schema value', () => {
    // @ts-expect-error - intentionally passing invalid schema
    getSlots(undefined, { Bad: 'not a function' });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Schema key "Bad" has an invalid value'),
    );
  });
});

describe('withSlots', () => {
  test('withSlots attaches slot components as static properties', () => {
    const Parent = ({ children }: { children?: React.ReactNode }) => <section>{children}</section>;
    const schema = { SlotA: [GenericDiv] } as const;
    const Wrapped = withSlots(Parent, schema);
    expect(typeof Wrapped.SlotA).toBe('function');
  });

  test('withSlots passes slots and children correctly', () => {
    const Wrapped = withSlots(
      ({ slots, children }: WithSlotProps<object, typeof SLOT_SCHEMA>) => (
        <div>
          <div data-testid="slot">{slots && slots.GenericDiv ? 'slot' : ''}</div>
          <div data-testid="children">{children}</div>
        </div>
      ),
      SLOT_SCHEMA,
    );

    const { getByTestId } = render(
      <Wrapped>
        <GenericDiv />
        <span>child</span>
      </Wrapped>,
    );
    expect(getByTestId('slot').textContent).toBe('slot');
    expect(getByTestId('children').textContent).toBe('child');
  });
});

describe('SlottedComponent', () => {
  test('SlottedComponent HOC returns a component with static slots', () => {
    const HOC = SlottedComponent(SLOT_SCHEMA)(({ slots, children }) => (
      <div>
        <div data-testid="slot">{slots && slots.GenericDiv ? 'slot' : ''}</div>
        <div data-testid="children">{children}</div>
      </div>
    ));
    expect(typeof HOC.GenericDiv).toBe('function');
  });

  test('SlottedComponent HOC returns a component with slots', () => {
    const HOC = SlottedComponent(SLOT_SCHEMA)(({ slots, children }) => (
      <div>
        <div data-testid="slot">{slots && slots.GenericDiv ? 'slot' : ''}</div>
        <div data-testid="children">{children}</div>
      </div>
    ));

    const { getByTestId } = render(
      <HOC>
        <GenericDiv />
        <span>child</span>
      </HOC>,
    );
    expect(getByTestId('slot').textContent).toBe('slot');
    expect(getByTestId('children').textContent).toBe('child');
  });
});
