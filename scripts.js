const apiAddr = 'https://jsonplaceholder.typicode.com';
const $document = $(document);

function updateCandyStripe() {
	let leftTableRows = $('.table').first().find('.table__row:not(.table__header)');
	let rightTableRows = $('.table').last().find('.table__row:not(.table__header)');

	for(let i = 0; i < leftTableRows.length; i++) {
		let row = leftTableRows.eq(i);
		row.removeClass('red-row');

		if(i % 2) {
			row.addClass('red-row');
		}
	}

	for(let i = 0; i < rightTableRows.length; i++) {
		let row = rightTableRows.eq(i);
		row.removeClass('red-row');

		if(i % 2) {
			row.addClass('red-row');
		}
	}
}

function dragstartHandler(ev) {
	ev.dataTransfer.dropEffect = 'move';

	// obtain origin table info
	let originTableId = $(ev.target).closest('.table').attr('id') 
	let originUserId = originTableId.split('-')[1];
	let albumId = ev.srcElement.id;

	// obtain receiving table info
	let userTables = $('div.table');
	let receivingTableId = userTables[0].id === originTableId ? userTables[1].id : userTables[0].id;
	let $receivingTable = $(`#${receivingTableId}`)[0];

	// add event listeners to receiving table
	$receivingTable.addEventListener('drop', dropHandler);
	$receivingTable.addEventListener('dragover', dragoverHandler);

	// save component's html data and id
	ev.dataTransfer.setData('text/html', ev.srcElement.outerHTML);
	ev.dataTransfer.setData('application/json', 
	                        JSON.stringify({
	                        	albumId: albumId.split('-')[1],
	                        	title: $(`#${albumId}`).find('div:last-child')[0].innerHTML,
	                        	originUserId: originUserId,
	                        	receivingTableId: receivingTableId
	                        }));
}

function dragoverHandler(ev) {
	ev.preventDefault();
}

function dropHandler(ev) {
	ev.preventDefault();

	let htmlData = ev.dataTransfer.getData('text/html');
	let { albumId, title, originUserId } = JSON.parse(ev.dataTransfer.getData('application/json'));
	let $receivingTable = $(ev.target).closest('.table');
	let receivingUserId = $receivingTable.attr('id');

	// if dropped in original table, return early
	if(originUserId === receivingUserId) {
		return
	}

	return $.ajax({
		url: apiAddr + '/albums/' + albumId,
		method: 'PUT',
		data: {
			id: albumId,
			userId: receivingUserId,
			title: title
		}
	}).done(() => {
		// if api returns success
		// remove row from old table and append it to the new one
		$(`#album-${albumId}`).remove();
		$receivingTable.append(htmlData);
		updateCandyStripe();
	}).fail(() => {
		// if api update failed, display alert
		alert('Something went wrong')
	})
}

function dragendHandler(ev) {
	// remove event handlers from tables and clean up state
	let $tables = $('.table');

	for(let i = 0; i < $tables.length; i++) {
		$tables[i].removeEventListener('drop', dropHandler)
		$tables[i].removeEventListener('dragover', dragoverHandler)
	}

	ev.dataTransfer.clearData();
}

function filterAlbums(tableRows, searchText) {
	// iterate through each row, searching for albums that don't match
	let visibleIdx = 0;
	for(let i = 0; i < tableRows.length; i++) {
		let row = tableRows[i];
		let rowAlbumName = $(row).find(':last-child')[0].innerHTML.toLowerCase();

		// if an album name doesn't match search, hide it
		$(row).removeClass('hidden');
		$(row).removeClass('red-row');
		if(rowAlbumName.indexOf(searchText) === -1) {
			$(row).addClass('hidden');

		} else {
			// make odd numbered visible rows red
			if(visibleIdx % 2) {
				$(row).addClass('red-row');
			}
			visibleIdx++;
		}
	}
}

function searchInputKeyPress(ev) {
	// get relevant table, rows, and search text
	if(ev.key === 'Enter') {
		let targetTable, searchText;
		if(ev.target.id === 'search-input-left') {
			targetTable = $('.table')[0];
			searchText = $('#search-input-left').val().toLowerCase();
		} else {
			targetTable = $('.table')[1];
			searchText = $('#search-input-right').val().toLowerCase();
		}

		let tableRows = $(targetTable).find('.table__row:not(.table__header)')
	
		filterAlbums(tableRows, searchText);
	}
}

function searchButtonClick(ev) {
	// get relevant table, rows, and search text
	let targetTable, searchText;
	if(ev.target.id === 'search-button-left') {
		targetTable = $('.table')[0];
		searchText = $('#search-input-left').val().toLowerCase();
	} else {
		targetTable = $('.table')[1];
		searchText = $('#search-input-right').val().toLowerCase();
	}

	let tableRows = $(targetTable).find('.table__row:not(.table__header)')

	filterAlbums(tableRows, searchText);
}

$(function() {
	// add search event listener for filtering
	let $searchButtons = $('.search__button');
	for(let i = 0; i < $searchButtons.length; i++) {
		$searchButtons[i].addEventListener('click', searchButtonClick);
	}

	// add search event listener for filtering
	let $searchInputs = $('.search__input');
	for(let i = 0; i < $searchInputs.length; i++) {
		$searchInputs[i].addEventListener('keypress', searchInputKeyPress);
	}

	// get user and album data concurrently 
	$.when(
		$.get(apiAddr + '/users/1'),
		$.get(apiAddr + '/users/2'),
		$.get(apiAddr + '/albums?userId=1'),
		$.get(apiAddr + '/albums?userId=2')
	).done((user1, user2, album1, album2) => {

		// when all data is obtained, then update UI
		// this is so the UI doesn't start displaying data
		// until all data is received, preventing an inaccurate UI
		let $firstTable = $('main > div.table:first-child');
		let $secondTable = $('main > div.table:last-child');


		// set table id to userId
		$firstTable.attr('id', `user-${user1[0].id}`);
		$secondTable.attr('id', `user-${user2[0].id}`);


		// populate tables with album data
		for(let i = 0; i < album1[0].length; i++) {

			let albumId = album1[0][i]['id'];
			let rowClass = i % 2 ? 'table__row red-row' : 'table__row';

			$firstTable
				.append(
					`<div 
						draggable='true' 
						ondragstart='dragstartHandler(event);'
						ondragend='dragendHandler(event);'
						class='${rowClass}'
						id=${'album-' + albumId}
					>
						<div class='table__cell table__cell--short'>${albumId}</div>
						<div class='table__cell'>${album1[0][i]['title']}</div>
					</div>`
				);
		}

		for(let i = 0; i < album2[0].length; i++) {

			let albumId = album2[0][i]['id'];
			let rowClass = i % 2 ? 'table__row red-row' : 'table__row';

			$secondTable
				.append(
					`<div 
						draggable='true' 
						ondragstart='dragstartHandler(event);'
						ondragend='dragendHandler(event);'
						class='${rowClass}'
						id=${'album-' + albumId}
					>
						<div class='table__cell table__cell--short'>${albumId}</div>
						<div class='table__cell'>${album2[0][i]['title']}</div>
					</div>`
				);
		}
	})

});