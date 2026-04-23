let eyeicon = document.getElementById("eyeicon");
let password = document.getElementById("password");

eyeicon.onclick = function () {
  if (password.type === "password") {
    password.type = "text";
    eyeicon.src = "../Images/eye-open.png";
  } else {
    password.type = "password";
    eyeicon.src = "../Images/eye-close.png";
  }
};

let confirmPassword = document.getElementById("confirm-password");
let eyeicon2 = document.getElementById("eyeicon2");
eyeicon2.onclick = function () {
  if (confirmPassword.type === "password") {
    confirmPassword.type = "text";  
    eyeicon2.src = "../Images/eye-open.png";
    } else {
    confirmPassword.type = "password";
    eyeicon2.src = "../Images/eye-close.png";
  }
};
