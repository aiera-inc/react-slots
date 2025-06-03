import { type WithSlotProps, withSlots } from '../react-slots';

// Your parent components props
type GenericProps<T> = {
  filterId: T;
  otherProp?: string;
};

// The components you are assigning as slots
const SLOT_SCHEMA = {
  Title: (props: { title: string }) => <header>{props.title}</header>,
  Footer: () => <footer>Footer</footer>,
} as const;

function _GenericExample<T>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filterId,
  slots: { Title, Footer },
}: WithSlotProps<GenericProps<T>, typeof SLOT_SCHEMA>) {
  return (
    <div>
      {Title}
      <h3>Generic Syntax Example</h3>
      {Footer}
    </div>
  );
}

export const GenericExample = withSlots<typeof _GenericExample, typeof SLOT_SCHEMA, true>(
  _GenericExample,
  SLOT_SCHEMA,
);
