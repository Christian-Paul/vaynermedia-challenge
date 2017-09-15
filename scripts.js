$(function() {

	const apiAddr = 'https://jsonplaceholder.typicode.com';

	
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

		console.log('all data: ', user1, user2, album1, album2);

		for(let i = 0; i < album1[0].length; i++) {
			$('main > div.table:first-child')
				.append(
					`<div class='table__row'>
						<div class='table__cell table__cell--short'>${album1[0][i]['id']}</div>
						<div class='table__cell'>${album1[0][i]['title']}</div>
					</div>`
				);
		}

		for(let i = 0; i < album2[0].length; i++) {
			$('main > div.table:last-child')
				.append(
					`<div class='table__row'>
						<div class='table__cell table__cell--short'>${album2[0][i]['id']}</div>
						<div class='table__cell'>${album2[0][i]['title']}</div>
					</div>`
				);
		}
	})
});