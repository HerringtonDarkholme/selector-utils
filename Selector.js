function trim(s) {
	return s.replace(/^\s+|\s+$/g, '')
}

function Selector(source) {
	var s = new SelectorList(Selector.normalize(source))
	return s.list.length === 1 ? s.list[0] : s
}
Selector.normalize = function (selector) {
	return selector.replace(/(\/\*.*?\*\/)|\\(?:([0-9a-fA-F]{1,6}\s)|([\/,\s>+~#.:\[])|.)/g,
		function (m, comment, hexDigits, specialChar, index) {
			if (comment) return ''
			var hex
			if (hexDigits) hex = hexDigits.slice(0, -1)
			else if (specialChar) hex = specialChar.charCodeAt(0).toString(16)
			else return m
				
			var nextChar = selector[index + m.length]
			if (/[0-9a-fA-F]/.test(nextChar)) return '\\' + ('00000' + hex).slice(-6)
			if (/\s/.test(nextChar)) return '\\' + hex + ' '
			return '\\' + hex
		})
}

function AbstractSelector(source) {
	//console.log(this.constructor.name, source)
	this.source = source
}
AbstractSelector.prototype.toSource = function toSource() {
	return this.source
}
AbstractSelector.prototype.contains = function contains(selector) {
	//console.log(selector.constructor.name)
	if (!(selector instanceof AbstractSelector)) selector = Selector(selector)
	if (!(selector instanceof this.constructor)) throw Error(selector.constructor.name + ' is not ' + this.constructor.name)
	return this.containsSelector(selector)
}

function SelectorList(source) {
	AbstractSelector.call(this, source)
	this.list = source.split(/,/).map(function (s) {
		return new ComplexSelector(s)
	})
}
SelectorList.prototype = Object.create(AbstractSelector.prototype)
SelectorList.prototype.constructor = SelectorList
SelectorList.prototype.toString = function () {
	return this.list.join(', ')
}
SelectorList.prototype.containsSelector = function (selector) {
	return this.list.some(function (s) { return s.contains(selector) })
}

function ComplexSelector(source) {
	if (Array.isArray(source)) {
		if (source.length === 0) throw new Error()
		AbstractSelector.call(this, source.join(''))
	} else {
		if (source.search(/,/) >= 0) throw new Error()
		AbstractSelector.call(this, source)	
		source = trim(source).split(/\s*([>+~])\s*|\s+/)
	}
	this.x = new CompoundSelector(source.pop())
	this.combinator = source.length > 0 ? source.pop() || ' ' : null
	this.xs = source.length > 0 ? new ComplexSelector(source) : null
}
ComplexSelector.prototype = Object.create(AbstractSelector.prototype)
ComplexSelector.prototype.constructor = ComplexSelector
ComplexSelector.prototype.toString = function () {
	return (this.xs || '') + (this.combinator ? ' ' + this.combinator + ' ' : '') + this.x
}
ComplexSelector.prototype.containsSelector = function (selector) {
	var r = this.x.contains(selector.x)
	if (!r) return r
	if (!this.combinator) return r
	if (this.combinator !== selector.combinator) {
		if (this.combinator === ' ' && selector.combinator === '>') {
			var xs = selector.xs
			while (true) {
				if (!xs) return null
				r = this.xs.contains(xs)
				if (r) return r
				var c
				do {
					c = xs.combinator
					if (!c) return null
					xs = xs.xs
					if (!xs) return null
				} while (!(c === ' ' || c === '>'))					
			}
		}
		return null	
	} 
	return !this.xs || this.xs.contains(selector.xs)
}

function CompoundSelector(source) {
	if (source.search(/[, >+~]/) >= 0) throw new Error()
	AbstractSelector.call(this, source)
	var a = source.split(/([#.:\[])/)
	this.type = new ElementalSelector(a[0])
	this.simpleSelectors = []
	for (var i = 1; i < a.length; i += 2) {
		this.simpleSelectors.push(new SimpleSelector(a[i], a[i + 1]))
	}
}
CompoundSelector.prototype = Object.create(AbstractSelector.prototype)
CompoundSelector.prototype.constructor = CompoundSelector
CompoundSelector.prototype.containsSelector = function (selector) {
	var r = this.type.contains(selector.type)
	if (!r) return r
	return this.simpleSelectors.every(function (s0) {
		return selector.simpleSelectors.some(function (s1) {
			//console.log(s0, s1, s0.constructor === s1.constructor, s0.constructor === s1.constructor ? s0.contains(s1) : null)
			return s0.constructor === s1.constructor && s0.contains(s1)
		})
	})
}

function SimpleSelector(x, xs) {
	switch (x) {
		case '#': return new IDSelector(xs)
		case '.': return new ClassSelector(xs)
		case ':': return new PsuedoClass(xs)
		case '[':
			if (xs[xs.length - 1] !== ']') throw new Error()
			return new AttributeSelector(xs.slice(0, -1))
		default: return new ElementalSelector(x)
	}

}

function IDSelector(id) {
	AbstractSelector.call(this, '#' + id)
	this.id = id
}
IDSelector.prototype = Object.create(AbstractSelector.prototype)
IDSelector.prototype.constructor = IDSelector
IDSelector.prototype.toString = function () { return '#' + this.id }
IDSelector.prototype.containsSelector = function (selector) {
	return this.id === selector.id
}

function ClassSelector(cls) {
	AbstractSelector.call(this, '.' + cls)
	this.cls = cls
}
ClassSelector.prototype = Object.create(AbstractSelector.prototype)
ClassSelector.prototype.constructor = ClassSelector
ClassSelector.prototype.toString = function () { return '.' + this.cls }
ClassSelector.prototype.containsSelector = function (selector) {
	return this.cls === selector.cls
}

function AttributeSelector(source) {
	var m = /^(.*?)(?:([~|^$*]?=)(["']?)(.*)\3)?$/.exec(source)
	if (!m) throw new Error()
	AbstractSelector.call(this, '[' + source + ']')
	this.attr = m[1]
	this.rel = m[2]
	this.val = m[4]
}
AttributeSelector.prototype = Object.create(AbstractSelector.prototype)
AttributeSelector.prototype.constructor = AttributeSelector
AttributeSelector.prototype.toString = function () {
	var s = '[' + this.attr
	if (this.rel) s += this.rel + JSON.stringify(this.val)
	s += ']'
	return s
}
AttributeSelector.prototype.containsSelector = function (selector) {
	if (this.attr !== selector.attr) return false
	if (this.rel === selector.rel && this.val === selector.val) return true
	switch (this.rel) {
		case undefined: return true
		case '~=':
			return selector.rel === '=' && selector.val.split(/\s+/).indexOf(this.val) >= 0 ||
				selector.rel === '^=' && selector.val.split(/\s+/).slice(0, -1).indexOf(this.val) >= 0 ||
				selector.rel === '$=' && selector.val.split(/\s+/).slice(1).indexOf(this.val) >= 0 ||
				selector.rel === '*=' && selector.val.split(/\s+/).slice(1, -1).indexOf(this.val) >= 0
		case '|=':
			return selector.rel === '=' && (selector.val === this.val || selector.val.slice(0, this.val.length + 1) === this.val + '-') ||
				selector.rel === '^=' && selector.val.slice(0, this.val.length + 1) === this.val + '-'
		case '^=':
			return this.val &&
				(selector.rel === '=' || selector.rel === '|=' || selector.rel === '^=') && 
				selector.val.slice(0, this.val.length) === this.val
		case '$=':
			return this.val && 
				(selector.rel === '=' || selector.rel === '$=') && 
				selector.val.slice(-this.val.length) === this.val
		case '*=':
			return this.val && selector.val.indexOf(this.val) >= 0
		default: return false
	}
}

function ElementalSelector(name) {
	AbstractSelector.call(this, name)
	this.name = name || '*'
}
ElementalSelector.prototype = Object.create(AbstractSelector.prototype)
ElementalSelector.prototype.constructor = ElementalSelector
ElementalSelector.prototype.isUniversal = function () { return this.name === '*' }
ElementalSelector.prototype.toString = function () { return this.name }
ElementalSelector.prototype.containsSelector  = function (selector) {
	return this.isUniversal() || this.name === selector.name
}

function NthPC(pc, source) {
	if (source === undefined) {
		this.a = 0
		this.b = 1
	} else if (source === 'even') {
		this.a = 2
		this.b = 0
	} else if (source === 'odd') {
		this.a = 2
		this.b = 1
	} else {
		// read a integer
		var m = /^([+-]?\d+)/.exec(source)
		if (m) {
			var i = m[1].length
			if (source.length <= i) { // only `b`
				this.a = 0
				this.b = parseInt(m[1], 10)
			} else {
				var nextChar = source[i]
				if (nextChar === 'n') { // `an+b`
					this.a = parseInt(m[1], 10)
					m = /^([+-]\d+)?$/.exec(source.slice(i + 1))
					if (!m) throw new Error(source)
					this.b = m[1] === undefined ? 0 : parseInt(m[1], 10)
				} else { // `b+an`
					this.b = parseInt(m[1], 10)
					m = /^(?:([+-]\d*)n)?$/.exec(source.slice(i))
					if (!m) throw new Error(source)
					switch (m[1]) {
						case undefined: this.a = 0; break
						case '+': this.a = 1; break
						case '-': this.a = -1; break
						default: this.a = parseInt(m[1], 10)
					}
				}
			}
		} else { // not start with a integer
			m = /^([+-]?)n([+-]\d+)?$/.exec(source)
			if (!m) throw new Error(source)
			this.a = m[1] === '-' ? -1 : 1
			this.b = m[2] === undefined ? 0 : parseInt(m[2], 10)
		}
	}
	this.last = /\blast-/.test(pc)
	this.child = /-child$/.test(pc)
	var s = ':' + pc
	if (source !== undefined) s += '(' + source + ')'
	AbstractSelector.call(this, s)
}
NthPC.prototype = Object.create(AbstractSelector.prototype)
NthPC.prototype.constructor = NthPC
NthPC.prototype.containsSelector = function (selector) {
	if (this.last !== selector.last) return false
	if (this.child === selector.child) {
		//console.log(this, selector)
		if (selector.a === 0) {
			if (this.a === 0) return selector.b === this.b
			var na = selector.b - this.b
			return na === 0 ||
				na % this.a === 0 && /* n >= 0 */
				(na > 0 && this.a > 0 || na < 0 && this.a < 0)
		}
		if (selector.a > 0) {
			if (this.a <= 0 || selector.a % this.a !== 0) return false
			var na = selector.b - this.b
			//console.log(na % selector.a, na, selector.a)
			return na % this.a === 0
		}
		var a = []
		for (var e = selector.b; e > 0; e += selector.a) a.push(e)
		return a.every(function (e) {
			var na = e - this.b
			return na === 0 ||
				na % this.a === 0 && /* n >= 0 */
				(na > 0 && this.a > 0 || na < 0 && this.a < 0)
		}.bind(this))
	}
	return selector.child && this.a === 0 && this.b === 1 && selector.a === 0 && selector.b === 1
}

function NthChildPC(source) { NthPC.call(this, 'nth-child', source) }
NthChildPC.prototype = Object.create(NthPC.prototype)

function NthOfTypePC(source) { NthPC.call(this, 'nth-of-type', source) }
NthOfTypePC.prototype = Object.create(NthPC.prototype)

function NthLastChildPC(source) { NthPC.call(this, 'nth-last-child', source) }
NthLastChildPC.prototype = Object.create(NthPC.prototype)

function NthLastOfTypePC(source) { NthPC.call(this, 'nth-last-of-type', source) }
NthLastOfTypePC.prototype = Object.create(NthPC.prototype)

function PsuedoClass(source) {
	var a = /^(.+?)(?:\((.*?)\))?$/.exec(source)
	if (!a) throw new Error()
	var pc = PsuedoClass[a[1]]
	if (!pc) throw new Error(source)
	if (typeof pc === 'function') return new pc(a[2])
	return pc
}
PsuedoClass['nth-child'] = NthChildPC
PsuedoClass['nth-of-type'] = NthOfTypePC
PsuedoClass['first-child'] = new NthPC('first-child')
PsuedoClass['first-of-type'] = new NthPC('first-of-type')
PsuedoClass['last-child'] = new NthPC('last-child')
PsuedoClass['last-of-type'] = new NthPC('last-of-type')

if (typeof exports === 'object') exports.Selector = Selector
