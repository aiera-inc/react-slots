import ReactDOM from 'react-dom/client';
import { MyComponent } from './my-component';
import { GenericExample } from './generic-example';

function App() {
  return (
    <div>
      <h1>react-slots playground</h1>

      <h2>
        <code>SlottedComponent</code> example
      </h2>
      <section>
        <MyComponent author="John Doe">
          <MyComponent.Title title="Hello World" />
          <article>This is the main content.</article>
          <article>A second article.</article>
          <MyComponent.Footer />
        </MyComponent>
      </section>

      <h2>
        <code>useSlots</code> hook example
      </h2>
      <section>
        <GenericExample filterId="demo">
          <GenericExample.Title title="Generic Syntax" />
          <GenericExample.Footer />
        </GenericExample>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
