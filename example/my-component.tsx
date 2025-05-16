import { SlottedComponent } from '../react-slots';

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
