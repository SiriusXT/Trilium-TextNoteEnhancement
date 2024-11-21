
let resizeTimeout;
let ckBodyWrapper;
let inputElement;
const resizeObserver = new ResizeObserver(entries => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (width != 0 && height != 0) {
                inputElement.value += ".";
                inputElement.dispatchEvent(new Event("input"));
                inputElement.value = inputElement.value.slice(0, -1);
                inputElement.dispatchEvent(new Event("input"));
            }
        }
    }, 50);
});
var observer = new MutationObserver(function (mutationsList, observer) {
    for (var mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function (node) {
                // Check here to see if a new .ck.ck-input.ck-input-text element has been added
                if (node.nodeType === Node.ELEMENT_NODE && node.matches('.ck-math-form')) {
                    inputElement = node.querySelector("input.ck.ck-input.ck-input-text");
                    // Iterate through each selected input element
                    inputElement.style.display = "none";
                    if (node.querySelector("textarea.ck.ck-input.ck-input-text")) {
                        node.querySelector("textarea.ck.ck-input.ck-input-text").value = inputElement.value;
                        $("textarea.ck.ck-input.ck-input-text").focus();
                    }
                    else {
                        var textarea = document.createElement("textarea");
                        textarea.classList.add("ck", "ck-input", "ck-input-text");
                        // Set the initial value of textarea to the value of the input element
                        textarea.value = inputElement.value;
                        textarea.style.width = "99%"; // First set the height to auto to get the content height
                        textarea.style.height = '100px';

                        // Insert the textarea after the input element
                        inputElement.parentNode.insertBefore(textarea, inputElement.nextSibling);
                        textarea.focus();
                        // Add an event listener to monitor the value changes of textarea
                        textarea.addEventListener("input", function () {
                            // Assign the value of textarea to the corresponding input element
                            inputElement.value = textarea.value;
                            // Trigger the change event of the input element
                            inputElement.dispatchEvent(new Event("input"));
                        });
                        textarea.addEventListener("keydown", function (event) {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                ckBodyWrapper.querySelectorAll("button.ck.ck-button.ck-off.ck-button-save")[0].click();
                            }
                        });
                        resizeObserver.disconnect();
                        resizeObserver.observe(textarea);
                    }
                }
            });
        }
    }
});


let attempts = 0;
const maxAttempts = 100;
const intervalId = setInterval(() => {
    ckBodyWrapper = document.querySelector('.ck-body-wrapper');
    if (ckBodyWrapper != null || ++attempts > maxAttempts) {
        clearInterval(intervalId);
        if (ckBodyWrapper != null) {
            observer.observe(ckBodyWrapper, { attributes: false, childList: true, subtree: true })
        }
    }
}, 100); 