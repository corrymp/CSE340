const showBtn = document.querySelector('.show-pw');
const pwBox = document.getElementById('account_password');

showBtn.addEventListener('click', _ => ([showBtn.textContent, pwBox.type] = pwBox.getAttribute('type') === 'password' ? ['Hide', 'text'] : ['Show', 'password'], pwBox.focus()));
