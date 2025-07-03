import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button.jsx';

describe('Button component', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
