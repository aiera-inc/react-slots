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
