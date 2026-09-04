// MoveJS website - UI components guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  seo: {
    title: 'UI Components - MoveJS Documentation',
    description: 'The MoveJS UI kit: form controls, layout primitives, feedback components, overlays and loading states — styleable and themeable.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/ui'
  }
};

export default function Ui() {
  return (
    <LearnLayout slug="ui">
      <h1>UI Components</h1>
      <p className="doc-lede">
        The <code>@movejs/ui</code> package ships accessible, styleable building blocks for forms,
        layout, feedback and overlays — tree-shakeable and fully themeable.
      </p>

      <Code lang="bash" filename="install">{`npm install @movejs/ui`}</Code>

      <h2>Primitives</h2>
      <p>Small, composable elements used everywhere:</p>
      <Code lang="tsx" filename="primitives.tsx">{`import { Button, Badge, Spinner, Avatar, Skeleton, Divider, Tooltip } from '@movejs/ui';

<Button variant="primary" size="md" onClick={() => save()}>
  Save
</Button>
<Badge variant="success">Published</Badge>
<Avatar name="Ada Lovelace" src="/ada.jpg" />
<Skeleton height={20} />`}</Code>

      <h2>Forms</h2>
      <p>
        Form controls are label-connected for accessibility and forward their values like native
        elements:
      </p>
      <Code lang="tsx" filename="forms.tsx">{`import { Form, Input, Select, Textarea, Checkbox, RadioGroup, Switch, Slider } from '@movejs/ui';

<Form onSubmit={handleSubmit}>
  <Input name="email" label="Email" type="email" required />
  <Select name="plan" label="Plan">
    <option value="free">Free</option>
    <option value="pro">Pro</option>
  </Select>
  <Checkbox name="terms" label="I agree to the terms" />
  <RadioGroup name="tier" options={tiers} />
  <Switch name="notifications" label="Email notifications" />
  <Slider name="radius" label="Radius" min={0} max={100} />
</Form>`}</Code>

      <h2>Layout</h2>
      <p>Structure pages with layout primitives:</p>
      <Code lang="tsx" filename="layout.tsx">{`import { Container, Grid, Flex, Card, CardHeader, CardBody, Stack, Section } from '@movejs/ui';

<Section>
  <Container>
    <Grid cols={3} gap="md">
      <Card>
        <CardHeader>Revenue</CardHeader>
        <CardBody>$12,480</CardBody>
      </Card>
      <Card>
        <CardHeader>Users</CardHeader>
        <CardBody>3,210</CardBody>
      </Card>
      <Card>
        <CardHeader>Conversion</CardHeader>
        <CardBody>4.2%</CardBody>
      </Card>
    </Grid>
  </Container>
</Section>`}</Code>

      <h2>Feedback</h2>
      <Code lang="tsx" filename="feedback.tsx">{`import { Alert, Banner, Progress, toast } from '@movejs/ui';

<Alert variant="success">Changes saved.</Alert>
<Banner variant="warn">Free plan limit reached.</Banner>
<Progress value={65} max={100} />

toast.success('Upload complete');
toast.error('Something went wrong');`}</Code>

      <h2>Overlays</h2>
      <Code lang="tsx" filename="overlays.tsx">{`import { Modal, Drawer, Popover, ConfirmDialog, LoadingOverlay } from '@movejs/ui';

<Modal open={isOpen} onClose={() => setOpen(false)} title="Settings">
  ...
</Modal>
<Drawer side="right" open={drawerOpen}>...</Drawer>
<ConfirmDialog
  title="Delete item?"
  onConfirm={deleteItem}
/>`}</Code>

      <h2>Theming</h2>
      <p>
        All components read from a shared theme. Override the default palette with{' '}
        <code>createStyles</code> or set CSS variables globally:
      </p>
      <Code lang="ts" filename="theme.ts">{`import { createStyles, defaultTheme, hexToRgba } from '@movejs/ui';

// Swap the primary color across every component
const theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#6366f1',
    primaryDark: hexToRgba('#6366f1', 0.9)
  }
};

const styles = createStyles(theme);`}</Code>

      <Callout type="info">
        Because they render to plain markup, MoveJS UI components work in every render mode — SSR,
        SSG, CSR and Edge — including functions like <code>cx</code> for conditional classes.
      </Callout>
    </LearnLayout>
  );
}