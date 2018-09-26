# Modal v1.17.1

Library for opening content in a modal window. Built to be used with web applications and ajax.

- Requires jQuery 1.7+

### new in 1.17.1

Added support for nested modals. Modal windows will get appended after the last. when nested modals are closed, the previous modal will be displayed until the last one is closed which will destroy the modal elements.

### new in 1.17.0

Added module support

Cleaned up default options

Cleaned up js styles to use css

Use bootstrap default styles for modal

## Installation

Add to your project's `package.json` file, like:

```bash
    npm install mpetty/modal --save-dev
```

## Usage

```html
<a data-toggle="modal2" href="#">Toggle modal with data attribute</a>
```

```javascript
$('a').modal2(options);
```

```javascript
$.modal2(options);
```

## Options available

```javascript
closeModalName     : '[data-dismiss="modal2"]',
backdropName       : 'modal-backdrop',
modalDialogName    : 'modal-dialog',
modalContentName   : 'modal-content',
modalSkin          : 'default',
modalName          : 'modal',
container          : 'body',
html               : false,
ajax               : false,
width              : false,
centered           : false,
allowClose         : true,
afterInit          : $.noop,
afterOpen          : $.noop,
afterClose         : $.noop,
onBeforeClose      : $.noop
```
