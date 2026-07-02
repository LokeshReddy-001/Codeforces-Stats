function trackUser(){
    const username = document.querySelector('.username').value;
    if(username === ""){
        showError("Please enter a username.");
        return;
    }
    window.location.href =
    `stats.html?user=${encodeURIComponent(username)}`;

}
function showError(message){
    const errorDiv =
        document.getElementById('error-message');

    errorDiv.textContent = message;

    errorDiv.style.display = "block";

    setTimeout(() => {
        errorDiv.style.display = "none";
        errorDiv.textContent = "";
    }, 3000);
}
const params = new URLSearchParams(window.location.search);
if (params.get('error') === "invalid") {
    showError("Enter a valid Codeforces username.");
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );
}