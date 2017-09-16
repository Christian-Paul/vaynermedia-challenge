const apiAddr = 'https://jsonplaceholder.typicode.com';
const $document = $(document);

function dragstart_handler(ev) {
	ev.dataTransfer.dropEffect = 'move';

	// save component's html data and id
	ev.dataTransfer.setData('text/html', ev.srcElement.outerHTML);
	ev.dataTransfer.setData('application/json', 
	                        JSON.stringify({
	                        	id: $(ev.srcElement).find('div:first-child')[0].innerHTML,
	                        	title: $(ev.srcElement).find('div:last-child')[0].innerHTML
	                        }));
}

function dragover_handler(ev) {
	ev.preventDefault();
}

function drop_handler(ev) {
	ev.preventDefault();

	let htmlData = ev.dataTransfer.getData('text/html');
	let { id, title } = JSON.parse(ev.dataTransfer.getData('application/json'));
	let $receivingTable = $(ev.target).closest('.table');

	// if drag successful
	// append html to parent table
	$.ajax({
		url: apiAddr + '/albums/' + id,
		method: 'PUT',
		data: {
			id: id,
			userId: 3,
			title: title
		}
	}).then(() => {
		$receivingTable.append(htmlData);
	})

}

function dragend_handler(ev) {
	console.log('drag end');
	// if drag cancelled, do nothing
	// if dropped in original table, do nothing
	// if drag failed, do nothing

	// if drag successful, remove element

	console.log('target: ', ev.srcElement);
	$(ev.srcElement).remove();
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

		for(let i = 0; i < album1[0].length; i++) {
			$('main > div.table:first-child')
				.append(
					`<div 
						draggable='true' 
						ondragstart='dragstart_handler(event);'
						ondragend='dragend_handler(event);'
						class='table__row'
					>
						<div class='table__cell table__cell--short'>${album1[0][i]['id']}</div>
						<div class='table__cell'>${album1[0][i]['title']}</div>
					</div>`
				);
		}

		for(let i = 0; i < album2[0].length; i++) {
			$('main > div.table:last-child')
				.append(
					`<div 
						draggable='true' 
						ondragstart='dragstart_handler(event);'
						ondragend='dragend_handler(event);'
						class='table__row'
					>
						<div class='table__cell table__cell--short'>${album2[0][i]['id']}</div>
						<div class='table__cell'>${album2[0][i]['title']}</div>
					</div>`
				);
		}
	})

});