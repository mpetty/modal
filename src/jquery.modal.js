/*!
 *	Name:		Modal
 *	Author: 	Mitchell Petty <https://github.com/mpetty/modal>
 * 	Version: 	1.15.6
 *	Notes: 		Requires jquery 1.7+
 */
 (function(factory) {
 	if (typeof exports === 'object') {
 		module.exports = factory(jQuery);
 	} else {
 		factory(jQuery);
 	}
 }(function ($) {
    "use strict";

	var Modal = function( selector, settings ) {
		this.settings 				= settings;
		this.$selector 				= selector;
		this.$container 			= $(this.settings.container);
		this.$modal 				= $('.' + this.settings.modalName, this.$container);
		this.$modalInside 			= $('.' + this.settings.modalContentName, this.$container);
		this.$overlay 				= $('.' + this.settings.overlayName, this.$container);
		this.$loader 				= $('.' + this.settings.loaderName, this.$container);

		if( this.settings.autoOpen || ! this.$selector ) {
			this.show();
		} else {
			$(this.$selector).off('click.modal').on('click.modal', $.proxy(this.show, this));
		}
	};

	Modal.prototype.events = function() {

		$(window).on('resize.modal scroll.modal', $.proxy(this.adjustModal,this));
		$(document).on('updateModal.modal ajaxComplete.modal', $.proxy(this.adjustModal,this));
		$(document).on('keydown.modal closeModal.modal', $.proxy(this.close, this));
		this.$modal.off('click.modal').on('click.modal', '.' + this.settings.closeModalName, $.proxy(this.close, this));
		this.$overlay.off('click.modal').on('click.modal', $.proxy(this.close, this));

	};

	Modal.prototype.show = function(e) {

		// Prevent default action
		if( typeof e === 'object' ) {
			e.preventDefault();
			e.stopPropagation();
		}

		// Append markup
		this.appendMarkup();

		// Set modal content
		if( this.settings.modalContent ) {
			this.$modalInside.empty().append( this.settings.modalContent );
			this.afterLoad();
		} else if(this.ajax && typeof this.settings.ajax.url === 'string') {
			this.load(this.settings.ajax.url);
		} else {
			this.load( $(this.$selector).attr('href') );
		}

		// Show/Hide close button
		if( this.settings.allowClose ) {
			$('.' + this.settings.closeModalName, this.$modal).show();
		} else {
			$('.' + this.settings.closeModalName, this.$modal).hide();
		}

		// Callback
		this.settings.afterInit.call(this, $(this.$selector));

	};

	Modal.prototype.close = function(e) {

		// Define vars
		var type = (typeof e === 'object' && typeof e.type !== 'undefined') ? e.type : false;
		var keyEvent = (type === 'keydown' || type === 'keyup' || type === 'keypress') ? true : false;
		var modal, overlay;

		// If e is object
		if( typeof e ==='object' ) {

			// Quit if keydown and wrong key or within input fields
			if( keyEvent && e.keyCode !== 27 || (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)  ) return;

			// Prevent default action
			e.preventDefault();
			e.stopPropagation();

		}

		// Quit if no modals
		if( ! $('.' + this.settings.modalName).length ) return;

		// Callback
		this.settings.onBeforeClose.call(this, $(this.$selector));

		// Fadeout and remove
		if( (this.settings.allowClose || type === 'closeModal' || type === 'ajaxComplete') && this.$modal.length ) {

			modal = this.$modal;
			overlay = this.$overlay;

			modal.animate({'opacity':'hide'}, this.settings.animSpeed);
			overlay.animate({'opacity':'hide'}, this.settings.animSpeed, $.proxy(function(){
				// Remove modal
				modal.remove();
				overlay.remove();

				// Remove event bindings
				$('.' + this.settings.closeModalName, modal).off('.modal');
				modal.off('.modal');
				overlay.off('.modal');

				if( ! $('.ok-modal').length ) {
					$(window).off('.modal');
					$(document).off('.modal');
				}
			},this));

			// Callback
			this.settings.afterClose.call(this, $(this.$selector));

		}

	};

	Modal.prototype.load = function(url) {

		var self = this,
			ajaxOptions = $.extend({}, this.settings.ajax);

		// added loading class
		this.$modal.addClass('loading');

		// Show modal
		if( this.$modal.is(':hidden') ) {
			this.$modal.hide().animate({'opacity':'show'}, this.settings.animSpeed);
			this.$loader.animate({'opacity':'show'}, this.settings.animSpeed);
			this.$overlay.hide().animate({'opacity':'show'}, this.settings.animSpeed);
		}

		// Send request for content
		ajaxOptions.success = function( data, status, ajaxObj ) {
			self.$loader.animate({'opacity':'hide'}, self.settings.animSpeed, function() {

				// append markup
				if(! self.settings.centered) self.$modal.css({'marginTop': -self.$modal.height()}).hide().animate({'opacity':'show','marginTop':0},self.settings.animSpeed+100, $.proxy(self.adjustModal,self));
				self.$modalInside.empty().append($(data)).hide().animate({'opacity':'show'},self.settings.animSpeed);

				// after load
				self.afterLoad( 'ajaxLoad' );

				// callback
				self.settings.afterAjaxSuccess.call(self, data, ajaxObj);

			});
		};

		ajaxOptions.error = function( ajaxObj, status, error ) {
			self.$loader.animate({'opacity':'hide'}, self.settings.animSpeed, function() {

				// callback
				self.settings.afterAjaxError.call(self, ajaxObj, error);

				// close
				self.close();

			});
		};

		ajaxOptions.complete = function( ajaxObj, status ) {

			// update modal
			self.$modal.removeClass('loading');

			// callback
			self.settings.afterAjaxComplete.call(self, ajaxObj);

		};

		// Send request
		$.ajax(ajaxOptions);

	};

	Modal.prototype.afterLoad = function( action ) {

		// Fade in
		if( this.$modal.is(':hidden') ) {
			if(!this.settings.centered) {
				this.$modal.css({'marginTop':-this.$modal.height()});
				this.$modal.hide().animate({'opacity':'show', 'marginTop':0}, this.settings.animSpeed, $.proxy(this.events,this));
				this.$overlay.hide().animate({'opacity':'show'}, this.settings.animSpeed);
			} else {
				this.$modal.hide().animate({'opacity':'show'}, this.settings.animSpeed, $.proxy(this.events,this));
				this.$overlay.hide().animate({'opacity':'show'}, this.settings.animSpeed);
			}
		} else {
			this.events();
		}

		// Center
		this.adjustModal();

		// Auto focus
		this.$modal.find('[autofocus]').focus();

		// Callback
		this.settings.afterLoad.call(this, $(this.$selector));
		this.settings.afterOpen.call(this, $(this.$selector));

	};

	Modal.prototype.adjustModal = function() {

		// quit if modal doesnt exist
		if( ! this.$modal.length || ! this.$modalInside.length ) return;

		// set vars
		var windowHeight = $(window).height();
		var windowWidth = $(window).width();
		var modalMargin = false;
		var scrollTop, contentHeight, contentWidth;
		var margin = 0;

		// Set modal dimensions
		contentWidth = this.$modalInside.outerWidth();
		contentHeight = this.$modal.outerHeight();

		// Center and fixed if smaller than window
		if( contentHeight < windowHeight && windowWidth > contentWidth ) {

			modalMargin = parseInt(this.$modal.css('marginTop'));
			if($.isNumeric(modalMargin)) modalMargin = Math.abs(modalMargin);

			if( this.settings.container === 'body' ) {
				this.$modal.removeClass('static').addClass('fixed');
			}

			if( this.settings.centered ) {
				if( modalMargin !== contentHeight / 2 ) {
					this.$modal.addClass('centered fixed').removeClass('static').css({
						'top' : '50%',
						'marginTop' : - contentHeight / 2,
						'marginBottom' : 0
					});
				}
			} else {
				this.$modal.removeClass('centered static').addClass('fixed').css({
					'top' : 0
				});
			}

		// Center and static if larger than window
		} else {

			if( ! this.$modal.hasClass('static') ) {
				scrollTop = $(window).scrollTop() - this.$container.offset().top;
				scrollTop = (scrollTop < 50 && margin === 0) ? 0 : scrollTop + margin;

				this.$modal.removeClass('centered fixed').addClass('static').css({
					'top' : 0,
					'marginTop' : scrollTop
				});
			}

		}

	};

	Modal.prototype.appendMarkup = function() {

		// Define vars
		var $modal = $('.' + this.settings.modalName, this.$container);
		var $modalInside = $('.' + this.settings.modalContentName, this.$container);
		var markup = $('<div class="' + this.settings.overlayName + ' modal-'+ this.settings.modalSkin + '"></div>'+
						'<div class="' + this.settings.modalName + ' modal-'+ this.settings.modalSkin +'">'+
							'<div class="' + this.settings.loaderName + '"></div>'+
							'<div class="' + this.settings.modalContentName + '"></div>'+
						'</div>');

		// Update container
		this.$container.css({'position' : 'relative'});

		if(!this.settings.centered) {
			this.$modal.css({'marginTop':-this.$modal.height()});
		}

		// Add classes
		if( ! this.settings.allowClose )  $('.' + this.settings.modalName, markup).addClass('no-close');
		if( this.settings.container === 'body' ) markup.addClass('fixed');

		// Add markup
		if( ! $modal.length ) {
			this.$container.append(markup);
		} else {
			this.$modal.remove();
			this.$overlay.remove();
			this.$container.append(markup);
		}

		// set global modal vars
		this.$modal = $('.' + this.settings.modalName, this.$container);
		this.$modalInside = $('.' + this.settings.modalContentName, this.$container);
		this.$overlay = $('.' + this.settings.overlayName, this.$container);
		this.$loader = $('.' + this.settings.loaderName, this.$container);

		// Set modal width
		if(this.settings.modalWidth) this.$modalInside.css({'max-width' : this.settings.modalWidth});

	};

	/* Initialize Plugin */
	$.fn.modal2 = function( options ) {

		// If modal initialized with settings
		if ( typeof(options) === 'object' || typeof(options) === 'undefined' ) {

			// Initialize
			return this.each(function(){

				// Set settings
				var settings = $.extend(true, {}, $.fn.modal2.defaults, options);

				// Create object
				var modal = new Modal(this, settings);

				// Add object reference to the selector
				$(this).data('modal', modal);

				// return for chaining
				return this;

			});

		// If modal initialized with a method call
		} else if ( typeof options === 'string' ) {

			// Initialize
			return this.each(function() {

				// Set reference to selectors object
				var data = $(this).data('modal');

				// Make sure the data is an object
				if( typeof data === 'object' ) {

					// Adjust Modal
					if ( options === 'adjust' && $.isFunction(data.adjustModal) ) {
						data.adjustModal();

					// Close Modal
					} else if ( options === 'close' && $.isFunction(data.close) ) {
						data.close();
					}

				}

				// return for chaining
				return this;

			});

		}

	};

	/* Initialize Plugin without selector */
	$.modal2 = function( options ) {

		// If modal initialized with settings
		if ( typeof(options) === 'object' || typeof(options) === 'undefined' ) {

			// Set settings
			var settings = $.extend(true, {}, $.fn.modal2.defaults, options);

			// Create object
			var modal = new Modal(false, settings);

			// Add object reference to the selector
			$(document).data('modal', modal);

		// If modal initialized with a method call
		} else if ( typeof options === 'string' ) {

			// Set reference to selectors object
			var data = $(document).data('modal');

			// Make sure the data is an object
			if( typeof data === 'object' ) {

				// Adjust Modal
				if ( options === 'adjust' && $.isFunction(data.adjustModal) ) {
					data.adjustModal();

				// Close Modal
				} else if ( options === 'close' && $.isFunction(data.close) ) {
					data.close();
				}

			}

		}

	};

	/* Set options obj */
	$.fn.modal2.defaults = {
		modalName 				: 'modal',
		modalContentName		: 'modal-dialog',
		loaderName 				: 'modal-loader',
		overlayName 			: 'modal-overlay',
		closeModalName 			: 'close-modal',
		loadInsideName 			: 'load-inside',
		modalSkin 				: 'default',
		container 				: 'body',
		centered				: true,
		fixed 					: true,
		animSpeed 				: 150,
		modalWidth 				: 800,
		modalContent 			: false,
		autoOpen 				: false,
		allowClose 				: true,
		closeOnDocumentClick 	: true,
		ajax 					: false,

		afterInit 				: $.noop,
		afterOpen 				: $.noop,
		afterClose 				: $.noop,
		afterLoad 				: $.noop,
		afterAjaxSuccess 		: $.noop,
		afterAjaxComplete 		: $.noop,
		afterAjaxError 			: $.noop,
		onBeforeClose 			: $.noop
	};
}));