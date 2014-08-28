function nthOfType(e) {
	var n = 1, tagName = e.tagName
	while (e = previousElementOf(e)) {
		if (e.tagName === tagName) n++
	}
	return n
}