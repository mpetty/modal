# OkModal v1.15

Library for opening content in a modal window. Built to be used with web applications and ajax.

- Requires jQuery 1.7+

## Bower Installation

Add to your project's `bower.json` file, like:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "jquery": "1.11.0",
    "fillselect": "git@github.com:mpetty/ok-modal"
  }
}
```

## Usage

```javascript
$('a').okModal(options);
```

You can also open it without assigning it to a dom element.

```javascript
$.okModal(options);
```

## Options available

```javascript
modalName               : 'ok-modal',
loaderName              : 'ok-modal-loader',
overlayName             : 'ok-modal-overlay',
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
eventDelegation         : false,
delegatedSelector       : false,
closeOnDocumentClick    : true,

iframe                  : false,
iframeWrap              : '<div class="modal-wrap" />',

ajax                    : false,
ajaxType                : 'GET',
ajaxFragment            : false,
ajaxUrl                 : false,
ajaxData                : false,
ajaxGlobal              : true,
ajaxSettings            : {},

afterInit               : function() {},
afterOpen               : function() {},
afterClose              : function() {},
afterLoad               : function() {},
afterAjaxSuccess        : function() {},
afterAjaxComplete       : function() {},
afterAjaxError          : function() {},
onBeforeClose           : function() {}
```
