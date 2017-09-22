const apiAddr = 'https://jsonplaceholder.typicode.com';
const $document = $(document);
let $tables;
let $userSelectLeft, $userSelectRight;

class AlbumApp {
	constructor(userIds = [], currentUsers = []) {
		this.allUsers = userIds,
		this.currentUsers = currentUsers
	}

	getCurrentUsers() {
		return this.currentUsers;
	}

	getAllUsers() {
		return this.allUsers;
	}

	setAllUsers(allUsers) {
		this.allUsers = allUsers;
	}

	setCurrentUsers(currentUsers) {
		this.currentUsers = currentUsers;
	}

	updateCurrentUser(idx, newUser) {
		this.currentUsers[idx] = newUser;
	}
}

let MyAlbumApp = new AlbumApp();

let multiSelect = {
	seletedTableId: null,
	seletedAlbums: []
}

// fill dropdowns with user options
function populateDropdown() {
	// clear dropdowns
	$userSelectLeft.empty();
	$userSelectRight.empty();

	let [user1, user2] = MyAlbumApp.getCurrentUsers();
	let allUsers = MyAlbumApp.getAllUsers();

	for(let i = 0; i < allUsers.length; i++) {
		let username = allUsers[i].username;
		let userId = allUsers[i].id;
		let leftSelected = userId === user1.id;
		let rightSelected = userId === user2.id;

		// don't give users the option of selecting a user that's selected elsewhere
		if(userId !== user2.id) {
			$userSelectLeft.append(`
				<option value=${userId} ${leftSelected && 'selected'}>
					${username}
				</option>
			`)
		}

		if(userId !== user1.id) {
			$userSelectRight.append(`
				<option value=${userId} ${rightSelected && 'selected'}>
					${username}
				</option>
			`)
		}
	}
}

// on selecting a new change user
// update the table data and the dropdown options 
function handleDropdownChange(event) {
	let userId = $(event.target).val();
	let tableIdx = $(event.target).hasClass('user-select-left') ? 0 : 1;

	$.when(
		$.get(apiAddr + `/users/${userId}`),
		$.get(apiAddr + `/albums?userId=${userId}`)
	).done((user, album) => {
		MyAlbumApp.updateCurrentUser(tableIdx, user[0]);
		populateDropdown();
		populateTable($tables[tableIdx], user, album);
	});
}

// populate a table with data from API
function populateTable(table, user, album) {
	// set table id to userId
	table.attr('id', `user-${user[0].id}`);
	table.empty();

	// populate tables with album data
	for(let i = 0; i < album[0].length; i++) {

		let albumId = album[0][i]['id'];
		let rowClass = i % 2 ? 'table__row red-row' : 'table__row';

		table
			.append(
				`<div 
					draggable='true' 
					ondragstart='dragstartHandler(event);'
					ondragend='dragendHandler(event);'
					onclick='albumClickHandler(event);'
					class='${rowClass}'
					id=${'album-' + albumId}
				>
					<div class='table__cell table__cell--short'>${albumId}</div>
					<div class='table__cell'>${album[0][i]['title']}</div>
				</div>`
			);
	}
}

// update candy stripe style
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

// deselect all albums
function deselectAllAlbums() {
	let $selected = $('.selected');

	for(let i = 0; i < $selected.length; i++) {
		$selected.eq(i).removeClass('selected');
	}
}

// handle clicking on an album to select multiple albums at once
function albumClickHandler(ev) {
	// if ctrl was held while clicking, add this album to multiselect
	if(ev.ctrlKey) {
		// get album and table info
		let albumId = $(ev.srcElement).closest('.table__row').attr('id');
		let tableId = $(ev.srcElement).closest('.table').attr('id');
		let albumTitle = $(`#${albumId}`).find('div:last-child')[0].innerHTML;
		let albumHtml = $(ev.srcElement).closest('.table__row')[0].outerHTML;

		// if multiselect is currently storing albums from the clicked table
		// or isn't storing albums from a particular table
		// deal with the clicked album
		if(tableId === multiSelect.seletedTableId || multiSelect.seletedTableId === null) {
			multiSelect.seletedTableId = tableId;

			let albumIdx = multiSelect.seletedAlbums.findIndex(album => album.albumId === albumId);
			// if it is being tracked, remove it
			if(albumIdx !== -1) {
				multiSelect.seletedAlbums = [
					...multiSelect.seletedAlbums.slice(0, albumIdx),
					...multiSelect.seletedAlbums.slice(albumIdx+1)
				]

				// remove selected class
				$(`#${albumId}`).first().removeClass('selected');
			} else {
				// if the album isn't already being tracked, add it
				multiSelect.seletedAlbums.push({
					albumId: albumId,
					albumTitle: albumTitle,
					albumHtml: albumHtml
				});

				// add selected class
				$(`#${albumId}`).first().addClass('selected');
			}
		} else {
			// if the target album is from a different table
			// clear multiselect state and add current target
			multiSelect = {
				seletedTableId: tableId,
				seletedAlbums: [{
					albumId: albumId,
					albumTitle: albumTitle,
					albumHtml: albumHtml
				}]
			}

			deselectAllAlbums();
			$(`#${albumId}`).first().addClass('selected');
		}
	}
}

