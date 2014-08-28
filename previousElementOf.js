var previousElementOf
if (doc.documentElement.previousElementSibling !== undefined) {
	previousElementOf = function (e) {
		return e.previousElementSibling
	}
} else {
	previousElementOf = function (e) {
		while ((e = e.previousSibling) && e.nodeType !== 1);
		return e
	}
}