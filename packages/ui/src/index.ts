// MoveJS UI - Accessible, performance-optimized component library

// Primitives
export {
  Button,
  Badge,
  Spinner,
  Divider,
  Avatar,
  Skeleton,
  Tooltip
} from './primitives/index';
export type {
  ButtonProps,
  BadgeProps,
  SpinnerProps,
  DividerProps,
  AvatarProps,
  SkeletonProps,
  TooltipProps
} from './primitives/index';

// Forms
export {
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Form,
  Switch,
  Slider
} from './forms/index';
export type {
  InputProps,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  RadioProps,
  FormProps,
  SwitchProps,
  SliderProps
} from './forms/index';

// Feedback
export {
  Alert,
  Banner,
  Progress,
  toast,
  LoadingState
} from './feedback/index';
export type {
  AlertProps,
  BannerProps,
  ProgressProps,
  ToastOptions,
  LoadingStateProps
} from './feedback/index';

// Layout
export {
  Container,
  Grid,
  Flex,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  Section,
  Spacer
} from './layout/index';
export type {
  ContainerProps,
  GridProps,
  FlexProps,
  CardProps,
  StackProps,
  SectionProps,
  SpacerProps
} from './layout/index';

// Overlay
export {
  Modal,
  Drawer,
  Popover,
  ConfirmDialog,
  LoadingOverlay,
  Backdrop
} from './overlay/index';
export type {
  ModalProps,
  DrawerProps,
  PopoverProps,
  ConfirmDialogProps,
  LoadingOverlayProps,
  BackdropProps
} from './overlay/index';

// Data display
export {
  Table,
  TableHead,
  TableBody,
  TableFoot,
  TableRow,
  TableCell,
  TableHeaderCell,
  Pagination,
  List,
  ListItem,
  EmptyState,
  Stat
} from './data/index';
export type {
  TableProps,
  PaginationProps,
  ListProps,
  EmptyStateProps,
  StatProps
} from './data/index';

// Shared
export { defaultTheme, cx, hexToRgba } from './shared';
export type { ThemeConfig, Variant, Size, BaseProps } from './shared';

// Version
export const VERSION = '0.1.0';
