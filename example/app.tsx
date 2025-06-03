import { MyComponent } from './my-component';
import { GenericExample } from './generic-example';

export function App() {
  return (
    <div>
      <MyComponent author="John Doe">
        <MyComponent.Title title="Hello World" />
        <article>This is the main content.</article>
        <article>A second article.</article>
        <MyComponent.Footer />
      </MyComponent>

      <GenericExample<number> filterId={4}>
        <GenericExample.Title title="Older Syntax Example" />
        <article>This is the main content of the older syntax example.</article>
        <article>A second article in the older syntax example.</article>
        <GenericExample.Footer />
      </GenericExample>
    </div>
  );
}
