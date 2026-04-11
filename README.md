# react-slots

A simple utility for adding named slots to React components, inspired by the slot pattern in web components and Vue.

## Features

- **Named slots**: Expand on React's children by defining specific child component options.
- **Structured layout**: Assign your slot components to static locations in the JSX.
- **Multiple/Repeatable slots**: Allow multiple children for a slot by wrapping the slot component in an array.
- **Composed components**: Add components to the namespace without rendering them as slots.
- **TypeScript support**: Strongly typed slot schemas and props.
- **React Server Component support**: Use `getSlots` in server components via the `/server` entry point.
- **Dev-mode warnings**: Actionable console warnings for common mistakes like duplicate slots and schema mismatches.
- **React 18 & 19**: Works with both React ^18 and ^19.
- **Tiny bundle size**: 2.3kb client / 1.8kb server.

**[Try it on StackBlitz](https://stackblitz.com/github/aiera-inc/react-slots/tree/main/example?file=my-component.tsx)**

## Installation

```
npm i @aiera-inc/react-slots
```

## Usage

Slotted components are created using the `SlottedComponent` utility method exported by the library and consumed just like any other React component.

```tsx
import { SlottedComponent } from '@aiera-inc/react-slots';

// Your parent components props
type MyComponentProps = {
  author: string;
};

// The components you are assigning as slots
const SLOT_SCHEMA = {
  Title: (props: { title: string }) => <header>{props.title}</header>,
  Footer: () => <footer>Footer</footer>,
} as const;

// Your slotted component
export const MyComponent = SlottedComponent(SLOT_SCHEMA)<MyComponentProps>(({
  author,
  children,
  slots: { Title, Footer },
}) => {
  return (
    <div>
      {Title}
      <h3>By: {author}</h3>
      <main>{children}</main>
      {Footer}
    </div>
  );
});
```

### Using Your Component

Your slotted component works like any other React component, only it now has several slots added as properties to it.

```tsx
import { MyComponent } from './my-component';

export function App() {
  return (
    <div>
      <MyComponent author="John Doe">
        <MyComponent.Title title="Hello World" />
        <article>This is the main content.</article>
        <article>A second article.</article>
        <MyComponent.Footer />
      </MyComponent>
    </div>
  );
}
```

Note, the order of the slotted child components doesn't actually matter because the `MyComponent` code has placed it in a concrete location within its layout.

```jsx
function App() {
  return (
    <>
      // This is equivalent...
      <MyComponent author="John Doe">
        <MyComponent.Title title="Hello World" />
        <article>This is the main content.</article>
        <article>A second article.</article>
        <MyComponent.Footer />
      </MyComponent>
      // ...to this
      <MyComponent author="John Doe">
        <MyComponent.Title title="Hello World" />
        <MyComponent.Footer />
        <article>This is the main content.</article>
        <article>A second article.</article>
      </MyComponent>
    </>
  );
}
```

## Features

The _slot schema_ has two unique syntax structures that can be used to define **repeated slots** and **namespace slots**.

### Repeated Slots

By default, only one instance of a component will be passed to a slot and the others will be tossed.

```tsx
const ArticleExample = (props) => <article>{props.children}</article>;

const SLOT_SCHEMA = {
  Article: ArticleExample,
} as const;

const Blog = SlottedComponent(SLOT_SCHEMA)<{ author: string }>(({
  author,
  children,
  slots: { Article },
}) => {
  return <div>{Article}</div>;
});

function App() {
  return (
    <Blog author="John Doe">
      <Blog.Article>Article 1</Blog.Article>
      <Blog.Article>Article 2</Blog.Article> // This will be ignored
    </Blog>
  );
}
```

To allow for repeated uses of a slot, you simply need to wrap it in square brackets in the slot schema. This tells the utility that multiple instances of the `<Article />` slot may be passed and should be rendered.

```tsx
const ArticleExample = (props) => <article>{props.children}</article>;

const SLOT_SCHEMA = {
  Article: [ArticleExample],
} as const;
```

### Namespaced Slots (Composed Components)

Sometimes you may want to link components to indicate a relationship between parent and child, but you don't have a concrete location that you want to place the children in your layout. You are effectively namespacing the child component to the parent. This is often also described as **composed components**.

```tsx
const ArticleExample = (props) => <article>{props.children}</article>;

const SLOT_SCHEMA = {
  // Wrapping the component in curly braces
  Article: { ArticleExample }, // tells the utility this is a namespaced
} as const; // component.

const Blog = SlottedComponent(SLOT_SCHEMA)<{ author: string }>(({
  author,
  children, // children contains your Article instances
  slots, // Slots will be an empty object
}) => {
  return <div>{children}</div>;
});

function App() {
  return (
    <Blog author="John Doe">
      <Blog.Article>Article 1</Blog.Article>
      <Blog.Article>Article 2</Blog.Article>
    </Blog>
  );
}
```

## Server Components

The library provides a separate entry point for React Server Components that exports only the pure functions — no hooks, no `'use client'` boundary.

```tsx
// In a server component
import { getSlots } from '@aiera-inc/react-slots/server';

export function ServerLayout({ children }: { children: React.ReactNode }) {
  const { slots, children: rest } = getSlots(children, schema);
  return (
    <div>
      {slots.Header}
      <main>{rest}</main>
    </div>
  );
}
```

The main entry point (`@aiera-inc/react-slots`) includes a `'use client'` directive and re-exports everything from the server module, plus the hook-based APIs.

| Entry point                     | Exports                                                        | RSC-safe        |
| ------------------------------- | -------------------------------------------------------------- | --------------- |
| `@aiera-inc/react-slots`        | `getSlots`, `withSlots`, `SlottedComponent`, `useSlots`, types | No (uses hooks) |
| `@aiera-inc/react-slots/server` | `getSlots`, types                                              | Yes             |

## API Reference

### `getSlots(children, schema)`

Utility to extract slots and non-slot children from a component's children. This is a pure function with no hooks — safe for use in React Server Components via the `/server` entry point.

### `withSlots(Parent, schema)`

Wraps your component and attaches slot components as static properties. The `slots` prop will be injected into your component, containing the slotted children. Client-only (uses hooks internally).

### `SlottedComponent(schema)`

Higher-order component for applying a slot schema in a more declarative way. Client-only (wraps `withSlots`).

### `useSlots(children, schema)`

React hook that extracts slots from children with memoization. Client-only.

```tsx
import { useSlots } from '@aiera-inc/react-slots';

function MyComponent({ children }: { children?: React.ReactNode }) {
  const { slots, children: rest } = useSlots(children, { Title, Footer });
  return (
    <div>
      {slots.Title}
      <main>{rest}</main>
      {slots.Footer}
    </div>
  );
}
```

## TypeScript Types

- `SlotDictionary`: Defines the slot schema.
- `SlotConstructor`: A narrowed component function type for slots.
- `WithSlotProps<P, T>`: Utility type for merging slot props into your component props.
- `SlotProviderInterface<T>`: Interface alternative for slot props.

## Dev-Mode Warnings

In non-production environments, the library warns about common mistakes:

- **Duplicate single-slot**: When multiple children match a single-slot, only the last is kept.
- **Unmatched component**: When a function component child doesn't match any slot in the schema.
- **Invalid schema**: When a schema key has an invalid value.

Warnings are tree-shaken in production builds. The dev check works across Node, Deno, Bun, and Cloudflare Workers via `globalThis.process.env.NODE_ENV` with a `globalThis.__DEV__` fallback.

## Notes

- Fragments are recursively flattened, so slotted children are found regardless of nesting depth.
- Namespaced slots are not included in the `slots` prop.

## License

MIT
