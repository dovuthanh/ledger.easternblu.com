/*--------------------------------------------------
MUSICFLOW html/css template - custom.js

URL:gozawi.com
SUPPORT: wtxinc@gmail.com
CODE: MF001JS

---------------------------------------------------*/

/***************************************************
1. ON LOAD JQUERY
***************************************************/

(function($) {
	    $('.search  input[type=text]').css('width', '100%').css('width', '-=15px');
		$('.comments-ul .comment-content').css('width', '100%').css('width', '-=86px');	
})(jQuery);

$(window).resize(function() {
	$('.comments-ul .comment-content').css('width', '100%').css('width', '-=86px');
	$('.search  input[type=text]').css('width', '100%').css('width', '-=40px');
});

/***************************************************
2. IMG HOVERS
***************************************************/

(function($) {
	$('.img-hover').hover(
	function () {
	    $(this).stop( true, true ).animate({opacity: 1 }, 500);
		$(this).find('span').stop( true, true ).animate({ 'marginTop': '65' }, 500);
		},
		function () {
		 $(this).stop( true, true ).animate({opacity: 0 }, 500);
		 $(this).find('span').stop( true, true ).animate({ 'marginTop': '0' }, 500);
		}
	);
})(jQuery);

(function($) {
	$('.img-hover-album').hover(
	function () {
	    $(this).stop( true, true ).animate({opacity: 1 }, 500);
		$(this).find('span').stop( true, true ).animate({ 'marginTop': '130' }, 500);
		},
		function () {
		 $(this).stop( true, true ).animate({opacity: 0 }, 500);
		 $(this).find('span').stop( true, true ).animate({ 'marginTop': '0' }, 500);
		}
	);
})(jQuery);

(function($) {
	$('.img-hover-resident').hover(
	function () {
	    $(this).stop( true, true ).animate({opacity: 1 }, 500);
		$(this).find('span').stop( true, true ).animate({ 'marginTop': '130' }, 500);
		},
		function () {
		 $(this).stop( true, true ).animate({opacity: 0 }, 500);
		 $(this).find('span').stop( true, true ).animate({ 'marginTop': '0' }, 500);
		}
	);
})(jQuery);

(function($) {
	$('.img-hover-sidebar').hover(
	function () {
	    $(this).stop( true, true ).animate({opacity: 1 }, 500);
		$(this).find('span').stop( true, true ).animate({ 'marginTop': '50' }, 500);
		},
		function () {
		 $(this).stop( true, true ).animate({opacity: 0 }, 500);
		 $(this).find('span').stop( true, true ).animate({ 'marginTop': '0' }, 500);
		}
	);
})(jQuery);

(function($) {
	$('.img-hover-media-player').hover(
	function () {
	    $(this).stop( true, true ).animate({opacity: 1 }, 500);
		$(this).find('span').stop( true, true ).animate({ 'marginTop': '120' }, 500);
		},
		function () {
		 $(this).stop( true, true ).animate({opacity: 0 }, 500);
		 $(this).find('span').stop( true, true ).animate({ 'marginTop': '0' }, 500);
		}
	);
})(jQuery);

(function($) {
	$('.img-hover-media-top').hover(
	function () {
	    $(this).stop( true, true ).animate({opacity: 1 }, 500);
		$(this).find('span').stop( true, true ).animate({ 'marginTop': '120' }, 500);
		$(this).find('h6').stop( true, true ).animate({ 'bottom': '30' }, 500);
		},
		function () {
		 $(this).stop( true, true ).animate({opacity: 0 }, 500);
		 $(this).find('span').stop( true, true ).animate({ 'marginTop': '0' }, 500);
		 $(this).find('h6').stop( true, true ).animate({ 'bottom': '0' }, 500);
		}
	);
})(jQuery);

/***************************************************
3. PRETTY PHOTO
***************************************************/
						
jQuery(function($){
	$("a[rel^='prettyPhoto']").prettyPhoto();
});
			  
$('a[data-rel]').each(function() {
		$(this).attr('rel', $(this).data('rel'));
});

/***************************************************
4. FLICKR
***************************************************/

// $('.flickr').jflickrfeed({
// 		// limit: 6,
// 		// qstrings: {
// 		// 	id: 'YOUR FLICKR ID GOES HERE'
// 		// },
// 		// itemTemplate: '<li><a href="{{image_b}}" data-rel="prettyPhoto" ><img src="{{image_s}}" alt="{{title}}" /></a></li>'
		
