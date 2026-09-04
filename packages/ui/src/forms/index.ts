import type { BaseProps, Size, Variant } from '../shared';
import { cx } from '../shared';

// Input component
export interface InputProps extends BaseProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  small?: boolean;
  name?: string;
  id?: string;
  onChange?: (e: Event) => void;
  onBlur?: (e: Event) => void;
  onFocus?: (e: Event) => void;
}

export function Input(props: InputProps) {
  const {
    type = 'text',
    label,
    error,
    hint,
    required,
    name,
    className,
    ...rest
  } = props;

  const inputId = props.id || name || `input-${Math.random().toString(36).slice(2, 7)}`;

  return {
    type: 'div',
    props: { className: cx('mj-field', className) },
    children: [
      label && {
        type: 'label',
        props: {
          htmlFor: inputId,
          className: 'mj-label'
        },
        children: [label, required ? ' *' : '']
      },
      {
        type: 'input',
        props: {
          ...rest,
          type,
          id: inputId,
          name,
          required,
          'aria-invalid': error ? 'true' : undefined,
          'aria-describedby': error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined,
          className: cx('mj-input', error && 'mj-input--error')
        },
        children: []
      },
      error && {
        type: 'p',
        props: {
          id: `${inputId}-error`,
          className: 'mj-error',
          role: 'alert'
        },
        children: [error]
      },
      hint && !error && {
        type: 'p',
        props: {
          id: `${inputId}-hint`,
          className: 'mj-hint'
        },
        children: [hint]
      }
    ].filter(Boolean)
  };
}

// Textarea component
export interface TextareaProps extends BaseProps {
  placeholder?: string;
  value?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  hint?: string;
  name?: string;
  maxLength?: number;
}

export function Textarea(props: TextareaProps) {
  const { label, error, hint, required, name, className, ...rest } = props;

  const inputId = name || `textarea-${Math.random().toString(36).slice(2, 7)}`;

  return {
    type: 'div',
    props: { className: cx('mj-field', className) },
    children: [
      label && {
        type: 'label',
        props: { htmlFor: inputId, className: 'mj-label' },
        children: [label, required ? ' *' : '']
      },
      {
        type: 'textarea',
        props: {
          ...rest,
          id: inputId,
          name,
          required,
          'aria-invalid': error ? 'true' : undefined,
          className: cx('mj-textarea', error && 'mj-input--error')
        },
        children: []
      },
      error && {
        type: 'p',
        props: { id: `${inputId}-error`, className: 'mj-error', role: 'alert' },
        children: [error]
      },
      hint && !error && {
        type: 'p',
        props: { id: `${inputId}-hint`, className: 'mj-hint' },
        children: [hint]
      }
    ].filter(Boolean)
  };
}

// Select component
export interface SelectProps extends BaseProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  multiple?: boolean;
  name?: string;
  onChange?: (e: Event) => void;
}

export function Select(props: SelectProps) {
  const { options, label, error, hint, required, multiple, name, placeholder, className, ...rest } = props;

  const inputId = name || `select-${Math.random().toString(36).slice(2, 7)}`;

  return {
    type: 'div',
    props: { className: cx('mj-field', className) },
    children: [
      label && {
        type: 'label',
        props: { htmlFor: inputId, className: 'mj-label' },
        children: [label, required ? ' *' : '']
      },
      {
        type: 'select',
        props: {
          ...rest,
          id: inputId,
          name,
          multiple,
          required,
          className: cx('mj-select', error && 'mj-input--error')
        },
        children: [
          placeholder && {
            type: 'option',
            props: { value: '', disabled: true, selected: true },
            children: [placeholder]
          },
          ...options.map(opt => ({
            type: 'option',
            props: { value: opt.value, disabled: opt.disabled },
            children: [opt.label]
          }))
        ]
      },
      error && {
        type: 'p',
        props: { id: `${inputId}-error`, className: 'mj-error', role: 'alert' },
        children: [error]
      },
      hint && !error && {
        type: 'p',
        props: { id: `${inputId}-hint`, className: 'mj-hint' },
        children: [hint]
      }
    ].filter(Boolean)
  };
}

