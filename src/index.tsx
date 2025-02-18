import * as React from 'react';

const KEY_CODE = {
  BACKSPACE: 8,
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  DELETE: 46,
};
export interface ReactInputVerificationCodeProps {
  autoFocus?: boolean;
  length?: number;
  onChange?: (data: string) => void;
  onCompleted?: (data: string) => void;
  placeholder?: string;
  value?: string;
  dataCy?: string;
  type?: 'text' | 'password';
  passwordMask?: string;
  inputMode?: 'text' | 'numeric';
  inputClassNames?: string;
  inputFilledClassName: string;
  inputActiveClassName: string;
}

const ReactInputVerificationCode = ({
  autoFocus = false,
  length = 4,
  onChange = () => {},
  onCompleted = () => {},
  placeholder = '·',
  value: pValue,
  dataCy = 'verification-code',
  type = 'text',
  passwordMask = '•',
  inputMode = 'numeric',
  inputClassNames = '',
  inputFilledClassName = '',
  inputActiveClassName = '',
}: ReactInputVerificationCodeProps) => {
  const emptyValue = new Array(length).fill(placeholder);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [value, setValue] = React.useState<string[]>(
    pValue ? pValue.split('') : emptyValue
  );

  const codeInputRef = React.createRef<HTMLInputElement>();
  const itemsRef = React.useMemo(
    () =>
      new Array(length).fill(null).map(() => React.createRef<HTMLDivElement>()),
    [length]
  );
  const regexString =
    inputMode === 'text' ? `^[A-Za-z0-9_.]{${length}}$` : `^[0-9]{${length}}$`;

  const isCodeRegex = new RegExp(regexString);

  const getItem = (index: number) => itemsRef[index]?.current;
  const focusItem = (index: number): void => getItem(index)?.focus();
  const blurItem = (index: number): void => getItem(index)?.blur();

  const onItemFocus = (index: number) => () => {
    setActiveIndex(index);
    if (codeInputRef.current) codeInputRef.current.focus();
  };

  const onInputKeyUp = ({ key, keyCode }: React.KeyboardEvent) => {
    const newValue = [...value];
    const nextIndex = activeIndex + 1;
    const prevIndex = activeIndex - 1;

    const codeInput = codeInputRef.current;
    const currentItem = getItem(activeIndex);

    const isLast = nextIndex === length;
    const isDeleting =
      keyCode === KEY_CODE.DELETE || keyCode === KEY_CODE.BACKSPACE;

    // keep items focus in sync
    onItemFocus(activeIndex);

    // on delete, replace the current value
    // and focus on the previous item
    if (isDeleting) {
      newValue[activeIndex] = placeholder;
      setValue(newValue);

      if (activeIndex > 0) {
        setActiveIndex(prevIndex);
        focusItem(prevIndex);
      }

      return;
    }

    // if the key pressed is not a number
    // don't do anything
    if (inputMode === 'numeric' && Number.isNaN(+key)) return;

    // reset the current value
    // and set the new one
    if (codeInput) codeInput.value = '';
    newValue[activeIndex] = key;
    setValue(newValue);

    if (!isLast) {
      setActiveIndex(nextIndex);
      focusItem(nextIndex);
      return;
    }

    if (codeInput) codeInput.blur();
    if (currentItem) currentItem.blur();

    setActiveIndex(-1);
  };

  // handle mobile autocompletion
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: changeValue } = e.target;
    if (inputMode === 'numeric') {
      const isCode = isCodeRegex.test(changeValue);
      if (!isCode) return;
    }
    setValue(changeValue.split(''));
    blurItem(activeIndex);
  };

  const onInputBlur = () => {
    // https://github.com/ugogo/react-input-verification-code/issues/1
    if (activeIndex === -1) return;

    blurItem(activeIndex);
    setActiveIndex(-1);
  };

  // autoFocus
  React.useEffect(() => {
    if (autoFocus && itemsRef[0].current) {
      itemsRef[0].current.focus();
    }
  }, []);

  // handle pasting
  React.useEffect(() => {
    const codeInput = codeInputRef.current;
    if (!codeInput) return;

    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();

      const pastedString = e.clipboardData?.getData('text');
      if (!pastedString) return;

      const isCode = isCodeRegex.test(pastedString);
      if (isCode) setValue(pastedString.split('').slice(0, length));
    };

    codeInput.addEventListener('paste', onPaste);
    return () => codeInput.removeEventListener('paste', onPaste);
  }, []);

  React.useEffect(() => {
    const stringValue = value.join('');
    const isCompleted = stringValue.length === length;

    if (isCompleted && stringValue !== emptyValue.join(''))
      onCompleted(stringValue);
    onChange(stringValue);
  }, [value, length]);

  React.useEffect(() => {
    if (typeof pValue !== 'string') return;

    // avoid infinite loop
    if (pValue === '' && value.join('') === emptyValue.join('')) return;

    // keep internal and external states in sync
    if (pValue !== value.join('')) setValue(pValue.split(''));
  }, [pValue]);

  const renderItemText = (itemValue: string) => {
    if (itemValue === placeholder) return placeholder;
    return type === 'password' ? passwordMask : itemValue;
  };

  return (
    <React.Fragment>
      <input
        type='text'
        ref={codeInputRef}
        autoComplete='one-time-code'
        inputMode={inputMode}
        id='one-time-code'
        // use onKeyUp rather than onChange for a better control
        // onChange is still needed to handle the autocompletion
        // when receiving a code by SMS
        onChange={onInputChange}
        onKeyUp={onInputKeyUp}
        onBlur={onInputBlur}
        style={{
          position: 'absolute',
          top: '-999px',
          opacity: 0,
        }}
      />

      {itemsRef.map((ref, i) => (
        <div
          className={`${inputClassNames} ${
            value[i] !== placeholder
              ? inputFilledClassName
              : inputActiveClassName
          }`}
          key={i}
          ref={ref}
          role='button'
          tabIndex={0}
          onFocus={onItemFocus(i)}
          data-cy={`${dataCy}-${i}-item`}
        >
          {renderItemText(value[i])}
        </div>
      ))}
    </React.Fragment>
  );
};

export default ReactInputVerificationCode;
