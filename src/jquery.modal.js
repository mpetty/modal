/*!
 *    Name:        Modal
 *    Author:      Mitchell Petty <https://github.com/mpetty/modal>
 *    Version:     1.17.10
 *    Notes:       Requires jquery 1.7+
 */
(function (factory) {
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
        this.staticModal = false;
        this.$modalInside = null;
        this.modalOpen = false;
        this.$overlay = null;
        this.$modal = null;

        // Keep track of total modals for namespace
        $.fn.modal2.count++;

        // Modal called directly so open immediately
        if (!this.$selector || this.$selector.is('.' + settings.modalName)) {
            this.show();

            // Use click events to trigger the modal
        } else {
            // If selector is inside of a modal dialog, use the parent modal as the container
            if (settings.container === 'body' && this.$selector.parents('.' + settings.modalDialogName).length) {
                this.$container = this.$selector.parents('.' + settings.modalDialogName).first();
            }

            $(this.$selector)
                .off('click.' + this.namespace)
                .on('click.' + this.namespace, $.proxy(this.show, this));
        }

    };

    Modal.prototype.addEvents = function () {

        var self = this;

        // Close modal links
        this.$modalDialog.on('click.' + this.namespace, this.settings.closeModalName, $.proxy(this.close, this));

        // Use esc key to close modals
        $(document).on('keydown.' + this.namespace, $.proxy(this.close, this));

        // Custom event can be used to close all modals
        $(document).on('closeModals.' + this.namespace, $.proxy(this.close, this));

        // Clicking outside of the modal window closes modals
        if (this.settings.allowCloseOverlay) {
            this.$modal.on('click.' + this.namespace, function (e) {
                if (!$(e.target).closest('.' + self.settings.modalContentName).length) {
                    self.close(e);
                }
            });
        }

    };

    Modal.prototype.removeEvents = function () {

        $(document).off('.' + this.namespace);
        this.$modal.off('.' + this.namespace);
        this.$modalDialog.off('.' + this.namespace);

    };

    Modal.prototype.show = function (e) {

        if (typeof e === 'object' && e.preventDefault) {
            e.preventDefault();
            e.stopPropagation();
        }

        // No selector passed in so use modal options
        if (!this.$selector) {

            // Load by passing in HTML through the options
            if (this.settings.html) {
                this.append(this.settings.html).open();

                // Load by passing in ajax through the options
            } else if (this.settings.ajax && typeof this.settings.ajax.url === 'string') {
                this.load(this.settings.ajax.url);
            }

            // Use the selector to find the modal
        } else {

            // If the passed in selector is a modal, use it as the modal
            if ($(this.$selector).is('.' + this.settings.modalName)) {
                this.append(false, $(this.$selector));

                // If the passed in selector has a target data attribute, use it as the modal
            } else if ($(this.$selector).data('target')) {

                this.append(false, $($(this.$selector).data('target')).first()).open();

                // If the passed in selector has a href attribute, use it as the modal or to load a modal with ajax
            } else if ($(this.$selector).attr('href')) {

                // Href is an internal hash link, use it as the target for the modal
                if ($(this.$selector).attr('href').substring(0, 1) === "#") {

                    this.append(false, $($(this.$selector).attr('href')).first()).open();

                    // Href is a link, load it with ajax
                } else {
                    this.load($(this.$selector).attr('href'));
                }

            }

        }

        // Call after init method
        this.settings.afterInit.call(this, $(this.$selector));

        return this;

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

            // Only close on esc keydown
            if (e.type === 'keydown') {
                if (e.keyCode !== 27 || (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
                    return;
                }

                // Only close if clicked item is directly inside of the modal
            } else if (e.type === 'click') {
                if (!$(e.currentTarget).closest('.' + this.settings.modalName).is(this.$modal)) {
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();
        }

        // Count the modals
        modalCount = this.$modal.children('.' + this.settings.modalDialogName).length;

        // Destroy the modal
        if (this.settings.allowClose || type === 'closeModals' || type === 'closeModal' || type === 'ajaxComplete') {
            this.settings.onBeforeClose.call(this, $(this.$selector));
            this.modalOpen = false;

            if (this.staticModal || modalCount <= 1) {
                this.$modal.removeClass('show in');

                if (this.staticModal && !this.$modal.closest('.' + self.settings.modalDialogName).length) {
                    this.$overlay.removeClass('show in');
                }

                this.$modal.animate({ top: -(this.$modal.outerHeight(true) * 2) }, function () {
                    self.$modal.removeAttr('data-modal2-active');
                    self.$modal.css({ top: '0' });
                    self.removeEvents();

                    if (self.staticModal) {
                        self.$modal.hide();

                        if (!self.$modal.closest('.' + self.settings.modalDialogName).length) {
                            self.$overlay.hide();
                        }
                    } else {
                        self.$modal.remove();
                        self.$overlay.remove();
                    }

                    if (!self.$container.children('[data-modal2-active]').length) {
                        self.$container.removeClass('modal-open');
                    }

                    self.settings.afterClose.call(self, $(self.$selector));
                });
            } else {
                this.$modalDialog.prev('.' + this.settings.modalDialogName).show();
                this.$modalDialog.remove();
                this.removeEvents();

                this.settings.afterClose.call(this, $(this.$selector));
            }
        }

        return this;

    };

    Modal.prototype.load = function (url) {

        var
            self = this,
            ajaxOptions = $.extend({ url: url || '' }, this.settings.ajax);

        // Create modal so we can show loader
        this.append();

        // added loading class
        this.$modalInside.addClass('loading');
        this.$overlay.addClass('show in');
        this.$modal.addClass('show in');

        // Override original ajax events
        ajaxOptions.error = function (ajaxObj, status, error) {
            self.close();

            if (typeof self.settings.ajax.error === 'function') {
                self.settings.ajax.error.call(self, ajaxObj, status, error);
            }
        };

        ajaxOptions.complete = function (ajaxObj, status) {
            var data = ajaxObj.responseText;

            self.$modalInside.removeClass('loading');

            if (data) {
                self.$modalInside
                    .empty()
                    .append(data);

                self.open();

                if (typeof self.settings.ajax.success === 'function') {
                    self.settings.ajax.success.call(self, data, status, ajaxObj);
                }
            }

            if (typeof self.settings.ajax.complete === 'function') {
                self.settings.ajax.complete.call(self, ajaxObj, status);
            }
        };

        // Send request
        $.ajax(ajaxOptions);

        return this;

    };

    Modal.prototype.open = function () {

        var self = this;

        // Do nothing, already open or no modal to open
        if (!this.$modal || this.modalOpen) return;

        // Set modal to open
        this.modalOpen = true;

        // Hide all other modals in the container besides this one
        if (this.$modal.children('.' + this.settings.modalDialogName).length > 1) {
            this.$modal.children('.' + this.settings.modalDialogName).hide();
            this.$modalDialog.show();
        }

        // Fade/Scroll in
        if (!this.settings.centered) {

            this.$modal.css({
                'marginTop': -this.$modal.height()
            });

            setTimeout(function () {
                self.$modal.css({ 'marginTop': 0 }).addClass('show');
                self.$overlay.addClass('show');

                setTimeout(function () {
                    self.$overlay.addClass('in');
                    self.$modal.addClass('in');
                }, 20);
            }, 10);

            // Fade in
        } else {
            this.$overlay.addClass('show in');
            this.$modal.addClass('show in');
        }

        // Set modal event listeners
        this.addEvents();

        // Add open class
        this.$container.addClass('modal-open');

        // Auto focus
        this.$modalDialog.find('[autofocus]').focus();

        // Scroll into view
        if (this.$modalDialog.get(0) && typeof this.$modalDialog.get(0).scrollIntoView === 'function') {
            this.$modalDialog.get(0).scrollIntoView();
        }

        // Callback
        this.settings.afterOpen.call(this, $(this.$selector));

        return this;

    };

    Modal.prototype.append = function (html, $el) {

        // Get existing overlay
        // Always reuse global overlay
        var $overlay = this.$overlay || $('.' + this.settings.backdropName, this.$container).first();

        // Modal exists in HTMl already so we just display it
        if ($el) {
            // Create modal elements
            this.$modal = $el;
            this.$modalInside = $('.' + this.settings.modalContentName, $el);
            this.$modalDialog = $('.' + this.settings.modalDialogName, $el);

            // Append modal backdrop if one doesnt already exist
            if (!($overlay && $overlay.length)) {
                this.$overlay = $('<div class="' + this.settings.backdropName + ' fade" data-modal2-overlay-active></div>');
                this.$modal.before(this.$overlay);
            } else {
                this.$overlay = $overlay;
            }

            // Set to static modal if we cloned the $el
            this.staticModal = true;

        // Create new modal or use one attached to the container if it already exists
        } else {
            // Get previous modal
            var $modal = this.$modal || $('.' + this.settings.modalName + '[data-modal2-active]', this.$container).first();

            // Create modal elements
            this.$modal = ($modal && $modal.length) ? $modal : $('<div class="' + this.settings.modalName + ' modal-' + this.settings.modalSkin + ' fade" role="dialog"></div>');
            this.$modalDialog = $('<div class="' + this.settings.modalDialogName + '" role="document"></div>');
            this.$modalInside = $('<div class="' + this.settings.modalContentName + '"></div>');
            this.$overlay = ($overlay && $overlay.length) ? $overlay : $('<div class="' + this.settings.backdropName + ' fade" data-modal2-overlay-active></div>');

            // Append new modal dialog to current modal
            this.$modalDialog.append(this.$modalInside);
            this.$modal.append(this.$modalDialog);

            // Append modal
            this.$container.append(this.$overlay);
            this.$container.append(this.$modal);
        }

        // Close all other open modals
        for (var i = 0; i < $.fn.modal2.current.length; i++) {
            if ($.fn.modal2.current[i].modalOpen && $.fn.modal2.current[i].$modal) {
                if (this.settings.nestedForcesClose || (!$.fn.modal2.current[i].$modal.is(this.$modal) && !$.fn.modal2.current[i].$modal.has(this.$modal))) {
                    $.fn.modal2.current[i].close();
                }
            }
        }

        // Append modal content
        if (html) {
            // HTML is a modal. Pull content from it.
            if ($(html).hasClass('modal-dialog')) {
                html = $('.' + this.settings.modalContentName, $(html)).html();
            }

            this.$modalInside.empty().append(html);
        }

        // Center container
        if (this.settings.centered) {
            this.$modalDialog.addClass('modal-centered');
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

        // Show modal
        this.$modal.attr('data-modal2-active', true);
        this.$overlay.show();
        this.$modal.show();

        return this;

    };

    // Create modal
    var modalFactory = function (selector, command, options) {

        // Merge options with defaults
        options = $.extend(true, {}, $.fn.modal2.defaults, options);

        // Create jquery object from selector
        selector = selector ? $(selector) : false;

        // Load previous modal object
        var modal = selector ? selector.data('modal') : false;

        // Call command on modal
        if (command) {

            if (typeof modal !== 'object') {
                modal = new Modal(selector, options);
            }

            switch (command) {
                case "hide":
                case "close":
                    if ($.isFunction(modal.close)) {
                        modal.close();
                    }
                    break;

                case "open":
                case "show":
                    if ($.isFunction(modal.open)) {
                        modal.open();
                    }
                    break;
            }

            // Open modal or bind events
        } else {

            // Selector on document opens immediately
            if (selector.is(document)) {
                modal = new Modal(false, options);

                // else modal opens on click event of selector
            } else {
                if (typeof modal !== 'object') {
                    modal = new Modal(selector, options);
                }
            }

        }

        $.fn.modal2.current.push(modal);
        selector.data('modal', modal);
        return modal;

    };

    // Add as jquery plugin on elements
    $.fn.modal2 = function (command, options) {

        if (typeof command === 'object') {
            options = command;
            command = false;
        }

        return this.each(function () {
            modalFactory(this, command, options);
            return this;
        });

    };

    // Add as jquery plugin
    $.modal2 = function (options) {

        return modalFactory(document, false, options);

    };

    // Cache for modal objects
    $.fn.modal2.current = [];

    // Increment modal ids
    $.fn.modal2.count = 0;

    // Set options obj
    $.fn.modal2.defaults = {
        closeModalName: '[data-dismiss="modal"]',
        modalContentName: 'modal-content',
        modalDialogName: 'modal-dialog',
        backdropName: 'modal-backdrop',
        nestedForcesClose: false,
        allowCloseOverlay: true,
        onBeforeClose: $.noop,
        modalSkin: 'default',
        modalName: 'modal',
        afterClose: $.noop,
        container: 'body',
        afterInit: $.noop,
        afterOpen: $.noop,
        allowClose: true,
        centered: false,
        width: false,
        html: false,
        ajax: false,
    };

    // return for module loader
    return $.modal2;
}));