// Checkbox
export interface CheckboxProps extends BaseProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  error?: string;
  name?: string;
  onChange?: (e: Event) => void;
}

export function Checkbox(props: CheckboxProps) {
  const { label, error, name, className, ...rest } = props;

  const inputId = name || `checkbox-${Math.random().toString(36).slice(2, 7)}`;

  return {
    type: 'div',
    props: { className: cx('mj-checkbox', className) },
    children: [
      {
        type: 'input',
        props: {
          ...rest,
          type: 'checkbox',
          id: inputId,
          name,
          className: 'mj-checkbox-input'
        },
        children: []
      },
      label && {
        type: 'label',
        props: { htmlFor: inputId, className: 'mj-checkbox-label' },
        children: [label]
      },
      error && {
        type: 'span',
        props: { role: 'alert', className: 'mj-error' },
        children: [error]
      }
    ].filter(Boolean)
  };
}

// Radio group
export interface RadioProps extends BaseProps {
  name: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  label?: string;
  error?: string;
  onChange?: (e: Event) => void;
}

export function RadioGroup(props: RadioProps) {
  const { name, options, label, error, className, ...rest } = props;

  return {
    type: 'fieldset',
    props: { className: cx('mj-radio-group', className) },
    children: [
      label && {
        type: 'legend',
        props: { className: 'mj-label mj-radio-legend' },
        children: [label]
      },
      ...options.map(opt => ({
        type: 'label',
        props: { className: 'mj-radio-option' },
        children: [
          {
            type: 'input',
            props: {
              ...rest,
              type: 'radio',
              name,
              value: opt.value,
              disabled: opt.disabled,
              className: 'mj-radio-input'
            },
            children: []
          },
          { type: 'span', props: {}, children: [opt.label] }
        ]
      })),
      error && {
        type: 'p',
        props: { role: 'alert', className: 'mj-error' },
        children: [error]
      }
    ].filter(Boolean)
  };
}

// Form wrapper
export interface FormProps extends BaseProps {
  onSubmit?: (e: Event) => void;
  method?: 'get' | 'post';
  action?: string;
}

export function Form(props: FormProps) {
  const { onSubmit, method, action, children, className, ...rest } = props;

  return {
    type: 'form',
    props: {
      onSubmit,
      method,
      action,
      className: cx('mj-form', className),
      ...rest
    },
    children: [children]
  };
}

// Switch/Toggle
export interface SwitchProps extends BaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  name?: string;
  onChange?: (e: Event) => void;
}

export function Switch(props: SwitchProps) {
  const { label, name, className, ...rest } = props;

  const inputId = name || `switch-${Math.random().toString(36).slice(2, 7)}`;

  return {
    type: 'label',
    props: { htmlFor: inputId, className: cx('mj-switch', className) },
    children: [
      {
        type: 'input',
        props: {
          ...rest,
          type: 'checkbox',
          id: inputId,
          name,
          role: 'switch',
          className: 'mj-switch-input'
        },
        children: []
      },
      {
        type: 'span',
        props: { className: 'mj-switch-track' },
        children: [
          { type: 'span', props: { className: 'mj-switch-thumb' }, children: [] }
        ]
      },
      label && { type: 'span', props: { className: 'mj-switch-label' }, children: [label] }
    ].filter(Boolean)
  };
}

// Slider
export interface SliderProps extends BaseProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  disabled?: boolean;
  label?: string;
  name?: string;
  onChange?: (e: Event) => void;
}

export function Slider(props: SliderProps) {
  const { min = 0, max = 100, step = 1, label, name, className, ...rest } = props;

  return {
    type: 'div',
    props: { className: cx('mj-slider', className) },
    children: [
      label && {
        type: 'label',
        props: { htmlFor: name, className: 'mj-label' },
        children: [label]
      },
      {
        type: 'input',
        props: {
          ...rest,
          type: 'range',
          min,
          max,
          step,
          name,
          id: name,
          className: 'mj-range'
        },
        children: []
      }
    ].filter(Boolean)
  };
}
