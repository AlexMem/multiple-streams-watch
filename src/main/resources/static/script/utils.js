function setAttribute(elementId, attribute, value) {
    document.getElementById(elementId)?.setAttribute(attribute, value);
}

function removeAttribute(elementId, attribute) {
    document.getElementById(elementId)?.removeAttribute(attribute);
}

function replaceTextInInnerHTML(elementId, searchValue, newValue) {
    let element = document.getElementById(elementId);
    element.innerHTML = element.innerHTML.replace(searchValue, newValue);
}

function replaceClass(element, oldClass, newClass) {
    element.classList.replace(oldClass, newClass);
}

function parseHashParams(params) {
    return params.replace("#", "")
                 .split("&")
                 .map(v => v.split("="))
                 .reduce((pre, [key, value]) => ({...pre, [key]: value}), {});
}

export {
    setAttribute, removeAttribute, replaceTextInInnerHTML, replaceClass, parseHashParams
};
