export default (name) => {

    let message = `Hello, ${name}!`;

    document.body.innerHTML = '<div id="message">' + message + '</div>';
    console.log(message);

};