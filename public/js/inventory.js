'use strict';

function load() {
    const classification_id = this.value;

    if (classification_id) return fetch(`/inv/getInventory/${classification_id}`)
        .then(res => { if (res.ok) return res.json(); throw Error('Network response was not okay'); })
        .then(data => buildInventoryList(data))
        .catch(err => console.error('There was a problem: ', err.message));

    inventoryDisplay.textContent = '';
}

const buildInventoryList = data => inventoryDisplay.innerHTML = `
                                <thead>
                                    <tr>
                                        <th>Vehicle Name</th>
                                        <th colspan="2">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>${data.map(el => `
                                    <tr>
                                        <td>${el.inv_make} ${el.inv_model}</td>
                                        <td><a href="/inv/edit/${el.inv_id}" title="Click to update">Modify</a></td>
                                        <td><a href="/inv/delete/${el.inv_id}" title="Click to delete">Delete</a></td>
                                    </tr>`).join('')}
                                </tbody>
                            `;

classification_id.addEventListener('change', load);
load.bind(classification_id)();
