const apiAddr = 'https://jsonplaceholder.typicode.com';
const $document = $(document);

function dragstart_handler(ev) {
	ev.dataTransfer.dropEffect = 'move';

	// obtain origin table info
	let originTableId = $(ev.target).closest('.table').attr('id') 
	let originUserId = originTableId.split('-')[1];

	// obtain receiving table info
	let userTables = $('div.table');
	let receivingTableId = userTables[0].id === originTableId ? userTables[1].id : userTables[0].id;
	let $receivingTable = $(`#${receivingTableId}`)[0];

	// add event listeners to receiving table
	$receivingTable.addEventListener('drop', drop_handler);
	$receivingTable.addEventListener('dragover', dragover_handler);

	// save component's html data and id
	ev.dataTransfer.setData('text/html', ev.srcElement.outerHTML);
	ev.dataTransfer.setData('application/json', 
	                        JSON.stringify({
	                        	albumId: $(ev.srcElement).find('div:first-child')[0].innerHTML,
	                        	title: $(ev.srcElement).find('div:last-child')[0].innerHTML,
	                        	originUserId: originUserId,
	                        	receivingTableId: receivingTableId
	                        }));
}

function dragover_handler(ev) {
	ev.preventDefault();
}

function drop_handler(ev) {
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
	}).fail(() => {
		// if api update failed, display alert
		alert('Something went wrong')
	})

}

function dragend_handler(ev) {
	// remove event handlers from tables and clean up state
	let $tables = $('.table');

	for(let i = 0; i < $tables.length; i++) {
		$tables[i].removeEventListener('drop', drop_handler)
		$tables[i].removeEventListener('dragover', dragover_handler)
	}

	ev.dataTransfer.clearData();
}

$(function() {

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

			$firstTable
				.append(
					`<div 
						draggable='true' 
						ondragstart='dragstart_handler(event);'
						ondragend='dragend_handler(event);'
						class='table__row'
						id=${'album-' + albumId}
					>
						<div class='table__cell table__cell--short'>${albumId}</div>
						<div class='table__cell'>${album1[0][i]['title']}</div>
					</div>`
				);
		}

		for(let i = 0; i < album2[0].length; i++) {

			let albumId = album2[0][i]['id'];

			$secondTable
				.append(
					`<div 
						draggable='true' 
						ondragstart='dragstart_handler(event);'
						ondragend='dragend_handler(event);'
						class='table__row'
						id=${'album-' + albumId}
					>
						<div class='table__cell table__cell--short'>${albumId}</div>
						<div class='table__cell'>${album2[0][i]['title']}</div>
					</div>`
				);
		}
	})

});