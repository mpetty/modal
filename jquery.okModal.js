/*!
 *	Name:		Ok Modal
 *	Author: 	Mitchell Petty <https://github.com/mpetty/ok-modal>
 * 	Version: 	1.15
 *	Notes: 		Requires jquery 1.7+
 */
(function($) {
	"use strict";

	var OkModal = function( selector, settings ) {

		// Set properties
		this.selector = selector;
		this.settings = settings;

		// Set up modal variables
		this.container 		= (this.settings.container.jquery) ? this.settings.container : $(this.settings.container);
		this.modal 			= $('.' + this.settings.modalName, this.container);
		this.modalInside 	= $('.' + this.settings.modalName + '-inside', this.container);
		this.overlay 		= $('.' + this.settings.overlayName, this.container);
		this.loader 		= $('.' + this.settings.loaderName, this.container);

		// Initialize
		this.Initialize.call(this);

	};

	OkModal.prototype = {

		/* Initialize */
		Initialize : function() {

			// If auto open, open modal now
			if( this.settings.autoOpen || ! this.selector ) {

				this.open();

			// If event delegation
			} else if( this.settings.eventDelegation !== false && typeof this.settings.delegatedSelector === 'object' ) {

				$(this.selector).off('.okModal').on('click.okModal', this.settings.delegatedSelector, $.proxy(this.open, this));

			// Else
			} else {

				$(this.selector).off('.okModal').on('click.okModal', $.proxy(this.open, this));

			}

		},

		/* Event LIsteners */
		events : function() {

			// Add event listeners
			$(document).on('updateModal.okModal ajaxComplete.okModal', $.proxy(this.adjustModal,this));
			$(window).on('resize.okModal scroll.okModal', $.proxy(this.adjustModal,this));
			$(document).on('keydown.okModal closeModal.okModal', $.proxy(this.close, this));
			this.modal.on('click.okModal', '.' + this.settings.closeModalName, $.proxy(this.close, this));
			this.modal.on('click.okModal', '.ok-' + this.settings.closeModalName, $.proxy(this.close, this));

			$('.' + this.settings.closeModalName, this.modal).on('click.okModal', $.proxy(this.close, this));
			$('.ok-' + this.settings.closeModalName, this.modal).on('click.okModal', $.proxy(this.close, this));

			// Close on document click
			if( this.settings.closeOnDocumentClick ) {
				this.overlay.off('.okModal').on('click.okModal', $.proxy(this.close, this));

				$('.' + this.settings.modalName +', .'+ this.settings.overlayName).on('click.okModal', $.proxy(function(e) {
					var $this = $(e.target);

					if ( ! $this.parents().is('.' + this.settings.modalName + '-inside') && ! $this.is('.' + this.settings.modalName + '-inside')) {
						this.close();
					}
				}, this));
			}

			// Callback
			this.settings.afterOpen.call(this, $(this.selector));

		},

		/* Open Modal */
		open : function(e) {

			// Define vars
			var $localMarkup, url;

			// return if wrong selector
			if( this.settings.eventDelegation === true && ! $(e.target).closest(this.settings.delegatedSelector).length )  return;

			// Prevent default action
			if( typeof e === 'object' ) {
				e.preventDefault();
				e.stopPropagation();
			}

			// set url if there is one
			if ( this.settings.ajax ) {
				if( this.settings.ajaxUrl ) {
					url = this.settings.ajaxUrl;

				} else if( $(this.selector).attr('href') ) {
					url = $(this.selector).attr('href');

				} else if ( typeof e !== 'undefined' ) {
					if( $(e.currentTarget).attr('href') ) {
						url = $(e.currentTarget).attr('href');
					} else if( $(e.currentTarget).closest('a').attr('href') ) {
						url = $(e.currentTarget).closest('a').attr('href');
					}

				}
			} else if (this.settings.iframe) {
				url = this.settings.iframe;
			}

			// Append markup
			this.appendMarkup();

			// inside markup
			if( this.settings.insideMarkup ) {

				this.modalInside.empty().append( this.settings.insideMarkup );
				this.afterLoad();

			// iframe load
			} else if( this.settings.iframe ) {

				$localMarkup = $(this.settings.iframeWrap).append('<div class="ok-' + this.settings.closeModalName +'"></div><iframe src="'+ url +'"></iframe>')
				this.modalInside.empty();
				this.modalInside.append('<div class="ok-' + this.settings.closeModalName + '"><span>X</span></div>')
				this.modalInside.append($localMarkup);
				this.modal.addClass('iframe');
				this.afterLoad();

			// check if theres a url
			} else if( typeof url !== 'undefined' && url ) {

				this.ajaxLoad( url );

			}

			// Show/Hide close button
			if( this.settings.allowClose ) {
				$('.ok-' + this.settings.closeModalName, this.modal).show();
			} else {
				$('.ok-' + this.settings.closeModalName, this.modal).hide();
			}

			// Callback
			this.settings.afterInit.call(this, $(this.selector));

		},

		/* Close Modal */
		close : function(e) {

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
			this.settings.onBeforeClose.call(this, $(this.selector));

			// Fadeout and remove
			if( (this.settings.allowClose || type === 'closeModal' || type === 'ajaxComplete') && this.modal.length ) {

				modal = this.modal;
				overlay = this.overlay;

				modal.animate({'opacity':'hide'}, this.settings.animSpeed);
				overlay.animate({'opacity':'hide'}, this.settings.animSpeed, $.proxy(function(){
					// Remove modal
					modal.remove();
					overlay.remove();

					// Remove event bindings
					$('.' + this.settings.closeModalName, modal).off('.okModal');
					modal.off('.okModal');
					overlay.off('.okModal');

					if( ! $('.ok-modal').length ) {
						$(window).off('.okModal');
						$(document).off('.okModal');
					}
				},this));

				// Callback
				this.settings.afterClose.call(this, $(this.selector));

			}

		},

		/* Ajax Load */
		ajaxLoad : function(url) {

			// reference to self
			var self = this;

			// added loading class
			this.modal.addClass('loading');

			// Show modal
			if( this.modal.is(':hidden') ) {
				this.modal.hide().animate({'opacity':'show'}, this.settings.animSpeed);
				this.loader.animate({'opacity':'show'}, this.settings.animSpeed);
				this.overlay.hide().animate({'opacity':'show'}, this.settings.animSpeed);
			}

			// Send request for content
			$.ajax({
				url: url,
				type: self.settings.ajaxType,
				data: self.settings.ajaxData,

				success: function( data, status, ajaxObj ) {

					// vars
					var markup = data;
					var mheight = -1000;

					// fade out loader
					self.loader.animate({'opacity':'hide'}, self.settings.animSpeed, function() {

						// If data is an object, assume markup is in .html
						if( typeof data === 'object') {
							if(typeof data.html === 'string') {
								data = data.html;
							} else if( typeof data.view === 'string' ) {
								data = data.view;
							}
						}

						// set markup
						if( self.settings.ajaxFragment ) {
							markup = $(self.settings.ajaxFragment, $(data)).html();
						} else {
							markup = $(data);
						}

						// append markup
						if(! self.settings.centered) self.modal.css({'marginTop': -self.modal.height()}).hide().animate({'opacity':'show','marginTop':self.settings.centeredOffset},self.settings.animSpeed+100, $.proxy(self.adjustModal,self));
						self.modalInside.empty().append(markup).hide().animate({'opacity':'show'},self.settings.animSpeed);

						// after load
						self.afterLoad( 'ajaxLoad' );

						// callback
						self.settings.afterAjaxSuccess.call(self, data, ajaxObj);

					});

				},

				error: function( ajaxObj, status, error ) {

					// fade out loader
					self.loader.animate({'opacity':'hide'}, self.settings.animSpeed, function() {

						// callback
						self.settings.afterAjaxError.call(self, ajaxObj, error);

						// close
						self.close();

					});

				},

				complete: function( ajaxObj, status ) {

					// update modal
					self.modal.removeClass('loading');

					// callback
					self.settings.afterAjaxComplete.call(self, ajaxObj);

				}
			});

		},

		/* After Load */
		afterLoad : function( action ) {

			// Fade in
			if( this.modal.is(':hidden') ) {
				if(!this.settings.centered) {
					this.modal.css({'marginTop':-this.modal.height()});
					this.modal.hide().animate({'opacity':'show', 'marginTop':this.settings.centeredOffset}, this.settings.animSpeed, $.proxy(this.events,this));
					this.overlay.hide().animate({'opacity':'show'}, this.settings.animSpeed);
				} else {
					this.modal.hide().animate({'opacity':'show'}, this.settings.animSpeed, $.proxy(this.events,this));
					this.overlay.hide().animate({'opacity':'show'}, this.settings.animSpeed);
				}
			} else {
				this.events();
			}

			// Center
			this.adjustModal();

			// Auto focus
			this.modal.find('[autofocus=autofocus]').focus();

			// Callback
			this.settings.afterLoad.call(this, $(this.selector));

		},

		/* Center Modal */
		adjustModal : function() {

			// quit if modal doesnt exist
			if( ! this.modal.length || ! this.modalInside.length ) return;

			// set vars
			var windowHeight = $(window).height();
			var windowWidth = $(window).width();
			var modalMargin = false;
			var scrollTop, contentHeight, contentWidth;
			var margin = (!this.settings.centered) ? this.settings.centeredOffset : 0;

			// Set modal dimensions
			contentWidth = this.modalInside.outerWidth();
			contentHeight = this.modal.outerHeight();
			contentHeight = (!this.settings.centered) ? this.modal.outerHeight() + (margin*2) : this.modal.outerHeight();

			// Center and fixed if smaller than window
			if( contentHeight < windowHeight && windowWidth > contentWidth ) {

				modalMargin = parseInt(this.modal.css('marginTop'));
				if($.isNumeric(modalMargin)) modalMargin = Math.abs(modalMargin);

				if( this.settings.container === 'body' ) {
					this.modal.removeClass('static').addClass('fixed');
				}

				if( this.settings.centered ) {
					if( modalMargin !== contentHeight / 2 ) {
						this.modal.addClass('centered fixed').removeClass('static').css({
							'top' : '50%',
							'marginTop' : - contentHeight / 2,
							'marginBottom' : 0
						});
					}
				} else {
					this.modal.removeClass('centered static').addClass('fixed').css({
						'top' : 0,
						'marginTop' : margin,
						'marginBottom' : margin
					});
				}

			// Center and static if larger than window
			} else {
				if( ! this.modal.hasClass('static') ) {
					scrollTop = $(window).scrollTop() - this.container.offset().top;
					scrollTop = (scrollTop < 50 && margin === 0) ? 0 : scrollTop + margin;

					this.modal.removeClass('centered fixed').addClass('static').css({
						'top' : 0,
						'marginTop' : scrollTop,
						'marginBottom' : 0
					});
				}

			}

		},

		/* Append Markup */
		appendMarkup : function() {

			// Define vars
			var $modal = $('.' + this.settings.modalName, this.container);
			var $modalInside = $('.' + this.settings.modalName + '-inside', this.container);
			var markup = $('<div class="' + this.settings.overlayName + '"></div>\
							<div class="' + this.settings.modalName + ' modal-'+ this.settings.modalSkin +'">\
								<div class="' + this.settings.loaderName + '"></div>\
								<div class="' + this.settings.modalName + '-inside"></div>\
							</div>');

			// Update container
			this.container.css({'position' : 'relative'});

			// Add classes
			if( ! this.settings.allowClose )  $('.' + this.settings.modalName, markup).addClass('no-close');
			if( this.settings.container === 'body' ) markup.addClass('fixed');

			// Add markup
			if( ! $modal.length ) {
				this.container.append(markup);
			} else {
				this.modal.remove();
				this.overlay.remove();
				this.container.append(markup);
			}

			// set global modal vars
			this.modal = $('.' + this.settings.modalName, this.container);
			this.modalInside = $('.' + this.settings.modalName + '-inside', this.container);
			this.overlay = $('.' + this.settings.overlayName, this.container);
			this.loader = $('.' + this.settings.loaderName, this.container);

			// Set modal width
			if(this.settings.modalWidth) this.modalInside.css({'width' : this.settings.modalWidth});

		}

	}

	/* Initialize Plugin */
	$.fn.okModal = function( options ) {

		// If modal initialized with settings
		if ( typeof(options) === 'object' || typeof(options) === 'undefined' ) {

			// Initialize
			return this.each(function(){

				// Set settings
				var settings = $.extend(true, {}, $.fn.okModal.defaults, options);

				// Create object
				var okModal = new OkModal(this, settings);

				// Add object reference to the selector
				$(this).data('okModal', okModal);

				// return for chaining
				return this;

			});

		// If modal initialized with a method call
		} else if ( typeof options === 'string' ) {

			// Initialize
			return this.each(function() {

				// Set reference to selectors object
				var data = $(this).data('okModal');

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

		};

	};

	/* Initialize Plugin without selector */
	$.okModal = function( options ) {

		// If modal initialized with settings
		if ( typeof(options) === 'object' || typeof(options) === 'undefined' ) {

			// Set settings
			var settings = $.extend(true, {}, $.fn.okModal.defaults, options);

			// Create object
			var okModal = new OkModal(false, settings);

			// Add object reference to the selector
			$(document).data('okModal', okModal);

		// If modal initialized with a method call
		} else if ( typeof options === 'string' ) {

			// Set reference to selectors object
			var data = $(document).data('okModal');

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

		};

	};

	/* Set options obj */
	$.fn.okModal.defaults = {
		modalName 				: 'ok-modal',
		loaderName 				: 'ok-modal-loader',
		overlayName 			: 'ok-modal-overlay',
		closeModalName 			: 'close-modal',
		loadInsideName 			: 'load-inside',
		modalSkin 				: 'default',
		container 				: 'body',
		centered				: true,
		centeredOffset			: 50,
		fixed 					: true,
		animSpeed 				: 150,
		modalWidth 				: 800,
		insideMarkup 			: false,
		autoOpen 				: false,
		allowClose 				: true,
		eventDelegation 		: false,
		delegatedSelector 		: false,
		closeOnDocumentClick 	: true,

		iframe 					: false,
		iframeWrap 				: '<div class="modal-wrap" />',

		ajax 					: false,
		ajaxType 				: 'GET',
		ajaxFragment 			: false,
		ajaxUrl 				: false,
		ajaxData 				: false,

		afterInit 				: $.noop,
		afterOpen 				: $.noop,
		afterClose 				: $.noop,
		afterLoad 				: $.noop,
		afterAjaxSuccess 		: $.noop,
		afterAjaxComplete 		: $.noop,
		afterAjaxError 			: $.noop,
		onBeforeClose 			: $.noop
	};

})(jQuery);