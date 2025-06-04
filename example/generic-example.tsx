import { useSlots } from '../react-slots';

// Your parent components props
type GenericProps<T> = {
  filterId: T;
  otherProp?: string;
};

const Title = (props: { title: string }) => <header>{props.title}</header>;
const Footer = () => <footer>Footer</footer>;

function GenericExample_<T>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filterId,
  children: _children,
}: React.PropsWithChildren<GenericProps<T>>) {
  const { slots } = useSlots(_children, { Title, Footer });

  return (
    <div>
      {slots.Title}
      <h3>Generic Syntax Example</h3>
      {slots.Footer}
    </div>
  );
}

export const GenericExample = Object.assign(GenericExample_, { Title, Footer });
