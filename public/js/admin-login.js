function validateForm(event){
    event.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorMessage = document.getElementById('error-message');

            if (email === '' && password === '') {                
                errorMessage.textContent = 'Email and password cannot be empty.';
                return false;
            } else if (email === '') {
                errorMessage.textContent = 'Email cannot be empty.';
                return false;
            } else if (password === '') {
                errorMessage.textContent = 'Password cannot be empty.';
                return false;
            }

            // If no errors, submit the form
            document.getElementById('login-form').submit();
            // document.getElementById('login-form').reset();
        }

        