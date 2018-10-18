/*!
 *    Name:        Modal
 *    Author:      Mitchell Petty <https://github.com/mpetty/modal>
 *    Version:     1.17.1
 *    Notes:       Requires jquery 1.7+
 */
(function (factory) {
    "use strict";

    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory(require('jquery'));
    } else if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(function ($) {
    "use strict";

    var Modal = function (selector, settings) {
        this.namespace = 'modal-' + $.fn.modal2.count;
        this.$container = $(settings.container);
        this.$selector = selector;
        this.settings = settings;
        this.modalOpen = false;
        this.$modal = null;
        this.$modalInside = null;
        this.$overlay = null;

        if (!this.$selector) {
            this.show();
        } else {
            $(this.$selector).off('click.modal').on('click.modal', $.proxy(this.show, this));
        }

        $.fn.modal2.count++;
    };

    Modal.prototype.addEvents = function () {
        var self = this;

        $(this.settings.closeModalName).on('click.' + this.namespace, $.proxy(this.close, this));
        $(document).on('keydown.' + this.namespace, $.proxy(this.close, this));

        this.$modal.on('click.' + this.namespace, function (e) {
            if (!$(e.target).closest('.' + self.settings.modalContentName).length) {
                self.close();
            }
        });
    };

    Modal.prototype.removeEvents = function () {
        $(this.settings.closeModalName).off('.' + this.namespace);
        this.$modalInside.off('.' + this.namespace);
        this.$modal.off('.' + this.namespace);
        $(document).off('.' + this.namespace);
    };

    Modal.prototype.show = function (e) {

        // Prevent default action
        if (typeof e === 'object' && e.preventDefault) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Load via content options
        if (this.settings.html) {
            this.append(this.settings.html);
            this.open();
            this.settings.afterInit.call(this, $(this.$selector));

            // Load via selector target
        } else if ($(this.$selector).data('target')) {
            this.append($($(this.$selector).data('target')).html());
            this.open();
            this.settings.afterInit.call(this, $(this.$selector));

            // Load via ajax options
        } else if (this.settings.ajax && typeof this.settings.ajax.url === 'string') {
            this.append();
            this.load(this.settings.ajax.url);
            this.settings.afterInit.call(this, $(this.$selector));

            // Load via selector href
        } else if ($(this.$selector).attr('href')) {
            this.append();
            this.load($(this.$selector).attr('href'));
            this.settings.afterInit.call(this, $(this.$selector));

            // Nothing loaded, exit modal
        } else {
            this.close();
        }

    };

    Modal.prototype.close = function (e) {

        var
            self = this,
            type = false,
            modalCount = 1;

        // Quit if no modals
        if (!this.modalOpen) return;

        // If e is object
        if (typeof e === 'object') {
            type = e.type;

            if (e.type === 'keydown') {
                if (e.keyCode !== 27 || (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();
        }

        // Count the modals
        modalCount = this.$modal.children('.' + this.settings.modalDialogName).length;

        // Destroy the modal
        if (this.settings.allowClose || type === 'closeModal' || type === 'ajaxComplete') {
            this.settings.onBeforeClose.call(this, $(this.$selector));
            this.modalOpen = false;

            if (modalCount > 1) {
                this.$modalDialog.prev('.' + this.settings.modalDialogName).show();
                this.$modalDialog.remove();
                this.removeEvents();
                this.settings.afterClose.call(this, $(this.$selector));
            } else {
                this.$overlay.removeClass('show in');
                this.$modal.removeClass('show in');

                this.$modal.animate({ top: -(this.$modal.outerHeight(true) * 2) }, function () {
                    $('body').removeClass('modal-open');
                    self.$overlay.remove();
                    self.$modal.remove();
                    self.removeEvents();
                    self.settings.afterClose.call(this, $(this.$selector));
                });
            }
        }

    };

    Modal.prototype.load = function (url) {

        var
            self = this,
            ajaxOptions = $.extend({}, this.settings.ajax);

        // added loading class
        this.$modalInside.addClass('loading');
        this.$overlay.addClass('show in');
        this.$modal.addClass('show in');

        // Send request for content
        ajaxOptions.success = function (data, status, ajaxObj) {
            self.$modalInside
                .empty()
                .append(data);

            self.open();

            if (typeof self.settings.ajax.success === 'function') {
                self.settings.ajax.success.call(self, data, status, ajaxObj);
            }
        };

        ajaxOptions.error = function (ajaxObj, status, error) {
            self.close();

            if (typeof self.settings.ajax.error === 'function') {
                self.settings.ajax.error.call(self, ajaxObj, status, error);
            }
        };

        ajaxOptions.complete = function (ajaxObj, status) {
            self.$modalInside.removeClass('loading');

            if (typeof self.settings.ajax.complete === 'function') {
                self.settings.ajax.complete.call(self, ajaxObj, status);
            }
        };

        // Send request
        $.ajax(ajaxOptions);

    };

    Modal.prototype.open = function () {

        var self = this;

        // Do nothing, already open
        if (this.modalOpen) return;

        // Set modal to open
        this.modalOpen = true;

        // Count the modals
        if (this.$modal.children('.' + this.settings.modalDialogName).length > 1) {
            this.$modal.children('.' + this.settings.modalDialogName).hide();
            this.$modalDialog.show();
        }

        // Fade in
        if (!this.settings.centered) {
            this.$modal.css({
                'marginTop': -this.$modal.height()
            });

            setTimeout(function () {
                self.$overlay.addClass('show in');
                self.$modal.css({ 'marginTop': 0 }).addClass('show in');
            }, 10);
        } else {
            this.$overlay.addClass('show in');
            this.$modal.addClass('show in');
        }

        // Add open class
        this.$container.addClass('modal-open');

        // Set modal event listeners
        this.addEvents();

        // Auto focus
        this.$modal.find('[autofocus]').focus();

        // Callback
        this.settings.afterOpen.call(this, $(this.$selector));

    };

    Modal.prototype.append = function (html) {

        // Remove old modal
        var $modal = $('.' + this.settings.modalName, this.$container);
        var $overlay = $('.' + this.settings.backdropName);

        // Build markup
        this.$modal = $modal.length && $modal || $('<div class="' + this.settings.modalName + ' modal-' + this.settings.modalSkin + ' fade" role="dialog"></div>');
        this.$overlay = $overlay.length && $overlay || $('<div class="' + this.settings.backdropName + ' fade"></div>');
        this.$modalDialog = $('<div class="' + this.settings.modalDialogName + '" role="document"></div>');
        this.$modalInside = $('<div class="' + this.settings.modalContentName + '"></div>');
        this.$closeBtn = $(this.settings.closeModalName, this.$modalInside);
        this.$modalDialog.append(this.$modalInside);
        this.$modal.append(this.$modalDialog);

        // Append modal content
        if (html) {
            this.$modalInside.empty().append(html);
        }

        // Center container
        if (this.settings.centered) {
            this.$modal.addClass('modal-centered');
        }

        // Set to fixed if added to body
        if (this.settings.container === 'body') {
            this.$modal.addClass('fixed');
        }

        // Set modal width
        if (this.settings.width) {
            this.$modalDialog.css({
                'max-width': this.settings.width
            });
        }

        // Append modal
        this.$container.append(this.$overlay);
        this.$container.append(this.$modal);
        this.$overlay.show();
        this.$modal.show();

    };

    // Create modal
    var modalFactory = function (selector, options) {
        var dataSelector = $(selector);
        selector = dataSelector;

        if (selector.is(document)) {
            selector = false;
        }

        // If modal initialized with settings
        if (typeof (options) === 'object' || typeof (options) === 'undefined') {

            // Create object
            var modal = new Modal(selector, options);

            // Add object reference to the selector
            dataSelector.data('modal', modal);

            // If modal initialized with a method call
        } else if (typeof options === 'string') {

            // Set reference to selectors object
            var data = dataSelector.data('modal');

            // Make sure the data is an object
            if (typeof data === 'object') {

                // Close Modal
                if (options === 'close' && $.isFunction(data.close)) {
                    data.close();
                }

            }

        }
    };

    $.fn.modal2 = function (options) {
        if (typeof options !== 'string') options = $.extend(true, {}, $.fn.modal2.defaults, options);

        return this.each(function () {
            modalFactory(this, options);
            return this;
        });
    };

    $.modal2 = function (options) {
        if (typeof options !== 'string') options = $.extend(true, {}, $.fn.modal2.defaults, options);
        modalFactory(document, options);
        return this;
    };

    // Increment modal ids
    $.fn.modal2.count = 0;

    // Set options obj
    $.fn.modal2.defaults = {
        closeModalName: '[data-dismiss="modal2"]',
        backdropName: 'modal-backdrop',
        modalDialogName: 'modal-dialog',
        modalContentName: 'modal-content',
        modalSkin: 'default',
        modalName: 'modal',
        container: 'body',
        html: false,
        ajax: false,
        width: false,
        centered: false,
        allowClose: true,
        afterInit: $.noop,
        afterOpen: $.noop,
        afterClose: $.noop,
        onBeforeClose: $.noop
    };

    // return for module loader
    return $.modal2;
}));