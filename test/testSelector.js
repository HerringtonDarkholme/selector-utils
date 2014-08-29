var assert = require('assert')
var Selector = require('../Selector').Selector

assert(
	Selector('a').contains('a')
)
assert(
	Selector('*').contains('a')
)
assert(
	!Selector('a').contains('b')
)
assert(
	!Selector('a').contains('*')
)
assert(
	Selector('.x').contains('.x')
)
assert(
	Selector('.x').contains('a.x')
)
assert(
	Selector('.x').contains('*.x')
)
assert(
	Selector('.x').contains('.x.y')
)
assert(
	Selector('.x').contains('.y.x')
)
assert(
	!Selector('.x').contains('.y')
)
assert(
	!Selector('.x.y').contains('.y')
)
assert(
	!Selector('a.x').contains('.x')
)
assert(
	Selector('a#1').contains('a#1')
)
assert(
	Selector('a#1').contains('a.x.y#1')
)
assert(
	Selector('a.x#1').contains('a#1.x')
)
assert(
	!Selector('a.x#1.y').contains('a#1')
)
assert(
	Selector('[title]').contains('[title]')
)
assert(
	Selector('[title]').contains('a[title=hello]')
)
assert(
	Selector('[title^=h]').contains('a[title=hello]')
)
assert(
	Selector('[title$=o]').contains('a[title=hello]')
)
assert(
	Selector('[lang|=en]').contains('a[lang=en-US]')
)
assert(
	!Selector('[lang|=zh]').contains('a[lang=zht]')
)
assert(
	Selector(':nth-child(1)').contains(':nth-child(1)')
)
assert(
	Selector(':first-child').contains(':nth-child(1)')
)
assert(
	Selector(':nth-child(even)').contains(':nth-child(2n)')
)
/* todo: +
assert(
	Selector(':nth-child(odd)').contains(':nth-child(2n+1)')
)
*/
assert(
	Selector(':first-of-type').contains(':first-child')
)

assert(
	Selector(':nth-child(odd)').contains(':first-child')
)

assert(
	!Selector(':nth-child(even)').contains(':first-child')
)

assert(
	Selector(':nth-child(even)').contains(':nth-child(4n)')
)

assert(
	Selector(':nth-child(n)').contains(':nth-child(3n-1)')
)
/*
assert(
	Selector(':nth-child(n)').contains(':nth-child(-3n+1)')
)
*/
assert(
	!Selector(':nth-child(6-n)').contains(':nth-child(n)')
)
assert(
	Selector(':nth-child(n)').contains(':nth-child(8-n)')
)
assert(
	Selector(':nth-child(8-n)').contains(':nth-child(8-2n)')
)
assert(
	Selector(':nth-child(6-n)').contains(':nth-child(6-n)')
)

assert(
	Selector('div>a').contains('div>a')
)
assert(
	!Selector('div>a').contains('section>a')
)
assert(
	Selector('div a').contains('div>a')
)
assert(
	Selector('div * a').contains('div>div>a')
)
assert(
	Selector('section a').contains('section>div>a')
)
assert(
	Selector('body>section a').contains('body>section>div>a')
)
assert(
	Selector('*').contains('div#1>a:first-of-type>span:nth-of-type(3)')
)
assert(
	Selector('div#1 span').contains('div#1>a:first-of-type>span:nth-of-type(3)')
)
assert(
	!Selector('div#1 span:first-child').contains('div#1>a:first-of-type>span:nth-of-type(3)')
)

assert(
	Selector('div#1 span:nth-of-type(n)').contains('div#1>a:first-of-type>span:nth-of-type(3)')
)

assert(
	Selector('a:first-of-type').contains('span#1+a:first-child')
)
/*
assert(
	Selector('div a:first-of-type').contains('div>span#1+a:first-of-type')
)
*/