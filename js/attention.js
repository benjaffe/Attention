var Attention;
$(function() {
	Attention = {
		debug : true,
		date : undefined,
		dateName : undefined,
		initDate : undefined,
		// sets the current day to today
		init : function() {
			this.date = new Date();
			this.updateView(); //goes to today

			if (!this.initDate) {
				this.initDate = new Date();
				var msInDay = 86400000;
				var msUntilMidnight = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 6, 3, 0, 0)*1 + msInDay - this.date;  //new date of last midnight + a day - now gets us the number of ms until midnight
				setTimeout(function(){
					console.log("It's midnight! Updating...");
					Attention.init();
					setInterval(function() {
						console.log("It's midnight! Updating...");
						Attention.init();
					},msInDay);
				}, msUntilMidnight);
			}
		},
		//clears today's changes and starts with a fresh template
		reset : function() {
			localStorage.removeItem(this.dateName);
			this.init();
		},
		//makes a list-item element for a list
		makeElem : function(type, content){
			if (type === 'list-item') return $('<li class="list-item"><div class="checkmark">&#x2714;</div><div class="list-item-content">' + content + '</div></li>');
			else if (type === 'list') return $('<li class="list"><div class="btn-add-list-item">+</div><div class="accordion"><h2 class="list-title">' + content + '</h2><ul class="list-items"></ul></div></li>');
		},
		//rebuilds the view from the data in localStorage
		updateView : function(){
			var date = this.date;
			var currYear = date.getFullYear();
			var currMonth = date.getMonth()+1;
			var currDate = date.getDate();
			if ((currMonth+'').length === 1) currMonth = '0' + currMonth; //pad with 0's
			if ((currDate+'').length === 1) currDate = '0' + currDate; //pad with 0's
			this.dateName = 'Attention-' + currYear + currMonth + currDate; //name of this day's data store
			if (date*1 === new Date(0)*1) {
				this.dateName = 'Attention-default';
			}
			console.log(date);
			console.log(new Date(0));
			console.log(this.dateName);

			if (!localStorage[this.dateName]) { //if the date doesn't already exist
				console.log('creating new day');
				localStorage[this.dateName] = localStorage['Attention-default'] || JSON.stringify([{"title":"Big Deal","column":0,"items":[{"title":"Work on Attention","done":false}]},{"title":"Routine","column":0,"items":[{"title":"Breakfast","done":false},{"title":"Lunch","done":false},{"title":"Dinner","done":false},{"title":"Shower","done":false},{"title":"Makeup","done":false},{"title":"Meds","done":false}]},{"title":"Things I Want","column":1,"items":[{"title":"New Shoes","done":false}]},{"title":"Also Brewing","column":1,"items":[{"title":"Call Your Mother","done":false}]}]);
			}

			console.log('populating DOM');
			$('.col').html(''); //clear the DOM
			var data = JSON.parse(localStorage[this.dateName]);

			for (var i = 0; i < data.length; i++) { //big lists
				var listElem = Attention.makeElem('list',data[i].title);
				$('#col-'+data[i].column).append(listElem);
				var listItems = $(listElem).find('.list-items');
				for (var j = 0; j < data[i].items.length; j++) {
					var listItemElem = Attention.makeElem('list-item', data[i].items[j].title);
					if (data[i].items[j].done) {
						listItemElem.addClass('done');
					}
					listItems.append(listItemElem);
				}
			}
			$('.btn-add-list-item').click(function() {
				var listItemElem = Attention.makeElem('list-item', prompt('Type your item'));
				$(this).next('.accordion').find('.list-items').append(listItemElem);
				console.log($(this).find('.list-items'));
				Attention.updateData();
			});

			$( ".list-items" ).sortable({
				connectWith: ".list-items",
				revert: true
			}).disableSelection();

			$(".accordion").accordion({
				collapsible: true,
				icons: null,
				heightStyle: "content"
			});

			$(".list-item-content").click(function() {
				var parentListItem = $(this).parent('.list-item');
				if (parentListItem.hasClass("done")) {
					parentListItem.toggleClass("done");
				} else {
					var elem = $(this).hide();
					$('<input value="' + $(this).text() + '"></input>').insertAfter(this).focus().blur(function(){
						elem.text($(this).val()).show();
						$(this).remove();
						Attention.updateData();
					});
				}
			});

			$(".checkmark").click(function() {
				$(this).parent('.list-item').toggleClass("done");
			});

			$('.list-item, .list').mouseup(function() {
				Attention.updateData();
			});


			this.date.toDateString();
		},
		//turns the view into data and stores it in localStorage
		updateData : function(){
			var that = this;
			setTimeout(function(){ //need to delay to ensure jQueryUI does its stuff before we do.
				var today = [];
				$('.col').each(function(i){
					$(this).find('.list').each(function() {
						var listTitle = $(this).find('.list-title').text();
						today.push( {
							title : listTitle,
							column : i,
							items : $(this).find('.list-item').map(function(i, el) {
								return {
									title : $(el).find('.list-item-content').text(),
									done : $(el).hasClass('done')
								};
							}).get()
						});

					});

				});
				localStorage[that.dateName] = JSON.stringify(today);
				console.log(that.dateName);
				console.log(today);
			},1);
		},
		//moves n days into the future
		moveDate : function(num) {
			this.date.setDate(this.date.getDate() + num);
			this.updateView();
		},
		viewDefault : function() {
			this.date = new Date(0);
			console.log(this.date);
			this.updateView();
		},
		newCategory : function(title) {
			var data = JSON.parse(localStorage[this.dateName]);
			data.push({
				title: title,
				column: $('#col-0').size() > $('#col-1').size() ? 0 : 1,
				items: []
			});
			localStorage[this.dateName] = JSON.stringify(data);
			this.updateView();
		}
	};

	Attention.init();

	$( ".col" ).sortable({
		connectWith: ".col"
	}).disableSelection();

	$('.new-item').click(function(){
		var title = prompt("Category Title?\n(ex: Things I Want, Routine, etc)","");
		if (title && title !== '') Attention.newCategory(title);
	});

	$('.trash').droppable({
		hoverClass: "drop-hover",
		tolerance: "pointer",
		drop : function(e, ui){
			var elem = $(ui.draggable[0]);
			console.log(elem);
			if (elem.hasClass('list') && $(elem).find('.list-item').size() > 0) {
				//ask, do you want to remove children, or the whole list?

				$('#delete-list-or-children').dialog({
					modal: true,
					buttons: {
						"List": function() {
							$(this).dialog('close');
							elem.remove();
							Attention.updateData();
						},
						"Children": function() {
							$(this).dialog('close');
							elem.find('.list-item').remove();
							Attention.updateData();
						}
					}
				});

			} else {
				elem.remove();
				Attention.updateData();
			}
		}
	});

	$('.trash').click(function() {
		if (Attention.debug) Attention.reset();
	});

});
