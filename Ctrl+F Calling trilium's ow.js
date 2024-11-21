document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault(); 
        event.stopPropagation(); 
        api.triggerEvent('findInText');
    }
}, true); 