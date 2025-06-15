'use strict';

const accountType = document.getElementById('accountType');
const accountsDisplay = document.getElementById('accountsDisplay');

function load() {
    const account_type = accountType.value;

    if (account_type) return fetch(`/account/getAccounts/${account_type}`)
        .then(res => { if (res.ok) return res.json(); throw Error('Network response was not okay'); })
        .then(data => buildInventoryList(data))
        .catch(err => console.error('There was a problem: ', err.message));

    accountsDisplay.textContent = '';
}

const buildInventoryList = data => accountsDisplay.innerHTML = `
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th colspan="2">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>${data.map(row => `
                                    <tr>
                                        <td>${row.account_email}</td>
                                        <td>${row.account_lastname}, ${row.account_firstname}</td>
                                        <td>${row.account_type}</td>
                                        <td><a href="/account/manage/edit/${row.account_id}" title="Click to edit">Edit</a></td>
                                        <td><a href="/account/manage/delete/${row.account_id}" title="Click to delete">Delete</a></td>
                                    </tr>`).join('')}
                                </tbody>
                            `;

accountType.addEventListener('change', load);
load.bind(accountType)();
