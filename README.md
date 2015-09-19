# Modal v1.15.5

Library for opening content in a modal window. Built to be used with web applications and ajax.

- Requires jQuery 1.7+

### new in 1.15.5

Removed bottom margin from modal

### new in 1.15.4

Removed a ton of options

Ajax option now gets injected directly into the ajax request so you can use all of jquerys ajax options except success, error, and complete.

## Bower Installation

Add to your project's `bower.json` file, like:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "jquery": "1.11.0",
    "fillselect": "git@github.com:mpetty/modal"
  }
}
```

## Usage

```javascript
$('a').modal(options);
```

You can also open it without assigning it to an element.

```javascript
$.modal(options);
```

## Options available

```javascript
modalName               : 'modal',
modalContentName        : 'modal-dialog',
loaderName              : 'modal-loader',
overlayName             : 'modal-overlay',
closeModalName          : 'close-modal',
loadInsideName          : 'load-inside',
modalSkin               : 'default',
container               : 'body',
centered                : true,
centeredOffset          : 50,
fixed                   : true,
animSpeed               : 150,
modalWidth              : 800,
insideMarkup            : false,
autoOpen                : false,
allowClose              : true,
closeOnDocumentClick    : true,
ajax                    : false,

afterInit               : function() {},
afterOpen               : function() {},
afterClose              : function() {},
afterLoad               : function() {},
afterAjaxSuccess        : function() {},
afterAjaxComplete       : function() {},
afterAjaxError          : function() {},
onBeforeClose           : function() {}
```