// handle starting a drag event
function dragstartHandler(ev) {
	ev.dataTransfer.dropEffect = 'move';

	// obtain origin table info
	let originTableId = $(ev.target).closest('.table').attr('id') 
	let originUserId = originTableId.split('-')[1];
	let albumId = ev.srcElement.id;
	let albumTitle = $(`#${albumId}`).find('div:last-child')[0].innerHTML;
	let albumHtml = ev.srcElement.outerHTML;
	let albumData;
	
	// if the dragged album is in multiselect, use multiselect data for transaction
	let albumIdx = multiSelect.seletedAlbums.findIndex(album => album.albumId === albumId);
	if(albumIdx !== -1) {
		albumData = multiSelect.seletedAlbums;
	} else {	
		// if the dragged album isn't in multiselect, de-select everything
		multiSelect = {
			seletedTableId: null,
			seletedAlbums: []
		}

		deselectAllAlbums();

		// save album title and id
		albumData = [{
			albumId: albumId,
			albumTitle: albumTitle,
			albumHtml: albumHtml
		}];
	}


	// obtain receiving table info
	let userTables = $('div.table');
	let receivingTableId = userTables[0].id === originTableId ? userTables[1].id : userTables[0].id;
	let $receivingTable = $(`#${receivingTableId}`).first();

	// add event listeners to receiving table
	$receivingTable[0].addEventListener('drop', dropHandler);
	$receivingTable[0].addEventListener('dragover', dragoverHandler);
	$receivingTable.addClass('drop-zone');

	let data = {
		albumData: albumData,
		originUserId: originUserId
	};

	ev.dataTransfer.setData('application/json', JSON.stringify(data));
}

// prevent default behavior on dragging an album
function dragoverHandler(ev) {
	ev.preventDefault();
}

// handle an album being dropped
function dropHandler(ev) {
	ev.preventDefault();

	let data = JSON.parse(ev.dataTransfer.getData('application/json'));
	let { originUserId } = data;
	let $receivingTable = $(ev.target).closest('.table');
	let receivingUserId = $receivingTable.attr('id');
	
	// if dropped in original table, return early
	if(originUserId === receivingUserId) {
		return
	}

	let failureMessage = false;

	for(let i = 0; i < data.albumData.length; i++) {
		let htmlData = data.albumData[i].albumHtml;
		let albumId = data.albumData[i].albumId.split('-')[1];
		let albumTitle = data.albumData[i].albumTitle;
		
		$.ajax({
			url: apiAddr + '/albums/' + albumId,
			method: 'PUT',
			data: {
				id: albumId,
				userId: receivingUserId,
				albumTitle: albumTitle
			}
		}).done(() => {
			// if api returns success
			// remove row from old table and append it to the new one
			$(`#album-${albumId}`).remove();
			$receivingTable.append(htmlData);
			updateCandyStripe();
		}).fail(() => {
			// if api update failed, display alert
			// only display alert once per move
			if(!failureMessage) {
				alert('Something went wrong');
				failureMessage = true;
			}
		})
	}
}

// remove event handlers from tables and clean up state
function dragendHandler(ev) {
	let $tables = $('.table');

	for(let i = 0; i < $tables.length; i++) {
		$tables[i].removeEventListener('drop', dropHandler)
		$tables[i].removeEventListener('dragover', dragoverHandler)
		$tables.eq(i).removeClass('drop-zone');
	}

	ev.dataTransfer.clearData();
}

// update which albums are visible
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

// on search click, obtain relevant table and search data
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

$(document).ready(function() {
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

	// add change event listener for selecting different users
	let $dropDowns = $('.user-select');
	for(let i = 0; i < $dropDowns.length; i++) {
		$dropDowns[i].addEventListener('change', (event) => handleDropdownChange(event));
	}

	// get user and album data concurrently
	$.when(
		$.get(apiAddr + '/users/1'),
		$.get(apiAddr + '/users/2'),
		$.get(apiAddr + '/albums?userId=1'),
		$.get(apiAddr + '/albums?userId=2'),
		$.get(apiAddr + '/users')
	).done((user1, user2, album1, album2, allUsers) => {

		// set initial MyAlbumApp values
		let currentUsers = [user1[0], user2[0]];
		MyAlbumApp.setAllUsers(allUsers[0]);
		MyAlbumApp.setCurrentUsers(currentUsers);

		// grab tables and dropdowns
		$tables = [$('main > div.table:first-child'), $('main > div.table:last-child')];
		$userSelectLeft = $('.user-select-left');
		$userSelectRight = $('.user-select-right');

		// fill dropdown and tables with data
		populateDropdown();
		populateTable($tables[0], user1, album1);
		populateTable($tables[1], user2, album2);
	})
});