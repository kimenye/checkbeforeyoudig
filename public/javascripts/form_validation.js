function check(input) {
  if (input.value != document.getElementById('pass').value) {
    input.setCustomValidity('Passwords do not match.');
  } else {
    // input is valid -- reset the error message
    input.setCustomValidity('');
  }
}