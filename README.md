# react-slots

A simple utility for adding named slots to React components, inspired by the slot pattern in web components and Vue.

## Features

- **Named slots**: Expand on React's children by defining specific child component options.
- **Structured layout**: Assign your slot components to static locations in the JSX.
- **Multiple/Repeatable slots**: Allow multiple children for a slot by wrapping the slot component in an array.
- **Composed components**: Add components to the namespace without rendering them as slots.
- **TypeScript support**: Strongly typed slot schemas and props.
- **Tiny bundle size**: A whopping 1.1kb file.

## Installation

Add the package to your React application using your preferred package manager.

```
npm i aiera-inc/react-slots
```

Alternatively copy the `react-slots.tsx` file directly into your project. It's that small!

## Usage

Slotted components are created using the `SlottedComponent` utility method exported by the library and consumed just like any other React component.

```tsx
import { SlottedComponent } from 'react-slots';

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

Note, the order of the slotted child components doesn't actually matter because the `MyComponent` code has placed it in a concrete location within it's layout.

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
const Article = (props) => <article>{props.children}</article>;

const SLOT_SCHEMA = {
  Article: Article,
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
const Article = (props) => <article>{props.children}</article>;

const SLOT_SCHEMA = {
  Article: [Article],
} as const;
```

### Namespaced Slots (Composed Components)

Sometimes you may want to link components to indicate a relationship between parent and child, but you don't have a concrete location that you want to place the children in your layout. You are effectively namespacing the child component to the parent. This is often also described as **composed components**.

```tsx
const Article = (props) => <article>{props.children}</article>;

const SLOT_SCHEMA = {
  // Wrapping the component in curly braces
  Article: { Article }, // tells the utility this is a namespaced
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

## API Reference

### `withSlots(Parent, schema)`

Wraps your component and attaches slot components as static properties. The `slots` prop will be injected into your component, containing the slotted children.

### `getSlots(children, schema)`

Utility to extract slots and non-slot children from a component's children.

### `SlottedComponent(schema)`

Higher-order component for applying a slot schema in a more declarative way.

## TypeScript Types

- `SlotDictionary`: Defines the slot schema.
- `WithSlotProps`: Utility type for merging slot props into your component props.
- `SlotProviderInterface`: Interface alternative for slot props.

## Notes

- Nested child fragments of composed components will be automatically flattened.
- Nesting fragments by 2 or more levels is not supported.
- Namespaced slots are not included in the `slots` prop.

## License

MIT