// 		// }, function(data) {
// 		// 	$('.flickr a').prettyPhoto();
// });

/***************************************************
5. SOCIAL FEED
***************************************************/

jQuery(function($){
	$(".tweet").tweet({
	  modpath: 'js/twitter.php',
	  join_text: "auto",
	  username: "GOZAWI",
	  avatar_size: 0,
	  count: 1,
	  auto_join_text_default: " we said, ",
	  auto_join_text_ed: " we ",
	  auto_join_text_ing: " we were ",
	  auto_join_text_reply: " we replied ",
	  auto_join_text_url: " we were checking out ",
	  loading_text: "loading tweets..."
	});
  });
  
  
$(document).ready(function(){
    $(".tweet_text a").addClass('skin-font-color6 skin-color-hover1');   
});

/***************************************************
6. SCROLL TO
***************************************************/
			
// function ScrollTo(id){
// 	$('html,body').animate({scrollTop: $("#"+id).offset().top},3000);
// }

// (function($) {
// 	$(window).scroll(function() {
// 		var fromTop = $(this).scrollTop();
// 		var startPostion = $('.bottom').offset().top-600;
// 		if (fromTop >= startPostion) {
// 			$('.go-top').wait(250).animate({opacity: 1 , bottom: 50, }, 1000);
// 		}
// 	});

// })(jQuery);

/***************************************************
7. SLIDERS
***************************************************/

// jQuery(function($){	
// 	if ( $(body).hasClass('has-slider')) {
// 		// jQuery('.slider').camera({
// 		// thumbnails: false,
// 		// navigationHover: false,
// 		// pagination: false,
// 		// playPause: false,
// 		// autoAdvance: true,
// 		// fx: 'random',
// 		// loader: 'bar'
// 		// });
// 	}
// });

// jQuery(function($){	
// 	if ( $(body).hasClass('has-photo-slider')) {
// 		// jQuery('.photo-slider').camera({
// 		// thumbnails: false,
// 		// navigationHover: false,
// 		// pagination: false,
// 		// fx: 'scrollLeft',
// 		// playPause: false,
// 		// autoAdvance: true,
// 		// loader: 'bar'
// 		// });
// 	}
// });

/***************************************************
8. REMOVE MASK BUTTON
***************************************************/

$(function() {
    var state = true;
    $( ".remove-mask" ).click(function() {
      if ( state ) {
       $('.top-content .button-2').animate({ opacity:0 },1000);
		$('.top-content h1').animate({ opacity:0 },1000);
		$('.top-content p').animate({ opacity:0 },1000);

		// $('.top-wrapper-mask').wait(1200).animate({ 'background-color': 'rgba(0, 0, 0, 0)' },1000);
		$('.top-content .button-1').wait(1200).animate({ left:898 , bottom:199 },1000);
		
		$('.album-wall img').wait(1800).addClass('img-z-index');
		$('.album-wall .img-hover-media-top').wait(1800).addClass('img-hover-media-top-z-index');
      } else {
        $('.top-content .button-2').wait(1200).animate({ opacity:1 },1000);
		$('.top-content h1').wait(1200).animate({ opacity:1 },1000);
		$('.top-content p').wait(1200).animate({ opacity:1 },1000);
		
		// $('.top-wrapper-mask').animate({ 'background-color': 'rgba(0, 0, 0, 0.7)' },1000);
		$('.top-content .button-1').animate({ left:291 , bottom:323 },1000);
		
		$('.album-wall img').removeClass('img-z-index');
		$('.album-wall .img-hover-media-top').removeClass('img-hover-media-top-z-index');
      }
      state = !state;
    });
  });
  
/***************************************************
11. CONTACT FORM
***************************************************/  

