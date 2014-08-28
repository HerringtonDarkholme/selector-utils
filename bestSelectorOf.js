function bestSelectorOf(e) {
	var s

	// Some very old browsers may dispatch click event on text node,
	// and the browsers ALWAYS have bugs (eg. https://bugzilla.mozilla.org/show_bug.cgi?id=1014004).
	if (e.nodeType !== 1) s = '/*' + e.nodeName + '*/'

	else {
		s = e.tagName
		if (e.id) return s + '#' + e.id
		var prev = previousElementOf(e)
		if (!prev) {
			s += ':first-child'
		} else if (prev.id) {
			return prev.tagName + '#' + prev.id + '+' + s
		} else {
			var n = nthOfType(e)
			s += n === 1 ? ':first-of-type' : ':nth-of-type(' + n + ')'
		}
	}

	var p = e.parentNode
	if (!p || p.nodeType !==1 || p.tagName.toLowerCase() === 'body') return s

	return bestSelectorOf(p) + '>' + s
}