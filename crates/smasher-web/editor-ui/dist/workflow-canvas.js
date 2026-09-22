//#region node_modules/svelte/src/internal/disclose-version.js
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add("5");
//#endregion
//#region node_modules/svelte/src/constants.js
var e = {}, t = Symbol("uninitialized"), n = "http://www.w3.org/1999/xhtml", r = Array.isArray, i = Array.prototype.indexOf, a = Array.prototype.includes, o = Array.from, s = Object.keys, c = Object.defineProperty, l = Object.getOwnPropertyDescriptor, u = Object.getOwnPropertyDescriptors, d = Object.prototype, f = Array.prototype, p = Object.getPrototypeOf, m = Object.isExtensible;
function h(e) {
	return typeof e == "function";
}
var g = () => {};
function _(e) {
	return e();
}
function v(e) {
	for (var t = 0; t < e.length; t++) e[t]();
}
function y() {
	var e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
function b(e, t, n = !1) {
	return e === void 0 ? n ? t() : t : e;
}
function x(e, t) {
	if (Array.isArray(e)) return e;
	if (t === void 0 || !(Symbol.iterator in e)) return Array.from(e);
	let n = [];
	for (let r of e) if (n.push(r), n.length === t) break;
	return n;
}
function S(e, t) {
	var n = {};
	for (var r in e) t.includes(r) || (n[r] = e[r]);
	for (var i of Object.getOwnPropertySymbols(e)) Object.propertyIsEnumerable.call(e, i) && !t.includes(i) && (n[i] = e[i]);
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/constants.js
var C = 1 << 24, w = 1024, T = 2048, E = 4096, D = 8192, ee = 16384, te = 32768, ne = 1 << 25, re = 65536, ie = 1 << 19, ae = 1 << 20, O = 1 << 25, k = 1 << 21, oe = 1 << 22, se = 1 << 23, ce = Symbol("$state"), le = Symbol("component"), ue = Symbol("legacy props"), de = Symbol(""), fe = Symbol("attributes"), pe = Symbol("class"), me = Symbol("style"), he = Symbol("text"), ge = Symbol("form reset"), _e = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), ve = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml");
function ye() {
	console.warn("https://svelte.dev/e/derived_inert");
}
function be(e) {
	console.warn("https://svelte.dev/e/hydration_mismatch");
}
function xe() {
	console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Se() {
	console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/hydration.js
var A = !1;
function Ce(e) {
	A = e;
}
var j;
function we(t) {
	if (t === null) throw be(), e;
	return j = t;
}
function Te() {
	return we(/* @__PURE__ */ _n(j));
}
function M(t) {
	if (A) {
		if (/* @__PURE__ */ _n(j) !== null) throw be(), e;
		j = t;
	}
}
function Ee(e = 1) {
	if (A) {
		for (var t = e, n = j; t--;) n = /* @__PURE__ */ _n(n);
		j = n;
	}
}
function De(e = !0) {
	for (var t = 0, n = j;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ _n(n);
		e && n.remove(), n = i;
	}
}
function Oe(t) {
	if (!t || t.nodeType !== 8) throw be(), e;
	return t.data;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/equality.js
function ke(e) {
	return e === this.v;
}
function Ae(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function je(e) {
	return !Ae(e, this.v);
}
function Me(e) {
	throw Error("https://svelte.dev/e/lifecycle_outside_component");
}
//#endregion
//#region node_modules/svelte/src/internal/client/errors.js
function Ne() {
	throw Error("https://svelte.dev/e/async_derived_orphan");
}
function Pe(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_duplicate");
}
function Fe(e) {
	throw Error("https://svelte.dev/e/effect_in_teardown");
}
function Ie() {
	throw Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Le(e) {
	throw Error("https://svelte.dev/e/effect_orphan");
}
function Re() {
	throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function ze() {
	throw Error("https://svelte.dev/e/hydration_failed");
}
function Be(e) {
	throw Error("https://svelte.dev/e/props_invalid_value");
}
function Ve() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function He() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function Ue() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function We() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
//#endregion
//#region node_modules/svelte/src/internal/flags/index.js
var Ge = !1;
function Ke() {
	Ge = !0;
}
//#endregion
//#region node_modules/svelte/src/internal/shared/clone.js
var qe = [];
function Je(e, t = !1, n = !1) {
	return Ye(e, /* @__PURE__ */ new Map(), "", qe, null, n);
}
function Ye(e, t, n, i, a = null, o = !1) {
	if (typeof e == "object" && e) {
		var s = t.get(e);
		if (s !== void 0) return s;
		if (e instanceof Map) return new Map(e);
		if (e instanceof Set) return new Set(e);
		if (r(e)) {
			var c = Array(e.length);
			t.set(e, c), a !== null && t.set(a, c);
			for (var l = 0; l < e.length; l += 1) {
				var u = e[l];
				l in e && (c[l] = Ye(u, t, n, i, null, o));
			}
			return c;
		}
		if (p(e) === d) {
			c = {}, t.set(e, c), a !== null && t.set(a, c);
			for (var f of Object.keys(e)) c[f] = Ye(e[f], t, n, i, null, o);
			return c;
		}
		if (e instanceof Date) return e.getTime(), structuredClone(e);
		if (typeof e.toJSON == "function" && !o) return Ye(e.toJSON(), t, n, i, e);
	}
	if (e instanceof EventTarget) return e;
	try {
		return structuredClone(e);
	} catch {
		return e;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/shared/context.js
function Xe(e) {
	let t = e.p;
	for (; t !== null && t.c === null;) t = t.p;
	return t?.c ?? null;
}
function Ze(e, t) {
	return e === null && Me(t), e.c ??= new Map(Xe(e) || void 0);
}
//#endregion
//#region node_modules/svelte/src/internal/client/context.js
var Qe = null;
function $e(e) {
	Qe = e;
}
function et(e) {
	return Ze(Qe, "getContext").get(e);
}
function tt(e, t) {
	return Ze(Qe, "setContext").set(e, t), t;
}
function nt(e) {
	return Ze(Qe, "hasContext").has(e);
}
function N(e, t = !1, n) {
	Qe = {
		p: Qe,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: G,
		l: Ge && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	};
}
function P(e) {
	var t = Qe, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) jn(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, Qe = t.p, rt(e);
}
function rt(e = {}) {
	return c(e, le, { value: !0 }), e;
}
function it() {
	return !Ge || Qe !== null && Qe.l === null;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/task.js
var at = [];
function ot() {
	var e = at;
	at = [], v(e);
}
function st(e) {
	if (at.length === 0 && !It) {
		var t = at;
		queueMicrotask(() => {
			t === at && ot();
		});
	}
	at.push(e);
}
function ct() {
	for (; at.length > 0;) ot();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/status.js
var lt = ~(T | E | w);
function ut(e, t) {
	e.f = e.f & lt | t;
}
function dt(e) {
	e.f & 512 || e.deps === null ? ut(e, w) : ut(e, E);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/utils.js
function ft(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), ut(e, w);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/misc.js
function pt(e, t) {
	if (t) {
		let t = document.body;
		e.autofocus = !0, st(() => {
			document.activeElement === t && e.focus();
		});
	}
}
function mt(e) {
	A && /* @__PURE__ */ gn(e) !== null && yn(e);
}
var ht = !1;
function gt() {
	ht || (ht = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[ge]?.();
		});
	}, { capture: !0 }));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function _t(e) {
	var t = W, n = G;
	rr(null), ir(null);
	try {
		return e();
	} finally {
		rr(t), ir(n);
	}
}
function vt(e, t, n, r = n) {
	e.addEventListener(t, () => _t(n));
	let i = e[ge];
	e[ge] = i ? () => {
		i(), r(!0);
	} : () => r(!0), gt();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/async.js
function yt(e, t, n, r) {
	let i = it() ? Ct : Et;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = G, c = bt(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				wn(e, s);
			}
			xt();
		}
	}
	var d = St();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ Tt(e))).then(u).catch((e) => wn(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), xt();
	}) : f();
}
function bt() {
	var e = G, t = W, n = Qe, r = I;
	return function(i = !0) {
		ir(e), rr(t), $e(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function xt(e = !0) {
	ir(null), rr(null), $e(null), e && I?.deactivate();
}
function St() {
	var e = G, t = e.b, n = I, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Ct(e) {
	var n = 2 | T;
	return G !== null && (G.f |= ie), {
		ctx: Qe,
		deps: null,
		effects: null,
		equals: ke,
		f: n,
		fn: e,
		reactions: null,
		rv: 0,
		v: t,
		wv: 0,
		parent: G,
		ac: null
	};
}
var wt = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function Tt(e, n, r) {
	let i = G;
	i === null && Ne();
	var a = void 0, o = Qt(t), s = !W, c = /* @__PURE__ */ new Set();
	return In(() => {
		var t = G, n = y();
		a = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== _e && n.reject(e);
			}).finally(xt);
		} catch (e) {
			n.reject(e), xt();
		}
		var r = I;
		if (s) {
			if (t.f & 32768) var l = St();
			if (i.b?.is_rendered()) r.async_deriveds.get(t)?.reject(wt);
			else for (let e of c.values()) e.reject(wt);
			c.add(n), r.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), c.delete(n), t !== wt && (r.activate(), t ? (o.f |= se, nn(o, t)) : (o.f & 8388608 && (o.f ^= se), nn(o, e)), r.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), kn(() => {
		for (let e of c) e.reject(wt);
	}), new Promise((e) => {
		function t(n) {
			function r() {
				n === a ? e(o) : t(a);
			}
			n.then(r, r);
		}
		t(a);
	});
}
/*#__NO_SIDE_EFFECTS__*/
function F(e) {
	let t = /* @__PURE__ */ Ct(e);
	return or(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function Et(e) {
	let t = /* @__PURE__ */ Ct(e);
	return t.equals = je, t;
}
function Dt(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) Wn(t[n]);
	}
}
function Ot(e) {
	var n, r = G, i = e.parent;
	if (!er && i !== null && e.v !== t && i.f & 24576) return ye(), e.v;
	ir(i);
	try {
		Dt(e), n = vr(e);
	} finally {
		ir(r);
	}
	return n;
}
function kt(e) {
	var t = Ot(e);
	if (!e.equals(t) && (e.wv = hr(), (!I?.is_fork || e.deps === null) && (I === null ? e.v = t : (I.capture(e, t, !0), Nt?.capture(e, t, !0)), e.deps === null))) {
		ut(e, w);
		return;
	}
	er || (Pt === null ? dt(e) : (On() || I?.is_fork) && Pt.set(e, t));
}
function At(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && _t(() => {
		t.ac.abort(_e), t.ac = null;
	}), t.fn !== null && (t.teardown = g), xr(t, 0), Hn(t));
}
function jt(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && Sr(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/batch.js
var Mt = null, I = null, Nt = null, Pt = null, Ft = null, It = !1, Lt = !1, Rt = null, zt = null, Bt = 0, Vt = 1, Ht = class e {
	id = Vt++;
	#e = !1;
	linked = !0;
	#t = null;
	#n = null;
	async_deriveds = /* @__PURE__ */ new Map();
	current = /* @__PURE__ */ new Map();
	previous = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = /* @__PURE__ */ new Set();
	#a = 0;
	#o = /* @__PURE__ */ new Map();
	#s = null;
	#c = [];
	#l = [];
	#u = /* @__PURE__ */ new Set();
	#d = /* @__PURE__ */ new Set();
	#f = /* @__PURE__ */ new Map();
	#p = /* @__PURE__ */ new Set();
	is_fork = !1;
	#m = !1;
	constructor() {
		Mt === null ? Mt = this : (Mt.#n = this, this.#t = Mt), Mt = this;
	}
	#h() {
		if (this.is_fork) return !0;
		for (let n of this.#o.keys()) {
			for (var e = n, t = !1; e.parent !== null;) {
				if (this.#f.has(e)) {
					t = !0;
					break;
				}
				e = e.parent;
			}
			if (!t) return !0;
		}
		return !1;
	}
	skip_effect(e) {
		this.#f.has(e) || this.#f.set(e, {
			d: [],
			m: []
		}), this.#p.delete(e);
	}
	unskip_effect(e, t = (e) => this.schedule(e)) {
		var n = this.#f.get(e);
		if (n) {
			this.#f.delete(e);
			for (var r of n.d) ut(r, T), t(r);
			for (r of n.m) ut(r, E), t(r);
		}
		this.#p.add(e);
	}
	#g() {
		var e = [];
		for (let i of this.#c) if (!(i.f & 16384 || !(i.f & 6144))) {
			for (var t = i, n = !1; t.parent !== null;) {
				t = t.parent;
				var r = t.f;
				if (r & 96) {
					if (!(r & 1024)) {
						n = !0;
						break;
					}
					t.f ^= w;
				}
			}
			n || e.push(t);
		}
		return this.#c = [], e;
	}
	#_() {
		this.#e = !0;
		for (let e of this.#u) this.#d.delete(e), ut(e, T), this.schedule(e);
		for (let e of this.#d) ut(e, E), this.schedule(e);
		this.apply();
		for (var t = Rt = [], n = [], r = zt = []; this.#c.length > 0;) {
			Bt++ > 1e3 && (this.#S(), Ut());
			for (let e of this.#g()) try {
				this.#v(e, t, n);
			} catch (t) {
				throw Jt(e), this.#h() || this.discard(), t;
			}
		}
		if (I = null, r.length > 0) {
			var i = e.ensure();
			for (let e of r) i.schedule(e);
		}
		if (Rt = null, zt = null, this.#h()) {
			this.#x(n), this.#x(t);
			for (let [e, t] of this.#f) qt(e, t);
			r.length > 0 && I.#_();
			return;
		}
		let a = this.#y();
		if (a) {
			this.#x(n), this.#x(t), a.#b(this);
			return;
		}
		this.#u.clear(), this.#d.clear();
		for (let e of this.#r) e(this);
		this.#r.clear(), Nt = this, Gt(n), Gt(t), Nt = null, this.#s?.resolve();
		var o = I;
		if (this.#a === 0 && (this.#c.length === 0 || o !== null) && this.#S(), this.#c.length > 0) {
			if (o !== null) {
				for (let e of this.#c) o.#c.push(e);
				this.#c = [];
			} else o = this;
		}
		o !== null && (Xt.clear(), o.#_());
	}
	#v(e, t, n) {
		e.f ^= w;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = !!(i & 96);
			if (!(a && i & 1024 || i & 8192 || this.#f.has(r)) && r.fn !== null) {
				a ? r.f ^= w : i & 4 ? t.push(r) : gr(r) && (i & 16 && this.#d.add(r), Sr(r));
				var o = r.first;
				if (o !== null) {
					r = o;
					continue;
				}
			}
			for (; r !== null;) {
				var s = r.next;
				if (s !== null) {
					r = s;
					break;
				}
				r = r.parent;
			}
		}
	}
	#y() {
		for (var e = this.#t; e !== null;) {
			if (!e.is_fork) {
				for (let [t, [, n]] of this.current) if (e.current.has(t) && !n) return e;
			}
			e = e.#t;
		}
		return null;
	}
	#b(e) {
		for (let [t, n] of e.current) !this.previous.has(t) && e.previous.has(t) && this.previous.set(t, e.previous.get(t)), this.current.set(t, n);
		for (let [t, n] of e.async_deriveds) {
			let e = this.async_deriveds.get(t);
			e && n.promise.then(e.resolve).catch(e.reject);
		}
		e.async_deriveds.clear(), this.transfer_effects(e.#u, e.#d);
		let t = (e) => {
			var n = e.reactions;
			if (n !== null && !(e.f & 2 && !(e.f & 6144))) for (let e of n) {
				var r = e.f;
				if (r & 2) t(e);
				else {
					var i = e;
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), ut(i, T), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#S(), I = this, this.#_();
	}
	#x(e) {
		for (var t = 0; t < e.length; t += 1) ft(e[t], this.#u, this.#d);
	}
	capture(e, n, r = !1) {
		e.v !== t && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [n, r]), Pt?.set(e, n)), this.is_fork || (e.v = n);
	}
	activate() {
		I = this;
	}
	deactivate() {
		I = null, Pt = null;
	}
	flush() {
		try {
			Lt = !0, I = this, this.#_();
		} finally {
			Bt = 0, Ft = null, Rt = null, zt = null, Lt = !1, I = null, Pt = null, Xt.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(wt);
		this.#S(), this.#s?.resolve();
	}
	register_created_effect(e) {
		this.#l.push(e);
	}
	increment(e, t) {
		if (this.#a += 1, e) {
			let e = this.#o.get(t) ?? 0;
			this.#o.set(t, e + 1);
		}
	}
	decrement(e, t) {
		if (--this.#a, e) {
			let e = this.#o.get(t) ?? 0;
			e === 1 ? this.#o.delete(t) : this.#o.set(t, e - 1);
		}
		this.#m || (this.#m = !0, st(() => {
			this.#m = !1, this.linked && this.flush();
		}));
	}
	transfer_effects(e, t) {
		for (let t of e) this.#u.add(t);
		for (let e of t) this.#d.add(e);
		e.clear(), t.clear();
	}
	oncommit(e) {
		this.#r.add(e);
	}
	ondiscard(e) {
		this.#i.add(e);
	}
	settled() {
		return (this.#s ??= y()).promise;
	}
	static ensure() {
		if (I === null) {
			let t = I = new e();
			!Lt && !It && st(() => {
				t.#e || t.flush();
			});
		}
		return I;
	}
	apply() {
		Pt = null;
	}
	schedule(e) {
		if (Ft = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) {
			e.b.defer_effect(e);
			return;
		}
		this.#c.push(e);
	}
	#S() {
		if (this.linked) {
			var e = this.#t, t = this.#n;
			e === null || (e.#n = t), t === null ? Mt = e : t.#t = e, this.linked = !1;
		}
	}
};
function L(e) {
	var t = It;
	It = !0;
	try {
		var n;
		for (e && (I !== null && !I.is_fork && I.flush(), n = e());;) {
			if (ct(), I === null) return n;
			I.flush();
		}
	} finally {
		It = t;
	}
}
function Ut() {
	try {
		Re();
	} catch (e) {
		wn(e, Ft);
	}
}
var Wt = null;
function Gt(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && gr(r) && (Wt = /* @__PURE__ */ new Set(), Sr(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Kn(r), Wt?.size > 0)) {
				Xt.clear();
				for (let e of Wt) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) Wt.has(n) && (Wt.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || Sr(n);
					}
				}
				Wt.clear();
			}
		}
		Wt = null;
	}
}
function Kt(e) {
	I.schedule(e);
}
function qt(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), ut(e, w);
		for (var n = e.first; n !== null;) qt(n, t), n = n.next;
	}
}
function Jt(e) {
	ut(e, w);
	for (var t = e.first; t !== null;) Jt(t), t = t.next;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/sources.js
var Yt = /* @__PURE__ */ new Set(), Xt = /* @__PURE__ */ new Map(), Zt = !1;
function Qt(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: ke,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function R(e, t) {
	let n = Qt(e, t);
	return or(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function $t(e, t = !1, n = !0) {
	let r = Qt(e);
	return t || (r.equals = je), Ge && n && Qe !== null && Qe.l !== null && (Qe.l.s ??= []).push(r), r;
}
function z(e, t, n = !1) {
	return W !== null && (!nr || W.f & 131072) && it() && W.f & 4325394 && (ar === null || !ar.has(e)) && Ue(), nn(e, n ? sn(t) : t, zt);
}
var en = null, tn = 0;
function nn(e, t, n = null) {
	if (!e.equals(t)) {
		er ? Xt.set(e, t) : Xt.has(e) || Xt.set(e, e.v);
		var r = Ht.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && Ot(t), Pt === null && dt(t);
		}
		e.wv = hr(), en = null, tn = 0, on(e, T, n), en = null, it() && G !== null && G.f & 1024 && !(G.f & 96) && (lr === null ? ur([e]) : lr.push(e)), !r.is_fork && Yt.size > 0 && !Zt && rn();
	}
	return t;
}
function rn() {
	Zt = !1;
	for (let e of Yt) {
		e.f & 1024 && ut(e, E);
		let t;
		try {
			t = gr(e);
		} catch {
			t = !0;
		}
		t && Sr(e);
	}
	Yt.clear();
}
function an(e) {
	z(e, e.v + 1);
}
function on(e, t, n) {
	var r = e.reactions;
	if (r !== null) {
		var i = it(), a = r.length;
		if (tn += a, tn > 1e5 && en === null && (en = /* @__PURE__ */ new Set()), en !== null) {
			if (en.has(e)) return;
			en.add(e);
		}
		for (var o = 0; o < a; o++) {
			var s = r[o], c = s.f;
			if (i || s !== G) {
				var l = (c & T) === 0;
				if (l && ut(s, t), c & 131072) Yt.add(s);
				else if (c & 2) {
					var u = s;
					Pt?.delete(u), on(u, E, n);
				} else if (l) {
					var d = s;
					c & 16 && Wt !== null && Wt.add(d), n === null ? Kt(d) : n.push(d);
				}
			}
		}
	}
}
function sn(e) {
	if (typeof e != "object" || !e || ce in e || le in e) return e;
	let n = p(e);
	if (n !== d && n !== f) return e;
	var i = /* @__PURE__ */ new Map(), a = r(e), o = /* @__PURE__ */ R(0), s = null, c = pr, u = (e) => {
		if (pr === c) return e();
		var t = W, n = pr;
		rr(null), mr(c);
		var r = e();
		return rr(t), mr(n), r;
	};
	return a && i.set("length", /* @__PURE__ */ R(e.length, s)), new Proxy(e, {
		defineProperty(e, t, n) {
			(!("value" in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) && Ve();
			var r = i.get(t);
			return r === void 0 ? u(() => {
				var e = /* @__PURE__ */ R(n.value, s);
				return i.set(t, e), e;
			}) : z(r, n.value, !0), !0;
		},
		deleteProperty(e, n) {
			var r = i.get(n);
			if (r === void 0) {
				if (n in e) {
					let e = u(() => /* @__PURE__ */ R(t, s));
					i.set(n, e), an(o);
				}
			} else z(r, t), an(o);
			return !0;
		},
		get(n, r, a) {
			if (r === ce) return e;
			var o = i.get(r), c = r in n;
			if (o === void 0 && (!c || l(n, r)?.writable) && (o = u(() => /* @__PURE__ */ R(sn(c ? n[r] : t), s)), i.set(r, o)), o !== void 0) {
				var d = K(o);
				return d === t ? void 0 : d;
			}
			return Reflect.get(n, r, a);
		},
		getOwnPropertyDescriptor(e, n) {
			this.has?.(e, n);
			var r = Reflect.getOwnPropertyDescriptor(e, n), a = i.get(n);
			if (a !== void 0) {
				var o = K(a);
				if (o === t) return;
				if (r && "value" in r) r.value = o;
				else return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return r;
		},
		has(e, n) {
			if (n === ce) return !0;
			var r = i.get(n), a = r !== void 0 && r.v !== t || Reflect.has(e, n);
			return (r !== void 0 || G !== null && (!a || l(e, n)?.writable)) && (r === void 0 && (r = u(() => /* @__PURE__ */ R(a ? sn(e[n]) : t, s)), i.set(n, r)), K(r) === t) ? !1 : a;
		},
		set(e, n, r, c) {
			var d = i.get(n), f = n in e;
			if (a && n === "length") for (var p = r; p < d.v; p += 1) {
				var m = i.get(p + "");
				m === void 0 ? p in e && (m = u(() => /* @__PURE__ */ R(t, s)), i.set(p + "", m)) : z(m, t);
			}
			if (d === void 0) (!f || l(e, n)?.writable) && (d = u(() => /* @__PURE__ */ R(void 0, s)), z(d, sn(r)), i.set(n, d));
			else {
				f = d.v !== t;
				var h = u(() => sn(r));
				z(d, h);
			}
			var g = Reflect.getOwnPropertyDescriptor(e, n);
			if (g?.set && g.set.call(c, r), !f) {
				if (a && typeof n == "string") {
					var _ = i.get("length"), v = Number(n);
					Number.isInteger(v) && v >= _.v && z(_, v + 1);
				}
				an(o);
			}
			return !0;
		},
		ownKeys(e) {
			K(o);
			var n = Reflect.ownKeys(e).filter((e) => {
				var n = i.get(e);
				return n === void 0 || n.v !== t;
			});
			for (var [r, a] of i) a.v !== t && !(r in e) && n.push(r);
			return n;
		},
		setPrototypeOf() {
			He();
		}
	});
}
function cn(e) {
	try {
		if (typeof e == "object" && e && ce in e) return e[ce];
	} catch {}
	return e;
}
function ln(e, t) {
	return Object.is(cn(e), cn(t));
}
var un, dn, fn, pn;
function mn() {
	if (un === void 0) {
		un = window, dn = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		fn = l(t, "firstChild").get, pn = l(t, "nextSibling").get, m(e) && (e[pe] = void 0, e[fe] = null, e[me] = void 0, e.__e = void 0), m(n) && (n[he] = void 0);
	}
}
function hn(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function gn(e) {
	return fn.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function _n(e) {
	return pn.call(e);
}
function B(e, t) {
	if (!A) return /* @__PURE__ */ gn(e);
	var n = /* @__PURE__ */ gn(j);
	if (n === null) n = j.appendChild(hn());
	else if (t && n.nodeType !== 3) {
		var r = hn();
		return n?.before(r), we(r), r;
	}
	return t && Sn(n), we(n), n;
}
function V(e, t = !1) {
	if (!A) {
		var n = /* @__PURE__ */ gn(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ _n(n) : n;
	}
	if (t) {
		if (j?.nodeType !== 3) {
			var r = hn();
			return j?.before(r), we(r), r;
		}
		Sn(j);
	}
	return j;
}
function vn(e, t = !1) {
	if (!A) return /* @__PURE__ */ gn(e);
	var n = B(e, t);
	return M(e), n;
}
function H(e, t = 1, n = !1) {
	let r = A ? j : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ _n(r);
	if (!A) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = hn();
			return r === null ? i?.after(a) : r.before(a), we(a), a;
		}
		Sn(r);
	}
	return we(r), r;
}
function yn(e) {
	e.textContent = "";
}
function bn() {
	return !1;
}
function xn(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function Sn(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
function Cn(e) {
	var t = G;
	if (t === null) return W.f |= se, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	wn(e, t);
}
function wn(e, t) {
	if (!(t !== null && t.f & 16384)) {
		for (; t !== null;) {
			if (t.f & 128 && !(t.f & 33570816)) {
				if (!(t.f & 32768)) throw e;
				try {
					t.b.error(e);
					return;
				} catch (t) {
					e = t;
				}
			}
			t = t.parent;
		}
		throw e;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/effects.js
function Tn(e) {
	G === null && (W === null && Le(e), Ie()), er && Fe(e);
}
function En(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Dn(e, t) {
	var n = G;
	n !== null && n.f & 8192 && (e |= D);
	var r = {
		ctx: Qe,
		deps: null,
		nodes: null,
		f: e | T | 512,
		first: null,
		fn: t,
		last: null,
		next: null,
		parent: n,
		b: n && n.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	I?.register_created_effect(r);
	var i = r;
	if (e & 4) Rt === null ? Ht.ensure().schedule(r) : Rt.push(r);
	else if (t !== null) {
		try {
			Sr(r);
		} catch (e) {
			throw Wn(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= re));
	}
	if (i !== null && (i.parent = n, n !== null && En(i, n), W !== null && W.f & 2 && !(e & 64))) {
		var a = W;
		(a.effects ??= []).push(i);
	}
	return r;
}
function On() {
	return W !== null && !nr;
}
function kn(e) {
	let t = Dn(8, null);
	return ut(t, w), t.teardown = e, t;
}
function An(e) {
	Tn("$effect");
	var t = G.f;
	if (!W && t & 32 && Qe !== null && !Qe.i) {
		var n = Qe;
		(n.e ??= []).push(e);
	} else return jn(e);
}
function jn(e) {
	return Dn(4 | ae, e);
}
function Mn(e) {
	return Tn("$effect.pre"), Dn(8 | ae, e);
}
function Nn(e) {
	Ht.ensure();
	let t = Dn(64 | ie, e);
	return () => {
		Wn(t);
	};
}
function Pn(e) {
	Ht.ensure();
	let t = Dn(64 | ie, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? qn(t, () => {
			Wn(t), n(void 0);
		}) : (Wn(t), n(void 0));
	});
}
function Fn(e) {
	return Dn(4, e);
}
function In(e) {
	return Dn(oe | ie, e);
}
function Ln(e, t = 0) {
	return Dn(8 | t, e);
}
function U(e, t = [], n = [], r = []) {
	yt(r, t, n, (t) => {
		Dn(8, () => {
			e(...t.map(K));
		});
	});
}
function Rn(e, t = 0) {
	return Dn(16 | t, e);
}
function zn(e, t = 0) {
	return Dn(C | t, e);
}
function Bn(e) {
	return Dn(32 | ie, e);
}
function Vn(e) {
	var t = e.teardown;
	if (t !== null) {
		let n = er, r = W;
		tr(!0), rr(null);
		try {
			t.call(null);
		} catch (t) {
			wn(t, e.parent);
		} finally {
			tr(n), rr(r);
		}
	}
}
function Hn(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && _t(() => {
			e.abort(_e);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : Wn(n, t), n = r;
	}
}
function Un(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || Wn(t), t = n;
	}
}
function Wn(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (Gn(e.nodes.start, e.nodes.end), n = !0), e.f |= ne, Hn(e, t && !n), xr(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	Vn(e), e.f ^= ne, e.f |= ee;
	var i = e.parent;
	i !== null && i.first !== null && Kn(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Gn(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ _n(e);
		e.remove(), e = n;
	}
}
function Kn(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function qn(e, t, n = !0) {
	var r = [];
	e.f |= 256, Jn(e, r, !0);
	var i = () => {
		n && Wn(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function Jn(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= D;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				Jn(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function Yn(e) {
	e.f &= -257, Xn(e, !0);
}
function Xn(e, t) {
	if (!(e.f & 256) && e.f & 8192) {
		e.f ^= D, e.f & 1024 || (ut(e, T), Ht.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			Xn(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function Zn(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ _n(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/legacy.js
var Qn = null, $n = !1, er = !1;
function tr(e) {
	er = e;
}
var W = null, nr = !1;
function rr(e) {
	W = e;
}
var G = null;
function ir(e) {
	G = e;
}
var ar = null;
function or(e) {
	W !== null && (W.f & 2097152 || W.f & 2) && (ar ??= /* @__PURE__ */ new Set()).add(e);
}
var sr = null, cr = 0, lr = null;
function ur(e) {
	lr = e;
}
var dr = 1, fr = 0, pr = fr;
function mr(e) {
	pr = e;
}
function hr() {
	return ++dr;
}
function gr(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (gr(a) && kt(a), a.wv > e.wv) return !0;
		}
		t & 512 && Pt === null && ut(e, w);
	}
	return !1;
}
function _r(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(ar !== null && ar.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? _r(a, t, !1) : t === a && (n ? ut(a, T) : a.f & 1024 && ut(a, E), Kt(a));
	}
}
function vr(e) {
	var t = sr, n = cr, r = lr, i = W, a = ar, o = Qe, s = nr, c = pr, l = e.f;
	sr = null, cr = 0, lr = null, W = l & 96 ? null : e, ar = null, $e(e.ctx), nr = !1, pr = ++fr, e.ac !== null && (_t(() => {
		e.ac.abort(_e);
	}), e.ac = null);
	try {
		e.f |= k;
		var u = e.fn, d = u();
		e.f |= te;
		var f = yr(e);
		if (it() && lr !== null && !nr && f !== null && !(e.f & 6146)) for (var p = 0; p < lr.length; p++) _r(lr[p], e);
		if (i !== null && i !== e) {
			if (fr++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = fr;
			if (t !== null) for (let e of t) e.rv = fr;
			lr !== null && (r === null ? r = lr : r.push(...lr));
		}
		return e.f & 8388608 && (e.f ^= se), d;
	} catch (t) {
		return yr(e), Cn(t);
	} finally {
		e.f ^= k, sr = t, cr = n, lr = r, W = i, ar = a, $e(o), nr = s, pr = c;
	}
}
function yr(e) {
	var t = e.deps, n = I?.is_fork;
	if (sr !== null) {
		var r;
		if (n || xr(e, cr), t !== null && cr > 0) for (t.length = cr + sr.length, r = 0; r < sr.length; r++) t[cr + r] = sr[r];
		else e.deps = t = sr;
		if (On() && e.f & 512) for (r = cr; r < t.length; r++) (t[r].reactions ??= []).push(e);
	} else !n && t !== null && cr < t.length && (xr(e, cr), t.length = cr);
	return t;
}
function br(e, n) {
	let r = n.reactions;
	if (r !== null) {
		var o = i.call(r, e);
		if (o !== -1) {
			var s = r.length - 1;
			s === 0 ? r = n.reactions = null : (r[o] = r[s], r.pop());
		}
	}
	if (r === null && n.f & 2 && (sr === null || !a.call(sr, n))) {
		var c = n;
		c.f & 512 && (c.f ^= 512), c.v !== t && dt(c), c.ac !== null && _t(() => {
			c.ac.abort(_e), c.ac = null, ut(c, T);
		}), At(c), xr(c, 0);
	}
}
function xr(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) br(e, n[r]);
}
function Sr(e) {
	var t = e.f;
	if (!(t & 16384)) {
		ut(e, w);
		var n = G, r = $n;
		G = e, $n = !(t & 96);
		try {
			t & 16777232 ? Un(e) : Hn(e), Vn(e);
			var i = vr(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = dr;
		} finally {
			$n = r, G = n;
		}
	}
}
async function Cr() {
	await Promise.resolve(), L();
}
function K(e) {
	var t = !!(e.f & 2);
	if (Qn?.add(e), W !== null && !nr && !(G !== null && G.f & 16384) && (ar === null || !ar.has(e))) {
		var n = W.deps;
		if (W.f & 2097152) e.rv < fr && (e.rv = fr, sr === null && n !== null && n[cr] === e ? cr++ : sr === null ? sr = [e] : sr.push(e));
		else {
			W.deps ??= [], a.call(W.deps, e) || W.deps.push(e);
			var r = e.reactions;
			r === null ? e.reactions = [W] : a.call(r, W) || r.push(W);
		}
	}
	if (er && Xt.has(e)) return Xt.get(e);
	if (t) {
		var i = e;
		if (er) {
			var o = i.v;
			return (!(i.f & 1024) && i.reactions !== null || Tr(i)) && (o = Ot(i)), Xt.set(i, o), o;
		}
		var s = !(i.f & 512) && !nr && W !== null && ($n || !!(W.f & 512)), c = (i.f & te) === 0;
		gr(i) && (s && (i.f |= 512), kt(i)), s && !c && (jt(i), wr(i));
	}
	if (Pt?.has(e)) return Pt.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function wr(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (jt(t), wr(t));
}
function Tr(e) {
	if (e.v === t) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (Xt.has(t) || t.f & 2 && Tr(t)) return !0;
	return !1;
}
function Er(e) {
	var t = nr;
	try {
		return nr = !0, e();
	} finally {
		nr = t;
	}
}
function Dr(e) {
	if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
		if (ce in e) Or(e);
		else if (!Array.isArray(e)) for (let t in e) {
			let n = e[t];
			typeof n == "object" && n && ce in n && Or(n);
		}
	}
}
function Or(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "object" && e && !(e instanceof EventTarget) && !t.has(e)) {
		t.add(e), e instanceof Date && e.getTime();
		for (let n in e) try {
			Or(e[n], t);
		} catch {}
		let n = p(e);
		if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
			let t = u(n);
			for (let n in t) {
				let r = t[n].get;
				if (r) try {
					r.call(e);
				} catch {}
			}
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/events.js
var kr = Symbol("events"), Ar = /* @__PURE__ */ new Set(), jr = /* @__PURE__ */ new Set();
function Mr(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || zr.call(t, e), !e.cancelBubble) return _t(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? (i.__removed = !1, st(() => {
		i.__removed || t.addEventListener(e, i, r);
	})) : t.addEventListener(e, i, r), i;
}
function Nr(e, t, n, r = {}) {
	var i = Mr(t, e, n, r);
	return () => {
		i.__removed = !0, e.removeEventListener(t, i, r);
	};
}
function Pr(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = Mr(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && kn(() => {
		o.__removed = !0, t.removeEventListener(e, o, a);
	});
}
function Fr(e, t, n) {
	(t[kr] ??= {})[e] = n;
}
function Ir(e) {
	for (var t = 0; t < e.length; t++) Ar.add(e[t]);
	for (var n of jr) n(e);
}
var Lr = null, Rr = !1;
function zr(e) {
	var t = this, n = t.ownerDocument, r = e.type, i = e.composedPath?.() || [], a = i[0] || e.target;
	Lr = e, Rr || (Rr = !0, setTimeout(() => {
		Rr = !1, Lr = null;
	}));
	var o = 0, s = Lr === e && e[kr];
	if (s) {
		var l = i.indexOf(s);
		if (l !== -1 && (t === document || t === window)) {
			e[kr] = t;
			return;
		}
		var u = i.indexOf(t);
		if (u === -1) return;
		l <= u && (o = l);
	}
	if (a = i[o] || e.target, a !== t) {
		c(e, "currentTarget", {
			configurable: !0,
			get() {
				return a || n;
			}
		});
		var d = W, f = G;
		rr(null), ir(null);
		try {
			for (var p, m = []; a !== null && a !== t;) {
				try {
					var h = a[kr]?.[r];
					h != null && (!a.disabled || e.target === a) && h.call(a, e);
				} catch (e) {
					p ? m.push(e) : p = e;
				}
				if (e.cancelBubble) break;
				o++, a = o < i.length ? i[o] : null;
			}
			if (p) {
				for (let e of m) queueMicrotask(() => {
					throw e;
				});
				throw p;
			}
		} finally {
			e[kr] = t, delete e.currentTarget, rr(d), ir(f);
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/reconciler.js
var Br = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function Vr(e) {
	return Br?.createHTML(e) ?? e;
}
function Hr(e) {
	var t = xn("template");
	return t.innerHTML = Vr(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/template.js
function Ur(e, t) {
	var n = G;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function q(e, t) {
	var n = !!(t & 1), r = !!(t & 2), i, a = !e.startsWith("<!>");
	return () => {
		if (A) return Ur(j, null), j;
		i === void 0 && (i = Hr(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ gn(i)));
		var t = r || dn ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ gn(t), s = t.lastChild;
			Ur(o, s);
		} else Ur(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Wr(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (A) return Ur(j, null), j;
		if (!o) {
			var e = /* @__PURE__ */ gn(Hr(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ gn(e);) o.appendChild(/* @__PURE__ */ gn(e));
			else o = /* @__PURE__ */ gn(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ gn(t), r = t.lastChild;
			Ur(n, r);
		} else Ur(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Gr(e, t) {
	return /* @__PURE__ */ Wr(e, t, "svg");
}
function Kr(e = "") {
	if (!A) {
		var t = hn(e + "");
		return Ur(t, t), t;
	}
	var n = j;
	return n.nodeType === 3 ? Sn(n) : (n.before(n = hn()), we(n)), Ur(n, n), n;
}
function qr() {
	if (A) return Ur(j, null), j;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = hn();
	return e.append(t, n), Ur(t, n), e;
}
function J(e, t) {
	if (A) {
		var n = G;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = j), Te();
		return;
	}
	e !== null && e.before(t);
}
//#endregion
//#region node_modules/svelte/src/utils.js
function Jr(e) {
	return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
var Yr = [
	"beforeinput",
	"click",
	"change",
	"dblclick",
	"contextmenu",
	"focusin",
	"focusout",
	"input",
	"keydown",
	"keyup",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup",
	"pointerdown",
	"pointermove",
	"pointerout",
	"pointerover",
	"pointerup",
	"touchend",
	"touchmove",
	"touchstart"
];
function Xr(e) {
	return Yr.includes(e);
}
var Zr = /* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split("."), Qr = {
	formnovalidate: "formNoValidate",
	ismap: "isMap",
	nomodule: "noModule",
	playsinline: "playsInline",
	readonly: "readOnly",
	defaultvalue: "defaultValue",
	defaultchecked: "defaultChecked",
	srcobject: "srcObject",
	novalidate: "noValidate",
	allowfullscreen: "allowFullscreen",
	disablepictureinpicture: "disablePictureInPicture",
	disableremoteplayback: "disableRemotePlayback"
};
function $r(e) {
	return e = e.toLowerCase(), Qr[e] ?? e;
}
[...Zr];
var ei = ["touchstart", "touchmove"];
function ti(e) {
	return ei.includes(e);
}
//#endregion
//#region node_modules/svelte/src/reactivity/create-subscriber.js
function ni(e) {
	let t = 0, n = Qt(0), r;
	return () => {
		On() && (K(n), Ln(() => (t === 0 && (r = Er(() => e(() => an(n)))), t += 1, () => {
			st(() => {
				--t, t === 0 && (r?.(), r = void 0, an(n));
			});
		})));
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var ri = re | ie;
function ii(e, t, n, r) {
	new ai(e, t, n, r);
}
var ai = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = A ? j : null;
	#n;
	#r;
	#i;
	#a = null;
	#o = null;
	#s = null;
	#c = null;
	#l = 0;
	#u = 0;
	#d = !1;
	#f = /* @__PURE__ */ new Set();
	#p = /* @__PURE__ */ new Set();
	#m = null;
	#h = ni(() => (this.#m = Qt(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = G;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = G.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = Rn(() => {
			if (A) {
				let e = this.#t;
				Te();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, ri), A && (this.#e = j);
	}
	#g() {
		try {
			this.#a = Bn(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		st(r), t && (this.#s = Bn(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			if (t) {
				Se();
				return;
			}
			t = !0, n && We(), this.#s !== null && qn(this.#s, () => {
				this.#s = null;
			}), this.#S(() => {
				this.#b();
			});
		};
		return {
			reset: r,
			invoke_onerror: () => {
				try {
					n = !0, this.#n.onerror?.(e, r), n = !1;
				} catch (e) {
					wn(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = Bn(() => e(this.#e)), st(() => {
			var e = this.#c = document.createDocumentFragment(), t = hn(), n = !1;
			if (e.append(t), this.#a = this.#S(() => {
				try {
					return Bn(() => this.#r(t));
				} catch (e) {
					try {
						this.error(e), n = !0;
					} catch (e) {
						wn(e, this.#i.parent);
					}
					return null;
				}
			}), this.#a === null) {
				this.#c = null, n && this.#x(I);
				return;
			}
			this.#u === 0 && (this.#e.before(e), this.#c = null, qn(this.#o, () => {
				this.#o = null;
			}), this.#x(I));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = Bn(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				Zn(this.#a, e);
				let t = this.#n.pending;
				this.#o = Bn(() => t(this.#e));
			} else this.#x(I);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		ft(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = G, n = W, r = Qe;
		ir(this.#i), rr(this.#i), $e(this.#i.ctx);
		try {
			return Ht.ensure(), e();
		} finally {
			ir(t), rr(n), $e(r);
		}
	}
	#C(e, t) {
		if (!this.has_pending_snippet()) {
			this.parent && this.parent.#C(e, t);
			return;
		}
		this.#u += e, this.#u === 0 && (this.#x(t), this.#o && qn(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null));
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, st(() => {
			this.#d = !1, this.#m && nn(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), K(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		I?.is_fork ? (this.#a && I.skip_effect(this.#a), this.#o && I.skip_effect(this.#o), this.#s && I.skip_effect(this.#s), I.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (Wn(this.#a), null), this.#o &&= (Wn(this.#o), null), this.#s &&= (Wn(this.#s), null), A && (we(this.#t), Ee(), we(De()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return Bn(() => {
						var r = G;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return wn(e, this.#i.parent), null;
				}
			}));
		};
		st(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				wn(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => wn(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
function oi(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[he] ??= e.nodeValue) && (e[he] = n, e.nodeValue = `${n}`);
}
function si(e, t) {
	return ui(e, t);
}
function ci(t, n) {
	mn(), n.intro = n.intro ?? !1;
	let r = n.target, i = A, a = j;
	try {
		for (var o = /* @__PURE__ */ gn(r); o && (o.nodeType !== 8 || o.data !== "[");) o = /* @__PURE__ */ _n(o);
		if (!o) throw e;
		Ce(!0), we(o);
		let i = ui(t, {
			...n,
			anchor: o
		});
		return Ce(!1), i;
	} catch (i) {
		if (i instanceof Error && i.message.split("\n").some((e) => e.startsWith("https://svelte.dev/e/"))) throw i;
		return i !== e && console.warn("Failed to hydrate: ", i), n.recover === !1 && ze(), mn(), yn(r), Ce(!1), si(t, n);
	} finally {
		Ce(i), we(a);
	}
}
var li = /* @__PURE__ */ new Map();
function ui(t, { target: n, anchor: r, props: i = {}, events: a, context: s, intro: c = !0, transformError: l }) {
	mn();
	var u = void 0, d = Pn(() => {
		var c = r ?? n.appendChild(hn());
		ii(c, { pending: () => {} }, (n) => {
			N({});
			var r = Qe;
			if (s && (r.c = s), a && (i.$$events = a), A && Ur(n, null), u = t(n, i) || rt(), A && (G.nodes.end = j, j === null || j.nodeType !== 8 || j.data !== "]")) throw be(), e;
			P();
		}, l);
		var d = /* @__PURE__ */ new Set(), f = (e) => {
			for (var t = 0; t < e.length; t++) {
				var r = e[t];
				if (!d.has(r)) {
					d.add(r);
					var i = ti(r);
					for (let e of [n, document]) {
						var a = li.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), li.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, zr, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return f(o(Ar)), jr.add(f), () => {
			for (var e of d) for (let r of [n, document]) {
				var t = li.get(r), i = t.get(e);
				--i == 0 ? (r.removeEventListener(e, zr), t.delete(e), t.size === 0 && li.delete(r)) : t.set(e, i);
			}
			jr.delete(f), c !== r && c.parentNode?.removeChild(c);
		};
	});
	return di.set(u, d), u;
}
var di = /* @__PURE__ */ new WeakMap();
function fi(e, t) {
	let n = di.get(e);
	return n ? (di.delete(e), n(t)) : Promise.resolve();
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/branches.js
var pi = class {
	anchor;
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ new Map();
	#n = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = !0;
	constructor(e, t = !0) {
		this.anchor = e, this.#i = t;
	}
	#a = (e) => {
		if (this.#e.has(e)) {
			var t = this.#e.get(e), n = this.#t.get(t);
			if (n) Yn(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (Yn(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (Wn(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						Zn(r, t), t.append(hn()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else Wn(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), qn(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (Wn(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = I, r = bn();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = hn();
				i.append(a), this.#n.set(e, {
					effect: Bn(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, Bn(() => t(this.anchor)));
		}
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else A && (this.anchor = j), this.#a(n);
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/snippet.js
function mi(e, t, ...n) {
	var r = new pi(e);
	Rn(() => {
		let e = t() ?? null;
		r.ensure(e, e && ((t) => e(t, ...n)));
	}, re);
}
function hi(e) {
	Qe === null && Me("onMount"), Ge && Qe.l !== null ? _i(Qe).m.push(e) : An(() => {
		let t = Er(e);
		if (typeof t == "function") return t;
	});
}
function gi(e) {
	Qe === null && Me("onDestroy"), hi(() => () => Er(e));
}
function _i(e) {
	var t = e.l;
	return t.u ??= {
		a: [],
		b: [],
		m: []
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/if.js
function Y(e, t, n = !1) {
	var r;
	A && (r = j, Te());
	var i = new pi(e), a = n ? re : 0;
	function o(e, t) {
		if (A) {
			var n = Oe(r);
			if (e !== parseInt(n.substring(1))) {
				var a = De();
				we(a), i.anchor = a, Ce(!1), i.ensure(e, t), Ce(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	Rn(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/key.js
var vi = Symbol("NaN");
function yi(e, t, n) {
	A && Te();
	var r = new pi(e), i = !it();
	Rn(() => {
		var e = t();
		e !== e && (e = vi), i && typeof e == "object" && e && (e = {}), r.ensure(e, n);
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/css-props.js
function bi(e, t) {
	A && we(/* @__PURE__ */ gn(e)), Ln(() => {
		var n = t();
		for (var r in n) {
			var i = n[r];
			i == null || i === "" ? e.style.removeProperty(r) : e.style.setProperty(r, i);
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/each.js
function xi(e, t, n) {
	for (var r = [], i = t.length, a, s = t.length, c = 0; c < i; c++) {
		let n = t[c];
		qn(n, () => {
			if (a) {
				if (a.pending.delete(n), a.done.add(n), a.pending.size === 0) {
					var t = e.outrogroups;
					Si(e, o(a.done)), t.delete(a), t.size === 0 && (e.outrogroups = null);
				}
			} else --s;
		}, !1);
	}
	if (s === 0) {
		var l = r.length === 0 && n !== null && e.pending.size === 0;
		if (l) {
			var u = n, d = u.parentNode;
			yn(d), d.append(u), e.items.clear();
		}
		Si(e, t, !l);
	} else a = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(a);
}
function Si(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= O, Zn(a, document.createDocumentFragment())) : Wn(t[i], n);
	}
}
var Ci;
function wi(e, t, n, i, a, s = null) {
	var c = e, l = /* @__PURE__ */ new Map();
	if (t & 4) {
		var u = e;
		c = A ? we(/* @__PURE__ */ gn(u)) : u.appendChild(hn());
	}
	A && Te();
	var d = null, f = /* @__PURE__ */ Et(() => {
		var e = n();
		return r(e) ? e : e == null ? [] : o(e);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Ei(v, p, c, t, i), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= O, Oi(d, null, c)) : Yn(d) : qn(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: Rn(() => {
			p = K(f);
			var e = p.length;
			let r = !1;
			A && Oe(c) === "[!" != (e === 0) && (c = De(), we(c), Ce(!1), r = !0);
			for (var o = /* @__PURE__ */ new Set(), u = I, v = bn(), y = 0; y < e; y += 1) {
				A && j.nodeType === 8 && j.data === "]" && (c = j, r = !0, Ce(!1));
				var b = p[y], x = i(b, y), S = h ? null : l.get(x);
				S ? (S.v && nn(S.v, b), S.i && nn(S.i, y), v && u.unskip_effect(S.e)) : (S = Di(l, h ? c : Ci ??= hn(), b, x, y, a, t, n), h || (S.e.f |= O), l.set(x, S)), o.add(x);
			}
			if (e === 0 && s && !d && (h ? d = Bn(() => s(c)) : (d = Bn(() => s(Ci ??= hn())), d.f |= O)), e > o.size && Pe("", "", ""), A && e > 0 && we(De()), !h) {
				if (m.set(u, o), v) {
					for (let [e, t] of l) o.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			r && Ce(!0), K(f);
		}),
		flags: t,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, A && (c = j);
}
function Ti(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Ei(e, t, n, r, i) {
	var a = !!(r & 8), s = t.length, c = e.items, l = Ti(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (a) for (v = 0; v < s; v += 1) h = t[v], g = i(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = i(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (Yn(_), a && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= O, _ === l) Oi(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), ki(e, d, _), ki(e, _, y), Oi(_, y, n), d = _, p = [], m = [], l = Ti(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], C = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Oi(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					ki(e, S.prev, C.next), ki(e, d, S), ki(e, C, b), l = b, d = C, --v, p = [], m = [];
				} else u.delete(_), Oi(_, l, n), ki(e, _.prev, _.next), ki(e, _, d === null ? e.effect.first : d.next), ki(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = Ti(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = Ti(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (Si(e, o(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var w = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || w.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && w.push(l), l = Ti(l.next);
		var T = w.length;
		if (T > 0) {
			var E = r & 4 && s === 0 ? n : null;
			if (a) {
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.measure();
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.fix();
			}
			xi(e, w, E);
		}
	}
	a && st(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function Di(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? Qt(n) : /* @__PURE__ */ $t(n, !1, !1) : null, l = o & 2 ? Qt(i) : null;
	return {
		v: c,
		i: l,
		e: Bn(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Oi(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ _n(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function ki(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
function Ai(e, t, n) {
	var r;
	A && (r = j, Te());
	var i = new pi(e);
	Rn(() => {
		var e = t() ?? null;
		if (A && Oe(r) === "[" != (e !== null)) {
			var a = De();
			we(a), i.anchor = a, Ce(!1), i.ensure(e, e && ((t) => n(t, e))), Ce(!0);
			return;
		}
		i.ensure(e, e && ((t) => n(t, e)));
	}, re);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/css.js
function ji(e, t) {
	Fn(() => {
		e = G?.parent?.nodes?.start ?? e;
		var n = e.getRootNode(), r = n.host ? n : n.head ?? n.ownerDocument.head;
		if (!r.querySelector("#" + t.hash)) {
			let e = xn("style");
			e.id = t.hash, e.textContent = t.code, r.appendChild(e);
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/actions.js
function Mi(e, t, n) {
	Fn(() => {
		var r = Er(() => t(e, n?.()) || {});
		if (n && r?.update) {
			var i = !1, a = {};
			Ln(() => {
				var e = n();
				Dr(e), i && Ae(a, e) && (a = e, r.update(e));
			}), i = !0;
		}
		if (r?.destroy) return () => r.destroy();
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attachments.js
function Ni(e, t) {
	var n = void 0, r;
	zn(() => {
		n !== (n = t()) && (r &&= (Wn(r), null), n && (r = Bn(() => {
			Fn(() => n(e));
		})));
	});
}
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function Pi(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = Pi(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function Fi() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = Pi(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
function Ii(e) {
	return typeof e == "object" ? Fi(e) : e ?? "";
}
var Li = [..." 	\n\r\f\xA0\v﻿"];
function Ri(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Li.includes(r[o - 1])) && (s === r.length || Li.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function zi(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function Bi(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Vi(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\/\*.*?\*\//g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(Bi)), i && c.push(...Object.keys(i).map(Bi));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = Bi(e.substring(l, u).trim());
							if (!c.includes(p)) {
								f !== ";" && d++;
								var m = e.substring(l, d).trim();
								n += " " + m + ";";
							}
						}
						l = d + 1, u = -1;
					}
				}
			}
		}
		return r && (n += zi(r)), i && (n += zi(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function Hi(e, t, n, r, i, a) {
	var o = e[pe];
	if (A || o !== n || o === void 0) {
		var s = Ri(n, r, a);
		(!A || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[pe] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/style.js
function Ui(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function Wi(e, t, n, r) {
	var i = e[me];
	if (A || i !== t) {
		var a = Vi(t, r);
		(!A || a !== e.getAttribute("style")) && (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[me] = t;
	} else r && (Array.isArray(r) ? (Ui(e, n?.[0], r[0]), Ui(e, n?.[1], r[1], "important")) : Ui(e, n, r));
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
function Gi(e, t) {
	t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function Ki(e, t) {
	var n = !("__defaultValue" in e);
	(n || e.__defaultValue !== t) && (e.__defaultValue = t, qi(e, !n || "__value" in e));
}
function qi(e, t) {
	var n = e.__defaultValue, i = e.multiple, a = i ? n ?? [] : null;
	if (!i || r(a)) {
		var o = e.selectedIndex, s = t && i ? new Set(e.selectedOptions) : null;
		for (var c of e.options) {
			var l = Zi(c);
			Gi(c, i ? a.includes(l) : ln(l, n));
		}
		if (t) {
			if (s !== null) for (c of e.options) {
				var u = s.has(c);
				c.selected !== u && (c.selected = u);
			}
			else e.selectedIndex !== o && (e.selectedIndex = o);
		}
	}
}
function Ji(e, t, n = !1) {
	if (e.multiple) {
		if (t == null) return;
		if (!r(t)) return xe();
		for (var i of e.options) i.selected = t.includes(Zi(i));
		return;
	}
	for (i of e.options) if (ln(Zi(i), t)) {
		i.selected = !0;
		return;
	}
	(!n || t !== void 0) && (e.selectedIndex = -1);
}
function Yi(e) {
	var t = new MutationObserver((t) => {
		t.every(Qi) || ("__defaultValue" in e && qi(e, !1), "__value" in e && Ji(e, e.__value));
	});
	t.observe(e, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["value"]
	}), kn(() => {
		t.disconnect();
	});
}
function Xi(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet(), i = !0;
	vt(e, "change", (t) => {
		var i = t ? "[selected]" : ":checked", a;
		if (e.multiple) a = [].map.call(e.querySelectorAll(i), Zi);
		else {
			var o = e.querySelector(i) ?? e.querySelector("option:not([disabled])");
			a = o && Zi(o);
		}
		n(a), e.__value = a, I !== null && r.add(I);
	}), Fn(() => {
		var a = t();
		if (e === document.activeElement) {
			var o = I;
			if (r.has(o)) return;
		}
		if (Ji(e, a, i), i && a === void 0) {
			var s = e.querySelector(":checked");
			s !== null && (a = Zi(s), n(a));
		}
		e.__value = a, i = !1;
	});
}
function Zi(e) {
	return "__value" in e ? e.__value : e.value;
}
function Qi(e) {
	if (e.target.closest("selectedcontent") !== null) return !0;
	if (e.type === "childList") {
		var t = [...e.addedNodes, ...e.removedNodes];
		return t.length > 0 && t.every((e) => e.nodeName === "SELECTEDCONTENT");
	}
	return !1;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attributes.js
var $i = Symbol("class"), ea = Symbol("style"), ta = Symbol("is custom element"), na = Symbol("is html"), ra = ve ? "link" : "LINK", ia = ve ? "input" : "INPUT", aa = ve ? "option" : "OPTION", oa = ve ? "select" : "SELECT", sa = ve ? "progress" : "PROGRESS";
function ca(e) {
	if (A) {
		var t = !1, n = () => {
			if (!t) {
				if (t = !0, e.hasAttribute("value")) {
					var n = e.value;
					X(e, "value", null), e.value = n;
				}
				if (e.hasAttribute("checked")) {
					var r = e.checked;
					X(e, "checked", null), e.checked = r;
				}
			}
		};
		e[ge] = n, st(n), gt();
	}
}
function la(e, t) {
	var n = pa(e);
	n.value !== (n.value = t ?? void 0) && (e.value !== t || t === 0 && e.nodeName === sa) && (e.value = t ?? "");
}
function ua(e, t) {
	var n = pa(e);
	n.checked !== (n.checked = t ?? void 0) && (e.checked = t);
}
function X(e, t, n, r) {
	var i = pa(e);
	A && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === ra) || i[t] !== (i[t] = n) && (t === "loading" && (e[de] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && ha(e).has(t) ? e[t] = n : e.setAttribute(t, n));
}
function da(e, n, r, i, a = !1, o = !1) {
	A && a && e.nodeName === ia && ("defaultValue" in r || "defaultChecked" in r || ca(e));
	var s = pa(e), c = s[ta], l = !s[na];
	let u = A && c;
	u && Ce(!1);
	var d = n || {}, f = e.nodeName === aa, p = e.nodeName === oa;
	for (var m in n) !(m in r) && m[0] + m[1] !== "$$" && (r[m] = null);
	r.class ? r.class = Ii(r.class) : (i || r[$i]) && (r.class = null), r[ea] && (r.style ??= null);
	var h = ha(e);
	if (e.nodeName === ia && "type" in r && ("value" in r || "__value" in r)) {
		var g = r.type;
		(g !== d.type || g === void 0 && e.hasAttribute("type")) && (d.type = g, X(e, "type", g, o));
	}
	for (let a in r) {
		let u = r[a];
		if (f && a === "value" && u == null) {
			e.value = e.__value = "", d[a] = u;
			continue;
		}
		if (a === "class") {
			Hi(e, e.namespaceURI === "http://www.w3.org/1999/xhtml", u, i, n?.[$i], r[$i]), d[a] = u, d[$i] = r[$i];
			continue;
		}
		if (a === "style") {
			Wi(e, u, n?.[ea], r[ea]), d[a] = u, d[ea] = r[ea];
			continue;
		}
		var _ = d[a];
		if (u !== _ || u === void 0 && e.hasAttribute(a)) {
			d[a] = u;
			var v = a[0] + a[1];
			if (v !== "$$") {
				if (v === "on") {
					let t = {}, n = "$$" + a, r = a.slice(2);
					var y = Xr(r);
					if (Jr(r) && (r = r.slice(0, -7), t.capture = !0), !y && _) {
						if (u != null) continue;
						e.removeEventListener(r, d[n], t), d[n] = null;
					}
					if (y) Fr(r, e, u), Ir([r]);
					else if (u != null) {
						function i(e) {
							d[a].call(this, e);
						}
						d[n] = Mr(r, e, i, t);
					}
				} else if (a === "style") X(e, a, u);
				else if (a === "autofocus") pt(e, !!u);
				else if (!c && (a === "__value" || a === "value" && u != null)) e.value = e.__value = u;
				else if (a === "selected" && f) Gi(e, u);
				else {
					var b = a;
					l || (b = $r(b));
					var x = b === "defaultValue" || b === "defaultChecked";
					if (p && b === "defaultValue") continue;
					if (u == null && !c && !x) {
						if (s[a] = null, b === "value" || b === "checked") {
							let t = e, r = n === void 0;
							if (b === "value") {
								let e = t.defaultValue;
								t.removeAttribute(b), t.defaultValue = e, t.value = t.__value = r ? e : null;
							} else {
								let e = t.defaultChecked;
								t.removeAttribute(b), t.defaultChecked = e, t.checked = r ? e : !1;
							}
						} else e.removeAttribute(a);
					} else x || (c || typeof u != "string") && h.has(b) ? (e[b] = u, b in s && (s[b] = t)) : typeof u != "function" && X(e, b, u, o);
				}
			}
		}
	}
	return u && Ce(!0), d;
}
function fa(e, t, n = [], r = [], i = [], a, o = !1, s = !1) {
	yt(i, n, r, (n) => {
		var r = void 0, i = {}, c = e.nodeName === oa, l = !1;
		if (zn(() => {
			var u = t(...n.map(K)), d = da(e, r, u, a, o, s);
			if (l && c) {
				var f = e;
				"defaultValue" in u && Ki(f, u.defaultValue), "value" in u && Ji(f, u.value);
			}
			for (let e of Object.getOwnPropertySymbols(i)) u[e] || Wn(i[e]);
			for (let t of Object.getOwnPropertySymbols(u)) {
				var p = u[t];
				t.description === "@attach" && (!r || p !== r[t]) && (i[t] && Wn(i[t]), i[t] = Bn(() => Ni(e, () => p))), d[t] = p;
			}
			r = d;
		}), c) {
			var u = e;
			Fn(() => {
				var e = r;
				"defaultValue" in e && Ki(u, e.defaultValue), Ji(u, e.value, !0), Yi(u);
			});
		}
		l = !0;
	});
}
function pa(e) {
	return e[fe] ??= {
		[ta]: e.nodeName.includes("-"),
		[na]: e.namespaceURI === n
	};
}
var ma = /* @__PURE__ */ new Map();
function ha(e) {
	var t = e.getAttribute("is") || e.nodeName, n = ma.get(t);
	if (n) return n;
	ma.set(t, n = /* @__PURE__ */ new Set());
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var o in r = u(i), r) r[o].set && o !== "innerHTML" && o !== "textContent" && o !== "innerText" && n.add(o);
		i = p(i);
	}
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function ga(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	vt(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = _a(e) ? va(a) : a, n(a), I !== null && r.add(I), await Cr(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (A && e.defaultValue !== e.value || Er(t) == null && e.value) && (n(_a(e) ? va(e.value) : e.value), I !== null && r.add(I)), Ln(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = I;
			if (r.has(i)) return;
		}
		_a(e) && n === va(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function _a(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function va(e) {
	return e === "" ? null : +e;
}
var ya = /* @__PURE__ */ new class e {
	#e = /* @__PURE__ */ new WeakMap();
	#t;
	#n;
	static entries = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#n = e;
	}
	observe(e, t) {
		var n = this.#e.get(e) || /* @__PURE__ */ new Set();
		return n.add(t), this.#e.set(e, n), this.#r().observe(e, this.#n), () => {
			var n = this.#e.get(e);
			n.delete(t), n.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
		};
	}
	#r() {
		return this.#t ??= new ResizeObserver((t) => {
			for (var n of t) {
				e.entries.set(n.target, n);
				for (var r of this.#e.get(n.target) || []) r(n);
			}
		});
	}
}({ box: "border-box" });
function ba(e, t, n) {
	var r = ya.observe(e, () => n(e[t]));
	Fn(() => (Er(() => n(e[t])), r));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function xa(e, t) {
	return e === t || e?.[ce] === t;
}
function Sa(e = rt(), t, n, r) {
	var i = Qe.r, a = G;
	return Fn(() => {
		var o, s;
		return Ln(() => {
			o = s, s = r?.() || [], Er(() => {
				xa(n(...s), e) || (t(e, ...s), o && xa(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && xa(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
function Ca(e = !1) {
	let t = Qe, n = t.l.u;
	if (!n) return;
	let r = () => Dr(t.s);
	if (e) {
		let e = 0, n = {}, i = /* @__PURE__ */ Ct(() => {
			let r = !1, i = t.s;
			for (let e in i) i[e] !== n[e] && (n[e] = i[e], r = !0);
			return r && e++, e;
		});
		r = () => K(i);
	}
	n.b.length && Mn(() => {
		wa(t, r), v(n.b);
	}), An(() => {
		let e = Er(() => n.m.map(_));
		return () => {
			for (let t of e) typeof t == "function" && t();
		};
	}), n.a.length && An(() => {
		wa(t, r), v(n.a);
	});
}
function wa(e, t) {
	if (e.l.s) for (let t of e.l.s) K(t);
	t();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/store.js
var Ta = !1;
function Ea(e) {
	var t = Ta;
	try {
		return Ta = !1, [e(), Ta];
	} finally {
		Ta = t;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/props.js
var Da = {
	get(e, t) {
		if (!e.exclude.has(t)) return e.props[t];
	},
	set(e, t) {
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		if (!e.exclude.has(t) && t in e.props) return {
			enumerable: !0,
			configurable: !0,
			value: e.props[t]
		};
	},
	has(e, t) {
		return !e.exclude.has(t) && t in e.props;
	},
	ownKeys(e) {
		return Reflect.ownKeys(e.props).filter((t) => !e.exclude.has(t));
	}
};
/*#__NO_SIDE_EFFECTS__*/
function Oa(e, t, n) {
	return new Proxy({
		props: e,
		exclude: t
	}, Da);
}
var ka = {
	get(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (h(r) && (r = r()), typeof r == "object" && r && t in r) return r[t];
		}
	},
	set(e, t, n) {
		let r = e.props.length;
		for (; r--;) {
			let i = e.props[r];
			h(i) && (i = i());
			let a = l(i, t);
			if (a && a.set) return a.set(n), !0;
		}
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (h(r) && (r = r()), typeof r == "object" && r && t in r) {
				let e = l(r, t);
				return e && !e.configurable && (e.configurable = !0), e;
			}
		}
	},
	has(e, t) {
		if (t === ce || t === ue) return !1;
		for (let n of e.props) if (h(n) && (n = n()), n != null && t in n) return !0;
		return !1;
	},
	ownKeys(e) {
		let t = [];
		for (let n of e.props) if (h(n) && (n = n()), n) {
			for (let e in n) t.includes(e) || t.push(e);
			for (let e of Object.getOwnPropertySymbols(n)) t.includes(e) || t.push(e);
		}
		return t;
	}
};
function Aa(...e) {
	return new Proxy({ props: e }, ka);
}
function Z(e, t, n, r) {
	var i = !Ge || !!(n & 2), a = !!(n & 8), o = !!(n & 16), s = r, c = !0, u = void 0, d = () => o && i ? (u ??= /* @__PURE__ */ Ct(r), K(u)) : (c && (c = !1, s = o ? Er(r) : r), s);
	let f;
	if (a) {
		var p = ce in e || ue in e;
		f = l(e, t)?.set ?? (p && t in e ? (n) => e[t] = n : void 0);
	}
	var m, h = !1;
	a ? [m, h] = Ea(() => e[t]) : m = e[t], m === void 0 && r !== void 0 && (m = d(), f && (i && Be(t), f(m)));
	var g = i ? () => {
		var n = e[t];
		return n === void 0 ? d() : (c = !0, n);
	} : () => {
		var n = e[t];
		return n !== void 0 && (s = void 0), n === void 0 ? s : n;
	};
	if (i && !(n & 4)) return g;
	if (f) {
		var _ = e.$$legacy;
		return (function(e, t) {
			return arguments.length > 0 ? ((!i || !t || _ || h) && f(t ? g() : e), e) : g();
		});
	}
	var v = !1, y = (n & 1 ? Ct : Et)(() => (v = !1, g()));
	a && K(y);
	var b = G;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? K(y) : i && a ? sn(e) : e;
			return z(y, n), v = !0, s !== void 0 && (s = n), e;
		}
		return er && v || b.f & 16384 ? y.v : K(y);
	});
}
//#endregion
//#region node_modules/svelte/src/legacy/legacy-client.js
function ja(e) {
	return new Ma(e);
}
var Ma = class {
	#e;
	#t;
	constructor(e) {
		var t = /* @__PURE__ */ new Map(), n = (e, n) => {
			var r = /* @__PURE__ */ $t(n, !1, !1);
			return t.set(e, r), r;
		};
		let r = new Proxy({
			...e.props || {},
			$$events: {}
		}, {
			get(e, r) {
				return K(t.get(r) ?? n(r, Reflect.get(e, r)));
			},
			has(e, r) {
				return r === ue || (K(t.get(r) ?? n(r, Reflect.get(e, r))), Reflect.has(e, r));
			},
			set(e, r, i) {
				return z(t.get(r) ?? n(r, i), i), Reflect.set(e, r, i);
			}
		});
		this.#t = (e.hydrate ? ci : si)(e.component, {
			target: e.target,
			anchor: e.anchor,
			props: r,
			context: e.context,
			intro: e.intro ?? !1,
			recover: e.recover,
			transformError: e.transformError
		}), (!e?.props?.$$host || e.sync === !1) && L(), this.#e = r.$$events;
		for (let e of Object.keys(this.#t)) e !== "$set" && e !== "$destroy" && e !== "$on" && c(this, e, {
			get() {
				return this.#t[e];
			},
			set(t) {
				this.#t[e] = t;
			},
			enumerable: !0
		});
		this.#t.$set = (e) => {
			Object.assign(r, e);
		}, this.#t.$destroy = () => {
			fi(this.#t);
		};
	}
	$set(e) {
		this.#t.$set(e);
	}
	$on(e, t) {
		this.#e[e] = this.#e[e] || [];
		let n = (...e) => t.call(this, ...e);
		return this.#e[e].push(n), () => {
			this.#e[e] = this.#e[e].filter((e) => e !== n);
		};
	}
	$destroy() {
		this.#t.$destroy();
	}
}, Na;
typeof HTMLElement == "function" && (Na = class extends HTMLElement {
	$$ctor;
	$$s;
	$$c;
	$$cn = !1;
	$$d = {};
	$$r = !1;
	$$p_d = {};
	$$l = {};
	$$l_u = /* @__PURE__ */ new Map();
	$$me;
	$$shadowRoot = null;
	constructor(e, t, n) {
		super(), this.$$ctor = e, this.$$s = t, n && (this.$$shadowRoot = this.attachShadow(n));
	}
	addEventListener(e, t, n) {
		if (this.$$l[e] = this.$$l[e] || [], this.$$l[e].push(t), this.$$c) {
			let n = this.$$c.$on(e, t);
			this.$$l_u.set(t, n);
		}
		super.addEventListener(e, t, n);
	}
	removeEventListener(e, t, n) {
		if (super.removeEventListener(e, t, n), this.$$c) {
			let e = this.$$l_u.get(t);
			e && (e(), this.$$l_u.delete(t));
		}
	}
	async connectedCallback() {
		if (this.$$cn = !0, !this.$$c) {
			if (await Promise.resolve(), !this.$$cn || this.$$c) return;
			function e(e) {
				return (t) => {
					let n = xn("slot");
					e !== "default" && (n.name = e), J(t, n);
				};
			}
			let t = {}, n = Fa(this);
			for (let r of this.$$s) r in n && (r === "default" && !this.$$d.children ? (this.$$d.children = e(r), t.default = !0) : t[r] = e(r));
			for (let e of this.attributes) {
				let t = this.$$g_p(e.name);
				t in this.$$d || (this.$$d[t] = Pa(t, e.value, this.$$p_d, "toProp"));
			}
			for (let e in this.$$p_d) !(e in this.$$d) && this[e] !== void 0 && (this.$$d[e] = this[e], delete this[e]);
			this.$$c = ja({
				component: this.$$ctor,
				target: this.$$shadowRoot || this,
				props: {
					...this.$$d,
					$$slots: t,
					$$host: this
				}
			}), this.$$me = Nn(() => {
				Ln(() => {
					this.$$r = !0;
					for (let e of s(this.$$c)) {
						if (!this.$$p_d[e]?.reflect) continue;
						this.$$d[e] = this.$$c[e];
						let t = Pa(e, this.$$d[e], this.$$p_d, "toAttribute");
						t == null ? this.removeAttribute(this.$$p_d[e].attribute || e) : this.setAttribute(this.$$p_d[e].attribute || e, t);
					}
					this.$$r = !1;
				});
			});
			for (let e in this.$$l) for (let t of this.$$l[e]) {
				let n = this.$$c.$on(e, t);
				this.$$l_u.set(t, n);
			}
			this.$$l = {};
		}
	}
	attributeChangedCallback(e, t, n) {
		this.$$r || (e = this.$$g_p(e), this.$$d[e] = Pa(e, n, this.$$p_d, "toProp"), this.$$c?.$set({ [e]: this.$$d[e] }));
	}
	disconnectedCallback() {
		this.$$cn = !1, Promise.resolve().then(() => {
			!this.$$cn && this.$$c && (this.$$c.$destroy(), this.$$me(), this.$$c = void 0);
		});
	}
	$$g_p(e) {
		return s(this.$$p_d).find((t) => this.$$p_d[t].attribute === e || !this.$$p_d[t].attribute && t.toLowerCase() === e) || e;
	}
});
function Pa(e, t, n, r) {
	let i = n[e]?.type;
	if (t = i === "Boolean" && typeof t != "boolean" ? t != null : t, !r || !n[e]) return t;
	if (r === "toAttribute") switch (i) {
		case "Object":
		case "Array": return t == null ? null : JSON.stringify(t);
		case "Boolean": return t ? "" : null;
		case "Number": return t ?? null;
		default: return t;
	}
	else switch (i) {
		case "Object":
		case "Array": return t && JSON.parse(t);
		case "Boolean": return t;
		case "Number": return t == null ? t : +t;
		default: return t;
	}
}
function Fa(e) {
	let t = {};
	return e.childNodes.forEach((e) => {
		t[e.slot || "default"] = !0;
	}), t;
}
function Q(e, t, n, r, i, a) {
	let o = class extends Na {
		constructor() {
			super(e, n, i), this.$$p_d = t;
		}
		static get observedAttributes() {
			return s(t).map((e) => (t[e].attribute || e).toLowerCase());
		}
	};
	return s(t).forEach((e) => {
		c(o.prototype, e, {
			get() {
				return this.$$c && e in this.$$c ? this.$$c[e] : this.$$d[e];
			},
			set(n) {
				n = Pa(e, n, t), this.$$d[e] = n;
				var r = this.$$c;
				r && (l(r, e)?.get ? r[e] = n : r.$set({ [e]: n }));
			}
		});
	}), r.forEach((e) => {
		c(o.prototype, e, { get() {
			return this.$$c?.[e];
		} });
	}), a && (o = a(o)), e.element = o, o;
}
//#endregion
//#region node_modules/d3-dispatch/src/dispatch.js
var Ia = { value: () => {} };
function La() {
	for (var e = 0, t = arguments.length, n = {}, r; e < t; ++e) {
		if (!(r = arguments[e] + "") || r in n || /[\s.]/.test(r)) throw Error("illegal type: " + r);
		n[r] = [];
	}
	return new Ra(n);
}
function Ra(e) {
	this._ = e;
}
function za(e, t) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var n = "", r = e.indexOf(".");
		if (r >= 0 && (n = e.slice(r + 1), e = e.slice(0, r)), e && !t.hasOwnProperty(e)) throw Error("unknown type: " + e);
		return {
			type: e,
			name: n
		};
	});
}
Ra.prototype = La.prototype = {
	constructor: Ra,
	on: function(e, t) {
		var n = this._, r = za(e + "", n), i, a = -1, o = r.length;
		if (arguments.length < 2) {
			for (; ++a < o;) if ((i = (e = r[a]).type) && (i = Ba(n[i], e.name))) return i;
			return;
		}
		if (t != null && typeof t != "function") throw Error("invalid callback: " + t);
		for (; ++a < o;) if (i = (e = r[a]).type) n[i] = Va(n[i], e.name, t);
		else if (t == null) for (i in n) n[i] = Va(n[i], e.name, null);
		return this;
	},
	copy: function() {
		var e = {}, t = this._;
		for (var n in t) e[n] = t[n].slice();
		return new Ra(e);
	},
	call: function(e, t) {
		if ((i = arguments.length - 2) > 0) for (var n = Array(i), r = 0, i, a; r < i; ++r) n[r] = arguments[r + 2];
		if (!this._.hasOwnProperty(e)) throw Error("unknown type: " + e);
		for (a = this._[e], r = 0, i = a.length; r < i; ++r) a[r].value.apply(t, n);
	},
	apply: function(e, t, n) {
		if (!this._.hasOwnProperty(e)) throw Error("unknown type: " + e);
		for (var r = this._[e], i = 0, a = r.length; i < a; ++i) r[i].value.apply(t, n);
	}
};
function Ba(e, t) {
	for (var n = 0, r = e.length, i; n < r; ++n) if ((i = e[n]).name === t) return i.value;
}
function Va(e, t, n) {
	for (var r = 0, i = e.length; r < i; ++r) if (e[r].name === t) {
		e[r] = Ia, e = e.slice(0, r).concat(e.slice(r + 1));
		break;
	}
	return n != null && e.push({
		name: t,
		value: n
	}), e;
}
var Ha = {
	svg: "http://www.w3.org/2000/svg",
	xhtml: "http://www.w3.org/1999/xhtml",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/"
};
//#endregion
//#region node_modules/d3-selection/src/namespace.js
function Ua(e) {
	var t = e += "", n = t.indexOf(":");
	return n >= 0 && (t = e.slice(0, n)) !== "xmlns" && (e = e.slice(n + 1)), Ha.hasOwnProperty(t) ? {
		space: Ha[t],
		local: e
	} : e;
}
//#endregion
//#region node_modules/d3-selection/src/creator.js
function Wa(e) {
	return function() {
		var t = this.ownerDocument, n = this.namespaceURI;
		return n === "http://www.w3.org/1999/xhtml" && t.documentElement.namespaceURI === "http://www.w3.org/1999/xhtml" ? t.createElement(e) : t.createElementNS(n, e);
	};
}
function Ga(e) {
	return function() {
		return this.ownerDocument.createElementNS(e.space, e.local);
	};
}
function Ka(e) {
	var t = Ua(e);
	return (t.local ? Ga : Wa)(t);
}
//#endregion
//#region node_modules/d3-selection/src/selector.js
function qa() {}
function Ja(e) {
	return e == null ? qa : function() {
		return this.querySelector(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/select.js
function Ya(e) {
	typeof e != "function" && (e = Ja(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = Array(o), c, l, u = 0; u < o; ++u) (c = a[u]) && (l = e.call(c, c.__data__, u, a)) && ("__data__" in c && (l.__data__ = c.__data__), s[u] = l);
	return new Rs(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/array.js
function Xa(e) {
	return e == null ? [] : Array.isArray(e) ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selectorAll.js
function Za() {
	return [];
}
function Qa(e) {
	return e == null ? Za : function() {
		return this.querySelectorAll(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectAll.js
function $a(e) {
	return function() {
		return Xa(e.apply(this, arguments));
	};
}
function eo(e) {
	e = typeof e == "function" ? $a(e) : Qa(e);
	for (var t = this._groups, n = t.length, r = [], i = [], a = 0; a < n; ++a) for (var o = t[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && (r.push(e.call(c, c.__data__, l, o)), i.push(c));
	return new Rs(r, i);
}
//#endregion
//#region node_modules/d3-selection/src/matcher.js
function to(e) {
	return function() {
		return this.matches(e);
	};
}
function no(e) {
	return function(t) {
		return t.matches(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChild.js
var ro = Array.prototype.find;
function io(e) {
	return function() {
		return ro.call(this.children, e);
	};
}
function ao() {
	return this.firstElementChild;
}
function oo(e) {
	return this.select(e == null ? ao : io(typeof e == "function" ? e : no(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChildren.js
var so = Array.prototype.filter;
function co() {
	return Array.from(this.children);
}
function lo(e) {
	return function() {
		return so.call(this.children, e);
	};
}
function uo(e) {
	return this.selectAll(e == null ? co : lo(typeof e == "function" ? e : no(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/filter.js
function fo(e) {
	typeof e != "function" && (e = to(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Rs(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/sparse.js
function po(e) {
	return Array(e.length);
}
//#endregion
//#region node_modules/d3-selection/src/selection/enter.js
function mo() {
	return new Rs(this._enter || this._groups.map(po), this._parents);
}
function ho(e, t) {
	this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, this._next = null, this._parent = e, this.__data__ = t;
}
ho.prototype = {
	constructor: ho,
	appendChild: function(e) {
		return this._parent.insertBefore(e, this._next);
	},
	insertBefore: function(e, t) {
		return this._parent.insertBefore(e, t);
	},
	querySelector: function(e) {
		return this._parent.querySelector(e);
	},
	querySelectorAll: function(e) {
		return this._parent.querySelectorAll(e);
	}
};
//#endregion
//#region node_modules/d3-selection/src/constant.js
function go(e) {
	return function() {
		return e;
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/data.js
function _o(e, t, n, r, i, a) {
	for (var o = 0, s, c = t.length, l = a.length; o < l; ++o) (s = t[o]) ? (s.__data__ = a[o], r[o] = s) : n[o] = new ho(e, a[o]);
	for (; o < c; ++o) (s = t[o]) && (i[o] = s);
}
function vo(e, t, n, r, i, a, o) {
	var s, c, l = /* @__PURE__ */ new Map(), u = t.length, d = a.length, f = Array(u), p;
	for (s = 0; s < u; ++s) (c = t[s]) && (f[s] = p = o.call(c, c.__data__, s, t) + "", l.has(p) ? i[s] = c : l.set(p, c));
	for (s = 0; s < d; ++s) p = o.call(e, a[s], s, a) + "", (c = l.get(p)) ? (r[s] = c, c.__data__ = a[s], l.delete(p)) : n[s] = new ho(e, a[s]);
	for (s = 0; s < u; ++s) (c = t[s]) && l.get(f[s]) === c && (i[s] = c);
}
function yo(e) {
	return e.__data__;
}
function bo(e, t) {
	if (!arguments.length) return Array.from(this, yo);
	var n = t ? vo : _o, r = this._parents, i = this._groups;
	typeof e != "function" && (e = go(e));
	for (var a = i.length, o = Array(a), s = Array(a), c = Array(a), l = 0; l < a; ++l) {
		var u = r[l], d = i[l], f = d.length, p = xo(e.call(u, u && u.__data__, l, r)), m = p.length, h = s[l] = Array(m), g = o[l] = Array(m);
		n(u, d, h, g, c[l] = Array(f), p, t);
		for (var _ = 0, v = 0, y, b; _ < m; ++_) if (y = h[_]) {
			for (_ >= v && (v = _ + 1); !(b = g[v]) && ++v < m;);
			y._next = b || null;
		}
	}
	return o = new Rs(o, r), o._enter = s, o._exit = c, o;
}
function xo(e) {
	return typeof e == "object" && "length" in e ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selection/exit.js
function So() {
	return new Rs(this._exit || this._groups.map(po), this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/join.js
function Co(e, t, n) {
	var r = this.enter(), i = this, a = this.exit();
	return typeof e == "function" ? (r = e(r), r &&= r.selection()) : r = r.append(e + ""), t != null && (i = t(i), i &&= i.selection()), n == null ? a.remove() : n(a), r && i ? r.merge(i).order() : i;
}
//#endregion
//#region node_modules/d3-selection/src/selection/merge.js
function wo(e) {
	for (var t = e.selection ? e.selection() : e, n = this._groups, r = t._groups, i = n.length, a = r.length, o = Math.min(i, a), s = Array(i), c = 0; c < o; ++c) for (var l = n[c], u = r[c], d = l.length, f = s[c] = Array(d), p, m = 0; m < d; ++m) (p = l[m] || u[m]) && (f[m] = p);
	for (; c < i; ++c) s[c] = n[c];
	return new Rs(s, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/order.js
function To() {
	for (var e = this._groups, t = -1, n = e.length; ++t < n;) for (var r = e[t], i = r.length - 1, a = r[i], o; --i >= 0;) (o = r[i]) && (a && o.compareDocumentPosition(a) ^ 4 && a.parentNode.insertBefore(o, a), a = o);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/sort.js
function Eo(e) {
	e ||= Do;
	function t(t, n) {
		return t && n ? e(t.__data__, n.__data__) : !t - !n;
	}
	for (var n = this._groups, r = n.length, i = Array(r), a = 0; a < r; ++a) {
		for (var o = n[a], s = o.length, c = i[a] = Array(s), l, u = 0; u < s; ++u) (l = o[u]) && (c[u] = l);
		c.sort(t);
	}
	return new Rs(i, this._parents).order();
}
function Do(e, t) {
	return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
//#endregion
//#region node_modules/d3-selection/src/selection/call.js
function Oo() {
	var e = arguments[0];
	return arguments[0] = this, e.apply(null, arguments), this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/nodes.js
function ko() {
	return Array.from(this);
}
//#endregion
//#region node_modules/d3-selection/src/selection/node.js
function Ao() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length; i < a; ++i) {
		var o = r[i];
		if (o) return o;
	}
	return null;
}
//#endregion
//#region node_modules/d3-selection/src/selection/size.js
function jo() {
	let e = 0;
	for (let t of this) ++e;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/selection/empty.js
function Mo() {
	return !this.node();
}
//#endregion
//#region node_modules/d3-selection/src/selection/each.js
function No(e) {
	for (var t = this._groups, n = 0, r = t.length; n < r; ++n) for (var i = t[n], a = 0, o = i.length, s; a < o; ++a) (s = i[a]) && e.call(s, s.__data__, a, i);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/attr.js
function Po(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function Fo(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function Io(e, t) {
	return function() {
		this.setAttribute(e, t);
	};
}
function Lo(e, t) {
	return function() {
		this.setAttributeNS(e.space, e.local, t);
	};
}
function Ro(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttribute(e) : this.setAttribute(e, n);
	};
}
function zo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttributeNS(e.space, e.local) : this.setAttributeNS(e.space, e.local, n);
	};
}
function Bo(e, t) {
	var n = Ua(e);
	if (arguments.length < 2) {
		var r = this.node();
		return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
	}
	return this.each((t == null ? n.local ? Fo : Po : typeof t == "function" ? n.local ? zo : Ro : n.local ? Lo : Io)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/window.js
function Vo(e) {
	return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
}
//#endregion
//#region node_modules/d3-selection/src/selection/style.js
function Ho(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function Uo(e, t, n) {
	return function() {
		this.style.setProperty(e, t, n);
	};
}
function Wo(e, t, n) {
	return function() {
		var r = t.apply(this, arguments);
		r == null ? this.style.removeProperty(e) : this.style.setProperty(e, r, n);
	};
}
function Go(e, t, n) {
	return arguments.length > 1 ? this.each((t == null ? Ho : typeof t == "function" ? Wo : Uo)(e, t, n ?? "")) : Ko(this.node(), e);
}
function Ko(e, t) {
	return e.style.getPropertyValue(t) || Vo(e).getComputedStyle(e, null).getPropertyValue(t);
}
//#endregion
//#region node_modules/d3-selection/src/selection/property.js
function qo(e) {
	return function() {
		delete this[e];
	};
}
function Jo(e, t) {
	return function() {
		this[e] = t;
	};
}
function Yo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? delete this[e] : this[e] = n;
	};
}
function Xo(e, t) {
	return arguments.length > 1 ? this.each((t == null ? qo : typeof t == "function" ? Yo : Jo)(e, t)) : this.node()[e];
}
//#endregion
//#region node_modules/d3-selection/src/selection/classed.js
function Zo(e) {
	return e.trim().split(/^|\s+/);
}
function Qo(e) {
	return e.classList || new $o(e);
}
function $o(e) {
	this._node = e, this._names = Zo(e.getAttribute("class") || "");
}
$o.prototype = {
	add: function(e) {
		this._names.indexOf(e) < 0 && (this._names.push(e), this._node.setAttribute("class", this._names.join(" ")));
	},
	remove: function(e) {
		var t = this._names.indexOf(e);
		t >= 0 && (this._names.splice(t, 1), this._node.setAttribute("class", this._names.join(" ")));
	},
	contains: function(e) {
		return this._names.indexOf(e) >= 0;
	}
};
function es(e, t) {
	for (var n = Qo(e), r = -1, i = t.length; ++r < i;) n.add(t[r]);
}
function ts(e, t) {
	for (var n = Qo(e), r = -1, i = t.length; ++r < i;) n.remove(t[r]);
}
function ns(e) {
	return function() {
		es(this, e);
	};
}
function rs(e) {
	return function() {
		ts(this, e);
	};
}
function is(e, t) {
	return function() {
		(t.apply(this, arguments) ? es : ts)(this, e);
	};
}
function as(e, t) {
	var n = Zo(e + "");
	if (arguments.length < 2) {
		for (var r = Qo(this.node()), i = -1, a = n.length; ++i < a;) if (!r.contains(n[i])) return !1;
		return !0;
	}
	return this.each((typeof t == "function" ? is : t ? ns : rs)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/text.js
function os() {
	this.textContent = "";
}
function ss(e) {
	return function() {
		this.textContent = e;
	};
}
function cs(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.textContent = t ?? "";
	};
}
function ls(e) {
	return arguments.length ? this.each(e == null ? os : (typeof e == "function" ? cs : ss)(e)) : this.node().textContent;
}
//#endregion
//#region node_modules/d3-selection/src/selection/html.js
function us() {
	this.innerHTML = "";
}
function ds(e) {
	return function() {
		this.innerHTML = e;
	};
}
function fs(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.innerHTML = t ?? "";
	};
}
function ps(e) {
	return arguments.length ? this.each(e == null ? us : (typeof e == "function" ? fs : ds)(e)) : this.node().innerHTML;
}
//#endregion
//#region node_modules/d3-selection/src/selection/raise.js
function ms() {
	this.nextSibling && this.parentNode.appendChild(this);
}
function hs() {
	return this.each(ms);
}
//#endregion
//#region node_modules/d3-selection/src/selection/lower.js
function gs() {
	this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function _s() {
	return this.each(gs);
}
//#endregion
//#region node_modules/d3-selection/src/selection/append.js
function vs(e) {
	var t = typeof e == "function" ? e : Ka(e);
	return this.select(function() {
		return this.appendChild(t.apply(this, arguments));
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/insert.js
function ys() {
	return null;
}
function bs(e, t) {
	var n = typeof e == "function" ? e : Ka(e), r = t == null ? ys : typeof t == "function" ? t : Ja(t);
	return this.select(function() {
		return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/remove.js
function xs() {
	var e = this.parentNode;
	e && e.removeChild(this);
}
function Ss() {
	return this.each(xs);
}
//#endregion
//#region node_modules/d3-selection/src/selection/clone.js
function Cs() {
	var e = this.cloneNode(!1), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function ws() {
	var e = this.cloneNode(!0), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function Ts(e) {
	return this.select(e ? ws : Cs);
}
//#endregion
//#region node_modules/d3-selection/src/selection/datum.js
function Es(e) {
	return arguments.length ? this.property("__data__", e) : this.node().__data__;
}
//#endregion
//#region node_modules/d3-selection/src/selection/on.js
function Ds(e) {
	return function(t) {
		e.call(this, t, this.__data__);
	};
}
function Os(e) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var t = "", n = e.indexOf(".");
		return n >= 0 && (t = e.slice(n + 1), e = e.slice(0, n)), {
			type: e,
			name: t
		};
	});
}
function ks(e) {
	return function() {
		var t = this.__on;
		if (t) {
			for (var n = 0, r = -1, i = t.length, a; n < i; ++n) a = t[n], (!e.type || a.type === e.type) && a.name === e.name ? this.removeEventListener(a.type, a.listener, a.options) : t[++r] = a;
			++r ? t.length = r : delete this.__on;
		}
	};
}
function As(e, t, n) {
	return function() {
		var r = this.__on, i, a = Ds(t);
		if (r) {
			for (var o = 0, s = r.length; o < s; ++o) if ((i = r[o]).type === e.type && i.name === e.name) {
				this.removeEventListener(i.type, i.listener, i.options), this.addEventListener(i.type, i.listener = a, i.options = n), i.value = t;
				return;
			}
		}
		this.addEventListener(e.type, a, n), i = {
			type: e.type,
			name: e.name,
			value: t,
			listener: a,
			options: n
		}, r ? r.push(i) : this.__on = [i];
	};
}
function js(e, t, n) {
	var r = Os(e + ""), i, a = r.length, o;
	if (arguments.length < 2) {
		var s = this.node().__on;
		if (s) {
			for (var c = 0, l = s.length, u; c < l; ++c) for (i = 0, u = s[c]; i < a; ++i) if ((o = r[i]).type === u.type && o.name === u.name) return u.value;
		}
		return;
	}
	for (s = t ? As : ks, i = 0; i < a; ++i) this.each(s(r[i], t, n));
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/dispatch.js
function Ms(e, t, n) {
	var r = Vo(e), i = r.CustomEvent;
	typeof i == "function" ? i = new i(t, n) : (i = r.document.createEvent("Event"), n ? (i.initEvent(t, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(t, !1, !1)), e.dispatchEvent(i);
}
function Ns(e, t) {
	return function() {
		return Ms(this, e, t);
	};
}
function Ps(e, t) {
	return function() {
		return Ms(this, e, t.apply(this, arguments));
	};
}
function Fs(e, t) {
	return this.each((typeof t == "function" ? Ps : Ns)(e, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/iterator.js
function* Is() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length, o; i < a; ++i) (o = r[i]) && (yield o);
}
//#endregion
//#region node_modules/d3-selection/src/selection/index.js
var Ls = [null];
function Rs(e, t) {
	this._groups = e, this._parents = t;
}
function zs() {
	return new Rs([[document.documentElement]], Ls);
}
function Bs() {
	return this;
}
Rs.prototype = zs.prototype = {
	constructor: Rs,
	select: Ya,
	selectAll: eo,
	selectChild: oo,
	selectChildren: uo,
	filter: fo,
	data: bo,
	enter: mo,
	exit: So,
	join: Co,
	merge: wo,
	selection: Bs,
	order: To,
	sort: Eo,
	call: Oo,
	nodes: ko,
	node: Ao,
	size: jo,
	empty: Mo,
	each: No,
	attr: Bo,
	style: Go,
	property: Xo,
	classed: as,
	text: ls,
	html: ps,
	raise: hs,
	lower: _s,
	append: vs,
	insert: bs,
	remove: Ss,
	clone: Ts,
	datum: Es,
	on: js,
	dispatch: Fs,
	[Symbol.iterator]: Is
};
//#endregion
//#region node_modules/d3-selection/src/select.js
function Vs(e) {
	return typeof e == "string" ? new Rs([[document.querySelector(e)]], [document.documentElement]) : new Rs([[e]], Ls);
}
//#endregion
//#region node_modules/d3-selection/src/sourceEvent.js
function Hs(e) {
	let t;
	for (; t = e.sourceEvent;) e = t;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/pointer.js
function Us(e, t) {
	if (e = Hs(e), t === void 0 && (t = e.currentTarget), t) {
		var n = t.ownerSVGElement || t;
		if (n.createSVGPoint) {
			var r = n.createSVGPoint();
			return r.x = e.clientX, r.y = e.clientY, r = r.matrixTransform(t.getScreenCTM().inverse()), [r.x, r.y];
		}
		if (t.getBoundingClientRect) {
			var i = t.getBoundingClientRect();
			return [e.clientX - i.left - t.clientLeft, e.clientY - i.top - t.clientTop];
		}
	}
	return [e.pageX, e.pageY];
}
//#endregion
//#region node_modules/d3-drag/src/noevent.js
var Ws = { passive: !1 }, Gs = {
	capture: !0,
	passive: !1
};
function Ks(e) {
	e.stopImmediatePropagation();
}
function qs(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-drag/src/nodrag.js
function Js(e) {
	var t = e.document.documentElement, n = Vs(e).on("dragstart.drag", qs, Gs);
	"onselectstart" in t ? n.on("selectstart.drag", qs, Gs) : (t.__noselect = t.style.MozUserSelect, t.style.MozUserSelect = "none");
}
function Ys(e, t) {
	var n = e.document.documentElement, r = Vs(e).on("dragstart.drag", null);
	t && (r.on("click.drag", qs, Gs), setTimeout(function() {
		r.on("click.drag", null);
	}, 0)), "onselectstart" in n ? r.on("selectstart.drag", null) : (n.style.MozUserSelect = n.__noselect, delete n.__noselect);
}
//#endregion
//#region node_modules/d3-drag/src/constant.js
var Xs = (e) => () => e;
//#endregion
//#region node_modules/d3-drag/src/event.js
function Zs(e, { sourceEvent: t, subject: n, target: r, identifier: i, active: a, x: o, y: s, dx: c, dy: l, dispatch: u }) {
	Object.defineProperties(this, {
		type: {
			value: e,
			enumerable: !0,
			configurable: !0
		},
		sourceEvent: {
			value: t,
			enumerable: !0,
			configurable: !0
		},
		subject: {
			value: n,
			enumerable: !0,
			configurable: !0
		},
		target: {
			value: r,
			enumerable: !0,
			configurable: !0
		},
		identifier: {
			value: i,
			enumerable: !0,
			configurable: !0
		},
		active: {
			value: a,
			enumerable: !0,
			configurable: !0
		},
		x: {
			value: o,
			enumerable: !0,
			configurable: !0
		},
		y: {
			value: s,
			enumerable: !0,
			configurable: !0
		},
		dx: {
			value: c,
			enumerable: !0,
			configurable: !0
		},
		dy: {
			value: l,
			enumerable: !0,
			configurable: !0
		},
		_: { value: u }
	});
}
Zs.prototype.on = function() {
	var e = this._.on.apply(this._, arguments);
	return e === this._ ? this : e;
};
//#endregion
//#region node_modules/d3-drag/src/drag.js
function Qs(e) {
	return !e.ctrlKey && !e.button;
}
function $s() {
	return this.parentNode;
}
function ec(e, t) {
	return t ?? {
		x: e.x,
		y: e.y
	};
}
function tc() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function nc() {
	var e = Qs, t = $s, n = ec, r = tc, i = {}, a = La("start", "drag", "end"), o = 0, s, c, l, u, d = 0;
	function f(e) {
		e.on("mousedown.drag", p).filter(r).on("touchstart.drag", g).on("touchmove.drag", _, Ws).on("touchend.drag touchcancel.drag", v).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	function p(n, r) {
		if (!u && e.call(this, n, r)) {
			var i = y(this, t.call(this, n, r), n, r, "mouse");
			i && (Vs(n.view).on("mousemove.drag", m, Gs).on("mouseup.drag", h, Gs), Js(n.view), Ks(n), l = !1, s = n.clientX, c = n.clientY, i("start", n));
		}
	}
	function m(e) {
		if (qs(e), !l) {
			var t = e.clientX - s, n = e.clientY - c;
			l = t * t + n * n > d;
		}
		i.mouse("drag", e);
	}
	function h(e) {
		Vs(e.view).on("mousemove.drag mouseup.drag", null), Ys(e.view, l), qs(e), i.mouse("end", e);
	}
	function g(n, r) {
		if (e.call(this, n, r)) for (var i = n.changedTouches, a = t.call(this, n, r), o = i.length, s = 0, c; s < o; ++s) (c = y(this, a, n, r, i[s].identifier, i[s])) && (Ks(n), c("start", n, i[s]));
	}
	function _(e) {
		for (var t = e.changedTouches, n = t.length, r = 0, a; r < n; ++r) (a = i[t[r].identifier]) && (qs(e), a("drag", e, t[r]));
	}
	function v(e) {
		var t = e.changedTouches, n = t.length, r, a;
		for (u && clearTimeout(u), u = setTimeout(function() {
			u = null;
		}, 500), r = 0; r < n; ++r) (a = i[t[r].identifier]) && (Ks(e), a("end", e, t[r]));
	}
	function y(e, t, r, s, c, l) {
		var u = a.copy(), d = Us(l || r, t), p, m, h;
		if ((h = n.call(e, new Zs("beforestart", {
			sourceEvent: r,
			target: f,
			identifier: c,
			active: o,
			x: d[0],
			y: d[1],
			dx: 0,
			dy: 0,
			dispatch: u
		}), s)) != null) return p = h.x - d[0] || 0, m = h.y - d[1] || 0, function n(r, a, l) {
			var g = d, _;
			switch (r) {
				case "start":
					i[c] = n, _ = o++;
					break;
				case "end": delete i[c], --o;
				case "drag": d = Us(l || a, t), _ = o;
			}
			u.call(r, e, new Zs(r, {
				sourceEvent: a,
				subject: h,
				target: f,
				identifier: c,
				active: _,
				x: d[0] + p,
				y: d[1] + m,
				dx: d[0] - g[0],
				dy: d[1] - g[1],
				dispatch: u
			}), s);
		};
	}
	return f.filter = function(t) {
		return arguments.length ? (e = typeof t == "function" ? t : Xs(!!t), f) : e;
	}, f.container = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : Xs(e), f) : t;
	}, f.subject = function(e) {
		return arguments.length ? (n = typeof e == "function" ? e : Xs(e), f) : n;
	}, f.touchable = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : Xs(!!e), f) : r;
	}, f.on = function() {
		var e = a.on.apply(a, arguments);
		return e === a ? f : e;
	}, f.clickDistance = function(e) {
		return arguments.length ? (d = (e = +e) * e, f) : Math.sqrt(d);
	}, f;
}
//#endregion
//#region node_modules/d3-color/src/define.js
function rc(e, t, n) {
	e.prototype = t.prototype = n, n.constructor = e;
}
function ic(e, t) {
	var n = Object.create(e.prototype);
	for (var r in t) n[r] = t[r];
	return n;
}
//#endregion
//#region node_modules/d3-color/src/color.js
function ac() {}
var oc = .7, sc = 1 / oc, cc = "\\s*([+-]?\\d+)\\s*", lc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", uc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", dc = /^#([0-9a-f]{3,8})$/, fc = RegExp(`^rgb\\(${cc},${cc},${cc}\\)$`), pc = RegExp(`^rgb\\(${uc},${uc},${uc}\\)$`), mc = RegExp(`^rgba\\(${cc},${cc},${cc},${lc}\\)$`), hc = RegExp(`^rgba\\(${uc},${uc},${uc},${lc}\\)$`), gc = RegExp(`^hsl\\(${lc},${uc},${uc}\\)$`), _c = RegExp(`^hsla\\(${lc},${uc},${uc},${lc}\\)$`), vc = {
	aliceblue: 15792383,
	antiquewhite: 16444375,
	aqua: 65535,
	aquamarine: 8388564,
	azure: 15794175,
	beige: 16119260,
	bisque: 16770244,
	black: 0,
	blanchedalmond: 16772045,
	blue: 255,
	blueviolet: 9055202,
	brown: 10824234,
	burlywood: 14596231,
	cadetblue: 6266528,
	chartreuse: 8388352,
	chocolate: 13789470,
	coral: 16744272,
	cornflowerblue: 6591981,
	cornsilk: 16775388,
	crimson: 14423100,
	cyan: 65535,
	darkblue: 139,
	darkcyan: 35723,
	darkgoldenrod: 12092939,
	darkgray: 11119017,
	darkgreen: 25600,
	darkgrey: 11119017,
	darkkhaki: 12433259,
	darkmagenta: 9109643,
	darkolivegreen: 5597999,
	darkorange: 16747520,
	darkorchid: 10040012,
	darkred: 9109504,
	darksalmon: 15308410,
	darkseagreen: 9419919,
	darkslateblue: 4734347,
	darkslategray: 3100495,
	darkslategrey: 3100495,
	darkturquoise: 52945,
	darkviolet: 9699539,
	deeppink: 16716947,
	deepskyblue: 49151,
	dimgray: 6908265,
	dimgrey: 6908265,
	dodgerblue: 2003199,
	firebrick: 11674146,
	floralwhite: 16775920,
	forestgreen: 2263842,
	fuchsia: 16711935,
	gainsboro: 14474460,
	ghostwhite: 16316671,
	gold: 16766720,
	goldenrod: 14329120,
	gray: 8421504,
	green: 32768,
	greenyellow: 11403055,
	grey: 8421504,
	honeydew: 15794160,
	hotpink: 16738740,
	indianred: 13458524,
	indigo: 4915330,
	ivory: 16777200,
	khaki: 15787660,
	lavender: 15132410,
	lavenderblush: 16773365,
	lawngreen: 8190976,
	lemonchiffon: 16775885,
	lightblue: 11393254,
	lightcoral: 15761536,
	lightcyan: 14745599,
	lightgoldenrodyellow: 16448210,
	lightgray: 13882323,
	lightgreen: 9498256,
	lightgrey: 13882323,
	lightpink: 16758465,
	lightsalmon: 16752762,
	lightseagreen: 2142890,
	lightskyblue: 8900346,
	lightslategray: 7833753,
	lightslategrey: 7833753,
	lightsteelblue: 11584734,
	lightyellow: 16777184,
	lime: 65280,
	limegreen: 3329330,
	linen: 16445670,
	magenta: 16711935,
	maroon: 8388608,
	mediumaquamarine: 6737322,
	mediumblue: 205,
	mediumorchid: 12211667,
	mediumpurple: 9662683,
	mediumseagreen: 3978097,
	mediumslateblue: 8087790,
	mediumspringgreen: 64154,
	mediumturquoise: 4772300,
	mediumvioletred: 13047173,
	midnightblue: 1644912,
	mintcream: 16121850,
	mistyrose: 16770273,
	moccasin: 16770229,
	navajowhite: 16768685,
	navy: 128,
	oldlace: 16643558,
	olive: 8421376,
	olivedrab: 7048739,
	orange: 16753920,
	orangered: 16729344,
	orchid: 14315734,
	palegoldenrod: 15657130,
	palegreen: 10025880,
	paleturquoise: 11529966,
	palevioletred: 14381203,
	papayawhip: 16773077,
	peachpuff: 16767673,
	peru: 13468991,
	pink: 16761035,
	plum: 14524637,
	powderblue: 11591910,
	purple: 8388736,
	rebeccapurple: 6697881,
	red: 16711680,
	rosybrown: 12357519,
	royalblue: 4286945,
	saddlebrown: 9127187,
	salmon: 16416882,
	sandybrown: 16032864,
	seagreen: 3050327,
	seashell: 16774638,
	sienna: 10506797,
	silver: 12632256,
	skyblue: 8900331,
	slateblue: 6970061,
	slategray: 7372944,
	slategrey: 7372944,
	snow: 16775930,
	springgreen: 65407,
	steelblue: 4620980,
	tan: 13808780,
	teal: 32896,
	thistle: 14204888,
	tomato: 16737095,
	turquoise: 4251856,
	violet: 15631086,
	wheat: 16113331,
	white: 16777215,
	whitesmoke: 16119285,
	yellow: 16776960,
	yellowgreen: 10145074
};
rc(ac, Cc, {
	copy(e) {
		return Object.assign(new this.constructor(), this, e);
	},
	displayable() {
		return this.rgb().displayable();
	},
	hex: yc,
	formatHex: yc,
	formatHex8: bc,
	formatHsl: xc,
	formatRgb: Sc,
	toString: Sc
});
function yc() {
	return this.rgb().formatHex();
}
function bc() {
	return this.rgb().formatHex8();
}
function xc() {
	return Ic(this).formatHsl();
}
function Sc() {
	return this.rgb().formatRgb();
}
function Cc(e) {
	var t, n;
	return e = (e + "").trim().toLowerCase(), (t = dc.exec(e)) ? (n = t[1].length, t = parseInt(t[1], 16), n === 6 ? wc(t) : n === 3 ? new Oc(t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, (t & 15) << 4 | t & 15, 1) : n === 8 ? Tc(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, (t & 255) / 255) : n === 4 ? Tc(t >> 12 & 15 | t >> 8 & 240, t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, ((t & 15) << 4 | t & 15) / 255) : null) : (t = fc.exec(e)) ? new Oc(t[1], t[2], t[3], 1) : (t = pc.exec(e)) ? new Oc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, 1) : (t = mc.exec(e)) ? Tc(t[1], t[2], t[3], t[4]) : (t = hc.exec(e)) ? Tc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, t[4]) : (t = gc.exec(e)) ? Fc(t[1], t[2] / 100, t[3] / 100, 1) : (t = _c.exec(e)) ? Fc(t[1], t[2] / 100, t[3] / 100, t[4]) : vc.hasOwnProperty(e) ? wc(vc[e]) : e === "transparent" ? new Oc(NaN, NaN, NaN, 0) : null;
}
function wc(e) {
	return new Oc(e >> 16 & 255, e >> 8 & 255, e & 255, 1);
}
function Tc(e, t, n, r) {
	return r <= 0 && (e = t = n = NaN), new Oc(e, t, n, r);
}
function Ec(e) {
	return e instanceof ac || (e = Cc(e)), e ? (e = e.rgb(), new Oc(e.r, e.g, e.b, e.opacity)) : new Oc();
}
function Dc(e, t, n, r) {
	return arguments.length === 1 ? Ec(e) : new Oc(e, t, n, r ?? 1);
}
function Oc(e, t, n, r) {
	this.r = +e, this.g = +t, this.b = +n, this.opacity = +r;
}
rc(Oc, Dc, ic(ac, {
	brighter(e) {
		return e = e == null ? sc : sc ** +e, new Oc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? oc : oc ** +e, new Oc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	rgb() {
		return this;
	},
	clamp() {
		return new Oc(Nc(this.r), Nc(this.g), Nc(this.b), Mc(this.opacity));
	},
	displayable() {
		return -.5 <= this.r && this.r < 255.5 && -.5 <= this.g && this.g < 255.5 && -.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
	},
	hex: kc,
	formatHex: kc,
	formatHex8: Ac,
	formatRgb: jc,
	toString: jc
}));
function kc() {
	return `#${Pc(this.r)}${Pc(this.g)}${Pc(this.b)}`;
}
function Ac() {
	return `#${Pc(this.r)}${Pc(this.g)}${Pc(this.b)}${Pc((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function jc() {
	let e = Mc(this.opacity);
	return `${e === 1 ? "rgb(" : "rgba("}${Nc(this.r)}, ${Nc(this.g)}, ${Nc(this.b)}${e === 1 ? ")" : `, ${e})`}`;
}
function Mc(e) {
	return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function Nc(e) {
	return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function Pc(e) {
	return e = Nc(e), (e < 16 ? "0" : "") + e.toString(16);
}
function Fc(e, t, n, r) {
	return r <= 0 ? e = t = n = NaN : n <= 0 || n >= 1 ? e = t = NaN : t <= 0 && (e = NaN), new Rc(e, t, n, r);
}
function Ic(e) {
	if (e instanceof Rc) return new Rc(e.h, e.s, e.l, e.opacity);
	if (e instanceof ac || (e = Cc(e)), !e) return new Rc();
	if (e instanceof Rc) return e;
	e = e.rgb();
	var t = e.r / 255, n = e.g / 255, r = e.b / 255, i = Math.min(t, n, r), a = Math.max(t, n, r), o = NaN, s = a - i, c = (a + i) / 2;
	return s ? (o = t === a ? (n - r) / s + (n < r) * 6 : n === a ? (r - t) / s + 2 : (t - n) / s + 4, s /= c < .5 ? a + i : 2 - a - i, o *= 60) : s = c > 0 && c < 1 ? 0 : o, new Rc(o, s, c, e.opacity);
}
function Lc(e, t, n, r) {
	return arguments.length === 1 ? Ic(e) : new Rc(e, t, n, r ?? 1);
}
function Rc(e, t, n, r) {
	this.h = +e, this.s = +t, this.l = +n, this.opacity = +r;
}
rc(Rc, Lc, ic(ac, {
	brighter(e) {
		return e = e == null ? sc : sc ** +e, new Rc(this.h, this.s, this.l * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? oc : oc ** +e, new Rc(this.h, this.s, this.l * e, this.opacity);
	},
	rgb() {
		var e = this.h % 360 + (this.h < 0) * 360, t = isNaN(e) || isNaN(this.s) ? 0 : this.s, n = this.l, r = n + (n < .5 ? n : 1 - n) * t, i = 2 * n - r;
		return new Oc(Vc(e >= 240 ? e - 240 : e + 120, i, r), Vc(e, i, r), Vc(e < 120 ? e + 240 : e - 120, i, r), this.opacity);
	},
	clamp() {
		return new Rc(zc(this.h), Bc(this.s), Bc(this.l), Mc(this.opacity));
	},
	displayable() {
		return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
	},
	formatHsl() {
		let e = Mc(this.opacity);
		return `${e === 1 ? "hsl(" : "hsla("}${zc(this.h)}, ${Bc(this.s) * 100}%, ${Bc(this.l) * 100}%${e === 1 ? ")" : `, ${e})`}`;
	}
}));
function zc(e) {
	return e = (e || 0) % 360, e < 0 ? e + 360 : e;
}
function Bc(e) {
	return Math.max(0, Math.min(1, e || 0));
}
function Vc(e, t, n) {
	return (e < 60 ? t + (n - t) * e / 60 : e < 180 ? n : e < 240 ? t + (n - t) * (240 - e) / 60 : t) * 255;
}
//#endregion
//#region node_modules/d3-interpolate/src/constant.js
var Hc = (e) => () => e;
//#endregion
//#region node_modules/d3-interpolate/src/color.js
function Uc(e, t) {
	return function(n) {
		return e + n * t;
	};
}
function Wc(e, t, n) {
	return e **= +n, t = t ** +n - e, n = 1 / n, function(r) {
		return (e + r * t) ** +n;
	};
}
function Gc(e) {
	return (e = +e) == 1 ? Kc : function(t, n) {
		return n - t ? Wc(t, n, e) : Hc(isNaN(t) ? n : t);
	};
}
function Kc(e, t) {
	var n = t - e;
	return n ? Uc(e, n) : Hc(isNaN(e) ? t : e);
}
//#endregion
//#region node_modules/d3-interpolate/src/rgb.js
var qc = (function e(t) {
	var n = Gc(t);
	function r(e, t) {
		var r = n((e = Dc(e)).r, (t = Dc(t)).r), i = n(e.g, t.g), a = n(e.b, t.b), o = Kc(e.opacity, t.opacity);
		return function(t) {
			return e.r = r(t), e.g = i(t), e.b = a(t), e.opacity = o(t), e + "";
		};
	}
	return r.gamma = e, r;
})(1);
//#endregion
//#region node_modules/d3-interpolate/src/numberArray.js
function Jc(e, t) {
	t ||= [];
	var n = e ? Math.min(t.length, e.length) : 0, r = t.slice(), i;
	return function(a) {
		for (i = 0; i < n; ++i) r[i] = e[i] * (1 - a) + t[i] * a;
		return r;
	};
}
function Yc(e) {
	return ArrayBuffer.isView(e) && !(e instanceof DataView);
}
//#endregion
//#region node_modules/d3-interpolate/src/array.js
function Xc(e, t) {
	for (var n = t ? t.length : 0, r = e ? Math.min(n, e.length) : 0, i = Array(r), a = Array(n), o = 0; o < r; ++o) i[o] = al(e[o], t[o]);
	for (; o < n; ++o) a[o] = t[o];
	return function(e) {
		for (o = 0; o < r; ++o) a[o] = i[o](e);
		return a;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/date.js
function Zc(e, t) {
	var n = /* @__PURE__ */ new Date();
	return e = +e, t = +t, function(r) {
		return n.setTime(e * (1 - r) + t * r), n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/number.js
function Qc(e, t) {
	return e = +e, t = +t, function(n) {
		return e * (1 - n) + t * n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/object.js
function $c(e, t) {
	var n = {}, r = {}, i;
	for (i in (typeof e != "object" || !e) && (e = {}), (typeof t != "object" || !t) && (t = {}), t) i in e ? n[i] = al(e[i], t[i]) : r[i] = t[i];
	return function(e) {
		for (i in n) r[i] = n[i](e);
		return r;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/string.js
var el = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, tl = new RegExp(el.source, "g");
function nl(e) {
	return function() {
		return e;
	};
}
function rl(e) {
	return function(t) {
		return e(t) + "";
	};
}
function il(e, t) {
	var n = el.lastIndex = tl.lastIndex = 0, r, i, a, o = -1, s = [], c = [];
	for (e += "", t += ""; (r = el.exec(e)) && (i = tl.exec(t));) (a = i.index) > n && (a = t.slice(n, a), s[o] ? s[o] += a : s[++o] = a), (r = r[0]) === (i = i[0]) ? s[o] ? s[o] += i : s[++o] = i : (s[++o] = null, c.push({
		i: o,
		x: Qc(r, i)
	})), n = tl.lastIndex;
	return n < t.length && (a = t.slice(n), s[o] ? s[o] += a : s[++o] = a), s.length < 2 ? c[0] ? rl(c[0].x) : nl(t) : (t = c.length, function(e) {
		for (var n = 0, r; n < t; ++n) s[(r = c[n]).i] = r.x(e);
		return s.join("");
	});
}
//#endregion
//#region node_modules/d3-interpolate/src/value.js
function al(e, t) {
	var n = typeof t, r;
	return t == null || n === "boolean" ? Hc(t) : (n === "number" ? Qc : n === "string" ? (r = Cc(t)) ? (t = r, qc) : il : t instanceof Cc ? qc : t instanceof Date ? Zc : Yc(t) ? Jc : Array.isArray(t) ? Xc : typeof t.valueOf != "function" && typeof t.toString != "function" || isNaN(t) ? $c : Qc)(e, t);
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/decompose.js
var ol = 180 / Math.PI, sl = {
	translateX: 0,
	translateY: 0,
	rotate: 0,
	skewX: 0,
	scaleX: 1,
	scaleY: 1
};
function cl(e, t, n, r, i, a) {
	var o, s, c;
	return (o = Math.sqrt(e * e + t * t)) && (e /= o, t /= o), (c = e * n + t * r) && (n -= e * c, r -= t * c), (s = Math.sqrt(n * n + r * r)) && (n /= s, r /= s, c /= s), e * r < t * n && (e = -e, t = -t, c = -c, o = -o), {
		translateX: i,
		translateY: a,
		rotate: Math.atan2(t, e) * ol,
		skewX: Math.atan(c) * ol,
		scaleX: o,
		scaleY: s
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/parse.js
var ll;
function ul(e) {
	let t = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(e + "");
	return t.isIdentity ? sl : cl(t.a, t.b, t.c, t.d, t.e, t.f);
}
function dl(e) {
	return e == null || (ll ||= document.createElementNS("http://www.w3.org/2000/svg", "g"), ll.setAttribute("transform", e), !(e = ll.transform.baseVal.consolidate())) ? sl : (e = e.matrix, cl(e.a, e.b, e.c, e.d, e.e, e.f));
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/index.js
function fl(e, t, n, r) {
	function i(e) {
		return e.length ? e.pop() + " " : "";
	}
	function a(e, r, i, a, o, s) {
		if (e !== i || r !== a) {
			var c = o.push("translate(", null, t, null, n);
			s.push({
				i: c - 4,
				x: Qc(e, i)
			}, {
				i: c - 2,
				x: Qc(r, a)
			});
		} else (i || a) && o.push("translate(" + i + t + a + n);
	}
	function o(e, t, n, a) {
		e === t ? t && n.push(i(n) + "rotate(" + t + r) : (e - t > 180 ? t += 360 : t - e > 180 && (e += 360), a.push({
			i: n.push(i(n) + "rotate(", null, r) - 2,
			x: Qc(e, t)
		}));
	}
	function s(e, t, n, a) {
		e === t ? t && n.push(i(n) + "skewX(" + t + r) : a.push({
			i: n.push(i(n) + "skewX(", null, r) - 2,
			x: Qc(e, t)
		});
	}
	function c(e, t, n, r, a, o) {
		if (e !== n || t !== r) {
			var s = a.push(i(a) + "scale(", null, ",", null, ")");
			o.push({
				i: s - 4,
				x: Qc(e, n)
			}, {
				i: s - 2,
				x: Qc(t, r)
			});
		} else (n !== 1 || r !== 1) && a.push(i(a) + "scale(" + n + "," + r + ")");
	}
	return function(t, n) {
		var r = [], i = [];
		return t = e(t), n = e(n), a(t.translateX, t.translateY, n.translateX, n.translateY, r, i), o(t.rotate, n.rotate, r, i), s(t.skewX, n.skewX, r, i), c(t.scaleX, t.scaleY, n.scaleX, n.scaleY, r, i), t = n = null, function(e) {
			for (var t = -1, n = i.length, a; ++t < n;) r[(a = i[t]).i] = a.x(e);
			return r.join("");
		};
	};
}
var pl = fl(ul, "px, ", "px)", "deg)"), ml = fl(dl, ", ", ")", ")"), hl = 1e-12;
function gl(e) {
	return ((e = Math.exp(e)) + 1 / e) / 2;
}
function _l(e) {
	return ((e = Math.exp(e)) - 1 / e) / 2;
}
function vl(e) {
	return ((e = Math.exp(2 * e)) - 1) / (e + 1);
}
var yl = (function e(t, n, r) {
	function i(e, i) {
		var a = e[0], o = e[1], s = e[2], c = i[0], l = i[1], u = i[2], d = c - a, f = l - o, p = d * d + f * f, m, h;
		if (p < hl) h = Math.log(u / s) / t, m = function(e) {
			return [
				a + e * d,
				o + e * f,
				s * Math.exp(t * e * h)
			];
		};
		else {
			var g = Math.sqrt(p), _ = (u * u - s * s + r * p) / (2 * s * n * g), v = (u * u - s * s - r * p) / (2 * u * n * g), y = Math.log(Math.sqrt(_ * _ + 1) - _);
			h = (Math.log(Math.sqrt(v * v + 1) - v) - y) / t, m = function(e) {
				var r = e * h, i = gl(y), c = s / (n * g) * (i * vl(t * r + y) - _l(y));
				return [
					a + c * d,
					o + c * f,
					s * i / gl(t * r + y)
				];
			};
		}
		return m.duration = h * 1e3 * t / Math.SQRT2, m;
	}
	return i.rho = function(t) {
		var n = Math.max(.001, +t), r = n * n;
		return e(n, r, r * r);
	}, i;
})(Math.SQRT2, 2, 4), bl = 0, xl = 0, Sl = 0, Cl = 1e3, wl, Tl, El = 0, Dl = 0, Ol = 0, kl = typeof performance == "object" && performance.now ? performance : Date, Al = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(e) {
	setTimeout(e, 17);
};
function jl() {
	return Dl ||= (Al(Ml), kl.now() + Ol);
}
function Ml() {
	Dl = 0;
}
function Nl() {
	this._call = this._time = this._next = null;
}
Nl.prototype = Pl.prototype = {
	constructor: Nl,
	restart: function(e, t, n) {
		if (typeof e != "function") throw TypeError("callback is not a function");
		n = (n == null ? jl() : +n) + (t == null ? 0 : +t), !this._next && Tl !== this && (Tl ? Tl._next = this : wl = this, Tl = this), this._call = e, this._time = n, zl();
	},
	stop: function() {
		this._call && (this._call = null, this._time = Infinity, zl());
	}
};
function Pl(e, t, n) {
	var r = new Nl();
	return r.restart(e, t, n), r;
}
function Fl() {
	jl(), ++bl;
	for (var e = wl, t; e;) (t = Dl - e._time) >= 0 && e._call.call(void 0, t), e = e._next;
	--bl;
}
function Il() {
	Dl = (El = kl.now()) + Ol, bl = xl = 0;
	try {
		Fl();
	} finally {
		bl = 0, Rl(), Dl = 0;
	}
}
function Ll() {
	var e = kl.now(), t = e - El;
	t > Cl && (Ol -= t, El = e);
}
function Rl() {
	for (var e, t = wl, n, r = Infinity; t;) t._call ? (r > t._time && (r = t._time), e = t, t = t._next) : (n = t._next, t._next = null, t = e ? e._next = n : wl = n);
	Tl = e, zl(r);
}
function zl(e) {
	bl || (xl &&= clearTimeout(xl), e - Dl > 24 ? (e < Infinity && (xl = setTimeout(Il, e - kl.now() - Ol)), Sl &&= clearInterval(Sl)) : (Sl ||= (El = kl.now(), setInterval(Ll, Cl)), bl = 1, Al(Il)));
}
//#endregion
//#region node_modules/d3-timer/src/timeout.js
function Bl(e, t, n) {
	var r = new Nl();
	return t = t == null ? 0 : +t, r.restart((n) => {
		r.stop(), e(n + t);
	}, t, n), r;
}
//#endregion
//#region node_modules/d3-transition/src/transition/schedule.js
var Vl = La("start", "end", "cancel", "interrupt"), Hl = [];
function Ul(e, t, n, r, i, a) {
	var o = e.__transition;
	if (!o) e.__transition = {};
	else if (n in o) return;
	ql(e, n, {
		name: t,
		index: r,
		group: i,
		on: Vl,
		tween: Hl,
		time: a.time,
		delay: a.delay,
		duration: a.duration,
		ease: a.ease,
		timer: null,
		state: 0
	});
}
function Wl(e, t) {
	var n = Kl(e, t);
	if (n.state > 0) throw Error("too late; already scheduled");
	return n;
}
function Gl(e, t) {
	var n = Kl(e, t);
	if (n.state > 3) throw Error("too late; already running");
	return n;
}
function Kl(e, t) {
	var n = e.__transition;
	if (!n || !(n = n[t])) throw Error("transition not found");
	return n;
}
function ql(e, t, n) {
	var r = e.__transition, i;
	r[t] = n, n.timer = Pl(a, 0, n.time);
	function a(e) {
		n.state = 1, n.timer.restart(o, n.delay, n.time), n.delay <= e && o(e - n.delay);
	}
	function o(a) {
		var l, u, d, f;
		if (n.state !== 1) return c();
		for (l in r) if (f = r[l], f.name === n.name) {
			if (f.state === 3) return Bl(o);
			f.state === 4 ? (f.state = 6, f.timer.stop(), f.on.call("interrupt", e, e.__data__, f.index, f.group), delete r[l]) : +l < t && (f.state = 6, f.timer.stop(), f.on.call("cancel", e, e.__data__, f.index, f.group), delete r[l]);
		}
		if (Bl(function() {
			n.state === 3 && (n.state = 4, n.timer.restart(s, n.delay, n.time), s(a));
		}), n.state = 2, n.on.call("start", e, e.__data__, n.index, n.group), n.state === 2) {
			for (n.state = 3, i = Array(d = n.tween.length), l = 0, u = -1; l < d; ++l) (f = n.tween[l].value.call(e, e.__data__, n.index, n.group)) && (i[++u] = f);
			i.length = u + 1;
		}
	}
	function s(t) {
		for (var r = t < n.duration ? n.ease.call(null, t / n.duration) : (n.timer.restart(c), n.state = 5, 1), a = -1, o = i.length; ++a < o;) i[a].call(e, r);
		n.state === 5 && (n.on.call("end", e, e.__data__, n.index, n.group), c());
	}
	function c() {
		for (var i in n.state = 6, n.timer.stop(), delete r[t], r) return;
		delete e.__transition;
	}
}
//#endregion
//#region node_modules/d3-transition/src/interrupt.js
function Jl(e, t) {
	var n = e.__transition, r, i, a = !0, o;
	if (n) {
		for (o in t = t == null ? null : t + "", n) {
			if ((r = n[o]).name !== t) {
				a = !1;
				continue;
			}
			i = r.state > 2 && r.state < 5, r.state = 6, r.timer.stop(), r.on.call(i ? "interrupt" : "cancel", e, e.__data__, r.index, r.group), delete n[o];
		}
		a && delete e.__transition;
	}
}
//#endregion
//#region node_modules/d3-transition/src/selection/interrupt.js
function Yl(e) {
	return this.each(function() {
		Jl(this, e);
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/tween.js
function Xl(e, t) {
	var n, r;
	return function() {
		var i = Gl(this, e), a = i.tween;
		if (a !== n) {
			r = n = a;
			for (var o = 0, s = r.length; o < s; ++o) if (r[o].name === t) {
				r = r.slice(), r.splice(o, 1);
				break;
			}
		}
		i.tween = r;
	};
}
function Zl(e, t, n) {
	var r, i;
	if (typeof n != "function") throw Error();
	return function() {
		var a = Gl(this, e), o = a.tween;
		if (o !== r) {
			i = (r = o).slice();
			for (var s = {
				name: t,
				value: n
			}, c = 0, l = i.length; c < l; ++c) if (i[c].name === t) {
				i[c] = s;
				break;
			}
			c === l && i.push(s);
		}
		a.tween = i;
	};
}
function Ql(e, t) {
	var n = this._id;
	if (e += "", arguments.length < 2) {
		for (var r = Kl(this.node(), n).tween, i = 0, a = r.length, o; i < a; ++i) if ((o = r[i]).name === e) return o.value;
		return null;
	}
	return this.each((t == null ? Xl : Zl)(n, e, t));
}
function $l(e, t, n) {
	var r = e._id;
	return e.each(function() {
		var e = Gl(this, r);
		(e.value ||= {})[t] = n.apply(this, arguments);
	}), function(e) {
		return Kl(e, r).value[t];
	};
}
//#endregion
//#region node_modules/d3-transition/src/transition/interpolate.js
function eu(e, t) {
	var n;
	return (typeof t == "number" ? Qc : t instanceof Cc ? qc : (n = Cc(t)) ? (t = n, qc) : il)(e, t);
}
//#endregion
//#region node_modules/d3-transition/src/transition/attr.js
function tu(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function nu(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function ru(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttribute(e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function iu(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttributeNS(e.space, e.local);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function au(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttribute(e) : (o = this.getAttribute(e), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function ou(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttributeNS(e.space, e.local) : (o = this.getAttributeNS(e.space, e.local), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function su(e, t) {
	var n = Ua(e), r = n === "transform" ? ml : eu;
	return this.attrTween(e, typeof t == "function" ? (n.local ? ou : au)(n, r, $l(this, "attr." + e, t)) : t == null ? (n.local ? nu : tu)(n) : (n.local ? iu : ru)(n, r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/attrTween.js
function cu(e, t) {
	return function(n) {
		this.setAttribute(e, t.call(this, n));
	};
}
function lu(e, t) {
	return function(n) {
		this.setAttributeNS(e.space, e.local, t.call(this, n));
	};
}
function uu(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && lu(e, i)), n;
	}
	return i._value = t, i;
}
function du(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && cu(e, i)), n;
	}
	return i._value = t, i;
}
function fu(e, t) {
	var n = "attr." + e;
	if (arguments.length < 2) return (n = this.tween(n)) && n._value;
	if (t == null) return this.tween(n, null);
	if (typeof t != "function") throw Error();
	var r = Ua(e);
	return this.tween(n, (r.local ? uu : du)(r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/delay.js
function pu(e, t) {
	return function() {
		Wl(this, e).delay = +t.apply(this, arguments);
	};
}
function mu(e, t) {
	return t = +t, function() {
		Wl(this, e).delay = t;
	};
}
function hu(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? pu : mu)(t, e)) : Kl(this.node(), t).delay;
}
//#endregion
//#region node_modules/d3-transition/src/transition/duration.js
function gu(e, t) {
	return function() {
		Gl(this, e).duration = +t.apply(this, arguments);
	};
}
function _u(e, t) {
	return t = +t, function() {
		Gl(this, e).duration = t;
	};
}
function vu(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? gu : _u)(t, e)) : Kl(this.node(), t).duration;
}
//#endregion
//#region node_modules/d3-transition/src/transition/ease.js
function yu(e, t) {
	if (typeof t != "function") throw Error();
	return function() {
		Gl(this, e).ease = t;
	};
}
function bu(e) {
	var t = this._id;
	return arguments.length ? this.each(yu(t, e)) : Kl(this.node(), t).ease;
}
//#endregion
//#region node_modules/d3-transition/src/transition/easeVarying.js
function xu(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		if (typeof n != "function") throw Error();
		Gl(this, e).ease = n;
	};
}
function Su(e) {
	if (typeof e != "function") throw Error();
	return this.each(xu(this._id, e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/filter.js
function Cu(e) {
	typeof e != "function" && (e = to(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Qu(r, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/merge.js
function wu(e) {
	if (e._id !== this._id) throw Error();
	for (var t = this._groups, n = e._groups, r = t.length, i = n.length, a = Math.min(r, i), o = Array(r), s = 0; s < a; ++s) for (var c = t[s], l = n[s], u = c.length, d = o[s] = Array(u), f, p = 0; p < u; ++p) (f = c[p] || l[p]) && (d[p] = f);
	for (; s < r; ++s) o[s] = t[s];
	return new Qu(o, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/on.js
function Tu(e) {
	return (e + "").trim().split(/^|\s+/).every(function(e) {
		var t = e.indexOf(".");
		return t >= 0 && (e = e.slice(0, t)), !e || e === "start";
	});
}
function Eu(e, t, n) {
	var r, i, a = Tu(t) ? Wl : Gl;
	return function() {
		var o = a(this, e), s = o.on;
		s !== r && (i = (r = s).copy()).on(t, n), o.on = i;
	};
}
function Du(e, t) {
	var n = this._id;
	return arguments.length < 2 ? Kl(this.node(), n).on.on(e) : this.each(Eu(n, e, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/remove.js
function Ou(e) {
	return function() {
		var t = this.parentNode;
		for (var n in this.__transition) if (+n !== e) return;
		t && t.removeChild(this);
	};
}
function ku() {
	return this.on("end.remove", Ou(this._id));
}
//#endregion
//#region node_modules/d3-transition/src/transition/select.js
function Au(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = Ja(e));
	for (var r = this._groups, i = r.length, a = Array(i), o = 0; o < i; ++o) for (var s = r[o], c = s.length, l = a[o] = Array(c), u, d, f = 0; f < c; ++f) (u = s[f]) && (d = e.call(u, u.__data__, f, s)) && ("__data__" in u && (d.__data__ = u.__data__), l[f] = d, Ul(l[f], t, n, f, l, Kl(u, n)));
	return new Qu(a, this._parents, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selectAll.js
function ju(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = Qa(e));
	for (var r = this._groups, i = r.length, a = [], o = [], s = 0; s < i; ++s) for (var c = r[s], l = c.length, u, d = 0; d < l; ++d) if (u = c[d]) {
		for (var f = e.call(u, u.__data__, d, c), p, m = Kl(u, n), h = 0, g = f.length; h < g; ++h) (p = f[h]) && Ul(p, t, n, h, f, m);
		a.push(f), o.push(u);
	}
	return new Qu(a, o, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selection.js
var Mu = zs.prototype.constructor;
function Nu() {
	return new Mu(this._groups, this._parents);
}
//#endregion
//#region node_modules/d3-transition/src/transition/style.js
function Pu(e, t) {
	var n, r, i;
	return function() {
		var a = Ko(this, e), o = (this.style.removeProperty(e), Ko(this, e));
		return a === o ? null : a === n && o === r ? i : i = t(n = a, r = o);
	};
}
function Fu(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function Iu(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = Ko(this, e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function Lu(e, t, n) {
	var r, i, a;
	return function() {
		var o = Ko(this, e), s = n(this), c = s + "";
		return s ?? (c = s = (this.style.removeProperty(e), Ko(this, e))), o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s));
	};
}
function Ru(e, t) {
	var n, r, i, a = "style." + t, o = "end." + a, s;
	return function() {
		var c = Gl(this, e), l = c.on, u = c.value[a] == null ? s ||= Fu(t) : void 0;
		(l !== n || i !== u) && (r = (n = l).copy()).on(o, i = u), c.on = r;
	};
}
function zu(e, t, n) {
	var r = (e += "") == "transform" ? pl : eu;
	return t == null ? this.styleTween(e, Pu(e, r)).on("end.style." + e, Fu(e)) : typeof t == "function" ? this.styleTween(e, Lu(e, r, $l(this, "style." + e, t))).each(Ru(this._id, e)) : this.styleTween(e, Iu(e, r, t), n).on("end.style." + e, null);
}
//#endregion
//#region node_modules/d3-transition/src/transition/styleTween.js
function Bu(e, t, n) {
	return function(r) {
		this.style.setProperty(e, t.call(this, r), n);
	};
}
function Vu(e, t, n) {
	var r, i;
	function a() {
		var a = t.apply(this, arguments);
		return a !== i && (r = (i = a) && Bu(e, a, n)), r;
	}
	return a._value = t, a;
}
function Hu(e, t, n) {
	var r = "style." + (e += "");
	if (arguments.length < 2) return (r = this.tween(r)) && r._value;
	if (t == null) return this.tween(r, null);
	if (typeof t != "function") throw Error();
	return this.tween(r, Vu(e, t, n ?? ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/text.js
function Uu(e) {
	return function() {
		this.textContent = e;
	};
}
function Wu(e) {
	return function() {
		var t = e(this);
		this.textContent = t ?? "";
	};
}
function Gu(e) {
	return this.tween("text", typeof e == "function" ? Wu($l(this, "text", e)) : Uu(e == null ? "" : e + ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/textTween.js
function Ku(e) {
	return function(t) {
		this.textContent = e.call(this, t);
	};
}
function qu(e) {
	var t, n;
	function r() {
		var r = e.apply(this, arguments);
		return r !== n && (t = (n = r) && Ku(r)), t;
	}
	return r._value = e, r;
}
function Ju(e) {
	var t = "text";
	if (arguments.length < 1) return (t = this.tween(t)) && t._value;
	if (e == null) return this.tween(t, null);
	if (typeof e != "function") throw Error();
	return this.tween(t, qu(e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/transition.js
function Yu() {
	for (var e = this._name, t = this._id, n = $u(), r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) if (c = o[l]) {
		var u = Kl(c, t);
		Ul(c, e, n, l, o, {
			time: u.time + u.delay + u.duration,
			delay: 0,
			duration: u.duration,
			ease: u.ease
		});
	}
	return new Qu(r, this._parents, e, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/end.js
function Xu() {
	var e, t, n = this, r = n._id, i = n.size();
	return new Promise(function(a, o) {
		var s = { value: o }, c = { value: function() {
			--i === 0 && a();
		} };
		n.each(function() {
			var n = Gl(this, r), i = n.on;
			i !== e && (t = (e = i).copy(), t._.cancel.push(s), t._.interrupt.push(s), t._.end.push(c)), n.on = t;
		}), i === 0 && a();
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/index.js
var Zu = 0;
function Qu(e, t, n, r) {
	this._groups = e, this._parents = t, this._name = n, this._id = r;
}
function $u() {
	return ++Zu;
}
var ed = zs.prototype;
Qu.prototype = {
	constructor: Qu,
	select: Au,
	selectAll: ju,
	selectChild: ed.selectChild,
	selectChildren: ed.selectChildren,
	filter: Cu,
	merge: wu,
	selection: Nu,
	transition: Yu,
	call: ed.call,
	nodes: ed.nodes,
	node: ed.node,
	size: ed.size,
	empty: ed.empty,
	each: ed.each,
	on: Du,
	attr: su,
	attrTween: fu,
	style: zu,
	styleTween: Hu,
	text: Gu,
	textTween: Ju,
	remove: ku,
	tween: Ql,
	delay: hu,
	duration: vu,
	ease: bu,
	easeVarying: Su,
	end: Xu,
	[Symbol.iterator]: ed[Symbol.iterator]
};
//#endregion
//#region node_modules/d3-ease/src/cubic.js
function td(e) {
	return ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2;
}
//#endregion
//#region node_modules/d3-transition/src/selection/transition.js
var nd = {
	time: null,
	delay: 0,
	duration: 250,
	ease: td
};
function rd(e, t) {
	for (var n; !(n = e.__transition) || !(n = n[t]);) if (!(e = e.parentNode)) throw Error(`transition ${t} not found`);
	return n;
}
function id(e) {
	var t, n;
	e instanceof Qu ? (t = e._id, e = e._name) : (t = $u(), (n = nd).time = jl(), e = e == null ? null : e + "");
	for (var r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && Ul(c, e, t, l, o, n || rd(c, t));
	return new Qu(r, this._parents, e, t);
}
zs.prototype.interrupt = Yl, zs.prototype.transition = id;
//#endregion
//#region node_modules/d3-zoom/src/constant.js
var ad = (e) => () => e;
//#endregion
//#region node_modules/d3-zoom/src/event.js
function od(e, { sourceEvent: t, target: n, transform: r, dispatch: i }) {
	Object.defineProperties(this, {
		type: {
			value: e,
			enumerable: !0,
			configurable: !0
		},
		sourceEvent: {
			value: t,
			enumerable: !0,
			configurable: !0
		},
		target: {
			value: n,
			enumerable: !0,
			configurable: !0
		},
		transform: {
			value: r,
			enumerable: !0,
			configurable: !0
		},
		_: { value: i }
	});
}
//#endregion
//#region node_modules/d3-zoom/src/transform.js
function sd(e, t, n) {
	this.k = e, this.x = t, this.y = n;
}
sd.prototype = {
	constructor: sd,
	scale: function(e) {
		return e === 1 ? this : new sd(this.k * e, this.x, this.y);
	},
	translate: function(e, t) {
		return e === 0 & t === 0 ? this : new sd(this.k, this.x + this.k * e, this.y + this.k * t);
	},
	apply: function(e) {
		return [e[0] * this.k + this.x, e[1] * this.k + this.y];
	},
	applyX: function(e) {
		return e * this.k + this.x;
	},
	applyY: function(e) {
		return e * this.k + this.y;
	},
	invert: function(e) {
		return [(e[0] - this.x) / this.k, (e[1] - this.y) / this.k];
	},
	invertX: function(e) {
		return (e - this.x) / this.k;
	},
	invertY: function(e) {
		return (e - this.y) / this.k;
	},
	rescaleX: function(e) {
		return e.copy().domain(e.range().map(this.invertX, this).map(e.invert, e));
	},
	rescaleY: function(e) {
		return e.copy().domain(e.range().map(this.invertY, this).map(e.invert, e));
	},
	toString: function() {
		return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
	}
};
var cd = new sd(1, 0, 0);
ld.prototype = sd.prototype;
function ld(e) {
	for (; !e.__zoom;) if (!(e = e.parentNode)) return cd;
	return e.__zoom;
}
//#endregion
//#region node_modules/d3-zoom/src/noevent.js
function ud(e) {
	e.stopImmediatePropagation();
}
function dd(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-zoom/src/zoom.js
function fd(e) {
	return (!e.ctrlKey || e.type === "wheel") && !e.button;
}
function pd() {
	var e = this;
	return e instanceof SVGElement ? (e = e.ownerSVGElement || e, e.hasAttribute("viewBox") ? (e = e.viewBox.baseVal, [[e.x, e.y], [e.x + e.width, e.y + e.height]]) : [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]]) : [[0, 0], [e.clientWidth, e.clientHeight]];
}
function md() {
	return this.__zoom || cd;
}
function hd(e) {
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * (e.ctrlKey ? 10 : 1);
}
function gd() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function _d(e, t, n) {
	var r = e.invertX(t[0][0]) - n[0][0], i = e.invertX(t[1][0]) - n[1][0], a = e.invertY(t[0][1]) - n[0][1], o = e.invertY(t[1][1]) - n[1][1];
	return e.translate(i > r ? (r + i) / 2 : Math.min(0, r) || Math.max(0, i), o > a ? (a + o) / 2 : Math.min(0, a) || Math.max(0, o));
}
function vd() {
	var e = fd, t = pd, n = _d, r = hd, i = gd, a = [0, Infinity], o = [[-Infinity, -Infinity], [Infinity, Infinity]], s = 250, c = yl, l = La("start", "zoom", "end"), u, d, f, p = 500, m = 150, h = 0, g = 10;
	function _(e) {
		e.property("__zoom", md).on("wheel.zoom", w, { passive: !1 }).on("mousedown.zoom", T).on("dblclick.zoom", E).filter(i).on("touchstart.zoom", D).on("touchmove.zoom", ee).on("touchend.zoom touchcancel.zoom", te).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	_.transform = function(e, t, n, r) {
		var i = e.selection ? e.selection() : e;
		i.property("__zoom", md), e === i ? i.interrupt().each(function() {
			S(this, arguments).event(r).start().zoom(null, typeof t == "function" ? t.apply(this, arguments) : t).end();
		}) : x(e, t, n, r);
	}, _.scaleBy = function(e, t, n, r) {
		_.scaleTo(e, function() {
			return this.__zoom.k * (typeof t == "function" ? t.apply(this, arguments) : t);
		}, n, r);
	}, _.scaleTo = function(e, r, i, a) {
		_.transform(e, function() {
			var e = t.apply(this, arguments), a = this.__zoom, s = i == null ? b(e) : typeof i == "function" ? i.apply(this, arguments) : i, c = a.invert(s), l = typeof r == "function" ? r.apply(this, arguments) : r;
			return n(y(v(a, l), s, c), e, o);
		}, i, a);
	}, _.translateBy = function(e, r, i, a) {
		_.transform(e, function() {
			return n(this.__zoom.translate(typeof r == "function" ? r.apply(this, arguments) : r, typeof i == "function" ? i.apply(this, arguments) : i), t.apply(this, arguments), o);
		}, null, a);
	}, _.translateTo = function(e, r, i, a, s) {
		_.transform(e, function() {
			var e = t.apply(this, arguments), s = this.__zoom, c = a == null ? b(e) : typeof a == "function" ? a.apply(this, arguments) : a;
			return n(cd.translate(c[0], c[1]).scale(s.k).translate(typeof r == "function" ? -r.apply(this, arguments) : -r, typeof i == "function" ? -i.apply(this, arguments) : -i), e, o);
		}, a, s);
	};
	function v(e, t) {
		return t = Math.max(a[0], Math.min(a[1], t)), t === e.k ? e : new sd(t, e.x, e.y);
	}
	function y(e, t, n) {
		var r = t[0] - n[0] * e.k, i = t[1] - n[1] * e.k;
		return r === e.x && i === e.y ? e : new sd(e.k, r, i);
	}
	function b(e) {
		return [(+e[0][0] + +e[1][0]) / 2, (+e[0][1] + +e[1][1]) / 2];
	}
	function x(e, n, r, i) {
		e.on("start.zoom", function() {
			S(this, arguments).event(i).start();
		}).on("interrupt.zoom end.zoom", function() {
			S(this, arguments).event(i).end();
		}).tween("zoom", function() {
			var e = this, a = arguments, o = S(e, a).event(i), s = t.apply(e, a), l = r == null ? b(s) : typeof r == "function" ? r.apply(e, a) : r, u = Math.max(s[1][0] - s[0][0], s[1][1] - s[0][1]), d = e.__zoom, f = typeof n == "function" ? n.apply(e, a) : n, p = c(d.invert(l).concat(u / d.k), f.invert(l).concat(u / f.k));
			return function(e) {
				if (e === 1) e = f;
				else {
					var t = p(e), n = u / t[2];
					e = new sd(n, l[0] - t[0] * n, l[1] - t[1] * n);
				}
				o.zoom(null, e);
			};
		});
	}
	function S(e, t, n) {
		return !n && e.__zooming || new C(e, t);
	}
	function C(e, n) {
		this.that = e, this.args = n, this.active = 0, this.sourceEvent = null, this.extent = t.apply(e, n), this.taps = 0;
	}
	C.prototype = {
		event: function(e) {
			return e && (this.sourceEvent = e), this;
		},
		start: function() {
			return ++this.active === 1 && (this.that.__zooming = this, this.emit("start")), this;
		},
		zoom: function(e, t) {
			return this.mouse && e !== "mouse" && (this.mouse[1] = t.invert(this.mouse[0])), this.touch0 && e !== "touch" && (this.touch0[1] = t.invert(this.touch0[0])), this.touch1 && e !== "touch" && (this.touch1[1] = t.invert(this.touch1[0])), this.that.__zoom = t, this.emit("zoom"), this;
		},
		end: function() {
			return --this.active === 0 && (delete this.that.__zooming, this.emit("end")), this;
		},
		emit: function(e) {
			var t = Vs(this.that).datum();
			l.call(e, this.that, new od(e, {
				sourceEvent: this.sourceEvent,
				target: _,
				type: e,
				transform: this.that.__zoom,
				dispatch: l
			}), t);
		}
	};
	function w(t, ...i) {
		if (!e.apply(this, arguments)) return;
		var s = S(this, i).event(t), c = this.__zoom, l = Math.max(a[0], Math.min(a[1], c.k * 2 ** r.apply(this, arguments))), u = Us(t);
		if (s.wheel) (s.mouse[0][0] !== u[0] || s.mouse[0][1] !== u[1]) && (s.mouse[1] = c.invert(s.mouse[0] = u)), clearTimeout(s.wheel);
		else if (c.k === l) return;
		else s.mouse = [u, c.invert(u)], Jl(this), s.start();
		dd(t), s.wheel = setTimeout(d, m), s.zoom("mouse", n(y(v(c, l), s.mouse[0], s.mouse[1]), s.extent, o));
		function d() {
			s.wheel = null, s.end();
		}
	}
	function T(t, ...r) {
		if (f || !e.apply(this, arguments)) return;
		var i = t.currentTarget, a = S(this, r, !0).event(t), s = Vs(t.view).on("mousemove.zoom", d, !0).on("mouseup.zoom", p, !0), c = Us(t, i), l = t.clientX, u = t.clientY;
		Js(t.view), ud(t), a.mouse = [c, this.__zoom.invert(c)], Jl(this), a.start();
		function d(e) {
			if (dd(e), !a.moved) {
				var t = e.clientX - l, r = e.clientY - u;
				a.moved = t * t + r * r > h;
			}
			a.event(e).zoom("mouse", n(y(a.that.__zoom, a.mouse[0] = Us(e, i), a.mouse[1]), a.extent, o));
		}
		function p(e) {
			s.on("mousemove.zoom mouseup.zoom", null), Ys(e.view, a.moved), dd(e), a.event(e).end();
		}
	}
	function E(r, ...i) {
		if (e.apply(this, arguments)) {
			var a = this.__zoom, c = Us(r.changedTouches ? r.changedTouches[0] : r, this), l = a.invert(c), u = a.k * (r.shiftKey ? .5 : 2), d = n(y(v(a, u), c, l), t.apply(this, i), o);
			dd(r), s > 0 ? Vs(this).transition().duration(s).call(x, d, c, r) : Vs(this).call(_.transform, d, c, r);
		}
	}
	function D(t, ...n) {
		if (e.apply(this, arguments)) {
			var r = t.touches, i = r.length, a = S(this, n, t.changedTouches.length === i).event(t), o, s, c, l;
			for (ud(t), s = 0; s < i; ++s) c = r[s], l = Us(c, this), l = [
				l,
				this.__zoom.invert(l),
				c.identifier
			], a.touch0 ? !a.touch1 && a.touch0[2] !== l[2] && (a.touch1 = l, a.taps = 0) : (a.touch0 = l, o = !0, a.taps = 1 + !!u);
			u &&= clearTimeout(u), o && (a.taps < 2 && (d = l[0], u = setTimeout(function() {
				u = null;
			}, p)), Jl(this), a.start());
		}
	}
	function ee(e, ...t) {
		if (this.__zooming) {
			var r = S(this, t).event(e), i = e.changedTouches, a = i.length, s, c, l, u;
			for (dd(e), s = 0; s < a; ++s) c = i[s], l = Us(c, this), r.touch0 && r.touch0[2] === c.identifier ? r.touch0[0] = l : r.touch1 && r.touch1[2] === c.identifier && (r.touch1[0] = l);
			if (c = r.that.__zoom, r.touch1) {
				var d = r.touch0[0], f = r.touch0[1], p = r.touch1[0], m = r.touch1[1], h = (h = p[0] - d[0]) * h + (h = p[1] - d[1]) * h, g = (g = m[0] - f[0]) * g + (g = m[1] - f[1]) * g;
				c = v(c, Math.sqrt(h / g)), l = [(d[0] + p[0]) / 2, (d[1] + p[1]) / 2], u = [(f[0] + m[0]) / 2, (f[1] + m[1]) / 2];
			} else if (r.touch0) l = r.touch0[0], u = r.touch0[1];
			else return;
			r.zoom("touch", n(y(c, l, u), r.extent, o));
		}
	}
	function te(e, ...t) {
		if (this.__zooming) {
			var n = S(this, t).event(e), r = e.changedTouches, i = r.length, a, o;
			for (ud(e), f && clearTimeout(f), f = setTimeout(function() {
				f = null;
			}, p), a = 0; a < i; ++a) o = r[a], n.touch0 && n.touch0[2] === o.identifier ? delete n.touch0 : n.touch1 && n.touch1[2] === o.identifier && delete n.touch1;
			if (n.touch1 && !n.touch0 && (n.touch0 = n.touch1, delete n.touch1), n.touch0) n.touch0[1] = this.__zoom.invert(n.touch0[0]);
			else if (n.end(), n.taps === 2 && (o = Us(o, this), Math.hypot(d[0] - o[0], d[1] - o[1]) < g)) {
				var s = Vs(this).on("dblclick.zoom");
				s && s.apply(this, arguments);
			}
		}
	}
	return _.wheelDelta = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : ad(+e), _) : r;
	}, _.filter = function(t) {
		return arguments.length ? (e = typeof t == "function" ? t : ad(!!t), _) : e;
	}, _.touchable = function(e) {
		return arguments.length ? (i = typeof e == "function" ? e : ad(!!e), _) : i;
	}, _.extent = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : ad([[+e[0][0], +e[0][1]], [+e[1][0], +e[1][1]]]), _) : t;
	}, _.scaleExtent = function(e) {
		return arguments.length ? (a[0] = +e[0], a[1] = +e[1], _) : [a[0], a[1]];
	}, _.translateExtent = function(e) {
		return arguments.length ? (o[0][0] = +e[0][0], o[1][0] = +e[1][0], o[0][1] = +e[0][1], o[1][1] = +e[1][1], _) : [[o[0][0], o[0][1]], [o[1][0], o[1][1]]];
	}, _.constrain = function(e) {
		return arguments.length ? (n = e, _) : n;
	}, _.duration = function(e) {
		return arguments.length ? (s = +e, _) : s;
	}, _.interpolate = function(e) {
		return arguments.length ? (c = e, _) : c;
	}, _.on = function() {
		var e = l.on.apply(l, arguments);
		return e === l ? _ : e;
	}, _.clickDistance = function(e) {
		return arguments.length ? (h = (e = +e) * e, _) : Math.sqrt(h);
	}, _.tapDistance = function(e) {
		return arguments.length ? (g = +e, _) : g;
	}, _;
}
//#endregion
//#region node_modules/@xyflow/system/dist/esm/index.js
var yd = {
	error001: (e = "react") => `Seems like you have not used ${e === "svelte" ? "SvelteFlowProvider" : "ReactFlowProvider"} as an ancestor. Help: https://${e}flow.dev/error#001`,
	error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
	error003: (e) => `Node type "${e}" not found. Using fallback type "default".`,
	error004: () => "The parent container needs a width and a height to render the graph.",
	error005: () => "Only child nodes can use a parent extent.",
	error006: () => "Can't create edge. An edge needs a source and a target.",
	error007: (e) => `The old edge with id=${e} does not exist.`,
	error009: (e) => `Marker type "${e}" doesn't exist.`,
	error008: (e, { id: t, sourceHandle: n, targetHandle: r }) => `Couldn't create edge for ${e} handle id: "${e === "source" ? n : r}", edge id: ${t}.`,
	error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
	error011: (e) => `Edge type "${e}" not found. Using fallback type "default".`,
	error012: (e) => `Node with id "${e}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
	error013: (e = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${e}/dist/style.css' or base.css to make sure everything is working properly.`,
	error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
	error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.",
	error016: (e) => `Edge with id "${e}" does not exist, it may have been removed. This can happen when an edge is deleted before the "onEdgeClick" handler is called.`
}, bd = [[-Infinity, -Infinity], [Infinity, Infinity]], xd = [
	"Enter",
	" ",
	"Escape"
], Sd = {
	"node.a11yDescription.default": "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
	"node.a11yDescription.keyboardDisabled": "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
	"node.a11yDescription.ariaLiveMessage": ({ direction: e, x: t, y: n }) => `Moved selected node ${e}. New position, x: ${t}, y: ${n}`,
	"edge.a11yDescription.default": "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
	"controls.ariaLabel": "Control Panel",
	"controls.zoomIn.ariaLabel": "Zoom In",
	"controls.zoomOut.ariaLabel": "Zoom Out",
	"controls.fitView.ariaLabel": "Fit View",
	"controls.interactive.ariaLabel": "Toggle Interactivity",
	"minimap.ariaLabel": "Mini Map",
	"handle.ariaLabel": "Handle"
}, Cd;
(function(e) {
	e.Strict = "strict", e.Loose = "loose";
})(Cd ||= {});
var wd;
(function(e) {
	e.Free = "free", e.Vertical = "vertical", e.Horizontal = "horizontal";
})(wd ||= {});
var Td;
(function(e) {
	e.Partial = "partial", e.Full = "full";
})(Td ||= {});
var Ed = {
	inProgress: !1,
	isValid: null,
	from: null,
	fromHandle: null,
	fromPosition: null,
	fromNode: null,
	to: null,
	toHandle: null,
	toPosition: null,
	toNode: null,
	pointer: null
}, Dd;
(function(e) {
	e.Bezier = "default", e.Straight = "straight", e.Step = "step", e.SmoothStep = "smoothstep", e.SimpleBezier = "simplebezier";
})(Dd ||= {});
var Od;
(function(e) {
	e.Arrow = "arrow", e.ArrowClosed = "arrowclosed";
})(Od ||= {});
var $;
(function(e) {
	e.Left = "left", e.Top = "top", e.Right = "right", e.Bottom = "bottom";
})($ ||= {});
var kd = {
	[$.Left]: $.Right,
	[$.Right]: $.Left,
	[$.Top]: $.Bottom,
	[$.Bottom]: $.Top
}, Ad = (e) => !!e && typeof e == "object" && "id" in e && "source" in e && "target" in e, jd = (e) => !!e && typeof e == "object" && "id" in e && "position" in e && !("source" in e) && !("target" in e), Md = (e) => !!e && typeof e == "object" && "id" in e && "internals" in e && !("source" in e) && !("target" in e), Nd = (e, t = [0, 0]) => {
	let { width: n, height: r } = mf(e), i = e.origin ?? t, a = n * i[0], o = r * i[1];
	return {
		x: e.position.x - a,
		y: e.position.y - o
	};
}, Pd = (e, t = { nodeOrigin: [0, 0] }) => {
	if (e.length === 0) return {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	let n = !1, r = e.reduce((e, r) => {
		let i = typeof r == "string", a = !t.nodeLookup && !i ? r : void 0;
		return t.nodeLookup && (a = i ? t.nodeLookup.get(r) : Md(r) ? r : t.nodeLookup.get(r.id)), a ? (n = !0, qd(e, Zd(a, t.nodeOrigin))) : e;
	}, {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	});
	return n ? Yd(r) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, Fd = (e, t = {}) => {
	let n = {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	}, r = !1;
	return e.forEach((e) => {
		(t.filter === void 0 || t.filter(e)) && (n = qd(n, Zd(e)), r = !0);
	}), r ? Yd(n) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, Id = (e, t, [n, r, i] = [
	0,
	0,
	1
], a = !1, o = !1) => {
	let s = (t.x - n) / i, c = (t.y - r) / i, l = t.width / i, u = t.height / i, d = [];
	for (let t of e.values()) {
		let { measured: e, selectable: n = !0, hidden: r = !1 } = t;
		if (o && !n || r) continue;
		let i = e.width ?? t.width ?? t.initialWidth ?? 0, f = e.height ?? t.height ?? t.initialHeight ?? 0, { x: p, y: m } = t.internals.positionAbsolute, h = $d(s, c, l, u, p, m, i, f), g = i * f, _ = a && h > 0;
		(!t.internals.handleBounds || _ || h >= g || t.dragging) && d.push(t);
	}
	return d;
}, Ld = (e, t) => {
	let n = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		n.add(e.id);
	}), t.filter((e) => n.has(e.source) || n.has(e.target));
};
function Rd(e, t) {
	let n = /* @__PURE__ */ new Map(), r = t?.nodes ? new Set(t.nodes.map((e) => e.id)) : null;
	return e.forEach((e) => {
		let i;
		if (t?.includeHiddenNodes) {
			let { width: t, height: n } = mf(e);
			i = t > 0 && n > 0;
		} else i = !!(e.measured.width && e.measured.height && !e.hidden);
		i && (!r || r.has(e.id)) && n.set(e.id, e);
	}), n;
}
async function zd({ nodes: e, width: t, height: n, panZoom: r, minZoom: i, maxZoom: a }, o) {
	if (e.size === 0) return !0;
	let s = df(Fd(Rd(e, o)), t, n, o?.minZoom ?? i, o?.maxZoom ?? a, o?.padding ?? .1);
	return await r.setViewport(s, {
		duration: o?.duration,
		ease: o?.ease,
		interpolate: o?.interpolate
	}), !0;
}
function Bd({ nodeId: e, nextPosition: t, nodeLookup: n, nodeOrigin: r = [0, 0], nodeExtent: i, onError: a }) {
	let o = n.get(e), s = o.parentId ? n.get(o.parentId) : void 0, { x: c, y: l } = s ? s.internals.positionAbsolute : {
		x: 0,
		y: 0
	}, u = o.origin ?? r, d = o.extent || i;
	if (o.extent === "parent" && !o.expandParent) {
		if (!s) a?.("005", yd.error005());
		else {
			let { width: e, height: t } = mf(s);
			e && t && (d = [[c, l], [c + e, l + t]]);
		}
	} else s && pf(o.extent) && (d = [[o.extent[0][0] + c, o.extent[0][1] + l], [o.extent[1][0] + c, o.extent[1][1] + l]]);
	let f = pf(d) ? Ud(t, d, o.measured) : t;
	return (o.measured.width === void 0 || o.measured.height === void 0) && a?.("015", yd.error015()), {
		position: {
			x: f.x - c + (o.measured.width ?? 0) * u[0],
			y: f.y - l + (o.measured.height ?? 0) * u[1]
		},
		positionAbsolute: f
	};
}
async function Vd({ nodesToRemove: e = [], edgesToRemove: t = [], nodes: n, edges: r, onBeforeDelete: i }) {
	let a = new Set(e.map((e) => e.id)), o = [];
	for (let e of n) {
		if (e.deletable === !1) continue;
		let t = a.has(e.id), n = !t && e.parentId && o.find((t) => t.id === e.parentId);
		(t || n) && o.push(e);
	}
	let s = new Set(t.map((e) => e.id)), c = r.filter((e) => e.deletable !== !1), l = Ld(o, c);
	for (let e of c) s.has(e.id) && !l.find((t) => t.id === e.id) && l.push(e);
	if (!i) return {
		edges: l,
		nodes: o
	};
	let u = await i({
		nodes: o,
		edges: l
	});
	return typeof u == "boolean" ? u ? {
		edges: l,
		nodes: o
	} : {
		edges: [],
		nodes: []
	} : u;
}
var Hd = (e, t = 0, n = 1) => Math.min(Math.max(e, t), n), Ud = (e = {
	x: 0,
	y: 0
}, t, n) => ({
	x: Hd(e.x, t[0][0], t[1][0] - (n?.width ?? 0)),
	y: Hd(e.y, t[0][1], t[1][1] - (n?.height ?? 0))
});
function Wd(e, t, n) {
	let { width: r, height: i } = mf(n), { x: a, y: o } = n.internals.positionAbsolute;
	return Ud(e, [[a, o], [a + r, o + i]], t);
}
var Gd = (e, t, n) => e < t ? Hd(Math.abs(e - t), 1, t) / t : e > n ? -Hd(Math.abs(e - n), 1, t) / t : 0, Kd = (e, t, n = 15, r = 40) => [Gd(e.x, r, t.width - r) * n, Gd(e.y, r, t.height - r) * n], qd = (e, t) => ({
	x: Math.min(e.x, t.x),
	y: Math.min(e.y, t.y),
	x2: Math.max(e.x2, t.x2),
	y2: Math.max(e.y2, t.y2)
}), Jd = ({ x: e, y: t, width: n, height: r }) => ({
	x: e,
	y: t,
	x2: e + n,
	y2: t + r
}), Yd = ({ x: e, y: t, x2: n, y2: r }) => ({
	x: e,
	y: t,
	width: n - e,
	height: r - t
}), Xd = (e, t = [0, 0]) => {
	let { x: n, y: r } = Md(e) ? e.internals.positionAbsolute : Nd(e, t);
	return {
		x: n,
		y: r,
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}, Zd = (e, t = [0, 0]) => {
	let { x: n, y: r } = Md(e) ? e.internals.positionAbsolute : Nd(e, t);
	return {
		x: n,
		y: r,
		x2: n + (e.measured?.width ?? e.width ?? e.initialWidth ?? 0),
		y2: r + (e.measured?.height ?? e.height ?? e.initialHeight ?? 0)
	};
}, Qd = (e, t) => Yd(qd(Jd(e), Jd(t))), $d = (e, t, n, r, i, a, o, s) => {
	let c = Math.max(0, Math.min(e + n, i + o) - Math.max(e, i)), l = Math.max(0, Math.min(t + r, a + s) - Math.max(t, a));
	return Math.ceil(c * l);
}, ef = (e, t) => $d(e.x, e.y, e.width, e.height, t.x, t.y, t.width, t.height), tf = (e) => nf(e.width) && nf(e.height) && nf(e.x) && nf(e.y), nf = (e) => !isNaN(e) && isFinite(e), rf = (e, t) => (e, t) => {}, af = (e, t = [1, 1]) => ({
	x: t[0] * Math.round(e.x / t[0]),
	y: t[1] * Math.round(e.y / t[1])
}), of = ({ x: e, y: t }, [n, r, i], a = !1, o = [1, 1]) => {
	let s = {
		x: (e - n) / i,
		y: (t - r) / i
	};
	return a ? af(s, o) : s;
}, sf = ({ x: e, y: t }, [n, r, i]) => ({
	x: e * i + n,
	y: t * i + r
});
function cf(e, t) {
	if (typeof e == "number") return Math.floor((t - t / (1 + e)) * .5);
	if (typeof e == "string" && e.endsWith("px")) {
		let t = parseFloat(e);
		if (!Number.isNaN(t)) return Math.floor(t);
	}
	if (typeof e == "string" && e.endsWith("%")) {
		let n = parseFloat(e);
		if (!Number.isNaN(n)) return Math.floor(t * n * .01);
	}
	return console.error(`The padding value "${e}" is invalid. Please provide a number or a string with a valid unit (px or %).`), 0;
}
function lf(e, t, n) {
	if (typeof e == "string" || typeof e == "number") {
		let r = cf(e, n), i = cf(e, t);
		return {
			top: r,
			right: i,
			bottom: r,
			left: i,
			x: i * 2,
			y: r * 2
		};
	}
	if (typeof e == "object") {
		let r = cf(e.top ?? e.y ?? 0, n), i = cf(e.bottom ?? e.y ?? 0, n), a = cf(e.left ?? e.x ?? 0, t), o = cf(e.right ?? e.x ?? 0, t);
		return {
			top: r,
			right: o,
			bottom: i,
			left: a,
			x: a + o,
			y: r + i
		};
	}
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		x: 0,
		y: 0
	};
}
function uf(e, t, n, r, i, a) {
	let { x: o, y: s } = sf(e, [
		t,
		n,
		r
	]), { x: c, y: l } = sf({
		x: e.x + e.width,
		y: e.y + e.height
	}, [
		t,
		n,
		r
	]), u = i - c, d = a - l;
	return {
		left: Math.floor(o),
		top: Math.floor(s),
		right: Math.floor(u),
		bottom: Math.floor(d)
	};
}
var df = (e, t, n, r, i, a) => {
	let o = lf(a, t, n), s = (t - o.x) / e.width, c = (n - o.y) / e.height, l = Hd(Math.min(s, c), r, i), u = e.x + e.width / 2, d = e.y + e.height / 2, f = t / 2 - u * l, p = n / 2 - d * l, m = uf(e, f, p, l, t, n), h = {
		left: Math.min(m.left - o.left, 0),
		top: Math.min(m.top - o.top, 0),
		right: Math.min(m.right - o.right, 0),
		bottom: Math.min(m.bottom - o.bottom, 0)
	};
	return {
		x: f - h.left + h.right,
		y: p - h.top + h.bottom,
		zoom: l
	};
}, ff = () => typeof navigator < "u" && navigator?.userAgent?.indexOf("Mac") >= 0;
function pf(e) {
	return e != null && e !== "parent";
}
function mf(e) {
	return {
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}
function hf(e) {
	return (e.measured?.width ?? e.width ?? e.initialWidth) !== void 0 && (e.measured?.height ?? e.height ?? e.initialHeight) !== void 0;
}
function gf(e, t = {
	width: 0,
	height: 0
}, n, r, i) {
	let a = { ...e }, o = r.get(n);
	if (o) {
		let e = o.origin || i;
		a.x += o.internals.positionAbsolute.x - (t.width ?? 0) * e[0], a.y += o.internals.positionAbsolute.y - (t.height ?? 0) * e[1];
	}
	return a;
}
function _f(e) {
	return {
		...Sd,
		...e || {}
	};
}
function vf(e, t) {
	if (!e && !t) return !0;
	if (!e || !t || e.size !== t.size) return !1;
	if (!e.size && !t.size) return !0;
	for (let n of e.keys()) if (!t.has(n)) return !1;
	return !0;
}
function yf(e, t, n) {
	if (!n) return;
	let r = [];
	e.forEach((e, n) => {
		t?.has(n) || r.push(e);
	}), r.length && n(r);
}
function bf(e) {
	return e === null ? null : e ? "valid" : "invalid";
}
function xf(e, { snapGrid: t = [0, 0], snapToGrid: n = !1, transform: r, containerBounds: i }) {
	let { x: a, y: o } = Df(e), s = of({
		x: a - (i?.left ?? 0),
		y: o - (i?.top ?? 0)
	}, r), { x: c, y: l } = n ? af(s, t) : s;
	return {
		xSnapped: c,
		ySnapped: l,
		...s
	};
}
var Sf = (e) => ({
	width: e.offsetWidth,
	height: e.offsetHeight
}), Cf = (e) => e?.getRootNode?.() || window?.document, wf = [
	"INPUT",
	"SELECT",
	"TEXTAREA"
];
function Tf(e) {
	let t = e.composedPath?.()?.[0] || e.target;
	return t?.nodeType === 1 ? wf.includes(t.nodeName) || t.hasAttribute("contenteditable") || !!t.closest(".nokey") : !1;
}
var Ef = (e) => "clientX" in e, Df = (e, t) => {
	let n = Ef(e), r = n ? e.clientX : e.touches?.[0].clientX, i = n ? e.clientY : e.touches?.[0].clientY;
	return {
		x: r - (t?.left ?? 0),
		y: i - (t?.top ?? 0)
	};
}, Of = (e, t, n, r, i) => {
	let a = t.querySelectorAll(`.${e}`);
	return !a || !a.length ? null : Array.from(a).map((t) => {
		let a = t.getBoundingClientRect();
		return {
			id: t.getAttribute("data-handleid"),
			type: e,
			nodeId: i,
			position: t.getAttribute("data-handlepos"),
			x: (a.left - n.left) / r,
			y: (a.top - n.top) / r,
			...Sf(t)
		};
	});
};
function kf({ sourceX: e, sourceY: t, targetX: n, targetY: r, sourceControlX: i, sourceControlY: a, targetControlX: o, targetControlY: s }) {
	let c = e * .125 + i * .375 + o * .375 + n * .125, l = t * .125 + a * .375 + s * .375 + r * .125;
	return [
		c,
		l,
		Math.abs(c - e),
		Math.abs(l - t)
	];
}
function Af(e, t) {
	return e >= 0 ? .5 * e : t * 25 * Math.sqrt(-e);
}
function jf({ pos: e, x1: t, y1: n, x2: r, y2: i, c: a }) {
	switch (e) {
		case $.Left: return [t - Af(t - r, a), n];
		case $.Right: return [t + Af(r - t, a), n];
		case $.Top: return [t, n - Af(n - i, a)];
		case $.Bottom: return [t, n + Af(i - n, a)];
	}
}
function Mf({ sourceX: e, sourceY: t, sourcePosition: n = $.Bottom, targetX: r, targetY: i, targetPosition: a = $.Top, curvature: o = .25 }) {
	let [s, c] = jf({
		pos: n,
		x1: e,
		y1: t,
		x2: r,
		y2: i,
		c: o
	}), [l, u] = jf({
		pos: a,
		x1: r,
		y1: i,
		x2: e,
		y2: t,
		c: o
	}), [d, f, p, m] = kf({
		sourceX: e,
		sourceY: t,
		targetX: r,
		targetY: i,
		sourceControlX: s,
		sourceControlY: c,
		targetControlX: l,
		targetControlY: u
	});
	return [
		`M${e},${t} C${s},${c} ${l},${u} ${r},${i}`,
		d,
		f,
		p,
		m
	];
}
function Nf({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let i = Math.abs(n - e) / 2, a = n < e ? n + i : n - i, o = Math.abs(r - t) / 2;
	return [
		a,
		r < t ? r + o : r - o,
		i,
		o
	];
}
function Pf({ sourceNode: e, targetNode: t, selected: n = !1, zIndex: r = 0, elevateOnSelect: i = !1, zIndexMode: a = "basic" }) {
	return a === "manual" ? r : (i && n ? r + 1e3 : r) + Math.max(e.parentId || i && e.selected ? e.internals.z : 0, t.parentId || i && t.selected ? t.internals.z : 0);
}
function Ff({ sourceNode: e, targetNode: t, width: n, height: r, transform: i }) {
	let a = qd(Zd(e), Zd(t));
	return a.x === a.x2 && (a.x2 += 1), a.y === a.y2 && (a.y2 += 1), ef({
		x: -i[0] / i[2],
		y: -i[1] / i[2],
		width: n / i[2],
		height: r / i[2]
	}, Yd(a)) > 0;
}
var If = ({ source: e, sourceHandle: t, target: n, targetHandle: r }) => `xy-edge__${e}${t || ""}-${n}${r || ""}`, Lf = (e, t) => t.some((t) => t.source === e.source && t.target === e.target && (t.sourceHandle === e.sourceHandle || !t.sourceHandle && !e.sourceHandle) && (t.targetHandle === e.targetHandle || !t.targetHandle && !e.targetHandle)), Rf = (e, t, n = {}) => {
	if (!e.source || !e.target) return n.onError?.("006", yd.error006()), t;
	let r = n.getEdgeId || If, i;
	return i = Ad(e) ? { ...e } : {
		...e,
		id: r(e)
	}, Lf(i, t) ? t : (i.sourceHandle === null && delete i.sourceHandle, i.targetHandle === null && delete i.targetHandle, t.concat(i));
};
function zf({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let [i, a, o, s] = Nf({
		sourceX: e,
		sourceY: t,
		targetX: n,
		targetY: r
	});
	return [
		`M ${e},${t}L ${n},${r}`,
		i,
		a,
		o,
		s
	];
}
var Bf = {
	[$.Left]: {
		x: -1,
		y: 0
	},
	[$.Right]: {
		x: 1,
		y: 0
	},
	[$.Top]: {
		x: 0,
		y: -1
	},
	[$.Bottom]: {
		x: 0,
		y: 1
	}
}, Vf = ({ source: e, sourcePosition: t = $.Bottom, target: n }) => t === $.Left || t === $.Right ? e.x < n.x ? {
	x: 1,
	y: 0
} : {
	x: -1,
	y: 0
} : e.y < n.y ? {
	x: 0,
	y: 1
} : {
	x: 0,
	y: -1
}, Hf = (e, t) => Math.sqrt((t.x - e.x) ** 2 + (t.y - e.y) ** 2);
function Uf({ source: e, sourcePosition: t = $.Bottom, target: n, targetPosition: r = $.Top, center: i, offset: a, stepPosition: o }) {
	let s = Bf[t], c = Bf[r], l = {
		x: e.x + s.x * a,
		y: e.y + s.y * a
	}, u = {
		x: n.x + c.x * a,
		y: n.y + c.y * a
	}, d = Vf({
		source: l,
		sourcePosition: t,
		target: u
	}), f = d.x === 0 ? "y" : "x", p = d[f], m = [], h, g, _ = {
		x: 0,
		y: 0
	}, v = {
		x: 0,
		y: 0
	}, [, , y, b] = Nf({
		sourceX: e.x,
		sourceY: e.y,
		targetX: n.x,
		targetY: n.y
	});
	if (s[f] * c[f] === -1) {
		f === "x" ? (h = i.x ?? l.x + (u.x - l.x) * o, g = i.y ?? (l.y + u.y) / 2) : (h = i.x ?? (l.x + u.x) / 2, g = i.y ?? l.y + (u.y - l.y) * o);
		let e = [{
			x: h,
			y: l.y
		}, {
			x: h,
			y: u.y
		}], t = [{
			x: l.x,
			y: g
		}, {
			x: u.x,
			y: g
		}];
		m = s[f] === p ? f === "x" ? e : t : f === "x" ? t : e;
	} else {
		let i = [{
			x: l.x,
			y: u.y
		}], o = [{
			x: u.x,
			y: l.y
		}];
		if (m = f === "x" ? s.x === p ? o : i : s.y === p ? i : o, t === r) {
			let t = Math.abs(e[f] - n[f]);
			if (t <= a) {
				let r = Math.min(a - 1, a - t);
				s[f] === p ? _[f] = (l[f] > e[f] ? -1 : 1) * r : v[f] = (u[f] > n[f] ? -1 : 1) * r;
			}
		}
		if (t !== r) {
			let e = f === "x" ? "y" : "x", t = s[f] === c[e], n = l[e] > u[e], r = l[e] < u[e];
			(s[f] === 1 && (!t && n || t && r) || s[f] !== 1 && (!t && r || t && n)) && (m = f === "x" ? i : o);
		}
		let d = {
			x: l.x + _.x,
			y: l.y + _.y
		}, y = {
			x: u.x + v.x,
			y: u.y + v.y
		};
		Math.max(Math.abs(d.x - m[0].x), Math.abs(y.x - m[0].x)) >= Math.max(Math.abs(d.y - m[0].y), Math.abs(y.y - m[0].y)) ? (h = (d.x + y.x) / 2, g = m[0].y) : (h = m[0].x, g = (d.y + y.y) / 2);
	}
	let x = {
		x: l.x + _.x,
		y: l.y + _.y
	}, S = {
		x: u.x + v.x,
		y: u.y + v.y
	};
	return [
		[
			e,
			...x.x !== m[0].x || x.y !== m[0].y ? [x] : [],
			...m,
			...S.x !== m[m.length - 1].x || S.y !== m[m.length - 1].y ? [S] : [],
			n
		],
		h,
		g,
		y,
		b
	];
}
function Wf(e, t, n, r) {
	let i = Math.min(Hf(e, t) / 2, Hf(t, n) / 2, r), { x: a, y: o } = t;
	if (e.x === a && a === n.x || e.y === o && o === n.y) return `L${a} ${o}`;
	if (e.y === o) {
		let t = e.x < n.x ? -1 : 1, r = e.y < n.y ? 1 : -1;
		return `L ${a + i * t},${o}Q ${a},${o} ${a},${o + i * r}`;
	}
	let s = e.x < n.x ? 1 : -1;
	return `L ${a},${o + i * (e.y < n.y ? -1 : 1)}Q ${a},${o} ${a + i * s},${o}`;
}
function Gf({ sourceX: e, sourceY: t, sourcePosition: n = $.Bottom, targetX: r, targetY: i, targetPosition: a = $.Top, borderRadius: o = 5, centerX: s, centerY: c, offset: l = 20, stepPosition: u = .5 }) {
	let [d, f, p, m, h] = Uf({
		source: {
			x: e,
			y: t
		},
		sourcePosition: n,
		target: {
			x: r,
			y: i
		},
		targetPosition: a,
		center: {
			x: s,
			y: c
		},
		offset: l,
		stepPosition: u
	}), g = `M${d[0].x} ${d[0].y}`;
	for (let e = 1; e < d.length - 1; e++) g += Wf(d[e - 1], d[e], d[e + 1], o);
	return g += `L${d[d.length - 1].x} ${d[d.length - 1].y}`, [
		g,
		f,
		p,
		m,
		h
	];
}
function Kf(e) {
	return e && !!(e.internals.handleBounds || e.handles?.length) && !!(e.measured.width || e.width || e.initialWidth);
}
function qf(e) {
	let { sourceNode: t, targetNode: n } = e;
	if (!Kf(t) || !Kf(n)) return null;
	let r = t.internals.handleBounds || Jf(t.handles), i = n.internals.handleBounds || Jf(n.handles), a = Xf(r?.source ?? [], e.sourceHandle), o = Xf(e.connectionMode === Cd.Strict ? i?.target ?? [] : (i?.target ?? []).concat(i?.source ?? []), e.targetHandle);
	if (!a || !o) return e.onError?.("008", yd.error008(a ? "target" : "source", {
		id: e.id,
		sourceHandle: e.sourceHandle,
		targetHandle: e.targetHandle
	})), null;
	let s = a?.position || $.Bottom, c = o?.position || $.Top, l = Yf(t, a, s), u = Yf(n, o, c);
	return {
		sourceX: l.x,
		sourceY: l.y,
		targetX: u.x,
		targetY: u.y,
		sourcePosition: s,
		targetPosition: c
	};
}
function Jf(e) {
	if (!e) return null;
	let t = [], n = [];
	for (let r of e) r.width = r.width ?? 1, r.height = r.height ?? 1, r.type === "source" ? t.push(r) : r.type === "target" && n.push(r);
	return {
		source: t,
		target: n
	};
}
function Yf(e, t, n = $.Left, r = !1) {
	let i = (t?.x ?? 0) + e.internals.positionAbsolute.x, a = (t?.y ?? 0) + e.internals.positionAbsolute.y, { width: o, height: s } = t ?? mf(e);
	if (r) return {
		x: i + o / 2,
		y: a + s / 2
	};
	switch (t?.position ?? n) {
		case $.Top: return {
			x: i + o / 2,
			y: a
		};
		case $.Right: return {
			x: i + o,
			y: a + s / 2
		};
		case $.Bottom: return {
			x: i + o / 2,
			y: a + s
		};
		case $.Left: return {
			x: i,
			y: a + s / 2
		};
	}
}
function Xf(e, t) {
	return e && (t ? e.find((e) => e.id === t) : e[0]) || null;
}
function Zf(e, t) {
	return e ? typeof e == "string" ? e : `${t ? `${t}__` : ""}${Object.keys(e).sort().map((t) => `${t}=${e[t]}`).join("&")}` : "";
}
function Qf(e, { id: t, defaultColor: n, defaultMarkerStart: r, defaultMarkerEnd: i }) {
	let a = /* @__PURE__ */ new Set();
	return e.reduce((e, o) => ([o.markerStart || r, o.markerEnd || i].forEach((r) => {
		if (r && typeof r == "object") {
			let i = Zf(r, t);
			a.has(i) || (e.push({
				id: i,
				color: r.color || n,
				...r
			}), a.add(i));
		}
	}), e), []).sort((e, t) => e.id.localeCompare(t.id));
}
var $f = 1e3, ep = 10, tp = {
	nodeOrigin: [0, 0],
	nodeExtent: bd,
	elevateNodesOnSelect: !0,
	zIndexMode: "basic",
	defaults: {}
}, np = {
	...tp,
	checkEquality: !0
};
function rp(e, t) {
	let n = { ...e };
	for (let e in t) t[e] !== void 0 && (n[e] = t[e]);
	return n;
}
function ip(e, t, n) {
	let r = rp(tp, n);
	for (let n of e.values()) if (n.parentId) lp(n, e, t, r);
	else {
		let e = Ud(Nd(n, r.nodeOrigin), pf(n.extent) ? n.extent : r.nodeExtent, mf(n));
		n.internals.positionAbsolute = e;
	}
}
function ap(e, t) {
	if (!e.handles) return e.measured ? t?.internals.handleBounds : void 0;
	let n = [], r = [];
	for (let t of e.handles) {
		let i = {
			id: t.id,
			width: t.width ?? 1,
			height: t.height ?? 1,
			nodeId: e.id,
			x: t.x,
			y: t.y,
			position: t.position,
			type: t.type
		};
		t.type === "source" ? n.push(i) : t.type === "target" && r.push(i);
	}
	return {
		source: n,
		target: r
	};
}
function op(e) {
	return e === "manual";
}
function sp(e, t, n, r = {}) {
	let i = rp(np, r), a = { i: 0 }, o = new Map(t), s = i?.elevateNodesOnSelect && !op(i.zIndexMode) ? $f : 0, c = e.length > 0, l = !1;
	t.clear(), n.clear();
	for (let u of e) {
		let e = o.get(u.id);
		if (i.checkEquality && u === e?.internals.userNode) t.set(u.id, e);
		else {
			let n = Ud(Nd(u, i.nodeOrigin), pf(u.extent) ? u.extent : i.nodeExtent, mf(u));
			e = {
				...i.defaults,
				...u,
				measured: {
					width: u.measured?.width,
					height: u.measured?.height
				},
				internals: {
					positionAbsolute: n,
					handleBounds: ap(u, e),
					z: up(u, s, i.zIndexMode),
					userNode: u
				}
			}, t.set(u.id, e);
		}
		(e.measured === void 0 || e.measured.width === void 0 || e.measured.height === void 0) && !e.hidden && (c = !1), u.parentId && lp(e, t, n, r, a), l ||= u.selected ?? !1;
	}
	return {
		nodesInitialized: c,
		hasSelectedNodes: l
	};
}
function cp(e, t) {
	if (!e.parentId) return;
	let n = t.get(e.parentId);
	n ? n.set(e.id, e) : t.set(e.parentId, /* @__PURE__ */ new Map([[e.id, e]]));
}
function lp(e, t, n, r, i) {
	let { elevateNodesOnSelect: a, nodeOrigin: o, nodeExtent: s, zIndexMode: c } = rp(tp, r), l = e.parentId, u = t.get(l);
	if (!u) {
		console.warn(`Parent node ${l} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
		return;
	}
	cp(e, n), i && !u.parentId && u.internals.rootParentIndex === void 0 && c === "auto" && (u.internals.rootParentIndex = ++i.i, u.internals.z = u.internals.z + i.i * ep), i && u.internals.rootParentIndex !== void 0 && (i.i = u.internals.rootParentIndex);
	let { x: d, y: f, z: p } = dp(e, u, o, s, a && !op(c) ? $f : 0, c), { positionAbsolute: m } = e.internals, h = d !== m.x || f !== m.y;
	(h || p !== e.internals.z) && t.set(e.id, {
		...e,
		internals: {
			...e.internals,
			positionAbsolute: h ? {
				x: d,
				y: f
			} : m,
			z: p
		}
	});
}
function up(e, t, n) {
	let r = nf(e.zIndex) ? e.zIndex : 0;
	return op(n) ? r : r + (e.selected ? t : 0);
}
function dp(e, t, n, r, i, a) {
	let { x: o, y: s } = t.internals.positionAbsolute, c = mf(e), l = Nd(e, n), u = pf(e.extent) ? Ud(l, e.extent, c) : l, d = Ud({
		x: o + u.x,
		y: s + u.y
	}, r, c);
	e.extent === "parent" && (d = Wd(d, c, t));
	let f = up(e, i, a), p = t.internals.z ?? 0;
	return {
		x: d.x,
		y: d.y,
		z: p >= f ? p + 1 : f
	};
}
function fp(e, t, n, r = [0, 0]) {
	let i = [], a = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.parentId);
		if (!e) continue;
		let r = Qd(a.get(n.parentId)?.expandedRect ?? Xd(e), n.rect);
		a.set(n.parentId, {
			expandedRect: r,
			parent: e
		});
	}
	return a.size > 0 && a.forEach(({ expandedRect: t, parent: a }, o) => {
		let s = a.internals.positionAbsolute, c = mf(a), l = a.origin ?? r, u = t.x < s.x ? Math.round(Math.abs(s.x - t.x)) : 0, d = t.y < s.y ? Math.round(Math.abs(s.y - t.y)) : 0, f = Math.max(c.width, Math.round(t.width)), p = Math.max(c.height, Math.round(t.height)), m = (f - c.width) * l[0], h = (p - c.height) * l[1];
		(u > 0 || d > 0 || m || h) && (i.push({
			id: o,
			type: "position",
			position: {
				x: a.position.x - u + m,
				y: a.position.y - d + h
			}
		}), n.get(o)?.forEach((t) => {
			e.some((e) => e.id === t.id) || i.push({
				id: t.id,
				type: "position",
				position: {
					x: t.position.x + u,
					y: t.position.y + d
				}
			});
		})), (c.width < t.width || c.height < t.height || u || d) && i.push({
			id: o,
			type: "dimensions",
			setAttributes: !0,
			dimensions: {
				width: f + (u ? l[0] * u - m : 0),
				height: p + (d ? l[1] * d - h : 0)
			}
		});
	}), i;
}
function pp(e, t, n, r, i, a, o) {
	let s = r?.querySelector(".xyflow__viewport"), c = !1;
	if (!s) return {
		changes: [],
		updatedInternals: c
	};
	let l = [], u = window.getComputedStyle(s), { m22: d } = new window.DOMMatrixReadOnly(u.transform), f = [];
	for (let r of e.values()) {
		let e = t.get(r.id);
		if (!e) continue;
		if (e.hidden) {
			t.set(e.id, {
				...e,
				internals: {
					...e.internals,
					handleBounds: void 0
				}
			}), c = !0;
			continue;
		}
		let s = Sf(r.nodeElement), u = e.measured.width !== s.width || e.measured.height !== s.height;
		if (s.width && s.height && (u || !e.internals.handleBounds || r.force)) {
			let p = r.nodeElement.getBoundingClientRect(), m = pf(e.extent) ? e.extent : a, { positionAbsolute: h } = e.internals;
			if (e.parentId && e.extent === "parent") {
				let n = t.get(e.parentId);
				n && (h = Wd(h, s, n));
			} else m && (h = Ud(h, m, s));
			let g = {
				...e,
				measured: s,
				internals: {
					...e.internals,
					positionAbsolute: h,
					handleBounds: {
						source: Of("source", r.nodeElement, p, d, e.id),
						target: Of("target", r.nodeElement, p, d, e.id)
					}
				}
			};
			t.set(e.id, g), e.parentId && lp(g, t, n, {
				nodeOrigin: i,
				zIndexMode: o
			}), c = !0, u && (l.push({
				id: e.id,
				type: "dimensions",
				dimensions: s
			}), e.expandParent && e.parentId && f.push({
				id: e.id,
				parentId: e.parentId,
				rect: Xd(g, i)
			}));
		}
	}
	if (f.length > 0) {
		let e = fp(f, t, n, i);
		l.push(...e);
	}
	return {
		changes: l,
		updatedInternals: c
	};
}
async function mp({ delta: e, panZoom: t, transform: n, translateExtent: r, width: i, height: a }) {
	if (!t || !e.x && !e.y) return !1;
	let o = await t.setViewportConstrained({
		x: n[0] + e.x,
		y: n[1] + e.y,
		zoom: n[2]
	}, [[0, 0], [i, a]], r);
	return !!o && (o.x !== n[0] || o.y !== n[1] || o.k !== n[2]);
}
function hp(e, t, n, r, i, a) {
	let o = i, s = r.get(o) || /* @__PURE__ */ new Map();
	r.set(o, s.set(n, t)), o = `${i}-${e}`;
	let c = r.get(o) || /* @__PURE__ */ new Map();
	if (r.set(o, c.set(n, t)), a) {
		o = `${i}-${e}-${a}`;
		let s = r.get(o) || /* @__PURE__ */ new Map();
		r.set(o, s.set(n, t));
	}
}
function gp(e, t, n) {
	e.clear(), t.clear();
	for (let r of n) {
		let { source: n, target: i, sourceHandle: a = null, targetHandle: o = null } = r, s = {
			edgeId: r.id,
			source: n,
			target: i,
			sourceHandle: a,
			targetHandle: o
		}, c = `${n}-${a}--${i}-${o}`;
		hp("source", s, `${i}-${o}--${n}-${a}`, e, n, a), hp("target", s, c, e, i, o), t.set(r.id, r);
	}
}
function _p(e, t) {
	if (!e.parentId) return !1;
	let n = t.get(e.parentId);
	return n ? n.selected ? !0 : _p(n, t) : !1;
}
function vp(e, t, n) {
	let r = e;
	do {
		if (r?.matches?.(t)) return !0;
		if (r === n) return !1;
		r = r?.parentElement;
	} while (r);
	return !1;
}
function yp(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let [a, o] of e) if ((o.selected || o.id === r) && (!o.parentId || !_p(o, e)) && (o.draggable || t && o.draggable === void 0)) {
		let t = e.get(a);
		t && i.set(a, {
			id: a,
			position: t.position || {
				x: 0,
				y: 0
			},
			distance: {
				x: n.x - t.internals.positionAbsolute.x,
				y: n.y - t.internals.positionAbsolute.y
			},
			extent: t.extent,
			parentId: t.parentId,
			origin: t.origin,
			expandParent: t.expandParent,
			internals: { positionAbsolute: t.internals.positionAbsolute || {
				x: 0,
				y: 0
			} },
			measured: {
				width: t.measured.width ?? 0,
				height: t.measured.height ?? 0
			}
		});
	}
	return i;
}
function bp({ nodeId: e, dragItems: t, nodeLookup: n, dragging: r = !0 }) {
	let i = [];
	for (let [e, a] of t) {
		let t = n.get(e)?.internals.userNode;
		t && i.push({
			...t,
			position: a.position,
			dragging: r
		});
	}
	if (!e) return [i[0], i];
	let a = n.get(e)?.internals.userNode;
	return [a ? {
		...a,
		position: t.get(e)?.position || a.position,
		dragging: r
	} : i[0], i];
}
function xp({ dragItems: e, snapGrid: t, x: n, y: r }) {
	let i = e.values().next().value;
	if (!i) return null;
	let a = {
		x: n - i.distance.x,
		y: r - i.distance.y
	}, o = af(a, t);
	return {
		x: o.x - a.x,
		y: o.y - a.y
	};
}
function Sp({ onNodeMouseDown: e, getStoreItems: t, onDragStart: n, onDrag: r, onDragStop: i }) {
	let a = {
		x: null,
		y: null
	}, o = 0, s = /* @__PURE__ */ new Map(), c = !1, l = {
		x: 0,
		y: 0
	}, u = null, d = !1, f = null, p = !1, m = !1, h = null;
	function g({ noDragClassName: g, handleSelector: _, domNode: v, isSelectable: y, nodeId: b, nodeClickDistance: x = 0 }) {
		f = Vs(v);
		function S({ x: e, y: n }) {
			let { nodeLookup: i, nodeExtent: o, snapGrid: c, snapToGrid: l, nodeOrigin: u, onNodeDrag: d, onSelectionDrag: f, onError: p, updateNodePositions: g } = t();
			a = {
				x: e,
				y: n
			};
			let _ = !1, v = s.size > 1, y = v && o ? Jd(Fd(s)) : null, x = v && l ? xp({
				dragItems: s,
				snapGrid: c,
				x: e,
				y: n
			}) : null;
			for (let [t, r] of s) {
				if (!i.has(t)) continue;
				let a = {
					x: e - r.distance.x,
					y: n - r.distance.y
				};
				l && (a = x ? {
					x: Math.round(a.x + x.x),
					y: Math.round(a.y + x.y)
				} : af(a, c));
				let s = null;
				if (v && o && !r.extent && y) {
					let { positionAbsolute: e } = r.internals, t = e.x - y.x + o[0][0], n = e.x + r.measured.width - y.x2 + o[1][0], i = e.y - y.y + o[0][1], a = e.y + r.measured.height - y.y2 + o[1][1];
					s = [[t, i], [n, a]];
				}
				let { position: d, positionAbsolute: f } = Bd({
					nodeId: t,
					nextPosition: a,
					nodeLookup: i,
					nodeExtent: s || o,
					nodeOrigin: u,
					onError: p
				});
				_ = _ || r.position.x !== d.x || r.position.y !== d.y, r.position = d, r.internals.positionAbsolute = f;
			}
			if (m ||= _, _ && (g(s, !0), h && (r || d || !b && f))) {
				let [e, t] = bp({
					nodeId: b,
					dragItems: s,
					nodeLookup: i
				});
				r?.(h, s, e, t), d?.(h, e, t), b || f?.(h, t);
			}
		}
		async function C() {
			if (!u) return;
			let { transform: e, panBy: n, autoPanSpeed: r, autoPanOnNodeDrag: i } = t();
			if (!i) {
				c = !1, cancelAnimationFrame(o);
				return;
			}
			let [s, d] = Kd(l, u, r);
			(s !== 0 || d !== 0) && (a.x = (a.x ?? 0) - s / e[2], a.y = (a.y ?? 0) - d / e[2], await n({
				x: s,
				y: d
			}) && S(a)), o = requestAnimationFrame(C);
		}
		function w(r) {
			let { nodeLookup: i, multiSelectionActive: o, nodesDraggable: c, transform: l, snapGrid: f, snapToGrid: p, selectNodesOnDrag: m, onNodeDragStart: h, onSelectionDragStart: g, unselectNodesAndEdges: _ } = t();
			d = !0, (!m || !y) && !o && b && (i.get(b)?.selected || _()), y && m && b && e?.(b);
			let v = xf(r.sourceEvent, {
				transform: l,
				snapGrid: f,
				snapToGrid: p,
				containerBounds: u
			});
			if (a = v, s = yp(i, c, v, b), s.size > 0 && (n || h || !b && g)) {
				let [e, t] = bp({
					nodeId: b,
					dragItems: s,
					nodeLookup: i
				});
				n?.(r.sourceEvent, s, e, t), h?.(r.sourceEvent, e, t), b || g?.(r.sourceEvent, t);
			}
		}
		let T = nc().clickDistance(x).on("start", (e) => {
			let { domNode: n, nodeDragThreshold: r, transform: i, snapGrid: o, snapToGrid: s } = t();
			u = n?.getBoundingClientRect() || null, p = !1, m = !1, h = e.sourceEvent, r === 0 && w(e), a = xf(e.sourceEvent, {
				transform: i,
				snapGrid: o,
				snapToGrid: s,
				containerBounds: u
			}), l = Df(e.sourceEvent, u);
		}).on("drag", (e) => {
			let { autoPanOnNodeDrag: n, transform: r, snapGrid: i, snapToGrid: o, nodeDragThreshold: f, nodeLookup: m } = t(), g = xf(e.sourceEvent, {
				transform: r,
				snapGrid: i,
				snapToGrid: o,
				containerBounds: u
			});
			if (h = e.sourceEvent, (e.sourceEvent.type === "touchmove" && e.sourceEvent.touches.length > 1 || b && !m.has(b)) && (p = !0), !p) {
				if (!c && n && d && (c = !0, C()), !d) {
					let t = Df(e.sourceEvent, u), n = t.x - l.x, r = t.y - l.y;
					Math.sqrt(n * n + r * r) > f && w(e);
				}
				(a.x !== g.xSnapped || a.y !== g.ySnapped) && s && d && (l = Df(e.sourceEvent, u), S(g));
			}
		}).on("end", (e) => {
			if (!d || p) {
				p && s.size > 0 && t().updateNodePositions(s, !1);
				return;
			}
			if (c = !1, d = !1, cancelAnimationFrame(o), s.size > 0) {
				let { nodeLookup: n, updateNodePositions: r, onNodeDragStop: a, onSelectionDragStop: o } = t();
				if (m &&= (r(s, !1), !1), i || a || !b && o) {
					let [t, r] = bp({
						nodeId: b,
						dragItems: s,
						nodeLookup: n,
						dragging: !1
					});
					i?.(e.sourceEvent, s, t, r), a?.(e.sourceEvent, t, r), b || o?.(e.sourceEvent, r);
				}
			}
		}).filter((e) => {
			let t = e.target;
			return !e.button && (!g || !vp(t, `.${g}`, v)) && (!_ || vp(t, _, v));
		});
		f.call(T);
	}
	function _() {
		f?.on(".drag", null);
	}
	return {
		update: g,
		destroy: _
	};
}
function Cp(e, t, n) {
	let r = [], i = {
		x: e.x - n,
		y: e.y - n,
		width: n * 2,
		height: n * 2
	};
	for (let e of t.values()) ef(i, Xd(e)) > 0 && r.push(e);
	return r;
}
var wp = 250;
function Tp(e, t, n, r) {
	let i = [], a = Infinity, o = Cp(e, n, t + wp);
	for (let n of o) {
		let o = [...n.internals.handleBounds?.source ?? [], ...n.internals.handleBounds?.target ?? []];
		for (let s of o) {
			if (r.nodeId === s.nodeId && r.type === s.type && r.id === s.id) continue;
			let { x: o, y: c } = Yf(n, s, s.position, !0), l = Math.sqrt((o - e.x) ** 2 + (c - e.y) ** 2);
			l > t || (l < a ? (i = [{
				...s,
				x: o,
				y: c
			}], a = l) : l === a && i.push({
				...s,
				x: o,
				y: c
			}));
		}
	}
	if (!i.length) return null;
	if (i.length > 1) {
		let e = r.type === "source" ? "target" : "source";
		return i.find((t) => t.type === e) ?? i[0];
	}
	return i[0];
}
function Ep(e, t, n, r, i, a = !1) {
	let o = r.get(e);
	if (!o) return null;
	let s = i === "strict" ? o.internals.handleBounds?.[t] : [...o.internals.handleBounds?.source ?? [], ...o.internals.handleBounds?.target ?? []], c = (n ? s?.find((e) => e.id === n) : s?.[0]) ?? null;
	return c && a ? {
		...c,
		...Yf(o, c, c.position, !0)
	} : c;
}
function Dp(e, t) {
	return e || (t?.classList.contains("target") ? "target" : t?.classList.contains("source") ? "source" : null);
}
function Op(e, t) {
	let n = null;
	return t ? n = !0 : e && !t && (n = !1), n;
}
var kp = () => !0;
function Ap(e, { connectionMode: t, connectionRadius: n, handleId: r, nodeId: i, edgeUpdaterType: a, isTarget: o, domNode: s, nodeLookup: c, lib: l, autoPanOnConnect: u, flowId: d, panBy: f, cancelConnection: p, onConnectStart: m, onConnect: h, onConnectEnd: g, isValidConnection: _ = kp, onReconnectEnd: v, updateConnection: y, getTransform: b, getFromHandle: x, autoPanSpeed: S, dragThreshold: C = 1, handleDomNode: w }) {
	let T = Cf(e.target), E = 0, D, { x: ee, y: te } = Df(e), ne = Dp(a, w), re = s?.getBoundingClientRect(), ie = !1;
	if (!re || !ne) return;
	let ae = Ep(i, ne, r, c, t);
	if (!ae) return;
	let O = Df(e, re), k = !1, oe = null, se = !1, ce = null;
	function le() {
		if (!u || !re) return;
		let [e, t] = Kd(O, re, S);
		f({
			x: e,
			y: t
		}), E = requestAnimationFrame(le);
	}
	let ue = {
		...ae,
		nodeId: i,
		type: ne,
		position: ae.position
	}, de = c.get(i), fe = {
		inProgress: !0,
		isValid: null,
		from: Yf(de, ue, $.Left, !0),
		fromHandle: ue,
		fromPosition: ue.position,
		fromNode: de,
		to: O,
		toHandle: null,
		toPosition: kd[ue.position],
		toNode: null,
		pointer: O
	};
	function pe() {
		ie = !0, y(fe), m?.(e, {
			nodeId: i,
			handleId: r,
			handleType: ne
		});
	}
	C === 0 && pe();
	function me(e) {
		if (!ie) {
			let { x: t, y: n } = Df(e), r = t - ee, i = n - te;
			if (!(r * r + i * i > C * C)) return;
			pe();
		}
		if (!x() || !ue) {
			he(e);
			return;
		}
		let a = b();
		O = Df(e, re), D = Tp(of(O, a, !1, [1, 1]), n, c, ue), k ||= (le(), !0);
		let s = jp(e, {
			handle: D,
			connectionMode: t,
			fromNodeId: i,
			fromHandleId: r,
			fromType: o ? "target" : "source",
			isValidConnection: _,
			doc: T,
			lib: l,
			flowId: d,
			nodeLookup: c
		});
		ce = s.handleDomNode, oe = s.connection, se = Op(!!D, s.isValid);
		let u = c.get(i), f = u ? Yf(u, ue, $.Left, !0) : fe.from, p = {
			...fe,
			from: f,
			isValid: se,
			to: s.toHandle && se ? sf({
				x: s.toHandle.x,
				y: s.toHandle.y
			}, a) : O,
			toHandle: s.toHandle,
			toPosition: se && s.toHandle ? s.toHandle.position : kd[ue.position],
			toNode: s.toHandle ? c.get(s.toHandle.nodeId) : null,
			pointer: O
		};
		y(p), fe = p;
	}
	function he(e) {
		if (!("touches" in e && e.touches.length > 0)) {
			if (ie) {
				(D || ce) && oe && se && h?.(oe);
				let { inProgress: t, ...n } = fe, r = {
					...n,
					toPosition: fe.toHandle ? fe.toPosition : null
				};
				g?.(e, r), a && v?.(e, r);
			}
			p(), cancelAnimationFrame(E), k = !1, se = !1, oe = null, ce = null, T.removeEventListener("mousemove", me), T.removeEventListener("mouseup", he), T.removeEventListener("touchmove", me), T.removeEventListener("touchend", he);
		}
	}
	T.addEventListener("mousemove", me), T.addEventListener("mouseup", he), T.addEventListener("touchmove", me), T.addEventListener("touchend", he);
}
function jp(e, { handle: t, connectionMode: n, fromNodeId: r, fromHandleId: i, fromType: a, doc: o, lib: s, flowId: c, isValidConnection: l = kp, nodeLookup: u }) {
	let d = a === "target", f = t ? o.querySelector(`.${s}-flow__handle[data-id="${c}-${t?.nodeId}-${t?.id}-${t?.type}"]`) : null, { x: p, y: m } = Df(e), h = o.elementFromPoint(p, m), g = h?.classList.contains(`${s}-flow__handle`) ? h : f, _ = {
		handleDomNode: g,
		isValid: !1,
		connection: null,
		toHandle: null
	};
	if (g) {
		let e = Dp(void 0, g), t = g.getAttribute("data-nodeid"), a = g.getAttribute("data-handleid"), o = g.classList.contains("connectable"), s = g.classList.contains("connectableend");
		if (!t || !e) return _;
		let c = {
			source: d ? t : r,
			sourceHandle: d ? a : i,
			target: d ? r : t,
			targetHandle: d ? i : a
		};
		_.connection = c, _.isValid = o && s && (n === Cd.Strict ? d && e === "source" || !d && e === "target" : t !== r || a !== i) && l(c), _.toHandle = Ep(t, e, a, u, n, !0);
	}
	return _;
}
var Mp = {
	onPointerDown: Ap,
	isValid: jp
};
function Np({ domNode: e, panZoom: t, getTransform: n, getViewScale: r }) {
	let i = Vs(e);
	function a({ translateExtent: e, width: a, height: o, zoomStep: s = 1, pannable: c = !0, zoomable: l = !0, inversePan: u = !1 }) {
		let d = (e) => {
			if (e.sourceEvent.type !== "wheel" || !t) return;
			let r = n(), i = e.sourceEvent.ctrlKey && ff() ? 10 : 1, a = -e.sourceEvent.deltaY * (e.sourceEvent.deltaMode === 1 ? .05 : e.sourceEvent.deltaMode ? 1 : .002) * s, o = r[2] * 2 ** (a * i);
			t.scaleTo(o);
		}, f = [0, 0], p = vd().on("start", (e) => {
			(e.sourceEvent.type === "mousedown" || e.sourceEvent.type === "touchstart") && (f = [e.sourceEvent.clientX ?? e.sourceEvent.touches[0].clientX, e.sourceEvent.clientY ?? e.sourceEvent.touches[0].clientY]);
		}).on("zoom", c ? (i) => {
			let s = n();
			if (i.sourceEvent.type !== "mousemove" && i.sourceEvent.type !== "touchmove" || !t) return;
			let c = [i.sourceEvent.clientX ?? i.sourceEvent.touches[0].clientX, i.sourceEvent.clientY ?? i.sourceEvent.touches[0].clientY], l = [c[0] - f[0], c[1] - f[1]];
			f = c;
			let d = r() * Math.max(s[2], Math.log(s[2])) * (u ? -1 : 1), p = {
				x: s[0] - l[0] * d,
				y: s[1] - l[1] * d
			}, m = [[0, 0], [a, o]];
			t.setViewportConstrained({
				x: p.x,
				y: p.y,
				zoom: s[2]
			}, m, e);
		} : null).on("zoom.wheel", l ? d : null);
		i.call(p, {});
	}
	function o() {
		i.on("zoom", null);
	}
	return {
		update: a,
		destroy: o,
		pointer: Us
	};
}
var Pp = (e) => ({
	x: e.x,
	y: e.y,
	zoom: e.k
}), Fp = ({ x: e, y: t, zoom: n }) => cd.translate(e, t).scale(n), Ip = (e, t) => e.target.closest(`.${t}`), Lp = (e, t) => t === 2 && Array.isArray(e) && e.includes(2), Rp = (e) => ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2, zp = (e, t = 0, n = Rp, r = () => {}) => {
	let i = typeof t == "number" && t > 0;
	return i || r(), i ? e.transition().duration(t).ease(n).on("end", r) : e;
}, Bp = (e) => {
	let t = e.ctrlKey && ff() ? 10 : 1;
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * t;
};
function Vp({ zoomPanValues: e, noWheelClassName: t, d3Selection: n, d3Zoom: r, panOnScrollMode: i, panOnScrollSpeed: a, zoomOnPinch: o, onPanZoomStart: s, onPanZoom: c, onPanZoomEnd: l }) {
	return (u) => {
		if (Ip(u, t)) return u.ctrlKey && u.preventDefault(), !1;
		u.preventDefault(), u.stopImmediatePropagation();
		let d = n.property("__zoom").k || 1;
		if (u.ctrlKey && o) {
			let e = Us(u), t = d * 2 ** Bp(u);
			r.scaleTo(n, t, e, u);
			return;
		}
		let f = u.deltaMode === 1 ? 20 : 1, p = i === wd.Vertical ? 0 : u.deltaX * f, m = i === wd.Horizontal ? 0 : u.deltaY * f;
		!ff() && u.shiftKey && i !== wd.Vertical && (p = u.deltaY * f, m = 0), r.translateBy(n, -(p / d) * a, -(m / d) * a, { internal: !0 });
		let h = Pp(n.property("__zoom"));
		clearTimeout(e.panScrollTimeout), e.isPanScrolling ? c?.(u, h) : (e.isPanScrolling = !0, s?.(u, h)), e.panScrollTimeout = setTimeout(() => {
			l?.(u, h), e.isPanScrolling = !1;
		}, 150);
	};
}
function Hp({ noWheelClassName: e, preventScrolling: t, d3ZoomHandler: n }) {
	return function(r, i) {
		let a = r.type === "wheel", o = !t && a && !r.ctrlKey, s = Ip(r, e);
		if (r.ctrlKey && a && s && r.preventDefault(), o || s) return null;
		r.preventDefault(), n.call(this, r, i);
	};
}
function Up({ zoomPanValues: e, onDraggingChange: t, onPanZoomStart: n }) {
	return (r) => {
		if (r.sourceEvent?.internal) return;
		let i = Pp(r.transform);
		e.mouseButton = r.sourceEvent?.button || 0, e.isZoomingOrPanning = !0, e.prevViewport = i, r.sourceEvent?.type === "mousedown" && t(!0), n && n?.(r.sourceEvent, i);
	};
}
function Wp({ zoomPanValues: e, panOnDrag: t, onPaneContextMenu: n, onTransformChange: r, onPanZoom: i }) {
	return (a) => {
		e.usedRightMouseButton = !!(n && Lp(t, e.mouseButton ?? 0)), a.sourceEvent?.sync || r([
			a.transform.x,
			a.transform.y,
			a.transform.k
		]), i && !a.sourceEvent?.internal && i?.(a.sourceEvent, Pp(a.transform));
	};
}
function Gp({ zoomPanValues: e, panOnDrag: t, panOnScroll: n, onDraggingChange: r, onPanZoomEnd: i, onPaneContextMenu: a }) {
	return (o) => {
		if (!o.sourceEvent?.internal && (e.isZoomingOrPanning = !1, a && Lp(t, e.mouseButton ?? 0) && !e.usedRightMouseButton && o.sourceEvent && a(o.sourceEvent), e.usedRightMouseButton = !1, r(!1), i)) {
			let t = Pp(o.transform);
			e.prevViewport = t, clearTimeout(e.timerId), e.timerId = setTimeout(() => {
				i?.(o.sourceEvent, t);
			}, n ? 150 : 0);
		}
	};
}
function Kp({ panActivationKeyPressed: e, zoomActivationKeyPressed: t, zoomOnScroll: n, zoomOnPinch: r, panOnDrag: i, panOnScroll: a, zoomOnDoubleClick: o, userSelectionActive: s, noWheelClassName: c, noPanClassName: l, lib: u, connectionInProgress: d }) {
	return (f) => {
		let p = t || n, m = r && f.ctrlKey, h = f.type === "wheel";
		if (f.button === 1 && f.type === "mousedown" && (Ip(f, `${u}-flow__node`) || Ip(f, `${u}-flow__edge`) || Ip(f, `${u}-flow__selection`) || Ip(f, `${u}-flow__nodesselection`))) return !0;
		if (!i && !p && !a && !o && !r || s || d && !h || Ip(f, c) && h || Ip(f, l) && (!h || a && h && !t) || !r && f.ctrlKey && h) return !1;
		if (!r && f.type === "touchstart" && f.touches?.length > 1) return f.preventDefault(), !1;
		if (!p && !a && !m && h || !i && (f.type === "mousedown" || f.type === "touchstart") || Array.isArray(i) && !i.includes(f.button) && f.type === "mousedown") return !1;
		let g = Array.isArray(i) && i.includes(f.button) || !f.button || f.button <= 1;
		return (!f.ctrlKey || h || e) && g;
	};
}
function qp({ domNode: e, minZoom: t, maxZoom: n, translateExtent: r, viewport: i, onPanZoom: a, onPanZoomStart: o, onPanZoomEnd: s, onDraggingChange: c }) {
	let l = {
		isZoomingOrPanning: !1,
		usedRightMouseButton: !1,
		prevViewport: {},
		mouseButton: 0,
		timerId: void 0,
		panScrollTimeout: void 0,
		isPanScrolling: !1
	}, u = e.getBoundingClientRect(), d = [[0, 0], [u.width, u.height]];
	(typeof ResizeObserver < "u" ? new ResizeObserver((e) => {
		let t = e[0];
		t && (d = [[0, 0], [t.contentRect.width, t.contentRect.height]]);
	}) : null)?.observe(e);
	let f = vd().extent(() => d).scaleExtent([t, n]).translateExtent(r), p = Vs(e).call(f);
	y({
		x: i.x,
		y: i.y,
		zoom: Hd(i.zoom, t, n)
	}, [[0, 0], [u.width, u.height]], r);
	let m = p.on("wheel.zoom"), h = p.on("dblclick.zoom");
	f.wheelDelta(Bp);
	async function g(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? al : yl).transform(zp(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function _({ noWheelClassName: e, noPanClassName: t, onPaneContextMenu: n, userSelectionActive: r, panOnScroll: i, panOnDrag: u, panOnScrollMode: d, panOnScrollSpeed: g, preventScrolling: _, zoomOnPinch: y, zoomOnScroll: b, zoomOnDoubleClick: x, panActivationKeyPressed: S = !1, zoomActivationKeyPressed: C, lib: w, onTransformChange: T, connectionInProgress: E, paneClickDistance: D, selectionOnDrag: ee }) {
		r && !l.isZoomingOrPanning && v();
		let te = i && !C && !r;
		f.clickDistance(ee ? Infinity : !nf(D) || D < 0 ? 0 : D);
		let ne = te ? Vp({
			zoomPanValues: l,
			noWheelClassName: e,
			d3Selection: p,
			d3Zoom: f,
			panOnScrollMode: d,
			panOnScrollSpeed: g,
			zoomOnPinch: y,
			onPanZoomStart: o,
			onPanZoom: a,
			onPanZoomEnd: s
		}) : Hp({
			noWheelClassName: e,
			preventScrolling: _,
			d3ZoomHandler: m
		});
		p.on("wheel.zoom", ne, { passive: !1 });
		let re = Up({
			zoomPanValues: l,
			onDraggingChange: c,
			onPanZoomStart: o
		});
		f.on("start", re);
		let ie = Wp({
			zoomPanValues: l,
			panOnDrag: u,
			onPaneContextMenu: !!n,
			onPanZoom: a,
			onTransformChange: T
		});
		f.on("zoom", ie);
		let ae = Gp({
			zoomPanValues: l,
			panOnDrag: u,
			panOnScroll: i,
			onPaneContextMenu: n,
			onPanZoomEnd: s,
			onDraggingChange: c
		});
		f.on("end", ae);
		let O = Kp({
			panActivationKeyPressed: S,
			zoomActivationKeyPressed: C,
			panOnDrag: u,
			zoomOnScroll: b,
			panOnScroll: i,
			zoomOnDoubleClick: x,
			zoomOnPinch: y,
			userSelectionActive: r,
			noPanClassName: t,
			noWheelClassName: e,
			lib: w,
			connectionInProgress: E
		});
		f.filter(O), x ? p.on("dblclick.zoom", h) : p.on("dblclick.zoom", null);
	}
	function v() {
		f.on("zoom", null);
	}
	async function y(e, t, n) {
		let r = Fp(e), i = f?.constrain()(r, t, n);
		return i && await g(i), i;
	}
	async function b(e, t) {
		let n = Fp(e);
		return await g(n, t), n;
	}
	function x(e) {
		if (p) {
			let t = Fp(e), n = p.property("__zoom");
			(n.k !== e.zoom || n.x !== e.x || n.y !== e.y) && f?.transform(p, t, null, { sync: !0 });
		}
	}
	function S() {
		let e = p ? ld(p.node()) : {
			x: 0,
			y: 0,
			k: 1
		};
		return {
			x: e.x,
			y: e.y,
			zoom: e.k
		};
	}
	async function C(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? al : yl).scaleTo(zp(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	async function w(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? al : yl).scaleBy(zp(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function T(e) {
		f?.scaleExtent(e);
	}
	function E(e) {
		f?.translateExtent(e);
	}
	function D(e) {
		let t = !nf(e) || e < 0 ? 0 : e;
		f?.clickDistance(t);
	}
	return {
		update: _,
		destroy: v,
		setViewport: b,
		setViewportConstrained: y,
		getViewport: S,
		scaleTo: C,
		scaleBy: w,
		setScaleExtent: T,
		setTranslateExtent: E,
		syncViewport: x,
		setClickDistance: D
	};
}
var Jp;
(function(e) {
	e.Line = "line", e.Handle = "handle";
})(Jp ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/edges.js
var Yp = rf("Svelte Flow", "https://svelteflow.dev/");
function Xp(e, t, n = {}) {
	return Rf(e, t, {
		...n,
		onError: n.onError ?? Yp
	});
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/context.js
function Zp() {
	let e = {};
	return [(t) => {
		if (t && !nt(e)) throw Error(t);
		return et(e);
	}, (t) => tt(e, t)];
}
var [Qp, $p] = Zp(), [em, tm] = Zp(), [nm, rm] = Zp(), im = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"id",
	"type",
	"position",
	"style",
	"class",
	"isConnectable",
	"isConnectableStart",
	"isConnectableEnd",
	"isValidConnection",
	"onconnect",
	"ondisconnect",
	"children"
]), am = /* @__PURE__ */ q("<div><!></div>");
function om(e, t) {
	N(t, !0);
	let n = Z(t, "id", 7, null), r = Z(t, "type", 7, "source"), i = Z(t, "position", 23, () => $.Top), a = Z(t, "style", 7), o = Z(t, "class", 7), s = Z(t, "isConnectable", 7), c = Z(t, "isConnectableStart", 7, !0), l = Z(t, "isConnectableEnd", 7, !0), u = Z(t, "isValidConnection", 7), d = Z(t, "onconnect", 7), f = Z(t, "ondisconnect", 7), p = Z(t, "children", 7), m = /* @__PURE__ */ Oa(t, im), h = Qp("Handle must be used within a Custom Node component"), _ = em("Handle must be used within a Custom Node component"), v = /* @__PURE__ */ F(() => r() === "target"), y = /* @__PURE__ */ F(() => s() === void 0 ? _.value : s()), b = Gm(), S = /* @__PURE__ */ F(() => b.ariaLabelConfig), C = null;
	Mn(() => {
		if (d() || f()) {
			b.edges;
			let e = b.connectionLookup.get(`${h}-${r()}${n() ? `-${n()}` : ""}`);
			if (C && !vf(e, C)) {
				let t = e ?? /* @__PURE__ */ new Map();
				yf(C, t, f()), yf(t, C, d());
			}
			C = new Map(e);
		}
	});
	let w = /* @__PURE__ */ F(() => {
		if (!b.connection.inProgress) return [
			!1,
			!1,
			!1,
			!1,
			null
		];
		let { fromHandle: e, toHandle: t, isValid: i } = b.connection, a = e && e.nodeId === h && e.type === r() && e.id === n(), o = t && t.nodeId === h && t.type === r() && t.id === n();
		return [
			!0,
			a,
			o,
			b.connectionMode === Cd.Strict ? e?.type !== r() : h !== e?.nodeId || n() !== e?.id,
			o && i
		];
	}), T = /* @__PURE__ */ F(() => x(K(w), 5)), E = /* @__PURE__ */ F(() => K(T)[0]), D = /* @__PURE__ */ F(() => K(T)[1]), ee = /* @__PURE__ */ F(() => K(T)[2]), te = /* @__PURE__ */ F(() => K(T)[3]), ne = /* @__PURE__ */ F(() => K(T)[4]);
	function re(e) {
		let t = b.onbeforeconnect ? b.onbeforeconnect(e) : e;
		t && (b.addEdge(t), b.onconnect?.(e));
	}
	function ie(e) {
		let t = Ef(e);
		e.currentTarget && (t && e.button === 0 || !t) && Mp.onPointerDown(e, {
			handleId: n(),
			nodeId: h,
			isTarget: K(v),
			connectionRadius: b.connectionRadius,
			domNode: b.domNode,
			nodeLookup: b.nodeLookup,
			connectionMode: b.connectionMode,
			lib: "svelte",
			autoPanOnConnect: b.autoPanOnConnect,
			autoPanSpeed: b.autoPanSpeed,
			flowId: b.flowId,
			isValidConnection: u() || ((...e) => b.isValidConnection?.(...e) ?? !0),
			updateConnection: b.updateConnection,
			cancelConnection: b.cancelConnection,
			panBy: b.panBy,
			onConnect: re,
			onConnectStart: b.onconnectstart,
			onConnectEnd: (...e) => b.onconnectend?.(...e),
			getTransform: () => [
				b.viewport.x,
				b.viewport.y,
				b.viewport.zoom
			],
			getFromHandle: () => b.connection.fromHandle,
			dragThreshold: b.connectionDragThreshold,
			handleDomNode: e.currentTarget
		});
	}
	function ae(e) {
		if (!h || !b.clickConnectStartHandle && !c()) return;
		if (!b.clickConnectStartHandle) {
			b.onclickconnectstart?.(e, {
				nodeId: h,
				handleId: n(),
				handleType: r()
			}), b.clickConnectStartHandle = {
				nodeId: h,
				type: r(),
				id: n()
			};
			return;
		}
		let t = Cf(e.target), i = u() ?? b.isValidConnection, { connectionMode: a, clickConnectStartHandle: o, flowId: s, nodeLookup: l } = b, { connection: d, isValid: f } = Mp.isValid(e, {
			handle: {
				nodeId: h,
				id: n(),
				type: r()
			},
			connectionMode: a,
			fromNodeId: o.nodeId,
			fromHandleId: o.id ?? null,
			fromType: o.type,
			isValidConnection: i,
			flowId: s,
			doc: t,
			lib: "svelte",
			nodeLookup: l
		});
		f && d && re(d);
		let p = structuredClone(Je(b.connection));
		delete p.inProgress, p.toPosition = p.toHandle ? p.toHandle.position : null, b.onclickconnectend?.(e, p), b.clickConnectStartHandle = null;
	}
	var O = {
		get id() {
			return n();
		},
		set id(e = null) {
			n(e), L();
		},
		get type() {
			return r();
		},
		set type(e = "source") {
			r(e), L();
		},
		get position() {
			return i();
		},
		set position(e = $.Top) {
			i(e), L();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), L();
		},
		get class() {
			return o();
		},
		set class(e) {
			o(e), L();
		},
		get isConnectable() {
			return s();
		},
		set isConnectable(e) {
			s(e), L();
		},
		get isConnectableStart() {
			return c();
		},
		set isConnectableStart(e = !0) {
			c(e), L();
		},
		get isConnectableEnd() {
			return l();
		},
		set isConnectableEnd(e = !0) {
			l(e), L();
		},
		get isValidConnection() {
			return u();
		},
		set isValidConnection(e) {
			u(e), L();
		},
		get onconnect() {
			return d();
		},
		set onconnect(e) {
			d(e), L();
		},
		get ondisconnect() {
			return f();
		},
		set ondisconnect(e) {
			f(e), L();
		},
		get children() {
			return p();
		},
		set children(e) {
			p(e), L();
		}
	}, k = am(), oe = () => {};
	return fa(k, () => ({
		"data-handleid": n(),
		"data-nodeid": h,
		"data-handlepos": i(),
		"data-id": `${b.flowId ?? ""}-${h ?? ""}-${n() ?? "null" ?? ""}-${r() ?? ""}`,
		class: [
			"svelte-flow__handle",
			`svelte-flow__handle-${i()}`,
			b.noDragClass,
			b.noPanClass,
			i(),
			o()
		],
		onmousedown: ie,
		ontouchstart: ie,
		onclick: b.clickConnect ? ae : void 0,
		onkeypress: oe,
		style: a(),
		role: "button",
		"aria-label": K(S)["handle.ariaLabel"],
		tabindex: "-1",
		...m,
		[$i]: {
			valid: K(ne),
			connectingto: K(ee),
			connectingfrom: K(D),
			source: !K(v),
			target: K(v),
			connectablestart: c(),
			connectableend: l(),
			connectable: K(y),
			connectionindicator: K(y) && (!K(E) || K(te)) && (K(E) || b.clickConnectStartHandle ? l() : c())
		}
	})), mi(B(k), () => p() ?? g), M(k), J(e, k), P(O);
}
Q(om, {
	id: {},
	type: {},
	position: {},
	style: {},
	class: {},
	isConnectable: {},
	isConnectableStart: {},
	isConnectableEnd: {},
	isValidConnection: {},
	onconnect: {},
	ondisconnect: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/DefaultNode.svelte
var sm = /* @__PURE__ */ q("<!> <!>", 1);
function cm(e, t) {
	N(t, !0);
	let n = Z(t, "data", 7), r = Z(t, "targetPosition", 23, () => $.Top), i = Z(t, "sourcePosition", 23, () => $.Bottom);
	var a = {
		get data() {
			return n();
		},
		set data(e) {
			n(e), L();
		},
		get targetPosition() {
			return r();
		},
		set targetPosition(e = $.Top) {
			r(e), L();
		},
		get sourcePosition() {
			return i();
		},
		set sourcePosition(e = $.Bottom) {
			i(e), L();
		}
	}, o = sm(), s = V(o);
	om(s, {
		type: "target",
		get position() {
			return r();
		}
	});
	var c = H(s);
	return om(H(c), {
		type: "source",
		get position() {
			return i();
		}
	}), U(() => oi(c, ` ${n()?.label ?? ""} `)), J(e, o), P(a);
}
Q(cm, {
	data: {},
	targetPosition: {},
	sourcePosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/InputNode.svelte
var lm = /* @__PURE__ */ q(" <!>", 1);
function um(e, t) {
	N(t, !0);
	let n = Z(t, "data", 23, () => ({ label: "Node" })), r = Z(t, "sourcePosition", 23, () => $.Bottom);
	var i = {
		get data() {
			return n();
		},
		set data(e = { label: "Node" }) {
			n(e), L();
		},
		get sourcePosition() {
			return r();
		},
		set sourcePosition(e = $.Bottom) {
			r(e), L();
		}
	};
	Ee();
	var a = lm(), o = V(a);
	return om(H(o), {
		type: "source",
		get position() {
			return r();
		}
	}), U(() => oi(o, `${n()?.label ?? ""} `)), J(e, a), P(i);
}
Q(um, {
	data: {},
	sourcePosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/OutputNode.svelte
var dm = /* @__PURE__ */ q(" <!>", 1);
function fm(e, t) {
	N(t, !0);
	let n = Z(t, "data", 23, () => ({ label: "Node" })), r = Z(t, "targetPosition", 23, () => $.Top);
	var i = {
		get data() {
			return n();
		},
		set data(e = { label: "Node" }) {
			n(e), L();
		},
		get targetPosition() {
			return r();
		},
		set targetPosition(e = $.Top) {
			r(e), L();
		}
	};
	Ee();
	var a = dm(), o = V(a);
	return om(H(o), {
		type: "target",
		get position() {
			return r();
		}
	}), U(() => oi(o, `${n()?.label ?? ""} `)), J(e, a), P(i);
}
Q(fm, {
	data: {},
	targetPosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/GroupNode.svelte
function pm(e, t) {}
Q(pm, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/portal.svelte.js
function mm(e, t, n) {
	if (!n || !t) return;
	let r = n === "root" ? t : t.querySelector(`.svelte-flow__${n}`);
	r && r.appendChild(e);
}
function hm(e, t) {
	let n = /* @__PURE__ */ F(Gm), r = /* @__PURE__ */ F(() => K(n).domNode), i;
	return K(r) ? mm(e, K(r), t) : i = Nn(() => {
		An(() => {
			mm(e, K(r), t), i?.();
		});
	}), {
		async update(t) {
			mm(e, K(r), t);
		},
		destroy() {
			e.parentNode && e.parentNode.removeChild(e), i?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/utils.svelte.js
function gm() {
	let e = /* @__PURE__ */ R(typeof window > "u");
	if (K(e)) {
		let t = Nn(() => {
			An(() => {
				z(e, !1), t?.();
			});
		});
	}
	return { get value() {
		return K(e);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/index.js
var _m = (e) => jd(e), vm = (e) => Ad(e);
function ym(e) {
	return e === void 0 ? void 0 : `${e}px`;
}
var bm = {
	ArrowUp: {
		x: 0,
		y: -1
	},
	ArrowDown: {
		x: 0,
		y: 1
	},
	ArrowLeft: {
		x: -1,
		y: 0
	},
	ArrowRight: {
		x: 1,
		y: 0
	}
}, xm = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"x",
	"y",
	"width",
	"height",
	"selectEdgeOnClick",
	"transparent",
	"class",
	"children"
]), Sm = /* @__PURE__ */ q("<div><!></div>"), Cm = {
	hash: "svelte-1wg91mu",
	code: ".transparent.svelte-1wg91mu {background:transparent;}"
};
function wm(e, t) {
	N(t, !0), ji(e, Cm);
	let n = Z(t, "x", 7, 0), r = Z(t, "y", 7, 0), i = Z(t, "width", 7), a = Z(t, "height", 7), o = Z(t, "selectEdgeOnClick", 7, !1), s = Z(t, "transparent", 7, !1), c = Z(t, "class", 7), l = Z(t, "children", 7), u = /* @__PURE__ */ Oa(t, xm), d = Gm(), f = nm("EdgeLabel must be used within a Custom Edge component"), p = /* @__PURE__ */ F(() => d.visible.edges.get(f)?.zIndex);
	var m = {
		get x() {
			return n();
		},
		set x(e = 0) {
			n(e), L();
		},
		get y() {
			return r();
		},
		set y(e = 0) {
			r(e), L();
		},
		get width() {
			return i();
		},
		set width(e) {
			i(e), L();
		},
		get height() {
			return a();
		},
		set height(e) {
			a(e), L();
		},
		get selectEdgeOnClick() {
			return o();
		},
		set selectEdgeOnClick(e = !1) {
			o(e), L();
		},
		get transparent() {
			return s();
		},
		set transparent(e = !1) {
			s(e), L();
		},
		get class() {
			return c();
		},
		set class(e) {
			c(e), L();
		},
		get children() {
			return l();
		},
		set children(e) {
			l(e), L();
		}
	}, h = Sm(), _ = () => {
		o() && f && d.handleEdgeSelection(f);
	};
	return fa(h, (e, t, i) => ({
		class: [
			"svelte-flow__edge-label",
			{ transparent: s() },
			c()
		],
		tabindex: "-1",
		onclick: _,
		...u,
		[ea]: {
			display: e,
			cursor: o() ? "pointer" : void 0,
			transform: `translate(-50%, -50%) translate(${n() ?? ""}px,${r() ?? ""}px)`,
			"pointer-events": "all",
			width: t,
			height: i,
			"z-index": K(p)
		}
	}), [
		() => gm().value ? "none" : void 0,
		() => ym(i()),
		() => ym(a())
	], void 0, void 0, "svelte-1wg91mu"), mi(B(h), () => l() ?? g), M(h), Mi(h, (e, t) => hm?.(e, t), () => "edge-labels"), J(e, h), P(m);
}
Q(wm, {
	x: {},
	y: {},
	width: {},
	height: {},
	selectEdgeOnClick: {},
	transparent: {},
	class: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/BaseEdge.svelte
var Tm = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"id",
	"path",
	"label",
	"labelX",
	"labelY",
	"labelStyle",
	"markerStart",
	"markerEnd",
	"style",
	"interactionWidth",
	"class"
]), Em = /* @__PURE__ */ Gr("<path></path>"), Dm = /* @__PURE__ */ Gr("<path fill=\"none\"></path><!><!>", 1);
function Om(e, t) {
	N(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "path", 7), i = Z(t, "label", 7), a = Z(t, "labelX", 7), o = Z(t, "labelY", 7), s = Z(t, "labelStyle", 7), c = Z(t, "markerStart", 7), l = Z(t, "markerEnd", 7), u = Z(t, "style", 7), d = Z(t, "interactionWidth", 7, 20), f = Z(t, "class", 7), p = /* @__PURE__ */ Oa(t, Tm);
	var m = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), L();
		},
		get path() {
			return r();
		},
		set path(e) {
			r(e), L();
		},
		get label() {
			return i();
		},
		set label(e) {
			i(e), L();
		},
		get labelX() {
			return a();
		},
		set labelX(e) {
			a(e), L();
		},
		get labelY() {
			return o();
		},
		set labelY(e) {
			o(e), L();
		},
		get labelStyle() {
			return s();
		},
		set labelStyle(e) {
			s(e), L();
		},
		get markerStart() {
			return c();
		},
		set markerStart(e) {
			c(e), L();
		},
		get markerEnd() {
			return l();
		},
		set markerEnd(e) {
			l(e), L();
		},
		get style() {
			return u();
		},
		set style(e) {
			u(e), L();
		},
		get interactionWidth() {
			return d();
		},
		set interactionWidth(e = 20) {
			d(e), L();
		},
		get class() {
			return f();
		},
		set class(e) {
			f(e), L();
		}
	}, h = Dm(), g = V(h), _ = H(g), v = (e) => {
		var t = Em();
		fa(t, () => ({
			d: r(),
			"stroke-opacity": 0,
			"stroke-width": d(),
			fill: "none",
			class: "svelte-flow__edge-interaction",
			...p
		})), J(e, t);
	};
	Y(_, (e) => {
		d() > 0 && e(v);
	});
	var y = H(_), b = (e) => {
		wm(e, {
			get x() {
				return a();
			},
			get y() {
				return o();
			},
			get style() {
				return s();
			},
			selectEdgeOnClick: !0,
			children: (e, t) => {
				Ee();
				var n = Kr();
				U(() => oi(n, i())), J(e, n);
			},
			$$slots: { default: !0 }
		});
	};
	return Y(y, (e) => {
		i() && e(b);
	}), U(() => {
		X(g, "id", n()), X(g, "d", r()), Hi(g, 0, Ii(["svelte-flow__edge-path", f()])), X(g, "marker-start", c()), X(g, "marker-end", l()), Wi(g, u());
	}), J(e, h), P(m);
}
Q(Om, {
	id: {},
	path: {},
	label: {},
	labelX: {},
	labelY: {},
	labelStyle: {},
	markerStart: {},
	markerEnd: {},
	style: {},
	interactionWidth: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/BezierEdge.svelte
function km(e, t) {
	N(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "interactionWidth", 7), i = Z(t, "label", 7), a = Z(t, "labelStyle", 7), o = Z(t, "markerEnd", 7), s = Z(t, "markerStart", 7), c = Z(t, "pathOptions", 7), l = Z(t, "sourcePosition", 7), u = Z(t, "sourceX", 7), d = Z(t, "sourceY", 7), f = Z(t, "style", 7), p = Z(t, "targetPosition", 7), m = Z(t, "targetX", 7), h = Z(t, "targetY", 7), g = /* @__PURE__ */ F(() => Mf({
		sourceX: u(),
		sourceY: d(),
		targetX: m(),
		targetY: h(),
		sourcePosition: l(),
		targetPosition: p(),
		curvature: c()?.curvature
	})), _ = /* @__PURE__ */ F(() => x(K(g), 3)), v = /* @__PURE__ */ F(() => K(_)[0]), y = /* @__PURE__ */ F(() => K(_)[1]), b = /* @__PURE__ */ F(() => K(_)[2]);
	return Om(e, {
		get id() {
			return n();
		},
		get path() {
			return K(v);
		},
		get labelX() {
			return K(y);
		},
		get labelY() {
			return K(b);
		},
		get label() {
			return i();
		},
		get labelStyle() {
			return a();
		},
		get markerStart() {
			return s();
		},
		get markerEnd() {
			return o();
		},
		get interactionWidth() {
			return r();
		},
		get style() {
			return f();
		}
	}), P({
		get id() {
			return n();
		},
		set id(e) {
			n(e), L();
		},
		get interactionWidth() {
			return r();
		},
		set interactionWidth(e) {
			r(e), L();
		},
		get label() {
			return i();
		},
		set label(e) {
			i(e), L();
		},
		get labelStyle() {
			return a();
		},
		set labelStyle(e) {
			a(e), L();
		},
		get markerEnd() {
			return o();
		},
		set markerEnd(e) {
			o(e), L();
		},
		get markerStart() {
			return s();
		},
		set markerStart(e) {
			s(e), L();
		},
		get pathOptions() {
			return c();
		},
		set pathOptions(e) {
			c(e), L();
		},
		get sourcePosition() {
			return l();
		},
		set sourcePosition(e) {
			l(e), L();
		},
		get sourceX() {
			return u();
		},
		set sourceX(e) {
			u(e), L();
		},
		get sourceY() {
			return d();
		},
		set sourceY(e) {
			d(e), L();
		},
		get style() {
			return f();
		},
		set style(e) {
			f(e), L();
		},
		get targetPosition() {
			return p();
		},
		set targetPosition(e) {
			p(e), L();
		},
		get targetX() {
			return m();
		},
		set targetX(e) {
			m(e), L();
		},
		get targetY() {
			return h();
		},
		set targetY(e) {
			h(e), L();
		}
	});
}
Q(km, {
	id: {},
	interactionWidth: {},
	label: {},
	labelStyle: {},
	markerEnd: {},
	markerStart: {},
	pathOptions: {},
	sourcePosition: {},
	sourceX: {},
	sourceY: {},
	style: {},
	targetPosition: {},
	targetX: {},
	targetY: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/SmoothStepEdgeInternal.svelte
function Am(e, t) {
	N(t, !0);
	let n = Z(t, "interactionWidth", 7), r = Z(t, "label", 7), i = Z(t, "labelStyle", 7), a = Z(t, "style", 7), o = Z(t, "markerEnd", 7), s = Z(t, "markerStart", 7), c = Z(t, "sourcePosition", 7), l = Z(t, "sourceX", 7), u = Z(t, "sourceY", 7), d = Z(t, "targetPosition", 7), f = Z(t, "targetX", 7), p = Z(t, "targetY", 7), m = /* @__PURE__ */ F(() => Gf({
		sourceX: l(),
		sourceY: u(),
		targetX: f(),
		targetY: p(),
		sourcePosition: c(),
		targetPosition: d()
	})), h = /* @__PURE__ */ F(() => x(K(m), 3)), g = /* @__PURE__ */ F(() => K(h)[0]), _ = /* @__PURE__ */ F(() => K(h)[1]), v = /* @__PURE__ */ F(() => K(h)[2]);
	return Om(e, {
		get path() {
			return K(g);
		},
		get labelX() {
			return K(_);
		},
		get labelY() {
			return K(v);
		},
		get label() {
			return r();
		},
		get labelStyle() {
			return i();
		},
		get markerStart() {
			return s();
		},
		get markerEnd() {
			return o();
		},
		get interactionWidth() {
			return n();
		},
		get style() {
			return a();
		}
	}), P({
		get interactionWidth() {
			return n();
		},
		set interactionWidth(e) {
			n(e), L();
		},
		get label() {
			return r();
		},
		set label(e) {
			r(e), L();
		},
		get labelStyle() {
			return i();
		},
		set labelStyle(e) {
			i(e), L();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), L();
		},
		get markerEnd() {
			return o();
		},
		set markerEnd(e) {
			o(e), L();
		},
		get markerStart() {
			return s();
		},
		set markerStart(e) {
			s(e), L();
		},
		get sourcePosition() {
			return c();
		},
		set sourcePosition(e) {
			c(e), L();
		},
		get sourceX() {
			return l();
		},
		set sourceX(e) {
			l(e), L();
		},
		get sourceY() {
			return u();
		},
		set sourceY(e) {
			u(e), L();
		},
		get targetPosition() {
			return d();
		},
		set targetPosition(e) {
			d(e), L();
		},
		get targetX() {
			return f();
		},
		set targetX(e) {
			f(e), L();
		},
		get targetY() {
			return p();
		},
		set targetY(e) {
			p(e), L();
		}
	});
}
Q(Am, {
	interactionWidth: {},
	label: {},
	labelStyle: {},
	style: {},
	markerEnd: {},
	markerStart: {},
	sourcePosition: {},
	sourceX: {},
	sourceY: {},
	targetPosition: {},
	targetX: {},
	targetY: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/StraightEdgeInternal.svelte
function jm(e, t) {
	N(t, !0);
	let n = Z(t, "sourceX", 7), r = Z(t, "sourceY", 7), i = Z(t, "targetX", 7), a = Z(t, "targetY", 7), o = Z(t, "label", 7), s = Z(t, "labelStyle", 7), c = Z(t, "markerStart", 7), l = Z(t, "markerEnd", 7), u = Z(t, "interactionWidth", 7), d = Z(t, "style", 7), f = /* @__PURE__ */ F(() => zf({
		sourceX: n(),
		sourceY: r(),
		targetX: i(),
		targetY: a()
	})), p = /* @__PURE__ */ F(() => x(K(f), 3)), m = /* @__PURE__ */ F(() => K(p)[0]), h = /* @__PURE__ */ F(() => K(p)[1]), g = /* @__PURE__ */ F(() => K(p)[2]);
	return Om(e, {
		get path() {
			return K(m);
		},
		get labelX() {
			return K(h);
		},
		get labelY() {
			return K(g);
		},
		get label() {
			return o();
		},
		get labelStyle() {
			return s();
		},
		get markerStart() {
			return c();
		},
		get markerEnd() {
			return l();
		},
		get interactionWidth() {
			return u();
		},
		get style() {
			return d();
		}
	}), P({
		get sourceX() {
			return n();
		},
		set sourceX(e) {
			n(e), L();
		},
		get sourceY() {
			return r();
		},
		set sourceY(e) {
			r(e), L();
		},
		get targetX() {
			return i();
		},
		set targetX(e) {
			i(e), L();
		},
		get targetY() {
			return a();
		},
		set targetY(e) {
			a(e), L();
		},
		get label() {
			return o();
		},
		set label(e) {
			o(e), L();
		},
		get labelStyle() {
			return s();
		},
		set labelStyle(e) {
			s(e), L();
		},
		get markerStart() {
			return c();
		},
		set markerStart(e) {
			c(e), L();
		},
		get markerEnd() {
			return l();
		},
		set markerEnd(e) {
			l(e), L();
		},
		get interactionWidth() {
			return u();
		},
		set interactionWidth(e) {
			u(e), L();
		},
		get style() {
			return d();
		},
		set style(e) {
			d(e), L();
		}
	});
}
Q(jm, {
	sourceX: {},
	sourceY: {},
	targetX: {},
	targetY: {},
	label: {},
	labelStyle: {},
	markerStart: {},
	markerEnd: {},
	interactionWidth: {},
	style: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/StepEdgeInternal.svelte
function Mm(e, t) {
	N(t, !0);
	let n = Z(t, "sourceX", 7), r = Z(t, "sourceY", 7), i = Z(t, "sourcePosition", 7), a = Z(t, "targetX", 7), o = Z(t, "targetY", 7), s = Z(t, "targetPosition", 7), c = Z(t, "label", 7), l = Z(t, "labelStyle", 7), u = Z(t, "markerStart", 7), d = Z(t, "markerEnd", 7), f = Z(t, "interactionWidth", 7), p = Z(t, "style", 7), m = /* @__PURE__ */ F(() => Gf({
		sourceX: n(),
		sourceY: r(),
		targetX: a(),
		targetY: o(),
		sourcePosition: i(),
		targetPosition: s(),
		borderRadius: 0
	})), h = /* @__PURE__ */ F(() => x(K(m), 3)), g = /* @__PURE__ */ F(() => K(h)[0]), _ = /* @__PURE__ */ F(() => K(h)[1]), v = /* @__PURE__ */ F(() => K(h)[2]);
	return Om(e, {
		get path() {
			return K(g);
		},
		get labelX() {
			return K(_);
		},
		get labelY() {
			return K(v);
		},
		get label() {
			return c();
		},
		get labelStyle() {
			return l();
		},
		get markerStart() {
			return u();
		},
		get markerEnd() {
			return d();
		},
		get interactionWidth() {
			return f();
		},
		get style() {
			return p();
		}
	}), P({
		get sourceX() {
			return n();
		},
		set sourceX(e) {
			n(e), L();
		},
		get sourceY() {
			return r();
		},
		set sourceY(e) {
			r(e), L();
		},
		get sourcePosition() {
			return i();
		},
		set sourcePosition(e) {
			i(e), L();
		},
		get targetX() {
			return a();
		},
		set targetX(e) {
			a(e), L();
		},
		get targetY() {
			return o();
		},
		set targetY(e) {
			o(e), L();
		},
		get targetPosition() {
			return s();
		},
		set targetPosition(e) {
			s(e), L();
		},
		get label() {
			return c();
		},
		set label(e) {
			c(e), L();
		},
		get labelStyle() {
			return l();
		},
		set labelStyle(e) {
			l(e), L();
		},
		get markerStart() {
			return u();
		},
		set markerStart(e) {
			u(e), L();
		},
		get markerEnd() {
			return d();
		},
		set markerEnd(e) {
			d(e), L();
		},
		get interactionWidth() {
			return f();
		},
		set interactionWidth(e) {
			f(e), L();
		},
		get style() {
			return p();
		},
		set style(e) {
			p(e), L();
		}
	});
}
Q(Mm, {
	sourceX: {},
	sourceY: {},
	sourcePosition: {},
	targetX: {},
	targetY: {},
	targetPosition: {},
	label: {},
	labelStyle: {},
	markerStart: {},
	markerEnd: {},
	interactionWidth: {},
	style: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/svelte/src/reactivity/reactive-value.js
var Nm = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = ni(t);
	}
	get current() {
		return this.#t(), this.#e();
	}
}, Pm = /\(.+\)/, Fm = /* @__PURE__ */ new Set([
	"all",
	"print",
	"screen",
	"and",
	"or",
	"not",
	"only"
]), Im = class extends Nm {
	constructor(e, t) {
		let n = Pm.test(e) || e.split(/[\s,]+/).some((e) => Fm.has(e.trim())) ? e : `(${e})`, r = window.matchMedia(n);
		super(() => r.matches, (e) => Nr(r, "change", e));
	}
};
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/visibleElements.js
function Lm(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	return Id(e, {
		x: 0,
		y: 0,
		width: n,
		height: r
	}, t, !0).forEach((e) => {
		i.set(e.id, e);
	}), i;
}
function Rm(e) {
	let { edges: t, defaultEdgeOptions: n, nodeLookup: r, previousEdges: i, connectionMode: a, onerror: o, onlyRenderVisible: s, elevateEdgesOnSelect: c, zIndexMode: l } = e, u = /* @__PURE__ */ new Map();
	for (let d of t) {
		let t = r.get(d.source), f = r.get(d.target);
		if (!t || !f || t.hidden || f.hidden) continue;
		if (s) {
			let { visibleNodes: n, transform: r, width: i, height: a } = e;
			if (Ff({
				sourceNode: t,
				targetNode: f,
				width: i,
				height: a,
				transform: r
			})) n.set(t.id, t), n.set(f.id, f);
			else continue;
		}
		let p = i.get(d.id);
		if (p && d === p.edge && t == p.sourceNode && f == p.targetNode) {
			u.set(d.id, p);
			continue;
		}
		let m = qf({
			id: d.id,
			sourceNode: t,
			targetNode: f,
			sourceHandle: d.sourceHandle || null,
			targetHandle: d.targetHandle || null,
			connectionMode: a,
			onError: o
		});
		m && u.set(d.id, {
			...n,
			...d,
			...m,
			zIndex: Pf({
				selected: d.selected,
				zIndex: d.zIndex ?? n.zIndex,
				sourceNode: t,
				targetNode: f,
				elevateOnSelect: c,
				zIndexMode: l
			}),
			sourceNode: t,
			targetNode: f,
			edge: d
		});
	}
	return u;
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/initial-store.svelte.js
var zm = rf("Svelte Flow", "https://svelteflow.dev/"), Bm = {
	input: um,
	output: fm,
	default: cm,
	group: pm
}, Vm = {
	straight: jm,
	smoothstep: Am,
	default: km,
	step: Mm
};
function Hm(e, t, n, r, i, a) {
	return t && !n && r && i ? df(Fd(a, { filter: (e) => !(!e.width && !e.initialWidth || !e.height && !e.initialHeight) }), r, i, .5, 2, .1) : n ?? {
		x: 0,
		y: 0,
		zoom: 1
	};
}
function Um(e) {
	class t {
		#e = /* @__PURE__ */ F(() => e.props.id ?? "1");
		get flowId() {
			return K(this.#e);
		}
		set flowId(e) {
			z(this.#e, e);
		}
		#t = /* @__PURE__ */ R(null);
		get domNode() {
			return K(this.#t);
		}
		set domNode(e) {
			z(this.#t, e);
		}
		#n = /* @__PURE__ */ R(null);
		get panZoom() {
			return K(this.#n);
		}
		set panZoom(e) {
			z(this.#n, e);
		}
		#r = /* @__PURE__ */ R(e.width ?? 0);
		get width() {
			return K(this.#r);
		}
		set width(e) {
			z(this.#r, e);
		}
		#i = /* @__PURE__ */ R(e.height ?? 0);
		get height() {
			return K(this.#i);
		}
		set height(e) {
			z(this.#i, e);
		}
		#a = /* @__PURE__ */ R(e.props.zIndexMode ?? "basic");
		get zIndexMode() {
			return K(this.#a);
		}
		set zIndexMode(e) {
			z(this.#a, e);
		}
		#o = /* @__PURE__ */ F(() => {
			let { nodesInitialized: t } = sp(e.nodes, this.nodeLookup, this.parentLookup, {
				nodeExtent: this.nodeExtent,
				nodeOrigin: this.nodeOrigin,
				elevateNodesOnSelect: e.props.elevateNodesOnSelect ?? !0,
				checkEquality: !0,
				zIndexMode: this.zIndexMode
			});
			return this.fitViewQueued && t && (this.fitViewOptions?.duration ? this.resolveFitView() : queueMicrotask(() => {
				this.resolveFitView();
			})), t;
		});
		get nodesInitialized() {
			return K(this.#o);
		}
		set nodesInitialized(e) {
			z(this.#o, e);
		}
		#s = /* @__PURE__ */ F(() => this.panZoom !== null);
		get viewportInitialized() {
			return K(this.#s);
		}
		set viewportInitialized(e) {
			z(this.#s, e);
		}
		#c = /* @__PURE__ */ F(() => (gp(this.connectionLookup, this.edgeLookup, e.edges), e.edges));
		get _edges() {
			return K(this.#c);
		}
		set _edges(e) {
			z(this.#c, e);
		}
		get nodes() {
			return this.nodesInitialized, e.nodes;
		}
		set nodes(t) {
			e.nodes = t;
		}
		get edges() {
			return this._edges;
		}
		set edges(t) {
			e.edges = t;
		}
		_prevSelectedNodes = [];
		_prevSelectedNodeIds = /* @__PURE__ */ new Set();
		#l = /* @__PURE__ */ F(() => {
			let e = this._prevSelectedNodeIds.size, t = /* @__PURE__ */ new Set(), n = this.nodes.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedNodeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedNodeIds.size > 0) && (this._prevSelectedNodes = n), this._prevSelectedNodeIds = t, this._prevSelectedNodes;
		});
		get selectedNodes() {
			return K(this.#l);
		}
		set selectedNodes(e) {
			z(this.#l, e);
		}
		_prevSelectedEdges = [];
		_prevSelectedEdgeIds = /* @__PURE__ */ new Set();
		#u = /* @__PURE__ */ F(() => {
			let e = this._prevSelectedEdgeIds.size, t = /* @__PURE__ */ new Set(), n = this.edges.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedEdgeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedEdgeIds.size > 0) && (this._prevSelectedEdges = n), this._prevSelectedEdgeIds = t, this._prevSelectedEdges;
		});
		get selectedEdges() {
			return K(this.#u);
		}
		set selectedEdges(e) {
			z(this.#u, e);
		}
		selectionChangeHandlers = /* @__PURE__ */ new Map();
		nodeLookup = /* @__PURE__ */ new Map();
		parentLookup = /* @__PURE__ */ new Map();
		connectionLookup = /* @__PURE__ */ new Map();
		edgeLookup = /* @__PURE__ */ new Map();
		_prevVisibleEdges = /* @__PURE__ */ new Map();
		#d = /* @__PURE__ */ F(() => {
			let { nodes: t, _edges: n, _prevVisibleEdges: r, nodeLookup: i, connectionMode: a, onerror: o, onlyRenderVisibleElements: s, defaultEdgeOptions: c, zIndexMode: l } = this, u, d, f = {
				edges: n,
				defaultEdgeOptions: c,
				previousEdges: r,
				nodeLookup: i,
				connectionMode: a,
				elevateEdgesOnSelect: e.props.elevateEdgesOnSelect ?? !0,
				zIndexMode: l,
				onerror: o
			};
			if (s) {
				let { viewport: e, width: t, height: n } = this, r = [
					e.x,
					e.y,
					e.zoom
				];
				u = Lm(i, r, t, n), d = Rm({
					...f,
					onlyRenderVisible: !0,
					visibleNodes: u,
					transform: r,
					width: t,
					height: n
				});
			} else u = this.nodeLookup, d = Rm(f);
			return this._prevVisibleEdges = d, {
				nodes: u,
				edges: d
			};
		});
		get visible() {
			return K(this.#d);
		}
		set visible(e) {
			z(this.#d, e);
		}
		#f = /* @__PURE__ */ F(() => e.props.nodesDraggable ?? !0);
		get nodesDraggable() {
			return K(this.#f);
		}
		set nodesDraggable(e) {
			z(this.#f, e);
		}
		#p = /* @__PURE__ */ F(() => e.props.nodesConnectable ?? !0);
		get nodesConnectable() {
			return K(this.#p);
		}
		set nodesConnectable(e) {
			z(this.#p, e);
		}
		#m = /* @__PURE__ */ F(() => e.props.elementsSelectable ?? !0);
		get elementsSelectable() {
			return K(this.#m);
		}
		set elementsSelectable(e) {
			z(this.#m, e);
		}
		#h = /* @__PURE__ */ F(() => e.props.nodesFocusable ?? !0);
		get nodesFocusable() {
			return K(this.#h);
		}
		set nodesFocusable(e) {
			z(this.#h, e);
		}
		#g = /* @__PURE__ */ F(() => e.props.edgesFocusable ?? !0);
		get edgesFocusable() {
			return K(this.#g);
		}
		set edgesFocusable(e) {
			z(this.#g, e);
		}
		#_ = /* @__PURE__ */ F(() => e.props.disableKeyboardA11y ?? !1);
		get disableKeyboardA11y() {
			return K(this.#_);
		}
		set disableKeyboardA11y(e) {
			z(this.#_, e);
		}
		#v = /* @__PURE__ */ F(() => e.props.minZoom ?? .5);
		get minZoom() {
			return K(this.#v);
		}
		set minZoom(e) {
			z(this.#v, e);
		}
		#y = /* @__PURE__ */ F(() => e.props.maxZoom ?? 2);
		get maxZoom() {
			return K(this.#y);
		}
		set maxZoom(e) {
			z(this.#y, e);
		}
		#b = /* @__PURE__ */ F(() => e.props.nodeOrigin ?? [0, 0]);
		get nodeOrigin() {
			return K(this.#b);
		}
		set nodeOrigin(e) {
			z(this.#b, e);
		}
		#x = /* @__PURE__ */ F(() => e.props.nodeExtent ?? bd);
		get nodeExtent() {
			return K(this.#x);
		}
		set nodeExtent(e) {
			z(this.#x, e);
		}
		#S = /* @__PURE__ */ F(() => e.props.translateExtent ?? bd);
		get translateExtent() {
			return K(this.#S);
		}
		set translateExtent(e) {
			z(this.#S, e);
		}
		#C = /* @__PURE__ */ F(() => e.props.defaultEdgeOptions ?? {});
		get defaultEdgeOptions() {
			return K(this.#C);
		}
		set defaultEdgeOptions(e) {
			z(this.#C, e);
		}
		#w = /* @__PURE__ */ F(() => e.props.nodeDragThreshold ?? 1);
		get nodeDragThreshold() {
			return K(this.#w);
		}
		set nodeDragThreshold(e) {
			z(this.#w, e);
		}
		#T = /* @__PURE__ */ F(() => e.props.autoPanOnNodeDrag ?? !0);
		get autoPanOnNodeDrag() {
			return K(this.#T);
		}
		set autoPanOnNodeDrag(e) {
			z(this.#T, e);
		}
		#E = /* @__PURE__ */ F(() => e.props.autoPanOnConnect ?? !0);
		get autoPanOnConnect() {
			return K(this.#E);
		}
		set autoPanOnConnect(e) {
			z(this.#E, e);
		}
		#D = /* @__PURE__ */ F(() => e.props.autoPanOnNodeFocus ?? !0);
		get autoPanOnNodeFocus() {
			return K(this.#D);
		}
		set autoPanOnNodeFocus(e) {
			z(this.#D, e);
		}
		#O = /* @__PURE__ */ F(() => e.props.autoPanSpeed ?? 15);
		get autoPanSpeed() {
			return K(this.#O);
		}
		set autoPanSpeed(e) {
			z(this.#O, e);
		}
		#k = /* @__PURE__ */ F(() => e.props.connectionDragThreshold ?? 1);
		get connectionDragThreshold() {
			return K(this.#k);
		}
		set connectionDragThreshold(e) {
			z(this.#k, e);
		}
		fitViewQueued = e.props.fitView ?? !1;
		fitViewOptions = e.props.fitViewOptions;
		fitViewResolver = null;
		#A = /* @__PURE__ */ F(() => e.props.snapGrid ?? null);
		get snapGrid() {
			return K(this.#A);
		}
		set snapGrid(e) {
			z(this.#A, e);
		}
		#j = /* @__PURE__ */ R(!1);
		get dragging() {
			return K(this.#j);
		}
		set dragging(e) {
			z(this.#j, e);
		}
		#M = /* @__PURE__ */ R(null);
		get selectionRect() {
			return K(this.#M);
		}
		set selectionRect(e) {
			z(this.#M, e);
		}
		#N = /* @__PURE__ */ R(!1);
		get selectionKeyPressed() {
			return K(this.#N);
		}
		set selectionKeyPressed(e) {
			z(this.#N, e);
		}
		#P = /* @__PURE__ */ R(!1);
		get multiselectionKeyPressed() {
			return K(this.#P);
		}
		set multiselectionKeyPressed(e) {
			z(this.#P, e);
		}
		#F = /* @__PURE__ */ R(!1);
		get deleteKeyPressed() {
			return K(this.#F);
		}
		set deleteKeyPressed(e) {
			z(this.#F, e);
		}
		#I = /* @__PURE__ */ R(!1);
		get panActivationKeyPressed() {
			return K(this.#I);
		}
		set panActivationKeyPressed(e) {
			z(this.#I, e);
		}
		#L = /* @__PURE__ */ R(!1);
		get zoomActivationKeyPressed() {
			return K(this.#L);
		}
		set zoomActivationKeyPressed(e) {
			z(this.#L, e);
		}
		#R = /* @__PURE__ */ R(null);
		get selectionRectMode() {
			return K(this.#R);
		}
		set selectionRectMode(e) {
			z(this.#R, e);
		}
		#z = /* @__PURE__ */ R("");
		get ariaLiveMessage() {
			return K(this.#z);
		}
		set ariaLiveMessage(e) {
			z(this.#z, e);
		}
		#B = /* @__PURE__ */ F(() => e.props.selectionMode ?? Td.Partial);
		get selectionMode() {
			return K(this.#B);
		}
		set selectionMode(e) {
			z(this.#B, e);
		}
		#V = /* @__PURE__ */ F(() => ({
			...Bm,
			...e.props.nodeTypes
		}));
		get nodeTypes() {
			return K(this.#V);
		}
		set nodeTypes(e) {
			z(this.#V, e);
		}
		#H = /* @__PURE__ */ F(() => ({
			...Vm,
			...e.props.edgeTypes
		}));
		get edgeTypes() {
			return K(this.#H);
		}
		set edgeTypes(e) {
			z(this.#H, e);
		}
		#U = /* @__PURE__ */ F(() => e.props.noPanClass ?? "nopan");
		get noPanClass() {
			return K(this.#U);
		}
		set noPanClass(e) {
			z(this.#U, e);
		}
		#W = /* @__PURE__ */ F(() => e.props.noDragClass ?? "nodrag");
		get noDragClass() {
			return K(this.#W);
		}
		set noDragClass(e) {
			z(this.#W, e);
		}
		#G = /* @__PURE__ */ F(() => e.props.noWheelClass ?? "nowheel");
		get noWheelClass() {
			return K(this.#G);
		}
		set noWheelClass(e) {
			z(this.#G, e);
		}
		#K = /* @__PURE__ */ F(() => _f(e.props.ariaLabelConfig));
		get ariaLabelConfig() {
			return K(this.#K);
		}
		set ariaLabelConfig(e) {
			z(this.#K, e);
		}
		#q = /* @__PURE__ */ R(Hm(this.nodesInitialized, e.props.fitView, e.props.initialViewport, this.width, this.height, this.nodeLookup));
		get _viewport() {
			return K(this.#q);
		}
		set _viewport(e) {
			z(this.#q, e);
		}
		get viewport() {
			return e.viewport ?? this._viewport;
		}
		set viewport(t) {
			e.viewport &&= t, this._viewport = t;
		}
		#J = /* @__PURE__ */ R(Ed);
		get _connection() {
			return K(this.#J);
		}
		set _connection(e) {
			z(this.#J, e);
		}
		#Y = /* @__PURE__ */ F(() => this._connection.inProgress ? {
			...this._connection,
			to: of(this._connection.to, [
				this.viewport.x,
				this.viewport.y,
				this.viewport.zoom
			])
		} : this._connection);
		get connection() {
			return K(this.#Y);
		}
		set connection(e) {
			z(this.#Y, e);
		}
		#X = /* @__PURE__ */ F(() => e.props.connectionMode ?? Cd.Strict);
		get connectionMode() {
			return K(this.#X);
		}
		set connectionMode(e) {
			z(this.#X, e);
		}
		#Z = /* @__PURE__ */ F(() => e.props.connectionRadius ?? 20);
		get connectionRadius() {
			return K(this.#Z);
		}
		set connectionRadius(e) {
			z(this.#Z, e);
		}
		#Q = /* @__PURE__ */ F(() => e.props.isValidConnection ?? (() => !0));
		get isValidConnection() {
			return K(this.#Q);
		}
		set isValidConnection(e) {
			z(this.#Q, e);
		}
		#$ = /* @__PURE__ */ F(() => e.props.selectNodesOnDrag ?? !0);
		get selectNodesOnDrag() {
			return K(this.#$);
		}
		set selectNodesOnDrag(e) {
			z(this.#$, e);
		}
		#ee = /* @__PURE__ */ F(() => e.props.defaultMarkerColor === void 0 ? "#b1b1b7" : e.props.defaultMarkerColor);
		get defaultMarkerColor() {
			return K(this.#ee);
		}
		set defaultMarkerColor(e) {
			z(this.#ee, e);
		}
		#te = /* @__PURE__ */ F(() => Qf(e.edges, {
			defaultColor: this.defaultMarkerColor,
			id: this.flowId,
			defaultMarkerStart: this.defaultEdgeOptions.markerStart,
			defaultMarkerEnd: this.defaultEdgeOptions.markerEnd
		}));
		get markers() {
			return K(this.#te);
		}
		set markers(e) {
			z(this.#te, e);
		}
		#ne = /* @__PURE__ */ F(() => e.props.onlyRenderVisibleElements ?? !1);
		get onlyRenderVisibleElements() {
			return K(this.#ne);
		}
		set onlyRenderVisibleElements(e) {
			z(this.#ne, e);
		}
		#re = /* @__PURE__ */ F(() => e.props.onflowerror ?? zm);
		get onerror() {
			return K(this.#re);
		}
		set onerror(e) {
			z(this.#re, e);
		}
		#ie = /* @__PURE__ */ F(() => e.props.ondelete);
		get ondelete() {
			return K(this.#ie);
		}
		set ondelete(e) {
			z(this.#ie, e);
		}
		#ae = /* @__PURE__ */ F(() => e.props.onbeforedelete);
		get onbeforedelete() {
			return K(this.#ae);
		}
		set onbeforedelete(e) {
			z(this.#ae, e);
		}
		#oe = /* @__PURE__ */ F(() => e.props.onbeforeconnect);
		get onbeforeconnect() {
			return K(this.#oe);
		}
		set onbeforeconnect(e) {
			z(this.#oe, e);
		}
		#se = /* @__PURE__ */ F(() => e.props.onconnect);
		get onconnect() {
			return K(this.#se);
		}
		set onconnect(e) {
			z(this.#se, e);
		}
		#ce = /* @__PURE__ */ F(() => e.props.onconnectstart);
		get onconnectstart() {
			return K(this.#ce);
		}
		set onconnectstart(e) {
			z(this.#ce, e);
		}
		#le = /* @__PURE__ */ F(() => e.props.onconnectend);
		get onconnectend() {
			return K(this.#le);
		}
		set onconnectend(e) {
			z(this.#le, e);
		}
		#ue = /* @__PURE__ */ F(() => e.props.onbeforereconnect);
		get onbeforereconnect() {
			return K(this.#ue);
		}
		set onbeforereconnect(e) {
			z(this.#ue, e);
		}
		#de = /* @__PURE__ */ F(() => e.props.onreconnect);
		get onreconnect() {
			return K(this.#de);
		}
		set onreconnect(e) {
			z(this.#de, e);
		}
		#fe = /* @__PURE__ */ F(() => e.props.onreconnectstart);
		get onreconnectstart() {
			return K(this.#fe);
		}
		set onreconnectstart(e) {
			z(this.#fe, e);
		}
		#pe = /* @__PURE__ */ F(() => e.props.onreconnectend);
		get onreconnectend() {
			return K(this.#pe);
		}
		set onreconnectend(e) {
			z(this.#pe, e);
		}
		#me = /* @__PURE__ */ F(() => e.props.clickConnect ?? !0);
		get clickConnect() {
			return K(this.#me);
		}
		set clickConnect(e) {
			z(this.#me, e);
		}
		#he = /* @__PURE__ */ F(() => e.props.onclickconnectstart);
		get onclickconnectstart() {
			return K(this.#he);
		}
		set onclickconnectstart(e) {
			z(this.#he, e);
		}
		#ge = /* @__PURE__ */ F(() => e.props.onclickconnectend);
		get onclickconnectend() {
			return K(this.#ge);
		}
		set onclickconnectend(e) {
			z(this.#ge, e);
		}
		#_e = /* @__PURE__ */ R(null);
		get clickConnectStartHandle() {
			return K(this.#_e);
		}
		set clickConnectStartHandle(e) {
			z(this.#_e, e);
		}
		#ve = /* @__PURE__ */ F(() => e.props.onselectiondrag);
		get onselectiondrag() {
			return K(this.#ve);
		}
		set onselectiondrag(e) {
			z(this.#ve, e);
		}
		#ye = /* @__PURE__ */ F(() => e.props.onselectiondragstart);
		get onselectiondragstart() {
			return K(this.#ye);
		}
		set onselectiondragstart(e) {
			z(this.#ye, e);
		}
		#be = /* @__PURE__ */ F(() => e.props.onselectiondragstop);
		get onselectiondragstop() {
			return K(this.#be);
		}
		set onselectiondragstop(e) {
			z(this.#be, e);
		}
		resolveFitView = async () => {
			this.panZoom && (await zd({
				nodes: this.nodeLookup,
				width: this.width,
				height: this.height,
				panZoom: this.panZoom,
				minZoom: this.minZoom,
				maxZoom: this.maxZoom
			}, this.fitViewOptions), this.fitViewResolver?.resolve(!0), this.fitViewQueued = !1, this.fitViewOptions = void 0, this.fitViewResolver = null);
		};
		_prefersDark = new Im("(prefers-color-scheme: dark)", e.props.colorModeSSR === "dark");
		#xe = /* @__PURE__ */ F(() => e.props.colorMode === "system" ? this._prefersDark.current ? "dark" : "light" : e.props.colorMode ?? "light");
		get colorMode() {
			return K(this.#xe);
		}
		set colorMode(e) {
			z(this.#xe, e);
		}
		constructor() {}
		resetStoreValues() {
			this.dragging = !1, this.selectionRect = null, this.selectionRectMode = null, this.selectionKeyPressed = !1, this.multiselectionKeyPressed = !1, this.deleteKeyPressed = !1, this.panActivationKeyPressed = !1, this.zoomActivationKeyPressed = !1, this._connection = Ed, this.clickConnectStartHandle = null, this.viewport = e.props.initialViewport ?? {
				x: 0,
				y: 0,
				zoom: 1
			}, this.ariaLiveMessage = "";
		}
	}
	return new t();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useStore.js
var Wm = yd.error001("svelte");
function Gm() {
	let e = et(Km);
	if (!e) throw Error(Wm);
	return e.getStore();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/index.js
var Km = Symbol();
function qm(e) {
	let t = Um(e);
	function n(e) {
		t.nodeTypes = {
			...Bm,
			...e
		};
	}
	function r(e) {
		t.edgeTypes = {
			...Vm,
			...e
		};
	}
	function i(e) {
		t.edges = Xp(e, t.edges, { onError: t.onerror });
	}
	let a = (e, n = !1) => {
		t.nodes = t.nodes.map((r) => {
			if (t.connection.inProgress && t.connection.fromNode.id === r.id) {
				let e = t.nodeLookup.get(r.id);
				e && (t.connection = {
					...t.connection,
					from: Yf(e, t.connection.fromHandle, $.Left, !0)
				});
			}
			let i = e.get(r.id);
			return i ? {
				...r,
				position: i.position,
				dragging: n
			} : r;
		});
	};
	function o(e) {
		let { changes: n, updatedInternals: r } = pp(e, t.nodeLookup, t.parentLookup, t.domNode, t.nodeOrigin, t.nodeExtent, t.zIndexMode);
		if (!r) return;
		ip(t.nodeLookup, t.parentLookup, {
			nodeOrigin: t.nodeOrigin,
			nodeExtent: t.nodeExtent,
			zIndexMode: t.zIndexMode
		}), t.fitViewQueued && t.resolveFitView();
		let i = /* @__PURE__ */ new Map();
		for (let e of n) {
			let n = t.nodeLookup.get(e.id)?.internals.userNode;
			if (!n) continue;
			let r = { ...n };
			switch (e.type) {
				case "dimensions": {
					let t = {
						...r.measured,
						...e.dimensions
					};
					e.setAttributes && (r.width = e.dimensions?.width ?? r.width, r.height = e.dimensions?.height ?? r.height), r.measured = t;
					break;
				}
				case "position": r.position = e.position ?? r.position;
			}
			i.set(e.id, r);
		}
		t.nodes = t.nodes.map((e) => i.get(e.id) ?? e);
	}
	function s(e) {
		let n = t.fitViewResolver ?? Promise.withResolvers();
		return t.fitViewQueued = !0, t.fitViewOptions = e, t.fitViewResolver = n, t.nodes = [...t.nodes], n.promise;
	}
	async function c(e, n, r) {
		let i = r?.zoom === void 0 ? t.maxZoom : r.zoom, a = t.panZoom;
		return a ? (await a.setViewport({
			x: t.width / 2 - e * i,
			y: t.height / 2 - n * i,
			zoom: i
		}, {
			duration: r?.duration,
			ease: r?.ease,
			interpolate: r?.interpolate
		}), !0) : !1;
	}
	async function l(e, n) {
		let r = t.panZoom;
		return r ? r.scaleBy(e, n) : !1;
	}
	async function u(e) {
		return l(1.2, e);
	}
	function d(e) {
		return l(1 / 1.2, e);
	}
	function f(e) {
		let n = t.panZoom;
		n && (n.setScaleExtent([e, t.maxZoom]), t.minZoom = e);
	}
	function p(e) {
		let n = t.panZoom;
		n && (n.setScaleExtent([t.minZoom, e]), t.maxZoom = e);
	}
	function m(e) {
		let n = t.panZoom;
		n && (n.setTranslateExtent(e), t.translateExtent = e);
	}
	function h(e, t = null) {
		let n = !1, r = e.map((e) => (!t || t.has(e.id)) && e.selected ? (n = !0, {
			...e,
			selected: !1
		}) : e);
		return [n, r];
	}
	function g(e) {
		let n = e?.nodes ? new Set(e.nodes.map((e) => e.id)) : null, [r, i] = h(t.nodes, n);
		r && (t.nodes = i);
		let a = e?.edges ? new Set(e.edges.map((e) => e.id)) : null, [o, s] = h(t.edges, a);
		o && (t.edges = s);
	}
	function _(e) {
		let n = t.multiselectionKeyPressed;
		t.nodes = t.nodes.map((t) => {
			let r = e.includes(t.id), i = n && t.selected || r;
			return !!t.selected === i ? t : {
				...t,
				selected: i
			};
		}), n || g({ nodes: [] });
	}
	function v(e) {
		let n = t.multiselectionKeyPressed;
		t.edges = t.edges.map((t) => {
			let r = e.includes(t.id), i = n && t.selected || r;
			return !!t.selected === i ? t : {
				...t,
				selected: i
			};
		}), n || g({ edges: [] });
	}
	function y(e, n, r) {
		let i = t.nodeLookup.get(e);
		if (!i) {
			t.onerror("012", yd.error012(e));
			return;
		}
		t.selectionRect = null, t.selectionRectMode = null, i.selected ? (n || i.selected && t.multiselectionKeyPressed) && (g({
			nodes: [i.internals.userNode],
			edges: []
		}), requestAnimationFrame(() => r?.blur())) : _([e]);
	}
	function b(e) {
		let n = t.edgeLookup.get(e);
		if (!n) {
			t.onerror("016", yd.error016(e));
			return;
		}
		(n.selectable || t.elementsSelectable && n.selectable === void 0) && (t.selectionRect = null, t.selectionRectMode = null, n.selected ? n.selected && t.multiselectionKeyPressed && g({
			nodes: [],
			edges: [n]
		}) : v([e]));
	}
	function x(e, n) {
		let { nodeExtent: r, snapGrid: i, nodeOrigin: o, nodeLookup: s, nodesDraggable: c, onerror: l } = t, u = /* @__PURE__ */ new Map(), d = i?.[0] ?? 5, f = i?.[1] ?? 5, p = e.x * d * n, m = e.y * f * n;
		for (let e of s.values()) {
			if (!(e.selected && (e.draggable || c && e.draggable === void 0))) continue;
			let t = {
				x: e.internals.positionAbsolute.x + p,
				y: e.internals.positionAbsolute.y + m
			};
			i && (t = af(t, i));
			let { position: n, positionAbsolute: a } = Bd({
				nodeId: e.id,
				nextPosition: t,
				nodeLookup: s,
				nodeExtent: r,
				nodeOrigin: o,
				onError: l
			});
			e.position = n, e.internals.positionAbsolute = a, u.set(e.id, e);
		}
		a(u);
	}
	function S(e) {
		return mp({
			delta: e,
			panZoom: t.panZoom,
			transform: [
				t.viewport.x,
				t.viewport.y,
				t.viewport.zoom
			],
			translateExtent: t.translateExtent,
			width: t.width,
			height: t.height
		});
	}
	let C = (e) => {
		t._connection = { ...e };
	};
	function w() {
		t._connection = Ed;
	}
	function T() {
		t.resetStoreValues(), g();
	}
	return Object.assign(t, {
		setNodeTypes: n,
		setEdgeTypes: r,
		addEdge: i,
		updateNodePositions: a,
		updateNodeInternals: o,
		zoomIn: u,
		zoomOut: d,
		fitView: s,
		setCenter: c,
		setMinZoom: f,
		setMaxZoom: p,
		setTranslateExtent: m,
		unselectNodesAndEdges: g,
		addSelectedNodes: _,
		addSelectedEdges: v,
		handleNodeSelection: y,
		handleEdgeSelection: b,
		moveSelectedNodes: x,
		panBy: S,
		updateConnection: C,
		cancelConnection: w,
		reset: T
	});
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/zoom/index.js
function Jm(e, t) {
	let { minZoom: n, maxZoom: r, initialViewport: i, onPanZoomStart: a, onPanZoom: o, onPanZoomEnd: s, translateExtent: c, setPanZoomInstance: l, onDraggingChange: u, onTransformChange: d } = t, f = qp({
		domNode: e,
		minZoom: n,
		maxZoom: r,
		translateExtent: c,
		viewport: i,
		onPanZoom: o,
		onPanZoomStart: a,
		onPanZoomEnd: s,
		onDraggingChange: u
	}), p = f.getViewport();
	return (i.x !== p.x || i.y !== p.y || i.zoom !== p.zoom) && d([
		p.x,
		p.y,
		p.zoom
	]), l(f), f.update(t), { update(e) {
		f.update(e);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Zoom/Zoom.svelte
var Ym = /* @__PURE__ */ q("<div class=\"svelte-flow__zoom svelte-flow__container\"><!></div>");
function Xm(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "panOnScrollMode", 7), i = Z(t, "preventScrolling", 7), a = Z(t, "zoomOnScroll", 7), o = Z(t, "zoomOnDoubleClick", 7), s = Z(t, "zoomOnPinch", 7), c = Z(t, "panOnDrag", 7), l = Z(t, "panOnScroll", 7), u = Z(t, "panOnScrollSpeed", 7), d = Z(t, "paneClickDistance", 7), f = Z(t, "selectionOnDrag", 7), p = Z(t, "onmovestart", 7), m = Z(t, "onmove", 7), h = Z(t, "onmoveend", 7), g = Z(t, "oninit", 7), _ = Z(t, "children", 7), v = /* @__PURE__ */ F(() => n().panActivationKeyPressed || c()), y = /* @__PURE__ */ F(() => n().panActivationKeyPressed || l()), { viewport: b } = n(), x = !1;
	An(() => {
		!x && n().viewportInitialized && (g()?.(), x = !0);
	});
	var S = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get panOnScrollMode() {
			return r();
		},
		set panOnScrollMode(e) {
			r(e), L();
		},
		get preventScrolling() {
			return i();
		},
		set preventScrolling(e) {
			i(e), L();
		},
		get zoomOnScroll() {
			return a();
		},
		set zoomOnScroll(e) {
			a(e), L();
		},
		get zoomOnDoubleClick() {
			return o();
		},
		set zoomOnDoubleClick(e) {
			o(e), L();
		},
		get zoomOnPinch() {
			return s();
		},
		set zoomOnPinch(e) {
			s(e), L();
		},
		get panOnDrag() {
			return c();
		},
		set panOnDrag(e) {
			c(e), L();
		},
		get panOnScroll() {
			return l();
		},
		set panOnScroll(e) {
			l(e), L();
		},
		get panOnScrollSpeed() {
			return u();
		},
		set panOnScrollSpeed(e) {
			u(e), L();
		},
		get paneClickDistance() {
			return d();
		},
		set paneClickDistance(e) {
			d(e), L();
		},
		get selectionOnDrag() {
			return f();
		},
		set selectionOnDrag(e) {
			f(e), L();
		},
		get onmovestart() {
			return p();
		},
		set onmovestart(e) {
			p(e), L();
		},
		get onmove() {
			return m();
		},
		set onmove(e) {
			m(e), L();
		},
		get onmoveend() {
			return h();
		},
		set onmoveend(e) {
			h(e), L();
		},
		get oninit() {
			return g();
		},
		set oninit(e) {
			g(e), L();
		},
		get children() {
			return _();
		},
		set children(e) {
			_(e), L();
		}
	}, C = Ym();
	return mi(B(C), _), M(C), Mi(C, (e, t) => Jm?.(e, t), () => ({
		viewport: n().viewport,
		minZoom: n().minZoom,
		maxZoom: n().maxZoom,
		initialViewport: b,
		onDraggingChange: (e) => {
			n(n().dragging = e, !0);
		},
		setPanZoomInstance: (e) => {
			n(n().panZoom = e, !0);
		},
		onPanZoomStart: p(),
		onPanZoom: m(),
		onPanZoomEnd: h(),
		zoomOnScroll: a(),
		zoomOnDoubleClick: o(),
		zoomOnPinch: s(),
		panOnScroll: K(y),
		panOnDrag: K(v),
		panOnScrollSpeed: u(),
		panOnScrollMode: r(),
		panActivationKeyPressed: n().panActivationKeyPressed,
		zoomActivationKeyPressed: n().zoomActivationKeyPressed,
		preventScrolling: typeof i() != "boolean" || i(),
		noPanClassName: n().noPanClass,
		noWheelClassName: n().noWheelClass,
		userSelectionActive: !!n().selectionRect,
		translateExtent: n().translateExtent,
		lib: "svelte",
		paneClickDistance: d(),
		selectionOnDrag: f(),
		onTransformChange: (e) => {
			n(n().viewport = {
				x: e[0],
				y: e[1],
				zoom: e[2]
			}, !0);
		},
		connectionInProgress: n().connection.inProgress
	})), J(e, C), P(S);
}
Q(Xm, {
	store: {},
	panOnScrollMode: {},
	preventScrolling: {},
	zoomOnScroll: {},
	zoomOnDoubleClick: {},
	zoomOnPinch: {},
	panOnDrag: {},
	panOnScroll: {},
	panOnScrollSpeed: {},
	paneClickDistance: {},
	selectionOnDrag: {},
	onmovestart: {},
	onmove: {},
	onmoveend: {},
	oninit: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Pane/Pane.svelte
function Zm(e, t) {
	return (n) => {
		n.target === t && e?.(n);
	};
}
function Qm(e) {
	return (t) => {
		let n = e.has(t.id);
		return !!t.selected === n ? t : {
			...t,
			selected: n
		};
	};
}
function $m(e, t) {
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
var eh = /* @__PURE__ */ q("<div><!></div>");
function th(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "panOnDrag", 7, !0), i = Z(t, "paneClickDistance", 7, 1), a = Z(t, "selectionOnDrag", 7), o = Z(t, "autoPanOnSelection", 7, !0), s = Z(t, "onpaneclick", 7), c = Z(t, "onpanecontextmenu", 7), l = Z(t, "onselectionstart", 7), u = Z(t, "onselectionend", 7), d = Z(t, "children", 7), f, p = null, m = !1, h = /* @__PURE__ */ new Set(), g = /* @__PURE__ */ new Set(), _ = /* @__PURE__ */ F(() => n().panActivationKeyPressed || r()), v = /* @__PURE__ */ F(() => n().selectionKeyPressed || !!n().selectionRect || a() && K(_) !== !0), y = /* @__PURE__ */ F(() => n().elementsSelectable && (K(v) || n().selectionRectMode === "user")), b = !1, x = 0, S = {
		x: 0,
		y: 0
	}, C = !1;
	function w(e) {
		if (e.pointerType === "touch" && K(_) !== !1 && !n().selectionKeyPressed || (p = f?.getBoundingClientRect(), !p)) return;
		let t = e.target === f, r = !t && !!e.target.closest(".nokey"), i = a() && t || n().selectionKeyPressed;
		if (r || !K(v) || !i || e.button !== 0 || !e.isPrimary) return;
		e.target?.setPointerCapture?.(e.pointerId), b = !1, C = !1;
		let { x: o, y: s } = Df(e, p), c = of({
			x: o,
			y: s
		}, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		]);
		n(n().selectionRect = {
			width: 0,
			height: 0,
			startX: c.x,
			startY: c.y,
			x: o,
			y: s
		}, !0), t || (e.stopPropagation(), e.preventDefault());
	}
	function T(e, t) {
		if (n().selectionRect?.startX === void 0 || n().selectionRect.startY === void 0) return;
		let r = {
			x: n().selectionRect?.startX,
			y: n().selectionRect?.startY
		}, i = sf(r, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		]), a = {
			startX: r.x,
			startY: r.y,
			x: e < i.x ? e : i.x,
			y: t < i.y ? t : i.y,
			width: Math.abs(e - i.x),
			height: Math.abs(t - i.y)
		}, o = h, s = g;
		h = new Set(Id(n().nodeLookup, a, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		], n().selectionMode === Td.Partial, !0).map((e) => e.id));
		let c = n().defaultEdgeOptions.selectable ?? !0;
		g = /* @__PURE__ */ new Set();
		for (let e of h) {
			let t = n().connectionLookup.get(e);
			if (t) for (let { edgeId: e } of t.values()) {
				let t = n().edgeLookup.get(e);
				t && (t.selectable ?? c) && g.add(e);
			}
		}
		$m(o, h) || n(n().nodes = n().nodes.map(Qm(h)), !0), $m(s, g) || n(n().edges = n().edges.map(Qm(g)), !0), n(n().selectionRectMode = "user", !0), n(n().selectionRect = a, !0);
	}
	function E() {
		if (!o() || !p) return;
		let [e, t] = Kd(S, p, n().autoPanSpeed);
		n().panBy({
			x: e,
			y: t
		}).then((e) => {
			if (!b || !e) {
				x = requestAnimationFrame(E);
				return;
			}
			T(S.x, S.y), x = requestAnimationFrame(E);
		});
	}
	function D() {
		cancelAnimationFrame(x), x = 0, C = !1;
	}
	gi(() => {
		typeof window < "u" && D();
	});
	function ee(e) {
		if (!K(v) || !p || !n().selectionRect) return;
		let t = Df(e, p);
		S = {
			x: t.x,
			y: t.y
		};
		let r = sf({
			x: n().selectionRect.startX,
			y: n().selectionRect.startY
		}, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		]);
		if (!b) {
			let a = n().selectionKeyPressed ? 0 : i();
			if (Math.hypot(t.x - r.x, t.y - r.y) <= a) return;
			n().unselectNodesAndEdges(), l()?.(e);
		}
		b = !0, C ||= (E(), !0), T(t.x, t.y);
	}
	function te(e) {
		if (!K(y)) {
			e.target === f && n().connection.inProgress && (m = !0);
			return;
		}
		e.button === 0 && (e.target?.releasePointerCapture?.(e.pointerId), !b && e.target === f && ae?.(e), n(n().selectionRect = null, !0), b && n(n().selectionRectMode = h.size > 0 ? "nodes" : null, !0), b && u()?.(e), D());
	}
	function ne(e) {
		e.target?.releasePointerCapture?.(e.pointerId), D();
	}
	let re = (e) => {
		if (Array.isArray(K(_)) && K(_).includes(2)) {
			e.preventDefault();
			return;
		}
		c()?.({ event: e });
	}, ie = (e) => {
		b &&= (e.stopPropagation(), !1);
	};
	function ae(e) {
		if (b || n().connection.inProgress || m) {
			b = !1, m = !1;
			return;
		}
		s()?.({ event: e }), n().unselectNodesAndEdges(), n(n().selectionRectMode = null, !0), n(n().selectionRect = null, !0);
	}
	var O = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get panOnDrag() {
			return r();
		},
		set panOnDrag(e = !0) {
			r(e), L();
		},
		get paneClickDistance() {
			return i();
		},
		set paneClickDistance(e = 1) {
			i(e), L();
		},
		get selectionOnDrag() {
			return a();
		},
		set selectionOnDrag(e) {
			a(e), L();
		},
		get autoPanOnSelection() {
			return o();
		},
		set autoPanOnSelection(e = !0) {
			o(e), L();
		},
		get onpaneclick() {
			return s();
		},
		set onpaneclick(e) {
			s(e), L();
		},
		get onpanecontextmenu() {
			return c();
		},
		set onpanecontextmenu(e) {
			c(e), L();
		},
		get onselectionstart() {
			return l();
		},
		set onselectionstart(e) {
			l(e), L();
		},
		get onselectionend() {
			return u();
		},
		set onselectionend(e) {
			u(e), L();
		},
		get children() {
			return d();
		},
		set children(e) {
			d(e), L();
		}
	}, k = eh();
	let oe;
	var se = /* @__PURE__ */ F(() => K(y) ? void 0 : Zm(ae, f)), ce = /* @__PURE__ */ F(() => Zm(re, f));
	return mi(B(k), d), M(k), Sa(k, (e) => f = e, () => f), U((e) => oe = Hi(k, 1, "svelte-flow__pane svelte-flow__container", null, oe, {
		draggable: e,
		dragging: n().dragging,
		selection: K(v)
	}), [() => r() === !0 || Array.isArray(r()) && r().includes(0)]), Fr("click", k, function(...e) {
		K(se)?.apply(this, e);
	}), Pr("pointerdown", k, function(...e) {
		(K(y) ? w : void 0)?.apply(this, e);
	}, !0), Fr("pointermove", k, function(...e) {
		(K(y) ? ee : void 0)?.apply(this, e);
	}), Fr("pointerup", k, te), Pr("pointercancel", k, function(...e) {
		(K(y) ? ne : void 0)?.apply(this, e);
	}), Fr("contextmenu", k, function(...e) {
		K(ce)?.apply(this, e);
	}), Pr("click", k, function(...e) {
		(K(y) ? ie : void 0)?.apply(this, e);
	}, !0), J(e, k), P(O);
}
Ir([
	"click",
	"pointermove",
	"pointerup",
	"contextmenu"
]), Q(th, {
	store: {},
	panOnDrag: {},
	paneClickDistance: {},
	selectionOnDrag: {},
	autoPanOnSelection: {},
	onpaneclick: {},
	onpanecontextmenu: {},
	onselectionstart: {},
	onselectionend: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Viewport/Viewport.svelte
var nh = /* @__PURE__ */ q("<div class=\"svelte-flow__viewport xyflow__viewport svelte-flow__container\"><!></div>");
function rh(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "children", 7);
	var i = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get children() {
			return r();
		},
		set children(e) {
			r(e), L();
		}
	}, a = nh();
	let o;
	return mi(B(a), r), M(a), U(() => o = Wi(a, "", o, { transform: `translate(${n().viewport.x ?? ""}px, ${n().viewport.y ?? ""}px) scale(${n().viewport.zoom ?? ""})` })), J(e, a), P(i);
}
Q(rh, {
	store: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/drag/index.js
function ih(e, t) {
	let { store: n, onDrag: r, onDragStart: i, onDragStop: a, onNodeMouseDown: o } = t, s = Sp({
		onDrag: r,
		onDragStart: i,
		onDragStop: a,
		onNodeMouseDown: o,
		getStoreItems: () => {
			let { snapGrid: e, viewport: t } = n;
			return {
				nodes: n.nodes,
				nodeLookup: n.nodeLookup,
				edges: n.edges,
				nodeExtent: n.nodeExtent,
				snapGrid: e || [0, 0],
				snapToGrid: !!e,
				nodeOrigin: n.nodeOrigin,
				multiSelectionActive: n.multiselectionKeyPressed,
				domNode: n.domNode,
				transform: [
					t.x,
					t.y,
					t.zoom
				],
				autoPanOnNodeDrag: n.autoPanOnNodeDrag,
				nodesDraggable: n.nodesDraggable,
				selectNodesOnDrag: n.selectNodesOnDrag,
				nodeDragThreshold: n.nodeDragThreshold,
				unselectNodesAndEdges: n.unselectNodesAndEdges,
				updateNodePositions: n.updateNodePositions,
				onSelectionDrag: n.onselectiondrag,
				onSelectionDragStart: n.onselectiondragstart,
				onSelectionDragStop: n.onselectiondragstop,
				panBy: n.panBy
			};
		}
	});
	function c(e, t) {
		if (t.disabled) {
			s.destroy();
			return;
		}
		s.update({
			domNode: e,
			noDragClassName: t.noDragClass,
			handleSelector: t.handleSelector,
			nodeId: t.nodeId,
			isSelectable: t.isSelectable,
			nodeClickDistance: t.nodeClickDistance
		});
	}
	return c(e, t), {
		update(t) {
			c(e, t);
		},
		destroy() {
			s.destroy();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/A11yDescriptions/A11yDescriptions.svelte
var ah = /* @__PURE__ */ q("<div aria-live=\"assertive\" aria-atomic=\"true\" class=\"a11y-live-msg svelte-13pq11u\"> </div>"), oh = /* @__PURE__ */ q("<div class=\"a11y-hidden svelte-13pq11u\"> </div> <div class=\"a11y-hidden svelte-13pq11u\"> </div> <!>", 1), sh = {
	hash: "svelte-13pq11u",
	code: ".a11y-hidden.svelte-13pq11u {display:none;}.a11y-live-msg.svelte-13pq11u {position:absolute;width:1px;height:1px;margin:-1px;border:0;padding:0;overflow:hidden;clip:rect(0px, 0px, 0px, 0px);clip-path:inset(100%);}"
};
function ch(e, t) {
	N(t, !0), ji(e, sh);
	let n = Z(t, "store", 7);
	var r = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		}
	}, i = oh(), a = V(i), o = vn(a, !0), s = H(a, 2), c = vn(s, !0), l = H(s, 2), u = (e) => {
		var t = ah(), r = vn(t, !0);
		U(() => {
			X(t, "id", `${dh}-${n().flowId}`), oi(r, n().ariaLiveMessage);
		}), J(e, t);
	};
	return Y(l, (e) => {
		n().disableKeyboardA11y || e(u);
	}), U(() => {
		X(a, "id", `${lh}-${n().flowId}`), oi(o, n().disableKeyboardA11y ? n().ariaLabelConfig["node.a11yDescription.default"] : n().ariaLabelConfig["node.a11yDescription.keyboardDisabled"]), X(s, "id", `${uh}-${n().flowId}`), oi(c, n().ariaLabelConfig["edge.a11yDescription.default"]);
	}), J(e, i), P(r);
}
Q(ch, { store: {} }, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/A11yDescriptions/index.js
var lh = "svelte-flow__node-desc", uh = "svelte-flow__edge-desc", dh = "svelte-flow__aria-live", fh = /* @__PURE__ */ q("<div><!></div>");
function ph(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "node", 7), i = Z(t, "resizeObserver", 7), a = Z(t, "nodeClickDistance", 7), o = Z(t, "onnodeclick", 7), s = Z(t, "onnodedrag", 7), c = Z(t, "onnodedragstart", 7), l = Z(t, "onnodedragstop", 7), u = Z(t, "onnodepointerenter", 7), d = Z(t, "onnodepointerleave", 7), f = Z(t, "onnodepointermove", 7), p = Z(t, "onnodecontextmenu", 7), m = /* @__PURE__ */ F(() => b(r().data, () => ({}), !0)), h = /* @__PURE__ */ F(() => b(r().selected, !1)), g = /* @__PURE__ */ F(() => r().draggable), _ = /* @__PURE__ */ F(() => r().selectable), v = /* @__PURE__ */ F(() => b(r().deletable, !0)), y = /* @__PURE__ */ F(() => r().connectable), x = /* @__PURE__ */ F(() => r().focusable), S = /* @__PURE__ */ F(() => b(r().hidden, !1)), C = /* @__PURE__ */ F(() => b(r().dragging, !1)), w = /* @__PURE__ */ F(() => b(r().style, "")), T = /* @__PURE__ */ F(() => r().class), E = /* @__PURE__ */ F(() => b(r().type, "default")), D = /* @__PURE__ */ F(() => r().parentId), ee = /* @__PURE__ */ F(() => r().sourcePosition), te = /* @__PURE__ */ F(() => r().targetPosition), ne = /* @__PURE__ */ F(() => b(r().measured, () => ({
		width: 0,
		height: 0
	}), !0).width), re = /* @__PURE__ */ F(() => b(r().measured, () => ({
		width: 0,
		height: 0
	}), !0).height), ie = /* @__PURE__ */ F(() => r().initialWidth), ae = /* @__PURE__ */ F(() => r().initialHeight), O = /* @__PURE__ */ F(() => r().width), k = /* @__PURE__ */ F(() => r().height), oe = /* @__PURE__ */ F(() => r().dragHandle), se = /* @__PURE__ */ F(() => b(r().internals.z, 0)), ce = /* @__PURE__ */ F(() => r().internals.positionAbsolute.x), le = /* @__PURE__ */ F(() => r().internals.positionAbsolute.y), ue = /* @__PURE__ */ F(() => r().internals.userNode), { id: de } = r(), fe = /* @__PURE__ */ F(() => K(g) ?? n().nodesDraggable), pe = /* @__PURE__ */ F(() => K(_) ?? n().elementsSelectable), me = /* @__PURE__ */ F(() => K(y) ?? n().nodesConnectable), he = /* @__PURE__ */ F(() => hf(r())), ge = /* @__PURE__ */ F(() => !!r().internals.handleBounds), _e = /* @__PURE__ */ F(() => K(he) && K(ge)), ve = /* @__PURE__ */ F(() => K(x) ?? n().nodesFocusable);
	function ye(e) {
		return n().parentLookup.has(e);
	}
	let be = /* @__PURE__ */ F(() => ye(de)), xe = /* @__PURE__ */ R(null), Se = null, A = K(E), Ce = K(ee), j = K(te), we = /* @__PURE__ */ F(() => n().nodeTypes[K(E)] ?? cm), Te = /* @__PURE__ */ F(() => n().ariaLabelConfig);
	$p(de), tm({ get value() {
		return K(me);
	} });
	let Ee = /* @__PURE__ */ F(() => {
		let e = K(ne) === void 0 ? K(O) ?? K(ie) : K(O), t = K(re) === void 0 ? K(k) ?? K(ae) : K(k);
		if (e !== void 0 || t !== void 0 || K(w) !== void 0) return `${K(w)};${e ? `width:${ym(e)};` : ""}${t ? `height:${ym(t)};` : ""}`;
	});
	An(() => {
		(K(E) !== A || K(ee) !== Ce || K(te) !== j) && K(xe) !== null && requestAnimationFrame(() => {
			K(xe) !== null && n().updateNodeInternals(/* @__PURE__ */ new Map([[de, {
				id: de,
				nodeElement: K(xe),
				force: !0
			}]]));
		}), A = K(E), Ce = K(ee), j = K(te);
	}), An(() => {
		i() && (!K(_e) || K(xe) !== Se) && (Se && i().unobserve(Se), K(xe) && i().observe(K(xe)), Se = K(xe));
	}), gi(() => {
		Se && i()?.unobserve(Se);
	});
	function De(e) {
		K(pe) && (!n().selectNodesOnDrag || !K(fe) || n().nodeDragThreshold > 0) && n().handleNodeSelection(de), o()?.({
			node: K(ue),
			event: e
		});
	}
	function Oe(e) {
		if (!(Tf(e) || n().disableKeyboardA11y)) {
			if (xd.includes(e.key) && K(pe)) {
				let t = e.key === "Escape";
				n().handleNodeSelection(de, t, K(xe));
			} else K(fe) && r().selected && Object.prototype.hasOwnProperty.call(bm, e.key) && (e.preventDefault(), n(n().ariaLiveMessage = K(Te)["node.a11yDescription.ariaLiveMessage"]({
				direction: e.key.replace("Arrow", "").toLowerCase(),
				x: ~~r().internals.positionAbsolute.x,
				y: ~~r().internals.positionAbsolute.y
			}), !0), n().moveSelectedNodes(bm[e.key], e.shiftKey ? 4 : 1));
		}
	}
	let ke = () => {
		if (n().disableKeyboardA11y || !n().autoPanOnNodeFocus || !K(xe)?.matches(":focus-visible")) return;
		let { width: e, height: t, viewport: i } = n();
		Id(/* @__PURE__ */ new Map([[de, r()]]), {
			x: 0,
			y: 0,
			width: e,
			height: t
		}, [
			i.x,
			i.y,
			i.zoom
		], !0).length > 0 || n().setCenter(r().position.x + (r().measured.width ?? 0) / 2, r().position.y + (r().measured.height ?? 0) / 2, { zoom: i.zoom });
	};
	var Ae = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get node() {
			return r();
		},
		set node(e) {
			r(e), L();
		},
		get resizeObserver() {
			return i();
		},
		set resizeObserver(e) {
			i(e), L();
		},
		get nodeClickDistance() {
			return a();
		},
		set nodeClickDistance(e) {
			a(e), L();
		},
		get onnodeclick() {
			return o();
		},
		set onnodeclick(e) {
			o(e), L();
		},
		get onnodedrag() {
			return s();
		},
		set onnodedrag(e) {
			s(e), L();
		},
		get onnodedragstart() {
			return c();
		},
		set onnodedragstart(e) {
			c(e), L();
		},
		get onnodedragstop() {
			return l();
		},
		set onnodedragstop(e) {
			l(e), L();
		},
		get onnodepointerenter() {
			return u();
		},
		set onnodepointerenter(e) {
			u(e), L();
		},
		get onnodepointerleave() {
			return d();
		},
		set onnodepointerleave(e) {
			d(e), L();
		},
		get onnodepointermove() {
			return f();
		},
		set onnodepointermove(e) {
			f(e), L();
		},
		get onnodecontextmenu() {
			return p();
		},
		set onnodecontextmenu(e) {
			p(e), L();
		}
	}, je = qr(), Me = V(je), Ne = (e) => {
		var t = fh();
		fa(t, () => ({
			"data-id": de,
			class: [
				"svelte-flow__node",
				`svelte-flow__node-${K(E)}`,
				K(T)
			],
			style: K(Ee),
			onclick: De,
			onpointerenter: u() ? (e) => u()({
				node: K(ue),
				event: e
			}) : void 0,
			onpointerleave: d() ? (e) => d()({
				node: K(ue),
				event: e
			}) : void 0,
			onpointermove: f() ? (e) => f()({
				node: K(ue),
				event: e
			}) : void 0,
			oncontextmenu: p() ? (e) => p()({
				node: K(ue),
				event: e
			}) : void 0,
			onkeydown: K(ve) ? Oe : void 0,
			onfocus: K(ve) ? ke : void 0,
			tabIndex: K(ve) ? 0 : void 0,
			role: r().ariaRole ?? (K(ve) ? "group" : void 0),
			"aria-label": r().ariaLabel,
			"aria-roledescription": "node",
			"aria-describedby": n().disableKeyboardA11y ? void 0 : `${lh}-${n().flowId}`,
			...r().domAttributes,
			[$i]: {
				dragging: K(C),
				selected: K(h),
				draggable: K(fe),
				connectable: K(me),
				selectable: K(pe),
				nopan: K(fe),
				parent: K(be)
			},
			[ea]: {
				"z-index": K(se),
				transform: `translate(${K(ce) ?? ""}px, ${K(le) ?? ""}px)`,
				visibility: K(he) ? "visible" : "hidden"
			}
		})), Ai(B(t), () => K(we), (e, t) => {
			t(e, {
				get data() {
					return K(m);
				},
				get id() {
					return de;
				},
				get selected() {
					return K(h);
				},
				get selectable() {
					return K(pe);
				},
				get deletable() {
					return K(v);
				},
				get sourcePosition() {
					return K(ee);
				},
				get targetPosition() {
					return K(te);
				},
				get zIndex() {
					return K(se);
				},
				get dragging() {
					return K(C);
				},
				get draggable() {
					return K(fe);
				},
				get dragHandle() {
					return K(oe);
				},
				get parentId() {
					return K(D);
				},
				get type() {
					return K(E);
				},
				get isConnectable() {
					return K(me);
				},
				get positionAbsoluteX() {
					return K(ce);
				},
				get positionAbsoluteY() {
					return K(le);
				},
				get width() {
					return K(O);
				},
				get height() {
					return K(k);
				}
			});
		}), M(t), Mi(t, (e, t) => ih?.(e, t), () => ({
			nodeId: de,
			isSelectable: K(pe),
			disabled: !K(fe),
			handleSelector: K(oe),
			noDragClass: n().noDragClass,
			nodeClickDistance: a(),
			onNodeMouseDown: n().handleNodeSelection,
			onDrag: (e, t, n, r) => {
				s()?.({
					event: e,
					targetNode: n,
					nodes: r
				});
			},
			onDragStart: (e, t, n, r) => {
				c()?.({
					event: e,
					targetNode: n,
					nodes: r
				});
			},
			onDragStop: (e, t, n, r) => {
				l()?.({
					event: e,
					targetNode: n,
					nodes: r
				});
			},
			store: n()
		})), Sa(t, (e) => z(xe, e), () => K(xe)), J(e, t);
	};
	return Y(Me, (e) => {
		K(S) || e(Ne);
	}), J(e, je), P(Ae);
}
Q(ph, {
	store: {},
	node: {},
	resizeObserver: {},
	nodeClickDistance: {},
	onnodeclick: {},
	onnodedrag: {},
	onnodedragstart: {},
	onnodedragstop: {},
	onnodepointerenter: {},
	onnodepointerleave: {},
	onnodepointermove: {},
	onnodecontextmenu: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/NodeRenderer/NodeRenderer.svelte
var mh = /* @__PURE__ */ q("<div class=\"svelte-flow__nodes\"></div>");
function hh(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "nodeClickDistance", 7), i = Z(t, "onnodeclick", 7), a = Z(t, "onnodecontextmenu", 7), o = Z(t, "onnodepointerenter", 7), s = Z(t, "onnodepointermove", 7), c = Z(t, "onnodepointerleave", 7), l = Z(t, "onnodedrag", 7), u = Z(t, "onnodedragstart", 7), d = Z(t, "onnodedragstop", 7), f = typeof ResizeObserver > "u" ? null : new ResizeObserver((e) => {
		let t = /* @__PURE__ */ new Map();
		e.forEach((e) => {
			let n = e.target.getAttribute("data-id");
			t.set(n, {
				id: n,
				nodeElement: e.target,
				force: !0
			});
		}), n().updateNodeInternals(t);
	});
	gi(() => {
		f?.disconnect();
	});
	var p = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get nodeClickDistance() {
			return r();
		},
		set nodeClickDistance(e) {
			r(e), L();
		},
		get onnodeclick() {
			return i();
		},
		set onnodeclick(e) {
			i(e), L();
		},
		get onnodecontextmenu() {
			return a();
		},
		set onnodecontextmenu(e) {
			a(e), L();
		},
		get onnodepointerenter() {
			return o();
		},
		set onnodepointerenter(e) {
			o(e), L();
		},
		get onnodepointermove() {
			return s();
		},
		set onnodepointermove(e) {
			s(e), L();
		},
		get onnodepointerleave() {
			return c();
		},
		set onnodepointerleave(e) {
			c(e), L();
		},
		get onnodedrag() {
			return l();
		},
		set onnodedrag(e) {
			l(e), L();
		},
		get onnodedragstart() {
			return u();
		},
		set onnodedragstart(e) {
			u(e), L();
		},
		get onnodedragstop() {
			return d();
		},
		set onnodedragstop(e) {
			d(e), L();
		}
	}, m = mh();
	return wi(m, 21, () => n().visible.nodes.values(), (e) => e.id, (e, t) => {
		ph(e, {
			get node() {
				return K(t);
			},
			get resizeObserver() {
				return f;
			},
			get nodeClickDistance() {
				return r();
			},
			get onnodeclick() {
				return i();
			},
			get onnodepointerenter() {
				return o();
			},
			get onnodepointermove() {
				return s();
			},
			get onnodepointerleave() {
				return c();
			},
			get onnodedrag() {
				return l();
			},
			get onnodedragstart() {
				return u();
			},
			get onnodedragstop() {
				return d();
			},
			get onnodecontextmenu() {
				return a();
			},
			get store() {
				return n();
			},
			set store(e) {
				n(e);
			}
		});
	}), M(m), J(e, m), P(p);
}
Q(hh, {
	store: {},
	nodeClickDistance: {},
	onnodeclick: {},
	onnodecontextmenu: {},
	onnodepointerenter: {},
	onnodepointermove: {},
	onnodepointerleave: {},
	onnodedrag: {},
	onnodedragstart: {},
	onnodedragstop: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/EdgeWrapper/EdgeWrapper.svelte
var gh = /* @__PURE__ */ Gr("<svg class=\"svelte-flow__edge-wrapper\"><g><!></g></svg>");
function _h(e, t) {
	N(t, !0);
	let n = Z(t, "edge", 7), r = Z(t, "store", 15), i = Z(t, "onedgeclick", 7), a = Z(t, "onedgecontextmenu", 7), o = Z(t, "onedgepointerenter", 7), s = Z(t, "onedgepointerleave", 7), c = /* @__PURE__ */ F(() => n().id), l = /* @__PURE__ */ F(() => n().source), u = /* @__PURE__ */ F(() => n().target), d = /* @__PURE__ */ F(() => n().sourceX), f = /* @__PURE__ */ F(() => n().sourceY), p = /* @__PURE__ */ F(() => n().targetX), m = /* @__PURE__ */ F(() => n().targetY), h = /* @__PURE__ */ F(() => n().sourcePosition), g = /* @__PURE__ */ F(() => n().targetPosition), _ = /* @__PURE__ */ F(() => b(n().animated, !1)), v = /* @__PURE__ */ F(() => b(n().selected, !1)), y = /* @__PURE__ */ F(() => n().label), x = /* @__PURE__ */ F(() => n().labelStyle), S = /* @__PURE__ */ F(() => b(n().data, () => ({}), !0)), C = /* @__PURE__ */ F(() => n().style), w = /* @__PURE__ */ F(() => n().interactionWidth), T = /* @__PURE__ */ F(() => b(n().type, "default")), E = /* @__PURE__ */ F(() => n().sourceHandle), D = /* @__PURE__ */ F(() => n().targetHandle), ee = /* @__PURE__ */ F(() => n().markerStart), te = /* @__PURE__ */ F(() => n().markerEnd), ne = /* @__PURE__ */ F(() => n().selectable), re = /* @__PURE__ */ F(() => n().focusable), ie = /* @__PURE__ */ F(() => b(n().deletable, !0)), ae = /* @__PURE__ */ F(() => n().hidden), O = /* @__PURE__ */ F(() => n().zIndex), k = /* @__PURE__ */ F(() => n().class), oe = /* @__PURE__ */ F(() => n().ariaLabel);
	rm(K(c));
	let se = null, ce = /* @__PURE__ */ F(() => K(ne) ?? r().elementsSelectable), le = /* @__PURE__ */ F(() => K(re) ?? r().edgesFocusable), ue = /* @__PURE__ */ F(() => r().edgeTypes[K(T)] ?? km), de = /* @__PURE__ */ F(() => K(ee) ? `url('#${Zf(K(ee), r().flowId)}')` : void 0), fe = /* @__PURE__ */ F(() => K(te) ? `url('#${Zf(K(te), r().flowId)}')` : void 0);
	function pe(e) {
		let t = r().edgeLookup.get(K(c));
		t && (K(ce) && r().handleEdgeSelection(K(c)), i()?.({
			event: e,
			edge: t
		}));
	}
	function me(e, t) {
		let n = r().edgeLookup.get(K(c));
		n && t({
			event: e,
			edge: n
		});
	}
	function he(e) {
		if (!r().disableKeyboardA11y && xd.includes(e.key) && K(ce)) {
			let { unselectNodesAndEdges: t, addSelectedEdges: i } = r();
			e.key === "Escape" ? (se?.blur(), t({ edges: [n()] })) : i([K(c)]);
		}
	}
	var ge = {
		get edge() {
			return n();
		},
		set edge(e) {
			n(e), L();
		},
		get store() {
			return r();
		},
		set store(e) {
			r(e), L();
		},
		get onedgeclick() {
			return i();
		},
		set onedgeclick(e) {
			i(e), L();
		},
		get onedgecontextmenu() {
			return a();
		},
		set onedgecontextmenu(e) {
			a(e), L();
		},
		get onedgepointerenter() {
			return o();
		},
		set onedgepointerenter(e) {
			o(e), L();
		},
		get onedgepointerleave() {
			return s();
		},
		set onedgepointerleave(e) {
			s(e), L();
		}
	}, _e = qr(), ve = V(_e), ye = (e) => {
		var t = gh();
		let i;
		var b = B(t);
		fa(b, () => ({
			class: ["svelte-flow__edge", K(k)],
			"data-id": K(c),
			onclick: pe,
			oncontextmenu: a() ? (e) => {
				me(e, a());
			} : void 0,
			onpointerenter: o() ? (e) => {
				me(e, o());
			} : void 0,
			onpointerleave: s() ? (e) => {
				me(e, s());
			} : void 0,
			"aria-label": K(oe) === null ? void 0 : K(oe) ? K(oe) : `Edge from ${K(l)} to ${K(u)}`,
			"aria-describedby": K(le) ? `${uh}-${r().flowId}` : void 0,
			role: n().ariaRole ?? (K(le) ? "group" : "img"),
			"aria-roledescription": "edge",
			onkeydown: K(le) ? he : void 0,
			tabindex: K(le) ? 0 : void 0,
			...n().domAttributes,
			[$i]: {
				animated: K(_),
				selected: K(v),
				selectable: K(ce)
			}
		})), Ai(B(b), () => K(ue), (e, t) => {
			t(e, {
				get id() {
					return K(c);
				},
				get source() {
					return K(l);
				},
				get target() {
					return K(u);
				},
				get sourceX() {
					return K(d);
				},
				get sourceY() {
					return K(f);
				},
				get targetX() {
					return K(p);
				},
				get targetY() {
					return K(m);
				},
				get sourcePosition() {
					return K(h);
				},
				get targetPosition() {
					return K(g);
				},
				get animated() {
					return K(_);
				},
				get selected() {
					return K(v);
				},
				get label() {
					return K(y);
				},
				get labelStyle() {
					return K(x);
				},
				get data() {
					return K(S);
				},
				get style() {
					return K(C);
				},
				get interactionWidth() {
					return K(w);
				},
				get selectable() {
					return K(ce);
				},
				get deletable() {
					return K(ie);
				},
				get type() {
					return K(T);
				},
				get sourceHandleId() {
					return K(E);
				},
				get targetHandleId() {
					return K(D);
				},
				get markerStart() {
					return K(de);
				},
				get markerEnd() {
					return K(fe);
				}
			});
		}), M(b), Sa(b, (e) => se = e, () => se), M(t), U(() => i = Wi(t, "", i, { "z-index": K(O) })), J(e, t);
	};
	return Y(ve, (e) => {
		K(ae) || e(ye);
	}), J(e, _e), P(ge);
}
//#endregion
//#region node_modules/svelte/src/internal/flags/legacy.js
Q(_h, {
	edge: {},
	store: {},
	onedgeclick: {},
	onedgecontextmenu: {},
	onedgepointerenter: {},
	onedgepointerleave: {}
}, [], [], { mode: "open" }), Ke();
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/MarkerDefinition.svelte
var vh = /* @__PURE__ */ Gr("<defs></defs>");
function yh(e, t) {
	N(t, !1);
	let n = Gm();
	Ca();
	var r = vh();
	wi(r, 5, () => n.markers, (e) => e.id, (e, t) => {
		Ch(e, Aa(() => K(t)));
	}), M(r), J(e, r), P();
}
Q(yh, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/Marker.svelte
var bh = /* @__PURE__ */ Gr("<polyline class=\"arrow\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4\"></polyline>"), xh = /* @__PURE__ */ Gr("<polyline class=\"arrowclosed\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4 -5,-4\"></polyline>"), Sh = /* @__PURE__ */ Gr("<marker class=\"svelte-flow__arrowhead\" viewBox=\"-10 -10 20 20\" refX=\"0\" refY=\"0\"><!></marker>");
function Ch(e, t) {
	N(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "type", 7), i = Z(t, "width", 7, 12.5), a = Z(t, "height", 7, 12.5), o = Z(t, "markerUnits", 7, "strokeWidth"), s = Z(t, "orient", 7, "auto-start-reverse"), c = Z(t, "color", 7, "none"), l = Z(t, "strokeWidth", 7);
	var u = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), L();
		},
		get type() {
			return r();
		},
		set type(e) {
			r(e), L();
		},
		get width() {
			return i();
		},
		set width(e = 12.5) {
			i(e), L();
		},
		get height() {
			return a();
		},
		set height(e = 12.5) {
			a(e), L();
		},
		get markerUnits() {
			return o();
		},
		set markerUnits(e = "strokeWidth") {
			o(e), L();
		},
		get orient() {
			return s();
		},
		set orient(e = "auto-start-reverse") {
			s(e), L();
		},
		get color() {
			return c();
		},
		set color(e = "none") {
			c(e), L();
		},
		get strokeWidth() {
			return l();
		},
		set strokeWidth(e) {
			l(e), L();
		}
	}, d = Sh(), f = B(d), p = (e) => {
		var t = bh();
		let n;
		U(() => {
			X(t, "stroke-width", l()), n = Wi(t, "", n, { stroke: c() });
		}), J(e, t);
	}, m = (e) => {
		var t = xh();
		let n;
		U(() => {
			X(t, "stroke-width", l()), n = Wi(t, "", n, {
				stroke: c(),
				fill: c()
			});
		}), J(e, t);
	};
	return Y(f, (e) => {
		r() === Od.Arrow ? e(p) : r() === Od.ArrowClosed && e(m, 1);
	}), M(d), U(() => {
		X(d, "id", n()), X(d, "markerWidth", `${i()}`), X(d, "markerHeight", `${a()}`), X(d, "markerUnits", o()), X(d, "orient", s());
	}), J(e, d), P(u);
}
Q(Ch, {
	id: {},
	type: {},
	width: {},
	height: {},
	markerUnits: {},
	orient: {},
	color: {},
	strokeWidth: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/EdgeRenderer.svelte
var wh = /* @__PURE__ */ q("<div class=\"svelte-flow__edges\"><svg class=\"svelte-flow__marker\"><!></svg> <!></div>");
function Th(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "onedgeclick", 7), i = Z(t, "onedgecontextmenu", 7), a = Z(t, "onedgepointerenter", 7), o = Z(t, "onedgepointerleave", 7);
	var s = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get onedgeclick() {
			return r();
		},
		set onedgeclick(e) {
			r(e), L();
		},
		get onedgecontextmenu() {
			return i();
		},
		set onedgecontextmenu(e) {
			i(e), L();
		},
		get onedgepointerenter() {
			return a();
		},
		set onedgepointerenter(e) {
			a(e), L();
		},
		get onedgepointerleave() {
			return o();
		},
		set onedgepointerleave(e) {
			o(e), L();
		}
	}, c = wh(), l = B(c);
	return yh(B(l), {}), M(l), wi(H(l, 2), 17, () => n().visible.edges.values(), (e) => e.id, (e, t) => {
		_h(e, {
			get edge() {
				return K(t);
			},
			get onedgeclick() {
				return r();
			},
			get onedgecontextmenu() {
				return i();
			},
			get onedgepointerenter() {
				return a();
			},
			get onedgepointerleave() {
				return o();
			},
			get store() {
				return n();
			},
			set store(e) {
				n(e);
			}
		});
	}), M(c), J(e, c), P(s);
}
Q(Th, {
	store: {},
	onedgeclick: {},
	onedgecontextmenu: {},
	onedgepointerenter: {},
	onedgepointerleave: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Selection/Selection.svelte
var Eh = /* @__PURE__ */ q("<div class=\"svelte-flow__selection svelte-1vr3gfi\"></div>"), Dh = {
	hash: "svelte-1vr3gfi",
	code: ".svelte-flow__selection.svelte-1vr3gfi {position:absolute;top:0;left:0;}"
};
function Oh(e, t) {
	N(t, !0), ji(e, Dh);
	let n = Z(t, "x", 7, 0), r = Z(t, "y", 7, 0), i = Z(t, "width", 7, 0), a = Z(t, "height", 7, 0), o = Z(t, "isVisible", 7, !0);
	var s = {
		get x() {
			return n();
		},
		set x(e = 0) {
			n(e), L();
		},
		get y() {
			return r();
		},
		set y(e = 0) {
			r(e), L();
		},
		get width() {
			return i();
		},
		set width(e = 0) {
			i(e), L();
		},
		get height() {
			return a();
		},
		set height(e = 0) {
			a(e), L();
		},
		get isVisible() {
			return o();
		},
		set isVisible(e = !0) {
			o(e), L();
		}
	}, c = qr(), l = V(c), u = (e) => {
		var t = Eh();
		let o;
		U((e, i) => o = Wi(t, "", o, {
			width: e,
			height: i,
			transform: `translate(${n()}px, ${r()}px)`
		}), [() => typeof i() == "string" ? i() : ym(i()), () => typeof a() == "string" ? a() : ym(a())]), J(e, t);
	};
	return Y(l, (e) => {
		o() && e(u);
	}), J(e, c), P(s);
}
Q(Oh, {
	x: {},
	y: {},
	width: {},
	height: {},
	isVisible: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/NodeSelection/NodeSelection.svelte
var kh = /* @__PURE__ */ q("<div><!></div>"), Ah = {
	hash: "svelte-sf2y5e",
	code: ".svelte-flow__selection-wrapper.svelte-sf2y5e {position:absolute;top:0;left:0;z-index:2000;pointer-events:all;}.svelte-flow__selection-wrapper.svelte-sf2y5e:focus,\n  .svelte-flow__selection-wrapper.svelte-sf2y5e:focus-visible {outline:none;}"
};
function jh(e, t) {
	N(t, !0), ji(e, Ah);
	let n = Z(t, "store", 15), r = Z(t, "onnodedrag", 7), i = Z(t, "onnodedragstart", 7), a = Z(t, "onnodedragstop", 7), o = Z(t, "onselectionclick", 7), s = Z(t, "onselectioncontextmenu", 7), c = /* @__PURE__ */ R(void 0);
	An(() => {
		n().disableKeyboardA11y || K(c)?.focus({ preventScroll: !0 });
	});
	let l = /* @__PURE__ */ F(() => {
		if (n().selectionRectMode === "nodes") {
			n().nodes;
			let e = Fd(n().nodeLookup, { filter: (e) => !!e.selected });
			if (e.width > 0 && e.height > 0) return e;
		}
		return null;
	});
	function u(e) {
		let t = n().nodes.filter((e) => e.selected);
		s()?.({
			nodes: t,
			event: e
		});
	}
	function d(e) {
		let t = n().nodes.filter((e) => e.selected);
		o()?.({
			nodes: t,
			event: e
		});
	}
	function f(e) {
		Object.prototype.hasOwnProperty.call(bm, e.key) && (e.preventDefault(), n().moveSelectedNodes(bm[e.key], e.shiftKey ? 4 : 1));
	}
	var p = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get onnodedrag() {
			return r();
		},
		set onnodedrag(e) {
			r(e), L();
		},
		get onnodedragstart() {
			return i();
		},
		set onnodedragstart(e) {
			i(e), L();
		},
		get onnodedragstop() {
			return a();
		},
		set onnodedragstop(e) {
			a(e), L();
		},
		get onselectionclick() {
			return o();
		},
		set onselectionclick(e) {
			o(e), L();
		},
		get onselectioncontextmenu() {
			return s();
		},
		set onselectioncontextmenu(e) {
			s(e), L();
		}
	}, m = qr(), h = V(m), g = (e) => {
		var t = kh();
		let o;
		Oh(B(t), {
			width: "100%",
			height: "100%",
			x: 0,
			y: 0
		}), M(t), Mi(t, (e, t) => ih?.(e, t), () => ({
			disabled: !1,
			store: n(),
			onDrag: (e, t, n, i) => {
				r()?.({
					event: e,
					targetNode: null,
					nodes: i
				});
			},
			onDragStart: (e, t, n, r) => {
				i()?.({
					event: e,
					targetNode: null,
					nodes: r
				});
			},
			onDragStop: (e, t, n, r) => {
				a()?.({
					event: e,
					targetNode: null,
					nodes: r
				});
			}
		})), Sa(t, (e) => z(c, e), () => K(c)), U((e, r) => {
			Hi(t, 1, Ii(["svelte-flow__selection-wrapper", n().noPanClass]), "svelte-sf2y5e"), X(t, "role", n().disableKeyboardA11y ? void 0 : "button"), X(t, "tabindex", n().disableKeyboardA11y ? void 0 : -1), o = Wi(t, "", o, {
				width: e,
				height: r,
				transform: `translate(${K(l).x ?? ""}px, ${K(l).y ?? ""}px)`
			});
		}, [() => ym(K(l).width), () => ym(K(l).height)]), Fr("contextmenu", t, u), Fr("click", t, d), Fr("keydown", t, function(...e) {
			(n().disableKeyboardA11y ? void 0 : f)?.apply(this, e);
		}), J(e, t);
	}, _ = /* @__PURE__ */ F(() => n().selectionRectMode === "nodes" && K(l) && nf(K(l).x) && nf(K(l).y));
	return Y(h, (e) => {
		K(_) && e(g);
	}), J(e, m), P(p);
}
Ir([
	"contextmenu",
	"click",
	"keydown"
]), Q(jh, {
	store: {},
	onnodedrag: {},
	onnodedragstart: {},
	onnodedragstop: {},
	onselectionclick: {},
	onselectioncontextmenu: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@svelte-put/shortcut/src/shortcut.js
function Mh(e) {
	switch (e) {
		case "none": return 0;
		case "ctrl": return 8;
		case "shift": return 4;
		case "alt": return 2;
		case "meta": return 1;
	}
}
function Nh(e, t) {
	let { enabled: n = !0, trigger: r, type: i = "keydown" } = t;
	function a(t) {
		let n = Array.isArray(r) ? r : [r], i = [
			t.metaKey,
			t.altKey,
			t.shiftKey,
			t.ctrlKey
		].reduce((e, t, n) => t ? e | 1 << n : e, 0);
		for (let r of n) {
			let n = {
				preventDefault: !1,
				enabled: !0,
				...r
			}, { modifier: a, key: o, code: s, callback: c, preventDefault: l, enabled: u } = n;
			if (!o && !s && console.warn("[svelte-put/shortcut] Trigger should have either `key` or `code`, a trigger missing both was detected! Check your configuration"), u && (o || s)) {
				if (s && t.code !== s || o && t.key !== o) continue;
				if (a === null || a === !1) {
					if (i !== 0) continue;
				} else if (a !== void 0 && a?.[0]?.length > 0) {
					let e = Array.isArray(a) ? a : [a], t = !1;
					for (let n of e) if ((Array.isArray(n) ? n : [n]).reduce((e, t) => e | Mh(t), 0) === i) {
						t = !0;
						break;
					}
					if (!t) continue;
				}
				l && t.preventDefault();
				let r = {
					node: e,
					trigger: n,
					originalEvent: t
				};
				e.dispatchEvent(new CustomEvent("shortcut", { detail: r })), c?.(r);
			}
		}
	}
	let o;
	return n && (o = Nr(e, i, a)), {
		update: (t) => {
			let { enabled: s = !0, type: c = "keydown" } = t;
			n && (!s || i !== c) ? o?.() : !n && s && (o = Nr(e, c, a)), n = s, i = c, r = t.trigger;
		},
		destroy: () => {
			o?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useSvelteFlow.svelte.js
function Ph() {
	let e = /* @__PURE__ */ F(Gm), t = (t) => {
		let n = _m(t) ? t : K(e).nodeLookup.get(t.id), r = n.parentId ? gf(n.position, n.measured, n.parentId, K(e).nodeLookup, K(e).nodeOrigin) : n.position;
		return Xd({
			...n,
			position: r,
			width: n.measured?.width ?? n.width,
			height: n.measured?.height ?? n.height
		});
	};
	function n(t, n, r = { replace: !1 }) {
		K(e).nodes = Er(() => K(e).nodes).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r?.replace && _m(t) ? t : {
					...e,
					...t
				};
			}
			return e;
		});
	}
	function r(t, n, r = { replace: !1 }) {
		K(e).edges = Er(() => K(e).edges).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r.replace && vm(t) ? t : {
					...e,
					...t
				};
			}
			return e;
		});
	}
	let i = (t) => K(e).nodeLookup.get(t);
	return {
		zoomIn: K(e).zoomIn,
		zoomOut: K(e).zoomOut,
		getInternalNode: i,
		getNode: (e) => i(e)?.internals.userNode,
		getNodes: (t) => t === void 0 ? K(e).nodes : Fh(K(e).nodeLookup, t),
		getEdge: (t) => K(e).edgeLookup.get(t),
		getEdges: (t) => t === void 0 ? K(e).edges : Fh(K(e).edgeLookup, t),
		setZoom: async (t, n) => {
			let r = K(e).panZoom;
			return r ? r.scaleTo(t, n) : !1;
		},
		getZoom: () => K(e).viewport.zoom,
		setViewport: async (t, n) => {
			let r = K(e).viewport;
			return K(e).panZoom ? (await K(e).panZoom.setViewport({
				x: t.x ?? r.x,
				y: t.y ?? r.y,
				zoom: t.zoom ?? r.zoom
			}, n), !0) : !1;
		},
		getViewport: () => Je(K(e).viewport),
		setCenter: async (t, n, r) => K(e).setCenter(t, n, r),
		fitView: (t) => K(e).fitView(t),
		fitBounds: async (t, n) => {
			if (!K(e).panZoom) return !1;
			let r = df(t, K(e).width, K(e).height, K(e).minZoom, K(e).maxZoom, n?.padding ?? .1);
			return await K(e).panZoom.setViewport(r, {
				duration: n?.duration,
				ease: n?.ease,
				interpolate: n?.interpolate
			}), !0;
		},
		getIntersectingNodes: (n, r = !0, i) => {
			let a = tf(n), o = a ? n : t(n);
			return o ? (i || K(e).nodes).filter((t) => {
				let i = K(e).nodeLookup.get(t.id);
				if (!i || !a && t.id === n.id) return !1;
				let s = Xd(i), c = ef(s, o);
				return r && c > 0 || c >= s.width * s.height || c >= o.width * o.height;
			}) : [];
		},
		isNodeIntersecting: (e, n, r = !0) => {
			let i = tf(e) ? e : t(e);
			if (!i) return !1;
			let a = ef(i, n);
			return r && a > 0 || a >= n.width * n.height || a >= i.width * i.height;
		},
		deleteElements: async ({ nodes: t = [], edges: n = [] }) => {
			let { nodes: r, edges: i } = await Vd({
				nodesToRemove: t,
				edgesToRemove: n,
				nodes: K(e).nodes,
				edges: K(e).edges,
				onBeforeDelete: K(e).onbeforedelete
			});
			return r && (K(e).nodes = Er(() => K(e).nodes).filter((e) => !r.some(({ id: t }) => t === e.id))), i && (K(e).edges = Er(() => K(e).edges).filter((e) => !i.some(({ id: t }) => t === e.id))), (r.length > 0 || i.length > 0) && K(e).ondelete?.({
				nodes: r,
				edges: i
			}), {
				deletedNodes: r,
				deletedEdges: i
			};
		},
		screenToFlowPosition: (t, n = { snapToGrid: !0 }) => {
			if (!K(e).domNode) return t;
			let r = n.snapToGrid ? K(e).snapGrid : !1, { x: i, y: a, zoom: o } = K(e).viewport, { x: s, y: c } = K(e).domNode.getBoundingClientRect();
			return of({
				x: t.x - s,
				y: t.y - c
			}, [
				i,
				a,
				o
			], r !== null, r || [1, 1]);
		},
		flowToScreenPosition: (t) => {
			if (!K(e).domNode) return t;
			let { x: n, y: r, zoom: i } = K(e).viewport, { x: a, y: o } = K(e).domNode.getBoundingClientRect(), s = sf(t, [
				n,
				r,
				i
			]);
			return {
				x: s.x + a,
				y: s.y + o
			};
		},
		toObject: () => structuredClone({
			nodes: [...K(e).nodes],
			edges: [...K(e).edges],
			viewport: { ...K(e).viewport }
		}),
		updateNode: n,
		updateNodeData: (t, r, i) => {
			let a = K(e).nodeLookup.get(t)?.internals.userNode;
			if (!a) return;
			let o = typeof r == "function" ? r(a) : r;
			n(t, (e) => ({
				...e,
				data: i?.replace ? o : {
					...e.data,
					...o
				}
			}));
		},
		updateEdge: r,
		getNodesBounds: (t) => Pd(t, {
			nodeLookup: K(e).nodeLookup,
			nodeOrigin: K(e).nodeOrigin
		}),
		getHandleConnections: ({ type: t, id: n, nodeId: r }) => Array.from(K(e).connectionLookup.get(`${r}-${t}-${n ?? null}`)?.values() ?? [])
	};
}
function Fh(e, t) {
	let n = [];
	for (let r of t) {
		let t = e.get(r);
		if (t) {
			let e = "internals" in t ? t.internals?.userNode : t;
			n.push(e);
		}
	}
	return n;
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/KeyHandler/KeyHandler.svelte
function Ih(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "selectionKey", 7, "Shift"), i = Z(t, "multiSelectionKey", 23, () => ff() ? "Meta" : "Control"), a = Z(t, "deleteKey", 7, "Backspace"), o = Z(t, "panActivationKey", 7, " "), s = Z(t, "zoomActivationKey", 23, () => ff() ? "Meta" : "Control"), { deleteElements: c } = Ph();
	function l(e) {
		return typeof e == "object" && !!e;
	}
	function u(e) {
		return l(e) && e.modifier || [];
	}
	function d(e) {
		return e == null ? "" : l(e) ? e.key : e;
	}
	function f(e, t) {
		return (Array.isArray(e) ? e : [e]).map((e) => {
			let n = d(e);
			return {
				key: n,
				modifier: u(e),
				enabled: n !== null,
				callback: t
			};
		});
	}
	function p() {
		n(n().selectionRect = null, !0), n(n().selectionKeyPressed = !1, !0), n(n().multiselectionKeyPressed = !1, !0), n(n().deleteKeyPressed = !1, !0), n(n().panActivationKeyPressed = !1, !0), n(n().zoomActivationKeyPressed = !1, !0);
	}
	function m() {
		let e = n().nodes.filter((e) => e.selected), t = n().edges.filter((e) => e.selected);
		c({
			nodes: e,
			edges: t
		});
	}
	return Pr("blur", un, p), Pr("contextmenu", un, p), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !0, !0)),
		type: "keydown"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !1, !0)),
		type: "keyup"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(i(), () => {
			n(n().multiselectionKeyPressed = !0, !0);
		}),
		type: "keydown"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(i(), () => n(n().multiselectionKeyPressed = !1, !0)),
		type: "keyup"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(a(), (e) => {
			!(e.originalEvent.ctrlKey || e.originalEvent.metaKey || e.originalEvent.shiftKey) && !Tf(e.originalEvent) && (n(n().deleteKeyPressed = !0, !0), m());
		}),
		type: "keydown"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(a(), () => n(n().deleteKeyPressed = !1, !0)),
		type: "keyup"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), Mi(un, (e, t) => Nh?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), P({
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get selectionKey() {
			return r();
		},
		set selectionKey(e = "Shift") {
			r(e), L();
		},
		get multiSelectionKey() {
			return i();
		},
		set multiSelectionKey(e = ff() ? "Meta" : "Control") {
			i(e), L();
		},
		get deleteKey() {
			return a();
		},
		set deleteKey(e = "Backspace") {
			a(e), L();
		},
		get panActivationKey() {
			return o();
		},
		set panActivationKey(e = " ") {
			o(e), L();
		},
		get zoomActivationKey() {
			return s();
		},
		set zoomActivationKey(e = ff() ? "Meta" : "Control") {
			s(e), L();
		}
	});
}
Q(Ih, {
	store: {},
	selectionKey: {},
	multiSelectionKey: {},
	deleteKey: {},
	panActivationKey: {},
	zoomActivationKey: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/ConnectionLine/ConnectionLine.svelte
var Lh = /* @__PURE__ */ Gr("<path fill=\"none\" class=\"svelte-flow__connection-path\"></path>"), Rh = /* @__PURE__ */ Gr("<svg class=\"svelte-flow__connectionline\"><g><!></g></svg>");
function zh(e, t) {
	N(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "type", 7), i = Z(t, "containerStyle", 7), a = Z(t, "style", 7), o = Z(t, "LineComponent", 7), s = /* @__PURE__ */ F(() => {
		if (!n().connection.inProgress) return "";
		let e = {
			sourceX: n().connection.from.x,
			sourceY: n().connection.from.y,
			sourcePosition: n().connection.fromPosition,
			targetX: n().connection.to.x,
			targetY: n().connection.to.y,
			targetPosition: n().connection.toPosition
		};
		switch (r()) {
			case Dd.Bezier: {
				let [t] = Mf(e);
				return t;
			}
			case Dd.Straight: {
				let [t] = zf(e);
				return t;
			}
			case Dd.Step:
			case Dd.SmoothStep: {
				let [t] = Gf({
					...e,
					borderRadius: r() === Dd.Step ? 0 : void 0
				});
				return t;
			}
		}
	});
	var c = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), L();
		},
		get type() {
			return r();
		},
		set type(e) {
			r(e), L();
		},
		get containerStyle() {
			return i();
		},
		set containerStyle(e) {
			i(e), L();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), L();
		},
		get LineComponent() {
			return o();
		},
		set LineComponent(e) {
			o(e), L();
		}
	}, l = qr(), u = V(l), d = (e) => {
		var t = Rh(), r = B(t), c = B(r), l = (e) => {
			var t = qr();
			Ai(V(t), o, (e, t) => {
				t(e, {});
			}), J(e, t);
		}, u = (e) => {
			var t = Lh();
			U(() => {
				X(t, "d", K(s)), Wi(t, a());
			}), J(e, t);
		};
		Y(c, (e) => {
			o() ? e(l) : e(u, -1);
		}), M(r), M(t), U((e) => {
			X(t, "width", n().width), X(t, "height", n().height), Wi(t, i()), Hi(r, 0, e);
		}, [() => Ii(["svelte-flow__connection", bf(n().connection.isValid)])]), J(e, t);
	};
	return Y(u, (e) => {
		n().connection.inProgress && e(d);
	}), J(e, l), P(c);
}
Q(zh, {
	store: {},
	type: {},
	containerStyle: {},
	style: {},
	LineComponent: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Panel/Panel.svelte
var Bh = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"position",
	"style",
	"class",
	"children"
]), Vh = /* @__PURE__ */ q("<div><!></div>");
function Hh(e, t) {
	N(t, !0);
	let n = Z(t, "position", 7, "top-right"), r = Z(t, "style", 7), i = Z(t, "class", 7), a = Z(t, "children", 7), o = /* @__PURE__ */ Oa(t, Bh), s = /* @__PURE__ */ F(() => `${n()}`.split("-"));
	var c = {
		get position() {
			return n();
		},
		set position(e = "top-right") {
			n(e), L();
		},
		get style() {
			return r();
		},
		set style(e) {
			r(e), L();
		},
		get class() {
			return i();
		},
		set class(e) {
			i(e), L();
		},
		get children() {
			return a();
		},
		set children(e) {
			a(e), L();
		}
	}, l = Vh();
	return fa(l, (e) => ({
		class: e,
		style: r(),
		...o
	}), [() => [
		"svelte-flow__panel",
		i(),
		...K(s)
	]]), mi(B(l), () => a() ?? g), M(l), J(e, l), P(c);
}
Q(Hh, {
	position: {},
	style: {},
	class: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Attribution/Attribution.svelte
var Uh = /* @__PURE__ */ q("<a target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Svelte Flow attribution\">Svelte Flow</a>");
function Wh(e, t) {
	N(t, !0);
	let n = Z(t, "proOptions", 7), r = Z(t, "position", 7, "bottom-right"), i = "https://svelteflow.dev?utm_source=attribution";
	var a = {
		get proOptions() {
			return n();
		},
		set proOptions(e) {
			n(e), L();
		},
		get position() {
			return r();
		},
		set position(e = "bottom-right") {
			r(e), L();
		}
	}, o = qr(), s = V(o), c = (e) => {
		{
			let t = /* @__PURE__ */ F(() => `Please only hide this attribution when you are subscribed to Svelte Flow Pro: ${i}`);
			Hh(e, {
				get position() {
					return r();
				},
				class: "svelte-flow__attribution",
				get "data-message"() {
					return K(t);
				},
				children: (e, t) => {
					var n = Uh();
					U(() => X(n, "href", i)), J(e, n);
				},
				$$slots: { default: !0 }
			});
		}
	};
	return Y(s, (e) => {
		n()?.hideAttribution || e(c);
	}), J(e, o), P(a);
}
Q(Wh, {
	proOptions: {},
	position: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/SvelteFlow/Wrapper.svelte
var Gh = /* @__PURE__ */ q("<div><!></div>"), Kh = {
	hash: "svelte-mkap6j",
	code: ".svelte-flow.svelte-mkap6j {width:100%;height:100%;overflow:hidden;position:relative;z-index:0;}"
};
function qh(e, t) {
	N(t, !0), ji(e, Kh);
	let n = Z(t, "width", 7), r = Z(t, "height", 7), i = Z(t, "colorMode", 7), a = Z(t, "domNode", 15), o = Z(t, "clientWidth", 15), s = Z(t, "clientHeight", 15), c = Z(t, "children", 7), l = Z(t, "rest", 7), u = /* @__PURE__ */ F(() => l().class), d = /* @__PURE__ */ F(() => S(l(), /* @__PURE__ */ "id.class.nodeTypes.edgeTypes.colorMode.isValidConnection.onmove.onmovestart.onmoveend.onflowerror.ondelete.onbeforedelete.onbeforeconnect.onconnect.onconnectstart.onconnectend.onbeforereconnect.onreconnect.onreconnectstart.onreconnectend.onclickconnectstart.onclickconnectend.oninit.onselectionchange.onselectiondragstart.onselectiondrag.onselectiondragstop.onselectionstart.onselectionend.clickConnect.fitView.fitViewOptions.nodeOrigin.nodeDragThreshold.connectionDragThreshold.minZoom.maxZoom.initialViewport.connectionRadius.connectionMode.selectionMode.selectNodesOnDrag.snapGrid.defaultMarkerColor.translateExtent.nodeExtent.onlyRenderVisibleElements.autoPanOnConnect.autoPanOnNodeDrag.colorModeSSR.defaultEdgeOptions.elevateNodesOnSelect.elevateEdgesOnSelect.nodesDraggable.autoPanOnNodeFocus.nodesConnectable.elementsSelectable.nodesFocusable.edgesFocusable.disableKeyboardA11y.noDragClass.noPanClass.noWheelClass.ariaLabelConfig.autoPanSpeed.panOnScrollSpeed.zIndexMode.autoPanOnSelection".split(".")));
	function f(e) {
		e.currentTarget.scrollTo({
			top: 0,
			left: 0,
			behavior: "auto"
		}), l().onscroll && l().onscroll(e);
	}
	var p = {
		get width() {
			return n();
		},
		set width(e) {
			n(e), L();
		},
		get height() {
			return r();
		},
		set height(e) {
			r(e), L();
		},
		get colorMode() {
			return i();
		},
		set colorMode(e) {
			i(e), L();
		},
		get domNode() {
			return a();
		},
		set domNode(e) {
			a(e), L();
		},
		get clientWidth() {
			return o();
		},
		set clientWidth(e) {
			o(e), L();
		},
		get clientHeight() {
			return s();
		},
		set clientHeight(e) {
			s(e), L();
		},
		get children() {
			return c();
		},
		set children(e) {
			c(e), L();
		},
		get rest() {
			return l();
		},
		set rest(e) {
			l(e), L();
		}
	}, m = Gh();
	return fa(m, (e, t) => ({
		class: [
			"svelte-flow",
			"svelte-flow__container",
			i(),
			K(u)
		],
		"data-testid": "svelte-flow__wrapper",
		role: "application",
		onscroll: f,
		...K(d),
		[ea]: {
			width: e,
			height: t
		}
	}), [() => ym(n()), () => ym(r())], void 0, void 0, "svelte-mkap6j"), mi(B(m), () => c() ?? g), M(m), Sa(m, (e) => a(e), () => a()), ba(m, "clientHeight", s), ba(m, "clientWidth", o), J(e, m), P(p);
}
Q(qh, {
	width: {},
	height: {},
	colorMode: {},
	domNode: {},
	clientWidth: {},
	clientHeight: {},
	children: {},
	rest: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/SvelteFlow/SvelteFlow.svelte
var Jh = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.$$host.width.height.proOptions.selectionKey.deleteKey.panActivationKey.multiSelectionKey.zoomActivationKey.paneClickDistance.nodeClickDistance.onmovestart.onmoveend.onmove.oninit.onnodeclick.onnodecontextmenu.onnodedrag.onnodedragstart.onnodedragstop.onnodepointerenter.onnodepointermove.onnodepointerleave.onselectionclick.onselectioncontextmenu.onselectionstart.onselectionend.onedgeclick.onedgecontextmenu.onedgepointerenter.onedgepointerleave.onpaneclick.onpanecontextmenu.panOnScrollMode.preventScrolling.zoomOnScroll.zoomOnDoubleClick.zoomOnPinch.panOnScroll.panOnScrollSpeed.panOnDrag.selectionOnDrag.autoPanOnSelection.connectionLineComponent.connectionLineStyle.connectionLineContainerStyle.connectionLineType.attributionPosition.children.nodes.edges.viewport".split(".")), Yh = /* @__PURE__ */ q("<div class=\"svelte-flow__viewport-back svelte-flow__container\"></div> <!> <div class=\"svelte-flow__edge-labels svelte-flow__container\"></div> <!> <!> <!> <div class=\"svelte-flow__viewport-front svelte-flow__container\"></div>", 1), Xh = /* @__PURE__ */ q("<!> <!>", 1), Zh = /* @__PURE__ */ q("<!> <!> <!> <!> <!>", 1);
function Qh(e, t) {
	N(t, !0);
	let n = Z(t, "width", 7), r = Z(t, "height", 7), i = Z(t, "proOptions", 7), a = Z(t, "selectionKey", 7), o = Z(t, "deleteKey", 7), s = Z(t, "panActivationKey", 7), c = Z(t, "multiSelectionKey", 7), l = Z(t, "zoomActivationKey", 7), u = Z(t, "paneClickDistance", 7, 1), d = Z(t, "nodeClickDistance", 7, 1), f = Z(t, "onmovestart", 7), p = Z(t, "onmoveend", 7), m = Z(t, "onmove", 7), h = Z(t, "oninit", 7), _ = Z(t, "onnodeclick", 7), v = Z(t, "onnodecontextmenu", 7), y = Z(t, "onnodedrag", 7), b = Z(t, "onnodedragstart", 7), x = Z(t, "onnodedragstop", 7), S = Z(t, "onnodepointerenter", 7), C = Z(t, "onnodepointermove", 7), w = Z(t, "onnodepointerleave", 7), T = Z(t, "onselectionclick", 7), E = Z(t, "onselectioncontextmenu", 7), D = Z(t, "onselectionstart", 7), ee = Z(t, "onselectionend", 7), te = Z(t, "onedgeclick", 7), ne = Z(t, "onedgecontextmenu", 7), re = Z(t, "onedgepointerenter", 7), ie = Z(t, "onedgepointerleave", 7), ae = Z(t, "onpaneclick", 7), O = Z(t, "onpanecontextmenu", 7), k = Z(t, "panOnScrollMode", 23, () => wd.Free), oe = Z(t, "preventScrolling", 7, !0), se = Z(t, "zoomOnScroll", 7, !0), ce = Z(t, "zoomOnDoubleClick", 7, !0), le = Z(t, "zoomOnPinch", 7, !0), ue = Z(t, "panOnScroll", 7, !1), de = Z(t, "panOnScrollSpeed", 7, .5), fe = Z(t, "panOnDrag", 7, !0), pe = Z(t, "selectionOnDrag", 7, !1), me = Z(t, "autoPanOnSelection", 7, !0), he = Z(t, "connectionLineComponent", 7), ge = Z(t, "connectionLineStyle", 7), _e = Z(t, "connectionLineContainerStyle", 7), ve = Z(t, "connectionLineType", 23, () => Dd.Bezier), ye = Z(t, "attributionPosition", 7), be = Z(t, "children", 7), xe = Z(t, "nodes", 31, () => sn([])), Se = Z(t, "edges", 31, () => sn([])), A = Z(t, "viewport", 15, void 0), Ce = /* @__PURE__ */ Oa(t, Jh), j = qm({
		props: Ce,
		width: n(),
		height: r(),
		get nodes() {
			return xe();
		},
		set nodes(e) {
			xe(e);
		},
		get edges() {
			return Se();
		},
		set edges(e) {
			Se(e);
		},
		get viewport() {
			return A();
		},
		set viewport(e) {
			A(e);
		}
	}), we = et(Km);
	return we && we.setStore && we.setStore(j), tt(Km, {
		provider: !1,
		getStore() {
			return j;
		}
	}), An(() => {
		let e = {
			nodes: j.selectedNodes,
			edges: j.selectedEdges
		};
		Er(() => t.onselectionchange)?.(e);
		for (let t of j.selectionChangeHandlers.values()) t(e);
	}), gi(() => {
		we?.setStore(qm({
			width: 0,
			height: 0,
			nodes: [],
			edges: [],
			props: {}
		}));
	}), qh(e, {
		get colorMode() {
			return j.colorMode;
		},
		get width() {
			return n();
		},
		get height() {
			return r();
		},
		get rest() {
			return Ce;
		},
		get domNode() {
			return j.domNode;
		},
		set domNode(e) {
			j.domNode = e;
		},
		get clientWidth() {
			return j.width;
		},
		set clientWidth(e) {
			j.width = e;
		},
		get clientHeight() {
			return j.height;
		},
		set clientHeight(e) {
			j.height = e;
		},
		children: (e, t) => {
			var n = Zh(), r = V(n);
			Ih(r, {
				get selectionKey() {
					return a();
				},
				get deleteKey() {
					return o();
				},
				get panActivationKey() {
					return s();
				},
				get multiSelectionKey() {
					return c();
				},
				get zoomActivationKey() {
					return l();
				},
				get store() {
					return j;
				},
				set store(e) {
					j = e;
				}
			});
			var xe = H(r, 2);
			Xm(xe, {
				get panOnScrollMode() {
					return k();
				},
				get preventScrolling() {
					return oe();
				},
				get zoomOnScroll() {
					return se();
				},
				get zoomOnDoubleClick() {
					return ce();
				},
				get zoomOnPinch() {
					return le();
				},
				get panOnScroll() {
					return ue();
				},
				get panOnScrollSpeed() {
					return de();
				},
				get panOnDrag() {
					return fe();
				},
				get paneClickDistance() {
					return u();
				},
				get selectionOnDrag() {
					return pe();
				},
				get onmovestart() {
					return f();
				},
				get onmove() {
					return m();
				},
				get onmoveend() {
					return p();
				},
				get oninit() {
					return h();
				},
				get store() {
					return j;
				},
				set store(e) {
					j = e;
				},
				children: (e, t) => {
					th(e, {
						get onpaneclick() {
							return ae();
						},
						get onpanecontextmenu() {
							return O();
						},
						get onselectionstart() {
							return D();
						},
						get onselectionend() {
							return ee();
						},
						get panOnDrag() {
							return fe();
						},
						get paneClickDistance() {
							return u();
						},
						get selectionOnDrag() {
							return pe();
						},
						get autoPanOnSelection() {
							return me();
						},
						get store() {
							return j;
						},
						set store(e) {
							j = e;
						},
						children: (e, t) => {
							var n = Xh(), r = V(n);
							rh(r, {
								get store() {
									return j;
								},
								set store(e) {
									j = e;
								},
								children: (e, t) => {
									var n = Yh(), r = H(V(n), 2);
									Th(r, {
										get onedgeclick() {
											return te();
										},
										get onedgecontextmenu() {
											return ne();
										},
										get onedgepointerenter() {
											return re();
										},
										get onedgepointerleave() {
											return ie();
										},
										get store() {
											return j;
										},
										set store(e) {
											j = e;
										}
									});
									var i = H(r, 4);
									zh(i, {
										get type() {
											return ve();
										},
										get LineComponent() {
											return he();
										},
										get containerStyle() {
											return _e();
										},
										get style() {
											return ge();
										},
										get store() {
											return j;
										},
										set store(e) {
											j = e;
										}
									});
									var a = H(i, 2);
									hh(a, {
										get nodeClickDistance() {
											return d();
										},
										get onnodeclick() {
											return _();
										},
										get onnodecontextmenu() {
											return v();
										},
										get onnodepointerenter() {
											return S();
										},
										get onnodepointermove() {
											return C();
										},
										get onnodepointerleave() {
											return w();
										},
										get onnodedrag() {
											return y();
										},
										get onnodedragstart() {
											return b();
										},
										get onnodedragstop() {
											return x();
										},
										get store() {
											return j;
										},
										set store(e) {
											j = e;
										}
									}), jh(H(a, 2), {
										get onselectionclick() {
											return T();
										},
										get onselectioncontextmenu() {
											return E();
										},
										get onnodedrag() {
											return y();
										},
										get onnodedragstart() {
											return b();
										},
										get onnodedragstop() {
											return x();
										},
										get store() {
											return j;
										},
										set store(e) {
											j = e;
										}
									}), Ee(2), J(e, n);
								},
								$$slots: { default: !0 }
							});
							var i = H(r, 2);
							{
								let e = /* @__PURE__ */ F(() => !!(j.selectionRect && j.selectionRectMode === "user")), t = /* @__PURE__ */ F(() => j.selectionRect?.width), n = /* @__PURE__ */ F(() => j.selectionRect?.height), r = /* @__PURE__ */ F(() => j.selectionRect?.x), a = /* @__PURE__ */ F(() => j.selectionRect?.y);
								Oh(i, {
									get isVisible() {
										return K(e);
									},
									get width() {
										return K(t);
									},
									get height() {
										return K(n);
									},
									get x() {
										return K(r);
									},
									get y() {
										return K(a);
									}
								});
							}
							J(e, n);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Se = H(xe, 2);
			Wh(Se, {
				get proOptions() {
					return i();
				},
				get position() {
					return ye();
				}
			});
			var A = H(Se, 2);
			ch(A, { get store() {
				return j;
			} }), mi(H(A, 2), () => be() ?? g), J(e, n);
		},
		$$slots: { default: !0 }
	}), P({
		get width() {
			return n();
		},
		set width(e) {
			n(e), L();
		},
		get height() {
			return r();
		},
		set height(e) {
			r(e), L();
		},
		get proOptions() {
			return i();
		},
		set proOptions(e) {
			i(e), L();
		},
		get selectionKey() {
			return a();
		},
		set selectionKey(e) {
			a(e), L();
		},
		get deleteKey() {
			return o();
		},
		set deleteKey(e) {
			o(e), L();
		},
		get panActivationKey() {
			return s();
		},
		set panActivationKey(e) {
			s(e), L();
		},
		get multiSelectionKey() {
			return c();
		},
		set multiSelectionKey(e) {
			c(e), L();
		},
		get zoomActivationKey() {
			return l();
		},
		set zoomActivationKey(e) {
			l(e), L();
		},
		get paneClickDistance() {
			return u();
		},
		set paneClickDistance(e = 1) {
			u(e), L();
		},
		get nodeClickDistance() {
			return d();
		},
		set nodeClickDistance(e = 1) {
			d(e), L();
		},
		get onmovestart() {
			return f();
		},
		set onmovestart(e) {
			f(e), L();
		},
		get onmoveend() {
			return p();
		},
		set onmoveend(e) {
			p(e), L();
		},
		get onmove() {
			return m();
		},
		set onmove(e) {
			m(e), L();
		},
		get oninit() {
			return h();
		},
		set oninit(e) {
			h(e), L();
		},
		get onnodeclick() {
			return _();
		},
		set onnodeclick(e) {
			_(e), L();
		},
		get onnodecontextmenu() {
			return v();
		},
		set onnodecontextmenu(e) {
			v(e), L();
		},
		get onnodedrag() {
			return y();
		},
		set onnodedrag(e) {
			y(e), L();
		},
		get onnodedragstart() {
			return b();
		},
		set onnodedragstart(e) {
			b(e), L();
		},
		get onnodedragstop() {
			return x();
		},
		set onnodedragstop(e) {
			x(e), L();
		},
		get onnodepointerenter() {
			return S();
		},
		set onnodepointerenter(e) {
			S(e), L();
		},
		get onnodepointermove() {
			return C();
		},
		set onnodepointermove(e) {
			C(e), L();
		},
		get onnodepointerleave() {
			return w();
		},
		set onnodepointerleave(e) {
			w(e), L();
		},
		get onselectionclick() {
			return T();
		},
		set onselectionclick(e) {
			T(e), L();
		},
		get onselectioncontextmenu() {
			return E();
		},
		set onselectioncontextmenu(e) {
			E(e), L();
		},
		get onselectionstart() {
			return D();
		},
		set onselectionstart(e) {
			D(e), L();
		},
		get onselectionend() {
			return ee();
		},
		set onselectionend(e) {
			ee(e), L();
		},
		get onedgeclick() {
			return te();
		},
		set onedgeclick(e) {
			te(e), L();
		},
		get onedgecontextmenu() {
			return ne();
		},
		set onedgecontextmenu(e) {
			ne(e), L();
		},
		get onedgepointerenter() {
			return re();
		},
		set onedgepointerenter(e) {
			re(e), L();
		},
		get onedgepointerleave() {
			return ie();
		},
		set onedgepointerleave(e) {
			ie(e), L();
		},
		get onpaneclick() {
			return ae();
		},
		set onpaneclick(e) {
			ae(e), L();
		},
		get onpanecontextmenu() {
			return O();
		},
		set onpanecontextmenu(e) {
			O(e), L();
		},
		get panOnScrollMode() {
			return k();
		},
		set panOnScrollMode(e = wd.Free) {
			k(e), L();
		},
		get preventScrolling() {
			return oe();
		},
		set preventScrolling(e = !0) {
			oe(e), L();
		},
		get zoomOnScroll() {
			return se();
		},
		set zoomOnScroll(e = !0) {
			se(e), L();
		},
		get zoomOnDoubleClick() {
			return ce();
		},
		set zoomOnDoubleClick(e = !0) {
			ce(e), L();
		},
		get zoomOnPinch() {
			return le();
		},
		set zoomOnPinch(e = !0) {
			le(e), L();
		},
		get panOnScroll() {
			return ue();
		},
		set panOnScroll(e = !1) {
			ue(e), L();
		},
		get panOnScrollSpeed() {
			return de();
		},
		set panOnScrollSpeed(e = .5) {
			de(e), L();
		},
		get panOnDrag() {
			return fe();
		},
		set panOnDrag(e = !0) {
			fe(e), L();
		},
		get selectionOnDrag() {
			return pe();
		},
		set selectionOnDrag(e = !1) {
			pe(e), L();
		},
		get autoPanOnSelection() {
			return me();
		},
		set autoPanOnSelection(e = !0) {
			me(e), L();
		},
		get connectionLineComponent() {
			return he();
		},
		set connectionLineComponent(e) {
			he(e), L();
		},
		get connectionLineStyle() {
			return ge();
		},
		set connectionLineStyle(e) {
			ge(e), L();
		},
		get connectionLineContainerStyle() {
			return _e();
		},
		set connectionLineContainerStyle(e) {
			_e(e), L();
		},
		get connectionLineType() {
			return ve();
		},
		set connectionLineType(e = Dd.Bezier) {
			ve(e), L();
		},
		get attributionPosition() {
			return ye();
		},
		set attributionPosition(e) {
			ye(e), L();
		},
		get children() {
			return be();
		},
		set children(e) {
			be(e), L();
		},
		get nodes() {
			return xe();
		},
		set nodes(e = []) {
			xe(e), L();
		},
		get edges() {
			return Se();
		},
		set edges(e = []) {
			Se(e), L();
		},
		get viewport() {
			return A();
		},
		set viewport(e = void 0) {
			A(e), L();
		}
	});
}
Q(Qh, {
	width: {},
	height: {},
	proOptions: {},
	selectionKey: {},
	deleteKey: {},
	panActivationKey: {},
	multiSelectionKey: {},
	zoomActivationKey: {},
	paneClickDistance: {},
	nodeClickDistance: {},
	onmovestart: {},
	onmoveend: {},
	onmove: {},
	oninit: {},
	onnodeclick: {},
	onnodecontextmenu: {},
	onnodedrag: {},
	onnodedragstart: {},
	onnodedragstop: {},
	onnodepointerenter: {},
	onnodepointermove: {},
	onnodepointerleave: {},
	onselectionclick: {},
	onselectioncontextmenu: {},
	onselectionstart: {},
	onselectionend: {},
	onedgeclick: {},
	onedgecontextmenu: {},
	onedgepointerenter: {},
	onedgepointerleave: {},
	onpaneclick: {},
	onpanecontextmenu: {},
	panOnScrollMode: {},
	preventScrolling: {},
	zoomOnScroll: {},
	zoomOnDoubleClick: {},
	zoomOnPinch: {},
	panOnScroll: {},
	panOnScrollSpeed: {},
	panOnDrag: {},
	selectionOnDrag: {},
	autoPanOnSelection: {},
	connectionLineComponent: {},
	connectionLineStyle: {},
	connectionLineContainerStyle: {},
	connectionLineType: {},
	attributionPosition: {},
	children: {},
	nodes: {},
	edges: {},
	viewport: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/ControlButton.svelte
var $h = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"class",
	"bgColor",
	"bgColorHover",
	"color",
	"colorHover",
	"borderColor",
	"onclick",
	"children"
]), eg = /* @__PURE__ */ q("<button><!></button>");
function tg(e, t) {
	N(t, !0);
	let n = Z(t, "class", 7), r = Z(t, "bgColor", 7), i = Z(t, "bgColorHover", 7), a = Z(t, "color", 7), o = Z(t, "colorHover", 7), s = Z(t, "borderColor", 7), c = Z(t, "onclick", 7), l = Z(t, "children", 7), u = /* @__PURE__ */ Oa(t, $h);
	var d = {
		get class() {
			return n();
		},
		set class(e) {
			n(e), L();
		},
		get bgColor() {
			return r();
		},
		set bgColor(e) {
			r(e), L();
		},
		get bgColorHover() {
			return i();
		},
		set bgColorHover(e) {
			i(e), L();
		},
		get color() {
			return a();
		},
		set color(e) {
			a(e), L();
		},
		get colorHover() {
			return o();
		},
		set colorHover(e) {
			o(e), L();
		},
		get borderColor() {
			return s();
		},
		set borderColor(e) {
			s(e), L();
		},
		get onclick() {
			return c();
		},
		set onclick(e) {
			c(e), L();
		},
		get children() {
			return l();
		},
		set children(e) {
			l(e), L();
		}
	}, f = eg();
	return fa(f, () => ({
		type: "button",
		onclick: c(),
		class: ["svelte-flow__controls-button", n()],
		...u,
		[ea]: {
			"--xy-controls-button-background-color-props": r(),
			"--xy-controls-button-background-color-hover-props": i(),
			"--xy-controls-button-color-props": a(),
			"--xy-controls-button-color-hover-props": o(),
			"--xy-controls-button-border-color-props": s()
		}
	})), mi(B(f), () => l() ?? g), M(f), J(e, f), P(d);
}
Q(tg, {
	class: {},
	bgColor: {},
	bgColorHover: {},
	color: {},
	colorHover: {},
	borderColor: {},
	onclick: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Plus.svelte
var ng = /* @__PURE__ */ Gr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><path d=\"M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z\"></path></svg>");
function rg(e) {
	J(e, ng());
}
Q(rg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Minus.svelte
var ig = /* @__PURE__ */ Gr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 5\"><path d=\"M0 0h32v4.2H0z\"></path></svg>");
function ag(e) {
	J(e, ig());
}
Q(ag, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Fit.svelte
var og = /* @__PURE__ */ Gr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 30\"><path d=\"M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z\"></path></svg>");
function sg(e) {
	J(e, og());
}
Q(sg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Lock.svelte
var cg = /* @__PURE__ */ Gr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z\"></path></svg>");
function lg(e) {
	J(e, cg());
}
Q(lg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Unlock.svelte
var ug = /* @__PURE__ */ Gr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z\"></path></svg>");
function dg(e) {
	J(e, ug());
}
Q(dg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Controls.svelte
var fg = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"position",
	"orientation",
	"showZoom",
	"showFitView",
	"showLock",
	"style",
	"class",
	"buttonBgColor",
	"buttonBgColorHover",
	"buttonColor",
	"buttonColorHover",
	"buttonBorderColor",
	"fitViewOptions",
	"children",
	"before",
	"after"
]), pg = /* @__PURE__ */ q("<!> <!>", 1), mg = /* @__PURE__ */ q("<!> <!> <!> <!> <!> <!>", 1);
function hg(e, t) {
	N(t, !0);
	let n = Z(t, "position", 7, "bottom-left"), r = Z(t, "orientation", 7, "vertical"), i = Z(t, "showZoom", 7, !0), a = Z(t, "showFitView", 7, !0), o = Z(t, "showLock", 7, !0), s = Z(t, "style", 7), c = Z(t, "class", 7), l = Z(t, "buttonBgColor", 7), u = Z(t, "buttonBgColorHover", 7), d = Z(t, "buttonColor", 7), f = Z(t, "buttonColorHover", 7), p = Z(t, "buttonBorderColor", 7), m = Z(t, "fitViewOptions", 7), h = Z(t, "children", 7), g = Z(t, "before", 7), _ = Z(t, "after", 7), v = /* @__PURE__ */ Oa(t, fg), y = /* @__PURE__ */ F(Gm), b = /* @__PURE__ */ F(() => ({
		bgColor: l(),
		bgColorHover: u(),
		color: d(),
		colorHover: f(),
		borderColor: p()
	})), x = /* @__PURE__ */ F(() => K(y).nodesDraggable || K(y).nodesConnectable || K(y).elementsSelectable), S = /* @__PURE__ */ F(() => K(y).viewport.zoom <= K(y).minZoom), C = /* @__PURE__ */ F(() => K(y).viewport.zoom >= K(y).maxZoom), w = /* @__PURE__ */ F(() => K(y).ariaLabelConfig), T = /* @__PURE__ */ F(() => r() === "horizontal" ? "horizontal" : "vertical"), E = () => {
		K(y).zoomIn();
	}, D = () => {
		K(y).zoomOut();
	}, ee = () => {
		K(y).fitView(m());
	}, te = () => {
		let e = !K(x);
		K(y).nodesDraggable = e, K(y).nodesConnectable = e, K(y).elementsSelectable = e;
	};
	var ne = {
		get position() {
			return n();
		},
		set position(e = "bottom-left") {
			n(e), L();
		},
		get orientation() {
			return r();
		},
		set orientation(e = "vertical") {
			r(e), L();
		},
		get showZoom() {
			return i();
		},
		set showZoom(e = !0) {
			i(e), L();
		},
		get showFitView() {
			return a();
		},
		set showFitView(e = !0) {
			a(e), L();
		},
		get showLock() {
			return o();
		},
		set showLock(e = !0) {
			o(e), L();
		},
		get style() {
			return s();
		},
		set style(e) {
			s(e), L();
		},
		get class() {
			return c();
		},
		set class(e) {
			c(e), L();
		},
		get buttonBgColor() {
			return l();
		},
		set buttonBgColor(e) {
			l(e), L();
		},
		get buttonBgColorHover() {
			return u();
		},
		set buttonBgColorHover(e) {
			u(e), L();
		},
		get buttonColor() {
			return d();
		},
		set buttonColor(e) {
			d(e), L();
		},
		get buttonColorHover() {
			return f();
		},
		set buttonColorHover(e) {
			f(e), L();
		},
		get buttonBorderColor() {
			return p();
		},
		set buttonBorderColor(e) {
			p(e), L();
		},
		get fitViewOptions() {
			return m();
		},
		set fitViewOptions(e) {
			m(e), L();
		},
		get children() {
			return h();
		},
		set children(e) {
			h(e), L();
		},
		get before() {
			return g();
		},
		set before(e) {
			g(e), L();
		},
		get after() {
			return _();
		},
		set after(e) {
			_(e), L();
		}
	};
	{
		let t = /* @__PURE__ */ F(() => [
			"svelte-flow__controls",
			K(T),
			c()
		]);
		Hh(e, Aa({
			get class() {
				return K(t);
			},
			get position() {
				return n();
			},
			"data-testid": "svelte-flow__controls",
			get "aria-label"() {
				return K(w)["controls.ariaLabel"];
			},
			get style() {
				return s();
			}
		}, () => v, {
			children: (e, t) => {
				var n = mg(), r = V(n), s = (e) => {
					var t = qr();
					mi(V(t), g), J(e, t);
				};
				Y(r, (e) => {
					g() && e(s);
				});
				var c = H(r, 2), l = (e) => {
					var t = pg(), n = V(t);
					tg(n, Aa({
						onclick: E,
						class: "svelte-flow__controls-zoomin",
						get title() {
							return K(w)["controls.zoomIn.ariaLabel"];
						},
						get "aria-label"() {
							return K(w)["controls.zoomIn.ariaLabel"];
						},
						get disabled() {
							return K(C);
						}
					}, () => K(b), {
						children: (e, t) => {
							rg(e, {});
						},
						$$slots: { default: !0 }
					})), tg(H(n, 2), Aa({
						onclick: D,
						class: "svelte-flow__controls-zoomout",
						get title() {
							return K(w)["controls.zoomOut.ariaLabel"];
						},
						get "aria-label"() {
							return K(w)["controls.zoomOut.ariaLabel"];
						},
						get disabled() {
							return K(S);
						}
					}, () => K(b), {
						children: (e, t) => {
							ag(e, {});
						},
						$$slots: { default: !0 }
					})), J(e, t);
				};
				Y(c, (e) => {
					i() && e(l);
				});
				var u = H(c, 2), d = (e) => {
					tg(e, Aa({
						class: "svelte-flow__controls-fitview",
						onclick: ee,
						get title() {
							return K(w)["controls.fitView.ariaLabel"];
						},
						get "aria-label"() {
							return K(w)["controls.fitView.ariaLabel"];
						}
					}, () => K(b), {
						children: (e, t) => {
							sg(e, {});
						},
						$$slots: { default: !0 }
					}));
				};
				Y(u, (e) => {
					a() && e(d);
				});
				var f = H(u, 2), p = (e) => {
					tg(e, Aa({
						class: "svelte-flow__controls-interactive",
						onclick: te,
						get title() {
							return K(w)["controls.interactive.ariaLabel"];
						},
						get "aria-label"() {
							return K(w)["controls.interactive.ariaLabel"];
						}
					}, () => K(b), {
						children: (e, t) => {
							var n = qr(), r = V(n), i = (e) => {
								dg(e, {});
							}, a = (e) => {
								lg(e, {});
							};
							Y(r, (e) => {
								K(x) ? e(i) : e(a, -1);
							}), J(e, n);
						},
						$$slots: { default: !0 }
					}));
				};
				Y(f, (e) => {
					o() && e(p);
				});
				var m = H(f, 2), v = (e) => {
					var t = qr();
					mi(V(t), h), J(e, t);
				};
				Y(m, (e) => {
					h() && e(v);
				});
				var y = H(m, 2), T = (e) => {
					var t = qr();
					mi(V(t), _), J(e, t);
				};
				Y(y, (e) => {
					_() && e(T);
				}), J(e, n);
			},
			$$slots: { default: !0 }
		}));
	}
	return P(ne);
}
Q(hg, {
	position: {},
	orientation: {},
	showZoom: {},
	showFitView: {},
	showLock: {},
	style: {},
	class: {},
	buttonBgColor: {},
	buttonBgColorHover: {},
	buttonColor: {},
	buttonColorHover: {},
	buttonBorderColor: {},
	fitViewOptions: {},
	children: {},
	before: {},
	after: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/types.js
var gg;
(function(e) {
	e.Lines = "lines", e.Dots = "dots", e.Cross = "cross";
})(gg ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/DotPattern.svelte
var _g = /* @__PURE__ */ Gr("<circle></circle>");
function vg(e, t) {
	N(t, !0);
	let n = Z(t, "radius", 7), r = Z(t, "class", 7);
	var i = {
		get radius() {
			return n();
		},
		set radius(e) {
			n(e), L();
		},
		get class() {
			return r();
		},
		set class(e) {
			r(e), L();
		}
	}, a = _g();
	return U(() => {
		X(a, "cx", n()), X(a, "cy", n()), X(a, "r", n()), Hi(a, 0, Ii([
			"svelte-flow__background-pattern",
			"dots",
			r()
		]));
	}), J(e, a), P(i);
}
Q(vg, {
	radius: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/LinePattern.svelte
var yg = /* @__PURE__ */ Gr("<path></path>");
function bg(e, t) {
	N(t, !0);
	let n = Z(t, "lineWidth", 7), r = Z(t, "dimensions", 7), i = Z(t, "variant", 7), a = Z(t, "class", 7);
	var o = {
		get lineWidth() {
			return n();
		},
		set lineWidth(e) {
			n(e), L();
		},
		get dimensions() {
			return r();
		},
		set dimensions(e) {
			r(e), L();
		},
		get variant() {
			return i();
		},
		set variant(e) {
			i(e), L();
		},
		get class() {
			return a();
		},
		set class(e) {
			a(e), L();
		}
	}, s = yg();
	return U(() => {
		X(s, "stroke-width", n()), X(s, "d", `M${r()[0] / 2} 0 V${r()[1]} M0 ${r()[1] / 2} H${r()[0]}`), Hi(s, 0, Ii([
			"svelte-flow__background-pattern",
			i(),
			a()
		]));
	}), J(e, s), P(o);
}
Q(bg, {
	lineWidth: {},
	dimensions: {},
	variant: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/Background.svelte
var xg = {
	[gg.Dots]: 1,
	[gg.Lines]: 1,
	[gg.Cross]: 6
}, Sg = /* @__PURE__ */ Gr("<svg data-testid=\"svelte-flow__background\"><pattern patternUnits=\"userSpaceOnUse\"><!></pattern><rect x=\"0\" y=\"0\" width=\"100%\" height=\"100%\"></rect></svg>");
function Cg(e, t) {
	N(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "variant", 23, () => gg.Dots), i = Z(t, "gap", 7, 20), a = Z(t, "size", 7), o = Z(t, "lineWidth", 7, 1), s = Z(t, "bgColor", 7), c = Z(t, "patternColor", 7), l = Z(t, "patternClass", 7), u = Z(t, "class", 7), d = /* @__PURE__ */ F(Gm), f = /* @__PURE__ */ F(() => r() === gg.Dots), p = /* @__PURE__ */ F(() => r() === gg.Cross), m = /* @__PURE__ */ F(() => Array.isArray(i()) ? i() : [i(), i()]), h = /* @__PURE__ */ F(() => `background-pattern-${K(d).flowId}-${n() ?? ""}`), g = /* @__PURE__ */ F(() => [K(m)[0] * K(d).viewport.zoom || 1, K(m)[1] * K(d).viewport.zoom || 1]), _ = /* @__PURE__ */ F(() => (a() ?? xg[r()]) * K(d).viewport.zoom), v = /* @__PURE__ */ F(() => K(p) ? [K(_), K(_)] : K(g)), y = /* @__PURE__ */ F(() => K(f) ? [K(_) / 2, K(_) / 2] : [K(v)[0] / 2, K(v)[1] / 2]);
	var b = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), L();
		},
		get variant() {
			return r();
		},
		set variant(e = gg.Dots) {
			r(e), L();
		},
		get gap() {
			return i();
		},
		set gap(e = 20) {
			i(e), L();
		},
		get size() {
			return a();
		},
		set size(e) {
			a(e), L();
		},
		get lineWidth() {
			return o();
		},
		set lineWidth(e = 1) {
			o(e), L();
		},
		get bgColor() {
			return s();
		},
		set bgColor(e) {
			s(e), L();
		},
		get patternColor() {
			return c();
		},
		set patternColor(e) {
			c(e), L();
		},
		get patternClass() {
			return l();
		},
		set patternClass(e) {
			l(e), L();
		},
		get class() {
			return u();
		},
		set class(e) {
			u(e), L();
		}
	}, x = Sg();
	let S;
	var C = B(x), w = B(C), T = (e) => {
		{
			let t = /* @__PURE__ */ F(() => K(_) / 2);
			vg(e, {
				get radius() {
					return K(t);
				},
				get class() {
					return l();
				}
			});
		}
	}, E = (e) => {
		bg(e, {
			get dimensions() {
				return K(v);
			},
			get variant() {
				return r();
			},
			get lineWidth() {
				return o();
			},
			get class() {
				return l();
			}
		});
	};
	Y(w, (e) => {
		K(f) ? e(T) : e(E, -1);
	}), M(C);
	var D = H(C);
	return M(x), U(() => {
		Hi(x, 0, Ii([
			"svelte-flow__background",
			"svelte-flow__container",
			u()
		])), S = Wi(x, "", S, {
			"--xy-background-color-props": s(),
			"--xy-background-pattern-color-props": c()
		}), X(C, "id", K(h)), X(C, "x", K(d).viewport.x % K(g)[0]), X(C, "y", K(d).viewport.y % K(g)[1]), X(C, "width", K(g)[0]), X(C, "height", K(g)[1]), X(C, "patternTransform", `translate(-${K(y)[0]},-${K(y)[1]})`), X(D, "fill", `url(#${K(h)})`);
	}), J(e, x), P(b);
}
Q(Cg, {
	id: {},
	variant: {},
	gap: {},
	size: {},
	lineWidth: {},
	bgColor: {},
	patternColor: {},
	patternClass: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useInternalNode.svelte.js
function wg(e) {
	let t = /* @__PURE__ */ F(Gm), n = /* @__PURE__ */ F(() => K(t).nodeLookup), r = /* @__PURE__ */ F(() => K(t).nodes), i = /* @__PURE__ */ F(() => (K(r), K(n).get(e)));
	return { get current() {
		return K(i);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/MinimapNode.svelte
var Tg = /* @__PURE__ */ Gr("<rect></rect>");
function Eg(e, t) {
	N(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "x", 7), i = Z(t, "y", 7), a = Z(t, "width", 7), o = Z(t, "height", 7), s = Z(t, "borderRadius", 7, 5), c = Z(t, "color", 7), l = Z(t, "shapeRendering", 7), u = Z(t, "strokeColor", 7), d = Z(t, "strokeWidth", 7, 2), f = Z(t, "selected", 7), p = Z(t, "class", 7), m = Z(t, "nodeComponent", 7), h = /* @__PURE__ */ F(() => wg(n())), g = /* @__PURE__ */ F(() => {
		if (!K(h).current) return {
			width: 0,
			height: 0,
			x: 0,
			y: 0
		};
		let { width: e, height: t } = mf(K(h).current);
		return {
			width: a() ?? e,
			height: o() ?? t,
			x: r() ?? K(h).current.internals.positionAbsolute.x,
			y: i() ?? K(h).current.internals.positionAbsolute.y
		};
	}), _ = /* @__PURE__ */ F(() => K(g).width), v = /* @__PURE__ */ F(() => K(g).height), y = /* @__PURE__ */ F(() => K(g).x), b = /* @__PURE__ */ F(() => K(g).y);
	var x = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), L();
		},
		get x() {
			return r();
		},
		set x(e) {
			r(e), L();
		},
		get y() {
			return i();
		},
		set y(e) {
			i(e), L();
		},
		get width() {
			return a();
		},
		set width(e) {
			a(e), L();
		},
		get height() {
			return o();
		},
		set height(e) {
			o(e), L();
		},
		get borderRadius() {
			return s();
		},
		set borderRadius(e = 5) {
			s(e), L();
		},
		get color() {
			return c();
		},
		set color(e) {
			c(e), L();
		},
		get shapeRendering() {
			return l();
		},
		set shapeRendering(e) {
			l(e), L();
		},
		get strokeColor() {
			return u();
		},
		set strokeColor(e) {
			u(e), L();
		},
		get strokeWidth() {
			return d();
		},
		set strokeWidth(e = 2) {
			d(e), L();
		},
		get selected() {
			return f();
		},
		set selected(e) {
			f(e), L();
		},
		get class() {
			return p();
		},
		set class(e) {
			p(e), L();
		},
		get nodeComponent() {
			return m();
		},
		set nodeComponent(e) {
			m(e), L();
		}
	}, S = qr(), C = V(S), w = (e) => {
		let t = /* @__PURE__ */ F(m);
		var r = qr();
		Ai(V(r), () => K(t), (e, t) => {
			t(e, {
				get id() {
					return n();
				},
				get x() {
					return K(y);
				},
				get y() {
					return K(b);
				},
				get width() {
					return K(_);
				},
				get height() {
					return K(v);
				},
				get borderRadius() {
					return s();
				},
				get class() {
					return p();
				},
				get color() {
					return c();
				},
				get shapeRendering() {
					return l();
				},
				get strokeColor() {
					return u();
				},
				get strokeWidth() {
					return d();
				},
				get selected() {
					return f();
				}
			});
		}), J(e, r);
	}, T = (e) => {
		var t = Tg();
		let n, r;
		U(() => {
			n = Hi(t, 0, Ii(["svelte-flow__minimap-node", p()]), null, n, { selected: f() }), X(t, "x", K(y)), X(t, "y", K(b)), X(t, "rx", s()), X(t, "ry", s()), X(t, "width", K(_)), X(t, "height", K(v)), X(t, "shape-rendering", l()), r = Wi(t, "", r, {
				fill: c(),
				stroke: u(),
				"stroke-width": d()
			});
		}), J(e, t);
	};
	return Y(C, (e) => {
		m() ? e(w) : e(T, -1);
	}), J(e, S), P(x);
}
Q(Eg, {
	id: {},
	x: {},
	y: {},
	width: {},
	height: {},
	borderRadius: {},
	color: {},
	shapeRendering: {},
	strokeColor: {},
	strokeWidth: {},
	selected: {},
	class: {},
	nodeComponent: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/interactive.js
function Dg(e, t) {
	let n = Np({
		domNode: e,
		panZoom: t.panZoom,
		getTransform: () => {
			let { viewport: e } = t.store;
			return [
				e.x,
				e.y,
				e.zoom
			];
		},
		getViewScale: t.getViewScale
	});
	n.update({
		translateExtent: t.translateExtent,
		width: t.width,
		height: t.height,
		inversePan: t.inversePan,
		zoomStep: t.zoomStep,
		pannable: t.pannable,
		zoomable: t.zoomable
	});
	function r(e) {
		n.update({
			translateExtent: e.translateExtent,
			width: e.width,
			height: e.height,
			inversePan: e.inversePan,
			zoomStep: e.zoomStep,
			pannable: e.pannable,
			zoomable: e.zoomable
		});
	}
	return {
		update: r,
		destroy() {
			n.destroy();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/Minimap.svelte
var Og = (e) => e instanceof Function ? e : () => e, kg = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"position",
	"ariaLabel",
	"nodeStrokeColor",
	"nodeColor",
	"nodeClass",
	"nodeBorderRadius",
	"nodeStrokeWidth",
	"nodeComponent",
	"bgColor",
	"maskColor",
	"maskStrokeColor",
	"maskStrokeWidth",
	"width",
	"height",
	"pannable",
	"zoomable",
	"inversePan",
	"zoomStep",
	"class"
]), Ag = /* @__PURE__ */ Gr("<title> </title>"), jg = /* @__PURE__ */ Gr("<svg class=\"svelte-flow__minimap-svg\" role=\"img\"><!><!><path class=\"svelte-flow__minimap-mask\" fill-rule=\"evenodd\" pointer-events=\"none\"></path></svg>"), Mg = /* @__PURE__ */ q("<svelte-css-wrapper style=\"display: contents\"><!></svelte-css-wrapper>", 1);
function Ng(e, t) {
	N(t, !0);
	let n = Z(t, "position", 7, "bottom-right"), r = Z(t, "ariaLabel", 7), i = Z(t, "nodeStrokeColor", 7, "transparent"), a = Z(t, "nodeColor", 7), o = Z(t, "nodeClass", 7, ""), s = Z(t, "nodeBorderRadius", 7, 5), c = Z(t, "nodeStrokeWidth", 7, 2), l = Z(t, "nodeComponent", 7), u = Z(t, "bgColor", 7), d = Z(t, "maskColor", 7), f = Z(t, "maskStrokeColor", 7), p = Z(t, "maskStrokeWidth", 7), m = Z(t, "width", 7, 200), h = Z(t, "height", 7, 150), g = Z(t, "pannable", 7, !0), _ = Z(t, "zoomable", 7, !0), v = Z(t, "inversePan", 7), y = Z(t, "zoomStep", 7), b = Z(t, "class", 7), x = /* @__PURE__ */ Oa(t, kg), S = /* @__PURE__ */ F(Gm), C = /* @__PURE__ */ F(() => K(S).ariaLabelConfig), w = typeof window > "u" || window.chrome ? "crispEdges" : "geometricPrecision", T = /* @__PURE__ */ F(() => `svelte-flow__minimap-desc-${K(S).flowId}`), E = /* @__PURE__ */ F(() => ({
		x: -K(S).viewport.x / K(S).viewport.zoom,
		y: -K(S).viewport.y / K(S).viewport.zoom,
		width: K(S).width / K(S).viewport.zoom,
		height: K(S).height / K(S).viewport.zoom
	})), D = /* @__PURE__ */ F(() => K(S).nodes.some((e) => !e.hidden)), ee = /* @__PURE__ */ F(() => K(D) ? Qd(Fd(K(S).nodeLookup, { filter: (e) => !e.hidden }), K(E)) : K(E)), te = /* @__PURE__ */ F(() => K(ee).width / m()), ne = /* @__PURE__ */ F(() => K(ee).height / h()), re = /* @__PURE__ */ F(() => Math.max(K(te), K(ne))), ie = /* @__PURE__ */ F(() => K(re) * m()), ae = /* @__PURE__ */ F(() => K(re) * h()), O = /* @__PURE__ */ F(() => 5 * K(re)), k = /* @__PURE__ */ F(() => K(ee).x - (K(ie) - K(ee).width) / 2 - K(O)), oe = /* @__PURE__ */ F(() => K(ee).y - (K(ae) - K(ee).height) / 2 - K(O)), se = /* @__PURE__ */ F(() => K(ie) + K(O) * 2), ce = /* @__PURE__ */ F(() => K(ae) + K(O) * 2), le = () => K(re);
	var ue = {
		get position() {
			return n();
		},
		set position(e = "bottom-right") {
			n(e), L();
		},
		get ariaLabel() {
			return r();
		},
		set ariaLabel(e) {
			r(e), L();
		},
		get nodeStrokeColor() {
			return i();
		},
		set nodeStrokeColor(e = "transparent") {
			i(e), L();
		},
		get nodeColor() {
			return a();
		},
		set nodeColor(e) {
			a(e), L();
		},
		get nodeClass() {
			return o();
		},
		set nodeClass(e = "") {
			o(e), L();
		},
		get nodeBorderRadius() {
			return s();
		},
		set nodeBorderRadius(e = 5) {
			s(e), L();
		},
		get nodeStrokeWidth() {
			return c();
		},
		set nodeStrokeWidth(e = 2) {
			c(e), L();
		},
		get nodeComponent() {
			return l();
		},
		set nodeComponent(e) {
			l(e), L();
		},
		get bgColor() {
			return u();
		},
		set bgColor(e) {
			u(e), L();
		},
		get maskColor() {
			return d();
		},
		set maskColor(e) {
			d(e), L();
		},
		get maskStrokeColor() {
			return f();
		},
		set maskStrokeColor(e) {
			f(e), L();
		},
		get maskStrokeWidth() {
			return p();
		},
		set maskStrokeWidth(e) {
			p(e), L();
		},
		get width() {
			return m();
		},
		set width(e = 200) {
			m(e), L();
		},
		get height() {
			return h();
		},
		set height(e = 150) {
			h(e), L();
		},
		get pannable() {
			return g();
		},
		set pannable(e = !0) {
			g(e), L();
		},
		get zoomable() {
			return _();
		},
		set zoomable(e = !0) {
			_(e), L();
		},
		get inversePan() {
			return v();
		},
		set inversePan(e) {
			v(e), L();
		},
		get zoomStep() {
			return y();
		},
		set zoomStep(e) {
			y(e), L();
		},
		get class() {
			return b();
		},
		set class(e) {
			b(e), L();
		}
	}, de = Mg(), fe = V(de);
	{
		let e = /* @__PURE__ */ F(() => ["svelte-flow__minimap", b()]);
		bi(fe, () => ({ "--xy-minimap-background-color-props": u() })), Hh(fe.lastChild, Aa({
			get position() {
				return n();
			},
			get class() {
				return K(e);
			},
			"data-testid": "svelte-flow__minimap"
		}, () => x, {
			children: (e, t) => {
				var n = qr(), u = V(n), b = (e) => {
					var t = jg();
					let n;
					var u = B(t), b = (e) => {
						var t = Ag(), n = vn(t, !0);
						U(() => {
							X(t, "id", K(T)), oi(n, r() ?? K(C)["minimap.ariaLabel"]);
						}), J(e, t);
					};
					Y(u, (e) => {
						(r() ?? K(C)["minimap.ariaLabel"]) && e(b);
					});
					var x = H(u);
					wi(x, 17, () => K(S).nodes, (e) => e.id, (e, t) => {
						let n = /* @__PURE__ */ F(() => K(S).nodeLookup.get(K(t).id));
						var r = qr(), u = V(r), d = (e) => {
							{
								let r = /* @__PURE__ */ F(() => a() === void 0 ? void 0 : Og(a())(K(t))), u = /* @__PURE__ */ F(() => Og(i())(K(t))), d = /* @__PURE__ */ F(() => Og(o())(K(t)));
								Eg(e, {
									get id() {
										return K(n).id;
									},
									get selected() {
										return K(n).selected;
									},
									get nodeComponent() {
										return l();
									},
									get color() {
										return K(r);
									},
									get borderRadius() {
										return s();
									},
									get strokeColor() {
										return K(u);
									},
									get strokeWidth() {
										return c();
									},
									get shapeRendering() {
										return w;
									},
									get class() {
										return K(d);
									}
								});
							}
						}, f = /* @__PURE__ */ F(() => K(n) && hf(K(n)) && !K(n).hidden);
						Y(u, (e) => {
							K(f) && e(d);
						}), J(e, r);
					});
					var D = H(x);
					M(t), Mi(t, (e, t) => Dg?.(e, t), () => ({
						store: K(S),
						panZoom: K(S).panZoom,
						getViewScale: le,
						translateExtent: K(S).translateExtent,
						width: K(S).width,
						height: K(S).height,
						inversePan: v(),
						zoomStep: y(),
						pannable: g(),
						zoomable: _()
					})), U(() => {
						X(t, "width", m()), X(t, "height", h()), X(t, "viewBox", `${K(k) ?? ""} ${K(oe) ?? ""} ${K(se) ?? ""} ${K(ce) ?? ""}`), X(t, "aria-labelledby", K(T)), n = Wi(t, "", n, {
							"--xy-minimap-mask-background-color-props": d(),
							"--xy-minimap-mask-stroke-color-props": f(),
							"--xy-minimap-mask-stroke-width-props": p() ? p() * K(re) : void 0
						}), X(D, "d", `M${K(k) - K(O)},${K(oe) - K(O)}h${K(se) + K(O) * 2}v${K(ce) + K(O) * 2}h${-K(se) - K(O) * 2}z
      M${K(E).x ?? ""},${K(E).y ?? ""}h${K(E).width ?? ""}v${K(E).height ?? ""}h${-K(E).width}z`);
					}), J(e, t);
				};
				Y(u, (e) => {
					K(S).panZoom && e(b);
				}), J(e, n);
			},
			$$slots: { default: !0 }
		})), M(fe);
	}
	return J(e, de), P(ue);
}
Q(Ng, {
	position: {},
	ariaLabel: {},
	nodeStrokeColor: {},
	nodeColor: {},
	nodeClass: {},
	nodeBorderRadius: {},
	nodeStrokeWidth: {},
	nodeComponent: {},
	bgColor: {},
	maskColor: {},
	maskStrokeColor: {},
	maskStrokeWidth: {},
	width: {},
	height: {},
	pannable: {},
	zoomable: {},
	inversePan: {},
	zoomStep: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/nodeConfig.ts
var Pg = {
	Codergen: {
		icon: "LLM",
		title: "Codergen",
		theme: "blue",
		paletteGroup: "pipeline-steps",
		description: "Runs an AI coding agent from a prompt to generate or modify code."
	},
	Tool: {
		icon: "TL",
		title: "Tool",
		theme: "green",
		paletteGroup: "pipeline-steps",
		description: "Runs a registered tool (render/capture, lint, critique, etc.) against the working directory."
	},
	Manager: {
		icon: "MGR",
		title: "Manager",
		theme: "orange",
		paletteGroup: "pipeline-steps",
		description: "Delegates a coordination task to an AI agent."
	},
	Interviewer: {
		icon: "?",
		title: "Human Gate",
		theme: "orange",
		paletteGroup: "control-flow",
		description: "Pauses for human input -- asks a question, optionally with a gallery of candidates to pick from."
	},
	Conditional: {
		icon: "IF",
		title: "Conditional",
		theme: "orange",
		paletteGroup: "control-flow",
		description: "Branches the pipeline based on a condition evaluated against the current context."
	},
	SubPipeline: {
		icon: "SUB",
		title: "Sub-Pipeline",
		theme: "green",
		paletteGroup: "control-flow",
		description: "Runs another workflow file as a nested sub-pipeline."
	},
	Start: {
		icon: "▶",
		title: "Start",
		theme: "green",
		paletteGroup: "structural",
		description: "The pipeline's single entry point."
	},
	Exit: {
		icon: "■",
		title: "Exit",
		theme: "red",
		paletteGroup: "structural",
		description: "A pipeline exit point."
	},
	Parallel: {
		icon: "⑂",
		title: "Parallel",
		theme: "blue",
		paletteGroup: "structural",
		description: "Runs its downstream branches concurrently."
	},
	FanIn: {
		icon: "⑃",
		title: "Fan-In",
		theme: "blue",
		paletteGroup: "structural",
		description: "Waits for concurrent branches to finish before continuing."
	}
}, Fg = {
	blue: {
		bg: "#e0edff",
		border: "#3b82f6"
	},
	green: {
		bg: "#e3f9e5",
		border: "#22c55e"
	},
	orange: {
		bg: "#fff4e0",
		border: "#f97316"
	},
	red: {
		bg: "#fde8e8",
		border: "#ef4444"
	}
};
function Ig(e) {
	let t = Pg[e];
	if (!t) return;
	let { bg: n, border: r } = Fg[t.theme];
	return `background-color: ${n}; border-color: ${r};`;
}
var Lg = [
	{
		id: "pipeline-steps",
		label: "Pipeline Steps",
		collapsible: !0,
		kinds: [
			"Codergen",
			"Tool",
			"Manager"
		]
	},
	{
		id: "control-flow",
		label: "Control Flow",
		collapsible: !0,
		kinds: [
			"Interviewer",
			"Conditional",
			"SubPipeline"
		]
	},
	{
		id: "structural",
		label: "Structural",
		collapsible: !1,
		kinds: [
			"Start",
			"Exit",
			"Parallel",
			"FanIn"
		]
	}
], Rg = "application/x-workflow-node-type", zg = /* @__PURE__ */ q("<button type=\"button\" class=\"palette-group-header svelte-5mstgu\"><span class=\"palette-group-caret\" aria-hidden=\"true\"> </span> </button>"), Bg = /* @__PURE__ */ q("<h3 class=\"palette-group-header palette-group-header-static svelte-5mstgu\"> </h3>"), Vg = /* @__PURE__ */ q("<div class=\"palette-entry svelte-5mstgu\" draggable=\"true\" role=\"listitem\"><span class=\"palette-entry-icon svelte-5mstgu\" aria-hidden=\"true\"> </span> <span class=\"palette-entry-title svelte-5mstgu\"> </span></div>"), Hg = /* @__PURE__ */ q("<div class=\"palette-group-entries svelte-5mstgu\"></div>"), Ug = /* @__PURE__ */ q("<section class=\"palette-group svelte-5mstgu\"><!> <!></section>"), Wg = /* @__PURE__ */ q("<aside class=\"workflow-palette svelte-5mstgu\" data-testid=\"palette\"></aside>"), Gg = {
	hash: "svelte-5mstgu",
	code: ".workflow-palette.svelte-5mstgu {width:200px;flex:0 0 200px;overflow-y:auto;border-right:1px solid #e2e8f0;padding:0.5rem;box-sizing:border-box;font-size:0.85rem;}.palette-group.svelte-5mstgu {margin-bottom:0.75rem;}.palette-group-header.svelte-5mstgu {display:flex;align-items:center;gap:0.35rem;width:100%;background:none;border:none;font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.03em;color:#475569;cursor:pointer;padding:0.25rem 0;text-align:left;}.palette-group-header-static.svelte-5mstgu {cursor:default;margin:0;}.palette-group-entries.svelte-5mstgu {display:flex;flex-direction:column;gap:0.35rem;margin-top:0.35rem;}.palette-entry.svelte-5mstgu {display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.5rem;border:1px solid var(--palette-entry-color, #94a3b8);background:var(--palette-entry-bg, #f8fafc);border-radius:6px;cursor:grab;}.palette-entry.svelte-5mstgu:active {cursor:grabbing;}.palette-entry-icon.svelte-5mstgu {display:inline-flex;align-items:center;justify-content:center;min-width:1.75rem;height:1.5rem;padding:0 0.25rem;border-radius:4px;background:var(--palette-entry-color, #94a3b8);color:white;font-size:0.7rem;font-weight:700;}.palette-entry-title.svelte-5mstgu {color:#1e293b;}"
};
function Kg(e, t) {
	N(t, !0), ji(e, Gg);
	let n = /* @__PURE__ */ R(sn({
		"pipeline-steps": !0,
		"control-flow": !0,
		structural: !0
	}));
	function r(e) {
		K(n)[e] = !K(n)[e];
	}
	function i(e, t) {
		e.dataTransfer?.setData(Rg, t), e.dataTransfer && (e.dataTransfer.effectAllowed = "move");
	}
	var a = Wg();
	wi(a, 21, () => Lg, (e) => e.id, (e, t) => {
		var a = Ug(), o = B(a), s = (e) => {
			var i = zg(), a = B(i), o = vn(a, !0), s = H(a);
			M(i), U(() => {
				X(i, "data-testid", `palette-group-toggle-${K(t).id}`), X(i, "aria-expanded", K(n)[K(t).id]), oi(o, K(n)[K(t).id] ? "▾" : "▸"), oi(s, ` ${K(t).label ?? ""}`);
			}), Fr("click", i, () => r(K(t).id)), J(e, i);
		}, c = (e) => {
			var n = Bg(), r = vn(n, !0);
			U(() => oi(r, K(t).label)), J(e, n);
		};
		Y(o, (e) => {
			K(t).collapsible ? e(s) : e(c, -1);
		});
		var l = H(o, 2), u = (e) => {
			var n = Hg();
			wi(n, 20, () => K(t).kinds, (e) => e, (e, t) => {
				let n = /* @__PURE__ */ F(() => Pg[t]);
				var r = Vg(), a = B(r), o = vn(a, !0), s = vn(H(a, 2), !0);
				M(r), U(() => {
					X(r, "data-testid", `palette-entry-${t}`), X(r, "title", K(n).description), Wi(r, `--palette-entry-color: ${Fg[K(n).theme].border}; --palette-entry-bg: ${Fg[K(n).theme].bg};`), oi(o, K(n).icon), oi(s, K(n).title);
				}), Pr("dragstart", r, (e) => i(e, t)), J(e, r);
			}), M(n), J(e, n);
		};
		Y(l, (e) => {
			(!K(t).collapsible || K(n)[K(t).id]) && e(u);
		}), M(a), U(() => X(a, "data-testid", `palette-group-${K(t).id}`)), J(e, a);
	}), M(a), J(e, a), P();
}
Ir(["click"]), Q(Kg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@dagrejs/dagre/dist/dagre.esm.js
var qg = Object.defineProperty, Jg = (e, t, n) => t in e ? qg(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, Yg = (e, t) => {
	for (var n in t) qg(e, n, {
		get: t[n],
		enumerable: !0
	});
}, Xg = (e, t, n) => Jg(e, typeof t == "symbol" ? t : t + "", n), Zg = {};
Yg(Zg, {
	Graph: () => I_,
	alg: () => u_
});
var Qg = Object.defineProperty, $g = (e, t) => {
	for (var n in t) Qg(e, n, {
		get: t[n],
		enumerable: !0
	});
}, e_ = class {
	constructor(e) {
		this._isDirected = !0, this._isMultigraph = !1, this._isCompound = !1, this._nodes = {}, this._in = {}, this._preds = {}, this._out = {}, this._sucs = {}, this._edgeObjs = {}, this._edgeLabels = {}, this._nodeCount = 0, this._edgeCount = 0, this._defaultNodeLabelFn = () => {}, this._defaultEdgeLabelFn = () => {}, e && (this._isDirected = "directed" in e ? e.directed : !0, this._isMultigraph = "multigraph" in e && e.multigraph, this._isCompound = "compound" in e && e.compound), this._isCompound && (this._parent = {}, this._children = {}, this._children["\0"] = {});
	}
	isDirected() {
		return this._isDirected;
	}
	isMultigraph() {
		return this._isMultigraph;
	}
	isCompound() {
		return this._isCompound;
	}
	setGraph(e) {
		return this._label = e, this;
	}
	graph() {
		return this._label;
	}
	setDefaultNodeLabel(e) {
		return this._defaultNodeLabelFn = typeof e == "function" ? e : () => e, this;
	}
	nodeCount() {
		return this._nodeCount;
	}
	nodes() {
		return Object.keys(this._nodes);
	}
	sources() {
		return this.nodes().filter((e) => Object.keys(this._in[e]).length === 0);
	}
	sinks() {
		return this.nodes().filter((e) => Object.keys(this._out[e]).length === 0);
	}
	setNodes(e, t) {
		return e.forEach((e) => {
			t === void 0 ? this.setNode(e) : this.setNode(e, t);
		}), this;
	}
	setNode(e, t) {
		return e in this._nodes ? (arguments.length > 1 && (this._nodes[e] = t), this) : (this._nodes[e] = arguments.length > 1 ? t : this._defaultNodeLabelFn(e), this._isCompound && (this._parent[e] = "\0", this._children[e] = {}, this._children["\0"][e] = !0), this._in[e] = {}, this._preds[e] = {}, this._out[e] = {}, this._sucs[e] = {}, ++this._nodeCount, this);
	}
	node(e) {
		return this._nodes[e];
	}
	hasNode(e) {
		return e in this._nodes;
	}
	removeNode(e) {
		if (e in this._nodes) {
			let t = (e) => this.removeEdge(this._edgeObjs[e]);
			delete this._nodes[e], this._isCompound && (this._removeFromParentsChildList(e), delete this._parent[e], this.children(e).forEach((e) => {
				this.setParent(e);
			}), delete this._children[e]), Object.keys(this._in[e]).forEach(t), delete this._in[e], delete this._preds[e], Object.keys(this._out[e]).forEach(t), delete this._out[e], delete this._sucs[e], --this._nodeCount;
		}
		return this;
	}
	setParent(e, t) {
		if (!this._isCompound) throw Error("Cannot set parent in a non-compound graph");
		if (t === void 0) t = "\0";
		else {
			t += "";
			for (let n = t; n !== void 0; n = this.parent(n)) if (n === e) throw Error("Setting " + t + " as parent of " + e + " would create a cycle");
			this.setNode(t);
		}
		return this.setNode(e), this._removeFromParentsChildList(e), this._parent[e] = t, this._children[t][e] = !0, this;
	}
	parent(e) {
		if (this._isCompound) {
			let t = this._parent[e];
			if (t !== "\0") return t;
		}
	}
	children(e = "\0") {
		if (this._isCompound) {
			let t = this._children[e];
			if (t) return Object.keys(t);
		} else {
			if (e === "\0") return this.nodes();
			if (this.hasNode(e)) return [];
		}
		return [];
	}
	predecessors(e) {
		let t = this._preds[e];
		if (t) return Object.keys(t);
	}
	successors(e) {
		let t = this._sucs[e];
		if (t) return Object.keys(t);
	}
	neighbors(e) {
		let t = this.predecessors(e);
		if (t) {
			let n = new Set(t), r = this.successors(e);
			if (r) for (let e of r) n.add(e);
			return Array.from(n.values());
		}
	}
	isLeaf(e) {
		let t;
		return t = this.isDirected() ? this.successors(e) : this.neighbors(e), (t?.length ?? 0) === 0;
	}
	filterNodes(e) {
		let t = new this.constructor({
			directed: this._isDirected,
			multigraph: this._isMultigraph,
			compound: this._isCompound
		});
		t.setGraph(this.graph()), Object.entries(this._nodes).forEach(([n, r]) => {
			e(n) && t.setNode(n, r);
		}), Object.values(this._edgeObjs).forEach((e) => {
			t.hasNode(e.v) && t.hasNode(e.w) && t.setEdge(e, this.edge(e));
		});
		let n = {}, r = (e) => {
			let i = this.parent(e);
			return !i || t.hasNode(i) ? (n[e] = i, i) : i in n ? n[i] : r(i);
		};
		return this._isCompound && t.nodes().forEach((e) => t.setParent(e, r(e))), t;
	}
	setDefaultEdgeLabel(e) {
		return this._defaultEdgeLabelFn = typeof e == "function" ? e : () => e, this;
	}
	edgeCount() {
		return this._edgeCount;
	}
	edges() {
		return Object.values(this._edgeObjs);
	}
	setPath(e, t) {
		return e.reduce((e, n) => (t === void 0 ? this.setEdge(e, n) : this.setEdge(e, n, t), n)), this;
	}
	setEdge(e, t, n, r) {
		let i, a, o, s, c = !1;
		typeof e == "object" && e && "v" in e ? (i = e.v, a = e.w, o = e.name, arguments.length === 2 && (s = t, c = !0)) : (i = e, a = t, o = r, arguments.length > 2 && (s = n, c = !0)), i = "" + i, a = "" + a, o !== void 0 && (o = "" + o);
		let l = r_(this._isDirected, i, a, o);
		if (l in this._edgeLabels) return c && (this._edgeLabels[l] = s), this;
		if (o !== void 0 && !this._isMultigraph) throw Error("Cannot set a named edge when isMultigraph = false");
		this.setNode(i), this.setNode(a), this._edgeLabels[l] = c ? s : this._defaultEdgeLabelFn(i, a, o);
		let u = i_(this._isDirected, i, a, o);
		return i = u.v, a = u.w, Object.freeze(u), this._edgeObjs[l] = u, t_(this._preds[a], i), t_(this._sucs[i], a), this._in[a][l] = u, this._out[i][l] = u, this._edgeCount++, this;
	}
	edge(e, t, n) {
		let r = arguments.length === 1 ? a_(this._isDirected, e) : r_(this._isDirected, e, t, n);
		return this._edgeLabels[r];
	}
	edgeAsObj(e, t, n) {
		let r = arguments.length === 1 ? this.edge(e) : this.edge(e, t, n);
		return typeof r != "object" || !r ? { label: r } : r;
	}
	hasEdge(e, t, n) {
		return (arguments.length === 1 ? a_(this._isDirected, e) : r_(this._isDirected, e, t, n)) in this._edgeLabels;
	}
	removeEdge(e, t, n) {
		let r = arguments.length === 1 ? a_(this._isDirected, e) : r_(this._isDirected, e, t, n), i = this._edgeObjs[r];
		if (i) {
			let e = i.v, t = i.w;
			delete this._edgeLabels[r], delete this._edgeObjs[r], n_(this._preds[t], e), n_(this._sucs[e], t), delete this._in[t][r], delete this._out[e][r], this._edgeCount--;
		}
		return this;
	}
	inEdges(e, t) {
		return this.isDirected() ? this.filterEdges(this._in[e], e, t) : this.nodeEdges(e, t);
	}
	outEdges(e, t) {
		return this.isDirected() ? this.filterEdges(this._out[e], e, t) : this.nodeEdges(e, t);
	}
	nodeEdges(e, t) {
		if (e in this._nodes) return this.filterEdges({
			...this._in[e],
			...this._out[e]
		}, e, t);
	}
	_removeFromParentsChildList(e) {
		delete this._children[this._parent[e]][e];
	}
	filterEdges(e, t, n) {
		if (!e) return;
		let r = Object.values(e);
		return n ? r.filter((e) => e.v === t && e.w === n || e.v === n && e.w === t) : r;
	}
};
function t_(e, t) {
	e[t] ? e[t]++ : e[t] = 1;
}
function n_(e, t) {
	e[t] !== void 0 && !--e[t] && delete e[t];
}
function r_(e, t, n, r) {
	let i = "" + t, a = "" + n;
	if (!e && i > a) {
		let e = i;
		i = a, a = e;
	}
	return i + "" + a + "" + (r === void 0 ? "\0" : r);
}
function i_(e, t, n, r) {
	let i = "" + t, a = "" + n;
	if (!e && i > a) {
		let e = i;
		i = a, a = e;
	}
	let o = {
		v: i,
		w: a
	};
	return r && (o.name = r), o;
}
function a_(e, t) {
	return r_(e, t.v, t.w, t.name);
}
$g({}, {
	read: () => l_,
	write: () => o_
});
function o_(e) {
	let t = {
		options: {
			directed: e.isDirected(),
			multigraph: e.isMultigraph(),
			compound: e.isCompound()
		},
		nodes: s_(e),
		edges: c_(e)
	}, n = e.graph();
	return n !== void 0 && (t.value = structuredClone(n)), t;
}
function s_(e) {
	return e.nodes().map((t) => {
		let n = e.node(t), r = e.parent(t), i = { v: t };
		return n !== void 0 && (i.value = n), r !== void 0 && (i.parent = r), i;
	});
}
function c_(e) {
	return e.edges().map((t) => {
		let n = e.edge(t), r = {
			v: t.v,
			w: t.w
		};
		return t.name !== void 0 && (r.name = t.name), n !== void 0 && (r.value = n), r;
	});
}
function l_(e) {
	let t = new e_(e.options);
	return e.value !== void 0 && t.setGraph(e.value), e.nodes.forEach((e) => {
		t.setNode(e.v, e.value), e.parent && t.setParent(e.v, e.parent);
	}), e.edges.forEach((e) => {
		t.setEdge({
			v: e.v,
			w: e.w,
			name: e.name
		}, e.value);
	}), t;
}
var u_ = {};
$g(u_, {
	CycleException: () => T_,
	bellmanFord: () => f_,
	components: () => m_,
	dijkstra: () => __,
	dijkstraAll: () => y_,
	findCycles: () => x_,
	floydWarshall: () => C_,
	isAcyclic: () => D_,
	postorder: () => j_,
	preorder: () => M_,
	prim: () => N_,
	shortestPaths: () => P_,
	tarjan: () => b_,
	topsort: () => E_
});
var d_ = () => 1;
function f_(e, t, n, r) {
	return p_(e, String(t), n || d_, r || function(t) {
		return e.outEdges(t) ?? [];
	});
}
function p_(e, t, n, r) {
	let i = {}, a, o = 0, s = e.nodes(), c = function(e) {
		let t = i[e.v], r = i[e.w];
		if (!t || !r) return;
		let o = n(e);
		t.distance + o < r.distance && (i[e.w] = {
			distance: t.distance + o,
			predecessor: e.v
		}, a = !0);
	}, l = function() {
		s.forEach(function(e) {
			r(e).forEach(function(t) {
				let n = t.v === e ? t.v : t.w, r = n === t.v ? t.w : t.v;
				c({
					v: n,
					w: r
				});
			});
		});
	};
	s.forEach(function(e) {
		i[e] = {
			distance: e === t ? 0 : Infinity,
			predecessor: ""
		};
	});
	let u = s.length;
	for (let e = 1; e < u && (a = !1, o++, l(), a); e++);
	if (o === u - 1 && (a = !1, l(), a)) throw Error("The graph contains a negative weight cycle");
	return i;
}
function m_(e) {
	let t = {}, n = [], r;
	function i(n) {
		var a, o;
		n in t || (t[n] = !0, r.push(n), (a = e.successors(n)) == null || a.forEach(i), (o = e.predecessors(n)) == null || o.forEach(i));
	}
	return e.nodes().forEach(function(e) {
		r = [], i(e), r.length && n.push(r);
	}), n;
}
var h_ = class {
	constructor() {
		this._arr = [], this._keyIndices = {};
	}
	size() {
		return this._arr.length;
	}
	keys() {
		return this._arr.map((e) => e.key);
	}
	has(e) {
		return e in this._keyIndices;
	}
	priority(e) {
		let t = this._keyIndices[e];
		if (t !== void 0) return this._arr[t].priority;
	}
	min() {
		if (this.size() === 0) throw Error("Queue underflow");
		return this._arr[0].key;
	}
	add(e, t) {
		let n = this._keyIndices, r = String(e);
		if (!(r in n)) {
			let e = this._arr, i = e.length;
			return n[r] = i, e.push({
				key: r,
				priority: t
			}), this._decrease(i), !0;
		}
		return !1;
	}
	removeMin() {
		if (this.size() === 0) throw Error("Queue underflow");
		this._swap(0, this._arr.length - 1);
		let e = this._arr.pop();
		return delete this._keyIndices[e.key], this._heapify(0), e.key;
	}
	decrease(e, t) {
		let n = this._keyIndices[e];
		if (n === void 0) throw Error(`Key not found: ${e}`);
		let r = this._arr[n].priority;
		if (t > r) throw Error(`New priority is greater than current priority. Key: ${e} Old: ${r} New: ${t}`);
		this._arr[n].priority = t, this._decrease(n);
	}
	_heapify(e) {
		let t = this._arr, n = 2 * e, r = n + 1, i = e;
		n < t.length && (i = t[n].priority < t[i].priority ? n : i, r < t.length && (i = t[r].priority < t[i].priority ? r : i), i !== e && (this._swap(e, i), this._heapify(i)));
	}
	_decrease(e) {
		let t = this._arr, n = t[e].priority, r;
		for (; e !== 0 && (r = e >> 1, !(t[r].priority < n));) this._swap(e, r), e = r;
	}
	_swap(e, t) {
		let n = this._arr, r = this._keyIndices, i = n[e], a = n[t];
		n[e] = a, n[t] = i, r[a.key] = e, r[i.key] = t;
	}
}, g_ = () => 1;
function __(e, t, n, r) {
	return v_(e, String(t), n || g_, r || function(t) {
		return e.outEdges(t) ?? [];
	});
}
function v_(e, t, n, r) {
	let i = {}, a = new h_(), o, s, c = function(e) {
		let t = e.v === o ? e.w : e.v, r = i[t];
		if (!r) return;
		let c = n(e), l = s.distance + c;
		if (c < 0) throw Error("dijkstra does not allow negative edge weights. Bad edge: " + e + " Weight: " + c);
		l < r.distance && (r.distance = l, r.predecessor = o, a.decrease(t, l));
	};
	for (e.nodes().forEach(function(e) {
		let n = e === t ? 0 : Infinity;
		i[e] = {
			distance: n,
			predecessor: ""
		}, a.add(e, n);
	}); a.size() > 0;) {
		o = a.removeMin();
		let e = i[o];
		if (!e || e.distance === Infinity) break;
		s = e, r(o).forEach(c);
	}
	return i;
}
function y_(e, t, n) {
	return e.nodes().reduce(function(r, i) {
		return r[i] = __(e, i, t, n), r;
	}, {});
}
function b_(e) {
	let t = 0, n = [], r = {}, i = [];
	function a(o) {
		var s;
		let c = r[o] = {
			onStack: !0,
			lowlink: t,
			index: t++
		};
		if (n.push(o), (s = e.successors(o)) == null || s.forEach(function(e) {
			if (e in r) {
				let t = r[e];
				t != null && t.onStack && (c.lowlink = Math.min(c.lowlink, t.index));
			} else {
				a(e);
				let t = r[e];
				t && (c.lowlink = Math.min(c.lowlink, t.lowlink));
			}
		}), c.lowlink === c.index) {
			let e = [], t;
			do {
				t = n.pop();
				let i = r[t];
				i && (i.onStack = !1), e.push(t);
			} while (o !== t);
			i.push(e);
		}
	}
	return e.nodes().forEach(function(e) {
		e in r || a(e);
	}), i;
}
function x_(e) {
	return b_(e).filter(function(t) {
		let n = t[0];
		return n ? t.length > 1 || t.length === 1 && (e.outEdges(n, n) ?? []).length > 0 : !1;
	});
}
var S_ = () => 1;
function C_(e, t, n) {
	return w_(e, t || S_, n || function(t) {
		return e.outEdges(t) ?? [];
	});
}
function w_(e, t, n) {
	let r = {}, i = e.nodes();
	return i.forEach(function(e) {
		let a = {};
		r[e] = a, a[e] = {
			distance: 0,
			predecessor: ""
		}, i.forEach(function(t) {
			e !== t && (a[t] = {
				distance: Infinity,
				predecessor: ""
			});
		}), n(e).forEach(function(n) {
			let r = n.v === e ? n.w : n.v, i = t(n);
			a[r] = {
				distance: i,
				predecessor: e
			};
		});
	}), i.forEach(function(e) {
		let t = r[e];
		t && i.forEach(function(n) {
			let a = r[n];
			a && i.forEach(function(n) {
				let r = a[e], i = t[n], o = a[n];
				if (r && i && o) {
					let e = r.distance + i.distance;
					e < o.distance && (o.distance = e, o.predecessor = i.predecessor);
				}
			});
		});
	}), r;
}
var T_ = class extends Error {
	constructor(e) {
		super(e), this.name = "CycleException";
	}
};
function E_(e) {
	let t = {}, n = {}, r = [];
	function i(a) {
		var o;
		if (a in n) throw new T_();
		a in t || (n[a] = !0, t[a] = !0, (o = e.predecessors(a)) == null || o.forEach(i), delete n[a], r.push(a));
	}
	if (e.sinks().forEach(i), Object.keys(t).length !== e.nodeCount()) throw new T_();
	return r;
}
function D_(e) {
	try {
		E_(e);
	} catch (e) {
		if (e instanceof T_) return !1;
		throw e;
	}
	return !0;
}
function O_(e, t, n, r, i) {
	Array.isArray(t) || (t = [t]);
	let a = ((t) => (e.isDirected() ? e.successors(t) : e.neighbors(t)) ?? []), o = {};
	return t.forEach(function(t) {
		if (!e.hasNode(t)) throw Error("Graph does not have node: " + t);
		i = k_(e, t, n === "post", o, a, r, i);
	}), i;
}
function k_(e, t, n, r, i, a, o) {
	return t in r || (r[t] = !0, n || (o = a(o, t)), i(t).forEach(function(t) {
		o = k_(e, t, n, r, i, a, o);
	}), n && (o = a(o, t))), o;
}
function A_(e, t, n) {
	return O_(e, t, n, function(e, t) {
		return e.push(t), e;
	}, []);
}
function j_(e, t) {
	return A_(e, t, "post");
}
function M_(e, t) {
	return A_(e, t, "pre");
}
function N_(e, t) {
	var n;
	let r = new e_(), i = {}, a = new h_(), o;
	function s(e) {
		let n = e.v === o ? e.w : e.v, r = a.priority(n);
		if (r !== void 0) {
			let s = t(e);
			s < r && (i[n] = o, a.decrease(n, s));
		}
	}
	if (e.nodeCount() === 0) return r;
	e.nodes().forEach(function(e) {
		a.add(e, Infinity), r.setNode(e);
	});
	let c = e.nodes()[0];
	c !== void 0 && a.decrease(c, 0);
	let l = !1;
	for (; a.size() > 0;) {
		if (o = a.removeMin(), o in i) r.setEdge(o, i[o]);
		else {
			if (l) throw Error("Input graph is not connected: " + e);
			l = !0;
		}
		(n = e.nodeEdges(o)) == null || n.forEach(s);
	}
	return r;
}
function P_(e, t, n, r) {
	return F_(e, t, n, r ?? ((t) => e.outEdges(t) ?? []));
}
function F_(e, t, n, r) {
	if (n === void 0) return __(e, t, n, r);
	let i = !1, a = e.nodes();
	for (let o = 0; o < a.length; o++) {
		let s = a[o];
		if (s === void 0) continue;
		let c = r(s);
		for (let e = 0; e < c.length; e++) {
			let t = c[e];
			if (!t) continue;
			let r = t.v === s ? t.v : t.w;
			n({
				v: r,
				w: r === t.v ? t.w : t.v
			}) < 0 && (i = !0);
		}
		if (i) return f_(e, t, n, r);
	}
	return __(e, t, n, r);
}
var I_ = e_;
function L_(e, t, n, r) {
	let i = r;
	for (; e.hasNode(i);) i = $_(r);
	return n.dummy = t, e.setNode(i, n), i;
}
function R_(e) {
	let t = new I_().setGraph(e.graph());
	return e.nodes().forEach((n) => t.setNode(n, e.node(n))), e.edges().forEach((n) => {
		let r = t.edge(n.v, n.w) || {
			weight: 0,
			minlen: 1
		}, i = e.edge(n);
		t.setEdge(n.v, n.w, {
			weight: r.weight + i.weight,
			minlen: Math.max(r.minlen, i.minlen)
		});
	}), t;
}
function z_(e) {
	let t = new I_({ multigraph: e.isMultigraph() }).setGraph(e.graph());
	return e.nodes().forEach((n) => {
		e.children(n).length || t.setNode(n, e.node(n));
	}), e.edges().forEach((n) => {
		t.setEdge(n, e.edge(n));
	}), t;
}
function B_(e, t) {
	let n = e.x, r = e.y, i = t.x - n, a = t.y - r, o = e.width / 2, s = e.height / 2;
	if (!i && !a) throw Error("Not possible to find intersection inside of the rectangle");
	let c, l;
	return Math.abs(a) * o > Math.abs(i) * s ? (a < 0 && (s = -s), c = s * i / a, l = s) : (i < 0 && (o = -o), c = o, l = o * a / i), {
		x: n + c,
		y: r + l
	};
}
function V_(e) {
	let t = ev(J_(e) + 1).map(() => []);
	return e.nodes().forEach((n) => {
		let r = e.node(n), i = r.rank;
		i !== void 0 && (t[i] || (t[i] = []), t[i][r.order] = n);
	}), t;
}
function H_(e) {
	let t = e.nodes().map((t) => {
		let n = e.node(t).rank;
		return n === void 0 ? Number.MAX_VALUE : n;
	}), n = q_(Math.min, t);
	e.nodes().forEach((t) => {
		let r = e.node(t);
		Object.hasOwn(r, "rank") && (r.rank -= n);
	});
}
function U_(e) {
	let t = e.nodes().map((t) => e.node(t).rank).filter((e) => e !== void 0), n = q_(Math.min, t), r = [];
	e.nodes().forEach((t) => {
		let i = e.node(t).rank - n;
		r[i] || (r[i] = []), r[i].push(t);
	});
	let i = 0, a = e.graph().nodeRankFactor;
	Array.from(r).forEach((t, n) => {
		t === void 0 && n % a !== 0 ? --i : t !== void 0 && i && t.forEach((t) => e.node(t).rank += i);
	});
}
function W_(e, t, n, r) {
	let i = {
		width: 0,
		height: 0
	};
	return arguments.length >= 4 && (i.rank = n, i.order = r), L_(e, "border", i, t);
}
function G_(e, t = K_) {
	let n = [];
	for (let r = 0; r < e.length; r += t) {
		let i = e.slice(r, r + t);
		n.push(i);
	}
	return n;
}
var K_ = 65535;
function q_(e, t) {
	return t.length > K_ ? e(...G_(t).map((t) => e(...t))) : e(...t);
}
function J_(e) {
	let t = e.nodes().map((t) => {
		let n = e.node(t).rank;
		return n === void 0 ? Number.MIN_VALUE : n;
	});
	return q_(Math.max, t);
}
function Y_(e, t) {
	let n = {
		lhs: [],
		rhs: []
	};
	return e.forEach((e) => {
		t(e) ? n.lhs.push(e) : n.rhs.push(e);
	}), n;
}
function X_(e, t) {
	let n = Date.now();
	try {
		return t();
	} finally {
		console.log(e + " time: " + (Date.now() - n) + "ms");
	}
}
function Z_(e, t) {
	return t();
}
var Q_ = 0;
function $_(e) {
	return e + ("" + ++Q_);
}
function ev(e, t, n = 1) {
	t ?? (t = e, e = 0);
	let r = (e) => e < t;
	n < 0 && (r = (e) => t < e);
	let i = [];
	for (let t = e; r(t); t += n) i.push(t);
	return i;
}
function tv(e, t) {
	let n = {};
	for (let r of t) e[r] !== void 0 && (n[r] = e[r]);
	return n;
}
function nv(e, t) {
	let n;
	return n = typeof t == "string" ? (e) => e[t] : t, Object.entries(e).reduce((e, [t, r]) => (e[t] = n(r, t), e), {});
}
function rv(e, t) {
	return e.reduce((e, n, r) => (e[n] = t[r], e), {});
}
var iv = "\0";
function av(e, t, n) {
	if (!(e && t && n && t.dummy === "edge" && n.dummy === "edge" && t.edgeObj && n.edgeObj && e[t.edgeObj.v] && e[n.edgeObj.v] && e[t.edgeObj.w] && e[n.edgeObj.w])) return 0;
	let r = !0;
	t.edgeObj.w === n.edgeObj.w && (r = !1);
	let i = r ? e[t.edgeObj.v]?.rank ?? NaN : e[t.edgeObj.w]?.rank ?? NaN, a = Object.entries(e).find((e) => e[1].edgeObj?.v === t.edgeObj.v && e[1].edgeObj?.w === t.edgeObj.w && e[1].rank === i), o = Object.entries(e).find((e) => e[1].edgeObj?.v === n.edgeObj.v && e[1].edgeObj?.w === n.edgeObj.w && e[1].rank === i);
	if (!a || !o) return 0;
	let s = a[1].order ?? NaN, c = o[1].order ?? NaN;
	return isNaN(s - c) ? 0 : s - c;
}
var ov = "3.1.1", sv = class {
	constructor() {
		Xg(this, "_sentinel");
		let e = {};
		e._next = e._prev = e, this._sentinel = e;
	}
	dequeue() {
		let e = this._sentinel, t = e._prev;
		if (t !== e) return cv(t), t;
	}
	enqueue(e) {
		let t = this._sentinel;
		e._prev && e._next && cv(e), e._next = t._next, t._next._prev = e, t._next = e, e._prev = t;
	}
	toString() {
		let e = [], t = this._sentinel, n = t._prev;
		for (; n !== t;) e.push(JSON.stringify(n, lv)), n = n._prev;
		return "[" + e.join(", ") + "]";
	}
};
function cv(e) {
	e._prev._next = e._next, e._next._prev = e._prev, delete e._next, delete e._prev;
}
function lv(e, t) {
	if (e !== "_next" && e !== "_prev") return t;
}
var uv = sv, dv = () => 1;
function fv(e, t) {
	if (e.nodeCount() <= 1) return [];
	let n = hv(e, t || dv);
	return pv(n.graph, n.buckets, n.zeroIdx).flatMap((t) => e.outEdges(t.v, t.w) || []);
}
function pv(e, t, n) {
	let r = [], i = t[t.length - 1], a = t[0], o;
	for (; e.nodeCount();) {
		for (; o = a.dequeue();) mv(e, t, n, o);
		for (; o = i.dequeue();) mv(e, t, n, o);
		if (e.nodeCount()) {
			for (let i = t.length - 2; i > 0; --i) if (o = t[i]?.dequeue(), o) {
				r = r.concat(mv(e, t, n, o, !0) || []);
				break;
			}
		}
	}
	return r;
}
function mv(e, t, n, r, i) {
	let a = [], o = i ? a : void 0;
	return (e.inEdges(r.v) || []).forEach((r) => {
		let o = e.edge(r), s = e.node(r.v);
		i && a.push({
			v: r.v,
			w: r.w
		}), s.out -= o, gv(t, n, s);
	}), (e.outEdges(r.v) || []).forEach((r) => {
		let i = e.edge(r), a = r.w, o = e.node(a);
		o.in -= i, gv(t, n, o);
	}), e.removeNode(r.v), o;
}
function hv(e, t) {
	let n = new I_(), r = 0, i = 0;
	e.nodes().forEach((e) => {
		n.setNode(e, {
			v: e,
			in: 0,
			out: 0
		});
	}), e.edges().forEach((e) => {
		let a = n.edge(e.v, e.w) || 0, o = t(e), s = a + o;
		n.setEdge(e.v, e.w, s);
		let c = n.node(e.v), l = n.node(e.w);
		i = Math.max(i, c.out += o), r = Math.max(r, l.in += o);
	});
	let a = _v(i + r + 3).map(() => new uv()), o = r + 1;
	return n.nodes().forEach((e) => {
		gv(a, o, n.node(e));
	}), {
		graph: n,
		buckets: a,
		zeroIdx: o
	};
}
function gv(e, t, n) {
	var r, i, a;
	n.out ? n.in ? (a = e[n.out - n.in + t]) == null || a.enqueue(n) : (i = e[e.length - 1]) == null || i.enqueue(n) : (r = e[0]) == null || r.enqueue(n);
}
function _v(e) {
	let t = [];
	for (let n = 0; n < e; n++) t.push(n);
	return t;
}
function vv(e, t) {
	(e.graph().acyclicer === "greedy" ? fv(e, n(e)) : yv(e, t ?? null)).forEach((t) => {
		let n = e.edge(t);
		e.removeEdge(t), n.forwardName = t.name, n.reversed = !0, e.setEdge(t.w, t.v, n, $_("rev"));
	});
	function n(e) {
		return (t) => e.edge(t).weight;
	}
}
function yv(e, t) {
	let n = [], r = {}, i = {};
	function a(t) {
		Object.hasOwn(i, t) || (i[t] = !0, r[t] = !0, e.outEdges(t).forEach((e) => {
			Object.hasOwn(r, e.w) ? n.push(e) : a(e.w);
		}), delete r[t]);
	}
	function o(a) {
		var s;
		Object.hasOwn(i, a) || (i[a] = !0, r[a] = !0, (s = e.outEdges(a)) == null || s.forEach((i) => {
			Object.hasOwn(r, i.w) || t.node(a)?.rank > t.node(i.w)?.rank && xv(e, i.w, i) ? n.push(i) : o(i.w);
		}), delete r[a]);
	}
	let s = a;
	return t && typeof t.node == "function" && (s = o), e.sources().forEach(s), e.nodes().forEach(s), n;
}
function bv(e) {
	e.edges().forEach((t) => {
		let n = e.edge(t);
		if (n.reversed) {
			e.removeEdge(t);
			let r = n.forwardName;
			delete n.reversed, delete n.forwardName, e.setEdge(t.w, t.v, n, r);
		}
	});
}
function xv(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	function i(t) {
		if (e.sources().includes(t)) return !0;
		r.add(t);
		for (let a of e.inEdges(t) ?? []) if ((a.v !== n.v || a.w !== n.w) && !r.has(a.v) && i(a.v)) return !0;
		return !1;
	}
	return i(t);
}
function Sv(e) {
	e.graph().dummyChains = [], e.edges().forEach((t) => Cv(e, t));
}
function Cv(e, t) {
	let n = t.v, r = e.node(n).rank, i = t.w, a = e.node(i).rank, o = t.name, s = e.edge(t), c = s.labelRank;
	if (a === r + 1) return;
	e.removeEdge(t);
	let l, u, d = 0;
	for (++r; r < a; ++d, ++r) s.points = [], u = {
		width: 0,
		height: 0,
		edgeLabel: s,
		edgeObj: t,
		rank: r
	}, l = L_(e, "edge", u, "_d"), r === c && (u.width = s.width, u.height = s.height, u.dummy = "edge-label", u.labelpos = s.labelpos), e.setEdge(n, l, { weight: s.weight }, o), d === 0 && e.graph().dummyChains.push(l), n = l;
	e.setEdge(n, i, { weight: s.weight }, o);
}
function wv(e) {
	e.graph().dummyChains.forEach((t) => {
		let n = e.node(t), r = n.edgeLabel, i;
		for (e.setEdge(n.edgeObj, r); n.dummy;) i = e.successors(t)[0], e.removeNode(t), r.points.push({
			x: n.x,
			y: n.y
		}), n.dummy === "edge-label" && (r.x = n.x, r.y = n.y, r.width = n.width, r.height = n.height), t = i, n = e.node(t);
	});
}
function Tv(e) {
	let t = {};
	function n(r) {
		let i = e.node(r);
		if (Object.hasOwn(t, r)) return i.rank;
		t[r] = !0;
		let a = e.outEdges(r), o = a ? a.map((t) => t == null ? Infinity : n(t.w) - e.edge(t).minlen) : [], s = q_(Math.min, o);
		return s === Infinity && (s = 0), i.rank = s;
	}
	e.sources().forEach(n);
}
function Ev(e, t) {
	return e.node(t.w).rank - e.node(t.v).rank - e.edge(t).minlen;
}
var Dv = Ov;
function Ov(e) {
	let t = new I_({ directed: !1 }), n = e.nodes();
	if (n.length === 0) throw Error("Graph must have at least one node");
	let r = n[0], i = e.nodeCount();
	t.setNode(r, {});
	let a, o;
	for (; kv(t, e) < i && (a = Av(t, e), a);) o = t.hasNode(a.v) ? Ev(e, a) : -Ev(e, a), jv(t, e, o);
	return t;
}
function kv(e, t) {
	function n(r) {
		let i = t.nodeEdges(r);
		i && i.forEach((i) => {
			let a = i.v, o = r === a ? i.w : a;
			!e.hasNode(o) && !Ev(t, i) && (e.setNode(o, {}), e.setEdge(r, o, {}), n(o));
		});
	}
	return e.nodes().forEach(n), e.nodeCount();
}
function Av(e, t) {
	return t.edges().reduce((n, r) => {
		let i = Infinity;
		return e.hasNode(r.v) !== e.hasNode(r.w) && (i = Ev(t, r)), i < n[0] ? [i, r] : n;
	}, [Infinity, null])[1];
}
function jv(e, t, n) {
	e.nodes().forEach((e) => t.node(e).rank += n);
}
var { preorder: Mv, postorder: Nv } = u_, Pv = Fv;
Fv.initLowLimValues = zv, Fv.initCutValues = Iv, Fv.calcCutValue = Rv, Fv.leaveEdge = Vv, Fv.enterEdge = Hv, Fv.exchangeEdges = Uv;
function Fv(e) {
	e = R_(e), Tv(e);
	let t = Dv(e);
	zv(t), Iv(t, e);
	let n, r;
	for (; n = Vv(t);) r = Hv(t, e, n), Uv(t, e, n, r);
}
function Iv(e, t) {
	let n = Nv(e, e.nodes());
	n = n.slice(0, n.length - 1), n.forEach((n) => Lv(e, t, n));
}
function Lv(e, t, n) {
	let r = e.node(n).parent, i = e.edge(n, r);
	i.cutvalue = Rv(e, t, n);
}
function Rv(e, t, n) {
	let r = e.node(n).parent, i = !0, a = t.edge(n, r), o = 0;
	a ||= (i = !1, t.edge(r, n)), o = a.weight;
	let s = t.nodeEdges(n);
	return s && s.forEach((a) => {
		let s = a.v === n, c = s ? a.w : a.v;
		if (c !== r) {
			let r = s === i, l = t.edge(a).weight;
			if (o += r ? l : -l, Gv(e, n, c)) {
				let t = e.edge(n, c).cutvalue;
				o += r ? -t : t;
			}
		}
	}), o;
}
function zv(e, t) {
	arguments.length < 2 && (t = e.nodes()[0]), Bv(e, {}, 1, t);
}
function Bv(e, t, n, r, i) {
	let a = n, o = e.node(r);
	t[r] = !0;
	let s = e.neighbors(r);
	return s && s.forEach((i) => {
		Object.hasOwn(t, i) || (n = Bv(e, t, n, i, r));
	}), o.low = a, o.lim = n++, i ? o.parent = i : delete o.parent, n;
}
function Vv(e) {
	return e.edges().find((t) => e.edge(t).cutvalue < 0);
}
function Hv(e, t, n) {
	let r = n.v, i = n.w;
	t.hasEdge(r, i) || (r = n.w, i = n.v);
	let a = e.node(r), o = e.node(i), s = a, c = !1;
	return a.lim > o.lim && (s = o, c = !0), t.edges().filter((t) => c === Kv(e, e.node(t.v), s) && c !== Kv(e, e.node(t.w), s)).reduce((e, n) => Ev(t, n) < Ev(t, e) ? n : e);
}
function Uv(e, t, n, r) {
	let i = n.v, a = n.w;
	e.removeEdge(i, a), e.setEdge(r.v, r.w, {}), zv(e), Iv(e, t), Wv(e, t);
}
function Wv(e, t) {
	let n = e.nodes().find((t) => !e.node(t).parent);
	if (!n) return;
	let r = Mv(e, [n]);
	r = r.slice(1), r.forEach((n) => {
		let r = e.node(n).parent, i = t.edge(n, r), a = !1;
		i || (i = t.edge(r, n), a = !0), t.node(n).rank = t.node(r).rank + (a ? i.minlen : -i.minlen);
	});
}
function Gv(e, t, n) {
	return e.hasEdge(t, n);
}
function Kv(e, t, n) {
	return n.low <= t.lim && t.lim <= n.lim;
}
var qv = Jv;
function Jv(e) {
	let t = e.graph().ranker;
	if (typeof t == "function") return t(e);
	switch (t) {
		case "network-simplex":
			Zv(e);
			break;
		case "tight-tree":
			Xv(e);
			break;
		case "longest-path":
			Yv(e);
			break;
		case "none": break;
		default: Zv(e);
	}
}
var Yv = Tv;
function Xv(e) {
	Tv(e), Dv(e);
}
function Zv(e) {
	Pv(e);
}
var Qv = $v;
function $v(e) {
	let t = ty(e), n = e.graph();
	Array.isArray(n.dummyChains) && n.dummyChains.forEach((n) => {
		let r = e.node(n), i = r.edgeObj, a = ey(e, t, i.v, i.w), o = a.path, s = a.lca, c = 0, l = o[c], u = !0;
		for (; n !== i.w;) {
			if (r = e.node(n), u) {
				for (; (l = o[c]) !== s && e.node(l).maxRank < r.rank;) c++;
				l === s && (u = !1);
			}
			if (!u) {
				for (; c < o.length - 1 && e.node(o[c + 1]).minRank <= r.rank;) c++;
				l = o[c];
			}
			l !== void 0 && e.setParent(n, l), n = e.successors(n)[0];
		}
	});
}
function ey(e, t, n, r) {
	let i = [], a = [], o = Math.min(t[n].low, t[r].low), s = Math.max(t[n].lim, t[r].lim), c;
	c = n;
	do
		c = e.parent(c), i.push(c);
	while (c && (t[c].low > o || s > t[c].lim));
	let l = c, u = r;
	for (; (u = e.parent(u)) !== l;) a.push(u);
	return {
		path: i.concat(a.reverse()),
		lca: l
	};
}
function ty(e) {
	let t = {}, n = 0;
	function r(i) {
		let a = n;
		e.children(i).forEach(r), t[i] = {
			low: a,
			lim: n++
		};
	}
	return e.children(iv).forEach(r), t;
}
function ny(e) {
	let t = L_(e, "root", {}, "_root"), n = iy(e), r = Object.values(n), i = q_(Math.max, r) - 1, a = 2 * i + 1;
	e.graph().nestingRoot = t, e.edges().forEach((t) => e.edge(t).minlen *= a);
	let o = ay(e) + 1;
	e.children(iv).forEach((r) => {
		ry(e, t, a, o, i, n, r);
	}), e.graph().nodeRankFactor = a;
}
function ry(e, t, n, r, i, a, o) {
	let s = e.children(o);
	if (!s.length) {
		o !== t && e.setEdge(t, o, {
			weight: 0,
			minlen: n
		});
		return;
	}
	let c = W_(e, "_bt"), l = W_(e, "_bb"), u = e.node(o);
	e.setParent(c, o), u.borderTop = c, e.setParent(l, o), u.borderBottom = l, s.forEach((s) => {
		ry(e, t, n, r, i, a, s);
		let u = e.node(s), d = u.borderTop ? u.borderTop : s, f = u.borderBottom ? u.borderBottom : s, p = u.borderTop ? r : 2 * r, m = d === f ? i - (a[o] ?? 0) + 1 : 1;
		e.setEdge(c, d, {
			weight: p,
			minlen: m,
			nestingEdge: !0
		}), e.setEdge(f, l, {
			weight: p,
			minlen: m,
			nestingEdge: !0
		});
	}), e.parent(o) || e.setEdge(t, c, {
		weight: 0,
		minlen: i + (a[o] ?? 0)
	});
}
function iy(e) {
	let t = {};
	function n(r, i) {
		let a = e.children(r);
		a && a.length && a.forEach((e) => n(e, i + 1)), t[r] = i;
	}
	return e.children(iv).forEach((e) => n(e, 1)), t;
}
function ay(e) {
	return e.edges().reduce((t, n) => t + e.edge(n).weight, 0);
}
function oy(e) {
	let t = e.graph();
	e.removeNode(t.nestingRoot), delete t.nestingRoot, e.edges().forEach((t) => {
		e.edge(t).nestingEdge && e.removeEdge(t);
	});
}
var sy = cy;
function cy(e) {
	function t(n) {
		let r = e.children(n), i = e.node(n);
		if (r.length && r.forEach(t), i && Object.hasOwn(i, "minRank")) {
			i.borderLeft = [], i.borderRight = [];
			for (let t = i.minRank, r = i.maxRank + 1; t < r; ++t) ly(e, "borderLeft", "_bl", n, i, t), ly(e, "borderRight", "_br", n, i, t);
		}
	}
	e.children(iv).forEach(t);
}
function ly(e, t, n, r, i, a) {
	let o = {
		width: 0,
		height: 0,
		rank: a,
		borderType: t
	}, s = i[t][a - 1], c = L_(e, "border", o, n);
	i[t][a] = c, e.setParent(c, r), s && e.setEdge(s, c, { weight: 1 });
}
function uy(e) {
	let t = e.graph().rankdir?.toLowerCase();
	(t === "lr" || t === "rl") && fy(e);
}
function dy(e) {
	let t = e.graph().rankdir?.toLowerCase();
	(t === "bt" || t === "rl") && my(e), (t === "lr" || t === "rl") && (gy(e), fy(e));
}
function fy(e) {
	e.nodes().forEach((t) => py(e.node(t))), e.edges().forEach((t) => py(e.edge(t)));
}
function py(e) {
	let t = e.width;
	e.width = e.height, e.height = t;
}
function my(e) {
	e.nodes().forEach((t) => hy(e.node(t))), e.edges().forEach((t) => {
		var n;
		let r = e.edge(t);
		(n = r.points) == null || n.forEach(hy), Object.hasOwn(r, "y") && hy(r);
	});
}
function hy(e) {
	e.y = -e.y;
}
function gy(e) {
	e.nodes().forEach((t) => _y(e.node(t))), e.edges().forEach((t) => {
		var n;
		let r = e.edge(t);
		(n = r.points) == null || n.forEach(_y), Object.hasOwn(r, "x") && _y(r);
	});
}
function _y(e) {
	let t = e.x;
	e.x = e.y, e.y = t;
}
function vy(e, t = null) {
	let n = {}, r = e.nodes().filter((t) => !e.children(t).length), i = r.map((t) => e.node(t).rank), a = ev(q_(Math.max, i) + 1).map(() => []);
	function o(t) {
		if (n[t]) return;
		n[t] = !0;
		let r = e.node(t);
		a[r.rank].push(t);
		let i = e.successors(t);
		i && [...i].sort((e, t) => s(e, t)).forEach(o);
	}
	r.sort((t, n) => e.node(t).rank - e.node(n).rank).forEach(o);
	function s(n, r) {
		return av(t, e.node(n), e.node(r));
	}
	return a;
}
function yy(e, t) {
	let n = 0;
	for (let r = 1; r < t.length; ++r) n += by(e, t[r - 1], t[r]);
	return n;
}
function by(e, t, n) {
	let r = rv(n, n.map((e, t) => t)), i = t.flatMap((t) => {
		let n = e.outEdges(t);
		return n ? n.map((t) => ({
			pos: r[t.w],
			weight: e.edge(t).weight
		})).sort((e, t) => e.pos - t.pos) : [];
	}), a = 1;
	for (; a < n.length;) a <<= 1;
	let o = 2 * a - 1;
	--a;
	let s = Array(o).fill(0), c = 0;
	return i.forEach((e) => {
		let t = e.pos + a;
		s[t] += e.weight;
		let n = 0;
		for (; t > 0;) t % 2 && (n += s[t + 1]), t = t - 1 >> 1, s[t] += e.weight;
		c += e.weight * n;
	}), c;
}
function xy(e, t = []) {
	return t.map((t) => {
		let n = e.inEdges(t);
		if (!n || !n.length) return { v: t };
		{
			let r = n.reduce((t, n) => {
				let r = e.edge(n), i = e.node(n.v);
				return {
					sum: t.sum + r.weight * i.order,
					weight: t.weight + r.weight
				};
			}, {
				sum: 0,
				weight: 0
			});
			return {
				v: t,
				barycenter: r.sum / r.weight,
				weight: r.weight
			};
		}
	});
}
function Sy(e, t) {
	let n = {};
	return e.forEach((e, t) => {
		let r = {
			indegree: 0,
			in: [],
			out: [],
			vs: [e.v],
			i: t
		};
		e.barycenter !== void 0 && (r.barycenter = e.barycenter, r.weight = e.weight), n[e.v] = r;
	}), t.edges().forEach((e) => {
		let t = n[e.v], r = n[e.w];
		t !== void 0 && r !== void 0 && (r.indegree++, t.out.push(r));
	}), Cy(Object.values(n).filter((e) => !e.indegree));
}
function Cy(e) {
	let t = [];
	function n(e) {
		return (t) => {
			t.merged || (t.barycenter === void 0 || e.barycenter === void 0 || t.barycenter >= e.barycenter) && wy(e, t);
		};
	}
	function r(t) {
		return (n) => {
			n.in.push(t), --n.indegree === 0 && e.push(n);
		};
	}
	for (; e.length;) {
		let i = e.pop();
		t.push(i), i.in.reverse().forEach(n(i)), i.out.forEach(r(i));
	}
	return t.filter((e) => !e.merged).map((e) => tv(e, [
		"vs",
		"i",
		"barycenter",
		"weight"
	]));
}
function wy(e, t) {
	let n = 0, r = 0;
	e.weight && (n += e.barycenter * e.weight, r += e.weight), t.weight && (n += t.barycenter * t.weight, r += t.weight), e.vs = t.vs.concat(e.vs), e.barycenter = n / r, e.weight = r, e.i = Math.min(t.i, e.i), t.merged = !0;
}
function Ty(e, t, n, r, i) {
	let a = {}, o = null, s = null, c = i;
	typeof t == "boolean" ? (c = t, a = {}) : t && (a = t, o = n ?? null, s = r ?? null);
	let l = Y_(e, (e) => Object.hasOwn(e, "barycenter")), u = l.lhs, d = l.rhs.sort((e, t) => t.i - e.i), f = [], p = 0, m = 0, h = 0;
	u.sort(Dy(s, o, !!c));
	for (let [e, t] of Object.entries(a)) {
		let n = u.findIndex((t) => t.vs[0] === e);
		u.splice(n + 1, 0, t);
	}
	h = Ey(f, d, h), u.forEach((e) => {
		h += e.vs.length, f.push(e.vs), p += e.barycenter * e.weight, m += e.weight, h = Ey(f, d, h);
	});
	let g = { vs: f.flat(1) };
	return m && (g.barycenter = p / m, g.weight = m), g;
}
function Ey(e, t, n) {
	let r;
	for (; t.length && (r = t[t.length - 1]).i <= n;) t.pop(), e.push(r.vs), n++;
	return n;
}
function Dy(e, t, n) {
	return (r, i) => {
		if (r.barycenter < i.barycenter) return -1;
		if (r.barycenter > i.barycenter) return 1;
		if (e && (typeof r.vs[0] == "string" || typeof i.vs[0] == "string")) {
			let n = av(t, e.node(r.vs[0]), e.node(i.vs[0]));
			if (n !== 0) return n;
		}
		return n ? i.i - r.i : r.i - i.i;
	};
}
function Oy(e, t, n, r, i) {
	var a, o;
	let s = null, c = i;
	typeof r == "boolean" ? (c = r, s = null) : r !== void 0 && (s = r);
	let l = e.children(t), u = e.node(t), d = u ? u.borderLeft : void 0, f = u ? u.borderRight : void 0, p = {};
	d && (l = l.filter((e) => e !== d && e !== f));
	let m = xy(e, l);
	m.forEach((t) => {
		if (e.children(t.v).length) {
			let { result: r } = Oy(e, t.v, n, s, c);
			p[t.v] = r, Object.hasOwn(r, "barycenter") && Ay(t, r);
		}
	});
	let h = Sy(m, n);
	ky(h, p);
	let g = {}, _ = !1;
	for (let t = 0; t < h.length; t++) for (let n = t + 1; n < h.length; n++) if (h[t] && h[n] && (a = h[t]) != null && a.barycenter && (o = h[n]) != null && o.barycenter && h[t]?.barycenter === h[n].barycenter) {
		let r = h[t]?.vs[0] ?? "", i = h[n]?.vs[0] ?? "", a = e.node(r), o = e.node(i);
		if (a.dummy === "edge" && o.dummy === "edge" && a.edgeObj?.v === o.edgeObj?.v && a.edgeObj?.w === o.edgeObj?.w) {
			if (a.edgeLabel.reversed) {
				g[i] = h[t], h.splice(t, 1), t--;
				break;
			}
			g[r] = h[n], h.splice(n, 1), n--;
		} else _ = !0;
	}
	let v = Ty(h, g, s, e, c);
	if (d && f) {
		v.vs = [
			d,
			v.vs,
			f
		].flat(1);
		let t = e.predecessors(d);
		if (t && t.length) {
			let n = e.node(t[0]), r = e.predecessors(f), i = e.node(r[0]);
			Object.hasOwn(v, "barycenter") || (v.barycenter = 0, v.weight = 0), v.barycenter = (v.barycenter * v.weight + n.order + i.order) / (v.weight + 2), v.weight += 2;
		}
	}
	return Object.defineProperty(v, "result", {
		value: v,
		enumerable: !1,
		configurable: !0,
		writable: !0
	}), Object.defineProperty(v, "usedBias", {
		value: _,
		enumerable: !1,
		configurable: !0,
		writable: !0
	}), v;
}
function ky(e, t) {
	e.forEach((e) => {
		e.vs = e.vs.flatMap((e) => t[e] ? t[e].vs : e);
	});
}
function Ay(e, t) {
	e.barycenter === void 0 ? (e.barycenter = t.barycenter, e.weight = t.weight) : (e.barycenter = (e.barycenter * e.weight + t.barycenter * t.weight) / (e.weight + t.weight), e.weight += t.weight);
}
function jy(e, t, n, r) {
	r ||= e.nodes();
	let i = My(e), a = new I_({ compound: !0 }).setGraph({ root: i }).setDefaultNodeLabel((t) => e.node(t));
	return r.forEach((r) => {
		let o = e.node(r), s = e.parent(r);
		if (o.rank === t || o.minRank <= t && t <= o.maxRank) {
			a.setNode(r), a.setParent(r, s || i);
			let c = e[n](r);
			c && c.forEach((t) => {
				let n = t.v === r ? t.w : t.v, i = a.edge(n, r), o = i === void 0 ? 0 : i.weight;
				a.setEdge(n, r, { weight: e.edge(t).weight + o });
			}), Object.hasOwn(o, "minRank") && a.setNode(r, {
				borderLeft: o.borderLeft[t],
				borderRight: o.borderRight[t]
			});
		}
	}), a;
}
function My(e) {
	let t;
	for (; e.hasNode(t = $_("_root")););
	return t;
}
function Ny(e, t, n) {
	let r = {}, i;
	n.forEach((n) => {
		let a = e.parent(n), o, s;
		for (; a;) {
			if (o = e.parent(a), o ? (s = r[o], r[o] = a) : (s = i, i = a), s && s !== a) {
				t.setEdge(s, a);
				return;
			}
			a = o;
		}
	});
}
function Py(e, t = {}, n = null) {
	if (typeof t.customOrder == "function") {
		t.customOrder(e, Py);
		return;
	}
	let r = J_(e), i = Fy(e, ev(1, r + 1), "inEdges"), a = Fy(e, ev(r - 1, -1, -1), "outEdges"), o = vy(e, n);
	if (Ly(e, o), t.disableOptimalOrderHeuristic) return;
	let s = Infinity, c, l = t.constraints || [];
	for (let t = 0, r = 0; r < 4; ++t, ++r) {
		Iy(t % 2 ? i : a, t % 4 >= 2, l, n), o = V_(e);
		let u = yy(e, o);
		u < s ? (r = 0, c = Object.assign({}, o), s = u) : u === s && (c = structuredClone(o));
	}
	Ly(e, c);
}
function Fy(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = (e, t) => {
		r.has(e) || r.set(e, []), r.get(e).push(t);
	};
	for (let t of e.nodes()) {
		let n = e.node(t);
		if (typeof n.rank == "number" && i(n.rank, t), typeof n.minRank == "number" && typeof n.maxRank == "number") for (let e = n.minRank; e <= n.maxRank; e++) e !== n.rank && i(e, t);
	}
	return t.map(function(t) {
		return jy(e, t, n, r.get(t) || []);
	});
}
function Iy(e, t, n, r) {
	let i = !0, a = new I_();
	e.forEach(function(e) {
		n.forEach((e) => a.setEdge(e.left, e.right));
		let o = e.graph().root, { result: s, usedBias: c } = Oy(e, o, a, r, i);
		t && c && (i = !i), s.vs.forEach((t, n) => e.node(t).order = n), Ny(e, a, s.vs);
	});
}
function Ly(e, t) {
	Object.values(t).forEach((t) => t.forEach((t, n) => e.node(t).order = n));
}
function Ry(e, t) {
	let n = {};
	function r(t, r) {
		let i = 0, a = 0, o = t.length, s = r[r.length - 1];
		return r.forEach((t, c) => {
			let l = By(e, t), u = l ? e.node(l).order : o;
			(l || t === s) && (r.slice(a, c + 1).forEach((t) => {
				let r = e.predecessors(t);
				r && r.forEach((r) => {
					let a = e.node(r), o = a.order;
					(o < i || u < o) && !(a.dummy && e.node(t).dummy) && Vy(n, r, t);
				});
			}), a = c + 1, i = u);
		}), r;
	}
	return t.length && t.reduce(r), n;
}
function zy(e, t) {
	let n = {};
	function r(t, r, i, a, o) {
		ev(r, i).forEach((r) => {
			let i = t[r];
			if (i !== void 0 && e.node(i).dummy) {
				let t = e.predecessors(i);
				t && t.forEach((t) => {
					if (t === void 0) return;
					let r = e.node(t);
					r.dummy && (r.order < a || r.order > o) && Vy(n, t, i);
				});
			}
		});
	}
	function i(t, n) {
		let i = -1, a = -1, o = 0;
		return n.forEach((s, c) => {
			if (e.node(s).dummy === "border") {
				let t = e.predecessors(s);
				if (t && t.length) {
					let s = t[0];
					if (s === void 0) return;
					a = e.node(s).order, r(n, o, c, i, a), o = c, i = a;
				}
			}
			r(n, o, n.length, a, t.length);
		}), n;
	}
	return t.length && t.reduce(i), n;
}
function By(e, t) {
	if (e.node(t).dummy) {
		let n = e.predecessors(t);
		if (n) return n.find((t) => e.node(t).dummy);
	}
}
function Vy(e, t, n) {
	if (t > n) {
		let e = t;
		t = n, n = e;
	}
	let r = e[t];
	r || (e[t] = r = {}), r[n] = !0;
}
function Hy(e, t, n) {
	if (t > n) {
		let e = t;
		t = n, n = e;
	}
	let r = e[t];
	return r !== void 0 && Object.hasOwn(r, n);
}
function Uy(e, t, n, r, i) {
	let a = {}, o = {}, s = {};
	return t.forEach((e) => {
		e.forEach((e, t) => {
			a[e] = e, o[e] = e, s[e] = t;
		});
	}), t.forEach((t) => {
		let c = -1, l = -1, u = !1, d = t, f = t.findIndex((t) => i?.includes(t) || Qy(t, e, i));
		f > 0 && (d = [
			t[f],
			...t.slice(0, f),
			...t.slice(f + 1)
		], u = !0), d.forEach((t) => {
			let d = r(t);
			if (d && d.length) {
				i != null && i.includes(t) && (d = d.filter((t) => Qy(t, e, i)));
				let r = d.sort((e, t) => {
					let n = s[e], r = s[t];
					return (n === void 0 ? 0 : n) - (r === void 0 ? 0 : r);
				}), f = (r.length - 1) / 2;
				for (let e = Math.floor(f), i = Math.ceil(f); e <= i; ++e) {
					let i = r[e];
					if (i === void 0) continue;
					let d = s[i];
					if (d !== void 0 && o[t] === t && c < d && s[i] !== l && !Hy(n, t, i)) {
						let e = a[i];
						e !== void 0 && (o[i] = t, o[t] = a[t] = e, c = d, u &&= (c = -1, l = s[i] ?? -1, !1));
					}
				}
			}
		});
	}), {
		root: a,
		align: o
	};
}
function Wy(e, t, n, r, i = !1) {
	let a = {}, o = Gy(e, t, n, i), s = i ? "borderLeft" : "borderRight";
	function c(e, t) {
		let n = o.nodes().slice(), r = {}, i = n.pop();
		for (; i;) {
			if (r[i]) e(i);
			else {
				r[i] = !0, n.push(i);
				for (let e of t(i)) n.push(e);
			}
			i = n.pop();
		}
	}
	function l(e) {
		let t = o.inEdges(e);
		t ? a[e] = t.reduce((e, t) => {
			let n = a[t.v] ?? 0, r = o.edge(t);
			return Math.max(e, n + (r === void 0 ? 0 : r));
		}, 0) : a[e] = 0;
	}
	function u(t) {
		let n = o.outEdges(t), r = Infinity;
		n && (r = n.reduce((e, t) => {
			let n = a[t.w], r = o.edge(t);
			return Math.min(e, (n === void 0 ? 0 : n) - (r === void 0 ? 0 : r));
		}, Infinity));
		let i = e.node(t);
		r !== Infinity && i.borderType !== s && (a[t] = Math.max(a[t] === void 0 ? 0 : a[t], r));
	}
	function d(e) {
		return o.predecessors(e) || [];
	}
	function f(e) {
		return o.successors(e) || [];
	}
	return c(l, d), c(u, f), Object.keys(r).forEach((e) => {
		let t = n[e];
		t !== void 0 && (a[e] = a[t] ?? 0);
	}), a;
}
function Gy(e, t, n, r) {
	let i = new I_(), a = e.graph(), o = Xy(a.nodesep, a.edgesep, r);
	return t.forEach((t) => {
		let r;
		t.forEach((t) => {
			let a = n[t];
			if (a !== void 0) {
				if (i.setNode(a), r !== void 0) {
					let s = n[r];
					if (s !== void 0) {
						let n = i.edge(s, a);
						i.setEdge(s, a, Math.max(o(e, t, r), n || 0));
					}
				}
				r = t;
			}
		});
	}), i;
}
function Ky(e, t) {
	return Object.values(t).reduce((t, n) => {
		let r = -Infinity, i = Infinity;
		Object.entries(n).forEach(([t, n]) => {
			let a = Zy(e, t) / 2;
			r = Math.max(n + a, r), i = Math.min(n - a, i);
		});
		let a = r - i;
		return a < t[0] && (t = [a, n]), t;
	}, [Infinity, null])[1];
}
function qy(e, t) {
	let n = Object.values(t), r = q_(Math.min, n), i = q_(Math.max, n);
	["u", "d"].forEach((n) => {
		["l", "r"].forEach((a) => {
			let o = n + a, s = e[o];
			if (!s || s === t) return;
			let c = Object.values(s), l = r - q_(Math.min, c);
			a !== "l" && (l = i - q_(Math.max, c)), l && (e[o] = nv(s, (e) => e + l));
		});
	});
}
function Jy(e, t = void 0) {
	let n = e.ul;
	return n ? nv(n, (n, r) => {
		if (t) {
			let n = e[t.toLowerCase()];
			if (n && n[r] !== void 0) return n[r];
		}
		let i = Object.values(e).map((e) => {
			let t = e[r];
			return t === void 0 ? 0 : t;
		}).sort((e, t) => e - t);
		return ((i[1] ?? 0) + (i[2] ?? 0)) / 2;
	}) : {};
}
function Yy(e, t) {
	let n = V_(e), r = Object.assign(Ry(e, n), zy(e, n)), i = {}, a;
	return ["u", "d"].forEach((o) => {
		a = o === "u" ? n : Object.values(n).reverse(), ["l", "r"].forEach((n) => {
			n === "r" && (a = a.map((e) => Object.values(e).reverse()));
			let s = Uy(e, a, r, (t) => (o === "u" ? e.predecessors(t) : e.successors(t)) || [], t), c = Wy(e, a, s.root, s.align, n === "r");
			n === "r" && (c = nv(c, (e) => -e)), i[o + n] = c;
		});
	}), qy(i, Ky(e, i)), Jy(i, e.graph().align);
}
function Xy(e, t, n) {
	return (r, i, a) => {
		let o = r.node(i), s = r.node(a), c = 0, l;
		if (c += o.width / 2, Object.hasOwn(o, "labelpos")) switch (o.labelpos.toLowerCase()) {
			case "l":
				l = -o.width / 2;
				break;
			case "r": l = o.width / 2;
		}
		if (l && (c += n ? l : -l), l = void 0, c += (o.dummy ? t : e) / 2, c += (s.dummy ? t : e) / 2, c += s.width / 2, Object.hasOwn(s, "labelpos")) switch (s.labelpos.toLowerCase()) {
			case "l":
				l = s.width / 2;
				break;
			case "r": l = -s.width / 2;
		}
		return l && (c += n ? l : -l), c;
	};
}
function Zy(e, t) {
	return e.node(t).width;
}
function Qy(e, t, n) {
	if (!n) return !1;
	let r = t.node(e)?.edgeObj;
	if (!r || t.node(e).edgeLabel.reversed) return !1;
	let i = n.indexOf(r?.v), a = n.indexOf(r?.w);
	return i !== -1 && a !== -1 && i === (a + 1) % n.length || i === (a - 1) % n.length;
}
function $y(e, t) {
	e = z_(e), eb(e), Object.entries(Yy(e, t)).forEach(([t, n]) => e.node(t).x = n);
}
function eb(e) {
	let t = V_(e), n = e.graph(), r = n.ranksep, i = n.rankalign, a = 0;
	t.forEach((t) => {
		let n = t.reduce((t, n) => {
			let r = e.node(n).height ?? 0;
			return t > r ? t : r;
		}, 0);
		t.forEach((t) => {
			let r = e.node(t);
			r.y = i === "top" ? a + r.height / 2 : i === "bottom" ? a + n - r.height / 2 : a + n / 2;
		}), a += n + r;
	});
}
var tb = /* @__PURE__ */ new WeakMap();
function nb(e, t = {}) {
	return ib(e, Z_, t), e;
}
function rb(e, t, n) {
	let r = t;
	for (; r !== void 0;) {
		let t = e.parent(r);
		if (t === n) return r;
		r = t;
	}
}
function ib(e, t, n) {
	let r = e.nodes().filter((t) => e.children(t).length), i = {};
	r.forEach((r) => {
		let a = e.node(r);
		if (a && a.rankdir) {
			let o = new I_({
				multigraph: !0,
				compound: !0
			});
			o.setGraph({ rankdir: a.rankdir });
			let s = e.children(r);
			s.forEach((t) => {
				let n = { ...e.node(t) };
				o.setNode(t, n);
				let i = e.parent(t);
				i && i !== r && s.includes(i) && o.setParent(t, i);
			});
			let c = /* @__PURE__ */ new Set();
			e.edges().forEach((t) => {
				let n = rb(e, t.v, r), i = rb(e, t.w, r);
				if (n && i && n !== i) {
					let r = `${n}\0${i}`;
					c.has(r) || (c.add(r), o.setEdge(n, i, { ...e.edge(t) }));
				}
			}), ib(o, t, n);
			let l = hb(o);
			ab(l, t, n, null), ob(o, l);
			let u = 1 / 0, d = 1 / 0, f = -1 / 0, p = -1 / 0;
			o.nodes().forEach((e) => {
				if (e === r) return;
				let t = o.node(e);
				t && typeof t.x == "number" && typeof t.y == "number" && typeof t.width == "number" && typeof t.height == "number" && (u = Math.min(u, t.x - t.width / 2), f = Math.max(f, t.x + t.width / 2), d = Math.min(d, t.y - t.height / 2), p = Math.max(p, t.y + t.height / 2));
			}), (!isFinite(u) || !isFinite(d) || !isFinite(f) || !isFinite(p)) && (u = d = 0, f = p = 0);
			let m = f - u, h = p - d;
			i[r] = {
				minX: u,
				minY: d,
				maxX: f,
				maxY: p,
				width: m,
				height: h,
				offsetX: u,
				offsetY: d
			}, a._dagreClusterSubgraph = o;
		}
	});
	let a = [], o = (t) => {
		let n = [], r = (e.children(t) || []).filter((e) => e !== t);
		for (; r.length > 0;) {
			let t = r.shift();
			n.push(t), (e.children(t) || []).filter((e) => e !== t).forEach((e) => r.push(e));
		}
		return n;
	}, s = /* @__PURE__ */ new Map();
	r.forEach((t) => {
		let n = e.node(t);
		n && n.rankdir && i[t] && s.set(t, (e.children(t) || []).filter((e) => e !== t));
	});
	let c = new Set([...s.values()].flat()), l = /* @__PURE__ */ new Map();
	s.forEach((e, t) => {
		c.has(t) || l.set(t, o(t));
	});
	let u = new Set([...l.values()].flat()), d = (e) => {
		for (let [t, n] of l) if (n.includes(e)) return t;
		return e;
	}, f = [];
	e.edges().forEach((t) => {
		(u.has(t.v) || u.has(t.w)) && f.push({
			edge: t,
			label: e.edge(t)
		});
	});
	let p = /* @__PURE__ */ new Map();
	u.forEach((t) => {
		let n = e.parent(t);
		p.set(t, typeof n == "string" ? n : void 0);
	}), l.forEach((t, n) => {
		let r = e.node(n), o = [];
		t.forEach((t) => {
			let n = e.node(t);
			n && (o.push({
				id: t,
				node: n,
				parent: p.get(t)
			}), e.removeNode(t));
		});
		let s = f.filter(({ edge: e }) => t.includes(e.v) || t.includes(e.w)), c = i[n];
		r && (a.push({
			clusterId: n,
			subgraph: r._dagreClusterSubgraph,
			bounds: c,
			children: t,
			removedNodes: o,
			removedEdges: s
		}), r.width = c.width, r.height = c.height);
	});
	let m = /* @__PURE__ */ new Set();
	f.forEach(({ edge: t, label: n }) => {
		let r = d(t.v), i = d(t.w);
		if (r !== i && e.hasNode(r) && e.hasNode(i)) {
			let t = `${r}\0${i}`;
			m.has(t) || (m.add(t), e.setEdge(r, i, {
				...n,
				width: 0,
				height: 0
			}));
		}
	});
	let h = hb(e), g = ab(h, t, n, tb.get(e) ?? null);
	tb.set(e, g), ob(e, h), m.forEach((t) => {
		let n = t.indexOf("\0"), r = t.slice(0, n), i = t.slice(n + 1);
		e.hasEdge(r, i) && e.removeEdge(r, i);
	}), a.forEach(({ clusterId: t, subgraph: n, bounds: r, removedNodes: i, removedEdges: a }) => {
		let o = e.node(t), s = o?.x ?? 0, c = o?.y ?? 0, l = (r.minX + r.maxX) / 2, u = (r.minY + r.maxY) / 2;
		i.forEach(({ id: t, node: n, parent: r }) => {
			e.setNode(t, n), r !== void 0 && e.setParent(t, r);
		}), a.forEach(({ edge: t, label: n }) => {
			e.setEdge(t, n);
		}), n.nodes().forEach((r) => {
			if (r === t) return;
			let i = n.node(r), a = e.node(r);
			a && i && typeof i.x == "number" && typeof i.y == "number" && (a.x = s + (i.x - l), a.y = c + (i.y - u));
		}), delete o._dagreClusterSubgraph;
	}), r.forEach((t) => {
		let n = e.node(t), r = i[t];
		if (n && n.rankdir && n._dagreClusterSubgraph && r) {
			let i = n._dagreClusterSubgraph, a = n.x ?? 0, o = n.y ?? 0, s = (r.minX + r.maxX) / 2, c = (r.minY + r.maxY) / 2;
			i.nodes().forEach((n) => {
				if (n === t) return;
				let r = i.node(n), l = e.node(n);
				if (l && r && typeof r.x == "number" && typeof r.y == "number") {
					let e = r.x - s, t = r.y - c;
					l.x = a + e, l.y = o + t;
				}
			}), delete n._dagreClusterSubgraph;
		}
	});
}
function ab(e, t, n, r = null) {
	var i, a;
	let o = n?.useDynamic !== !1, s = o && (i = r?.graph) != null ? i : null, c = o && (a = r?.rawNodes) != null ? a : null;
	t("    makeSpaceForEdgeLabels", () => gb(e)), t("    removeSelfEdges", () => Tb(e)), t("    acyclic", () => vv(e, s)), t("    nestingGraph.run", () => ny(e)), t("    rank", () => qv(z_(e))), t("    injectEdgeLabelProxies", () => _b(e)), t("    removeEmptyRanks", () => U_(e)), t("    nestingGraph.cleanup", () => oy(e)), t("    normalizeRanks", () => H_(e)), t("    assignRankMinMax", () => vb(e)), t("    removeEdgeLabelProxies", () => yb(e)), t("    normalize.run", () => Sv(e)), t("    parentDummyChains", () => Qv(e)), t("    addBorderSegments", () => sy(e)), t("    order", () => Py(e, n, c)), t("    insertSelfEdges", () => Eb(e)), t("    adjustCoordinateSystem", () => uy(e)), t("    position", () => $y(e, n.corePath)), t("    positionSelfEdges", () => Db(e));
	let l = JSON.parse(JSON.stringify(e._nodes));
	return t("    removeBorderNodes", () => wb(e)), t("    normalize.undo", () => wv(e)), t("    fixupEdgeLabelCoords", () => Sb(e)), t("    undoCoordinateSystem", () => dy(e)), t("    translateGraph", () => bb(e)), t("    assignNodeIntersects", () => xb(e)), t("    reversePoints", () => Cb(e)), t("    acyclic.undo", () => bv(e)), {
		graph: e,
		rawNodes: l
	};
}
function ob(e, t) {
	e.nodes().forEach((n) => {
		let r = e.node(n), i = t.node(n);
		r && (r.x = i.x, r.y = i.y, r.order = i.order, r.rank = i.rank, t.children(n).length && (r.width = i.width, r.height = i.height));
	}), e.edges().forEach((n) => {
		let r = e.edge(n), i = t.edge(n);
		r.points = i.points, Object.hasOwn(i, "x") && (r.x = i.x, r.y = i.y);
	}), e.graph().width = t.graph().width, e.graph().height = t.graph().height;
}
var sb = [
	"nodesep",
	"edgesep",
	"ranksep",
	"marginx",
	"marginy"
], cb = {
	ranksep: 50,
	edgesep: 20,
	nodesep: 50,
	rankdir: "TB",
	rankalign: "center"
}, lb = [
	"acyclicer",
	"ranker",
	"rankdir",
	"align",
	"rankalign"
], ub = [
	"width",
	"height",
	"rank"
], db = {
	width: 0,
	height: 0
}, fb = [
	"minlen",
	"weight",
	"width",
	"height",
	"labeloffset"
], pb = {
	minlen: 1,
	weight: 1,
	width: 0,
	height: 0,
	labeloffset: 10,
	labelpos: "r"
}, mb = ["labelpos"];
function hb(e) {
	let t = new I_({
		multigraph: !0,
		compound: !0
	}), n = kb(e.graph());
	return t.setGraph(Object.assign({}, cb, Ob(n, sb), tv(n, lb))), e.nodes().forEach((n) => {
		let r = Ob(kb(e.node(n)), ub);
		Object.keys(db).forEach((e) => {
			r[e] === void 0 && (r[e] = db[e]);
		}), t.setNode(n, r);
		let i = e.parent(n);
		i !== void 0 && t.setParent(n, i);
	}), e.edges().forEach((n) => {
		let r = kb(e.edge(n));
		t.setEdge(n, Object.assign({}, pb, Ob(r, fb), tv(r, mb)));
	}), t;
}
function gb(e) {
	let t = e.graph();
	t.ranksep /= 2, e.edges().forEach((n) => {
		let r = e.edge(n);
		r.minlen *= 2, (r.labelpos ?? "r").toLowerCase() !== "c" && (t.rankdir === "TB" || t.rankdir === "BT" ? r.width += r.labeloffset : r.height += r.labeloffset);
	});
}
function _b(e) {
	e.edges().forEach((t) => {
		let n = e.edge(t);
		if (n.width && n.height) {
			let n = e.node(t.v);
			L_(e, "edge-proxy", {
				rank: (e.node(t.w).rank - n.rank) / 2 + n.rank,
				e: t
			}, "_ep");
		}
	});
}
function vb(e) {
	let t = 0;
	e.nodes().forEach((n) => {
		let r = e.node(n);
		r.borderTop && (r.minRank = e.node(r.borderTop).rank, r.maxRank = e.node(r.borderBottom).rank, t = Math.max(t, r.maxRank));
	}), e.graph().maxRank = t;
}
function yb(e) {
	e.nodes().forEach((t) => {
		let n = e.node(t);
		if (n.dummy === "edge-proxy") {
			let r = n;
			e.edge(r.e).labelRank = n.rank, e.removeNode(t);
		}
	});
}
function bb(e) {
	let t = Infinity, n = 0, r = Infinity, i = 0, a = e.graph(), o = a.marginx || 0, s = a.marginy || 0;
	function c(e) {
		let a = e.x, o = e.y, s = e.width, c = e.height;
		t = Math.min(t, a - s / 2), n = Math.max(n, a + s / 2), r = Math.min(r, o - c / 2), i = Math.max(i, o + c / 2);
	}
	e.nodes().forEach((t) => c(e.node(t))), e.edges().forEach((t) => {
		let n = e.edge(t);
		Object.hasOwn(n, "x") && c(n);
	}), t -= o, r -= s, e.nodes().forEach((n) => {
		let i = e.node(n);
		i.x -= t, i.y -= r;
	}), e.edges().forEach((n) => {
		let i = e.edge(n);
		i.points.forEach((e) => {
			e.x -= t, e.y -= r;
		}), Object.hasOwn(i, "x") && (i.x -= t), Object.hasOwn(i, "y") && (i.y -= r);
	}), a.width = n - t + o, a.height = i - r + s;
}
function xb(e) {
	e.edges().forEach((t) => {
		if (t.v === t.w) return;
		let n = e.edge(t), r = e.node(t.v), i = e.node(t.w), a, o;
		n.points ? (a = n.points[0], o = n.points[n.points.length - 1]) : (n.points = [], a = i, o = r), n.points.unshift(B_(r, a)), n.points.push(B_(i, o));
	});
}
function Sb(e) {
	e.edges().forEach((t) => {
		let n = e.edge(t);
		if (Object.hasOwn(n, "x")) switch ((n.labelpos === "l" || n.labelpos === "r") && (n.width -= n.labeloffset), n.labelpos) {
			case "l":
				n.x -= n.width / 2 + n.labeloffset;
				break;
			case "r": n.x += n.width / 2 + n.labeloffset;
		}
	});
}
function Cb(e) {
	e.edges().forEach((t) => {
		let n = e.edge(t);
		n.reversed && n.points.reverse();
	});
}
function wb(e) {
	e.nodes().forEach((t) => {
		if (e.children(t).length) {
			let n = e.node(t), r = e.node(n.borderTop), i = e.node(n.borderBottom), a = e.node(n.borderLeft[n.borderLeft.length - 1]), o = e.node(n.borderRight[n.borderRight.length - 1]);
			n.width = Math.abs(o.x - a.x), n.height = Math.abs(i.y - r.y), n.x = a.x + n.width / 2, n.y = r.y + n.height / 2;
		}
	}), e.nodes().forEach((t) => {
		e.node(t).dummy === "border" && e.removeNode(t);
	});
}
function Tb(e) {
	e.edges().forEach((t) => {
		if (t.v === t.w) {
			let n = e.node(t.v);
			n.selfEdges ||= [], n.selfEdges.push({
				e: t,
				label: e.edge(t)
			}), e.removeEdge(t);
		}
	});
}
function Eb(e) {
	V_(e).forEach((t) => {
		let n = 0;
		t.forEach((t, r) => {
			let i = e.node(t);
			typeof i.rank != "number" && (i.rank = 0), i.order = r + n, (i.selfEdges || []).forEach((t) => {
				L_(e, "selfedge", {
					width: t.label.width,
					height: t.label.height,
					rank: i.rank,
					order: r + ++n,
					e: t.e,
					edgeLabel: t.label
				}, "_se"), (!Array.isArray(t.label.points) || t.label.points.length !== 7) && (t.label.points = [
					{
						x: 0,
						y: -10
					},
					{
						x: 0,
						y: -10
					},
					{
						x: 0,
						y: 0
					},
					{
						x: 0,
						y: 10
					},
					{
						x: 0,
						y: 10
					},
					{
						x: 0,
						y: 0
					},
					{
						x: 0,
						y: 0
					}
				]);
			}), delete i.selfEdges;
		});
	});
}
function Db(e) {
	e.nodes().forEach((t) => {
		let n = e.node(t), r = (e) => typeof e == "number" && isFinite(e);
		if (n.dummy === "selfedge") {
			let i = n, a = e.node(i.e.v), o = r(a?.x) ? a.x : 0, s = r(a?.y) ? a.y : 0, c = r(a?.width) ? a.width : 0, l = r(a?.height) ? a.height : 0, u = r(n.x) ? n.x : o, d = r(n.y) ? n.y : s, f = c / 2, p = l / 2;
			i.edgeLabel.points = [
				{
					x: u + f,
					y: d - p
				},
				{
					x: u + f,
					y: d - p
				},
				{
					x: u,
					y: d
				},
				{
					x: u - f,
					y: d + p
				},
				{
					x: u - f,
					y: d + p
				},
				{
					x: u,
					y: d
				},
				{
					x: u,
					y: d
				}
			], i.edgeLabel.x = u, i.edgeLabel.y = d, e.setEdge(i.e, i.edgeLabel), e.removeNode(t);
		} else n && Array.isArray(n.selfEdges) && n.selfEdges.forEach((e) => {
			if (!Array.isArray(e.label.points) || e.label.points.length !== 7) {
				let t = r(n.x) ? n.x : 0, i = r(n.y) ? n.y : 0, a = r(n.width) ? n.width : 0, o = r(n.height) ? n.height : 0, s = a / 2, c = o / 2;
				e.label.points = [
					{
						x: t + s,
						y: i - c
					},
					{
						x: t + s,
						y: i - c
					},
					{
						x: t,
						y: i
					},
					{
						x: t - s,
						y: i + c
					},
					{
						x: t - s,
						y: i + c
					},
					{
						x: t,
						y: i
					},
					{
						x: t,
						y: i
					}
				];
			}
		});
	});
}
function Ob(e, t) {
	return nv(tv(e, t), Number);
}
function kb(e) {
	let t = {};
	return e && Object.entries(e).forEach(([e, n]) => {
		typeof e == "string" && (e = e.toLowerCase()), t[e] = n;
	}), t;
}
function Ab(e) {
	let t = V_(e), n = new I_({
		compound: !0,
		multigraph: !0
	}).setGraph({});
	return e.nodes().forEach((t) => {
		n.setNode(t, { label: t }), n.setParent(t, "layer" + e.node(t).rank);
	}), e.edges().forEach((e) => n.setEdge(e.v, e.w, {}, e.name)), t.forEach((e, t) => {
		let r = "layer" + t;
		n.setNode(r, { rank: "same" }), e.reduce((e, t) => (n.setEdge(e, t, { style: "invis" }), t));
	}), n;
}
var jb = {
	graphlib: Zg,
	version: ov,
	layout: nb,
	debug: Ab,
	util: {
		time: X_,
		notime: Z_
	}
}, Mb = 4, Nb = 220, Pb = 120, Fb = 180, Ib = 56, Lb = 90, Rb = 60;
function zb(e) {
	let t = e.pos;
	if (typeof t != "string") return null;
	let n = t.split(",");
	if (n.length !== 2) return null;
	let r = Number(n[0]), i = Number(n[1]);
	return Number.isNaN(r) || Number.isNaN(i) ? null : {
		x: r,
		y: i
	};
}
function Bb(e) {
	return {
		x: e % Mb * Nb,
		y: Math.floor(e / Mb) * Pb
	};
}
function Vb(e, t, n) {
	let r = new jb.graphlib.Graph();
	r.setGraph({
		rankdir: n,
		nodesep: Rb,
		ranksep: Lb
	}), r.setDefaultEdgeLabel(() => ({}));
	for (let t of e) r.setNode(t, {
		width: Fb,
		height: Ib
	});
	let i = new Set(e);
	for (let e of t) i.has(e.from) && i.has(e.to) && r.setEdge(e.from, e.to);
	jb.layout(r);
	let a = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = r.node(t);
		a.set(t, {
			x: e.x - Fb / 2,
			y: e.y - Ib / 2
		});
	}
	return a;
}
function Hb(e, t = [], n = {}) {
	let r = e.map((e) => zb(e.attrs)), i = e.length > 0 && t.length > 0 && r.every((e) => e === null), a = typeof n.rankdir == "string" ? n.rankdir : "TB", o = i ? Vb(e.map((e) => e.id), t, a) : null;
	return e.map((e, t) => ({
		id: e.id,
		type: "workflow",
		position: r[t] ?? o?.get(e.id) ?? Bb(t),
		style: Ig(e.node_type),
		data: {
			label: e.label ?? e.id,
			nodeType: e.node_type,
			attrs: e.attrs
		}
	}));
}
function Ub(e) {
	return e.map((e, t) => ({
		id: `${e.from}->${e.to}#${t}`,
		source: e.from,
		target: e.to,
		label: e.label ?? void 0,
		type: "workflow",
		markerEnd: { type: Od.ArrowClosed },
		data: {
			condition: e.condition,
			priority: e.priority,
			loopRestart: e.loop_restart,
			attrs: e.attrs
		}
	}));
}
function Wb(e, t, n, r) {
	return {
		name: e,
		graph_attrs: t,
		nodes: n.map((e) => ({
			id: e.id,
			node_type: e.data.nodeType,
			label: e.data.label,
			attrs: {
				...e.data.attrs,
				pos: `${e.position.x},${e.position.y}`
			}
		})),
		edges: r.map((e) => ({
			from: e.source,
			to: e.target,
			label: e.label ?? null,
			condition: e.data?.condition ?? null,
			priority: e.data?.priority ?? null,
			loop_restart: e.data?.loopRestart ?? !1,
			attrs: e.data?.attrs ?? {}
		}))
	};
}
//#endregion
//#region src/edgeContext.ts
var Gb = "workflow-edge-actions", Kb = "workflow-flow-direction", qb = /* @__PURE__ */ q("<button type=\"button\" class=\"workflow-edge-delete svelte-gcuyl7\" aria-label=\"Delete edge\">×</button>"), Jb = /* @__PURE__ */ q("<!> <!>", 1), Yb = {
	hash: "svelte-gcuyl7",
	code: ".workflow-edge-delete-label {pointer-events:all;}.workflow-edge-delete.svelte-gcuyl7 {display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid #ef4444;background:#fff;color:#ef4444;font-size:0.8rem;line-height:1;cursor:pointer;padding:0;}.workflow-edge-delete.svelte-gcuyl7:hover {background:#ef4444;color:#fff;}"
};
function Xb(e, t) {
	N(t, !0), ji(e, Yb);
	let n = Z(t, "id", 7), r = Z(t, "sourceX", 7), i = Z(t, "sourceY", 7), a = Z(t, "targetX", 7), o = Z(t, "targetY", 7), s = Z(t, "sourcePosition", 7), c = Z(t, "targetPosition", 7), l = Z(t, "markerStart", 7), u = Z(t, "markerEnd", 7), d = Z(t, "style", 7), f = Z(t, "selected", 7), p = Z(t, "label", 7), m = Z(t, "labelStyle", 7), h = Z(t, "interactionWidth", 7), g = et(Gb), _ = /* @__PURE__ */ F(() => g?.hoveredEdgeId === n()), v = /* @__PURE__ */ F(() => K(_) || f()), y = /* @__PURE__ */ F(() => Mf({
		sourceX: r(),
		sourceY: i(),
		targetX: a(),
		targetY: o(),
		sourcePosition: s(),
		targetPosition: c()
	})), b = /* @__PURE__ */ F(() => x(K(y), 3)), S = /* @__PURE__ */ F(() => K(b)[0]), C = /* @__PURE__ */ F(() => K(b)[1]), w = /* @__PURE__ */ F(() => K(b)[2]);
	function T(e) {
		e.stopPropagation(), g?.onDeleteEdge(n());
	}
	var E = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), L();
		},
		get sourceX() {
			return r();
		},
		set sourceX(e) {
			r(e), L();
		},
		get sourceY() {
			return i();
		},
		set sourceY(e) {
			i(e), L();
		},
		get targetX() {
			return a();
		},
		set targetX(e) {
			a(e), L();
		},
		get targetY() {
			return o();
		},
		set targetY(e) {
			o(e), L();
		},
		get sourcePosition() {
			return s();
		},
		set sourcePosition(e) {
			s(e), L();
		},
		get targetPosition() {
			return c();
		},
		set targetPosition(e) {
			c(e), L();
		},
		get markerStart() {
			return l();
		},
		set markerStart(e) {
			l(e), L();
		},
		get markerEnd() {
			return u();
		},
		set markerEnd(e) {
			u(e), L();
		},
		get style() {
			return d();
		},
		set style(e) {
			d(e), L();
		},
		get selected() {
			return f();
		},
		set selected(e) {
			f(e), L();
		},
		get label() {
			return p();
		},
		set label(e) {
			p(e), L();
		},
		get labelStyle() {
			return m();
		},
		set labelStyle(e) {
			m(e), L();
		},
		get interactionWidth() {
			return h();
		},
		set interactionWidth(e) {
			h(e), L();
		}
	}, D = Jb(), ee = V(D);
	Om(ee, {
		get id() {
			return n();
		},
		get path() {
			return K(S);
		},
		get markerStart() {
			return l();
		},
		get markerEnd() {
			return u();
		},
		get style() {
			return d();
		},
		get label() {
			return p();
		},
		get labelStyle() {
			return m();
		},
		get interactionWidth() {
			return h();
		}
	});
	var te = H(ee, 2), ne = (e) => {
		wm(e, {
			get x() {
				return K(C);
			},
			get y() {
				return K(w);
			},
			class: "workflow-edge-delete-label",
			children: (e, t) => {
				var r = qb();
				U(() => X(r, "data-testid", `edge-delete-${n() ?? ""}`)), Fr("click", r, T), J(e, r);
			},
			$$slots: { default: !0 }
		});
	};
	return Y(te, (e) => {
		K(v) && e(ne);
	}), J(e, D), P(E);
}
Ir(["click"]), Q(Xb, {
	id: {},
	sourceX: {},
	sourceY: {},
	targetX: {},
	targetY: {},
	sourcePosition: {},
	targetPosition: {},
	markerStart: {},
	markerEnd: {},
	style: {},
	selected: {},
	label: {},
	labelStyle: {},
	interactionWidth: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/WorkflowNode.svelte
var Zb = /* @__PURE__ */ q("<!> <!> <!> <!>", 1), Qb = /* @__PURE__ */ q("<!> ", 1), $b = {
	hash: "svelte-162ke3q",
	code: "\n  /* @xyflow/svelte/dist/style.css only styles the built-in\n     `.svelte-flow__node-default` (plus input/output/group) -- a custom\n     node's own `.svelte-flow__node-workflow` class gets none of that\n     padding/border-radius/width/text-align/border/background look, so it's\n     replicated here verbatim (same source values, style.css's own\n     `.svelte-flow__node-default` rule) rather than silently regressing to\n     an unstyled box now that per-kind coloring (nodeConfig.ts's\n     nodeStyleFor) depends on this node rendering as a card in the first\n     place. :global() is required -- this class is applied by SvelteFlow's\n     own NodeWrapper, not this component's template. */.svelte-flow__node-workflow {padding:10px;border-radius:var(--xy-node-border-radius, var(--xy-node-border-radius-default));width:150px;font-size:12px;color:var(--xy-node-color, var(--xy-node-color-default));text-align:center;border:var(--xy-node-border, var(--xy-node-border-default));background-color:var(--xy-node-background-color, var(--xy-node-background-color-default));}.svelte-flow__node-workflow.selectable:hover {box-shadow:var(--xy-node-boxshadow-hover, var(--xy-node-boxshadow-hover-default));}.svelte-flow__node-workflow.selectable.selected,\n  .svelte-flow__node-workflow.selectable:focus,\n  .svelte-flow__node-workflow.selectable:focus-visible {outline:none;border:var(--xy-node-border-selected, var(--xy-node-border-selected-default));}"
};
function ex(e, t) {
	N(t, !0), ji(e, $b);
	let n = Z(t, "data", 7), r = et(Kb), i = /* @__PURE__ */ F(() => r?.rankdir === "LR" || r?.rankdir === "RL");
	var a = {
		get data() {
			return n();
		},
		set data(e) {
			n(e), L();
		}
	}, o = Qb(), s = V(o), c = (e) => {
		var t = Zb(), n = V(t);
		om(n, {
			type: "source",
			id: "right",
			get position() {
				return $.Right;
			}
		});
		var r = H(n, 2);
		om(r, {
			type: "target",
			id: "left",
			get position() {
				return $.Left;
			}
		});
		var i = H(r, 2);
		om(i, {
			type: "source",
			id: "bottom",
			get position() {
				return $.Bottom;
			}
		}), om(H(i, 2), {
			type: "target",
			id: "top",
			get position() {
				return $.Top;
			}
		}), J(e, t);
	}, l = (e) => {
		var t = Zb(), n = V(t);
		om(n, {
			type: "source",
			id: "bottom",
			get position() {
				return $.Bottom;
			}
		});
		var r = H(n, 2);
		om(r, {
			type: "target",
			id: "top",
			get position() {
				return $.Top;
			}
		});
		var i = H(r, 2);
		om(i, {
			type: "source",
			id: "right",
			get position() {
				return $.Right;
			}
		}), om(H(i, 2), {
			type: "target",
			id: "left",
			get position() {
				return $.Left;
			}
		}), J(e, t);
	};
	Y(s, (e) => {
		K(i) ? e(c) : e(l, -1);
	});
	var u = H(s);
	return U(() => oi(u, ` ${n()?.label ?? ""}`)), J(e, o), P(a);
}
Q(ex, { data: {} }, [], [], { mode: "open" });
//#endregion
//#region src/EdgeForm.svelte
var tx = /* @__PURE__ */ q("<p class=\"node-form-error\" role=\"alert\" data-testid=\"edge-priority-error\"> </p>"), nx = /* @__PURE__ */ q("<div class=\"node-form\" data-testid=\"edge-form\"><label class=\"node-form-field\">Condition <input type=\"text\" data-testid=\"edge-condition\" placeholder=\"e.g. x > 5 (falls back to this edge's label if blank)\"/></label> <label class=\"node-form-field\">Priority <input type=\"text\" inputmode=\"numeric\" data-testid=\"edge-priority\" placeholder=\"e.g. 1\"/></label> <!> <label class=\"node-form-field node-form-field-inline\"><input type=\"checkbox\" data-testid=\"edge-loop-restart\"/> Loop restart</label></div>");
function rx(e, t) {
	N(t, !0);
	let n = Z(t, "condition", 7), r = Z(t, "priority", 7), i = Z(t, "loopRestart", 7), a = Z(t, "onChange", 7), o = /* @__PURE__ */ R(sn(Er(() => n() ?? ""))), s = /* @__PURE__ */ R(sn(Er(() => r() === null ? "" : String(r())))), c = /* @__PURE__ */ R(null), l = /* @__PURE__ */ R(sn(Er(() => i())));
	function u(e) {
		z(o, e.target.value, !0), a()({ condition: K(o).trim() ? K(o) : null });
	}
	function d(e) {
		z(s, e.target.value, !0);
		let t = K(s).trim();
		if (!t) {
			z(c, null), a()({ priority: null });
			return;
		}
		if (!/^-?\d+$/.test(t)) {
			z(c, "priority must be a whole number");
			return;
		}
		z(c, null), a()({ priority: Number(t) });
	}
	function f(e) {
		z(l, e.target.checked, !0), a()({ loopRestart: K(l) });
	}
	var p = {
		get condition() {
			return n();
		},
		set condition(e) {
			n(e), L();
		},
		get priority() {
			return r();
		},
		set priority(e) {
			r(e), L();
		},
		get loopRestart() {
			return i();
		},
		set loopRestart(e) {
			i(e), L();
		},
		get onChange() {
			return a();
		},
		set onChange(e) {
			a(e), L();
		}
	}, m = nx(), h = B(m), g = H(B(h));
	ca(g), M(h);
	var _ = H(h, 2), v = H(B(_));
	ca(v), M(_);
	var y = H(_, 2), b = (e) => {
		var t = tx(), n = vn(t, !0);
		U(() => oi(n, K(c))), J(e, t);
	};
	Y(y, (e) => {
		K(c) && e(b);
	});
	var x = H(y, 2), S = B(x);
	return ca(S), Ee(), M(x), M(m), U(() => {
		la(g, K(o)), la(v, K(s)), ua(S, K(l));
	}), Fr("input", g, u), Fr("input", v, d), Fr("change", S, f), J(e, m), P(p);
}
Ir(["input", "change"]), Q(rx, {
	condition: {},
	priority: {},
	loopRestart: {},
	onChange: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/nodeForms/CodergenForm.svelte
var ix = /* @__PURE__ */ q("<div class=\"node-form\" data-testid=\"codergen-form\"><label class=\"node-form-field\">Prompt <textarea data-testid=\"codergen-prompt\" rows=\"4\"></textarea></label> <label class=\"node-form-field\">Model <input type=\"text\" data-testid=\"codergen-model\" placeholder=\"e.g. claude-sonnet-4-5 (optional override)\"/></label></div>");
function ax(e, t) {
	N(t, !0);
	let n = Z(t, "attrs", 7), r = Z(t, "onChange", 7), i = /* @__PURE__ */ R(sn(Er(() => typeof n().prompt == "string" ? n().prompt : ""))), a = /* @__PURE__ */ R(sn(Er(() => typeof n().model == "string" ? n().model : "")));
	function o(e) {
		z(i, e.target.value, !0), r()({ attrs: { prompt: K(i) || void 0 } });
	}
	function s(e) {
		z(a, e.target.value, !0), r()({ attrs: { model: K(a) || void 0 } });
	}
	var c = {
		get attrs() {
			return n();
		},
		set attrs(e) {
			n(e), L();
		},
		get onChange() {
			return r();
		},
		set onChange(e) {
			r(e), L();
		}
	}, l = ix(), u = B(l), d = H(B(u));
	mt(d), M(u);
	var f = H(u, 2), p = H(B(f));
	return ca(p), M(f), M(l), U(() => {
		la(d, K(i)), la(p, K(a));
	}), Fr("input", d, o), Fr("input", p, s), J(e, l), P(c);
}
Ir(["input"]), Q(ax, {
	attrs: {},
	onChange: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/nodeForms/InterviewerForm.svelte
var ox = /* @__PURE__ */ q("<label class=\"node-form-field\">Candidate count <input type=\"text\" data-testid=\"interviewer-candidate-count\" placeholder=\"e.g. 3 or phase_default(discover)\"/> <span class=\"node-form-hint\">Read by the gallery dashboard card only, not the interviewer step itself.</span></label>"), sx = /* @__PURE__ */ q("<label class=\"node-form-field\">Options (comma-separated) <input type=\"text\" data-testid=\"interviewer-options\" placeholder=\"e.g. approve, revise, reject\"/></label>"), cx = /* @__PURE__ */ q("<div class=\"node-form\" data-testid=\"interviewer-form\"><label class=\"node-form-field\">Question <textarea data-testid=\"interviewer-question\" rows=\"3\"></textarea></label> <label class=\"node-form-field node-form-field-inline\"><input type=\"checkbox\" data-testid=\"interviewer-gallery-toggle\"/> Gallery gate</label> <!> <label class=\"node-form-field\">Answer mode <select data-testid=\"interviewer-answer-mode\"><option>Free-form</option><option>Yes / No</option><option>Options list</option></select></label> <!></div>");
function lx(e, t) {
	N(t, !0);
	let n = Z(t, "attrs", 7), r = Z(t, "onChange", 7);
	function i(e) {
		return e.approve === !0 ? "approve" : typeof e.options == "string" ? "options" : "freeform";
	}
	function a(e) {
		return e.gallery === !0 || e.gallery === "true";
	}
	let o = Er(() => {
		let e = i(n());
		return {
			question: typeof n().question == "string" ? n().question : "",
			answerMode: e,
			gallery: a(n()) && e === "freeform",
			candidateCount: typeof n().candidate_count == "string" ? n().candidate_count : typeof n().candidate_count == "number" ? String(n().candidate_count) : "",
			optionsText: typeof n().options == "string" ? n().options : ""
		};
	}), s = /* @__PURE__ */ R(sn(o.question)), c = /* @__PURE__ */ R(sn(o.answerMode)), l = /* @__PURE__ */ R(sn(o.gallery)), u = /* @__PURE__ */ R(sn(o.candidateCount)), d = /* @__PURE__ */ R(sn(o.optionsText));
	function f(e) {
		z(s, e.target.value, !0), r()({ attrs: { question: K(s) || void 0 } });
	}
	function p(e) {
		z(l, e.target.checked, !0), r()({ attrs: {
			gallery: K(l) || void 0,
			candidate_count: K(l) && K(u) || void 0
		} });
	}
	function m(e) {
		z(u, e.target.value, !0), r()({ attrs: { candidate_count: K(u) || void 0 } });
	}
	function h(e) {
		z(c, e.target.value, !0), K(c) !== "freeform" && K(l) && z(l, !1), r()({ attrs: {
			approve: K(c) === "approve" || void 0,
			options: K(c) === "options" && K(d) || void 0,
			gallery: K(c) === "freeform" && K(l) ? !0 : void 0,
			candidate_count: K(c) === "freeform" && K(l) && K(u) || void 0
		} });
	}
	function g(e) {
		z(d, e.target.value, !0), r()({ attrs: { options: K(d) || void 0 } });
	}
	var _ = {
		get attrs() {
			return n();
		},
		set attrs(e) {
			n(e), L();
		},
		get onChange() {
			return r();
		},
		set onChange(e) {
			r(e), L();
		}
	}, v = cx(), y = B(v), b = H(B(y));
	mt(b), M(y);
	var x = H(y, 2), S = B(x);
	ca(S), Ee(), M(x);
	var C = H(x, 2), w = (e) => {
		var t = ox(), n = H(B(t));
		ca(n), Ee(2), M(t), U(() => la(n, K(u))), Fr("input", n, m), J(e, t);
	};
	Y(C, (e) => {
		K(l) && e(w);
	});
	var T = H(C, 2), E = H(B(T)), D = B(E);
	D.value = D.__value = "freeform";
	var ee = H(D);
	ee.value = ee.__value = "approve";
	var te = H(ee);
	te.value = te.__value = "options", M(E);
	var ne;
	Yi(E), M(T);
	var re = H(T, 2), ie = (e) => {
		var t = sx(), n = H(B(t));
		ca(n), M(t), U(() => la(n, K(d))), Fr("input", n, g), J(e, t);
	};
	return Y(re, (e) => {
		K(c) === "options" && e(ie);
	}), M(v), U(() => {
		la(b, K(s)), ua(S, K(l)), S.disabled = K(c) !== "freeform", E.disabled = K(l), ne !== (ne = K(c)) && (E.value = (E.__value = ne) ?? "", Ji(E, ne));
	}), Fr("input", b, f), Fr("change", S, p), Fr("change", E, h), J(e, v), P(_);
}
Ir(["input", "change"]), Q(lx, {
	attrs: {},
	onChange: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/nodeForms/ToolForm.svelte
var ux = /* @__PURE__ */ q("<option> </option>"), dx = /* @__PURE__ */ q("<p class=\"node-form-hint\"> </p>"), fx = /* @__PURE__ */ q("<label class=\"node-form-field\">Custom tool name <input type=\"text\" data-testid=\"tool-name\" placeholder=\"e.g. shell\"/></label>"), px = /* @__PURE__ */ q("<p class=\"node-form-error\" role=\"alert\" data-testid=\"tool-args-error\"> </p>"), mx = /* @__PURE__ */ q("<div class=\"node-form\" data-testid=\"tool-form\"><label class=\"node-form-field\">Tool <select data-testid=\"tool-select\"><option>Select a tool…</option><!><option>Custom…</option></select></label> <!> <!> <label class=\"node-form-field\">Args (JSON) <textarea data-testid=\"tool-args\" rows=\"4\"></textarea></label> <!></div>");
function hx(e, t) {
	N(t, !0);
	let n = [
		{
			value: "render_capture",
			description: "Render a candidate and capture a screenshot/manifest."
		},
		{
			value: "system_lint",
			description: "Run the design-system lint check against a candidate."
		},
		{
			value: "task_critic",
			description: "Run a persona-based usability critique of a candidate."
		},
		{
			value: "synthesis",
			description: "Synthesise prior critiques into a single summary."
		}
	], r = "__custom__";
	function i(e) {
		return n.some((t) => t.value === e);
	}
	let a = Z(t, "attrs", 7), o = Z(t, "onChange", 7), s = /* @__PURE__ */ R(sn(Er(() => typeof a().tool == "string" ? a().tool : ""))), c = /* @__PURE__ */ R(sn(Er(() => typeof a().args == "string" ? a().args : ""))), l = /* @__PURE__ */ R(sn(Er(() => p(K(c))))), u = /* @__PURE__ */ R(sn(Er(() => K(s) && !i(K(s)) ? r : K(s)))), d = /* @__PURE__ */ F(() => K(u) === r), f = /* @__PURE__ */ F(() => n.find((e) => e.value === K(u)));
	function p(e) {
		let t = e.trim();
		if (!t) return null;
		try {
			return JSON.parse(t), null;
		} catch (e) {
			return e instanceof Error ? e.message : "invalid JSON";
		}
	}
	function m(e) {
		z(s, e, !0), o()({ attrs: { tool: K(s) || void 0 } });
	}
	function h(e) {
		let t = e.target.value;
		z(u, t, !0), m(t === r ? K(s) && !i(K(s)) ? K(s) : "" : t);
	}
	function g(e) {
		m(e.target.value);
	}
	function _(e) {
		z(c, e.target.value, !0), z(l, p(K(c)), !0), o()({ attrs: { args: K(c).trim() ? K(c) : void 0 } });
	}
	var v = {
		get attrs() {
			return a();
		},
		set attrs(e) {
			a(e), L();
		},
		get onChange() {
			return o();
		},
		set onChange(e) {
			o(e), L();
		}
	}, y = mx(), b = B(y), x = H(B(b)), S = B(x);
	S.value = S.__value = "";
	var C = H(S);
	wi(C, 17, () => n, (e) => e.value, (e, t) => {
		var n = ux(), r = vn(n, !0), i = {};
		U(() => {
			oi(r, K(t).value), i !== (i = K(t).value) && (n.value = (n.__value = i) ?? "");
		}), J(e, n);
	});
	var w = H(C);
	w.value = w.__value = r, M(x);
	var T;
	Yi(x), M(b);
	var E = H(b, 2), D = (e) => {
		var t = dx(), n = vn(t, !0);
		U(() => oi(n, K(f).description)), J(e, t);
	};
	Y(E, (e) => {
		K(f) && e(D);
	});
	var ee = H(E, 2), te = (e) => {
		var t = fx(), n = H(B(t));
		ca(n), M(t), U(() => la(n, K(s))), Fr("input", n, g), J(e, t);
	};
	Y(ee, (e) => {
		K(d) && e(te);
	});
	var ne = H(ee, 2), re = H(B(ne));
	mt(re), M(ne);
	var ie = H(ne, 2), ae = (e) => {
		var t = px(), n = vn(t);
		U(() => oi(n, `Invalid JSON: ${K(l) ?? ""}`)), J(e, t);
	};
	return Y(ie, (e) => {
		K(l) && e(ae);
	}), M(y), U(() => {
		T !== (T = K(u)) && (x.value = (x.__value = T) ?? "", Ji(x, T)), la(re, K(c));
	}), Fr("change", x, h), Fr("input", re, _), J(e, y), P(v);
}
Ir(["change", "input"]), Q(hx, {
	attrs: {},
	onChange: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/nodeForms/ManagerForm.svelte
var gx = /* @__PURE__ */ q("<option></option>"), _x = /* @__PURE__ */ q("<p class=\"node-form-error\" role=\"alert\" data-testid=\"manager-config-error\"> </p>"), vx = /* @__PURE__ */ q("<div class=\"node-form\" data-testid=\"manager-form\"><label class=\"node-form-field\">Task <input type=\"text\" data-testid=\"manager-task\" list=\"manager-task-suggestions\" placeholder=\"e.g. coordinate-review\"/> <datalist id=\"manager-task-suggestions\"></datalist></label> <p class=\"node-form-hint\">A free-text description of the coordination task, sent to the LLM as-is -- the suggestions above are starting points, not fixed options.</p> <label class=\"node-form-field\">Config (JSON) <textarea data-testid=\"manager-config\" rows=\"4\"></textarea></label> <!></div>");
function yx(e, t) {
	N(t, !0);
	let n = [
		"coordinate-review",
		"delegate-subtask",
		"aggregate-results",
		"escalate-to-human"
	], r = Z(t, "attrs", 7), i = Z(t, "onChange", 7), a = /* @__PURE__ */ R(sn(Er(() => typeof r().task == "string" ? r().task : ""))), o = /* @__PURE__ */ R(sn(Er(() => typeof r().config == "string" ? r().config : ""))), s = /* @__PURE__ */ R(sn(Er(() => c(K(o)))));
	function c(e) {
		let t = e.trim();
		if (!t) return null;
		try {
			return JSON.parse(t), null;
		} catch (e) {
			return e instanceof Error ? e.message : "invalid JSON";
		}
	}
	function l(e) {
		z(a, e.target.value, !0), i()({ attrs: { task: K(a) || void 0 } });
	}
	function u(e) {
		z(o, e.target.value, !0), z(s, c(K(o)), !0), i()({ attrs: { config: K(o).trim() ? K(o) : void 0 } });
	}
	var d = {
		get attrs() {
			return r();
		},
		set attrs(e) {
			r(e), L();
		},
		get onChange() {
			return i();
		},
		set onChange(e) {
			i(e), L();
		}
	}, f = vx(), p = B(f), m = H(B(p));
	ca(m);
	var h = H(m, 2);
	wi(h, 20, () => n, (e) => e, (e, t) => {
		var n = gx(), r = {};
		U(() => {
			r !== (r = t) && (n.value = (n.__value = r) ?? "");
		}), J(e, n);
	}), M(h), M(p);
	var g = H(p, 4), _ = H(B(g));
	mt(_), M(g);
	var v = H(g, 2), y = (e) => {
		var t = _x(), n = vn(t);
		U(() => oi(n, `Invalid JSON: ${K(s) ?? ""}`)), J(e, t);
	};
	return Y(v, (e) => {
		K(s) && e(y);
	}), M(f), U(() => {
		la(m, K(a)), la(_, K(o));
	}), Fr("input", m, l), Fr("input", _, u), J(e, f), P(d);
}
Ir(["input"]), Q(yx, {
	attrs: {},
	onChange: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/nodeForms/SubPipelineForm.svelte
var bx = /* @__PURE__ */ q("<div class=\"node-form\" data-testid=\"sub-pipeline-form\"><label class=\"node-form-field\">Pipeline file <input type=\"text\" data-testid=\"sub-pipeline-path\" placeholder=\"e.g. examples/sub_flow.dot\"/></label></div>");
function xx(e, t) {
	N(t, !0);
	let n = Z(t, "attrs", 7), r = Z(t, "onChange", 7), i = /* @__PURE__ */ R(sn(Er(() => typeof n().pipeline == "string" ? n().pipeline : "")));
	function a(e) {
		z(i, e.target.value, !0), r()({ attrs: { pipeline: K(i) || void 0 } });
	}
	var o = {
		get attrs() {
			return n();
		},
		set attrs(e) {
			n(e), L();
		},
		get onChange() {
			return r();
		},
		set onChange(e) {
			r(e), L();
		}
	}, s = bx(), c = B(s), l = H(B(c));
	return ca(l), M(c), M(s), U(() => la(l, K(i))), Fr("input", l, a), J(e, s), P(o);
}
Ir(["input"]), Q(xx, {
	attrs: {},
	onChange: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/nodeForms/StructuralForm.svelte
var Sx = /* @__PURE__ */ q("<div class=\"node-form\" data-testid=\"structural-form\"><p class=\"node-form-hint\">This node kind has no additional fields beyond its label.</p></div>");
function Cx(e, t) {
	N(t, !0);
	let n = Z(t, "attrs", 7), r = Z(t, "onChange", 7);
	return J(e, Sx()), P({
		get attrs() {
			return n();
		},
		set attrs(e) {
			n(e), L();
		},
		get onChange() {
			return r();
		},
		set onChange(e) {
			r(e), L();
		}
	});
}
Q(Cx, {
	attrs: {},
	onChange: {}
}, [], [], { mode: "open" });
//#endregion
//#region src/WorkflowCanvasInner.svelte
var wx = /* @__PURE__ */ q("<option> </option>"), Tx = /* @__PURE__ */ q("<div class=\"create-workflow-fields\" style=\"display: flex; gap: 0.75rem; align-items: flex-end; padding-bottom: 0.5rem;\"><label style=\"display: flex; flex-direction: column; font-size: 0.85rem;\">Name <input type=\"text\" data-testid=\"create-name-input\" placeholder=\"my-pipeline\"/></label> <label style=\"display: flex; flex-direction: column; font-size: 0.85rem;\">Directory <select data-testid=\"create-target-dir-select\"></select></label></div>"), Ex = /* @__PURE__ */ q("<!> <!> <!>", 1), Dx = /* @__PURE__ */ q("<p role=\"alert\" data-testid=\"save-error\"> </p>"), Ox = /* @__PURE__ */ q("<label class=\"node-form-field node-inspector-label-field svelte-14vsbi2\">Label <input type=\"text\" data-testid=\"node-inspector-label\" class=\"svelte-14vsbi2\"/></label> <!>", 1), kx = /* @__PURE__ */ q("<aside class=\"node-inspector svelte-14vsbi2\" data-testid=\"node-inspector\"><div class=\"node-inspector-header svelte-14vsbi2\"><span class=\"node-inspector-title svelte-14vsbi2\" data-testid=\"node-inspector-title\"> </span> <button type=\"button\" class=\"node-inspector-close svelte-14vsbi2\" aria-label=\"Close node inspector\">×</button></div> <p class=\"node-inspector-description svelte-14vsbi2\" data-testid=\"node-inspector-description\"> </p> <!></aside>"), Ax = /* @__PURE__ */ q("<aside class=\"node-inspector svelte-14vsbi2\" data-testid=\"edge-inspector\"><div class=\"node-inspector-header svelte-14vsbi2\"><span class=\"node-inspector-title svelte-14vsbi2\" data-testid=\"edge-inspector-title\">Edge</span> <button type=\"button\" class=\"node-inspector-close svelte-14vsbi2\" aria-label=\"Close edge inspector\">×</button></div> <!></aside>"), jx = /* @__PURE__ */ q("<div class=\"workflow-canvas-root\" style=\"width: 100%; height: 100%; min-height: 480px; display: flex; flex-direction: row;\"><!> <div class=\"workflow-canvas-main\" style=\"flex: 1; min-width: 0; display: flex; flex-direction: column;\"><!> <div class=\"canvas-area\" style=\"flex: 1; position: relative;\" role=\"region\" aria-label=\"Workflow canvas drop zone\"><!></div> <button type=\"button\" data-testid=\"save-button\"> </button> <!></div> <!></div>"), Mx = {
	hash: "svelte-14vsbi2",
	code: "\n  /* Connection handles dim (not fully hidden -- an earlier revision hid\n     them at opacity 0 until hover, which made it impossible to discover\n     where a connection could even be dragged from) until the owning node\n     is hovered, brightened to full opacity with a plain opacity\n     transition; a node that has at least one edge (wf-node-connected,\n     computed in this file's `connectedNodeIds` $effect above) keeps its\n     handles visibly accent-colored even without hovering, so a \"wired up\"\n     node reads as such at a glance instead of needing a hover to confirm.\n     :global() is required here -- these elements are rendered by @xyflow/\n     svelte's own child components (DefaultNode/Handle.svelte), not by this\n     component's own template, so Svelte's default per-component style\n     scoping never reaches them. */.svelte-flow__handle {opacity:0.45;transition:opacity 0.15s ease,\n      background-color 0.15s ease,\n      border-color 0.15s ease;}.svelte-flow__node:hover .svelte-flow__handle,\n  .svelte-flow__node.selected .svelte-flow__handle {opacity:1;}.svelte-flow__node.wf-node-connected .svelte-flow__handle {opacity:1;background-color:#3b82f6;border-color:#3b82f6;}\n\n  /* Edge lines default to Svelte Flow's own pale-gray 1px stroke\n     (--xy-edge-stroke-default: #b1b1b7), which is nearly invisible against\n     this app's light canvas background -- a loaded graph with every node\n     genuinely connected read as a disconnected grid of boxes because the\n     lines joining them couldn't be seen. Overriding the library's own\n     theming variables (rather than hand-styling every edge path) keeps\n     hover/selected states, arrowheads, etc. all still driven by the one\n     source of truth. */.svelte-flow {--xy-edge-stroke-default: #64748b;--xy-edge-stroke-width-default: 2;--xy-edge-stroke-selected-default: #3b82f6;}\n\n  /* @xyflow/svelte 1.6.6's own base.css gives `.svelte-flow__viewport` and\n     `.svelte-flow__pane` real dimensions via a shared `.svelte-flow__container`\n     class (`width: 100%; height: 100%`), but never gives `.svelte-flow__edges`\n     (each edge's wrapping <svg class=\"svelte-flow__edge-wrapper\"> included)\n     any sizing at all -- confirmed via computed-style inspection that both\n     collapse to a 0x0 CSS box (absolutely positioned, auto width, no content\n     to shrink-wrap around, so shrink-to-fit resolves to 0). A zero-width or\n     zero-height <svg> is spec'd to not render its content at all, `overflow:\n     visible` or not -- every edge line was being laid out with correct\n     path/stroke data (confirmed via getBoundingClientRect and computed\n     style) yet never painted a single pixel. Sizing both explicitly to fill\n     their real (non-zero) `.svelte-flow__viewport` ancestor fixes rendering\n     without touching the library's own files. */.svelte-flow__edges,\n  svg.svelte-flow__edge-wrapper {width:100%;height:100%;}.node-inspector.svelte-14vsbi2 {width:260px;flex:0 0 260px;overflow-y:auto;border-left:1px solid #e2e8f0;padding:0.6rem;box-sizing:border-box;}.node-inspector-header.svelte-14vsbi2 {display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;}.node-inspector-title.svelte-14vsbi2 {font-weight:600;font-size:0.85rem;color:#1e293b;}.node-inspector-close.svelte-14vsbi2 {background:none;border:none;cursor:pointer;font-size:1rem;line-height:1;color:#64748b;}.node-inspector-description.svelte-14vsbi2 {margin:0 0 0.6rem;font-size:0.78rem;line-height:1.35;color:#64748b;}.node-inspector-label-field.svelte-14vsbi2 {margin-bottom:0.6rem;display:flex;flex-direction:column;gap:0.2rem;font-size:0.8rem;color:#475569;}.node-inspector-label-field.svelte-14vsbi2 input:where(.svelte-14vsbi2) {font:inherit;padding:0.35rem 0.45rem;border:1px solid #cbd5e1;border-radius:4px;color:#1e293b;}"
};
function Nx(e, t) {
	N(t, !0), ji(e, Mx);
	let n = { workflow: Xb }, r = { workflow: ex };
	function i(e) {
		switch (e) {
			case "Codergen": return ax;
			case "Interviewer": return lx;
			case "Tool": return hx;
			case "Manager": return yx;
			case "SubPipeline": return xx;
			default: return Cx;
		}
	}
	let a = Z(t, "graph", 7, void 0), o = Z(t, "workflowId", 7, void 0), s = Z(t, "availableTargetDirs", 23, () => []), c = Z(t, "onSave", 7), l = /* @__PURE__ */ F(() => !o()), u = /* @__PURE__ */ R(""), d = /* @__PURE__ */ R("");
	An(() => {
		!K(d) && s().length > 0 && z(d, s()[0], !0);
	});
	let f = /* @__PURE__ */ R([]), p = /* @__PURE__ */ R([]), m = /* @__PURE__ */ R(null), h = /* @__PURE__ */ R(sn({})), g = /* @__PURE__ */ R(sn({ rankdir: "TB" }));
	tt(Kb, K(g)), An(() => {
		a() && (z(f, Hb(a().nodes, a().edges, a().graph_attrs)), z(p, Ub(a().edges)), z(m, a().name, !0), z(h, a().graph_attrs, !0), K(g).rankdir = typeof a().graph_attrs.rankdir == "string" ? a().graph_attrs.rankdir : "TB");
	});
	function _() {
		return Wb(K(m), K(h), K(f), K(p));
	}
	let v = 0;
	function y(e) {
		let t = e.toLowerCase(), n;
		do
			v += 1, n = `${t}-${v}`;
		while (K(f).some((e) => e.id === n));
		return n;
	}
	function b(e, t) {
		let n = Pg[e];
		if (!n) return;
		let r = {
			id: y(e),
			type: "workflow",
			position: t,
			style: Ig(e),
			data: {
				label: n.title,
				nodeType: e,
				attrs: {}
			}
		};
		z(f, [...K(f), r]);
	}
	let x = /* @__PURE__ */ R(null), S = /* @__PURE__ */ F(() => K(f).find((e) => e.id === K(x)) ?? null), C = /* @__PURE__ */ R(null), w = /* @__PURE__ */ F(() => K(p).find((e) => e.id === K(C)) ?? null);
	function T({ node: e }) {
		z(x, e.id, !0), z(C, null);
	}
	function E({ edge: e }) {
		z(C, e.id, !0), z(x, null);
	}
	function D(e) {
		let t = K(p).find((t) => t.id === e);
		t && E({ edge: t });
	}
	function ee() {
		z(x, null), z(C, null);
	}
	let te = /* @__PURE__ */ R(sn({
		hoveredEdgeId: null,
		onDeleteEdge: (e) => {
			z(p, K(p).filter((t) => t.id !== e)), K(C) === e && z(C, null);
		}
	}));
	tt(Gb, K(te));
	function ne({ edge: e }) {
		K(te).hoveredEdgeId = e.id;
	}
	function re() {
		K(te).hoveredEdgeId = null;
	}
	let ie = /* @__PURE__ */ F(() => new Set(K(p).flatMap((e) => [e.source, e.target])));
	An(() => {
		let e = K(ie), t = Er(() => K(f)), n = t.map((t) => {
			let n = typeof t.class == "string" ? t.class.replace(/\bwf-node-connected\b/g, "").trim() : "", r = e.has(t.id) ? n ? `${n} wf-node-connected` : "wf-node-connected" : n;
			return (t.class ?? "") === r ? t : {
				...t,
				class: r || void 0
			};
		});
		n.some((e, n) => e !== t[n]) && z(f, n);
	});
	function ae(e, t) {
		z(p, K(p).map((n) => n.id === e ? {
			...n,
			data: {
				condition: t.condition === void 0 ? n.data?.condition ?? null : t.condition,
				priority: t.priority === void 0 ? n.data?.priority ?? null : t.priority,
				loopRestart: t.loopRestart === void 0 ? n.data?.loopRestart ?? !1 : t.loopRestart,
				attrs: n.data?.attrs ?? {}
			}
		} : n));
	}
	function O(e, t) {
		z(f, K(f).map((n) => {
			if (n.id !== e) return n;
			let r = { ...n.data.attrs };
			if (t.attrs) for (let [e, n] of Object.entries(t.attrs)) n === void 0 ? delete r[e] : r[e] = n;
			return {
				...n,
				data: {
					...n.data,
					label: t.label === void 0 ? n.data.label : t.label,
					attrs: r
				}
			};
		}));
	}
	let k;
	function oe(e) {
		e.preventDefault(), e.dataTransfer && (e.dataTransfer.dropEffect = "move");
	}
	function se(e) {
		e.preventDefault();
		let t = e.dataTransfer?.getData(Rg);
		if (!t || !k) return;
		let n = k.getBoundingClientRect();
		b(t, {
			x: e.clientX - n.left,
			y: e.clientY - n.top
		});
	}
	let ce = /* @__PURE__ */ R(!1), le = /* @__PURE__ */ R(null);
	async function ue() {
		z(le, null);
		let e;
		if (K(l)) {
			let t = K(u).trim();
			if (!t) {
				z(le, "workflow name must not be blank");
				return;
			}
			if (!K(d)) {
				z(le, "choose a target directory");
				return;
			}
			e = {
				name: t,
				targetDir: K(d)
			};
		}
		z(ce, !0);
		try {
			await c()(_(), e);
		} catch (e) {
			z(le, e instanceof Error ? e.message : String(e), !0);
		} finally {
			z(ce, !1);
		}
	}
	let de = /* @__PURE__ */ F(() => K(ce) || K(l) && !K(u).trim());
	var fe = {
		currentGraph: _,
		addNodeAtPosition: b,
		selectEdge: D,
		get edgeActions() {
			return K(te);
		},
		set edgeActions(e) {
			z(te, sn(e));
		},
		get graph() {
			return a();
		},
		set graph(e = void 0) {
			a(e), L();
		},
		get workflowId() {
			return o();
		},
		set workflowId(e = void 0) {
			o(e), L();
		},
		get availableTargetDirs() {
			return s();
		},
		set availableTargetDirs(e = []) {
			s(e), L();
		},
		get onSave() {
			return c();
		},
		set onSave(e) {
			c(e), L();
		}
	}, pe = jx(), me = B(pe);
	Kg(me, {});
	var he = H(me, 2), ge = B(he), _e = (e) => {
		var t = Tx(), n = B(t), r = H(B(n));
		ca(r), M(n);
		var i = H(n, 2), a = H(B(i));
		wi(a, 20, s, (e) => e, (e, t) => {
			var n = wx(), r = vn(n, !0), i = {};
			U(() => {
				oi(r, t), i !== (i = t) && (n.value = (n.__value = i) ?? "");
			}), J(e, n);
		}), M(a), Yi(a), M(i), M(t), ga(r, () => K(u), (e) => z(u, e)), Xi(a, () => K(d), (e) => z(d, e)), J(e, t);
	};
	Y(ge, (e) => {
		K(l) && e(_e);
	});
	var ve = H(ge, 2), ye = B(ve);
	{
		let e = /* @__PURE__ */ F(() => ({
			type: "workflow",
			markerEnd: { type: Od.ArrowClosed }
		}));
		Qh(ye, {
			fitView: !0,
			get nodeTypes() {
				return r;
			},
			get edgeTypes() {
				return n;
			},
			get connectionMode() {
				return Cd.Loose;
			},
			get defaultEdgeOptions() {
				return K(e);
			},
			onnodeclick: T,
			onpaneclick: ee,
			onedgeclick: E,
			onedgepointerenter: ne,
			onedgepointerleave: re,
			get nodes() {
				return K(f);
			},
			set nodes(e) {
				z(f, e);
			},
			get edges() {
				return K(p);
			},
			set edges(e) {
				z(p, e);
			},
			children: (e, t) => {
				var n = Ex(), r = V(n);
				Cg(r, {});
				var i = H(r, 2);
				hg(i, {}), Ng(H(i, 2), {}), J(e, n);
			},
			$$slots: { default: !0 }
		});
	}
	M(ve), Sa(ve, (e) => k = e, () => k);
	var be = H(ve, 2), xe = vn(be, !0), Se = H(be, 2), A = (e) => {
		var t = Dx(), n = vn(t, !0);
		U(() => oi(n, K(le))), J(e, t);
	};
	Y(Se, (e) => {
		K(le) && e(A);
	}), M(he);
	var Ce = H(he, 2), j = (e) => {
		let t = /* @__PURE__ */ F(() => K(S)), n = /* @__PURE__ */ F(() => i(K(t).data.nodeType));
		var r = kx(), a = B(r), o = B(a), s = vn(o, !0), c = H(o, 2);
		M(a);
		var l = H(a, 2), u = vn(l, !0);
		yi(H(l, 2), () => K(t).id, (e) => {
			var r = Ox(), i = V(r), a = H(B(i));
			ca(a), M(i), Ai(H(i, 2), () => K(n), (e, n) => {
				n(e, {
					get attrs() {
						return K(t).data.attrs;
					},
					onChange: (e) => O(K(t).id, e)
				});
			}), U(() => la(a, K(t).data.label)), Fr("input", a, (e) => O(K(t).id, { label: e.target.value })), J(e, r);
		}), M(r), U(() => {
			oi(s, Pg[K(t).data.nodeType]?.title ?? K(t).data.nodeType), oi(u, Pg[K(t).data.nodeType]?.description ?? "");
		}), Fr("click", c, () => z(x, null)), J(e, r);
	}, we = (e) => {
		let t = /* @__PURE__ */ F(() => K(w));
		var n = Ax(), r = B(n), i = H(B(r), 2);
		M(r), yi(H(r, 2), () => K(t).id, (e) => {
			{
				let n = /* @__PURE__ */ F(() => K(t).data?.condition ?? null), r = /* @__PURE__ */ F(() => K(t).data?.priority ?? null), i = /* @__PURE__ */ F(() => K(t).data?.loopRestart ?? !1);
				rx(e, {
					get condition() {
						return K(n);
					},
					get priority() {
						return K(r);
					},
					get loopRestart() {
						return K(i);
					},
					onChange: (e) => ae(K(t).id, e)
				});
			}
		}), M(n), Fr("click", i, () => z(C, null)), J(e, n);
	};
	return Y(Ce, (e) => {
		K(S) ? e(j) : K(w) && e(we, 1);
	}), M(pe), U(() => {
		be.disabled = K(de), oi(xe, K(ce) ? "Saving…" : "Save");
	}), Pr("dragover", ve, oe), Pr("drop", ve, se), Fr("click", be, ue), J(e, pe), P(fe);
}
Ir(["click", "input"]), Q(Nx, {
	graph: {},
	workflowId: {},
	availableTargetDirs: {},
	onSave: {}
}, [], [
	"currentGraph",
	"addNodeAtPosition",
	"selectEdge",
	"edgeActions"
], { mode: "open" });
//#endregion
//#region src/api.ts
async function Px(e) {
	if (!e.ok) {
		let t = e.statusText;
		try {
			let n = await e.json();
			typeof n?.error == "string" && (t = n.error);
		} catch {}
		throw Error(t);
	}
	return e.json();
}
function Fx(e, t) {
	return fetch(`/api/workflows/${encodeURIComponent(e)}/graph`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t)
	}).then((e) => Px(e));
}
function Ix(e, t, n) {
	return fetch("/api/workflows/new", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: n,
			target_dir: t,
			graph: e
		})
	}).then((e) => Px(e));
}
//#endregion
//#region src/WorkflowCanvas.svelte
function Lx(e, t) {
	N(t, !0);
	let n = Z(t, "graph", 15, void 0), r = Z(t, "workflowId", 7, void 0), i = Z(t, "availableTargetDirs", 7, void 0), a = /* @__PURE__ */ R(void 0);
	async function o(e, n) {
		if (n) {
			let r = await Ix(e, n.targetDir, n.name);
			t.$$host.dispatchEvent(new CustomEvent("workflow-saved", {
				detail: r,
				bubbles: !0,
				composed: !0
			})), window.location.href = `/workflows/${encodeURIComponent(r.id)}/edit`;
			return;
		}
		if (!r()) throw Error("no workflowId set; cannot save");
		let i = await Fx(r(), e);
		t.$$host.dispatchEvent(new CustomEvent("workflow-saved", {
			detail: i,
			bubbles: !0,
			composed: !0
		}));
	}
	return An(() => {
		Object.assign(t.$$host, { getGraph: () => K(a)?.currentGraph() });
	}), Sa(Nx(e, {
		get graph() {
			return n();
		},
		get workflowId() {
			return r();
		},
		get availableTargetDirs() {
			return i();
		},
		onSave: o
	}), (e) => z(a, e, !0), () => K(a)), P({
		get graph() {
			return n();
		},
		set graph(e = void 0) {
			n(e), L();
		},
		get workflowId() {
			return r();
		},
		set workflowId(e = void 0) {
			r(e), L();
		},
		get availableTargetDirs() {
			return i();
		},
		set availableTargetDirs(e = void 0) {
			i(e), L();
		}
	});
}
customElements.define("workflow-canvas", Q(Lx, {
	graph: {},
	workflowId: {},
	availableTargetDirs: {}
}, [], []));
//#endregion
export { Lx as default };