$(function() { 

var random = Math.ceil((Math.random() * 10));

if( random == 1 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='2+7='>" );
}
if( random == 2 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='3+4='>" );
}
if( random == 3 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='1+3='>" );
}
if( random == 4 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='2+5=''>" );
}
if( random == 5 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='7-2='>" );
}
if( random == 6 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='5-3='>" );
}
if( random == 7 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='3+3='>" );
}
if( random == 8 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='4+4='>" );
}
if( random == 9 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='1+4='>" );
}
if( random == 10 ){
$( "#contact_verify").replaceWith( "<input type='text' class='skin-border-color4 skin-font-color13' id='contact_verify' value='1+7='>" );
}

$("#contact_button").click(function() { 

var contact_verify = $("#contact_verify").val(); 
var contact_name = $("#contact_name").val(); 
var contact_email = $("#contact_email").val(); 
var contact_subject = $("#contact_subject").val(); 
var contact_text = $("#contact_text").val(); 
var emailReg = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
var dataString = '&name='+ contact_name + '&email=' + contact_email + '&text=' + contact_text + '&subject=' + contact_subject; 
var go = true;
var emailcheck = false;

$('#contact_name').removeClass('contact-required');
$('#contact_email').removeClass('contact-required');
$('#contact_subject').removeClass('contact-required');
$('#contact_text').removeClass('contact-required');
$('#contact_verify').removeClass('contact-required');

if( random == 1 ){
	if (contact_verify != '2+7=9'){
	$('.span-check').text('Equation - false');
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 2 ){
	if (contact_verify != '3+4=7'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 3 ){
	if (contact_verify != '1+3=4'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 4 ){
	if (contact_verify != '2+5=7'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 5 ){
	if (contact_verify != '7-2=5'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 6 ){
	if (contact_verify != '5-3=2'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 7 ){
	if (contact_verify != '3+3=6'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 8 ){
	if (contact_verify != '4+4=8'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 9 ){
	if (contact_verify != '1+4=5'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
if( random == 10 ){
	if (contact_verify != '1+7=8'){
	$('#contact_verify').addClass('contact-required');
	go=false;
}}
		 
if(contact_name=='Name'){
$('#contact_name').addClass('contact-required');
go=false;
}

if(contact_name==''){
$('#contact_name').addClass('contact-required');
go=false;
}

if(contact_email=='Email'){
$('#contact_email').addClass('contact-required');
go=false;
}
else if(contact_email==''){
$('#contact_email').addClass('contact-required');
go=false;
}
else if(emailReg.test(contact_email)){
emailcheck = true;
}
else {
$('#contact_email').addClass('contact-required');
go=false;
}

if(contact_subject=='Topic'){
$('#contact_subject').addClass('contact-required');
go=false;
}

if(contact_subject==''){
$('#contact_subject').addClass('contact-required');
go=false;
}

if(contact_text=='Message'){
$('#contact_text').addClass('contact-required');
go=false;
}

if(contact_text==''){
$('#contact_text').addClass('contact-required');
go=false;
}

if ( go == false){
 return false; 
}

 $.ajax({ 
	type: "POST", 
	url: "email.php", 
	data: dataString, 
	success: function(){
	$( "#contact_button").replaceWith( "<input type='submit' id='contact_button'  value='Message sent, thank you!' class='button-normal skin-background-color9 skin-font-color3 skin-background-hover3'/>" );
	} 
}); 

$('.contact-form').get(0).reset();
return false;
}); 
});

/***************************************************
10. OPTIONAL ANIMATIONS
***************************************************/  
  
$(document).ready(function() {
	if ($(window).height() > 900 && $('body').hasClass('animate')) {
		skrollr.init();
	};
});

/***************************************************
11. ALERT & TOGGLE
***************************************************/ 

$('.alert').click(function(event) {
event.preventDefault();
  $(this).hide('slow', function() {
	return false;
  });
});

$('.toggle .button-normal').click(function(event) {
event.preventDefault();
  $(this).parent().find('.toggle-content').toggle('slow', function() {
	return false;
  });
});

/***************************************************
12. MOBILE MENU
***************************************************/ 

$('.mobile-button').click(function() {
  $('.mobile-menu').toggle('slow', function() {
	return false;
  });
});

$('.mobile-menu li a').click(function() {
  $('.mobile-menu').toggle('slow', function() {
	return false;
  });
});

$(window).resize(function(){
	if($(".mobile-menu").is(":visible")){
		$('.mobile-menu').hide('slow', function() {
			return false;
		  });	
	}
});

/***************************************************
13. MUSIC PLAYER
***************************************************/ 

$(document).ready(function(){

	if ( $('.music-player').hasClass('has-player')){
		$('.footer').css('height', '82px');
		$('.top-wrapper').addClass('mobile-has-player');
	}

	soundManager.url = 'swf/';
	soundManager.flashVersion = 9;
	soundManager.useHTML5Audio = true;
	soundManager.debugMode = false;
	
	$('.music-player').fullwidthAudioPlayer({autoPlay: false, sortable: true });

});

