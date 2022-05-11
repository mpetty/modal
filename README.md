# Modal v1.17.11

Library for opening content in a modal window. Built to be used with web applications and ajax.

- Requires jQuery 1.7+

## Installation

Add to your project's `package.json` file, like:

```bash
    npm install mpetty/modal --save-dev
```

## Usage

```javascript
$('.modal').modal2(options);
```

```javascript
$('a').modal2(options);
```

```javascript
$.modal2(options);
```

## Options available

```javascript
closeModalName     : '[data-dismiss="modal"]',
backdropName       : 'modal-backdrop',
modalDialogName    : 'modal-dialog',
modalContentName   : 'modal-content',
modalSkin          : 'default',
modalName          : 'modal',
container          : 'body',
nestedForcesClose  : false,
html               : false,
ajax               : false,
width              : false,
centered           : false,
allowClose         : true,
allowCloseOverlay  : true,
afterInit          : $.noop,
afterOpen          : $.noop,
afterClose         : $.noop,
onBeforeClose      : $.noop
```
