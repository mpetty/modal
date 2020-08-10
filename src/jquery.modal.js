/*!
 *    Name:        Modal
 *    Author:      Mitchell Petty <https://github.com/mpetty/modal>
 *    Version:     1.17.6
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


        if (!this.$selector || this.$selector.is('.' + settings.modalName)) {
            this.show();
        } else {
	        if (this.$selector.parents('.' + settings.modalDialogName).length) {
	        	this.$container = this.$selector.parents('.' + settings.modalDialogName).first();
	        }

            $(this.$selector).off('click.modal').on('click.modal', $.proxy(this.show, this));
        }

        $.fn.modal2.count++;

    };

    Modal.prototype.addEvents = function () {

        var self = this;

        $(this.settings.closeModalName).on('click.' + this.namespace, $.proxy(this.close, this));
        
        $(document).on('keydown.' + this.namespace, $.proxy(this.close, this));

        $(document).on('closeModals.' + this.namespace, $.proxy(this.close, this));

        if (this.settings.allowCloseOverlay) {
            this.$modal.on('click.' + this.namespace, function (e) {
                if (!$(e.target).closest('.' + self.settings.modalContentName).length) {
                    self.close();
                }
            });
        }

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
            this.append(this.settings.html).open();

        // Load via ajax options
        } else if (this.settings.ajax && typeof this.settings.ajax.url === 'string') {
            this.load(this.settings.ajax.url);

        // Use selector as modal
        } else if ($(this.$selector).is('.' + this.settings.modalName)) {
            this.append(false, $(this.$selector));

        // Load via selector target
        } else if ($(this.$selector).data('target')) {
        	
        	this.append(false, $($(this.$selector).data('target')).first()).open();

        // Load via selector href
        } else if ($(this.$selector).attr('href')) {

        	// Href is a modal
        	if($(this.$selector).attr('href').substring(0, 1) === "#") {

            	this.append(false, $($(this.$selector).attr('href')).first()).open();

        	// Href is a link
        	} else {
            	this.load($(this.$selector).attr('href'));
        	}

        }

        // Call after init method
        this.settings.afterInit.call(this, $(this.$selector));

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

            if (this.staticModal || modalCount <= 1) {
                $('body').removeClass('modal-open');
                this.$overlay.removeClass('show in');
                this.$modal.removeClass('show in');

                this.$modal.animate({ top: -(this.$modal.outerHeight(true) * 2) }, function () {
	                self.$modal.css({ top: '0' });
                    self.$overlay.remove();
                    self.removeEvents();

                    if (self.staticModal) {
	                    self.$modal.hide();
                    } else {
                        self.$modal.remove();
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

    };

    Modal.prototype.load = function (url) {

        var
            self = this,
            ajaxOptions = $.extend({}, this.settings.ajax);

        this.append();

        // added loading class
        this.$modalInside.addClass('loading');
        this.$overlay.addClass('show in');
        this.$modal.addClass('show in');

        // Send request for content
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

    };

    Modal.prototype.open = function () {

        var self = this;

        // Do nothing, already open
        if (!this.$modal || this.modalOpen) return;

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
                self.$overlay.addClass('show');
                self.$modal.css({ 'marginTop': 0 }).addClass('show');

                setTimeout(function () {
                    self.$overlay.addClass('in');
                    self.$modal.addClass('in');
                }, 20);
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

    Modal.prototype.append = function (html, $el) {

    	// Modal exists in HTMl already so we just display it
        if ($el) {
            this.staticModal = true;

        	// Close all other modals
        	for (var i = 0; i < $.fn.modal2.current.length; i++) {
        		$.fn.modal2.current[i].close();
        	}

            this.$modal = $el;
            this.$overlay = this.$overlay && this.$overlay.length ? this.$overlay : $('<div class="' + this.settings.backdropName + ' fade" data-modal2-overlay-active></div>');
            this.$modalDialog = $('.' + this.settings.modalDialogName, this.$modal);
            this.$modalInside = $('.' + this.settings.modalContentName, this.$modal);
            this.$closeBtn = $(this.settings.closeModalName, this.$modalInside);
	        
	        // Append modal overlay next to the modal
	        this.$modal.before(this.$overlay);

	    // Modal is attached globally to the container
        } else {
        	// Retrieve previous modal elements using data attribute
            var $modal = this.$modal || $('[data-modal2-active]', this.$container).first();
            var $overlay = this.$overlay || $('[data-modal2-overlay-active]');

            // Build markup. Use previous modal or create new
            this.$modal = ($modal && $modal.length) ? $modal : $('<div class="' + this.settings.modalName + ' modal-' + this.settings.modalSkin + ' fade" data-modal2-active role="dialog"></div>');
            this.$overlay = ($overlay && $overlay.length) ? $overlay : $('<div class="' + this.settings.backdropName + ' fade" data-modal2-overlay-active></div>');
            this.$modalDialog = $('<div class="' + this.settings.modalDialogName + '" role="document"></div>');
            this.$modalInside = $('<div class="' + this.settings.modalContentName + '"></div>');
            this.$closeBtn = $(this.settings.closeModalName, this.$modalInside);
            
            // Append new modal dialog to current modal
            this.$modalDialog.append(this.$modalInside);
            this.$modal.append(this.$modalDialog);

	        // Append modal
	        this.$container.append(this.$overlay);
	        this.$container.append(this.$modal);
        }

        // Append modal content
        if (html) {
        	if ($(html).hasClass('modal-dialog')) {
        		html = $('.'+this.settings.modalContentName, $(html)).html();
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

            switch(command) {
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

            // no selector opens modal immediately
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

    $.modal2 = function (options) {

        return modalFactory(document, false, options);

    };

    // Cache for modal objects
    $.fn.modal2.current = [];

    // Increment modal ids
    $.fn.modal2.count = 0;

    // Set options obj
    $.fn.modal2.defaults = {
        closeModalName: '[data-dismiss="modal2"]',
        modalContentName: 'modal-content',
        modalDialogName: 'modal-dialog',
        backdropName: 'modal-backdrop',
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
