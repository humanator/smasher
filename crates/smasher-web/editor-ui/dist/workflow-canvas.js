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
	return we(/* @__PURE__ */ hn(j));
}
function M(t) {
	if (A) {
		if (/* @__PURE__ */ hn(j) !== null) throw be(), e;
		j = t;
	}
}
function Ee(e = 1) {
	if (A) {
		for (var t = e, n = j; t--;) n = /* @__PURE__ */ hn(n);
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
		var i = /* @__PURE__ */ hn(n);
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
var N = null;
function Qe(e) {
	N = e;
}
function $e(e) {
	return Ze(N, "getContext").get(e);
}
function et(e, t) {
	return Ze(N, "setContext").set(e, t), t;
}
function tt(e) {
	return Ze(N, "hasContext").has(e);
}
function P(e, t = !1, n) {
	N = {
		p: N,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: K,
		l: Ge && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	};
}
function F(e) {
	var t = N, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) kn(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, N = t.p, nt(e);
}
function nt(e = {}) {
	return c(e, le, { value: !0 }), e;
}
function rt() {
	return !Ge || N !== null && N.l === null;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/task.js
var it = [];
function at() {
	var e = it;
	it = [], v(e);
}
function ot(e) {
	if (it.length === 0 && !Pt) {
		var t = it;
		queueMicrotask(() => {
			t === it && at();
		});
	}
	it.push(e);
}
function st() {
	for (; it.length > 0;) at();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/status.js
var ct = ~(T | E | w);
function lt(e, t) {
	e.f = e.f & ct | t;
}
function ut(e) {
	e.f & 512 || e.deps === null ? lt(e, w) : lt(e, E);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/utils.js
function dt(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), lt(e, w);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/misc.js
function ft(e, t) {
	if (t) {
		let t = document.body;
		e.autofocus = !0, ot(() => {
			document.activeElement === t && e.focus();
		});
	}
}
var pt = !1;
function mt() {
	pt || (pt = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[ge]?.();
		});
	}, { capture: !0 }));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function ht(e) {
	var t = G, n = K;
	tr(null), nr(null);
	try {
		return e();
	} finally {
		tr(t), nr(n);
	}
}
function gt(e, t, n, r = n) {
	e.addEventListener(t, () => ht(n));
	let i = e[ge];
	e[ge] = i ? () => {
		i(), r(!0);
	} : () => r(!0), mt();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/async.js
function _t(e, t, n, r) {
	let i = rt() ? xt : wt;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = K, c = vt(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				Sn(e, s);
			}
			yt();
		}
	}
	var d = bt();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ Ct(e))).then(u).catch((e) => Sn(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), yt();
	}) : f();
}
function vt() {
	var e = K, t = G, n = N, r = L;
	return function(i = !0) {
		nr(e), tr(t), Qe(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function yt(e = !0) {
	nr(null), tr(null), Qe(null), e && L?.deactivate();
}
function bt() {
	var e = K, t = e.b, n = L, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function xt(e) {
	var n = 2 | T;
	return K !== null && (K.f |= ie), {
		ctx: N,
		deps: null,
		effects: null,
		equals: ke,
		f: n,
		fn: e,
		reactions: null,
		rv: 0,
		v: t,
		wv: 0,
		parent: K,
		ac: null
	};
}
var St = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function Ct(e, n, r) {
	let i = K;
	i === null && Ne();
	var a = void 0, o = Xt(t), s = !G, c = /* @__PURE__ */ new Set();
	return Pn(() => {
		var t = K, n = y();
		a = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== _e && n.reject(e);
			}).finally(yt);
		} catch (e) {
			n.reject(e), yt();
		}
		var r = L;
		if (s) {
			if (t.f & 32768) var l = bt();
			if (i.b?.is_rendered()) r.async_deriveds.get(t)?.reject(St);
			else for (let e of c.values()) e.reject(St);
			c.add(n), r.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), c.delete(n), t !== St && (r.activate(), t ? (o.f |= se, en(o, t)) : (o.f & 8388608 && (o.f ^= se), en(o, e)), r.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), Dn(() => {
		for (let e of c) e.reject(St);
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
function I(e) {
	let t = /* @__PURE__ */ xt(e);
	return ir(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function wt(e) {
	let t = /* @__PURE__ */ xt(e);
	return t.equals = je, t;
}
function Tt(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) Hn(t[n]);
	}
}
function Et(e) {
	var n, r = K, i = e.parent;
	if (!Qn && i !== null && e.v !== t && i.f & 24576) return ye(), e.v;
	nr(i);
	try {
		Tt(e), n = gr(e);
	} finally {
		nr(r);
	}
	return n;
}
function Dt(e) {
	var t = Et(e);
	if (!e.equals(t) && (e.wv = pr(), (!L?.is_fork || e.deps === null) && (L === null ? e.v = t : (L.capture(e, t, !0), jt?.capture(e, t, !0)), e.deps === null))) {
		lt(e, w);
		return;
	}
	Qn || (Mt === null ? ut(e) : (En() || L?.is_fork) && Mt.set(e, t));
}
function Ot(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && ht(() => {
		t.ac.abort(_e), t.ac = null;
	}), t.fn !== null && (t.teardown = g), yr(t, 0), Bn(t));
}
function kt(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && br(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/batch.js
var At = null, L = null, jt = null, Mt = null, Nt = null, Pt = !1, Ft = !1, It = null, Lt = null, Rt = 0, zt = 1, Bt = class e {
	id = zt++;
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
		At === null ? At = this : (At.#n = this, this.#t = At), At = this;
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
			for (var r of n.d) lt(r, T), t(r);
			for (r of n.m) lt(r, E), t(r);
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
		for (let e of this.#u) this.#d.delete(e), lt(e, T), this.schedule(e);
		for (let e of this.#d) lt(e, E), this.schedule(e);
		this.apply();
		for (var t = It = [], n = [], r = Lt = []; this.#c.length > 0;) {
			Rt++ > 1e3 && (this.#S(), Vt());
			for (let e of this.#g()) try {
				this.#v(e, t, n);
			} catch (t) {
				throw Kt(e), this.#h() || this.discard(), t;
			}
		}
		if (L = null, r.length > 0) {
			var i = e.ensure();
			for (let e of r) i.schedule(e);
		}
		if (It = null, Lt = null, this.#h()) {
			this.#x(n), this.#x(t);
			for (let [e, t] of this.#f) Gt(e, t);
			r.length > 0 && L.#_();
			return;
		}
		let a = this.#y();
		if (a) {
			this.#x(n), this.#x(t), a.#b(this);
			return;
		}
		this.#u.clear(), this.#d.clear();
		for (let e of this.#r) e(this);
		this.#r.clear(), jt = this, Ut(n), Ut(t), jt = null, this.#s?.resolve();
		var o = L;
		if (this.#a === 0 && (this.#c.length === 0 || o !== null) && this.#S(), this.#c.length > 0) {
			if (o !== null) {
				for (let e of this.#c) o.#c.push(e);
				this.#c = [];
			} else o = this;
		}
		o !== null && (Jt.clear(), o.#_());
	}
	#v(e, t, n) {
		e.f ^= w;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = !!(i & 96);
			if (!(a && i & 1024 || i & 8192 || this.#f.has(r)) && r.fn !== null) {
				a ? r.f ^= w : i & 4 ? t.push(r) : mr(r) && (i & 16 && this.#d.add(r), br(r));
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
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), lt(i, T), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#S(), L = this, this.#_();
	}
	#x(e) {
		for (var t = 0; t < e.length; t += 1) dt(e[t], this.#u, this.#d);
	}
	capture(e, n, r = !1) {
		e.v !== t && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [n, r]), Mt?.set(e, n)), this.is_fork || (e.v = n);
	}
	activate() {
		L = this;
	}
	deactivate() {
		L = null, Mt = null;
	}
	flush() {
		try {
			Ft = !0, L = this, this.#_();
		} finally {
			Rt = 0, Nt = null, It = null, Lt = null, Ft = !1, L = null, Mt = null, Jt.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(St);
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
		this.#m || (this.#m = !0, ot(() => {
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
		if (L === null) {
			let t = L = new e();
			!Ft && !Pt && ot(() => {
				t.#e || t.flush();
			});
		}
		return L;
	}
	apply() {
		Mt = null;
	}
	schedule(e) {
		if (Nt = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) {
			e.b.defer_effect(e);
			return;
		}
		this.#c.push(e);
	}
	#S() {
		if (this.linked) {
			var e = this.#t, t = this.#n;
			e === null || (e.#n = t), t === null ? At = e : t.#t = e, this.linked = !1;
		}
	}
};
function R(e) {
	var t = Pt;
	Pt = !0;
	try {
		var n;
		for (e && (L !== null && !L.is_fork && L.flush(), n = e());;) {
			if (st(), L === null) return n;
			L.flush();
		}
	} finally {
		Pt = t;
	}
}
function Vt() {
	try {
		Re();
	} catch (e) {
		Sn(e, Nt);
	}
}
var Ht = null;
function Ut(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && mr(r) && (Ht = /* @__PURE__ */ new Set(), br(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Wn(r), Ht?.size > 0)) {
				Jt.clear();
				for (let e of Ht) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) Ht.has(n) && (Ht.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || br(n);
					}
				}
				Ht.clear();
			}
		}
		Ht = null;
	}
}
function Wt(e) {
	L.schedule(e);
}
function Gt(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), lt(e, w);
		for (var n = e.first; n !== null;) Gt(n, t), n = n.next;
	}
}
function Kt(e) {
	lt(e, w);
	for (var t = e.first; t !== null;) Kt(t), t = t.next;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/sources.js
var qt = /* @__PURE__ */ new Set(), Jt = /* @__PURE__ */ new Map(), Yt = !1;
function Xt(e, t) {
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
function z(e, t) {
	let n = Xt(e, t);
	return ir(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function Zt(e, t = !1, n = !0) {
	let r = Xt(e);
	return t || (r.equals = je), Ge && n && N !== null && N.l !== null && (N.l.s ??= []).push(r), r;
}
function B(e, t, n = !1) {
	return G !== null && (!er || G.f & 131072) && rt() && G.f & 4325394 && (rr === null || !rr.has(e)) && Ue(), en(e, n ? an(t) : t, Lt);
}
var Qt = null, $t = 0;
function en(e, t, n = null) {
	if (!e.equals(t)) {
		Qn ? Jt.set(e, t) : Jt.has(e) || Jt.set(e, e.v);
		var r = Bt.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && Et(t), Mt === null && ut(t);
		}
		e.wv = pr(), Qt = null, $t = 0, rn(e, T, n), Qt = null, rt() && K !== null && K.f & 1024 && !(K.f & 96) && (sr === null ? cr([e]) : sr.push(e)), !r.is_fork && qt.size > 0 && !Yt && tn();
	}
	return t;
}
function tn() {
	Yt = !1;
	for (let e of qt) {
		e.f & 1024 && lt(e, E);
		let t;
		try {
			t = mr(e);
		} catch {
			t = !0;
		}
		t && br(e);
	}
	qt.clear();
}
function nn(e) {
	B(e, e.v + 1);
}
function rn(e, t, n) {
	var r = e.reactions;
	if (r !== null) {
		var i = rt(), a = r.length;
		if ($t += a, $t > 1e5 && Qt === null && (Qt = /* @__PURE__ */ new Set()), Qt !== null) {
			if (Qt.has(e)) return;
			Qt.add(e);
		}
		for (var o = 0; o < a; o++) {
			var s = r[o], c = s.f;
			if (i || s !== K) {
				var l = (c & T) === 0;
				if (l && lt(s, t), c & 131072) qt.add(s);
				else if (c & 2) {
					var u = s;
					Mt?.delete(u), rn(u, E, n);
				} else if (l) {
					var d = s;
					c & 16 && Ht !== null && Ht.add(d), n === null ? Wt(d) : n.push(d);
				}
			}
		}
	}
}
function an(e) {
	if (typeof e != "object" || !e || ce in e || le in e) return e;
	let n = p(e);
	if (n !== d && n !== f) return e;
	var i = /* @__PURE__ */ new Map(), a = r(e), o = /* @__PURE__ */ z(0), s = null, c = dr, u = (e) => {
		if (dr === c) return e();
		var t = G, n = dr;
		tr(null), fr(c);
		var r = e();
		return tr(t), fr(n), r;
	};
	return a && i.set("length", /* @__PURE__ */ z(e.length, s)), new Proxy(e, {
		defineProperty(e, t, n) {
			(!("value" in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) && Ve();
			var r = i.get(t);
			return r === void 0 ? u(() => {
				var e = /* @__PURE__ */ z(n.value, s);
				return i.set(t, e), e;
			}) : B(r, n.value, !0), !0;
		},
		deleteProperty(e, n) {
			var r = i.get(n);
			if (r === void 0) {
				if (n in e) {
					let e = u(() => /* @__PURE__ */ z(t, s));
					i.set(n, e), nn(o);
				}
			} else B(r, t), nn(o);
			return !0;
		},
		get(n, r, a) {
			if (r === ce) return e;
			var o = i.get(r), c = r in n;
			if (o === void 0 && (!c || l(n, r)?.writable) && (o = u(() => /* @__PURE__ */ z(an(c ? n[r] : t), s)), i.set(r, o)), o !== void 0) {
				var d = q(o);
				return d === t ? void 0 : d;
			}
			return Reflect.get(n, r, a);
		},
		getOwnPropertyDescriptor(e, n) {
			this.has?.(e, n);
			var r = Reflect.getOwnPropertyDescriptor(e, n), a = i.get(n);
			if (a !== void 0) {
				var o = q(a);
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
			return (r !== void 0 || K !== null && (!a || l(e, n)?.writable)) && (r === void 0 && (r = u(() => /* @__PURE__ */ z(a ? an(e[n]) : t, s)), i.set(n, r)), q(r) === t) ? !1 : a;
		},
		set(e, n, r, c) {
			var d = i.get(n), f = n in e;
			if (a && n === "length") for (var p = r; p < d.v; p += 1) {
				var m = i.get(p + "");
				m === void 0 ? p in e && (m = u(() => /* @__PURE__ */ z(t, s)), i.set(p + "", m)) : B(m, t);
			}
			if (d === void 0) (!f || l(e, n)?.writable) && (d = u(() => /* @__PURE__ */ z(void 0, s)), B(d, an(r)), i.set(n, d));
			else {
				f = d.v !== t;
				var h = u(() => an(r));
				B(d, h);
			}
			var g = Reflect.getOwnPropertyDescriptor(e, n);
			if (g?.set && g.set.call(c, r), !f) {
				if (a && typeof n == "string") {
					var _ = i.get("length"), v = Number(n);
					Number.isInteger(v) && v >= _.v && B(_, v + 1);
				}
				nn(o);
			}
			return !0;
		},
		ownKeys(e) {
			q(o);
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
function on(e) {
	try {
		if (typeof e == "object" && e && ce in e) return e[ce];
	} catch {}
	return e;
}
function sn(e, t) {
	return Object.is(on(e), on(t));
}
var cn, ln, un, dn;
function fn() {
	if (cn === void 0) {
		cn = window, ln = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		un = l(t, "firstChild").get, dn = l(t, "nextSibling").get, m(e) && (e[pe] = void 0, e[fe] = null, e[me] = void 0, e.__e = void 0), m(n) && (n[he] = void 0);
	}
}
function pn(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function mn(e) {
	return un.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function hn(e) {
	return dn.call(e);
}
function V(e, t) {
	if (!A) return /* @__PURE__ */ mn(e);
	var n = /* @__PURE__ */ mn(j);
	if (n === null) n = j.appendChild(pn());
	else if (t && n.nodeType !== 3) {
		var r = pn();
		return n?.before(r), we(r), r;
	}
	return t && bn(n), we(n), n;
}
function H(e, t = !1) {
	if (!A) {
		var n = /* @__PURE__ */ mn(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ hn(n) : n;
	}
	if (t) {
		if (j?.nodeType !== 3) {
			var r = pn();
			return j?.before(r), we(r), r;
		}
		bn(j);
	}
	return j;
}
function gn(e, t = !1) {
	if (!A) return /* @__PURE__ */ mn(e);
	var n = V(e, t);
	return M(e), n;
}
function U(e, t = 1, n = !1) {
	let r = A ? j : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ hn(r);
	if (!A) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = pn();
			return r === null ? i?.after(a) : r.before(a), we(a), a;
		}
		bn(r);
	}
	return we(r), r;
}
function _n(e) {
	e.textContent = "";
}
function vn() {
	return !1;
}
function yn(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function bn(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
function xn(e) {
	var t = K;
	if (t === null) return G.f |= se, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	Sn(e, t);
}
function Sn(e, t) {
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
function Cn(e) {
	K === null && (G === null && Le(e), Ie()), Qn && Fe(e);
}
function wn(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Tn(e, t) {
	var n = K;
	n !== null && n.f & 8192 && (e |= D);
	var r = {
		ctx: N,
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
	L?.register_created_effect(r);
	var i = r;
	if (e & 4) It === null ? Bt.ensure().schedule(r) : It.push(r);
	else if (t !== null) {
		try {
			br(r);
		} catch (e) {
			throw Hn(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= re));
	}
	if (i !== null && (i.parent = n, n !== null && wn(i, n), G !== null && G.f & 2 && !(e & 64))) {
		var a = G;
		(a.effects ??= []).push(i);
	}
	return r;
}
function En() {
	return G !== null && !er;
}
function Dn(e) {
	let t = Tn(8, null);
	return lt(t, w), t.teardown = e, t;
}
function On(e) {
	Cn("$effect");
	var t = K.f;
	if (!G && t & 32 && N !== null && !N.i) {
		var n = N;
		(n.e ??= []).push(e);
	} else return kn(e);
}
function kn(e) {
	return Tn(4 | ae, e);
}
function An(e) {
	return Cn("$effect.pre"), Tn(8 | ae, e);
}
function jn(e) {
	Bt.ensure();
	let t = Tn(64 | ie, e);
	return () => {
		Hn(t);
	};
}
function Mn(e) {
	Bt.ensure();
	let t = Tn(64 | ie, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? Gn(t, () => {
			Hn(t), n(void 0);
		}) : (Hn(t), n(void 0));
	});
}
function Nn(e) {
	return Tn(4, e);
}
function Pn(e) {
	return Tn(oe | ie, e);
}
function Fn(e, t = 0) {
	return Tn(8 | t, e);
}
function W(e, t = [], n = [], r = []) {
	_t(r, t, n, (t) => {
		Tn(8, () => {
			e(...t.map(q));
		});
	});
}
function In(e, t = 0) {
	return Tn(16 | t, e);
}
function Ln(e, t = 0) {
	return Tn(C | t, e);
}
function Rn(e) {
	return Tn(32 | ie, e);
}
function zn(e) {
	var t = e.teardown;
	if (t !== null) {
		let n = Qn, r = G;
		$n(!0), tr(null);
		try {
			t.call(null);
		} catch (t) {
			Sn(t, e.parent);
		} finally {
			$n(n), tr(r);
		}
	}
}
function Bn(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && ht(() => {
			e.abort(_e);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : Hn(n, t), n = r;
	}
}
function Vn(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || Hn(t), t = n;
	}
}
function Hn(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (Un(e.nodes.start, e.nodes.end), n = !0), e.f |= ne, Bn(e, t && !n), yr(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	zn(e), e.f ^= ne, e.f |= ee;
	var i = e.parent;
	i !== null && i.first !== null && Wn(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Un(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ hn(e);
		e.remove(), e = n;
	}
}
function Wn(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Gn(e, t, n = !0) {
	var r = [];
	e.f |= 256, Kn(e, r, !0);
	var i = () => {
		n && Hn(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function Kn(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= D;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				Kn(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function qn(e) {
	e.f &= -257, Jn(e, !0);
}
function Jn(e, t) {
	if (!(e.f & 256) && e.f & 8192) {
		e.f ^= D, e.f & 1024 || (lt(e, T), Bt.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			Jn(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function Yn(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ hn(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/legacy.js
var Xn = null, Zn = !1, Qn = !1;
function $n(e) {
	Qn = e;
}
var G = null, er = !1;
function tr(e) {
	G = e;
}
var K = null;
function nr(e) {
	K = e;
}
var rr = null;
function ir(e) {
	G !== null && (G.f & 2097152 || G.f & 2) && (rr ??= /* @__PURE__ */ new Set()).add(e);
}
var ar = null, or = 0, sr = null;
function cr(e) {
	sr = e;
}
var lr = 1, ur = 0, dr = ur;
function fr(e) {
	dr = e;
}
function pr() {
	return ++lr;
}
function mr(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (mr(a) && Dt(a), a.wv > e.wv) return !0;
		}
		t & 512 && Mt === null && lt(e, w);
	}
	return !1;
}
function hr(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(rr !== null && rr.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? hr(a, t, !1) : t === a && (n ? lt(a, T) : a.f & 1024 && lt(a, E), Wt(a));
	}
}
function gr(e) {
	var t = ar, n = or, r = sr, i = G, a = rr, o = N, s = er, c = dr, l = e.f;
	ar = null, or = 0, sr = null, G = l & 96 ? null : e, rr = null, Qe(e.ctx), er = !1, dr = ++ur, e.ac !== null && (ht(() => {
		e.ac.abort(_e);
	}), e.ac = null);
	try {
		e.f |= k;
		var u = e.fn, d = u();
		e.f |= te;
		var f = _r(e);
		if (rt() && sr !== null && !er && f !== null && !(e.f & 6146)) for (var p = 0; p < sr.length; p++) hr(sr[p], e);
		if (i !== null && i !== e) {
			if (ur++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = ur;
			if (t !== null) for (let e of t) e.rv = ur;
			sr !== null && (r === null ? r = sr : r.push(...sr));
		}
		return e.f & 8388608 && (e.f ^= se), d;
	} catch (t) {
		return _r(e), xn(t);
	} finally {
		e.f ^= k, ar = t, or = n, sr = r, G = i, rr = a, Qe(o), er = s, dr = c;
	}
}
function _r(e) {
	var t = e.deps, n = L?.is_fork;
	if (ar !== null) {
		var r;
		if (n || yr(e, or), t !== null && or > 0) for (t.length = or + ar.length, r = 0; r < ar.length; r++) t[or + r] = ar[r];
		else e.deps = t = ar;
		if (En() && e.f & 512) for (r = or; r < t.length; r++) (t[r].reactions ??= []).push(e);
	} else !n && t !== null && or < t.length && (yr(e, or), t.length = or);
	return t;
}
function vr(e, n) {
	let r = n.reactions;
	if (r !== null) {
		var o = i.call(r, e);
		if (o !== -1) {
			var s = r.length - 1;
			s === 0 ? r = n.reactions = null : (r[o] = r[s], r.pop());
		}
	}
	if (r === null && n.f & 2 && (ar === null || !a.call(ar, n))) {
		var c = n;
		c.f & 512 && (c.f ^= 512), c.v !== t && ut(c), c.ac !== null && ht(() => {
			c.ac.abort(_e), c.ac = null, lt(c, T);
		}), Ot(c), yr(c, 0);
	}
}
function yr(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) vr(e, n[r]);
}
function br(e) {
	var t = e.f;
	if (!(t & 16384)) {
		lt(e, w);
		var n = K, r = Zn;
		K = e, Zn = !(t & 96);
		try {
			t & 16777232 ? Vn(e) : Bn(e), zn(e);
			var i = gr(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = lr;
		} finally {
			Zn = r, K = n;
		}
	}
}
async function xr() {
	await Promise.resolve(), R();
}
function q(e) {
	var t = !!(e.f & 2);
	if (Xn?.add(e), G !== null && !er && !(K !== null && K.f & 16384) && (rr === null || !rr.has(e))) {
		var n = G.deps;
		if (G.f & 2097152) e.rv < ur && (e.rv = ur, ar === null && n !== null && n[or] === e ? or++ : ar === null ? ar = [e] : ar.push(e));
		else {
			G.deps ??= [], a.call(G.deps, e) || G.deps.push(e);
			var r = e.reactions;
			r === null ? e.reactions = [G] : a.call(r, G) || r.push(G);
		}
	}
	if (Qn && Jt.has(e)) return Jt.get(e);
	if (t) {
		var i = e;
		if (Qn) {
			var o = i.v;
			return (!(i.f & 1024) && i.reactions !== null || Cr(i)) && (o = Et(i)), Jt.set(i, o), o;
		}
		var s = !(i.f & 512) && !er && G !== null && (Zn || !!(G.f & 512)), c = (i.f & te) === 0;
		mr(i) && (s && (i.f |= 512), Dt(i)), s && !c && (kt(i), Sr(i));
	}
	if (Mt?.has(e)) return Mt.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function Sr(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (kt(t), Sr(t));
}
function Cr(e) {
	if (e.v === t) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (Jt.has(t) || t.f & 2 && Cr(t)) return !0;
	return !1;
}
function wr(e) {
	var t = er;
	try {
		return er = !0, e();
	} finally {
		er = t;
	}
}
function Tr(e) {
	if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
		if (ce in e) Er(e);
		else if (!Array.isArray(e)) for (let t in e) {
			let n = e[t];
			typeof n == "object" && n && ce in n && Er(n);
		}
	}
}
function Er(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "object" && e && !(e instanceof EventTarget) && !t.has(e)) {
		t.add(e), e instanceof Date && e.getTime();
		for (let n in e) try {
			Er(e[n], t);
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
var Dr = Symbol("events"), Or = /* @__PURE__ */ new Set(), kr = /* @__PURE__ */ new Set();
function Ar(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || Lr.call(t, e), !e.cancelBubble) return ht(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? (i.__removed = !1, ot(() => {
		i.__removed || t.addEventListener(e, i, r);
	})) : t.addEventListener(e, i, r), i;
}
function jr(e, t, n, r = {}) {
	var i = Ar(t, e, n, r);
	return () => {
		i.__removed = !0, e.removeEventListener(t, i, r);
	};
}
function Mr(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = Ar(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && Dn(() => {
		o.__removed = !0, t.removeEventListener(e, o, a);
	});
}
function Nr(e, t, n) {
	(t[Dr] ??= {})[e] = n;
}
function Pr(e) {
	for (var t = 0; t < e.length; t++) Or.add(e[t]);
	for (var n of kr) n(e);
}
var Fr = null, Ir = !1;
function Lr(e) {
	var t = this, n = t.ownerDocument, r = e.type, i = e.composedPath?.() || [], a = i[0] || e.target;
	Fr = e, Ir || (Ir = !0, setTimeout(() => {
		Ir = !1, Fr = null;
	}));
	var o = 0, s = Fr === e && e[Dr];
	if (s) {
		var l = i.indexOf(s);
		if (l !== -1 && (t === document || t === window)) {
			e[Dr] = t;
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
		var d = G, f = K;
		tr(null), nr(null);
		try {
			for (var p, m = []; a !== null && a !== t;) {
				try {
					var h = a[Dr]?.[r];
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
			e[Dr] = t, delete e.currentTarget, tr(d), nr(f);
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/reconciler.js
var Rr = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function zr(e) {
	return Rr?.createHTML(e) ?? e;
}
function Br(e) {
	var t = yn("template");
	return t.innerHTML = zr(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/template.js
function Vr(e, t) {
	var n = K;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function J(e, t) {
	var n = !!(t & 1), r = !!(t & 2), i, a = !e.startsWith("<!>");
	return () => {
		if (A) return Vr(j, null), j;
		i === void 0 && (i = Br(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ mn(i)));
		var t = r || ln ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ mn(t), s = t.lastChild;
			Vr(o, s);
		} else Vr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Hr(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (A) return Vr(j, null), j;
		if (!o) {
			var e = /* @__PURE__ */ mn(Br(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ mn(e);) o.appendChild(/* @__PURE__ */ mn(e));
			else o = /* @__PURE__ */ mn(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ mn(t), r = t.lastChild;
			Vr(n, r);
		} else Vr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Ur(e, t) {
	return /* @__PURE__ */ Hr(e, t, "svg");
}
function Wr(e = "") {
	if (!A) {
		var t = pn(e + "");
		return Vr(t, t), t;
	}
	var n = j;
	return n.nodeType === 3 ? bn(n) : (n.before(n = pn()), we(n)), Vr(n, n), n;
}
function Gr() {
	if (A) return Vr(j, null), j;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = pn();
	return e.append(t, n), Vr(t, n), e;
}
function Y(e, t) {
	if (A) {
		var n = K;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = j), Te();
		return;
	}
	e !== null && e.before(t);
}
//#endregion
//#region node_modules/svelte/src/utils.js
function Kr(e) {
	return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
var qr = [
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
function Jr(e) {
	return qr.includes(e);
}
var Yr = /* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split("."), Xr = {
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
function Zr(e) {
	return e = e.toLowerCase(), Xr[e] ?? e;
}
[...Yr];
var Qr = ["touchstart", "touchmove"];
function $r(e) {
	return Qr.includes(e);
}
//#endregion
//#region node_modules/svelte/src/reactivity/create-subscriber.js
function ei(e) {
	let t = 0, n = Xt(0), r;
	return () => {
		En() && (q(n), Fn(() => (t === 0 && (r = wr(() => e(() => nn(n)))), t += 1, () => {
			ot(() => {
				--t, t === 0 && (r?.(), r = void 0, nn(n));
			});
		})));
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var ti = re | ie;
function ni(e, t, n, r) {
	new ri(e, t, n, r);
}
var ri = class {
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
	#h = ei(() => (this.#m = Xt(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = K;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = K.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = In(() => {
			if (A) {
				let e = this.#t;
				Te();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, ti), A && (this.#e = j);
	}
	#g() {
		try {
			this.#a = Rn(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		ot(r), t && (this.#s = Rn(() => {
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
			t = !0, n && We(), this.#s !== null && Gn(this.#s, () => {
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
					Sn(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = Rn(() => e(this.#e)), ot(() => {
			var e = this.#c = document.createDocumentFragment(), t = pn(), n = !1;
			if (e.append(t), this.#a = this.#S(() => {
				try {
					return Rn(() => this.#r(t));
				} catch (e) {
					try {
						this.error(e), n = !0;
					} catch (e) {
						Sn(e, this.#i.parent);
					}
					return null;
				}
			}), this.#a === null) {
				this.#c = null, n && this.#x(L);
				return;
			}
			this.#u === 0 && (this.#e.before(e), this.#c = null, Gn(this.#o, () => {
				this.#o = null;
			}), this.#x(L));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = Rn(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				Yn(this.#a, e);
				let t = this.#n.pending;
				this.#o = Rn(() => t(this.#e));
			} else this.#x(L);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		dt(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = K, n = G, r = N;
		nr(this.#i), tr(this.#i), Qe(this.#i.ctx);
		try {
			return Bt.ensure(), e();
		} finally {
			nr(t), tr(n), Qe(r);
		}
	}
	#C(e, t) {
		if (!this.has_pending_snippet()) {
			this.parent && this.parent.#C(e, t);
			return;
		}
		this.#u += e, this.#u === 0 && (this.#x(t), this.#o && Gn(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null));
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, ot(() => {
			this.#d = !1, this.#m && en(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), q(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		L?.is_fork ? (this.#a && L.skip_effect(this.#a), this.#o && L.skip_effect(this.#o), this.#s && L.skip_effect(this.#s), L.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (Hn(this.#a), null), this.#o &&= (Hn(this.#o), null), this.#s &&= (Hn(this.#s), null), A && (we(this.#t), Ee(), we(De()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return Rn(() => {
						var r = K;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return Sn(e, this.#i.parent), null;
				}
			}));
		};
		ot(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				Sn(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => Sn(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
function ii(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[he] ??= e.nodeValue) && (e[he] = n, e.nodeValue = `${n}`);
}
function ai(e, t) {
	return ci(e, t);
}
function oi(t, n) {
	fn(), n.intro = n.intro ?? !1;
	let r = n.target, i = A, a = j;
	try {
		for (var o = /* @__PURE__ */ mn(r); o && (o.nodeType !== 8 || o.data !== "[");) o = /* @__PURE__ */ hn(o);
		if (!o) throw e;
		Ce(!0), we(o);
		let i = ci(t, {
			...n,
			anchor: o
		});
		return Ce(!1), i;
	} catch (i) {
		if (i instanceof Error && i.message.split("\n").some((e) => e.startsWith("https://svelte.dev/e/"))) throw i;
		return i !== e && console.warn("Failed to hydrate: ", i), n.recover === !1 && ze(), fn(), _n(r), Ce(!1), ai(t, n);
	} finally {
		Ce(i), we(a);
	}
}
var si = /* @__PURE__ */ new Map();
function ci(t, { target: n, anchor: r, props: i = {}, events: a, context: s, intro: c = !0, transformError: l }) {
	fn();
	var u = void 0, d = Mn(() => {
		var c = r ?? n.appendChild(pn());
		ni(c, { pending: () => {} }, (n) => {
			P({});
			var r = N;
			if (s && (r.c = s), a && (i.$$events = a), A && Vr(n, null), u = t(n, i) || nt(), A && (K.nodes.end = j, j === null || j.nodeType !== 8 || j.data !== "]")) throw be(), e;
			F();
		}, l);
		var d = /* @__PURE__ */ new Set(), f = (e) => {
			for (var t = 0; t < e.length; t++) {
				var r = e[t];
				if (!d.has(r)) {
					d.add(r);
					var i = $r(r);
					for (let e of [n, document]) {
						var a = si.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), si.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, Lr, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return f(o(Or)), kr.add(f), () => {
			for (var e of d) for (let r of [n, document]) {
				var t = si.get(r), i = t.get(e);
				--i == 0 ? (r.removeEventListener(e, Lr), t.delete(e), t.size === 0 && si.delete(r)) : t.set(e, i);
			}
			kr.delete(f), c !== r && c.parentNode?.removeChild(c);
		};
	});
	return li.set(u, d), u;
}
var li = /* @__PURE__ */ new WeakMap();
function ui(e, t) {
	let n = li.get(e);
	return n ? (li.delete(e), n(t)) : Promise.resolve();
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/branches.js
var di = class {
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
			if (n) qn(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (qn(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (Hn(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						Yn(r, t), t.append(pn()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else Hn(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), Gn(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (Hn(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = L, r = vn();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = pn();
				i.append(a), this.#n.set(e, {
					effect: Rn(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, Rn(() => t(this.anchor)));
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
function fi(e, t, ...n) {
	var r = new di(e);
	In(() => {
		let e = t() ?? null;
		r.ensure(e, e && ((t) => e(t, ...n)));
	}, re);
}
function pi(e) {
	N === null && Me("onMount"), Ge && N.l !== null ? hi(N).m.push(e) : On(() => {
		let t = wr(e);
		if (typeof t == "function") return t;
	});
}
function mi(e) {
	N === null && Me("onDestroy"), pi(() => () => wr(e));
}
function hi(e) {
	var t = e.l;
	return t.u ??= {
		a: [],
		b: [],
		m: []
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/if.js
function gi(e, t, n = !1) {
	var r;
	A && (r = j, Te());
	var i = new di(e), a = n ? re : 0;
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
	In(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/css-props.js
function _i(e, t) {
	A && we(/* @__PURE__ */ mn(e)), Fn(() => {
		var n = t();
		for (var r in n) {
			var i = n[r];
			i == null || i === "" ? e.style.removeProperty(r) : e.style.setProperty(r, i);
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/each.js
function vi(e, t, n) {
	for (var r = [], i = t.length, a, s = t.length, c = 0; c < i; c++) {
		let n = t[c];
		Gn(n, () => {
			if (a) {
				if (a.pending.delete(n), a.done.add(n), a.pending.size === 0) {
					var t = e.outrogroups;
					yi(e, o(a.done)), t.delete(a), t.size === 0 && (e.outrogroups = null);
				}
			} else --s;
		}, !1);
	}
	if (s === 0) {
		var l = r.length === 0 && n !== null && e.pending.size === 0;
		if (l) {
			var u = n, d = u.parentNode;
			_n(d), d.append(u), e.items.clear();
		}
		yi(e, t, !l);
	} else a = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(a);
}
function yi(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= O, Yn(a, document.createDocumentFragment())) : Hn(t[i], n);
	}
}
var bi;
function xi(e, t, n, i, a, s = null) {
	var c = e, l = /* @__PURE__ */ new Map();
	if (t & 4) {
		var u = e;
		c = A ? we(/* @__PURE__ */ mn(u)) : u.appendChild(pn());
	}
	A && Te();
	var d = null, f = /* @__PURE__ */ wt(() => {
		var e = n();
		return r(e) ? e : e == null ? [] : o(e);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Ci(v, p, c, t, i), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= O, Ti(d, null, c)) : qn(d) : Gn(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: In(() => {
			p = q(f);
			var e = p.length;
			let r = !1;
			A && Oe(c) === "[!" != (e === 0) && (c = De(), we(c), Ce(!1), r = !0);
			for (var o = /* @__PURE__ */ new Set(), u = L, v = vn(), y = 0; y < e; y += 1) {
				A && j.nodeType === 8 && j.data === "]" && (c = j, r = !0, Ce(!1));
				var b = p[y], x = i(b, y), S = h ? null : l.get(x);
				S ? (S.v && en(S.v, b), S.i && en(S.i, y), v && u.unskip_effect(S.e)) : (S = wi(l, h ? c : bi ??= pn(), b, x, y, a, t, n), h || (S.e.f |= O), l.set(x, S)), o.add(x);
			}
			if (e === 0 && s && !d && (h ? d = Rn(() => s(c)) : (d = Rn(() => s(bi ??= pn())), d.f |= O)), e > o.size && Pe("", "", ""), A && e > 0 && we(De()), !h) {
				if (m.set(u, o), v) {
					for (let [e, t] of l) o.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			r && Ce(!0), q(f);
		}),
		flags: t,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, A && (c = j);
}
function Si(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Ci(e, t, n, r, i) {
	var a = !!(r & 8), s = t.length, c = e.items, l = Si(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (a) for (v = 0; v < s; v += 1) h = t[v], g = i(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = i(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (qn(_), a && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= O, _ === l) Ti(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Ei(e, d, _), Ei(e, _, y), Ti(_, y, n), d = _, p = [], m = [], l = Si(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], C = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Ti(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					Ei(e, S.prev, C.next), Ei(e, d, S), Ei(e, C, b), l = b, d = C, --v, p = [], m = [];
				} else u.delete(_), Ti(_, l, n), Ei(e, _.prev, _.next), Ei(e, _, d === null ? e.effect.first : d.next), Ei(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = Si(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = Si(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (yi(e, o(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var w = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || w.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && w.push(l), l = Si(l.next);
		var T = w.length;
		if (T > 0) {
			var E = r & 4 && s === 0 ? n : null;
			if (a) {
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.measure();
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.fix();
			}
			vi(e, w, E);
		}
	}
	a && ot(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function wi(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? Xt(n) : /* @__PURE__ */ Zt(n, !1, !1) : null, l = o & 2 ? Xt(i) : null;
	return {
		v: c,
		i: l,
		e: Rn(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Ti(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ hn(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Ei(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
function Di(e, t, n) {
	var r;
	A && (r = j, Te());
	var i = new di(e);
	In(() => {
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
function Oi(e, t) {
	Nn(() => {
		e = K?.parent?.nodes?.start ?? e;
		var n = e.getRootNode(), r = n.host ? n : n.head ?? n.ownerDocument.head;
		if (!r.querySelector("#" + t.hash)) {
			let e = yn("style");
			e.id = t.hash, e.textContent = t.code, r.appendChild(e);
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/actions.js
function ki(e, t, n) {
	Nn(() => {
		var r = wr(() => t(e, n?.()) || {});
		if (n && r?.update) {
			var i = !1, a = {};
			Fn(() => {
				var e = n();
				Tr(e), i && Ae(a, e) && (a = e, r.update(e));
			}), i = !0;
		}
		if (r?.destroy) return () => r.destroy();
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attachments.js
function Ai(e, t) {
	var n = void 0, r;
	Ln(() => {
		n !== (n = t()) && (r &&= (Hn(r), null), n && (r = Rn(() => {
			Nn(() => n(e));
		})));
	});
}
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function ji(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = ji(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function Mi() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = ji(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
function Ni(e) {
	return typeof e == "object" ? Mi(e) : e ?? "";
}
var Pi = [..." 	\n\r\f\xA0\v﻿"];
function Fi(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Pi.includes(r[o - 1])) && (s === r.length || Pi.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function Ii(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function Li(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Ri(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\/\*.*?\*\//g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(Li)), i && c.push(...Object.keys(i).map(Li));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = Li(e.substring(l, u).trim());
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
		return r && (n += Ii(r)), i && (n += Ii(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function zi(e, t, n, r, i, a) {
	var o = e[pe];
	if (A || o !== n || o === void 0) {
		var s = Fi(n, r, a);
		(!A || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[pe] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/style.js
function Bi(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function Vi(e, t, n, r) {
	var i = e[me];
	if (A || i !== t) {
		var a = Ri(t, r);
		(!A || a !== e.getAttribute("style")) && (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[me] = t;
	} else r && (Array.isArray(r) ? (Bi(e, n?.[0], r[0]), Bi(e, n?.[1], r[1], "important")) : Bi(e, n, r));
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
function Hi(e, t) {
	t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function Ui(e, t) {
	var n = !("__defaultValue" in e);
	(n || e.__defaultValue !== t) && (e.__defaultValue = t, Wi(e, !n || "__value" in e));
}
function Wi(e, t) {
	var n = e.__defaultValue, i = e.multiple, a = i ? n ?? [] : null;
	if (!i || r(a)) {
		var o = e.selectedIndex, s = t && i ? new Set(e.selectedOptions) : null;
		for (var c of e.options) {
			var l = Ji(c);
			Hi(c, i ? a.includes(l) : sn(l, n));
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
function Gi(e, t, n = !1) {
	if (e.multiple) {
		if (t == null) return;
		if (!r(t)) return xe();
		for (var i of e.options) i.selected = t.includes(Ji(i));
		return;
	}
	for (i of e.options) if (sn(Ji(i), t)) {
		i.selected = !0;
		return;
	}
	(!n || t !== void 0) && (e.selectedIndex = -1);
}
function Ki(e) {
	var t = new MutationObserver((t) => {
		t.every(Yi) || ("__defaultValue" in e && Wi(e, !1), "__value" in e && Gi(e, e.__value));
	});
	t.observe(e, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["value"]
	}), Dn(() => {
		t.disconnect();
	});
}
function qi(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet(), i = !0;
	gt(e, "change", (t) => {
		var i = t ? "[selected]" : ":checked", a;
		if (e.multiple) a = [].map.call(e.querySelectorAll(i), Ji);
		else {
			var o = e.querySelector(i) ?? e.querySelector("option:not([disabled])");
			a = o && Ji(o);
		}
		n(a), e.__value = a, L !== null && r.add(L);
	}), Nn(() => {
		var a = t();
		if (e === document.activeElement) {
			var o = L;
			if (r.has(o)) return;
		}
		if (Gi(e, a, i), i && a === void 0) {
			var s = e.querySelector(":checked");
			s !== null && (a = Ji(s), n(a));
		}
		e.__value = a, i = !1;
	});
}
function Ji(e) {
	return "__value" in e ? e.__value : e.value;
}
function Yi(e) {
	if (e.target.closest("selectedcontent") !== null) return !0;
	if (e.type === "childList") {
		var t = [...e.addedNodes, ...e.removedNodes];
		return t.length > 0 && t.every((e) => e.nodeName === "SELECTEDCONTENT");
	}
	return !1;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attributes.js
var Xi = Symbol("class"), Zi = Symbol("style"), Qi = Symbol("is custom element"), $i = Symbol("is html"), ea = ve ? "link" : "LINK", ta = ve ? "input" : "INPUT", na = ve ? "option" : "OPTION", ra = ve ? "select" : "SELECT";
function ia(e) {
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
		e[ge] = n, ot(n), mt();
	}
}
function X(e, t, n, r) {
	var i = sa(e);
	A && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === ea) || i[t] !== (i[t] = n) && (t === "loading" && (e[de] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && la(e).has(t) ? e[t] = n : e.setAttribute(t, n));
}
function aa(e, n, r, i, a = !1, o = !1) {
	A && a && e.nodeName === ta && ("defaultValue" in r || "defaultChecked" in r || ia(e));
	var s = sa(e), c = s[Qi], l = !s[$i];
	let u = A && c;
	u && Ce(!1);
	var d = n || {}, f = e.nodeName === na, p = e.nodeName === ra;
	for (var m in n) !(m in r) && m[0] + m[1] !== "$$" && (r[m] = null);
	r.class ? r.class = Ni(r.class) : (i || r[Xi]) && (r.class = null), r[Zi] && (r.style ??= null);
	var h = la(e);
	if (e.nodeName === ta && "type" in r && ("value" in r || "__value" in r)) {
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
			zi(e, e.namespaceURI === "http://www.w3.org/1999/xhtml", u, i, n?.[Xi], r[Xi]), d[a] = u, d[Xi] = r[Xi];
			continue;
		}
		if (a === "style") {
			Vi(e, u, n?.[Zi], r[Zi]), d[a] = u, d[Zi] = r[Zi];
			continue;
		}
		var _ = d[a];
		if (u !== _ || u === void 0 && e.hasAttribute(a)) {
			d[a] = u;
			var v = a[0] + a[1];
			if (v !== "$$") {
				if (v === "on") {
					let t = {}, n = "$$" + a, r = a.slice(2);
					var y = Jr(r);
					if (Kr(r) && (r = r.slice(0, -7), t.capture = !0), !y && _) {
						if (u != null) continue;
						e.removeEventListener(r, d[n], t), d[n] = null;
					}
					if (y) Nr(r, e, u), Pr([r]);
					else if (u != null) {
						function i(e) {
							d[a].call(this, e);
						}
						d[n] = Ar(r, e, i, t);
					}
				} else if (a === "style") X(e, a, u);
				else if (a === "autofocus") ft(e, !!u);
				else if (!c && (a === "__value" || a === "value" && u != null)) e.value = e.__value = u;
				else if (a === "selected" && f) Hi(e, u);
				else {
					var b = a;
					l || (b = Zr(b));
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
function oa(e, t, n = [], r = [], i = [], a, o = !1, s = !1) {
	_t(i, n, r, (n) => {
		var r = void 0, i = {}, c = e.nodeName === ra, l = !1;
		if (Ln(() => {
			var u = t(...n.map(q)), d = aa(e, r, u, a, o, s);
			if (l && c) {
				var f = e;
				"defaultValue" in u && Ui(f, u.defaultValue), "value" in u && Gi(f, u.value);
			}
			for (let e of Object.getOwnPropertySymbols(i)) u[e] || Hn(i[e]);
			for (let t of Object.getOwnPropertySymbols(u)) {
				var p = u[t];
				t.description === "@attach" && (!r || p !== r[t]) && (i[t] && Hn(i[t]), i[t] = Rn(() => Ai(e, () => p))), d[t] = p;
			}
			r = d;
		}), c) {
			var u = e;
			Nn(() => {
				var e = r;
				"defaultValue" in e && Ui(u, e.defaultValue), Gi(u, e.value, !0), Ki(u);
			});
		}
		l = !0;
	});
}
function sa(e) {
	return e[fe] ??= {
		[Qi]: e.nodeName.includes("-"),
		[$i]: e.namespaceURI === n
	};
}
var ca = /* @__PURE__ */ new Map();
function la(e) {
	var t = e.getAttribute("is") || e.nodeName, n = ca.get(t);
	if (n) return n;
	ca.set(t, n = /* @__PURE__ */ new Set());
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var o in r = u(i), r) r[o].set && o !== "innerHTML" && o !== "textContent" && o !== "innerText" && n.add(o);
		i = p(i);
	}
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function ua(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	gt(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = da(e) ? fa(a) : a, n(a), L !== null && r.add(L), await xr(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (A && e.defaultValue !== e.value || wr(t) == null && e.value) && (n(da(e) ? fa(e.value) : e.value), L !== null && r.add(L)), Fn(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = L;
			if (r.has(i)) return;
		}
		da(e) && n === fa(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function da(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function fa(e) {
	return e === "" ? null : +e;
}
var pa = /* @__PURE__ */ new class e {
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
function ma(e, t, n) {
	var r = pa.observe(e, () => n(e[t]));
	Nn(() => (wr(() => n(e[t])), r));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function ha(e, t) {
	return e === t || e?.[ce] === t;
}
function ga(e = nt(), t, n, r) {
	var i = N.r, a = K;
	return Nn(() => {
		var o, s;
		return Fn(() => {
			o = s, s = r?.() || [], wr(() => {
				ha(n(...s), e) || (t(e, ...s), o && ha(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && ha(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
function _a(e = !1) {
	let t = N, n = t.l.u;
	if (!n) return;
	let r = () => Tr(t.s);
	if (e) {
		let e = 0, n = {}, i = /* @__PURE__ */ xt(() => {
			let r = !1, i = t.s;
			for (let e in i) i[e] !== n[e] && (n[e] = i[e], r = !0);
			return r && e++, e;
		});
		r = () => q(i);
	}
	n.b.length && An(() => {
		va(t, r), v(n.b);
	}), On(() => {
		let e = wr(() => n.m.map(_));
		return () => {
			for (let t of e) typeof t == "function" && t();
		};
	}), n.a.length && On(() => {
		va(t, r), v(n.a);
	});
}
function va(e, t) {
	if (e.l.s) for (let t of e.l.s) q(t);
	t();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/store.js
var ya = !1;
function ba(e) {
	var t = ya;
	try {
		return ya = !1, [e(), ya];
	} finally {
		ya = t;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/props.js
var xa = {
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
function Sa(e, t, n) {
	return new Proxy({
		props: e,
		exclude: t
	}, xa);
}
var Ca = {
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
function wa(...e) {
	return new Proxy({ props: e }, Ca);
}
function Z(e, t, n, r) {
	var i = !Ge || !!(n & 2), a = !!(n & 8), o = !!(n & 16), s = r, c = !0, u = void 0, d = () => o && i ? (u ??= /* @__PURE__ */ xt(r), q(u)) : (c && (c = !1, s = o ? wr(r) : r), s);
	let f;
	if (a) {
		var p = ce in e || ue in e;
		f = l(e, t)?.set ?? (p && t in e ? (n) => e[t] = n : void 0);
	}
	var m, h = !1;
	a ? [m, h] = ba(() => e[t]) : m = e[t], m === void 0 && r !== void 0 && (m = d(), f && (i && Be(t), f(m)));
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
	var v = !1, y = (n & 1 ? xt : wt)(() => (v = !1, g()));
	a && q(y);
	var b = K;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? q(y) : i && a ? an(e) : e;
			return B(y, n), v = !0, s !== void 0 && (s = n), e;
		}
		return Qn && v || b.f & 16384 ? y.v : q(y);
	});
}
//#endregion
//#region node_modules/svelte/src/legacy/legacy-client.js
function Ta(e) {
	return new Ea(e);
}
var Ea = class {
	#e;
	#t;
	constructor(e) {
		var t = /* @__PURE__ */ new Map(), n = (e, n) => {
			var r = /* @__PURE__ */ Zt(n, !1, !1);
			return t.set(e, r), r;
		};
		let r = new Proxy({
			...e.props || {},
			$$events: {}
		}, {
			get(e, r) {
				return q(t.get(r) ?? n(r, Reflect.get(e, r)));
			},
			has(e, r) {
				return r === ue || (q(t.get(r) ?? n(r, Reflect.get(e, r))), Reflect.has(e, r));
			},
			set(e, r, i) {
				return B(t.get(r) ?? n(r, i), i), Reflect.set(e, r, i);
			}
		});
		this.#t = (e.hydrate ? oi : ai)(e.component, {
			target: e.target,
			anchor: e.anchor,
			props: r,
			context: e.context,
			intro: e.intro ?? !1,
			recover: e.recover,
			transformError: e.transformError
		}), (!e?.props?.$$host || e.sync === !1) && R(), this.#e = r.$$events;
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
			ui(this.#t);
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
}, Da;
typeof HTMLElement == "function" && (Da = class extends HTMLElement {
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
					let n = yn("slot");
					e !== "default" && (n.name = e), Y(t, n);
				};
			}
			let t = {}, n = ka(this);
			for (let r of this.$$s) r in n && (r === "default" && !this.$$d.children ? (this.$$d.children = e(r), t.default = !0) : t[r] = e(r));
			for (let e of this.attributes) {
				let t = this.$$g_p(e.name);
				t in this.$$d || (this.$$d[t] = Oa(t, e.value, this.$$p_d, "toProp"));
			}
			for (let e in this.$$p_d) !(e in this.$$d) && this[e] !== void 0 && (this.$$d[e] = this[e], delete this[e]);
			this.$$c = Ta({
				component: this.$$ctor,
				target: this.$$shadowRoot || this,
				props: {
					...this.$$d,
					$$slots: t,
					$$host: this
				}
			}), this.$$me = jn(() => {
				Fn(() => {
					this.$$r = !0;
					for (let e of s(this.$$c)) {
						if (!this.$$p_d[e]?.reflect) continue;
						this.$$d[e] = this.$$c[e];
						let t = Oa(e, this.$$d[e], this.$$p_d, "toAttribute");
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
		this.$$r || (e = this.$$g_p(e), this.$$d[e] = Oa(e, n, this.$$p_d, "toProp"), this.$$c?.$set({ [e]: this.$$d[e] }));
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
function Oa(e, t, n, r) {
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
function ka(e) {
	let t = {};
	return e.childNodes.forEach((e) => {
		t[e.slot || "default"] = !0;
	}), t;
}
function Q(e, t, n, r, i, a) {
	let o = class extends Da {
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
				n = Oa(e, n, t), this.$$d[e] = n;
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
var Aa = { value: () => {} };
function ja() {
	for (var e = 0, t = arguments.length, n = {}, r; e < t; ++e) {
		if (!(r = arguments[e] + "") || r in n || /[\s.]/.test(r)) throw Error("illegal type: " + r);
		n[r] = [];
	}
	return new Ma(n);
}
function Ma(e) {
	this._ = e;
}
function Na(e, t) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var n = "", r = e.indexOf(".");
		if (r >= 0 && (n = e.slice(r + 1), e = e.slice(0, r)), e && !t.hasOwnProperty(e)) throw Error("unknown type: " + e);
		return {
			type: e,
			name: n
		};
	});
}
Ma.prototype = ja.prototype = {
	constructor: Ma,
	on: function(e, t) {
		var n = this._, r = Na(e + "", n), i, a = -1, o = r.length;
		if (arguments.length < 2) {
			for (; ++a < o;) if ((i = (e = r[a]).type) && (i = Pa(n[i], e.name))) return i;
			return;
		}
		if (t != null && typeof t != "function") throw Error("invalid callback: " + t);
		for (; ++a < o;) if (i = (e = r[a]).type) n[i] = Fa(n[i], e.name, t);
		else if (t == null) for (i in n) n[i] = Fa(n[i], e.name, null);
		return this;
	},
	copy: function() {
		var e = {}, t = this._;
		for (var n in t) e[n] = t[n].slice();
		return new Ma(e);
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
function Pa(e, t) {
	for (var n = 0, r = e.length, i; n < r; ++n) if ((i = e[n]).name === t) return i.value;
}
function Fa(e, t, n) {
	for (var r = 0, i = e.length; r < i; ++r) if (e[r].name === t) {
		e[r] = Aa, e = e.slice(0, r).concat(e.slice(r + 1));
		break;
	}
	return n != null && e.push({
		name: t,
		value: n
	}), e;
}
var Ia = {
	svg: "http://www.w3.org/2000/svg",
	xhtml: "http://www.w3.org/1999/xhtml",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/"
};
//#endregion
//#region node_modules/d3-selection/src/namespace.js
function La(e) {
	var t = e += "", n = t.indexOf(":");
	return n >= 0 && (t = e.slice(0, n)) !== "xmlns" && (e = e.slice(n + 1)), Ia.hasOwnProperty(t) ? {
		space: Ia[t],
		local: e
	} : e;
}
//#endregion
//#region node_modules/d3-selection/src/creator.js
function Ra(e) {
	return function() {
		var t = this.ownerDocument, n = this.namespaceURI;
		return n === "http://www.w3.org/1999/xhtml" && t.documentElement.namespaceURI === "http://www.w3.org/1999/xhtml" ? t.createElement(e) : t.createElementNS(n, e);
	};
}
function za(e) {
	return function() {
		return this.ownerDocument.createElementNS(e.space, e.local);
	};
}
function Ba(e) {
	var t = La(e);
	return (t.local ? za : Ra)(t);
}
//#endregion
//#region node_modules/d3-selection/src/selector.js
function Va() {}
function Ha(e) {
	return e == null ? Va : function() {
		return this.querySelector(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/select.js
function Ua(e) {
	typeof e != "function" && (e = Ha(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = Array(o), c, l, u = 0; u < o; ++u) (c = a[u]) && (l = e.call(c, c.__data__, u, a)) && ("__data__" in c && (l.__data__ = c.__data__), s[u] = l);
	return new Ms(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/array.js
function Wa(e) {
	return e == null ? [] : Array.isArray(e) ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selectorAll.js
function Ga() {
	return [];
}
function Ka(e) {
	return e == null ? Ga : function() {
		return this.querySelectorAll(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectAll.js
function qa(e) {
	return function() {
		return Wa(e.apply(this, arguments));
	};
}
function Ja(e) {
	e = typeof e == "function" ? qa(e) : Ka(e);
	for (var t = this._groups, n = t.length, r = [], i = [], a = 0; a < n; ++a) for (var o = t[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && (r.push(e.call(c, c.__data__, l, o)), i.push(c));
	return new Ms(r, i);
}
//#endregion
//#region node_modules/d3-selection/src/matcher.js
function Ya(e) {
	return function() {
		return this.matches(e);
	};
}
function Xa(e) {
	return function(t) {
		return t.matches(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChild.js
var Za = Array.prototype.find;
function Qa(e) {
	return function() {
		return Za.call(this.children, e);
	};
}
function $a() {
	return this.firstElementChild;
}
function eo(e) {
	return this.select(e == null ? $a : Qa(typeof e == "function" ? e : Xa(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChildren.js
var to = Array.prototype.filter;
function no() {
	return Array.from(this.children);
}
function ro(e) {
	return function() {
		return to.call(this.children, e);
	};
}
function io(e) {
	return this.selectAll(e == null ? no : ro(typeof e == "function" ? e : Xa(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/filter.js
function ao(e) {
	typeof e != "function" && (e = Ya(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Ms(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/sparse.js
function oo(e) {
	return Array(e.length);
}
//#endregion
//#region node_modules/d3-selection/src/selection/enter.js
function so() {
	return new Ms(this._enter || this._groups.map(oo), this._parents);
}
function co(e, t) {
	this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, this._next = null, this._parent = e, this.__data__ = t;
}
co.prototype = {
	constructor: co,
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
function lo(e) {
	return function() {
		return e;
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/data.js
function uo(e, t, n, r, i, a) {
	for (var o = 0, s, c = t.length, l = a.length; o < l; ++o) (s = t[o]) ? (s.__data__ = a[o], r[o] = s) : n[o] = new co(e, a[o]);
	for (; o < c; ++o) (s = t[o]) && (i[o] = s);
}
function fo(e, t, n, r, i, a, o) {
	var s, c, l = /* @__PURE__ */ new Map(), u = t.length, d = a.length, f = Array(u), p;
	for (s = 0; s < u; ++s) (c = t[s]) && (f[s] = p = o.call(c, c.__data__, s, t) + "", l.has(p) ? i[s] = c : l.set(p, c));
	for (s = 0; s < d; ++s) p = o.call(e, a[s], s, a) + "", (c = l.get(p)) ? (r[s] = c, c.__data__ = a[s], l.delete(p)) : n[s] = new co(e, a[s]);
	for (s = 0; s < u; ++s) (c = t[s]) && l.get(f[s]) === c && (i[s] = c);
}
function po(e) {
	return e.__data__;
}
function mo(e, t) {
	if (!arguments.length) return Array.from(this, po);
	var n = t ? fo : uo, r = this._parents, i = this._groups;
	typeof e != "function" && (e = lo(e));
	for (var a = i.length, o = Array(a), s = Array(a), c = Array(a), l = 0; l < a; ++l) {
		var u = r[l], d = i[l], f = d.length, p = ho(e.call(u, u && u.__data__, l, r)), m = p.length, h = s[l] = Array(m), g = o[l] = Array(m);
		n(u, d, h, g, c[l] = Array(f), p, t);
		for (var _ = 0, v = 0, y, b; _ < m; ++_) if (y = h[_]) {
			for (_ >= v && (v = _ + 1); !(b = g[v]) && ++v < m;);
			y._next = b || null;
		}
	}
	return o = new Ms(o, r), o._enter = s, o._exit = c, o;
}
function ho(e) {
	return typeof e == "object" && "length" in e ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selection/exit.js
function go() {
	return new Ms(this._exit || this._groups.map(oo), this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/join.js
function _o(e, t, n) {
	var r = this.enter(), i = this, a = this.exit();
	return typeof e == "function" ? (r = e(r), r &&= r.selection()) : r = r.append(e + ""), t != null && (i = t(i), i &&= i.selection()), n == null ? a.remove() : n(a), r && i ? r.merge(i).order() : i;
}
//#endregion
//#region node_modules/d3-selection/src/selection/merge.js
function vo(e) {
	for (var t = e.selection ? e.selection() : e, n = this._groups, r = t._groups, i = n.length, a = r.length, o = Math.min(i, a), s = Array(i), c = 0; c < o; ++c) for (var l = n[c], u = r[c], d = l.length, f = s[c] = Array(d), p, m = 0; m < d; ++m) (p = l[m] || u[m]) && (f[m] = p);
	for (; c < i; ++c) s[c] = n[c];
	return new Ms(s, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/order.js
function yo() {
	for (var e = this._groups, t = -1, n = e.length; ++t < n;) for (var r = e[t], i = r.length - 1, a = r[i], o; --i >= 0;) (o = r[i]) && (a && o.compareDocumentPosition(a) ^ 4 && a.parentNode.insertBefore(o, a), a = o);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/sort.js
function bo(e) {
	e ||= xo;
	function t(t, n) {
		return t && n ? e(t.__data__, n.__data__) : !t - !n;
	}
	for (var n = this._groups, r = n.length, i = Array(r), a = 0; a < r; ++a) {
		for (var o = n[a], s = o.length, c = i[a] = Array(s), l, u = 0; u < s; ++u) (l = o[u]) && (c[u] = l);
		c.sort(t);
	}
	return new Ms(i, this._parents).order();
}
function xo(e, t) {
	return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
//#endregion
//#region node_modules/d3-selection/src/selection/call.js
function So() {
	var e = arguments[0];
	return arguments[0] = this, e.apply(null, arguments), this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/nodes.js
function Co() {
	return Array.from(this);
}
//#endregion
//#region node_modules/d3-selection/src/selection/node.js
function wo() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length; i < a; ++i) {
		var o = r[i];
		if (o) return o;
	}
	return null;
}
//#endregion
//#region node_modules/d3-selection/src/selection/size.js
function To() {
	let e = 0;
	for (let t of this) ++e;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/selection/empty.js
function Eo() {
	return !this.node();
}
//#endregion
//#region node_modules/d3-selection/src/selection/each.js
function Do(e) {
	for (var t = this._groups, n = 0, r = t.length; n < r; ++n) for (var i = t[n], a = 0, o = i.length, s; a < o; ++a) (s = i[a]) && e.call(s, s.__data__, a, i);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/attr.js
function Oo(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function ko(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function Ao(e, t) {
	return function() {
		this.setAttribute(e, t);
	};
}
function jo(e, t) {
	return function() {
		this.setAttributeNS(e.space, e.local, t);
	};
}
function Mo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttribute(e) : this.setAttribute(e, n);
	};
}
function No(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttributeNS(e.space, e.local) : this.setAttributeNS(e.space, e.local, n);
	};
}
function Po(e, t) {
	var n = La(e);
	if (arguments.length < 2) {
		var r = this.node();
		return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
	}
	return this.each((t == null ? n.local ? ko : Oo : typeof t == "function" ? n.local ? No : Mo : n.local ? jo : Ao)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/window.js
function Fo(e) {
	return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
}
//#endregion
//#region node_modules/d3-selection/src/selection/style.js
function Io(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function Lo(e, t, n) {
	return function() {
		this.style.setProperty(e, t, n);
	};
}
function Ro(e, t, n) {
	return function() {
		var r = t.apply(this, arguments);
		r == null ? this.style.removeProperty(e) : this.style.setProperty(e, r, n);
	};
}
function zo(e, t, n) {
	return arguments.length > 1 ? this.each((t == null ? Io : typeof t == "function" ? Ro : Lo)(e, t, n ?? "")) : Bo(this.node(), e);
}
function Bo(e, t) {
	return e.style.getPropertyValue(t) || Fo(e).getComputedStyle(e, null).getPropertyValue(t);
}
//#endregion
//#region node_modules/d3-selection/src/selection/property.js
function Vo(e) {
	return function() {
		delete this[e];
	};
}
function Ho(e, t) {
	return function() {
		this[e] = t;
	};
}
function Uo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? delete this[e] : this[e] = n;
	};
}
function Wo(e, t) {
	return arguments.length > 1 ? this.each((t == null ? Vo : typeof t == "function" ? Uo : Ho)(e, t)) : this.node()[e];
}
//#endregion
//#region node_modules/d3-selection/src/selection/classed.js
function Go(e) {
	return e.trim().split(/^|\s+/);
}
function Ko(e) {
	return e.classList || new qo(e);
}
function qo(e) {
	this._node = e, this._names = Go(e.getAttribute("class") || "");
}
qo.prototype = {
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
function Jo(e, t) {
	for (var n = Ko(e), r = -1, i = t.length; ++r < i;) n.add(t[r]);
}
function Yo(e, t) {
	for (var n = Ko(e), r = -1, i = t.length; ++r < i;) n.remove(t[r]);
}
function Xo(e) {
	return function() {
		Jo(this, e);
	};
}
function Zo(e) {
	return function() {
		Yo(this, e);
	};
}
function Qo(e, t) {
	return function() {
		(t.apply(this, arguments) ? Jo : Yo)(this, e);
	};
}
function $o(e, t) {
	var n = Go(e + "");
	if (arguments.length < 2) {
		for (var r = Ko(this.node()), i = -1, a = n.length; ++i < a;) if (!r.contains(n[i])) return !1;
		return !0;
	}
	return this.each((typeof t == "function" ? Qo : t ? Xo : Zo)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/text.js
function es() {
	this.textContent = "";
}
function ts(e) {
	return function() {
		this.textContent = e;
	};
}
function ns(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.textContent = t ?? "";
	};
}
function rs(e) {
	return arguments.length ? this.each(e == null ? es : (typeof e == "function" ? ns : ts)(e)) : this.node().textContent;
}
//#endregion
//#region node_modules/d3-selection/src/selection/html.js
function is() {
	this.innerHTML = "";
}
function as(e) {
	return function() {
		this.innerHTML = e;
	};
}
function os(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.innerHTML = t ?? "";
	};
}
function ss(e) {
	return arguments.length ? this.each(e == null ? is : (typeof e == "function" ? os : as)(e)) : this.node().innerHTML;
}
//#endregion
//#region node_modules/d3-selection/src/selection/raise.js
function cs() {
	this.nextSibling && this.parentNode.appendChild(this);
}
function ls() {
	return this.each(cs);
}
//#endregion
//#region node_modules/d3-selection/src/selection/lower.js
function us() {
	this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function ds() {
	return this.each(us);
}
//#endregion
//#region node_modules/d3-selection/src/selection/append.js
function fs(e) {
	var t = typeof e == "function" ? e : Ba(e);
	return this.select(function() {
		return this.appendChild(t.apply(this, arguments));
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/insert.js
function ps() {
	return null;
}
function ms(e, t) {
	var n = typeof e == "function" ? e : Ba(e), r = t == null ? ps : typeof t == "function" ? t : Ha(t);
	return this.select(function() {
		return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/remove.js
function hs() {
	var e = this.parentNode;
	e && e.removeChild(this);
}
function gs() {
	return this.each(hs);
}
//#endregion
//#region node_modules/d3-selection/src/selection/clone.js
function _s() {
	var e = this.cloneNode(!1), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function vs() {
	var e = this.cloneNode(!0), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function ys(e) {
	return this.select(e ? vs : _s);
}
//#endregion
//#region node_modules/d3-selection/src/selection/datum.js
function bs(e) {
	return arguments.length ? this.property("__data__", e) : this.node().__data__;
}
//#endregion
//#region node_modules/d3-selection/src/selection/on.js
function xs(e) {
	return function(t) {
		e.call(this, t, this.__data__);
	};
}
function Ss(e) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var t = "", n = e.indexOf(".");
		return n >= 0 && (t = e.slice(n + 1), e = e.slice(0, n)), {
			type: e,
			name: t
		};
	});
}
function Cs(e) {
	return function() {
		var t = this.__on;
		if (t) {
			for (var n = 0, r = -1, i = t.length, a; n < i; ++n) a = t[n], (!e.type || a.type === e.type) && a.name === e.name ? this.removeEventListener(a.type, a.listener, a.options) : t[++r] = a;
			++r ? t.length = r : delete this.__on;
		}
	};
}
function ws(e, t, n) {
	return function() {
		var r = this.__on, i, a = xs(t);
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
function Ts(e, t, n) {
	var r = Ss(e + ""), i, a = r.length, o;
	if (arguments.length < 2) {
		var s = this.node().__on;
		if (s) {
			for (var c = 0, l = s.length, u; c < l; ++c) for (i = 0, u = s[c]; i < a; ++i) if ((o = r[i]).type === u.type && o.name === u.name) return u.value;
		}
		return;
	}
	for (s = t ? ws : Cs, i = 0; i < a; ++i) this.each(s(r[i], t, n));
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/dispatch.js
function Es(e, t, n) {
	var r = Fo(e), i = r.CustomEvent;
	typeof i == "function" ? i = new i(t, n) : (i = r.document.createEvent("Event"), n ? (i.initEvent(t, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(t, !1, !1)), e.dispatchEvent(i);
}
function Ds(e, t) {
	return function() {
		return Es(this, e, t);
	};
}
function Os(e, t) {
	return function() {
		return Es(this, e, t.apply(this, arguments));
	};
}
function ks(e, t) {
	return this.each((typeof t == "function" ? Os : Ds)(e, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/iterator.js
function* As() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length, o; i < a; ++i) (o = r[i]) && (yield o);
}
//#endregion
//#region node_modules/d3-selection/src/selection/index.js
var js = [null];
function Ms(e, t) {
	this._groups = e, this._parents = t;
}
function Ns() {
	return new Ms([[document.documentElement]], js);
}
function Ps() {
	return this;
}
Ms.prototype = Ns.prototype = {
	constructor: Ms,
	select: Ua,
	selectAll: Ja,
	selectChild: eo,
	selectChildren: io,
	filter: ao,
	data: mo,
	enter: so,
	exit: go,
	join: _o,
	merge: vo,
	selection: Ps,
	order: yo,
	sort: bo,
	call: So,
	nodes: Co,
	node: wo,
	size: To,
	empty: Eo,
	each: Do,
	attr: Po,
	style: zo,
	property: Wo,
	classed: $o,
	text: rs,
	html: ss,
	raise: ls,
	lower: ds,
	append: fs,
	insert: ms,
	remove: gs,
	clone: ys,
	datum: bs,
	on: Ts,
	dispatch: ks,
	[Symbol.iterator]: As
};
//#endregion
//#region node_modules/d3-selection/src/select.js
function Fs(e) {
	return typeof e == "string" ? new Ms([[document.querySelector(e)]], [document.documentElement]) : new Ms([[e]], js);
}
//#endregion
//#region node_modules/d3-selection/src/sourceEvent.js
function Is(e) {
	let t;
	for (; t = e.sourceEvent;) e = t;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/pointer.js
function Ls(e, t) {
	if (e = Is(e), t === void 0 && (t = e.currentTarget), t) {
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
var Rs = { passive: !1 }, zs = {
	capture: !0,
	passive: !1
};
function Bs(e) {
	e.stopImmediatePropagation();
}
function Vs(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-drag/src/nodrag.js
function Hs(e) {
	var t = e.document.documentElement, n = Fs(e).on("dragstart.drag", Vs, zs);
	"onselectstart" in t ? n.on("selectstart.drag", Vs, zs) : (t.__noselect = t.style.MozUserSelect, t.style.MozUserSelect = "none");
}
function Us(e, t) {
	var n = e.document.documentElement, r = Fs(e).on("dragstart.drag", null);
	t && (r.on("click.drag", Vs, zs), setTimeout(function() {
		r.on("click.drag", null);
	}, 0)), "onselectstart" in n ? r.on("selectstart.drag", null) : (n.style.MozUserSelect = n.__noselect, delete n.__noselect);
}
//#endregion
//#region node_modules/d3-drag/src/constant.js
var Ws = (e) => () => e;
//#endregion
//#region node_modules/d3-drag/src/event.js
function Gs(e, { sourceEvent: t, subject: n, target: r, identifier: i, active: a, x: o, y: s, dx: c, dy: l, dispatch: u }) {
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
Gs.prototype.on = function() {
	var e = this._.on.apply(this._, arguments);
	return e === this._ ? this : e;
};
//#endregion
//#region node_modules/d3-drag/src/drag.js
function Ks(e) {
	return !e.ctrlKey && !e.button;
}
function qs() {
	return this.parentNode;
}
function Js(e, t) {
	return t ?? {
		x: e.x,
		y: e.y
	};
}
function Ys() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function Xs() {
	var e = Ks, t = qs, n = Js, r = Ys, i = {}, a = ja("start", "drag", "end"), o = 0, s, c, l, u, d = 0;
	function f(e) {
		e.on("mousedown.drag", p).filter(r).on("touchstart.drag", g).on("touchmove.drag", _, Rs).on("touchend.drag touchcancel.drag", v).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	function p(n, r) {
		if (!u && e.call(this, n, r)) {
			var i = y(this, t.call(this, n, r), n, r, "mouse");
			i && (Fs(n.view).on("mousemove.drag", m, zs).on("mouseup.drag", h, zs), Hs(n.view), Bs(n), l = !1, s = n.clientX, c = n.clientY, i("start", n));
		}
	}
	function m(e) {
		if (Vs(e), !l) {
			var t = e.clientX - s, n = e.clientY - c;
			l = t * t + n * n > d;
		}
		i.mouse("drag", e);
	}
	function h(e) {
		Fs(e.view).on("mousemove.drag mouseup.drag", null), Us(e.view, l), Vs(e), i.mouse("end", e);
	}
	function g(n, r) {
		if (e.call(this, n, r)) for (var i = n.changedTouches, a = t.call(this, n, r), o = i.length, s = 0, c; s < o; ++s) (c = y(this, a, n, r, i[s].identifier, i[s])) && (Bs(n), c("start", n, i[s]));
	}
	function _(e) {
		for (var t = e.changedTouches, n = t.length, r = 0, a; r < n; ++r) (a = i[t[r].identifier]) && (Vs(e), a("drag", e, t[r]));
	}
	function v(e) {
		var t = e.changedTouches, n = t.length, r, a;
		for (u && clearTimeout(u), u = setTimeout(function() {
			u = null;
		}, 500), r = 0; r < n; ++r) (a = i[t[r].identifier]) && (Bs(e), a("end", e, t[r]));
	}
	function y(e, t, r, s, c, l) {
		var u = a.copy(), d = Ls(l || r, t), p, m, h;
		if ((h = n.call(e, new Gs("beforestart", {
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
				case "drag": d = Ls(l || a, t), _ = o;
			}
			u.call(r, e, new Gs(r, {
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
		return arguments.length ? (e = typeof t == "function" ? t : Ws(!!t), f) : e;
	}, f.container = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : Ws(e), f) : t;
	}, f.subject = function(e) {
		return arguments.length ? (n = typeof e == "function" ? e : Ws(e), f) : n;
	}, f.touchable = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : Ws(!!e), f) : r;
	}, f.on = function() {
		var e = a.on.apply(a, arguments);
		return e === a ? f : e;
	}, f.clickDistance = function(e) {
		return arguments.length ? (d = (e = +e) * e, f) : Math.sqrt(d);
	}, f;
}
//#endregion
//#region node_modules/d3-color/src/define.js
function Zs(e, t, n) {
	e.prototype = t.prototype = n, n.constructor = e;
}
function Qs(e, t) {
	var n = Object.create(e.prototype);
	for (var r in t) n[r] = t[r];
	return n;
}
//#endregion
//#region node_modules/d3-color/src/color.js
function $s() {}
var ec = .7, tc = 1 / ec, nc = "\\s*([+-]?\\d+)\\s*", rc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", ic = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", ac = /^#([0-9a-f]{3,8})$/, oc = RegExp(`^rgb\\(${nc},${nc},${nc}\\)$`), sc = RegExp(`^rgb\\(${ic},${ic},${ic}\\)$`), cc = RegExp(`^rgba\\(${nc},${nc},${nc},${rc}\\)$`), lc = RegExp(`^rgba\\(${ic},${ic},${ic},${rc}\\)$`), uc = RegExp(`^hsl\\(${rc},${ic},${ic}\\)$`), dc = RegExp(`^hsla\\(${rc},${ic},${ic},${rc}\\)$`), fc = {
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
Zs($s, _c, {
	copy(e) {
		return Object.assign(new this.constructor(), this, e);
	},
	displayable() {
		return this.rgb().displayable();
	},
	hex: pc,
	formatHex: pc,
	formatHex8: mc,
	formatHsl: hc,
	formatRgb: gc,
	toString: gc
});
function pc() {
	return this.rgb().formatHex();
}
function mc() {
	return this.rgb().formatHex8();
}
function hc() {
	return Ac(this).formatHsl();
}
function gc() {
	return this.rgb().formatRgb();
}
function _c(e) {
	var t, n;
	return e = (e + "").trim().toLowerCase(), (t = ac.exec(e)) ? (n = t[1].length, t = parseInt(t[1], 16), n === 6 ? vc(t) : n === 3 ? new Sc(t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, (t & 15) << 4 | t & 15, 1) : n === 8 ? yc(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, (t & 255) / 255) : n === 4 ? yc(t >> 12 & 15 | t >> 8 & 240, t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, ((t & 15) << 4 | t & 15) / 255) : null) : (t = oc.exec(e)) ? new Sc(t[1], t[2], t[3], 1) : (t = sc.exec(e)) ? new Sc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, 1) : (t = cc.exec(e)) ? yc(t[1], t[2], t[3], t[4]) : (t = lc.exec(e)) ? yc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, t[4]) : (t = uc.exec(e)) ? kc(t[1], t[2] / 100, t[3] / 100, 1) : (t = dc.exec(e)) ? kc(t[1], t[2] / 100, t[3] / 100, t[4]) : fc.hasOwnProperty(e) ? vc(fc[e]) : e === "transparent" ? new Sc(NaN, NaN, NaN, 0) : null;
}
function vc(e) {
	return new Sc(e >> 16 & 255, e >> 8 & 255, e & 255, 1);
}
function yc(e, t, n, r) {
	return r <= 0 && (e = t = n = NaN), new Sc(e, t, n, r);
}
function bc(e) {
	return e instanceof $s || (e = _c(e)), e ? (e = e.rgb(), new Sc(e.r, e.g, e.b, e.opacity)) : new Sc();
}
function xc(e, t, n, r) {
	return arguments.length === 1 ? bc(e) : new Sc(e, t, n, r ?? 1);
}
function Sc(e, t, n, r) {
	this.r = +e, this.g = +t, this.b = +n, this.opacity = +r;
}
Zs(Sc, xc, Qs($s, {
	brighter(e) {
		return e = e == null ? tc : tc ** +e, new Sc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? ec : ec ** +e, new Sc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	rgb() {
		return this;
	},
	clamp() {
		return new Sc(Dc(this.r), Dc(this.g), Dc(this.b), Ec(this.opacity));
	},
	displayable() {
		return -.5 <= this.r && this.r < 255.5 && -.5 <= this.g && this.g < 255.5 && -.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
	},
	hex: Cc,
	formatHex: Cc,
	formatHex8: wc,
	formatRgb: Tc,
	toString: Tc
}));
function Cc() {
	return `#${Oc(this.r)}${Oc(this.g)}${Oc(this.b)}`;
}
function wc() {
	return `#${Oc(this.r)}${Oc(this.g)}${Oc(this.b)}${Oc((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Tc() {
	let e = Ec(this.opacity);
	return `${e === 1 ? "rgb(" : "rgba("}${Dc(this.r)}, ${Dc(this.g)}, ${Dc(this.b)}${e === 1 ? ")" : `, ${e})`}`;
}
function Ec(e) {
	return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function Dc(e) {
	return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function Oc(e) {
	return e = Dc(e), (e < 16 ? "0" : "") + e.toString(16);
}
function kc(e, t, n, r) {
	return r <= 0 ? e = t = n = NaN : n <= 0 || n >= 1 ? e = t = NaN : t <= 0 && (e = NaN), new Mc(e, t, n, r);
}
function Ac(e) {
	if (e instanceof Mc) return new Mc(e.h, e.s, e.l, e.opacity);
	if (e instanceof $s || (e = _c(e)), !e) return new Mc();
	if (e instanceof Mc) return e;
	e = e.rgb();
	var t = e.r / 255, n = e.g / 255, r = e.b / 255, i = Math.min(t, n, r), a = Math.max(t, n, r), o = NaN, s = a - i, c = (a + i) / 2;
	return s ? (o = t === a ? (n - r) / s + (n < r) * 6 : n === a ? (r - t) / s + 2 : (t - n) / s + 4, s /= c < .5 ? a + i : 2 - a - i, o *= 60) : s = c > 0 && c < 1 ? 0 : o, new Mc(o, s, c, e.opacity);
}
function jc(e, t, n, r) {
	return arguments.length === 1 ? Ac(e) : new Mc(e, t, n, r ?? 1);
}
function Mc(e, t, n, r) {
	this.h = +e, this.s = +t, this.l = +n, this.opacity = +r;
}
Zs(Mc, jc, Qs($s, {
	brighter(e) {
		return e = e == null ? tc : tc ** +e, new Mc(this.h, this.s, this.l * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? ec : ec ** +e, new Mc(this.h, this.s, this.l * e, this.opacity);
	},
	rgb() {
		var e = this.h % 360 + (this.h < 0) * 360, t = isNaN(e) || isNaN(this.s) ? 0 : this.s, n = this.l, r = n + (n < .5 ? n : 1 - n) * t, i = 2 * n - r;
		return new Sc(Fc(e >= 240 ? e - 240 : e + 120, i, r), Fc(e, i, r), Fc(e < 120 ? e + 240 : e - 120, i, r), this.opacity);
	},
	clamp() {
		return new Mc(Nc(this.h), Pc(this.s), Pc(this.l), Ec(this.opacity));
	},
	displayable() {
		return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
	},
	formatHsl() {
		let e = Ec(this.opacity);
		return `${e === 1 ? "hsl(" : "hsla("}${Nc(this.h)}, ${Pc(this.s) * 100}%, ${Pc(this.l) * 100}%${e === 1 ? ")" : `, ${e})`}`;
	}
}));
function Nc(e) {
	return e = (e || 0) % 360, e < 0 ? e + 360 : e;
}
function Pc(e) {
	return Math.max(0, Math.min(1, e || 0));
}
function Fc(e, t, n) {
	return (e < 60 ? t + (n - t) * e / 60 : e < 180 ? n : e < 240 ? t + (n - t) * (240 - e) / 60 : t) * 255;
}
//#endregion
//#region node_modules/d3-interpolate/src/constant.js
var Ic = (e) => () => e;
//#endregion
//#region node_modules/d3-interpolate/src/color.js
function Lc(e, t) {
	return function(n) {
		return e + n * t;
	};
}
function Rc(e, t, n) {
	return e **= +n, t = t ** +n - e, n = 1 / n, function(r) {
		return (e + r * t) ** +n;
	};
}
function zc(e) {
	return (e = +e) == 1 ? Bc : function(t, n) {
		return n - t ? Rc(t, n, e) : Ic(isNaN(t) ? n : t);
	};
}
function Bc(e, t) {
	var n = t - e;
	return n ? Lc(e, n) : Ic(isNaN(e) ? t : e);
}
//#endregion
//#region node_modules/d3-interpolate/src/rgb.js
var Vc = (function e(t) {
	var n = zc(t);
	function r(e, t) {
		var r = n((e = xc(e)).r, (t = xc(t)).r), i = n(e.g, t.g), a = n(e.b, t.b), o = Bc(e.opacity, t.opacity);
		return function(t) {
			return e.r = r(t), e.g = i(t), e.b = a(t), e.opacity = o(t), e + "";
		};
	}
	return r.gamma = e, r;
})(1);
//#endregion
//#region node_modules/d3-interpolate/src/numberArray.js
function Hc(e, t) {
	t ||= [];
	var n = e ? Math.min(t.length, e.length) : 0, r = t.slice(), i;
	return function(a) {
		for (i = 0; i < n; ++i) r[i] = e[i] * (1 - a) + t[i] * a;
		return r;
	};
}
function Uc(e) {
	return ArrayBuffer.isView(e) && !(e instanceof DataView);
}
//#endregion
//#region node_modules/d3-interpolate/src/array.js
function Wc(e, t) {
	for (var n = t ? t.length : 0, r = e ? Math.min(n, e.length) : 0, i = Array(r), a = Array(n), o = 0; o < r; ++o) i[o] = $c(e[o], t[o]);
	for (; o < n; ++o) a[o] = t[o];
	return function(e) {
		for (o = 0; o < r; ++o) a[o] = i[o](e);
		return a;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/date.js
function Gc(e, t) {
	var n = /* @__PURE__ */ new Date();
	return e = +e, t = +t, function(r) {
		return n.setTime(e * (1 - r) + t * r), n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/number.js
function Kc(e, t) {
	return e = +e, t = +t, function(n) {
		return e * (1 - n) + t * n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/object.js
function qc(e, t) {
	var n = {}, r = {}, i;
	for (i in (typeof e != "object" || !e) && (e = {}), (typeof t != "object" || !t) && (t = {}), t) i in e ? n[i] = $c(e[i], t[i]) : r[i] = t[i];
	return function(e) {
		for (i in n) r[i] = n[i](e);
		return r;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/string.js
var Jc = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, Yc = new RegExp(Jc.source, "g");
function Xc(e) {
	return function() {
		return e;
	};
}
function Zc(e) {
	return function(t) {
		return e(t) + "";
	};
}
function Qc(e, t) {
	var n = Jc.lastIndex = Yc.lastIndex = 0, r, i, a, o = -1, s = [], c = [];
	for (e += "", t += ""; (r = Jc.exec(e)) && (i = Yc.exec(t));) (a = i.index) > n && (a = t.slice(n, a), s[o] ? s[o] += a : s[++o] = a), (r = r[0]) === (i = i[0]) ? s[o] ? s[o] += i : s[++o] = i : (s[++o] = null, c.push({
		i: o,
		x: Kc(r, i)
	})), n = Yc.lastIndex;
	return n < t.length && (a = t.slice(n), s[o] ? s[o] += a : s[++o] = a), s.length < 2 ? c[0] ? Zc(c[0].x) : Xc(t) : (t = c.length, function(e) {
		for (var n = 0, r; n < t; ++n) s[(r = c[n]).i] = r.x(e);
		return s.join("");
	});
}
//#endregion
//#region node_modules/d3-interpolate/src/value.js
function $c(e, t) {
	var n = typeof t, r;
	return t == null || n === "boolean" ? Ic(t) : (n === "number" ? Kc : n === "string" ? (r = _c(t)) ? (t = r, Vc) : Qc : t instanceof _c ? Vc : t instanceof Date ? Gc : Uc(t) ? Hc : Array.isArray(t) ? Wc : typeof t.valueOf != "function" && typeof t.toString != "function" || isNaN(t) ? qc : Kc)(e, t);
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/decompose.js
var el = 180 / Math.PI, tl = {
	translateX: 0,
	translateY: 0,
	rotate: 0,
	skewX: 0,
	scaleX: 1,
	scaleY: 1
};
function nl(e, t, n, r, i, a) {
	var o, s, c;
	return (o = Math.sqrt(e * e + t * t)) && (e /= o, t /= o), (c = e * n + t * r) && (n -= e * c, r -= t * c), (s = Math.sqrt(n * n + r * r)) && (n /= s, r /= s, c /= s), e * r < t * n && (e = -e, t = -t, c = -c, o = -o), {
		translateX: i,
		translateY: a,
		rotate: Math.atan2(t, e) * el,
		skewX: Math.atan(c) * el,
		scaleX: o,
		scaleY: s
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/parse.js
var rl;
function il(e) {
	let t = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(e + "");
	return t.isIdentity ? tl : nl(t.a, t.b, t.c, t.d, t.e, t.f);
}
function al(e) {
	return e == null || (rl ||= document.createElementNS("http://www.w3.org/2000/svg", "g"), rl.setAttribute("transform", e), !(e = rl.transform.baseVal.consolidate())) ? tl : (e = e.matrix, nl(e.a, e.b, e.c, e.d, e.e, e.f));
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/index.js
function ol(e, t, n, r) {
	function i(e) {
		return e.length ? e.pop() + " " : "";
	}
	function a(e, r, i, a, o, s) {
		if (e !== i || r !== a) {
			var c = o.push("translate(", null, t, null, n);
			s.push({
				i: c - 4,
				x: Kc(e, i)
			}, {
				i: c - 2,
				x: Kc(r, a)
			});
		} else (i || a) && o.push("translate(" + i + t + a + n);
	}
	function o(e, t, n, a) {
		e === t ? t && n.push(i(n) + "rotate(" + t + r) : (e - t > 180 ? t += 360 : t - e > 180 && (e += 360), a.push({
			i: n.push(i(n) + "rotate(", null, r) - 2,
			x: Kc(e, t)
		}));
	}
	function s(e, t, n, a) {
		e === t ? t && n.push(i(n) + "skewX(" + t + r) : a.push({
			i: n.push(i(n) + "skewX(", null, r) - 2,
			x: Kc(e, t)
		});
	}
	function c(e, t, n, r, a, o) {
		if (e !== n || t !== r) {
			var s = a.push(i(a) + "scale(", null, ",", null, ")");
			o.push({
				i: s - 4,
				x: Kc(e, n)
			}, {
				i: s - 2,
				x: Kc(t, r)
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
var sl = ol(il, "px, ", "px)", "deg)"), cl = ol(al, ", ", ")", ")"), ll = 1e-12;
function ul(e) {
	return ((e = Math.exp(e)) + 1 / e) / 2;
}
function dl(e) {
	return ((e = Math.exp(e)) - 1 / e) / 2;
}
function fl(e) {
	return ((e = Math.exp(2 * e)) - 1) / (e + 1);
}
var pl = (function e(t, n, r) {
	function i(e, i) {
		var a = e[0], o = e[1], s = e[2], c = i[0], l = i[1], u = i[2], d = c - a, f = l - o, p = d * d + f * f, m, h;
		if (p < ll) h = Math.log(u / s) / t, m = function(e) {
			return [
				a + e * d,
				o + e * f,
				s * Math.exp(t * e * h)
			];
		};
		else {
			var g = Math.sqrt(p), _ = (u * u - s * s + r * p) / (2 * s * n * g), v = (u * u - s * s - r * p) / (2 * u * n * g), y = Math.log(Math.sqrt(_ * _ + 1) - _);
			h = (Math.log(Math.sqrt(v * v + 1) - v) - y) / t, m = function(e) {
				var r = e * h, i = ul(y), c = s / (n * g) * (i * fl(t * r + y) - dl(y));
				return [
					a + c * d,
					o + c * f,
					s * i / ul(t * r + y)
				];
			};
		}
		return m.duration = h * 1e3 * t / Math.SQRT2, m;
	}
	return i.rho = function(t) {
		var n = Math.max(.001, +t), r = n * n;
		return e(n, r, r * r);
	}, i;
})(Math.SQRT2, 2, 4), ml = 0, hl = 0, gl = 0, _l = 1e3, vl, yl, bl = 0, xl = 0, Sl = 0, Cl = typeof performance == "object" && performance.now ? performance : Date, wl = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(e) {
	setTimeout(e, 17);
};
function Tl() {
	return xl ||= (wl(El), Cl.now() + Sl);
}
function El() {
	xl = 0;
}
function Dl() {
	this._call = this._time = this._next = null;
}
Dl.prototype = Ol.prototype = {
	constructor: Dl,
	restart: function(e, t, n) {
		if (typeof e != "function") throw TypeError("callback is not a function");
		n = (n == null ? Tl() : +n) + (t == null ? 0 : +t), !this._next && yl !== this && (yl ? yl._next = this : vl = this, yl = this), this._call = e, this._time = n, Nl();
	},
	stop: function() {
		this._call && (this._call = null, this._time = Infinity, Nl());
	}
};
function Ol(e, t, n) {
	var r = new Dl();
	return r.restart(e, t, n), r;
}
function kl() {
	Tl(), ++ml;
	for (var e = vl, t; e;) (t = xl - e._time) >= 0 && e._call.call(void 0, t), e = e._next;
	--ml;
}
function Al() {
	xl = (bl = Cl.now()) + Sl, ml = hl = 0;
	try {
		kl();
	} finally {
		ml = 0, Ml(), xl = 0;
	}
}
function jl() {
	var e = Cl.now(), t = e - bl;
	t > _l && (Sl -= t, bl = e);
}
function Ml() {
	for (var e, t = vl, n, r = Infinity; t;) t._call ? (r > t._time && (r = t._time), e = t, t = t._next) : (n = t._next, t._next = null, t = e ? e._next = n : vl = n);
	yl = e, Nl(r);
}
function Nl(e) {
	ml || (hl &&= clearTimeout(hl), e - xl > 24 ? (e < Infinity && (hl = setTimeout(Al, e - Cl.now() - Sl)), gl &&= clearInterval(gl)) : (gl ||= (bl = Cl.now(), setInterval(jl, _l)), ml = 1, wl(Al)));
}
//#endregion
//#region node_modules/d3-timer/src/timeout.js
function Pl(e, t, n) {
	var r = new Dl();
	return t = t == null ? 0 : +t, r.restart((n) => {
		r.stop(), e(n + t);
	}, t, n), r;
}
//#endregion
//#region node_modules/d3-transition/src/transition/schedule.js
var Fl = ja("start", "end", "cancel", "interrupt"), Il = [];
function Ll(e, t, n, r, i, a) {
	var o = e.__transition;
	if (!o) e.__transition = {};
	else if (n in o) return;
	Vl(e, n, {
		name: t,
		index: r,
		group: i,
		on: Fl,
		tween: Il,
		time: a.time,
		delay: a.delay,
		duration: a.duration,
		ease: a.ease,
		timer: null,
		state: 0
	});
}
function Rl(e, t) {
	var n = Bl(e, t);
	if (n.state > 0) throw Error("too late; already scheduled");
	return n;
}
function zl(e, t) {
	var n = Bl(e, t);
	if (n.state > 3) throw Error("too late; already running");
	return n;
}
function Bl(e, t) {
	var n = e.__transition;
	if (!n || !(n = n[t])) throw Error("transition not found");
	return n;
}
function Vl(e, t, n) {
	var r = e.__transition, i;
	r[t] = n, n.timer = Ol(a, 0, n.time);
	function a(e) {
		n.state = 1, n.timer.restart(o, n.delay, n.time), n.delay <= e && o(e - n.delay);
	}
	function o(a) {
		var l, u, d, f;
		if (n.state !== 1) return c();
		for (l in r) if (f = r[l], f.name === n.name) {
			if (f.state === 3) return Pl(o);
			f.state === 4 ? (f.state = 6, f.timer.stop(), f.on.call("interrupt", e, e.__data__, f.index, f.group), delete r[l]) : +l < t && (f.state = 6, f.timer.stop(), f.on.call("cancel", e, e.__data__, f.index, f.group), delete r[l]);
		}
		if (Pl(function() {
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
function Hl(e, t) {
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
function Ul(e) {
	return this.each(function() {
		Hl(this, e);
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/tween.js
function Wl(e, t) {
	var n, r;
	return function() {
		var i = zl(this, e), a = i.tween;
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
function Gl(e, t, n) {
	var r, i;
	if (typeof n != "function") throw Error();
	return function() {
		var a = zl(this, e), o = a.tween;
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
function Kl(e, t) {
	var n = this._id;
	if (e += "", arguments.length < 2) {
		for (var r = Bl(this.node(), n).tween, i = 0, a = r.length, o; i < a; ++i) if ((o = r[i]).name === e) return o.value;
		return null;
	}
	return this.each((t == null ? Wl : Gl)(n, e, t));
}
function ql(e, t, n) {
	var r = e._id;
	return e.each(function() {
		var e = zl(this, r);
		(e.value ||= {})[t] = n.apply(this, arguments);
	}), function(e) {
		return Bl(e, r).value[t];
	};
}
//#endregion
//#region node_modules/d3-transition/src/transition/interpolate.js
function Jl(e, t) {
	var n;
	return (typeof t == "number" ? Kc : t instanceof _c ? Vc : (n = _c(t)) ? (t = n, Vc) : Qc)(e, t);
}
//#endregion
//#region node_modules/d3-transition/src/transition/attr.js
function Yl(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function Xl(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function Zl(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttribute(e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function Ql(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttributeNS(e.space, e.local);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function $l(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttribute(e) : (o = this.getAttribute(e), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function eu(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttributeNS(e.space, e.local) : (o = this.getAttributeNS(e.space, e.local), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function tu(e, t) {
	var n = La(e), r = n === "transform" ? cl : Jl;
	return this.attrTween(e, typeof t == "function" ? (n.local ? eu : $l)(n, r, ql(this, "attr." + e, t)) : t == null ? (n.local ? Xl : Yl)(n) : (n.local ? Ql : Zl)(n, r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/attrTween.js
function nu(e, t) {
	return function(n) {
		this.setAttribute(e, t.call(this, n));
	};
}
function ru(e, t) {
	return function(n) {
		this.setAttributeNS(e.space, e.local, t.call(this, n));
	};
}
function iu(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && ru(e, i)), n;
	}
	return i._value = t, i;
}
function au(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && nu(e, i)), n;
	}
	return i._value = t, i;
}
function ou(e, t) {
	var n = "attr." + e;
	if (arguments.length < 2) return (n = this.tween(n)) && n._value;
	if (t == null) return this.tween(n, null);
	if (typeof t != "function") throw Error();
	var r = La(e);
	return this.tween(n, (r.local ? iu : au)(r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/delay.js
function su(e, t) {
	return function() {
		Rl(this, e).delay = +t.apply(this, arguments);
	};
}
function cu(e, t) {
	return t = +t, function() {
		Rl(this, e).delay = t;
	};
}
function lu(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? su : cu)(t, e)) : Bl(this.node(), t).delay;
}
//#endregion
//#region node_modules/d3-transition/src/transition/duration.js
function uu(e, t) {
	return function() {
		zl(this, e).duration = +t.apply(this, arguments);
	};
}
function du(e, t) {
	return t = +t, function() {
		zl(this, e).duration = t;
	};
}
function fu(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? uu : du)(t, e)) : Bl(this.node(), t).duration;
}
//#endregion
//#region node_modules/d3-transition/src/transition/ease.js
function pu(e, t) {
	if (typeof t != "function") throw Error();
	return function() {
		zl(this, e).ease = t;
	};
}
function mu(e) {
	var t = this._id;
	return arguments.length ? this.each(pu(t, e)) : Bl(this.node(), t).ease;
}
//#endregion
//#region node_modules/d3-transition/src/transition/easeVarying.js
function hu(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		if (typeof n != "function") throw Error();
		zl(this, e).ease = n;
	};
}
function gu(e) {
	if (typeof e != "function") throw Error();
	return this.each(hu(this._id, e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/filter.js
function _u(e) {
	typeof e != "function" && (e = Ya(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Ku(r, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/merge.js
function vu(e) {
	if (e._id !== this._id) throw Error();
	for (var t = this._groups, n = e._groups, r = t.length, i = n.length, a = Math.min(r, i), o = Array(r), s = 0; s < a; ++s) for (var c = t[s], l = n[s], u = c.length, d = o[s] = Array(u), f, p = 0; p < u; ++p) (f = c[p] || l[p]) && (d[p] = f);
	for (; s < r; ++s) o[s] = t[s];
	return new Ku(o, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/on.js
function yu(e) {
	return (e + "").trim().split(/^|\s+/).every(function(e) {
		var t = e.indexOf(".");
		return t >= 0 && (e = e.slice(0, t)), !e || e === "start";
	});
}
function bu(e, t, n) {
	var r, i, a = yu(t) ? Rl : zl;
	return function() {
		var o = a(this, e), s = o.on;
		s !== r && (i = (r = s).copy()).on(t, n), o.on = i;
	};
}
function xu(e, t) {
	var n = this._id;
	return arguments.length < 2 ? Bl(this.node(), n).on.on(e) : this.each(bu(n, e, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/remove.js
function Su(e) {
	return function() {
		var t = this.parentNode;
		for (var n in this.__transition) if (+n !== e) return;
		t && t.removeChild(this);
	};
}
function Cu() {
	return this.on("end.remove", Su(this._id));
}
//#endregion
//#region node_modules/d3-transition/src/transition/select.js
function wu(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = Ha(e));
	for (var r = this._groups, i = r.length, a = Array(i), o = 0; o < i; ++o) for (var s = r[o], c = s.length, l = a[o] = Array(c), u, d, f = 0; f < c; ++f) (u = s[f]) && (d = e.call(u, u.__data__, f, s)) && ("__data__" in u && (d.__data__ = u.__data__), l[f] = d, Ll(l[f], t, n, f, l, Bl(u, n)));
	return new Ku(a, this._parents, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selectAll.js
function Tu(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = Ka(e));
	for (var r = this._groups, i = r.length, a = [], o = [], s = 0; s < i; ++s) for (var c = r[s], l = c.length, u, d = 0; d < l; ++d) if (u = c[d]) {
		for (var f = e.call(u, u.__data__, d, c), p, m = Bl(u, n), h = 0, g = f.length; h < g; ++h) (p = f[h]) && Ll(p, t, n, h, f, m);
		a.push(f), o.push(u);
	}
	return new Ku(a, o, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selection.js
var Eu = Ns.prototype.constructor;
function Du() {
	return new Eu(this._groups, this._parents);
}
//#endregion
//#region node_modules/d3-transition/src/transition/style.js
function Ou(e, t) {
	var n, r, i;
	return function() {
		var a = Bo(this, e), o = (this.style.removeProperty(e), Bo(this, e));
		return a === o ? null : a === n && o === r ? i : i = t(n = a, r = o);
	};
}
function ku(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function Au(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = Bo(this, e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function ju(e, t, n) {
	var r, i, a;
	return function() {
		var o = Bo(this, e), s = n(this), c = s + "";
		return s ?? (c = s = (this.style.removeProperty(e), Bo(this, e))), o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s));
	};
}
function Mu(e, t) {
	var n, r, i, a = "style." + t, o = "end." + a, s;
	return function() {
		var c = zl(this, e), l = c.on, u = c.value[a] == null ? s ||= ku(t) : void 0;
		(l !== n || i !== u) && (r = (n = l).copy()).on(o, i = u), c.on = r;
	};
}
function Nu(e, t, n) {
	var r = (e += "") == "transform" ? sl : Jl;
	return t == null ? this.styleTween(e, Ou(e, r)).on("end.style." + e, ku(e)) : typeof t == "function" ? this.styleTween(e, ju(e, r, ql(this, "style." + e, t))).each(Mu(this._id, e)) : this.styleTween(e, Au(e, r, t), n).on("end.style." + e, null);
}
//#endregion
//#region node_modules/d3-transition/src/transition/styleTween.js
function Pu(e, t, n) {
	return function(r) {
		this.style.setProperty(e, t.call(this, r), n);
	};
}
function Fu(e, t, n) {
	var r, i;
	function a() {
		var a = t.apply(this, arguments);
		return a !== i && (r = (i = a) && Pu(e, a, n)), r;
	}
	return a._value = t, a;
}
function Iu(e, t, n) {
	var r = "style." + (e += "");
	if (arguments.length < 2) return (r = this.tween(r)) && r._value;
	if (t == null) return this.tween(r, null);
	if (typeof t != "function") throw Error();
	return this.tween(r, Fu(e, t, n ?? ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/text.js
function Lu(e) {
	return function() {
		this.textContent = e;
	};
}
function Ru(e) {
	return function() {
		var t = e(this);
		this.textContent = t ?? "";
	};
}
function zu(e) {
	return this.tween("text", typeof e == "function" ? Ru(ql(this, "text", e)) : Lu(e == null ? "" : e + ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/textTween.js
function Bu(e) {
	return function(t) {
		this.textContent = e.call(this, t);
	};
}
function Vu(e) {
	var t, n;
	function r() {
		var r = e.apply(this, arguments);
		return r !== n && (t = (n = r) && Bu(r)), t;
	}
	return r._value = e, r;
}
function Hu(e) {
	var t = "text";
	if (arguments.length < 1) return (t = this.tween(t)) && t._value;
	if (e == null) return this.tween(t, null);
	if (typeof e != "function") throw Error();
	return this.tween(t, Vu(e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/transition.js
function Uu() {
	for (var e = this._name, t = this._id, n = qu(), r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) if (c = o[l]) {
		var u = Bl(c, t);
		Ll(c, e, n, l, o, {
			time: u.time + u.delay + u.duration,
			delay: 0,
			duration: u.duration,
			ease: u.ease
		});
	}
	return new Ku(r, this._parents, e, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/end.js
function Wu() {
	var e, t, n = this, r = n._id, i = n.size();
	return new Promise(function(a, o) {
		var s = { value: o }, c = { value: function() {
			--i === 0 && a();
		} };
		n.each(function() {
			var n = zl(this, r), i = n.on;
			i !== e && (t = (e = i).copy(), t._.cancel.push(s), t._.interrupt.push(s), t._.end.push(c)), n.on = t;
		}), i === 0 && a();
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/index.js
var Gu = 0;
function Ku(e, t, n, r) {
	this._groups = e, this._parents = t, this._name = n, this._id = r;
}
function qu() {
	return ++Gu;
}
var Ju = Ns.prototype;
Ku.prototype = {
	constructor: Ku,
	select: wu,
	selectAll: Tu,
	selectChild: Ju.selectChild,
	selectChildren: Ju.selectChildren,
	filter: _u,
	merge: vu,
	selection: Du,
	transition: Uu,
	call: Ju.call,
	nodes: Ju.nodes,
	node: Ju.node,
	size: Ju.size,
	empty: Ju.empty,
	each: Ju.each,
	on: xu,
	attr: tu,
	attrTween: ou,
	style: Nu,
	styleTween: Iu,
	text: zu,
	textTween: Hu,
	remove: Cu,
	tween: Kl,
	delay: lu,
	duration: fu,
	ease: mu,
	easeVarying: gu,
	end: Wu,
	[Symbol.iterator]: Ju[Symbol.iterator]
};
//#endregion
//#region node_modules/d3-ease/src/cubic.js
function Yu(e) {
	return ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2;
}
//#endregion
//#region node_modules/d3-transition/src/selection/transition.js
var Xu = {
	time: null,
	delay: 0,
	duration: 250,
	ease: Yu
};
function Zu(e, t) {
	for (var n; !(n = e.__transition) || !(n = n[t]);) if (!(e = e.parentNode)) throw Error(`transition ${t} not found`);
	return n;
}
function Qu(e) {
	var t, n;
	e instanceof Ku ? (t = e._id, e = e._name) : (t = qu(), (n = Xu).time = Tl(), e = e == null ? null : e + "");
	for (var r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && Ll(c, e, t, l, o, n || Zu(c, t));
	return new Ku(r, this._parents, e, t);
}
Ns.prototype.interrupt = Ul, Ns.prototype.transition = Qu;
//#endregion
//#region node_modules/d3-zoom/src/constant.js
var $u = (e) => () => e;
//#endregion
//#region node_modules/d3-zoom/src/event.js
function ed(e, { sourceEvent: t, target: n, transform: r, dispatch: i }) {
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
function td(e, t, n) {
	this.k = e, this.x = t, this.y = n;
}
td.prototype = {
	constructor: td,
	scale: function(e) {
		return e === 1 ? this : new td(this.k * e, this.x, this.y);
	},
	translate: function(e, t) {
		return e === 0 & t === 0 ? this : new td(this.k, this.x + this.k * e, this.y + this.k * t);
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
var nd = new td(1, 0, 0);
rd.prototype = td.prototype;
function rd(e) {
	for (; !e.__zoom;) if (!(e = e.parentNode)) return nd;
	return e.__zoom;
}
//#endregion
//#region node_modules/d3-zoom/src/noevent.js
function id(e) {
	e.stopImmediatePropagation();
}
function ad(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-zoom/src/zoom.js
function od(e) {
	return (!e.ctrlKey || e.type === "wheel") && !e.button;
}
function sd() {
	var e = this;
	return e instanceof SVGElement ? (e = e.ownerSVGElement || e, e.hasAttribute("viewBox") ? (e = e.viewBox.baseVal, [[e.x, e.y], [e.x + e.width, e.y + e.height]]) : [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]]) : [[0, 0], [e.clientWidth, e.clientHeight]];
}
function cd() {
	return this.__zoom || nd;
}
function ld(e) {
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * (e.ctrlKey ? 10 : 1);
}
function ud() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function dd(e, t, n) {
	var r = e.invertX(t[0][0]) - n[0][0], i = e.invertX(t[1][0]) - n[1][0], a = e.invertY(t[0][1]) - n[0][1], o = e.invertY(t[1][1]) - n[1][1];
	return e.translate(i > r ? (r + i) / 2 : Math.min(0, r) || Math.max(0, i), o > a ? (a + o) / 2 : Math.min(0, a) || Math.max(0, o));
}
function fd() {
	var e = od, t = sd, n = dd, r = ld, i = ud, a = [0, Infinity], o = [[-Infinity, -Infinity], [Infinity, Infinity]], s = 250, c = pl, l = ja("start", "zoom", "end"), u, d, f, p = 500, m = 150, h = 0, g = 10;
	function _(e) {
		e.property("__zoom", cd).on("wheel.zoom", w, { passive: !1 }).on("mousedown.zoom", T).on("dblclick.zoom", E).filter(i).on("touchstart.zoom", D).on("touchmove.zoom", ee).on("touchend.zoom touchcancel.zoom", te).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	_.transform = function(e, t, n, r) {
		var i = e.selection ? e.selection() : e;
		i.property("__zoom", cd), e === i ? i.interrupt().each(function() {
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
			return n(nd.translate(c[0], c[1]).scale(s.k).translate(typeof r == "function" ? -r.apply(this, arguments) : -r, typeof i == "function" ? -i.apply(this, arguments) : -i), e, o);
		}, a, s);
	};
	function v(e, t) {
		return t = Math.max(a[0], Math.min(a[1], t)), t === e.k ? e : new td(t, e.x, e.y);
	}
	function y(e, t, n) {
		var r = t[0] - n[0] * e.k, i = t[1] - n[1] * e.k;
		return r === e.x && i === e.y ? e : new td(e.k, r, i);
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
					e = new td(n, l[0] - t[0] * n, l[1] - t[1] * n);
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
			var t = Fs(this.that).datum();
			l.call(e, this.that, new ed(e, {
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
		var s = S(this, i).event(t), c = this.__zoom, l = Math.max(a[0], Math.min(a[1], c.k * 2 ** r.apply(this, arguments))), u = Ls(t);
		if (s.wheel) (s.mouse[0][0] !== u[0] || s.mouse[0][1] !== u[1]) && (s.mouse[1] = c.invert(s.mouse[0] = u)), clearTimeout(s.wheel);
		else if (c.k === l) return;
		else s.mouse = [u, c.invert(u)], Hl(this), s.start();
		ad(t), s.wheel = setTimeout(d, m), s.zoom("mouse", n(y(v(c, l), s.mouse[0], s.mouse[1]), s.extent, o));
		function d() {
			s.wheel = null, s.end();
		}
	}
	function T(t, ...r) {
		if (f || !e.apply(this, arguments)) return;
		var i = t.currentTarget, a = S(this, r, !0).event(t), s = Fs(t.view).on("mousemove.zoom", d, !0).on("mouseup.zoom", p, !0), c = Ls(t, i), l = t.clientX, u = t.clientY;
		Hs(t.view), id(t), a.mouse = [c, this.__zoom.invert(c)], Hl(this), a.start();
		function d(e) {
			if (ad(e), !a.moved) {
				var t = e.clientX - l, r = e.clientY - u;
				a.moved = t * t + r * r > h;
			}
			a.event(e).zoom("mouse", n(y(a.that.__zoom, a.mouse[0] = Ls(e, i), a.mouse[1]), a.extent, o));
		}
		function p(e) {
			s.on("mousemove.zoom mouseup.zoom", null), Us(e.view, a.moved), ad(e), a.event(e).end();
		}
	}
	function E(r, ...i) {
		if (e.apply(this, arguments)) {
			var a = this.__zoom, c = Ls(r.changedTouches ? r.changedTouches[0] : r, this), l = a.invert(c), u = a.k * (r.shiftKey ? .5 : 2), d = n(y(v(a, u), c, l), t.apply(this, i), o);
			ad(r), s > 0 ? Fs(this).transition().duration(s).call(x, d, c, r) : Fs(this).call(_.transform, d, c, r);
		}
	}
	function D(t, ...n) {
		if (e.apply(this, arguments)) {
			var r = t.touches, i = r.length, a = S(this, n, t.changedTouches.length === i).event(t), o, s, c, l;
			for (id(t), s = 0; s < i; ++s) c = r[s], l = Ls(c, this), l = [
				l,
				this.__zoom.invert(l),
				c.identifier
			], a.touch0 ? !a.touch1 && a.touch0[2] !== l[2] && (a.touch1 = l, a.taps = 0) : (a.touch0 = l, o = !0, a.taps = 1 + !!u);
			u &&= clearTimeout(u), o && (a.taps < 2 && (d = l[0], u = setTimeout(function() {
				u = null;
			}, p)), Hl(this), a.start());
		}
	}
	function ee(e, ...t) {
		if (this.__zooming) {
			var r = S(this, t).event(e), i = e.changedTouches, a = i.length, s, c, l, u;
			for (ad(e), s = 0; s < a; ++s) c = i[s], l = Ls(c, this), r.touch0 && r.touch0[2] === c.identifier ? r.touch0[0] = l : r.touch1 && r.touch1[2] === c.identifier && (r.touch1[0] = l);
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
			for (id(e), f && clearTimeout(f), f = setTimeout(function() {
				f = null;
			}, p), a = 0; a < i; ++a) o = r[a], n.touch0 && n.touch0[2] === o.identifier ? delete n.touch0 : n.touch1 && n.touch1[2] === o.identifier && delete n.touch1;
			if (n.touch1 && !n.touch0 && (n.touch0 = n.touch1, delete n.touch1), n.touch0) n.touch0[1] = this.__zoom.invert(n.touch0[0]);
			else if (n.end(), n.taps === 2 && (o = Ls(o, this), Math.hypot(d[0] - o[0], d[1] - o[1]) < g)) {
				var s = Fs(this).on("dblclick.zoom");
				s && s.apply(this, arguments);
			}
		}
	}
	return _.wheelDelta = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : $u(+e), _) : r;
	}, _.filter = function(t) {
		return arguments.length ? (e = typeof t == "function" ? t : $u(!!t), _) : e;
	}, _.touchable = function(e) {
		return arguments.length ? (i = typeof e == "function" ? e : $u(!!e), _) : i;
	}, _.extent = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : $u([[+e[0][0], +e[0][1]], [+e[1][0], +e[1][1]]]), _) : t;
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
var pd = {
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
}, md = [[-Infinity, -Infinity], [Infinity, Infinity]], hd = [
	"Enter",
	" ",
	"Escape"
], gd = {
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
}, _d;
(function(e) {
	e.Strict = "strict", e.Loose = "loose";
})(_d ||= {});
var vd;
(function(e) {
	e.Free = "free", e.Vertical = "vertical", e.Horizontal = "horizontal";
})(vd ||= {});
var yd;
(function(e) {
	e.Partial = "partial", e.Full = "full";
})(yd ||= {});
var bd = {
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
}, xd;
(function(e) {
	e.Bezier = "default", e.Straight = "straight", e.Step = "step", e.SmoothStep = "smoothstep", e.SimpleBezier = "simplebezier";
})(xd ||= {});
var Sd;
(function(e) {
	e.Arrow = "arrow", e.ArrowClosed = "arrowclosed";
})(Sd ||= {});
var $;
(function(e) {
	e.Left = "left", e.Top = "top", e.Right = "right", e.Bottom = "bottom";
})($ ||= {});
var Cd = {
	[$.Left]: $.Right,
	[$.Right]: $.Left,
	[$.Top]: $.Bottom,
	[$.Bottom]: $.Top
}, wd = (e) => !!e && typeof e == "object" && "id" in e && "source" in e && "target" in e, Td = (e) => !!e && typeof e == "object" && "id" in e && "position" in e && !("source" in e) && !("target" in e), Ed = (e) => !!e && typeof e == "object" && "id" in e && "internals" in e && !("source" in e) && !("target" in e), Dd = (e, t = [0, 0]) => {
	let { width: n, height: r } = cf(e), i = e.origin ?? t, a = n * i[0], o = r * i[1];
	return {
		x: e.position.x - a,
		y: e.position.y - o
	};
}, Od = (e, t = { nodeOrigin: [0, 0] }) => {
	if (e.length === 0) return {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	let n = !1, r = e.reduce((e, r) => {
		let i = typeof r == "string", a = !t.nodeLookup && !i ? r : void 0;
		return t.nodeLookup && (a = i ? t.nodeLookup.get(r) : Ed(r) ? r : t.nodeLookup.get(r.id)), a ? (n = !0, Vd(e, Gd(a, t.nodeOrigin))) : e;
	}, {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	});
	return n ? Ud(r) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, kd = (e, t = {}) => {
	let n = {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	}, r = !1;
	return e.forEach((e) => {
		(t.filter === void 0 || t.filter(e)) && (n = Vd(n, Gd(e)), r = !0);
	}), r ? Ud(n) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, Ad = (e, t, [n, r, i] = [
	0,
	0,
	1
], a = !1, o = !1) => {
	let s = (t.x - n) / i, c = (t.y - r) / i, l = t.width / i, u = t.height / i, d = [];
	for (let t of e.values()) {
		let { measured: e, selectable: n = !0, hidden: r = !1 } = t;
		if (o && !n || r) continue;
		let i = e.width ?? t.width ?? t.initialWidth ?? 0, f = e.height ?? t.height ?? t.initialHeight ?? 0, { x: p, y: m } = t.internals.positionAbsolute, h = qd(s, c, l, u, p, m, i, f), g = i * f, _ = a && h > 0;
		(!t.internals.handleBounds || _ || h >= g || t.dragging) && d.push(t);
	}
	return d;
}, jd = (e, t) => {
	let n = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		n.add(e.id);
	}), t.filter((e) => n.has(e.source) || n.has(e.target));
};
function Md(e, t) {
	let n = /* @__PURE__ */ new Map(), r = t?.nodes ? new Set(t.nodes.map((e) => e.id)) : null;
	return e.forEach((e) => {
		let i;
		if (t?.includeHiddenNodes) {
			let { width: t, height: n } = cf(e);
			i = t > 0 && n > 0;
		} else i = !!(e.measured.width && e.measured.height && !e.hidden);
		i && (!r || r.has(e.id)) && n.set(e.id, e);
	}), n;
}
async function Nd({ nodes: e, width: t, height: n, panZoom: r, minZoom: i, maxZoom: a }, o) {
	if (e.size === 0) return !0;
	let s = af(kd(Md(e, o)), t, n, o?.minZoom ?? i, o?.maxZoom ?? a, o?.padding ?? .1);
	return await r.setViewport(s, {
		duration: o?.duration,
		ease: o?.ease,
		interpolate: o?.interpolate
	}), !0;
}
function Pd({ nodeId: e, nextPosition: t, nodeLookup: n, nodeOrigin: r = [0, 0], nodeExtent: i, onError: a }) {
	let o = n.get(e), s = o.parentId ? n.get(o.parentId) : void 0, { x: c, y: l } = s ? s.internals.positionAbsolute : {
		x: 0,
		y: 0
	}, u = o.origin ?? r, d = o.extent || i;
	if (o.extent === "parent" && !o.expandParent) {
		if (!s) a?.("005", pd.error005());
		else {
			let { width: e, height: t } = cf(s);
			e && t && (d = [[c, l], [c + e, l + t]]);
		}
	} else s && sf(o.extent) && (d = [[o.extent[0][0] + c, o.extent[0][1] + l], [o.extent[1][0] + c, o.extent[1][1] + l]]);
	let f = sf(d) ? Ld(t, d, o.measured) : t;
	return (o.measured.width === void 0 || o.measured.height === void 0) && a?.("015", pd.error015()), {
		position: {
			x: f.x - c + (o.measured.width ?? 0) * u[0],
			y: f.y - l + (o.measured.height ?? 0) * u[1]
		},
		positionAbsolute: f
	};
}
async function Fd({ nodesToRemove: e = [], edgesToRemove: t = [], nodes: n, edges: r, onBeforeDelete: i }) {
	let a = new Set(e.map((e) => e.id)), o = [];
	for (let e of n) {
		if (e.deletable === !1) continue;
		let t = a.has(e.id), n = !t && e.parentId && o.find((t) => t.id === e.parentId);
		(t || n) && o.push(e);
	}
	let s = new Set(t.map((e) => e.id)), c = r.filter((e) => e.deletable !== !1), l = jd(o, c);
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
var Id = (e, t = 0, n = 1) => Math.min(Math.max(e, t), n), Ld = (e = {
	x: 0,
	y: 0
}, t, n) => ({
	x: Id(e.x, t[0][0], t[1][0] - (n?.width ?? 0)),
	y: Id(e.y, t[0][1], t[1][1] - (n?.height ?? 0))
});
function Rd(e, t, n) {
	let { width: r, height: i } = cf(n), { x: a, y: o } = n.internals.positionAbsolute;
	return Ld(e, [[a, o], [a + r, o + i]], t);
}
var zd = (e, t, n) => e < t ? Id(Math.abs(e - t), 1, t) / t : e > n ? -Id(Math.abs(e - n), 1, t) / t : 0, Bd = (e, t, n = 15, r = 40) => [zd(e.x, r, t.width - r) * n, zd(e.y, r, t.height - r) * n], Vd = (e, t) => ({
	x: Math.min(e.x, t.x),
	y: Math.min(e.y, t.y),
	x2: Math.max(e.x2, t.x2),
	y2: Math.max(e.y2, t.y2)
}), Hd = ({ x: e, y: t, width: n, height: r }) => ({
	x: e,
	y: t,
	x2: e + n,
	y2: t + r
}), Ud = ({ x: e, y: t, x2: n, y2: r }) => ({
	x: e,
	y: t,
	width: n - e,
	height: r - t
}), Wd = (e, t = [0, 0]) => {
	let { x: n, y: r } = Ed(e) ? e.internals.positionAbsolute : Dd(e, t);
	return {
		x: n,
		y: r,
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}, Gd = (e, t = [0, 0]) => {
	let { x: n, y: r } = Ed(e) ? e.internals.positionAbsolute : Dd(e, t);
	return {
		x: n,
		y: r,
		x2: n + (e.measured?.width ?? e.width ?? e.initialWidth ?? 0),
		y2: r + (e.measured?.height ?? e.height ?? e.initialHeight ?? 0)
	};
}, Kd = (e, t) => Ud(Vd(Hd(e), Hd(t))), qd = (e, t, n, r, i, a, o, s) => {
	let c = Math.max(0, Math.min(e + n, i + o) - Math.max(e, i)), l = Math.max(0, Math.min(t + r, a + s) - Math.max(t, a));
	return Math.ceil(c * l);
}, Jd = (e, t) => qd(e.x, e.y, e.width, e.height, t.x, t.y, t.width, t.height), Yd = (e) => Xd(e.width) && Xd(e.height) && Xd(e.x) && Xd(e.y), Xd = (e) => !isNaN(e) && isFinite(e), Zd = (e, t) => (e, t) => {}, Qd = (e, t = [1, 1]) => ({
	x: t[0] * Math.round(e.x / t[0]),
	y: t[1] * Math.round(e.y / t[1])
}), $d = ({ x: e, y: t }, [n, r, i], a = !1, o = [1, 1]) => {
	let s = {
		x: (e - n) / i,
		y: (t - r) / i
	};
	return a ? Qd(s, o) : s;
}, ef = ({ x: e, y: t }, [n, r, i]) => ({
	x: e * i + n,
	y: t * i + r
});
function tf(e, t) {
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
function nf(e, t, n) {
	if (typeof e == "string" || typeof e == "number") {
		let r = tf(e, n), i = tf(e, t);
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
		let r = tf(e.top ?? e.y ?? 0, n), i = tf(e.bottom ?? e.y ?? 0, n), a = tf(e.left ?? e.x ?? 0, t), o = tf(e.right ?? e.x ?? 0, t);
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
function rf(e, t, n, r, i, a) {
	let { x: o, y: s } = ef(e, [
		t,
		n,
		r
	]), { x: c, y: l } = ef({
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
var af = (e, t, n, r, i, a) => {
	let o = nf(a, t, n), s = (t - o.x) / e.width, c = (n - o.y) / e.height, l = Id(Math.min(s, c), r, i), u = e.x + e.width / 2, d = e.y + e.height / 2, f = t / 2 - u * l, p = n / 2 - d * l, m = rf(e, f, p, l, t, n), h = {
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
}, of = () => typeof navigator < "u" && navigator?.userAgent?.indexOf("Mac") >= 0;
function sf(e) {
	return e != null && e !== "parent";
}
function cf(e) {
	return {
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}
function lf(e) {
	return (e.measured?.width ?? e.width ?? e.initialWidth) !== void 0 && (e.measured?.height ?? e.height ?? e.initialHeight) !== void 0;
}
function uf(e, t = {
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
function df(e) {
	return {
		...gd,
		...e || {}
	};
}
function ff(e, t) {
	if (!e && !t) return !0;
	if (!e || !t || e.size !== t.size) return !1;
	if (!e.size && !t.size) return !0;
	for (let n of e.keys()) if (!t.has(n)) return !1;
	return !0;
}
function pf(e, t, n) {
	if (!n) return;
	let r = [];
	e.forEach((e, n) => {
		t?.has(n) || r.push(e);
	}), r.length && n(r);
}
function mf(e) {
	return e === null ? null : e ? "valid" : "invalid";
}
function hf(e, { snapGrid: t = [0, 0], snapToGrid: n = !1, transform: r, containerBounds: i }) {
	let { x: a, y: o } = xf(e), s = $d({
		x: a - (i?.left ?? 0),
		y: o - (i?.top ?? 0)
	}, r), { x: c, y: l } = n ? Qd(s, t) : s;
	return {
		xSnapped: c,
		ySnapped: l,
		...s
	};
}
var gf = (e) => ({
	width: e.offsetWidth,
	height: e.offsetHeight
}), _f = (e) => e?.getRootNode?.() || window?.document, vf = [
	"INPUT",
	"SELECT",
	"TEXTAREA"
];
function yf(e) {
	let t = e.composedPath?.()?.[0] || e.target;
	return t?.nodeType === 1 ? vf.includes(t.nodeName) || t.hasAttribute("contenteditable") || !!t.closest(".nokey") : !1;
}
var bf = (e) => "clientX" in e, xf = (e, t) => {
	let n = bf(e), r = n ? e.clientX : e.touches?.[0].clientX, i = n ? e.clientY : e.touches?.[0].clientY;
	return {
		x: r - (t?.left ?? 0),
		y: i - (t?.top ?? 0)
	};
}, Sf = (e, t, n, r, i) => {
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
			...gf(t)
		};
	});
};
function Cf({ sourceX: e, sourceY: t, targetX: n, targetY: r, sourceControlX: i, sourceControlY: a, targetControlX: o, targetControlY: s }) {
	let c = e * .125 + i * .375 + o * .375 + n * .125, l = t * .125 + a * .375 + s * .375 + r * .125;
	return [
		c,
		l,
		Math.abs(c - e),
		Math.abs(l - t)
	];
}
function wf(e, t) {
	return e >= 0 ? .5 * e : t * 25 * Math.sqrt(-e);
}
function Tf({ pos: e, x1: t, y1: n, x2: r, y2: i, c: a }) {
	switch (e) {
		case $.Left: return [t - wf(t - r, a), n];
		case $.Right: return [t + wf(r - t, a), n];
		case $.Top: return [t, n - wf(n - i, a)];
		case $.Bottom: return [t, n + wf(i - n, a)];
	}
}
function Ef({ sourceX: e, sourceY: t, sourcePosition: n = $.Bottom, targetX: r, targetY: i, targetPosition: a = $.Top, curvature: o = .25 }) {
	let [s, c] = Tf({
		pos: n,
		x1: e,
		y1: t,
		x2: r,
		y2: i,
		c: o
	}), [l, u] = Tf({
		pos: a,
		x1: r,
		y1: i,
		x2: e,
		y2: t,
		c: o
	}), [d, f, p, m] = Cf({
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
function Df({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let i = Math.abs(n - e) / 2, a = n < e ? n + i : n - i, o = Math.abs(r - t) / 2;
	return [
		a,
		r < t ? r + o : r - o,
		i,
		o
	];
}
function Of({ sourceNode: e, targetNode: t, selected: n = !1, zIndex: r = 0, elevateOnSelect: i = !1, zIndexMode: a = "basic" }) {
	return a === "manual" ? r : (i && n ? r + 1e3 : r) + Math.max(e.parentId || i && e.selected ? e.internals.z : 0, t.parentId || i && t.selected ? t.internals.z : 0);
}
function kf({ sourceNode: e, targetNode: t, width: n, height: r, transform: i }) {
	let a = Vd(Gd(e), Gd(t));
	return a.x === a.x2 && (a.x2 += 1), a.y === a.y2 && (a.y2 += 1), Jd({
		x: -i[0] / i[2],
		y: -i[1] / i[2],
		width: n / i[2],
		height: r / i[2]
	}, Ud(a)) > 0;
}
var Af = ({ source: e, sourceHandle: t, target: n, targetHandle: r }) => `xy-edge__${e}${t || ""}-${n}${r || ""}`, jf = (e, t) => t.some((t) => t.source === e.source && t.target === e.target && (t.sourceHandle === e.sourceHandle || !t.sourceHandle && !e.sourceHandle) && (t.targetHandle === e.targetHandle || !t.targetHandle && !e.targetHandle)), Mf = (e, t, n = {}) => {
	if (!e.source || !e.target) return n.onError?.("006", pd.error006()), t;
	let r = n.getEdgeId || Af, i;
	return i = wd(e) ? { ...e } : {
		...e,
		id: r(e)
	}, jf(i, t) ? t : (i.sourceHandle === null && delete i.sourceHandle, i.targetHandle === null && delete i.targetHandle, t.concat(i));
};
function Nf({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let [i, a, o, s] = Df({
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
var Pf = {
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
}, Ff = ({ source: e, sourcePosition: t = $.Bottom, target: n }) => t === $.Left || t === $.Right ? e.x < n.x ? {
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
}, If = (e, t) => Math.sqrt((t.x - e.x) ** 2 + (t.y - e.y) ** 2);
function Lf({ source: e, sourcePosition: t = $.Bottom, target: n, targetPosition: r = $.Top, center: i, offset: a, stepPosition: o }) {
	let s = Pf[t], c = Pf[r], l = {
		x: e.x + s.x * a,
		y: e.y + s.y * a
	}, u = {
		x: n.x + c.x * a,
		y: n.y + c.y * a
	}, d = Ff({
		source: l,
		sourcePosition: t,
		target: u
	}), f = d.x === 0 ? "y" : "x", p = d[f], m = [], h, g, _ = {
		x: 0,
		y: 0
	}, v = {
		x: 0,
		y: 0
	}, [, , y, b] = Df({
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
function Rf(e, t, n, r) {
	let i = Math.min(If(e, t) / 2, If(t, n) / 2, r), { x: a, y: o } = t;
	if (e.x === a && a === n.x || e.y === o && o === n.y) return `L${a} ${o}`;
	if (e.y === o) {
		let t = e.x < n.x ? -1 : 1, r = e.y < n.y ? 1 : -1;
		return `L ${a + i * t},${o}Q ${a},${o} ${a},${o + i * r}`;
	}
	let s = e.x < n.x ? 1 : -1;
	return `L ${a},${o + i * (e.y < n.y ? -1 : 1)}Q ${a},${o} ${a + i * s},${o}`;
}
function zf({ sourceX: e, sourceY: t, sourcePosition: n = $.Bottom, targetX: r, targetY: i, targetPosition: a = $.Top, borderRadius: o = 5, centerX: s, centerY: c, offset: l = 20, stepPosition: u = .5 }) {
	let [d, f, p, m, h] = Lf({
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
	for (let e = 1; e < d.length - 1; e++) g += Rf(d[e - 1], d[e], d[e + 1], o);
	return g += `L${d[d.length - 1].x} ${d[d.length - 1].y}`, [
		g,
		f,
		p,
		m,
		h
	];
}
function Bf(e) {
	return e && !!(e.internals.handleBounds || e.handles?.length) && !!(e.measured.width || e.width || e.initialWidth);
}
function Vf(e) {
	let { sourceNode: t, targetNode: n } = e;
	if (!Bf(t) || !Bf(n)) return null;
	let r = t.internals.handleBounds || Hf(t.handles), i = n.internals.handleBounds || Hf(n.handles), a = Wf(r?.source ?? [], e.sourceHandle), o = Wf(e.connectionMode === _d.Strict ? i?.target ?? [] : (i?.target ?? []).concat(i?.source ?? []), e.targetHandle);
	if (!a || !o) return e.onError?.("008", pd.error008(a ? "target" : "source", {
		id: e.id,
		sourceHandle: e.sourceHandle,
		targetHandle: e.targetHandle
	})), null;
	let s = a?.position || $.Bottom, c = o?.position || $.Top, l = Uf(t, a, s), u = Uf(n, o, c);
	return {
		sourceX: l.x,
		sourceY: l.y,
		targetX: u.x,
		targetY: u.y,
		sourcePosition: s,
		targetPosition: c
	};
}
function Hf(e) {
	if (!e) return null;
	let t = [], n = [];
	for (let r of e) r.width = r.width ?? 1, r.height = r.height ?? 1, r.type === "source" ? t.push(r) : r.type === "target" && n.push(r);
	return {
		source: t,
		target: n
	};
}
function Uf(e, t, n = $.Left, r = !1) {
	let i = (t?.x ?? 0) + e.internals.positionAbsolute.x, a = (t?.y ?? 0) + e.internals.positionAbsolute.y, { width: o, height: s } = t ?? cf(e);
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
function Wf(e, t) {
	return e && (t ? e.find((e) => e.id === t) : e[0]) || null;
}
function Gf(e, t) {
	return e ? typeof e == "string" ? e : `${t ? `${t}__` : ""}${Object.keys(e).sort().map((t) => `${t}=${e[t]}`).join("&")}` : "";
}
function Kf(e, { id: t, defaultColor: n, defaultMarkerStart: r, defaultMarkerEnd: i }) {
	let a = /* @__PURE__ */ new Set();
	return e.reduce((e, o) => ([o.markerStart || r, o.markerEnd || i].forEach((r) => {
		if (r && typeof r == "object") {
			let i = Gf(r, t);
			a.has(i) || (e.push({
				id: i,
				color: r.color || n,
				...r
			}), a.add(i));
		}
	}), e), []).sort((e, t) => e.id.localeCompare(t.id));
}
var qf = 1e3, Jf = 10, Yf = {
	nodeOrigin: [0, 0],
	nodeExtent: md,
	elevateNodesOnSelect: !0,
	zIndexMode: "basic",
	defaults: {}
}, Xf = {
	...Yf,
	checkEquality: !0
};
function Zf(e, t) {
	let n = { ...e };
	for (let e in t) t[e] !== void 0 && (n[e] = t[e]);
	return n;
}
function Qf(e, t, n) {
	let r = Zf(Yf, n);
	for (let n of e.values()) if (n.parentId) rp(n, e, t, r);
	else {
		let e = Ld(Dd(n, r.nodeOrigin), sf(n.extent) ? n.extent : r.nodeExtent, cf(n));
		n.internals.positionAbsolute = e;
	}
}
function $f(e, t) {
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
function ep(e) {
	return e === "manual";
}
function tp(e, t, n, r = {}) {
	let i = Zf(Xf, r), a = { i: 0 }, o = new Map(t), s = i?.elevateNodesOnSelect && !ep(i.zIndexMode) ? qf : 0, c = e.length > 0, l = !1;
	t.clear(), n.clear();
	for (let u of e) {
		let e = o.get(u.id);
		if (i.checkEquality && u === e?.internals.userNode) t.set(u.id, e);
		else {
			let n = Ld(Dd(u, i.nodeOrigin), sf(u.extent) ? u.extent : i.nodeExtent, cf(u));
			e = {
				...i.defaults,
				...u,
				measured: {
					width: u.measured?.width,
					height: u.measured?.height
				},
				internals: {
					positionAbsolute: n,
					handleBounds: $f(u, e),
					z: ip(u, s, i.zIndexMode),
					userNode: u
				}
			}, t.set(u.id, e);
		}
		(e.measured === void 0 || e.measured.width === void 0 || e.measured.height === void 0) && !e.hidden && (c = !1), u.parentId && rp(e, t, n, r, a), l ||= u.selected ?? !1;
	}
	return {
		nodesInitialized: c,
		hasSelectedNodes: l
	};
}
function np(e, t) {
	if (!e.parentId) return;
	let n = t.get(e.parentId);
	n ? n.set(e.id, e) : t.set(e.parentId, /* @__PURE__ */ new Map([[e.id, e]]));
}
function rp(e, t, n, r, i) {
	let { elevateNodesOnSelect: a, nodeOrigin: o, nodeExtent: s, zIndexMode: c } = Zf(Yf, r), l = e.parentId, u = t.get(l);
	if (!u) {
		console.warn(`Parent node ${l} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
		return;
	}
	np(e, n), i && !u.parentId && u.internals.rootParentIndex === void 0 && c === "auto" && (u.internals.rootParentIndex = ++i.i, u.internals.z = u.internals.z + i.i * Jf), i && u.internals.rootParentIndex !== void 0 && (i.i = u.internals.rootParentIndex);
	let { x: d, y: f, z: p } = ap(e, u, o, s, a && !ep(c) ? qf : 0, c), { positionAbsolute: m } = e.internals, h = d !== m.x || f !== m.y;
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
function ip(e, t, n) {
	let r = Xd(e.zIndex) ? e.zIndex : 0;
	return ep(n) ? r : r + (e.selected ? t : 0);
}
function ap(e, t, n, r, i, a) {
	let { x: o, y: s } = t.internals.positionAbsolute, c = cf(e), l = Dd(e, n), u = sf(e.extent) ? Ld(l, e.extent, c) : l, d = Ld({
		x: o + u.x,
		y: s + u.y
	}, r, c);
	e.extent === "parent" && (d = Rd(d, c, t));
	let f = ip(e, i, a), p = t.internals.z ?? 0;
	return {
		x: d.x,
		y: d.y,
		z: p >= f ? p + 1 : f
	};
}
function op(e, t, n, r = [0, 0]) {
	let i = [], a = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.parentId);
		if (!e) continue;
		let r = Kd(a.get(n.parentId)?.expandedRect ?? Wd(e), n.rect);
		a.set(n.parentId, {
			expandedRect: r,
			parent: e
		});
	}
	return a.size > 0 && a.forEach(({ expandedRect: t, parent: a }, o) => {
		let s = a.internals.positionAbsolute, c = cf(a), l = a.origin ?? r, u = t.x < s.x ? Math.round(Math.abs(s.x - t.x)) : 0, d = t.y < s.y ? Math.round(Math.abs(s.y - t.y)) : 0, f = Math.max(c.width, Math.round(t.width)), p = Math.max(c.height, Math.round(t.height)), m = (f - c.width) * l[0], h = (p - c.height) * l[1];
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
function sp(e, t, n, r, i, a, o) {
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
		let s = gf(r.nodeElement), u = e.measured.width !== s.width || e.measured.height !== s.height;
		if (s.width && s.height && (u || !e.internals.handleBounds || r.force)) {
			let p = r.nodeElement.getBoundingClientRect(), m = sf(e.extent) ? e.extent : a, { positionAbsolute: h } = e.internals;
			if (e.parentId && e.extent === "parent") {
				let n = t.get(e.parentId);
				n && (h = Rd(h, s, n));
			} else m && (h = Ld(h, m, s));
			let g = {
				...e,
				measured: s,
				internals: {
					...e.internals,
					positionAbsolute: h,
					handleBounds: {
						source: Sf("source", r.nodeElement, p, d, e.id),
						target: Sf("target", r.nodeElement, p, d, e.id)
					}
				}
			};
			t.set(e.id, g), e.parentId && rp(g, t, n, {
				nodeOrigin: i,
				zIndexMode: o
			}), c = !0, u && (l.push({
				id: e.id,
				type: "dimensions",
				dimensions: s
			}), e.expandParent && e.parentId && f.push({
				id: e.id,
				parentId: e.parentId,
				rect: Wd(g, i)
			}));
		}
	}
	if (f.length > 0) {
		let e = op(f, t, n, i);
		l.push(...e);
	}
	return {
		changes: l,
		updatedInternals: c
	};
}
async function cp({ delta: e, panZoom: t, transform: n, translateExtent: r, width: i, height: a }) {
	if (!t || !e.x && !e.y) return !1;
	let o = await t.setViewportConstrained({
		x: n[0] + e.x,
		y: n[1] + e.y,
		zoom: n[2]
	}, [[0, 0], [i, a]], r);
	return !!o && (o.x !== n[0] || o.y !== n[1] || o.k !== n[2]);
}
function lp(e, t, n, r, i, a) {
	let o = i, s = r.get(o) || /* @__PURE__ */ new Map();
	r.set(o, s.set(n, t)), o = `${i}-${e}`;
	let c = r.get(o) || /* @__PURE__ */ new Map();
	if (r.set(o, c.set(n, t)), a) {
		o = `${i}-${e}-${a}`;
		let s = r.get(o) || /* @__PURE__ */ new Map();
		r.set(o, s.set(n, t));
	}
}
function up(e, t, n) {
	e.clear(), t.clear();
	for (let r of n) {
		let { source: n, target: i, sourceHandle: a = null, targetHandle: o = null } = r, s = {
			edgeId: r.id,
			source: n,
			target: i,
			sourceHandle: a,
			targetHandle: o
		}, c = `${n}-${a}--${i}-${o}`;
		lp("source", s, `${i}-${o}--${n}-${a}`, e, n, a), lp("target", s, c, e, i, o), t.set(r.id, r);
	}
}
function dp(e, t) {
	if (!e.parentId) return !1;
	let n = t.get(e.parentId);
	return n ? n.selected ? !0 : dp(n, t) : !1;
}
function fp(e, t, n) {
	let r = e;
	do {
		if (r?.matches?.(t)) return !0;
		if (r === n) return !1;
		r = r?.parentElement;
	} while (r);
	return !1;
}
function pp(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let [a, o] of e) if ((o.selected || o.id === r) && (!o.parentId || !dp(o, e)) && (o.draggable || t && o.draggable === void 0)) {
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
function mp({ nodeId: e, dragItems: t, nodeLookup: n, dragging: r = !0 }) {
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
function hp({ dragItems: e, snapGrid: t, x: n, y: r }) {
	let i = e.values().next().value;
	if (!i) return null;
	let a = {
		x: n - i.distance.x,
		y: r - i.distance.y
	}, o = Qd(a, t);
	return {
		x: o.x - a.x,
		y: o.y - a.y
	};
}
function gp({ onNodeMouseDown: e, getStoreItems: t, onDragStart: n, onDrag: r, onDragStop: i }) {
	let a = {
		x: null,
		y: null
	}, o = 0, s = /* @__PURE__ */ new Map(), c = !1, l = {
		x: 0,
		y: 0
	}, u = null, d = !1, f = null, p = !1, m = !1, h = null;
	function g({ noDragClassName: g, handleSelector: _, domNode: v, isSelectable: y, nodeId: b, nodeClickDistance: x = 0 }) {
		f = Fs(v);
		function S({ x: e, y: n }) {
			let { nodeLookup: i, nodeExtent: o, snapGrid: c, snapToGrid: l, nodeOrigin: u, onNodeDrag: d, onSelectionDrag: f, onError: p, updateNodePositions: g } = t();
			a = {
				x: e,
				y: n
			};
			let _ = !1, v = s.size > 1, y = v && o ? Hd(kd(s)) : null, x = v && l ? hp({
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
				} : Qd(a, c));
				let s = null;
				if (v && o && !r.extent && y) {
					let { positionAbsolute: e } = r.internals, t = e.x - y.x + o[0][0], n = e.x + r.measured.width - y.x2 + o[1][0], i = e.y - y.y + o[0][1], a = e.y + r.measured.height - y.y2 + o[1][1];
					s = [[t, i], [n, a]];
				}
				let { position: d, positionAbsolute: f } = Pd({
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
				let [e, t] = mp({
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
			let [s, d] = Bd(l, u, r);
			(s !== 0 || d !== 0) && (a.x = (a.x ?? 0) - s / e[2], a.y = (a.y ?? 0) - d / e[2], await n({
				x: s,
				y: d
			}) && S(a)), o = requestAnimationFrame(C);
		}
		function w(r) {
			let { nodeLookup: i, multiSelectionActive: o, nodesDraggable: c, transform: l, snapGrid: f, snapToGrid: p, selectNodesOnDrag: m, onNodeDragStart: h, onSelectionDragStart: g, unselectNodesAndEdges: _ } = t();
			d = !0, (!m || !y) && !o && b && (i.get(b)?.selected || _()), y && m && b && e?.(b);
			let v = hf(r.sourceEvent, {
				transform: l,
				snapGrid: f,
				snapToGrid: p,
				containerBounds: u
			});
			if (a = v, s = pp(i, c, v, b), s.size > 0 && (n || h || !b && g)) {
				let [e, t] = mp({
					nodeId: b,
					dragItems: s,
					nodeLookup: i
				});
				n?.(r.sourceEvent, s, e, t), h?.(r.sourceEvent, e, t), b || g?.(r.sourceEvent, t);
			}
		}
		let T = Xs().clickDistance(x).on("start", (e) => {
			let { domNode: n, nodeDragThreshold: r, transform: i, snapGrid: o, snapToGrid: s } = t();
			u = n?.getBoundingClientRect() || null, p = !1, m = !1, h = e.sourceEvent, r === 0 && w(e), a = hf(e.sourceEvent, {
				transform: i,
				snapGrid: o,
				snapToGrid: s,
				containerBounds: u
			}), l = xf(e.sourceEvent, u);
		}).on("drag", (e) => {
			let { autoPanOnNodeDrag: n, transform: r, snapGrid: i, snapToGrid: o, nodeDragThreshold: f, nodeLookup: m } = t(), g = hf(e.sourceEvent, {
				transform: r,
				snapGrid: i,
				snapToGrid: o,
				containerBounds: u
			});
			if (h = e.sourceEvent, (e.sourceEvent.type === "touchmove" && e.sourceEvent.touches.length > 1 || b && !m.has(b)) && (p = !0), !p) {
				if (!c && n && d && (c = !0, C()), !d) {
					let t = xf(e.sourceEvent, u), n = t.x - l.x, r = t.y - l.y;
					Math.sqrt(n * n + r * r) > f && w(e);
				}
				(a.x !== g.xSnapped || a.y !== g.ySnapped) && s && d && (l = xf(e.sourceEvent, u), S(g));
			}
		}).on("end", (e) => {
			if (!d || p) {
				p && s.size > 0 && t().updateNodePositions(s, !1);
				return;
			}
			if (c = !1, d = !1, cancelAnimationFrame(o), s.size > 0) {
				let { nodeLookup: n, updateNodePositions: r, onNodeDragStop: a, onSelectionDragStop: o } = t();
				if (m &&= (r(s, !1), !1), i || a || !b && o) {
					let [t, r] = mp({
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
			return !e.button && (!g || !fp(t, `.${g}`, v)) && (!_ || fp(t, _, v));
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
function _p(e, t, n) {
	let r = [], i = {
		x: e.x - n,
		y: e.y - n,
		width: n * 2,
		height: n * 2
	};
	for (let e of t.values()) Jd(i, Wd(e)) > 0 && r.push(e);
	return r;
}
var vp = 250;
function yp(e, t, n, r) {
	let i = [], a = Infinity, o = _p(e, n, t + vp);
	for (let n of o) {
		let o = [...n.internals.handleBounds?.source ?? [], ...n.internals.handleBounds?.target ?? []];
		for (let s of o) {
			if (r.nodeId === s.nodeId && r.type === s.type && r.id === s.id) continue;
			let { x: o, y: c } = Uf(n, s, s.position, !0), l = Math.sqrt((o - e.x) ** 2 + (c - e.y) ** 2);
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
function bp(e, t, n, r, i, a = !1) {
	let o = r.get(e);
	if (!o) return null;
	let s = i === "strict" ? o.internals.handleBounds?.[t] : [...o.internals.handleBounds?.source ?? [], ...o.internals.handleBounds?.target ?? []], c = (n ? s?.find((e) => e.id === n) : s?.[0]) ?? null;
	return c && a ? {
		...c,
		...Uf(o, c, c.position, !0)
	} : c;
}
function xp(e, t) {
	return e || (t?.classList.contains("target") ? "target" : t?.classList.contains("source") ? "source" : null);
}
function Sp(e, t) {
	let n = null;
	return t ? n = !0 : e && !t && (n = !1), n;
}
var Cp = () => !0;
function wp(e, { connectionMode: t, connectionRadius: n, handleId: r, nodeId: i, edgeUpdaterType: a, isTarget: o, domNode: s, nodeLookup: c, lib: l, autoPanOnConnect: u, flowId: d, panBy: f, cancelConnection: p, onConnectStart: m, onConnect: h, onConnectEnd: g, isValidConnection: _ = Cp, onReconnectEnd: v, updateConnection: y, getTransform: b, getFromHandle: x, autoPanSpeed: S, dragThreshold: C = 1, handleDomNode: w }) {
	let T = _f(e.target), E = 0, D, { x: ee, y: te } = xf(e), ne = xp(a, w), re = s?.getBoundingClientRect(), ie = !1;
	if (!re || !ne) return;
	let ae = bp(i, ne, r, c, t);
	if (!ae) return;
	let O = xf(e, re), k = !1, oe = null, se = !1, ce = null;
	function le() {
		if (!u || !re) return;
		let [e, t] = Bd(O, re, S);
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
		from: Uf(de, ue, $.Left, !0),
		fromHandle: ue,
		fromPosition: ue.position,
		fromNode: de,
		to: O,
		toHandle: null,
		toPosition: Cd[ue.position],
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
			let { x: t, y: n } = xf(e), r = t - ee, i = n - te;
			if (!(r * r + i * i > C * C)) return;
			pe();
		}
		if (!x() || !ue) {
			he(e);
			return;
		}
		let a = b();
		O = xf(e, re), D = yp($d(O, a, !1, [1, 1]), n, c, ue), k ||= (le(), !0);
		let s = Tp(e, {
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
		ce = s.handleDomNode, oe = s.connection, se = Sp(!!D, s.isValid);
		let u = c.get(i), f = u ? Uf(u, ue, $.Left, !0) : fe.from, p = {
			...fe,
			from: f,
			isValid: se,
			to: s.toHandle && se ? ef({
				x: s.toHandle.x,
				y: s.toHandle.y
			}, a) : O,
			toHandle: s.toHandle,
			toPosition: se && s.toHandle ? s.toHandle.position : Cd[ue.position],
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
function Tp(e, { handle: t, connectionMode: n, fromNodeId: r, fromHandleId: i, fromType: a, doc: o, lib: s, flowId: c, isValidConnection: l = Cp, nodeLookup: u }) {
	let d = a === "target", f = t ? o.querySelector(`.${s}-flow__handle[data-id="${c}-${t?.nodeId}-${t?.id}-${t?.type}"]`) : null, { x: p, y: m } = xf(e), h = o.elementFromPoint(p, m), g = h?.classList.contains(`${s}-flow__handle`) ? h : f, _ = {
		handleDomNode: g,
		isValid: !1,
		connection: null,
		toHandle: null
	};
	if (g) {
		let e = xp(void 0, g), t = g.getAttribute("data-nodeid"), a = g.getAttribute("data-handleid"), o = g.classList.contains("connectable"), s = g.classList.contains("connectableend");
		if (!t || !e) return _;
		let c = {
			source: d ? t : r,
			sourceHandle: d ? a : i,
			target: d ? r : t,
			targetHandle: d ? i : a
		};
		_.connection = c, _.isValid = o && s && (n === _d.Strict ? d && e === "source" || !d && e === "target" : t !== r || a !== i) && l(c), _.toHandle = bp(t, e, a, u, n, !0);
	}
	return _;
}
var Ep = {
	onPointerDown: wp,
	isValid: Tp
};
function Dp({ domNode: e, panZoom: t, getTransform: n, getViewScale: r }) {
	let i = Fs(e);
	function a({ translateExtent: e, width: a, height: o, zoomStep: s = 1, pannable: c = !0, zoomable: l = !0, inversePan: u = !1 }) {
		let d = (e) => {
			if (e.sourceEvent.type !== "wheel" || !t) return;
			let r = n(), i = e.sourceEvent.ctrlKey && of() ? 10 : 1, a = -e.sourceEvent.deltaY * (e.sourceEvent.deltaMode === 1 ? .05 : e.sourceEvent.deltaMode ? 1 : .002) * s, o = r[2] * 2 ** (a * i);
			t.scaleTo(o);
		}, f = [0, 0], p = fd().on("start", (e) => {
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
		pointer: Ls
	};
}
var Op = (e) => ({
	x: e.x,
	y: e.y,
	zoom: e.k
}), kp = ({ x: e, y: t, zoom: n }) => nd.translate(e, t).scale(n), Ap = (e, t) => e.target.closest(`.${t}`), jp = (e, t) => t === 2 && Array.isArray(e) && e.includes(2), Mp = (e) => ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2, Np = (e, t = 0, n = Mp, r = () => {}) => {
	let i = typeof t == "number" && t > 0;
	return i || r(), i ? e.transition().duration(t).ease(n).on("end", r) : e;
}, Pp = (e) => {
	let t = e.ctrlKey && of() ? 10 : 1;
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * t;
};
function Fp({ zoomPanValues: e, noWheelClassName: t, d3Selection: n, d3Zoom: r, panOnScrollMode: i, panOnScrollSpeed: a, zoomOnPinch: o, onPanZoomStart: s, onPanZoom: c, onPanZoomEnd: l }) {
	return (u) => {
		if (Ap(u, t)) return u.ctrlKey && u.preventDefault(), !1;
		u.preventDefault(), u.stopImmediatePropagation();
		let d = n.property("__zoom").k || 1;
		if (u.ctrlKey && o) {
			let e = Ls(u), t = d * 2 ** Pp(u);
			r.scaleTo(n, t, e, u);
			return;
		}
		let f = u.deltaMode === 1 ? 20 : 1, p = i === vd.Vertical ? 0 : u.deltaX * f, m = i === vd.Horizontal ? 0 : u.deltaY * f;
		!of() && u.shiftKey && i !== vd.Vertical && (p = u.deltaY * f, m = 0), r.translateBy(n, -(p / d) * a, -(m / d) * a, { internal: !0 });
		let h = Op(n.property("__zoom"));
		clearTimeout(e.panScrollTimeout), e.isPanScrolling ? c?.(u, h) : (e.isPanScrolling = !0, s?.(u, h)), e.panScrollTimeout = setTimeout(() => {
			l?.(u, h), e.isPanScrolling = !1;
		}, 150);
	};
}
function Ip({ noWheelClassName: e, preventScrolling: t, d3ZoomHandler: n }) {
	return function(r, i) {
		let a = r.type === "wheel", o = !t && a && !r.ctrlKey, s = Ap(r, e);
		if (r.ctrlKey && a && s && r.preventDefault(), o || s) return null;
		r.preventDefault(), n.call(this, r, i);
	};
}
function Lp({ zoomPanValues: e, onDraggingChange: t, onPanZoomStart: n }) {
	return (r) => {
		if (r.sourceEvent?.internal) return;
		let i = Op(r.transform);
		e.mouseButton = r.sourceEvent?.button || 0, e.isZoomingOrPanning = !0, e.prevViewport = i, r.sourceEvent?.type === "mousedown" && t(!0), n && n?.(r.sourceEvent, i);
	};
}
function Rp({ zoomPanValues: e, panOnDrag: t, onPaneContextMenu: n, onTransformChange: r, onPanZoom: i }) {
	return (a) => {
		e.usedRightMouseButton = !!(n && jp(t, e.mouseButton ?? 0)), a.sourceEvent?.sync || r([
			a.transform.x,
			a.transform.y,
			a.transform.k
		]), i && !a.sourceEvent?.internal && i?.(a.sourceEvent, Op(a.transform));
	};
}
function zp({ zoomPanValues: e, panOnDrag: t, panOnScroll: n, onDraggingChange: r, onPanZoomEnd: i, onPaneContextMenu: a }) {
	return (o) => {
		if (!o.sourceEvent?.internal && (e.isZoomingOrPanning = !1, a && jp(t, e.mouseButton ?? 0) && !e.usedRightMouseButton && o.sourceEvent && a(o.sourceEvent), e.usedRightMouseButton = !1, r(!1), i)) {
			let t = Op(o.transform);
			e.prevViewport = t, clearTimeout(e.timerId), e.timerId = setTimeout(() => {
				i?.(o.sourceEvent, t);
			}, n ? 150 : 0);
		}
	};
}
function Bp({ panActivationKeyPressed: e, zoomActivationKeyPressed: t, zoomOnScroll: n, zoomOnPinch: r, panOnDrag: i, panOnScroll: a, zoomOnDoubleClick: o, userSelectionActive: s, noWheelClassName: c, noPanClassName: l, lib: u, connectionInProgress: d }) {
	return (f) => {
		let p = t || n, m = r && f.ctrlKey, h = f.type === "wheel";
		if (f.button === 1 && f.type === "mousedown" && (Ap(f, `${u}-flow__node`) || Ap(f, `${u}-flow__edge`) || Ap(f, `${u}-flow__selection`) || Ap(f, `${u}-flow__nodesselection`))) return !0;
		if (!i && !p && !a && !o && !r || s || d && !h || Ap(f, c) && h || Ap(f, l) && (!h || a && h && !t) || !r && f.ctrlKey && h) return !1;
		if (!r && f.type === "touchstart" && f.touches?.length > 1) return f.preventDefault(), !1;
		if (!p && !a && !m && h || !i && (f.type === "mousedown" || f.type === "touchstart") || Array.isArray(i) && !i.includes(f.button) && f.type === "mousedown") return !1;
		let g = Array.isArray(i) && i.includes(f.button) || !f.button || f.button <= 1;
		return (!f.ctrlKey || h || e) && g;
	};
}
function Vp({ domNode: e, minZoom: t, maxZoom: n, translateExtent: r, viewport: i, onPanZoom: a, onPanZoomStart: o, onPanZoomEnd: s, onDraggingChange: c }) {
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
	let f = fd().extent(() => d).scaleExtent([t, n]).translateExtent(r), p = Fs(e).call(f);
	y({
		x: i.x,
		y: i.y,
		zoom: Id(i.zoom, t, n)
	}, [[0, 0], [u.width, u.height]], r);
	let m = p.on("wheel.zoom"), h = p.on("dblclick.zoom");
	f.wheelDelta(Pp);
	async function g(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? $c : pl).transform(Np(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function _({ noWheelClassName: e, noPanClassName: t, onPaneContextMenu: n, userSelectionActive: r, panOnScroll: i, panOnDrag: u, panOnScrollMode: d, panOnScrollSpeed: g, preventScrolling: _, zoomOnPinch: y, zoomOnScroll: b, zoomOnDoubleClick: x, panActivationKeyPressed: S = !1, zoomActivationKeyPressed: C, lib: w, onTransformChange: T, connectionInProgress: E, paneClickDistance: D, selectionOnDrag: ee }) {
		r && !l.isZoomingOrPanning && v();
		let te = i && !C && !r;
		f.clickDistance(ee ? Infinity : !Xd(D) || D < 0 ? 0 : D);
		let ne = te ? Fp({
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
		}) : Ip({
			noWheelClassName: e,
			preventScrolling: _,
			d3ZoomHandler: m
		});
		p.on("wheel.zoom", ne, { passive: !1 });
		let re = Lp({
			zoomPanValues: l,
			onDraggingChange: c,
			onPanZoomStart: o
		});
		f.on("start", re);
		let ie = Rp({
			zoomPanValues: l,
			panOnDrag: u,
			onPaneContextMenu: !!n,
			onPanZoom: a,
			onTransformChange: T
		});
		f.on("zoom", ie);
		let ae = zp({
			zoomPanValues: l,
			panOnDrag: u,
			panOnScroll: i,
			onPaneContextMenu: n,
			onPanZoomEnd: s,
			onDraggingChange: c
		});
		f.on("end", ae);
		let O = Bp({
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
		let r = kp(e), i = f?.constrain()(r, t, n);
		return i && await g(i), i;
	}
	async function b(e, t) {
		let n = kp(e);
		return await g(n, t), n;
	}
	function x(e) {
		if (p) {
			let t = kp(e), n = p.property("__zoom");
			(n.k !== e.zoom || n.x !== e.x || n.y !== e.y) && f?.transform(p, t, null, { sync: !0 });
		}
	}
	function S() {
		let e = p ? rd(p.node()) : {
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
			f?.interpolate(t?.interpolate === "linear" ? $c : pl).scaleTo(Np(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	async function w(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? $c : pl).scaleBy(Np(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function T(e) {
		f?.scaleExtent(e);
	}
	function E(e) {
		f?.translateExtent(e);
	}
	function D(e) {
		let t = !Xd(e) || e < 0 ? 0 : e;
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
var Hp;
(function(e) {
	e.Line = "line", e.Handle = "handle";
})(Hp ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/edges.js
var Up = Zd("Svelte Flow", "https://svelteflow.dev/");
function Wp(e, t, n = {}) {
	return Mf(e, t, {
		...n,
		onError: n.onError ?? Up
	});
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/context.js
function Gp() {
	let e = {};
	return [(t) => {
		if (t && !tt(e)) throw Error(t);
		return $e(e);
	}, (t) => et(e, t)];
}
var [Kp, qp] = Gp(), [Jp, Yp] = Gp(), [Xp, Zp] = Gp(), Qp = /* @__PURE__ */ new Set([
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
]), $p = /* @__PURE__ */ J("<div><!></div>");
function em(e, t) {
	P(t, !0);
	let n = Z(t, "id", 7, null), r = Z(t, "type", 7, "source"), i = Z(t, "position", 23, () => $.Top), a = Z(t, "style", 7), o = Z(t, "class", 7), s = Z(t, "isConnectable", 7), c = Z(t, "isConnectableStart", 7, !0), l = Z(t, "isConnectableEnd", 7, !0), u = Z(t, "isValidConnection", 7), d = Z(t, "onconnect", 7), f = Z(t, "ondisconnect", 7), p = Z(t, "children", 7), m = /* @__PURE__ */ Sa(t, Qp), h = Kp("Handle must be used within a Custom Node component"), _ = Jp("Handle must be used within a Custom Node component"), v = /* @__PURE__ */ I(() => r() === "target"), y = /* @__PURE__ */ I(() => s() === void 0 ? _.value : s()), b = zm(), S = /* @__PURE__ */ I(() => b.ariaLabelConfig), C = null;
	An(() => {
		if (d() || f()) {
			b.edges;
			let e = b.connectionLookup.get(`${h}-${r()}${n() ? `-${n()}` : ""}`);
			if (C && !ff(e, C)) {
				let t = e ?? /* @__PURE__ */ new Map();
				pf(C, t, f()), pf(t, C, d());
			}
			C = new Map(e);
		}
	});
	let w = /* @__PURE__ */ I(() => {
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
			b.connectionMode === _d.Strict ? e?.type !== r() : h !== e?.nodeId || n() !== e?.id,
			o && i
		];
	}), T = /* @__PURE__ */ I(() => x(q(w), 5)), E = /* @__PURE__ */ I(() => q(T)[0]), D = /* @__PURE__ */ I(() => q(T)[1]), ee = /* @__PURE__ */ I(() => q(T)[2]), te = /* @__PURE__ */ I(() => q(T)[3]), ne = /* @__PURE__ */ I(() => q(T)[4]);
	function re(e) {
		let t = b.onbeforeconnect ? b.onbeforeconnect(e) : e;
		t && (b.addEdge(t), b.onconnect?.(e));
	}
	function ie(e) {
		let t = bf(e);
		e.currentTarget && (t && e.button === 0 || !t) && Ep.onPointerDown(e, {
			handleId: n(),
			nodeId: h,
			isTarget: q(v),
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
		let t = _f(e.target), i = u() ?? b.isValidConnection, { connectionMode: a, clickConnectStartHandle: o, flowId: s, nodeLookup: l } = b, { connection: d, isValid: f } = Ep.isValid(e, {
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
			n(e), R();
		},
		get type() {
			return r();
		},
		set type(e = "source") {
			r(e), R();
		},
		get position() {
			return i();
		},
		set position(e = $.Top) {
			i(e), R();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), R();
		},
		get class() {
			return o();
		},
		set class(e) {
			o(e), R();
		},
		get isConnectable() {
			return s();
		},
		set isConnectable(e) {
			s(e), R();
		},
		get isConnectableStart() {
			return c();
		},
		set isConnectableStart(e = !0) {
			c(e), R();
		},
		get isConnectableEnd() {
			return l();
		},
		set isConnectableEnd(e = !0) {
			l(e), R();
		},
		get isValidConnection() {
			return u();
		},
		set isValidConnection(e) {
			u(e), R();
		},
		get onconnect() {
			return d();
		},
		set onconnect(e) {
			d(e), R();
		},
		get ondisconnect() {
			return f();
		},
		set ondisconnect(e) {
			f(e), R();
		},
		get children() {
			return p();
		},
		set children(e) {
			p(e), R();
		}
	}, k = $p(), oe = () => {};
	return oa(k, () => ({
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
		"aria-label": q(S)["handle.ariaLabel"],
		tabindex: "-1",
		...m,
		[Xi]: {
			valid: q(ne),
			connectingto: q(ee),
			connectingfrom: q(D),
			source: !q(v),
			target: q(v),
			connectablestart: c(),
			connectableend: l(),
			connectable: q(y),
			connectionindicator: q(y) && (!q(E) || q(te)) && (q(E) || b.clickConnectStartHandle ? l() : c())
		}
	})), fi(V(k), () => p() ?? g), M(k), Y(e, k), F(O);
}
Q(em, {
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
var tm = /* @__PURE__ */ J("<!> <!>", 1);
function nm(e, t) {
	P(t, !0);
	let n = Z(t, "data", 7), r = Z(t, "targetPosition", 23, () => $.Top), i = Z(t, "sourcePosition", 23, () => $.Bottom);
	var a = {
		get data() {
			return n();
		},
		set data(e) {
			n(e), R();
		},
		get targetPosition() {
			return r();
		},
		set targetPosition(e = $.Top) {
			r(e), R();
		},
		get sourcePosition() {
			return i();
		},
		set sourcePosition(e = $.Bottom) {
			i(e), R();
		}
	}, o = tm(), s = H(o);
	em(s, {
		type: "target",
		get position() {
			return r();
		}
	});
	var c = U(s);
	return em(U(c), {
		type: "source",
		get position() {
			return i();
		}
	}), W(() => ii(c, ` ${n()?.label ?? ""} `)), Y(e, o), F(a);
}
Q(nm, {
	data: {},
	targetPosition: {},
	sourcePosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/InputNode.svelte
var rm = /* @__PURE__ */ J(" <!>", 1);
function im(e, t) {
	P(t, !0);
	let n = Z(t, "data", 23, () => ({ label: "Node" })), r = Z(t, "sourcePosition", 23, () => $.Bottom);
	var i = {
		get data() {
			return n();
		},
		set data(e = { label: "Node" }) {
			n(e), R();
		},
		get sourcePosition() {
			return r();
		},
		set sourcePosition(e = $.Bottom) {
			r(e), R();
		}
	};
	Ee();
	var a = rm(), o = H(a);
	return em(U(o), {
		type: "source",
		get position() {
			return r();
		}
	}), W(() => ii(o, `${n()?.label ?? ""} `)), Y(e, a), F(i);
}
Q(im, {
	data: {},
	sourcePosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/OutputNode.svelte
var am = /* @__PURE__ */ J(" <!>", 1);
function om(e, t) {
	P(t, !0);
	let n = Z(t, "data", 23, () => ({ label: "Node" })), r = Z(t, "targetPosition", 23, () => $.Top);
	var i = {
		get data() {
			return n();
		},
		set data(e = { label: "Node" }) {
			n(e), R();
		},
		get targetPosition() {
			return r();
		},
		set targetPosition(e = $.Top) {
			r(e), R();
		}
	};
	Ee();
	var a = am(), o = H(a);
	return em(U(o), {
		type: "target",
		get position() {
			return r();
		}
	}), W(() => ii(o, `${n()?.label ?? ""} `)), Y(e, a), F(i);
}
Q(om, {
	data: {},
	targetPosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/GroupNode.svelte
function sm(e, t) {}
Q(sm, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/portal.svelte.js
function cm(e, t, n) {
	if (!n || !t) return;
	let r = n === "root" ? t : t.querySelector(`.svelte-flow__${n}`);
	r && r.appendChild(e);
}
function lm(e, t) {
	let n = /* @__PURE__ */ I(zm), r = /* @__PURE__ */ I(() => q(n).domNode), i;
	return q(r) ? cm(e, q(r), t) : i = jn(() => {
		On(() => {
			cm(e, q(r), t), i?.();
		});
	}), {
		async update(t) {
			cm(e, q(r), t);
		},
		destroy() {
			e.parentNode && e.parentNode.removeChild(e), i?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/utils.svelte.js
function um() {
	let e = /* @__PURE__ */ z(typeof window > "u");
	if (q(e)) {
		let t = jn(() => {
			On(() => {
				B(e, !1), t?.();
			});
		});
	}
	return { get value() {
		return q(e);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/index.js
var dm = (e) => Td(e), fm = (e) => wd(e);
function pm(e) {
	return e === void 0 ? void 0 : `${e}px`;
}
var mm = {
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
}, hm = /* @__PURE__ */ new Set([
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
]), gm = /* @__PURE__ */ J("<div><!></div>"), _m = {
	hash: "svelte-1wg91mu",
	code: ".transparent.svelte-1wg91mu {background:transparent;}"
};
function vm(e, t) {
	P(t, !0), Oi(e, _m);
	let n = Z(t, "x", 7, 0), r = Z(t, "y", 7, 0), i = Z(t, "width", 7), a = Z(t, "height", 7), o = Z(t, "selectEdgeOnClick", 7, !1), s = Z(t, "transparent", 7, !1), c = Z(t, "class", 7), l = Z(t, "children", 7), u = /* @__PURE__ */ Sa(t, hm), d = zm(), f = Xp("EdgeLabel must be used within a Custom Edge component"), p = /* @__PURE__ */ I(() => d.visible.edges.get(f)?.zIndex);
	var m = {
		get x() {
			return n();
		},
		set x(e = 0) {
			n(e), R();
		},
		get y() {
			return r();
		},
		set y(e = 0) {
			r(e), R();
		},
		get width() {
			return i();
		},
		set width(e) {
			i(e), R();
		},
		get height() {
			return a();
		},
		set height(e) {
			a(e), R();
		},
		get selectEdgeOnClick() {
			return o();
		},
		set selectEdgeOnClick(e = !1) {
			o(e), R();
		},
		get transparent() {
			return s();
		},
		set transparent(e = !1) {
			s(e), R();
		},
		get class() {
			return c();
		},
		set class(e) {
			c(e), R();
		},
		get children() {
			return l();
		},
		set children(e) {
			l(e), R();
		}
	}, h = gm(), _ = () => {
		o() && f && d.handleEdgeSelection(f);
	};
	return oa(h, (e, t, i) => ({
		class: [
			"svelte-flow__edge-label",
			{ transparent: s() },
			c()
		],
		tabindex: "-1",
		onclick: _,
		...u,
		[Zi]: {
			display: e,
			cursor: o() ? "pointer" : void 0,
			transform: `translate(-50%, -50%) translate(${n() ?? ""}px,${r() ?? ""}px)`,
			"pointer-events": "all",
			width: t,
			height: i,
			"z-index": q(p)
		}
	}), [
		() => um().value ? "none" : void 0,
		() => pm(i()),
		() => pm(a())
	], void 0, void 0, "svelte-1wg91mu"), fi(V(h), () => l() ?? g), M(h), ki(h, (e, t) => lm?.(e, t), () => "edge-labels"), Y(e, h), F(m);
}
Q(vm, {
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
var ym = /* @__PURE__ */ new Set([
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
]), bm = /* @__PURE__ */ Ur("<path></path>"), xm = /* @__PURE__ */ Ur("<path fill=\"none\"></path><!><!>", 1);
function Sm(e, t) {
	P(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "path", 7), i = Z(t, "label", 7), a = Z(t, "labelX", 7), o = Z(t, "labelY", 7), s = Z(t, "labelStyle", 7), c = Z(t, "markerStart", 7), l = Z(t, "markerEnd", 7), u = Z(t, "style", 7), d = Z(t, "interactionWidth", 7, 20), f = Z(t, "class", 7), p = /* @__PURE__ */ Sa(t, ym);
	var m = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), R();
		},
		get path() {
			return r();
		},
		set path(e) {
			r(e), R();
		},
		get label() {
			return i();
		},
		set label(e) {
			i(e), R();
		},
		get labelX() {
			return a();
		},
		set labelX(e) {
			a(e), R();
		},
		get labelY() {
			return o();
		},
		set labelY(e) {
			o(e), R();
		},
		get labelStyle() {
			return s();
		},
		set labelStyle(e) {
			s(e), R();
		},
		get markerStart() {
			return c();
		},
		set markerStart(e) {
			c(e), R();
		},
		get markerEnd() {
			return l();
		},
		set markerEnd(e) {
			l(e), R();
		},
		get style() {
			return u();
		},
		set style(e) {
			u(e), R();
		},
		get interactionWidth() {
			return d();
		},
		set interactionWidth(e = 20) {
			d(e), R();
		},
		get class() {
			return f();
		},
		set class(e) {
			f(e), R();
		}
	}, h = xm(), g = H(h), _ = U(g), v = (e) => {
		var t = bm();
		oa(t, () => ({
			d: r(),
			"stroke-opacity": 0,
			"stroke-width": d(),
			fill: "none",
			class: "svelte-flow__edge-interaction",
			...p
		})), Y(e, t);
	};
	gi(_, (e) => {
		d() > 0 && e(v);
	});
	var y = U(_), b = (e) => {
		vm(e, {
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
				var n = Wr();
				W(() => ii(n, i())), Y(e, n);
			},
			$$slots: { default: !0 }
		});
	};
	return gi(y, (e) => {
		i() && e(b);
	}), W(() => {
		X(g, "id", n()), X(g, "d", r()), zi(g, 0, Ni(["svelte-flow__edge-path", f()])), X(g, "marker-start", c()), X(g, "marker-end", l()), Vi(g, u());
	}), Y(e, h), F(m);
}
Q(Sm, {
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
function Cm(e, t) {
	P(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "interactionWidth", 7), i = Z(t, "label", 7), a = Z(t, "labelStyle", 7), o = Z(t, "markerEnd", 7), s = Z(t, "markerStart", 7), c = Z(t, "pathOptions", 7), l = Z(t, "sourcePosition", 7), u = Z(t, "sourceX", 7), d = Z(t, "sourceY", 7), f = Z(t, "style", 7), p = Z(t, "targetPosition", 7), m = Z(t, "targetX", 7), h = Z(t, "targetY", 7), g = /* @__PURE__ */ I(() => Ef({
		sourceX: u(),
		sourceY: d(),
		targetX: m(),
		targetY: h(),
		sourcePosition: l(),
		targetPosition: p(),
		curvature: c()?.curvature
	})), _ = /* @__PURE__ */ I(() => x(q(g), 3)), v = /* @__PURE__ */ I(() => q(_)[0]), y = /* @__PURE__ */ I(() => q(_)[1]), b = /* @__PURE__ */ I(() => q(_)[2]);
	return Sm(e, {
		get id() {
			return n();
		},
		get path() {
			return q(v);
		},
		get labelX() {
			return q(y);
		},
		get labelY() {
			return q(b);
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
	}), F({
		get id() {
			return n();
		},
		set id(e) {
			n(e), R();
		},
		get interactionWidth() {
			return r();
		},
		set interactionWidth(e) {
			r(e), R();
		},
		get label() {
			return i();
		},
		set label(e) {
			i(e), R();
		},
		get labelStyle() {
			return a();
		},
		set labelStyle(e) {
			a(e), R();
		},
		get markerEnd() {
			return o();
		},
		set markerEnd(e) {
			o(e), R();
		},
		get markerStart() {
			return s();
		},
		set markerStart(e) {
			s(e), R();
		},
		get pathOptions() {
			return c();
		},
		set pathOptions(e) {
			c(e), R();
		},
		get sourcePosition() {
			return l();
		},
		set sourcePosition(e) {
			l(e), R();
		},
		get sourceX() {
			return u();
		},
		set sourceX(e) {
			u(e), R();
		},
		get sourceY() {
			return d();
		},
		set sourceY(e) {
			d(e), R();
		},
		get style() {
			return f();
		},
		set style(e) {
			f(e), R();
		},
		get targetPosition() {
			return p();
		},
		set targetPosition(e) {
			p(e), R();
		},
		get targetX() {
			return m();
		},
		set targetX(e) {
			m(e), R();
		},
		get targetY() {
			return h();
		},
		set targetY(e) {
			h(e), R();
		}
	});
}
Q(Cm, {
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
function wm(e, t) {
	P(t, !0);
	let n = Z(t, "interactionWidth", 7), r = Z(t, "label", 7), i = Z(t, "labelStyle", 7), a = Z(t, "style", 7), o = Z(t, "markerEnd", 7), s = Z(t, "markerStart", 7), c = Z(t, "sourcePosition", 7), l = Z(t, "sourceX", 7), u = Z(t, "sourceY", 7), d = Z(t, "targetPosition", 7), f = Z(t, "targetX", 7), p = Z(t, "targetY", 7), m = /* @__PURE__ */ I(() => zf({
		sourceX: l(),
		sourceY: u(),
		targetX: f(),
		targetY: p(),
		sourcePosition: c(),
		targetPosition: d()
	})), h = /* @__PURE__ */ I(() => x(q(m), 3)), g = /* @__PURE__ */ I(() => q(h)[0]), _ = /* @__PURE__ */ I(() => q(h)[1]), v = /* @__PURE__ */ I(() => q(h)[2]);
	return Sm(e, {
		get path() {
			return q(g);
		},
		get labelX() {
			return q(_);
		},
		get labelY() {
			return q(v);
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
	}), F({
		get interactionWidth() {
			return n();
		},
		set interactionWidth(e) {
			n(e), R();
		},
		get label() {
			return r();
		},
		set label(e) {
			r(e), R();
		},
		get labelStyle() {
			return i();
		},
		set labelStyle(e) {
			i(e), R();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), R();
		},
		get markerEnd() {
			return o();
		},
		set markerEnd(e) {
			o(e), R();
		},
		get markerStart() {
			return s();
		},
		set markerStart(e) {
			s(e), R();
		},
		get sourcePosition() {
			return c();
		},
		set sourcePosition(e) {
			c(e), R();
		},
		get sourceX() {
			return l();
		},
		set sourceX(e) {
			l(e), R();
		},
		get sourceY() {
			return u();
		},
		set sourceY(e) {
			u(e), R();
		},
		get targetPosition() {
			return d();
		},
		set targetPosition(e) {
			d(e), R();
		},
		get targetX() {
			return f();
		},
		set targetX(e) {
			f(e), R();
		},
		get targetY() {
			return p();
		},
		set targetY(e) {
			p(e), R();
		}
	});
}
Q(wm, {
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
function Tm(e, t) {
	P(t, !0);
	let n = Z(t, "sourceX", 7), r = Z(t, "sourceY", 7), i = Z(t, "targetX", 7), a = Z(t, "targetY", 7), o = Z(t, "label", 7), s = Z(t, "labelStyle", 7), c = Z(t, "markerStart", 7), l = Z(t, "markerEnd", 7), u = Z(t, "interactionWidth", 7), d = Z(t, "style", 7), f = /* @__PURE__ */ I(() => Nf({
		sourceX: n(),
		sourceY: r(),
		targetX: i(),
		targetY: a()
	})), p = /* @__PURE__ */ I(() => x(q(f), 3)), m = /* @__PURE__ */ I(() => q(p)[0]), h = /* @__PURE__ */ I(() => q(p)[1]), g = /* @__PURE__ */ I(() => q(p)[2]);
	return Sm(e, {
		get path() {
			return q(m);
		},
		get labelX() {
			return q(h);
		},
		get labelY() {
			return q(g);
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
	}), F({
		get sourceX() {
			return n();
		},
		set sourceX(e) {
			n(e), R();
		},
		get sourceY() {
			return r();
		},
		set sourceY(e) {
			r(e), R();
		},
		get targetX() {
			return i();
		},
		set targetX(e) {
			i(e), R();
		},
		get targetY() {
			return a();
		},
		set targetY(e) {
			a(e), R();
		},
		get label() {
			return o();
		},
		set label(e) {
			o(e), R();
		},
		get labelStyle() {
			return s();
		},
		set labelStyle(e) {
			s(e), R();
		},
		get markerStart() {
			return c();
		},
		set markerStart(e) {
			c(e), R();
		},
		get markerEnd() {
			return l();
		},
		set markerEnd(e) {
			l(e), R();
		},
		get interactionWidth() {
			return u();
		},
		set interactionWidth(e) {
			u(e), R();
		},
		get style() {
			return d();
		},
		set style(e) {
			d(e), R();
		}
	});
}
Q(Tm, {
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
function Em(e, t) {
	P(t, !0);
	let n = Z(t, "sourceX", 7), r = Z(t, "sourceY", 7), i = Z(t, "sourcePosition", 7), a = Z(t, "targetX", 7), o = Z(t, "targetY", 7), s = Z(t, "targetPosition", 7), c = Z(t, "label", 7), l = Z(t, "labelStyle", 7), u = Z(t, "markerStart", 7), d = Z(t, "markerEnd", 7), f = Z(t, "interactionWidth", 7), p = Z(t, "style", 7), m = /* @__PURE__ */ I(() => zf({
		sourceX: n(),
		sourceY: r(),
		targetX: a(),
		targetY: o(),
		sourcePosition: i(),
		targetPosition: s(),
		borderRadius: 0
	})), h = /* @__PURE__ */ I(() => x(q(m), 3)), g = /* @__PURE__ */ I(() => q(h)[0]), _ = /* @__PURE__ */ I(() => q(h)[1]), v = /* @__PURE__ */ I(() => q(h)[2]);
	return Sm(e, {
		get path() {
			return q(g);
		},
		get labelX() {
			return q(_);
		},
		get labelY() {
			return q(v);
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
	}), F({
		get sourceX() {
			return n();
		},
		set sourceX(e) {
			n(e), R();
		},
		get sourceY() {
			return r();
		},
		set sourceY(e) {
			r(e), R();
		},
		get sourcePosition() {
			return i();
		},
		set sourcePosition(e) {
			i(e), R();
		},
		get targetX() {
			return a();
		},
		set targetX(e) {
			a(e), R();
		},
		get targetY() {
			return o();
		},
		set targetY(e) {
			o(e), R();
		},
		get targetPosition() {
			return s();
		},
		set targetPosition(e) {
			s(e), R();
		},
		get label() {
			return c();
		},
		set label(e) {
			c(e), R();
		},
		get labelStyle() {
			return l();
		},
		set labelStyle(e) {
			l(e), R();
		},
		get markerStart() {
			return u();
		},
		set markerStart(e) {
			u(e), R();
		},
		get markerEnd() {
			return d();
		},
		set markerEnd(e) {
			d(e), R();
		},
		get interactionWidth() {
			return f();
		},
		set interactionWidth(e) {
			f(e), R();
		},
		get style() {
			return p();
		},
		set style(e) {
			p(e), R();
		}
	});
}
Q(Em, {
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
var Dm = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = ei(t);
	}
	get current() {
		return this.#t(), this.#e();
	}
}, Om = /\(.+\)/, km = /* @__PURE__ */ new Set([
	"all",
	"print",
	"screen",
	"and",
	"or",
	"not",
	"only"
]), Am = class extends Dm {
	constructor(e, t) {
		let n = Om.test(e) || e.split(/[\s,]+/).some((e) => km.has(e.trim())) ? e : `(${e})`, r = window.matchMedia(n);
		super(() => r.matches, (e) => jr(r, "change", e));
	}
};
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/visibleElements.js
function jm(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	return Ad(e, {
		x: 0,
		y: 0,
		width: n,
		height: r
	}, t, !0).forEach((e) => {
		i.set(e.id, e);
	}), i;
}
function Mm(e) {
	let { edges: t, defaultEdgeOptions: n, nodeLookup: r, previousEdges: i, connectionMode: a, onerror: o, onlyRenderVisible: s, elevateEdgesOnSelect: c, zIndexMode: l } = e, u = /* @__PURE__ */ new Map();
	for (let d of t) {
		let t = r.get(d.source), f = r.get(d.target);
		if (!t || !f || t.hidden || f.hidden) continue;
		if (s) {
			let { visibleNodes: n, transform: r, width: i, height: a } = e;
			if (kf({
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
		let m = Vf({
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
			zIndex: Of({
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
var Nm = Zd("Svelte Flow", "https://svelteflow.dev/"), Pm = {
	input: im,
	output: om,
	default: nm,
	group: sm
}, Fm = {
	straight: Tm,
	smoothstep: wm,
	default: Cm,
	step: Em
};
function Im(e, t, n, r, i, a) {
	return t && !n && r && i ? af(kd(a, { filter: (e) => !(!e.width && !e.initialWidth || !e.height && !e.initialHeight) }), r, i, .5, 2, .1) : n ?? {
		x: 0,
		y: 0,
		zoom: 1
	};
}
function Lm(e) {
	class t {
		#e = /* @__PURE__ */ I(() => e.props.id ?? "1");
		get flowId() {
			return q(this.#e);
		}
		set flowId(e) {
			B(this.#e, e);
		}
		#t = /* @__PURE__ */ z(null);
		get domNode() {
			return q(this.#t);
		}
		set domNode(e) {
			B(this.#t, e);
		}
		#n = /* @__PURE__ */ z(null);
		get panZoom() {
			return q(this.#n);
		}
		set panZoom(e) {
			B(this.#n, e);
		}
		#r = /* @__PURE__ */ z(e.width ?? 0);
		get width() {
			return q(this.#r);
		}
		set width(e) {
			B(this.#r, e);
		}
		#i = /* @__PURE__ */ z(e.height ?? 0);
		get height() {
			return q(this.#i);
		}
		set height(e) {
			B(this.#i, e);
		}
		#a = /* @__PURE__ */ z(e.props.zIndexMode ?? "basic");
		get zIndexMode() {
			return q(this.#a);
		}
		set zIndexMode(e) {
			B(this.#a, e);
		}
		#o = /* @__PURE__ */ I(() => {
			let { nodesInitialized: t } = tp(e.nodes, this.nodeLookup, this.parentLookup, {
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
			return q(this.#o);
		}
		set nodesInitialized(e) {
			B(this.#o, e);
		}
		#s = /* @__PURE__ */ I(() => this.panZoom !== null);
		get viewportInitialized() {
			return q(this.#s);
		}
		set viewportInitialized(e) {
			B(this.#s, e);
		}
		#c = /* @__PURE__ */ I(() => (up(this.connectionLookup, this.edgeLookup, e.edges), e.edges));
		get _edges() {
			return q(this.#c);
		}
		set _edges(e) {
			B(this.#c, e);
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
		#l = /* @__PURE__ */ I(() => {
			let e = this._prevSelectedNodeIds.size, t = /* @__PURE__ */ new Set(), n = this.nodes.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedNodeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedNodeIds.size > 0) && (this._prevSelectedNodes = n), this._prevSelectedNodeIds = t, this._prevSelectedNodes;
		});
		get selectedNodes() {
			return q(this.#l);
		}
		set selectedNodes(e) {
			B(this.#l, e);
		}
		_prevSelectedEdges = [];
		_prevSelectedEdgeIds = /* @__PURE__ */ new Set();
		#u = /* @__PURE__ */ I(() => {
			let e = this._prevSelectedEdgeIds.size, t = /* @__PURE__ */ new Set(), n = this.edges.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedEdgeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedEdgeIds.size > 0) && (this._prevSelectedEdges = n), this._prevSelectedEdgeIds = t, this._prevSelectedEdges;
		});
		get selectedEdges() {
			return q(this.#u);
		}
		set selectedEdges(e) {
			B(this.#u, e);
		}
		selectionChangeHandlers = /* @__PURE__ */ new Map();
		nodeLookup = /* @__PURE__ */ new Map();
		parentLookup = /* @__PURE__ */ new Map();
		connectionLookup = /* @__PURE__ */ new Map();
		edgeLookup = /* @__PURE__ */ new Map();
		_prevVisibleEdges = /* @__PURE__ */ new Map();
		#d = /* @__PURE__ */ I(() => {
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
				u = jm(i, r, t, n), d = Mm({
					...f,
					onlyRenderVisible: !0,
					visibleNodes: u,
					transform: r,
					width: t,
					height: n
				});
			} else u = this.nodeLookup, d = Mm(f);
			return this._prevVisibleEdges = d, {
				nodes: u,
				edges: d
			};
		});
		get visible() {
			return q(this.#d);
		}
		set visible(e) {
			B(this.#d, e);
		}
		#f = /* @__PURE__ */ I(() => e.props.nodesDraggable ?? !0);
		get nodesDraggable() {
			return q(this.#f);
		}
		set nodesDraggable(e) {
			B(this.#f, e);
		}
		#p = /* @__PURE__ */ I(() => e.props.nodesConnectable ?? !0);
		get nodesConnectable() {
			return q(this.#p);
		}
		set nodesConnectable(e) {
			B(this.#p, e);
		}
		#m = /* @__PURE__ */ I(() => e.props.elementsSelectable ?? !0);
		get elementsSelectable() {
			return q(this.#m);
		}
		set elementsSelectable(e) {
			B(this.#m, e);
		}
		#h = /* @__PURE__ */ I(() => e.props.nodesFocusable ?? !0);
		get nodesFocusable() {
			return q(this.#h);
		}
		set nodesFocusable(e) {
			B(this.#h, e);
		}
		#g = /* @__PURE__ */ I(() => e.props.edgesFocusable ?? !0);
		get edgesFocusable() {
			return q(this.#g);
		}
		set edgesFocusable(e) {
			B(this.#g, e);
		}
		#_ = /* @__PURE__ */ I(() => e.props.disableKeyboardA11y ?? !1);
		get disableKeyboardA11y() {
			return q(this.#_);
		}
		set disableKeyboardA11y(e) {
			B(this.#_, e);
		}
		#v = /* @__PURE__ */ I(() => e.props.minZoom ?? .5);
		get minZoom() {
			return q(this.#v);
		}
		set minZoom(e) {
			B(this.#v, e);
		}
		#y = /* @__PURE__ */ I(() => e.props.maxZoom ?? 2);
		get maxZoom() {
			return q(this.#y);
		}
		set maxZoom(e) {
			B(this.#y, e);
		}
		#b = /* @__PURE__ */ I(() => e.props.nodeOrigin ?? [0, 0]);
		get nodeOrigin() {
			return q(this.#b);
		}
		set nodeOrigin(e) {
			B(this.#b, e);
		}
		#x = /* @__PURE__ */ I(() => e.props.nodeExtent ?? md);
		get nodeExtent() {
			return q(this.#x);
		}
		set nodeExtent(e) {
			B(this.#x, e);
		}
		#S = /* @__PURE__ */ I(() => e.props.translateExtent ?? md);
		get translateExtent() {
			return q(this.#S);
		}
		set translateExtent(e) {
			B(this.#S, e);
		}
		#C = /* @__PURE__ */ I(() => e.props.defaultEdgeOptions ?? {});
		get defaultEdgeOptions() {
			return q(this.#C);
		}
		set defaultEdgeOptions(e) {
			B(this.#C, e);
		}
		#w = /* @__PURE__ */ I(() => e.props.nodeDragThreshold ?? 1);
		get nodeDragThreshold() {
			return q(this.#w);
		}
		set nodeDragThreshold(e) {
			B(this.#w, e);
		}
		#T = /* @__PURE__ */ I(() => e.props.autoPanOnNodeDrag ?? !0);
		get autoPanOnNodeDrag() {
			return q(this.#T);
		}
		set autoPanOnNodeDrag(e) {
			B(this.#T, e);
		}
		#E = /* @__PURE__ */ I(() => e.props.autoPanOnConnect ?? !0);
		get autoPanOnConnect() {
			return q(this.#E);
		}
		set autoPanOnConnect(e) {
			B(this.#E, e);
		}
		#D = /* @__PURE__ */ I(() => e.props.autoPanOnNodeFocus ?? !0);
		get autoPanOnNodeFocus() {
			return q(this.#D);
		}
		set autoPanOnNodeFocus(e) {
			B(this.#D, e);
		}
		#O = /* @__PURE__ */ I(() => e.props.autoPanSpeed ?? 15);
		get autoPanSpeed() {
			return q(this.#O);
		}
		set autoPanSpeed(e) {
			B(this.#O, e);
		}
		#k = /* @__PURE__ */ I(() => e.props.connectionDragThreshold ?? 1);
		get connectionDragThreshold() {
			return q(this.#k);
		}
		set connectionDragThreshold(e) {
			B(this.#k, e);
		}
		fitViewQueued = e.props.fitView ?? !1;
		fitViewOptions = e.props.fitViewOptions;
		fitViewResolver = null;
		#A = /* @__PURE__ */ I(() => e.props.snapGrid ?? null);
		get snapGrid() {
			return q(this.#A);
		}
		set snapGrid(e) {
			B(this.#A, e);
		}
		#j = /* @__PURE__ */ z(!1);
		get dragging() {
			return q(this.#j);
		}
		set dragging(e) {
			B(this.#j, e);
		}
		#M = /* @__PURE__ */ z(null);
		get selectionRect() {
			return q(this.#M);
		}
		set selectionRect(e) {
			B(this.#M, e);
		}
		#N = /* @__PURE__ */ z(!1);
		get selectionKeyPressed() {
			return q(this.#N);
		}
		set selectionKeyPressed(e) {
			B(this.#N, e);
		}
		#P = /* @__PURE__ */ z(!1);
		get multiselectionKeyPressed() {
			return q(this.#P);
		}
		set multiselectionKeyPressed(e) {
			B(this.#P, e);
		}
		#F = /* @__PURE__ */ z(!1);
		get deleteKeyPressed() {
			return q(this.#F);
		}
		set deleteKeyPressed(e) {
			B(this.#F, e);
		}
		#I = /* @__PURE__ */ z(!1);
		get panActivationKeyPressed() {
			return q(this.#I);
		}
		set panActivationKeyPressed(e) {
			B(this.#I, e);
		}
		#L = /* @__PURE__ */ z(!1);
		get zoomActivationKeyPressed() {
			return q(this.#L);
		}
		set zoomActivationKeyPressed(e) {
			B(this.#L, e);
		}
		#R = /* @__PURE__ */ z(null);
		get selectionRectMode() {
			return q(this.#R);
		}
		set selectionRectMode(e) {
			B(this.#R, e);
		}
		#z = /* @__PURE__ */ z("");
		get ariaLiveMessage() {
			return q(this.#z);
		}
		set ariaLiveMessage(e) {
			B(this.#z, e);
		}
		#B = /* @__PURE__ */ I(() => e.props.selectionMode ?? yd.Partial);
		get selectionMode() {
			return q(this.#B);
		}
		set selectionMode(e) {
			B(this.#B, e);
		}
		#V = /* @__PURE__ */ I(() => ({
			...Pm,
			...e.props.nodeTypes
		}));
		get nodeTypes() {
			return q(this.#V);
		}
		set nodeTypes(e) {
			B(this.#V, e);
		}
		#H = /* @__PURE__ */ I(() => ({
			...Fm,
			...e.props.edgeTypes
		}));
		get edgeTypes() {
			return q(this.#H);
		}
		set edgeTypes(e) {
			B(this.#H, e);
		}
		#U = /* @__PURE__ */ I(() => e.props.noPanClass ?? "nopan");
		get noPanClass() {
			return q(this.#U);
		}
		set noPanClass(e) {
			B(this.#U, e);
		}
		#W = /* @__PURE__ */ I(() => e.props.noDragClass ?? "nodrag");
		get noDragClass() {
			return q(this.#W);
		}
		set noDragClass(e) {
			B(this.#W, e);
		}
		#G = /* @__PURE__ */ I(() => e.props.noWheelClass ?? "nowheel");
		get noWheelClass() {
			return q(this.#G);
		}
		set noWheelClass(e) {
			B(this.#G, e);
		}
		#K = /* @__PURE__ */ I(() => df(e.props.ariaLabelConfig));
		get ariaLabelConfig() {
			return q(this.#K);
		}
		set ariaLabelConfig(e) {
			B(this.#K, e);
		}
		#q = /* @__PURE__ */ z(Im(this.nodesInitialized, e.props.fitView, e.props.initialViewport, this.width, this.height, this.nodeLookup));
		get _viewport() {
			return q(this.#q);
		}
		set _viewport(e) {
			B(this.#q, e);
		}
		get viewport() {
			return e.viewport ?? this._viewport;
		}
		set viewport(t) {
			e.viewport &&= t, this._viewport = t;
		}
		#J = /* @__PURE__ */ z(bd);
		get _connection() {
			return q(this.#J);
		}
		set _connection(e) {
			B(this.#J, e);
		}
		#Y = /* @__PURE__ */ I(() => this._connection.inProgress ? {
			...this._connection,
			to: $d(this._connection.to, [
				this.viewport.x,
				this.viewport.y,
				this.viewport.zoom
			])
		} : this._connection);
		get connection() {
			return q(this.#Y);
		}
		set connection(e) {
			B(this.#Y, e);
		}
		#X = /* @__PURE__ */ I(() => e.props.connectionMode ?? _d.Strict);
		get connectionMode() {
			return q(this.#X);
		}
		set connectionMode(e) {
			B(this.#X, e);
		}
		#Z = /* @__PURE__ */ I(() => e.props.connectionRadius ?? 20);
		get connectionRadius() {
			return q(this.#Z);
		}
		set connectionRadius(e) {
			B(this.#Z, e);
		}
		#Q = /* @__PURE__ */ I(() => e.props.isValidConnection ?? (() => !0));
		get isValidConnection() {
			return q(this.#Q);
		}
		set isValidConnection(e) {
			B(this.#Q, e);
		}
		#$ = /* @__PURE__ */ I(() => e.props.selectNodesOnDrag ?? !0);
		get selectNodesOnDrag() {
			return q(this.#$);
		}
		set selectNodesOnDrag(e) {
			B(this.#$, e);
		}
		#ee = /* @__PURE__ */ I(() => e.props.defaultMarkerColor === void 0 ? "#b1b1b7" : e.props.defaultMarkerColor);
		get defaultMarkerColor() {
			return q(this.#ee);
		}
		set defaultMarkerColor(e) {
			B(this.#ee, e);
		}
		#te = /* @__PURE__ */ I(() => Kf(e.edges, {
			defaultColor: this.defaultMarkerColor,
			id: this.flowId,
			defaultMarkerStart: this.defaultEdgeOptions.markerStart,
			defaultMarkerEnd: this.defaultEdgeOptions.markerEnd
		}));
		get markers() {
			return q(this.#te);
		}
		set markers(e) {
			B(this.#te, e);
		}
		#ne = /* @__PURE__ */ I(() => e.props.onlyRenderVisibleElements ?? !1);
		get onlyRenderVisibleElements() {
			return q(this.#ne);
		}
		set onlyRenderVisibleElements(e) {
			B(this.#ne, e);
		}
		#re = /* @__PURE__ */ I(() => e.props.onflowerror ?? Nm);
		get onerror() {
			return q(this.#re);
		}
		set onerror(e) {
			B(this.#re, e);
		}
		#ie = /* @__PURE__ */ I(() => e.props.ondelete);
		get ondelete() {
			return q(this.#ie);
		}
		set ondelete(e) {
			B(this.#ie, e);
		}
		#ae = /* @__PURE__ */ I(() => e.props.onbeforedelete);
		get onbeforedelete() {
			return q(this.#ae);
		}
		set onbeforedelete(e) {
			B(this.#ae, e);
		}
		#oe = /* @__PURE__ */ I(() => e.props.onbeforeconnect);
		get onbeforeconnect() {
			return q(this.#oe);
		}
		set onbeforeconnect(e) {
			B(this.#oe, e);
		}
		#se = /* @__PURE__ */ I(() => e.props.onconnect);
		get onconnect() {
			return q(this.#se);
		}
		set onconnect(e) {
			B(this.#se, e);
		}
		#ce = /* @__PURE__ */ I(() => e.props.onconnectstart);
		get onconnectstart() {
			return q(this.#ce);
		}
		set onconnectstart(e) {
			B(this.#ce, e);
		}
		#le = /* @__PURE__ */ I(() => e.props.onconnectend);
		get onconnectend() {
			return q(this.#le);
		}
		set onconnectend(e) {
			B(this.#le, e);
		}
		#ue = /* @__PURE__ */ I(() => e.props.onbeforereconnect);
		get onbeforereconnect() {
			return q(this.#ue);
		}
		set onbeforereconnect(e) {
			B(this.#ue, e);
		}
		#de = /* @__PURE__ */ I(() => e.props.onreconnect);
		get onreconnect() {
			return q(this.#de);
		}
		set onreconnect(e) {
			B(this.#de, e);
		}
		#fe = /* @__PURE__ */ I(() => e.props.onreconnectstart);
		get onreconnectstart() {
			return q(this.#fe);
		}
		set onreconnectstart(e) {
			B(this.#fe, e);
		}
		#pe = /* @__PURE__ */ I(() => e.props.onreconnectend);
		get onreconnectend() {
			return q(this.#pe);
		}
		set onreconnectend(e) {
			B(this.#pe, e);
		}
		#me = /* @__PURE__ */ I(() => e.props.clickConnect ?? !0);
		get clickConnect() {
			return q(this.#me);
		}
		set clickConnect(e) {
			B(this.#me, e);
		}
		#he = /* @__PURE__ */ I(() => e.props.onclickconnectstart);
		get onclickconnectstart() {
			return q(this.#he);
		}
		set onclickconnectstart(e) {
			B(this.#he, e);
		}
		#ge = /* @__PURE__ */ I(() => e.props.onclickconnectend);
		get onclickconnectend() {
			return q(this.#ge);
		}
		set onclickconnectend(e) {
			B(this.#ge, e);
		}
		#_e = /* @__PURE__ */ z(null);
		get clickConnectStartHandle() {
			return q(this.#_e);
		}
		set clickConnectStartHandle(e) {
			B(this.#_e, e);
		}
		#ve = /* @__PURE__ */ I(() => e.props.onselectiondrag);
		get onselectiondrag() {
			return q(this.#ve);
		}
		set onselectiondrag(e) {
			B(this.#ve, e);
		}
		#ye = /* @__PURE__ */ I(() => e.props.onselectiondragstart);
		get onselectiondragstart() {
			return q(this.#ye);
		}
		set onselectiondragstart(e) {
			B(this.#ye, e);
		}
		#be = /* @__PURE__ */ I(() => e.props.onselectiondragstop);
		get onselectiondragstop() {
			return q(this.#be);
		}
		set onselectiondragstop(e) {
			B(this.#be, e);
		}
		resolveFitView = async () => {
			this.panZoom && (await Nd({
				nodes: this.nodeLookup,
				width: this.width,
				height: this.height,
				panZoom: this.panZoom,
				minZoom: this.minZoom,
				maxZoom: this.maxZoom
			}, this.fitViewOptions), this.fitViewResolver?.resolve(!0), this.fitViewQueued = !1, this.fitViewOptions = void 0, this.fitViewResolver = null);
		};
		_prefersDark = new Am("(prefers-color-scheme: dark)", e.props.colorModeSSR === "dark");
		#xe = /* @__PURE__ */ I(() => e.props.colorMode === "system" ? this._prefersDark.current ? "dark" : "light" : e.props.colorMode ?? "light");
		get colorMode() {
			return q(this.#xe);
		}
		set colorMode(e) {
			B(this.#xe, e);
		}
		constructor() {}
		resetStoreValues() {
			this.dragging = !1, this.selectionRect = null, this.selectionRectMode = null, this.selectionKeyPressed = !1, this.multiselectionKeyPressed = !1, this.deleteKeyPressed = !1, this.panActivationKeyPressed = !1, this.zoomActivationKeyPressed = !1, this._connection = bd, this.clickConnectStartHandle = null, this.viewport = e.props.initialViewport ?? {
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
var Rm = pd.error001("svelte");
function zm() {
	let e = $e(Bm);
	if (!e) throw Error(Rm);
	return e.getStore();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/index.js
var Bm = Symbol();
function Vm(e) {
	let t = Lm(e);
	function n(e) {
		t.nodeTypes = {
			...Pm,
			...e
		};
	}
	function r(e) {
		t.edgeTypes = {
			...Fm,
			...e
		};
	}
	function i(e) {
		t.edges = Wp(e, t.edges, { onError: t.onerror });
	}
	let a = (e, n = !1) => {
		t.nodes = t.nodes.map((r) => {
			if (t.connection.inProgress && t.connection.fromNode.id === r.id) {
				let e = t.nodeLookup.get(r.id);
				e && (t.connection = {
					...t.connection,
					from: Uf(e, t.connection.fromHandle, $.Left, !0)
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
		let { changes: n, updatedInternals: r } = sp(e, t.nodeLookup, t.parentLookup, t.domNode, t.nodeOrigin, t.nodeExtent, t.zIndexMode);
		if (!r) return;
		Qf(t.nodeLookup, t.parentLookup, {
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
			t.onerror("012", pd.error012(e));
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
			t.onerror("016", pd.error016(e));
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
			i && (t = Qd(t, i));
			let { position: n, positionAbsolute: a } = Pd({
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
		return cp({
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
		t._connection = bd;
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
function Hm(e, t) {
	let { minZoom: n, maxZoom: r, initialViewport: i, onPanZoomStart: a, onPanZoom: o, onPanZoomEnd: s, translateExtent: c, setPanZoomInstance: l, onDraggingChange: u, onTransformChange: d } = t, f = Vp({
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
var Um = /* @__PURE__ */ J("<div class=\"svelte-flow__zoom svelte-flow__container\"><!></div>");
function Wm(e, t) {
	P(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "panOnScrollMode", 7), i = Z(t, "preventScrolling", 7), a = Z(t, "zoomOnScroll", 7), o = Z(t, "zoomOnDoubleClick", 7), s = Z(t, "zoomOnPinch", 7), c = Z(t, "panOnDrag", 7), l = Z(t, "panOnScroll", 7), u = Z(t, "panOnScrollSpeed", 7), d = Z(t, "paneClickDistance", 7), f = Z(t, "selectionOnDrag", 7), p = Z(t, "onmovestart", 7), m = Z(t, "onmove", 7), h = Z(t, "onmoveend", 7), g = Z(t, "oninit", 7), _ = Z(t, "children", 7), v = /* @__PURE__ */ I(() => n().panActivationKeyPressed || c()), y = /* @__PURE__ */ I(() => n().panActivationKeyPressed || l()), { viewport: b } = n(), x = !1;
	On(() => {
		!x && n().viewportInitialized && (g()?.(), x = !0);
	});
	var S = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), R();
		},
		get panOnScrollMode() {
			return r();
		},
		set panOnScrollMode(e) {
			r(e), R();
		},
		get preventScrolling() {
			return i();
		},
		set preventScrolling(e) {
			i(e), R();
		},
		get zoomOnScroll() {
			return a();
		},
		set zoomOnScroll(e) {
			a(e), R();
		},
		get zoomOnDoubleClick() {
			return o();
		},
		set zoomOnDoubleClick(e) {
			o(e), R();
		},
		get zoomOnPinch() {
			return s();
		},
		set zoomOnPinch(e) {
			s(e), R();
		},
		get panOnDrag() {
			return c();
		},
		set panOnDrag(e) {
			c(e), R();
		},
		get panOnScroll() {
			return l();
		},
		set panOnScroll(e) {
			l(e), R();
		},
		get panOnScrollSpeed() {
			return u();
		},
		set panOnScrollSpeed(e) {
			u(e), R();
		},
		get paneClickDistance() {
			return d();
		},
		set paneClickDistance(e) {
			d(e), R();
		},
		get selectionOnDrag() {
			return f();
		},
		set selectionOnDrag(e) {
			f(e), R();
		},
		get onmovestart() {
			return p();
		},
		set onmovestart(e) {
			p(e), R();
		},
		get onmove() {
			return m();
		},
		set onmove(e) {
			m(e), R();
		},
		get onmoveend() {
			return h();
		},
		set onmoveend(e) {
			h(e), R();
		},
		get oninit() {
			return g();
		},
		set oninit(e) {
			g(e), R();
		},
		get children() {
			return _();
		},
		set children(e) {
			_(e), R();
		}
	}, C = Um();
	return fi(V(C), _), M(C), ki(C, (e, t) => Hm?.(e, t), () => ({
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
		panOnScroll: q(y),
		panOnDrag: q(v),
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
	})), Y(e, C), F(S);
}
Q(Wm, {
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
function Gm(e, t) {
	return (n) => {
		n.target === t && e?.(n);
	};
}
function Km(e) {
	return (t) => {
		let n = e.has(t.id);
		return !!t.selected === n ? t : {
			...t,
			selected: n
		};
	};
}
function qm(e, t) {
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
var Jm = /* @__PURE__ */ J("<div><!></div>");
function Ym(e, t) {
	P(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "panOnDrag", 7, !0), i = Z(t, "paneClickDistance", 7, 1), a = Z(t, "selectionOnDrag", 7), o = Z(t, "autoPanOnSelection", 7, !0), s = Z(t, "onpaneclick", 7), c = Z(t, "onpanecontextmenu", 7), l = Z(t, "onselectionstart", 7), u = Z(t, "onselectionend", 7), d = Z(t, "children", 7), f, p = null, m = !1, h = /* @__PURE__ */ new Set(), g = /* @__PURE__ */ new Set(), _ = /* @__PURE__ */ I(() => n().panActivationKeyPressed || r()), v = /* @__PURE__ */ I(() => n().selectionKeyPressed || !!n().selectionRect || a() && q(_) !== !0), y = /* @__PURE__ */ I(() => n().elementsSelectable && (q(v) || n().selectionRectMode === "user")), b = !1, x = 0, S = {
		x: 0,
		y: 0
	}, C = !1;
	function w(e) {
		if (e.pointerType === "touch" && q(_) !== !1 && !n().selectionKeyPressed || (p = f?.getBoundingClientRect(), !p)) return;
		let t = e.target === f, r = !t && !!e.target.closest(".nokey"), i = a() && t || n().selectionKeyPressed;
		if (r || !q(v) || !i || e.button !== 0 || !e.isPrimary) return;
		e.target?.setPointerCapture?.(e.pointerId), b = !1, C = !1;
		let { x: o, y: s } = xf(e, p), c = $d({
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
		}, i = ef(r, [
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
		h = new Set(Ad(n().nodeLookup, a, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		], n().selectionMode === yd.Partial, !0).map((e) => e.id));
		let c = n().defaultEdgeOptions.selectable ?? !0;
		g = /* @__PURE__ */ new Set();
		for (let e of h) {
			let t = n().connectionLookup.get(e);
			if (t) for (let { edgeId: e } of t.values()) {
				let t = n().edgeLookup.get(e);
				t && (t.selectable ?? c) && g.add(e);
			}
		}
		qm(o, h) || n(n().nodes = n().nodes.map(Km(h)), !0), qm(s, g) || n(n().edges = n().edges.map(Km(g)), !0), n(n().selectionRectMode = "user", !0), n(n().selectionRect = a, !0);
	}
	function E() {
		if (!o() || !p) return;
		let [e, t] = Bd(S, p, n().autoPanSpeed);
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
	mi(() => {
		typeof window < "u" && D();
	});
	function ee(e) {
		if (!q(v) || !p || !n().selectionRect) return;
		let t = xf(e, p);
		S = {
			x: t.x,
			y: t.y
		};
		let r = ef({
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
		if (!q(y)) {
			e.target === f && n().connection.inProgress && (m = !0);
			return;
		}
		e.button === 0 && (e.target?.releasePointerCapture?.(e.pointerId), !b && e.target === f && ae?.(e), n(n().selectionRect = null, !0), b && n(n().selectionRectMode = h.size > 0 ? "nodes" : null, !0), b && u()?.(e), D());
	}
	function ne(e) {
		e.target?.releasePointerCapture?.(e.pointerId), D();
	}
	let re = (e) => {
		if (Array.isArray(q(_)) && q(_).includes(2)) {
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
			n(e), R();
		},
		get panOnDrag() {
			return r();
		},
		set panOnDrag(e = !0) {
			r(e), R();
		},
		get paneClickDistance() {
			return i();
		},
		set paneClickDistance(e = 1) {
			i(e), R();
		},
		get selectionOnDrag() {
			return a();
		},
		set selectionOnDrag(e) {
			a(e), R();
		},
		get autoPanOnSelection() {
			return o();
		},
		set autoPanOnSelection(e = !0) {
			o(e), R();
		},
		get onpaneclick() {
			return s();
		},
		set onpaneclick(e) {
			s(e), R();
		},
		get onpanecontextmenu() {
			return c();
		},
		set onpanecontextmenu(e) {
			c(e), R();
		},
		get onselectionstart() {
			return l();
		},
		set onselectionstart(e) {
			l(e), R();
		},
		get onselectionend() {
			return u();
		},
		set onselectionend(e) {
			u(e), R();
		},
		get children() {
			return d();
		},
		set children(e) {
			d(e), R();
		}
	}, k = Jm();
	let oe;
	var se = /* @__PURE__ */ I(() => q(y) ? void 0 : Gm(ae, f)), ce = /* @__PURE__ */ I(() => Gm(re, f));
	return fi(V(k), d), M(k), ga(k, (e) => f = e, () => f), W((e) => oe = zi(k, 1, "svelte-flow__pane svelte-flow__container", null, oe, {
		draggable: e,
		dragging: n().dragging,
		selection: q(v)
	}), [() => r() === !0 || Array.isArray(r()) && r().includes(0)]), Nr("click", k, function(...e) {
		q(se)?.apply(this, e);
	}), Mr("pointerdown", k, function(...e) {
		(q(y) ? w : void 0)?.apply(this, e);
	}, !0), Nr("pointermove", k, function(...e) {
		(q(y) ? ee : void 0)?.apply(this, e);
	}), Nr("pointerup", k, te), Mr("pointercancel", k, function(...e) {
		(q(y) ? ne : void 0)?.apply(this, e);
	}), Nr("contextmenu", k, function(...e) {
		q(ce)?.apply(this, e);
	}), Mr("click", k, function(...e) {
		(q(y) ? ie : void 0)?.apply(this, e);
	}, !0), Y(e, k), F(O);
}
Pr([
	"click",
	"pointermove",
	"pointerup",
	"contextmenu"
]), Q(Ym, {
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
var Xm = /* @__PURE__ */ J("<div class=\"svelte-flow__viewport xyflow__viewport svelte-flow__container\"><!></div>");
function Zm(e, t) {
	P(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "children", 7);
	var i = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), R();
		},
		get children() {
			return r();
		},
		set children(e) {
			r(e), R();
		}
	}, a = Xm();
	let o;
	return fi(V(a), r), M(a), W(() => o = Vi(a, "", o, { transform: `translate(${n().viewport.x ?? ""}px, ${n().viewport.y ?? ""}px) scale(${n().viewport.zoom ?? ""})` })), Y(e, a), F(i);
}
Q(Zm, {
	store: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/drag/index.js
function Qm(e, t) {
	let { store: n, onDrag: r, onDragStart: i, onDragStop: a, onNodeMouseDown: o } = t, s = gp({
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
var $m = /* @__PURE__ */ J("<div aria-live=\"assertive\" aria-atomic=\"true\" class=\"a11y-live-msg svelte-13pq11u\"> </div>"), eh = /* @__PURE__ */ J("<div class=\"a11y-hidden svelte-13pq11u\"> </div> <div class=\"a11y-hidden svelte-13pq11u\"> </div> <!>", 1), th = {
	hash: "svelte-13pq11u",
	code: ".a11y-hidden.svelte-13pq11u {display:none;}.a11y-live-msg.svelte-13pq11u {position:absolute;width:1px;height:1px;margin:-1px;border:0;padding:0;overflow:hidden;clip:rect(0px, 0px, 0px, 0px);clip-path:inset(100%);}"
};
function nh(e, t) {
	P(t, !0), Oi(e, th);
	let n = Z(t, "store", 7);
	var r = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), R();
		}
	}, i = eh(), a = H(i), o = gn(a, !0), s = U(a, 2), c = gn(s, !0), l = U(s, 2), u = (e) => {
		var t = $m(), r = gn(t, !0);
		W(() => {
			X(t, "id", `${ah}-${n().flowId}`), ii(r, n().ariaLiveMessage);
		}), Y(e, t);
	};
	return gi(l, (e) => {
		n().disableKeyboardA11y || e(u);
	}), W(() => {
		X(a, "id", `${rh}-${n().flowId}`), ii(o, n().disableKeyboardA11y ? n().ariaLabelConfig["node.a11yDescription.default"] : n().ariaLabelConfig["node.a11yDescription.keyboardDisabled"]), X(s, "id", `${ih}-${n().flowId}`), ii(c, n().ariaLabelConfig["edge.a11yDescription.default"]);
	}), Y(e, i), F(r);
}
Q(nh, { store: {} }, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/A11yDescriptions/index.js
var rh = "svelte-flow__node-desc", ih = "svelte-flow__edge-desc", ah = "svelte-flow__aria-live", oh = /* @__PURE__ */ J("<div><!></div>");
function sh(e, t) {
	P(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "node", 7), i = Z(t, "resizeObserver", 7), a = Z(t, "nodeClickDistance", 7), o = Z(t, "onnodeclick", 7), s = Z(t, "onnodedrag", 7), c = Z(t, "onnodedragstart", 7), l = Z(t, "onnodedragstop", 7), u = Z(t, "onnodepointerenter", 7), d = Z(t, "onnodepointerleave", 7), f = Z(t, "onnodepointermove", 7), p = Z(t, "onnodecontextmenu", 7), m = /* @__PURE__ */ I(() => b(r().data, () => ({}), !0)), h = /* @__PURE__ */ I(() => b(r().selected, !1)), g = /* @__PURE__ */ I(() => r().draggable), _ = /* @__PURE__ */ I(() => r().selectable), v = /* @__PURE__ */ I(() => b(r().deletable, !0)), y = /* @__PURE__ */ I(() => r().connectable), x = /* @__PURE__ */ I(() => r().focusable), S = /* @__PURE__ */ I(() => b(r().hidden, !1)), C = /* @__PURE__ */ I(() => b(r().dragging, !1)), w = /* @__PURE__ */ I(() => b(r().style, "")), T = /* @__PURE__ */ I(() => r().class), E = /* @__PURE__ */ I(() => b(r().type, "default")), D = /* @__PURE__ */ I(() => r().parentId), ee = /* @__PURE__ */ I(() => r().sourcePosition), te = /* @__PURE__ */ I(() => r().targetPosition), ne = /* @__PURE__ */ I(() => b(r().measured, () => ({
		width: 0,
		height: 0
	}), !0).width), re = /* @__PURE__ */ I(() => b(r().measured, () => ({
		width: 0,
		height: 0
	}), !0).height), ie = /* @__PURE__ */ I(() => r().initialWidth), ae = /* @__PURE__ */ I(() => r().initialHeight), O = /* @__PURE__ */ I(() => r().width), k = /* @__PURE__ */ I(() => r().height), oe = /* @__PURE__ */ I(() => r().dragHandle), se = /* @__PURE__ */ I(() => b(r().internals.z, 0)), ce = /* @__PURE__ */ I(() => r().internals.positionAbsolute.x), le = /* @__PURE__ */ I(() => r().internals.positionAbsolute.y), ue = /* @__PURE__ */ I(() => r().internals.userNode), { id: de } = r(), fe = /* @__PURE__ */ I(() => q(g) ?? n().nodesDraggable), pe = /* @__PURE__ */ I(() => q(_) ?? n().elementsSelectable), me = /* @__PURE__ */ I(() => q(y) ?? n().nodesConnectable), he = /* @__PURE__ */ I(() => lf(r())), ge = /* @__PURE__ */ I(() => !!r().internals.handleBounds), _e = /* @__PURE__ */ I(() => q(he) && q(ge)), ve = /* @__PURE__ */ I(() => q(x) ?? n().nodesFocusable);
	function ye(e) {
		return n().parentLookup.has(e);
	}
	let be = /* @__PURE__ */ I(() => ye(de)), xe = /* @__PURE__ */ z(null), Se = null, A = q(E), Ce = q(ee), j = q(te), we = /* @__PURE__ */ I(() => n().nodeTypes[q(E)] ?? nm), Te = /* @__PURE__ */ I(() => n().ariaLabelConfig);
	qp(de), Yp({ get value() {
		return q(me);
	} });
	let Ee = /* @__PURE__ */ I(() => {
		let e = q(ne) === void 0 ? q(O) ?? q(ie) : q(O), t = q(re) === void 0 ? q(k) ?? q(ae) : q(k);
		if (e !== void 0 || t !== void 0 || q(w) !== void 0) return `${q(w)};${e ? `width:${pm(e)};` : ""}${t ? `height:${pm(t)};` : ""}`;
	});
	On(() => {
		(q(E) !== A || q(ee) !== Ce || q(te) !== j) && q(xe) !== null && requestAnimationFrame(() => {
			q(xe) !== null && n().updateNodeInternals(/* @__PURE__ */ new Map([[de, {
				id: de,
				nodeElement: q(xe),
				force: !0
			}]]));
		}), A = q(E), Ce = q(ee), j = q(te);
	}), On(() => {
		i() && (!q(_e) || q(xe) !== Se) && (Se && i().unobserve(Se), q(xe) && i().observe(q(xe)), Se = q(xe));
	}), mi(() => {
		Se && i()?.unobserve(Se);
	});
	function De(e) {
		q(pe) && (!n().selectNodesOnDrag || !q(fe) || n().nodeDragThreshold > 0) && n().handleNodeSelection(de), o()?.({
			node: q(ue),
			event: e
		});
	}
	function Oe(e) {
		if (!(yf(e) || n().disableKeyboardA11y)) {
			if (hd.includes(e.key) && q(pe)) {
				let t = e.key === "Escape";
				n().handleNodeSelection(de, t, q(xe));
			} else q(fe) && r().selected && Object.prototype.hasOwnProperty.call(mm, e.key) && (e.preventDefault(), n(n().ariaLiveMessage = q(Te)["node.a11yDescription.ariaLiveMessage"]({
				direction: e.key.replace("Arrow", "").toLowerCase(),
				x: ~~r().internals.positionAbsolute.x,
				y: ~~r().internals.positionAbsolute.y
			}), !0), n().moveSelectedNodes(mm[e.key], e.shiftKey ? 4 : 1));
		}
	}
	let ke = () => {
		if (n().disableKeyboardA11y || !n().autoPanOnNodeFocus || !q(xe)?.matches(":focus-visible")) return;
		let { width: e, height: t, viewport: i } = n();
		Ad(/* @__PURE__ */ new Map([[de, r()]]), {
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
			n(e), R();
		},
		get node() {
			return r();
		},
		set node(e) {
			r(e), R();
		},
		get resizeObserver() {
			return i();
		},
		set resizeObserver(e) {
			i(e), R();
		},
		get nodeClickDistance() {
			return a();
		},
		set nodeClickDistance(e) {
			a(e), R();
		},
		get onnodeclick() {
			return o();
		},
		set onnodeclick(e) {
			o(e), R();
		},
		get onnodedrag() {
			return s();
		},
		set onnodedrag(e) {
			s(e), R();
		},
		get onnodedragstart() {
			return c();
		},
		set onnodedragstart(e) {
			c(e), R();
		},
		get onnodedragstop() {
			return l();
		},
		set onnodedragstop(e) {
			l(e), R();
		},
		get onnodepointerenter() {
			return u();
		},
		set onnodepointerenter(e) {
			u(e), R();
		},
		get onnodepointerleave() {
			return d();
		},
		set onnodepointerleave(e) {
			d(e), R();
		},
		get onnodepointermove() {
			return f();
		},
		set onnodepointermove(e) {
			f(e), R();
		},
		get onnodecontextmenu() {
			return p();
		},
		set onnodecontextmenu(e) {
			p(e), R();
		}
	}, je = Gr(), Me = H(je), Ne = (e) => {
		var t = oh();
		oa(t, () => ({
			"data-id": de,
			class: [
				"svelte-flow__node",
				`svelte-flow__node-${q(E)}`,
				q(T)
			],
			style: q(Ee),
			onclick: De,
			onpointerenter: u() ? (e) => u()({
				node: q(ue),
				event: e
			}) : void 0,
			onpointerleave: d() ? (e) => d()({
				node: q(ue),
				event: e
			}) : void 0,
			onpointermove: f() ? (e) => f()({
				node: q(ue),
				event: e
			}) : void 0,
			oncontextmenu: p() ? (e) => p()({
				node: q(ue),
				event: e
			}) : void 0,
			onkeydown: q(ve) ? Oe : void 0,
			onfocus: q(ve) ? ke : void 0,
			tabIndex: q(ve) ? 0 : void 0,
			role: r().ariaRole ?? (q(ve) ? "group" : void 0),
			"aria-label": r().ariaLabel,
			"aria-roledescription": "node",
			"aria-describedby": n().disableKeyboardA11y ? void 0 : `${rh}-${n().flowId}`,
			...r().domAttributes,
			[Xi]: {
				dragging: q(C),
				selected: q(h),
				draggable: q(fe),
				connectable: q(me),
				selectable: q(pe),
				nopan: q(fe),
				parent: q(be)
			},
			[Zi]: {
				"z-index": q(se),
				transform: `translate(${q(ce) ?? ""}px, ${q(le) ?? ""}px)`,
				visibility: q(he) ? "visible" : "hidden"
			}
		})), Di(V(t), () => q(we), (e, t) => {
			t(e, {
				get data() {
					return q(m);
				},
				get id() {
					return de;
				},
				get selected() {
					return q(h);
				},
				get selectable() {
					return q(pe);
				},
				get deletable() {
					return q(v);
				},
				get sourcePosition() {
					return q(ee);
				},
				get targetPosition() {
					return q(te);
				},
				get zIndex() {
					return q(se);
				},
				get dragging() {
					return q(C);
				},
				get draggable() {
					return q(fe);
				},
				get dragHandle() {
					return q(oe);
				},
				get parentId() {
					return q(D);
				},
				get type() {
					return q(E);
				},
				get isConnectable() {
					return q(me);
				},
				get positionAbsoluteX() {
					return q(ce);
				},
				get positionAbsoluteY() {
					return q(le);
				},
				get width() {
					return q(O);
				},
				get height() {
					return q(k);
				}
			});
		}), M(t), ki(t, (e, t) => Qm?.(e, t), () => ({
			nodeId: de,
			isSelectable: q(pe),
			disabled: !q(fe),
			handleSelector: q(oe),
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
		})), ga(t, (e) => B(xe, e), () => q(xe)), Y(e, t);
	};
	return gi(Me, (e) => {
		q(S) || e(Ne);
	}), Y(e, je), F(Ae);
}
Q(sh, {
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
var ch = /* @__PURE__ */ J("<div class=\"svelte-flow__nodes\"></div>");
function lh(e, t) {
	P(t, !0);
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
	mi(() => {
		f?.disconnect();
	});
	var p = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), R();
		},
		get nodeClickDistance() {
			return r();
		},
		set nodeClickDistance(e) {
			r(e), R();
		},
		get onnodeclick() {
			return i();
		},
		set onnodeclick(e) {
			i(e), R();
		},
		get onnodecontextmenu() {
			return a();
		},
		set onnodecontextmenu(e) {
			a(e), R();
		},
		get onnodepointerenter() {
			return o();
		},
		set onnodepointerenter(e) {
			o(e), R();
		},
		get onnodepointermove() {
			return s();
		},
		set onnodepointermove(e) {
			s(e), R();
		},
		get onnodepointerleave() {
			return c();
		},
		set onnodepointerleave(e) {
			c(e), R();
		},
		get onnodedrag() {
			return l();
		},
		set onnodedrag(e) {
			l(e), R();
		},
		get onnodedragstart() {
			return u();
		},
		set onnodedragstart(e) {
			u(e), R();
		},
		get onnodedragstop() {
			return d();
		},
		set onnodedragstop(e) {
			d(e), R();
		}
	}, m = ch();
	return xi(m, 21, () => n().visible.nodes.values(), (e) => e.id, (e, t) => {
		sh(e, {
			get node() {
				return q(t);
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
	}), M(m), Y(e, m), F(p);
}
Q(lh, {
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
var uh = /* @__PURE__ */ Ur("<svg class=\"svelte-flow__edge-wrapper\"><g><!></g></svg>");
function dh(e, t) {
	P(t, !0);
	let n = Z(t, "edge", 7), r = Z(t, "store", 15), i = Z(t, "onedgeclick", 7), a = Z(t, "onedgecontextmenu", 7), o = Z(t, "onedgepointerenter", 7), s = Z(t, "onedgepointerleave", 7), c = /* @__PURE__ */ I(() => n().id), l = /* @__PURE__ */ I(() => n().source), u = /* @__PURE__ */ I(() => n().target), d = /* @__PURE__ */ I(() => n().sourceX), f = /* @__PURE__ */ I(() => n().sourceY), p = /* @__PURE__ */ I(() => n().targetX), m = /* @__PURE__ */ I(() => n().targetY), h = /* @__PURE__ */ I(() => n().sourcePosition), g = /* @__PURE__ */ I(() => n().targetPosition), _ = /* @__PURE__ */ I(() => b(n().animated, !1)), v = /* @__PURE__ */ I(() => b(n().selected, !1)), y = /* @__PURE__ */ I(() => n().label), x = /* @__PURE__ */ I(() => n().labelStyle), S = /* @__PURE__ */ I(() => b(n().data, () => ({}), !0)), C = /* @__PURE__ */ I(() => n().style), w = /* @__PURE__ */ I(() => n().interactionWidth), T = /* @__PURE__ */ I(() => b(n().type, "default")), E = /* @__PURE__ */ I(() => n().sourceHandle), D = /* @__PURE__ */ I(() => n().targetHandle), ee = /* @__PURE__ */ I(() => n().markerStart), te = /* @__PURE__ */ I(() => n().markerEnd), ne = /* @__PURE__ */ I(() => n().selectable), re = /* @__PURE__ */ I(() => n().focusable), ie = /* @__PURE__ */ I(() => b(n().deletable, !0)), ae = /* @__PURE__ */ I(() => n().hidden), O = /* @__PURE__ */ I(() => n().zIndex), k = /* @__PURE__ */ I(() => n().class), oe = /* @__PURE__ */ I(() => n().ariaLabel);
	Zp(q(c));
	let se = null, ce = /* @__PURE__ */ I(() => q(ne) ?? r().elementsSelectable), le = /* @__PURE__ */ I(() => q(re) ?? r().edgesFocusable), ue = /* @__PURE__ */ I(() => r().edgeTypes[q(T)] ?? Cm), de = /* @__PURE__ */ I(() => q(ee) ? `url('#${Gf(q(ee), r().flowId)}')` : void 0), fe = /* @__PURE__ */ I(() => q(te) ? `url('#${Gf(q(te), r().flowId)}')` : void 0);
	function pe(e) {
		let t = r().edgeLookup.get(q(c));
		t && (q(ce) && r().handleEdgeSelection(q(c)), i()?.({
			event: e,
			edge: t
		}));
	}
	function me(e, t) {
		let n = r().edgeLookup.get(q(c));
		n && t({
			event: e,
			edge: n
		});
	}
	function he(e) {
		if (!r().disableKeyboardA11y && hd.includes(e.key) && q(ce)) {
			let { unselectNodesAndEdges: t, addSelectedEdges: i } = r();
			e.key === "Escape" ? (se?.blur(), t({ edges: [n()] })) : i([q(c)]);
		}
	}
	var ge = {
		get edge() {
			return n();
		},
		set edge(e) {
			n(e), R();
		},
		get store() {
			return r();
		},
		set store(e) {
			r(e), R();
		},
		get onedgeclick() {
			return i();
		},
		set onedgeclick(e) {
			i(e), R();
		},
		get onedgecontextmenu() {
			return a();
		},
		set onedgecontextmenu(e) {
			a(e), R();
		},
		get onedgepointerenter() {
			return o();
		},
		set onedgepointerenter(e) {
			o(e), R();
		},
		get onedgepointerleave() {
			return s();
		},
		set onedgepointerleave(e) {
			s(e), R();
		}
	}, _e = Gr(), ve = H(_e), ye = (e) => {
		var t = uh();
		let i;
		var b = V(t);
		oa(b, () => ({
			class: ["svelte-flow__edge", q(k)],
			"data-id": q(c),
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
			"aria-label": q(oe) === null ? void 0 : q(oe) ? q(oe) : `Edge from ${q(l)} to ${q(u)}`,
			"aria-describedby": q(le) ? `${ih}-${r().flowId}` : void 0,
			role: n().ariaRole ?? (q(le) ? "group" : "img"),
			"aria-roledescription": "edge",
			onkeydown: q(le) ? he : void 0,
			tabindex: q(le) ? 0 : void 0,
			...n().domAttributes,
			[Xi]: {
				animated: q(_),
				selected: q(v),
				selectable: q(ce)
			}
		})), Di(V(b), () => q(ue), (e, t) => {
			t(e, {
				get id() {
					return q(c);
				},
				get source() {
					return q(l);
				},
				get target() {
					return q(u);
				},
				get sourceX() {
					return q(d);
				},
				get sourceY() {
					return q(f);
				},
				get targetX() {
					return q(p);
				},
				get targetY() {
					return q(m);
				},
				get sourcePosition() {
					return q(h);
				},
				get targetPosition() {
					return q(g);
				},
				get animated() {
					return q(_);
				},
				get selected() {
					return q(v);
				},
				get label() {
					return q(y);
				},
				get labelStyle() {
					return q(x);
				},
				get data() {
					return q(S);
				},
				get style() {
					return q(C);
				},
				get interactionWidth() {
					return q(w);
				},
				get selectable() {
					return q(ce);
				},
				get deletable() {
					return q(ie);
				},
				get type() {
					return q(T);
				},
				get sourceHandleId() {
					return q(E);
				},
				get targetHandleId() {
					return q(D);
				},
				get markerStart() {
					return q(de);
				},
				get markerEnd() {
					return q(fe);
				}
			});
		}), M(b), ga(b, (e) => se = e, () => se), M(t), W(() => i = Vi(t, "", i, { "z-index": q(O) })), Y(e, t);
	};
	return gi(ve, (e) => {
		q(ae) || e(ye);
	}), Y(e, _e), F(ge);
}
//#endregion
//#region node_modules/svelte/src/internal/flags/legacy.js
Q(dh, {
	edge: {},
	store: {},
	onedgeclick: {},
	onedgecontextmenu: {},
	onedgepointerenter: {},
	onedgepointerleave: {}
}, [], [], { mode: "open" }), Ke();
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/MarkerDefinition.svelte
var fh = /* @__PURE__ */ Ur("<defs></defs>");
function ph(e, t) {
	P(t, !1);
	let n = zm();
	_a();
	var r = fh();
	xi(r, 5, () => n.markers, (e) => e.id, (e, t) => {
		_h(e, wa(() => q(t)));
	}), M(r), Y(e, r), F();
}
Q(ph, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/Marker.svelte
var mh = /* @__PURE__ */ Ur("<polyline class=\"arrow\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4\"></polyline>"), hh = /* @__PURE__ */ Ur("<polyline class=\"arrowclosed\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4 -5,-4\"></polyline>"), gh = /* @__PURE__ */ Ur("<marker class=\"svelte-flow__arrowhead\" viewBox=\"-10 -10 20 20\" refX=\"0\" refY=\"0\"><!></marker>");
function _h(e, t) {
	P(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "type", 7), i = Z(t, "width", 7, 12.5), a = Z(t, "height", 7, 12.5), o = Z(t, "markerUnits", 7, "strokeWidth"), s = Z(t, "orient", 7, "auto-start-reverse"), c = Z(t, "color", 7, "none"), l = Z(t, "strokeWidth", 7);
	var u = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), R();
		},
		get type() {
			return r();
		},
		set type(e) {
			r(e), R();
		},
		get width() {
			return i();
		},
		set width(e = 12.5) {
			i(e), R();
		},
		get height() {
			return a();
		},
		set height(e = 12.5) {
			a(e), R();
		},
		get markerUnits() {
			return o();
		},
		set markerUnits(e = "strokeWidth") {
			o(e), R();
		},
		get orient() {
			return s();
		},
		set orient(e = "auto-start-reverse") {
			s(e), R();
		},
		get color() {
			return c();
		},
		set color(e = "none") {
			c(e), R();
		},
		get strokeWidth() {
			return l();
		},
		set strokeWidth(e) {
			l(e), R();
		}
	}, d = gh(), f = V(d), p = (e) => {
		var t = mh();
		let n;
		W(() => {
			X(t, "stroke-width", l()), n = Vi(t, "", n, { stroke: c() });
		}), Y(e, t);
	}, m = (e) => {
		var t = hh();
		let n;
		W(() => {
			X(t, "stroke-width", l()), n = Vi(t, "", n, {
				stroke: c(),
				fill: c()
			});
		}), Y(e, t);
	};
	return gi(f, (e) => {
		r() === Sd.Arrow ? e(p) : r() === Sd.ArrowClosed && e(m, 1);
	}), M(d), W(() => {
		X(d, "id", n()), X(d, "markerWidth", `${i()}`), X(d, "markerHeight", `${a()}`), X(d, "markerUnits", o()), X(d, "orient", s());
	}), Y(e, d), F(u);
}
Q(_h, {
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
var vh = /* @__PURE__ */ J("<div class=\"svelte-flow__edges\"><svg class=\"svelte-flow__marker\"><!></svg> <!></div>");
function yh(e, t) {
	P(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "onedgeclick", 7), i = Z(t, "onedgecontextmenu", 7), a = Z(t, "onedgepointerenter", 7), o = Z(t, "onedgepointerleave", 7);
	var s = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), R();
		},
		get onedgeclick() {
			return r();
		},
		set onedgeclick(e) {
			r(e), R();
		},
		get onedgecontextmenu() {
			return i();
		},
		set onedgecontextmenu(e) {
			i(e), R();
		},
		get onedgepointerenter() {
			return a();
		},
		set onedgepointerenter(e) {
			a(e), R();
		},
		get onedgepointerleave() {
			return o();
		},
		set onedgepointerleave(e) {
			o(e), R();
		}
	}, c = vh(), l = V(c);
	return ph(V(l), {}), M(l), xi(U(l, 2), 17, () => n().visible.edges.values(), (e) => e.id, (e, t) => {
		dh(e, {
			get edge() {
				return q(t);
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
	}), M(c), Y(e, c), F(s);
}
Q(yh, {
	store: {},
	onedgeclick: {},
	onedgecontextmenu: {},
	onedgepointerenter: {},
	onedgepointerleave: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Selection/Selection.svelte
var bh = /* @__PURE__ */ J("<div class=\"svelte-flow__selection svelte-1vr3gfi\"></div>"), xh = {
	hash: "svelte-1vr3gfi",
	code: ".svelte-flow__selection.svelte-1vr3gfi {position:absolute;top:0;left:0;}"
};
function Sh(e, t) {
	P(t, !0), Oi(e, xh);
	let n = Z(t, "x", 7, 0), r = Z(t, "y", 7, 0), i = Z(t, "width", 7, 0), a = Z(t, "height", 7, 0), o = Z(t, "isVisible", 7, !0);
	var s = {
		get x() {
			return n();
		},
		set x(e = 0) {
			n(e), R();
		},
		get y() {
			return r();
		},
		set y(e = 0) {
			r(e), R();
		},
		get width() {
			return i();
		},
		set width(e = 0) {
			i(e), R();
		},
		get height() {
			return a();
		},
		set height(e = 0) {
			a(e), R();
		},
		get isVisible() {
			return o();
		},
		set isVisible(e = !0) {
			o(e), R();
		}
	}, c = Gr(), l = H(c), u = (e) => {
		var t = bh();
		let o;
		W((e, i) => o = Vi(t, "", o, {
			width: e,
			height: i,
			transform: `translate(${n()}px, ${r()}px)`
		}), [() => typeof i() == "string" ? i() : pm(i()), () => typeof a() == "string" ? a() : pm(a())]), Y(e, t);
	};
	return gi(l, (e) => {
		o() && e(u);
	}), Y(e, c), F(s);
}
Q(Sh, {
	x: {},
	y: {},
	width: {},
	height: {},
	isVisible: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/NodeSelection/NodeSelection.svelte
var Ch = /* @__PURE__ */ J("<div><!></div>"), wh = {
	hash: "svelte-sf2y5e",
	code: ".svelte-flow__selection-wrapper.svelte-sf2y5e {position:absolute;top:0;left:0;z-index:2000;pointer-events:all;}.svelte-flow__selection-wrapper.svelte-sf2y5e:focus,\n  .svelte-flow__selection-wrapper.svelte-sf2y5e:focus-visible {outline:none;}"
};
function Th(e, t) {
	P(t, !0), Oi(e, wh);
	let n = Z(t, "store", 15), r = Z(t, "onnodedrag", 7), i = Z(t, "onnodedragstart", 7), a = Z(t, "onnodedragstop", 7), o = Z(t, "onselectionclick", 7), s = Z(t, "onselectioncontextmenu", 7), c = /* @__PURE__ */ z(void 0);
	On(() => {
		n().disableKeyboardA11y || q(c)?.focus({ preventScroll: !0 });
	});
	let l = /* @__PURE__ */ I(() => {
		if (n().selectionRectMode === "nodes") {
			n().nodes;
			let e = kd(n().nodeLookup, { filter: (e) => !!e.selected });
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
		Object.prototype.hasOwnProperty.call(mm, e.key) && (e.preventDefault(), n().moveSelectedNodes(mm[e.key], e.shiftKey ? 4 : 1));
	}
	var p = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), R();
		},
		get onnodedrag() {
			return r();
		},
		set onnodedrag(e) {
			r(e), R();
		},
		get onnodedragstart() {
			return i();
		},
		set onnodedragstart(e) {
			i(e), R();
		},
		get onnodedragstop() {
			return a();
		},
		set onnodedragstop(e) {
			a(e), R();
		},
		get onselectionclick() {
			return o();
		},
		set onselectionclick(e) {
			o(e), R();
		},
		get onselectioncontextmenu() {
			return s();
		},
		set onselectioncontextmenu(e) {
			s(e), R();
		}
	}, m = Gr(), h = H(m), g = (e) => {
		var t = Ch();
		let o;
		Sh(V(t), {
			width: "100%",
			height: "100%",
			x: 0,
			y: 0
		}), M(t), ki(t, (e, t) => Qm?.(e, t), () => ({
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
		})), ga(t, (e) => B(c, e), () => q(c)), W((e, r) => {
			zi(t, 1, Ni(["svelte-flow__selection-wrapper", n().noPanClass]), "svelte-sf2y5e"), X(t, "role", n().disableKeyboardA11y ? void 0 : "button"), X(t, "tabindex", n().disableKeyboardA11y ? void 0 : -1), o = Vi(t, "", o, {
				width: e,
				height: r,
				transform: `translate(${q(l).x ?? ""}px, ${q(l).y ?? ""}px)`
			});
		}, [() => pm(q(l).width), () => pm(q(l).height)]), Nr("contextmenu", t, u), Nr("click", t, d), Nr("keydown", t, function(...e) {
			(n().disableKeyboardA11y ? void 0 : f)?.apply(this, e);
		}), Y(e, t);
	}, _ = /* @__PURE__ */ I(() => n().selectionRectMode === "nodes" && q(l) && Xd(q(l).x) && Xd(q(l).y));
	return gi(h, (e) => {
		q(_) && e(g);
	}), Y(e, m), F(p);
}
Pr([
	"contextmenu",
	"click",
	"keydown"
]), Q(Th, {
	store: {},
	onnodedrag: {},
	onnodedragstart: {},
	onnodedragstop: {},
	onselectionclick: {},
	onselectioncontextmenu: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@svelte-put/shortcut/src/shortcut.js
function Eh(e) {
	switch (e) {
		case "none": return 0;
		case "ctrl": return 8;
		case "shift": return 4;
		case "alt": return 2;
		case "meta": return 1;
	}
}
function Dh(e, t) {
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
					for (let n of e) if ((Array.isArray(n) ? n : [n]).reduce((e, t) => e | Eh(t), 0) === i) {
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
	return n && (o = jr(e, i, a)), {
		update: (t) => {
			let { enabled: s = !0, type: c = "keydown" } = t;
			n && (!s || i !== c) ? o?.() : !n && s && (o = jr(e, c, a)), n = s, i = c, r = t.trigger;
		},
		destroy: () => {
			o?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useSvelteFlow.svelte.js
function Oh() {
	let e = /* @__PURE__ */ I(zm), t = (t) => {
		let n = dm(t) ? t : q(e).nodeLookup.get(t.id), r = n.parentId ? uf(n.position, n.measured, n.parentId, q(e).nodeLookup, q(e).nodeOrigin) : n.position;
		return Wd({
			...n,
			position: r,
			width: n.measured?.width ?? n.width,
			height: n.measured?.height ?? n.height
		});
	};
	function n(t, n, r = { replace: !1 }) {
		q(e).nodes = wr(() => q(e).nodes).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r?.replace && dm(t) ? t : {
					...e,
					...t
				};
			}
			return e;
		});
	}
	function r(t, n, r = { replace: !1 }) {
		q(e).edges = wr(() => q(e).edges).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r.replace && fm(t) ? t : {
					...e,
					...t
				};
			}
			return e;
		});
	}
	let i = (t) => q(e).nodeLookup.get(t);
	return {
		zoomIn: q(e).zoomIn,
		zoomOut: q(e).zoomOut,
		getInternalNode: i,
		getNode: (e) => i(e)?.internals.userNode,
		getNodes: (t) => t === void 0 ? q(e).nodes : kh(q(e).nodeLookup, t),
		getEdge: (t) => q(e).edgeLookup.get(t),
		getEdges: (t) => t === void 0 ? q(e).edges : kh(q(e).edgeLookup, t),
		setZoom: async (t, n) => {
			let r = q(e).panZoom;
			return r ? r.scaleTo(t, n) : !1;
		},
		getZoom: () => q(e).viewport.zoom,
		setViewport: async (t, n) => {
			let r = q(e).viewport;
			return q(e).panZoom ? (await q(e).panZoom.setViewport({
				x: t.x ?? r.x,
				y: t.y ?? r.y,
				zoom: t.zoom ?? r.zoom
			}, n), !0) : !1;
		},
		getViewport: () => Je(q(e).viewport),
		setCenter: async (t, n, r) => q(e).setCenter(t, n, r),
		fitView: (t) => q(e).fitView(t),
		fitBounds: async (t, n) => {
			if (!q(e).panZoom) return !1;
			let r = af(t, q(e).width, q(e).height, q(e).minZoom, q(e).maxZoom, n?.padding ?? .1);
			return await q(e).panZoom.setViewport(r, {
				duration: n?.duration,
				ease: n?.ease,
				interpolate: n?.interpolate
			}), !0;
		},
		getIntersectingNodes: (n, r = !0, i) => {
			let a = Yd(n), o = a ? n : t(n);
			return o ? (i || q(e).nodes).filter((t) => {
				let i = q(e).nodeLookup.get(t.id);
				if (!i || !a && t.id === n.id) return !1;
				let s = Wd(i), c = Jd(s, o);
				return r && c > 0 || c >= s.width * s.height || c >= o.width * o.height;
			}) : [];
		},
		isNodeIntersecting: (e, n, r = !0) => {
			let i = Yd(e) ? e : t(e);
			if (!i) return !1;
			let a = Jd(i, n);
			return r && a > 0 || a >= n.width * n.height || a >= i.width * i.height;
		},
		deleteElements: async ({ nodes: t = [], edges: n = [] }) => {
			let { nodes: r, edges: i } = await Fd({
				nodesToRemove: t,
				edgesToRemove: n,
				nodes: q(e).nodes,
				edges: q(e).edges,
				onBeforeDelete: q(e).onbeforedelete
			});
			return r && (q(e).nodes = wr(() => q(e).nodes).filter((e) => !r.some(({ id: t }) => t === e.id))), i && (q(e).edges = wr(() => q(e).edges).filter((e) => !i.some(({ id: t }) => t === e.id))), (r.length > 0 || i.length > 0) && q(e).ondelete?.({
				nodes: r,
				edges: i
			}), {
				deletedNodes: r,
				deletedEdges: i
			};
		},
		screenToFlowPosition: (t, n = { snapToGrid: !0 }) => {
			if (!q(e).domNode) return t;
			let r = n.snapToGrid ? q(e).snapGrid : !1, { x: i, y: a, zoom: o } = q(e).viewport, { x: s, y: c } = q(e).domNode.getBoundingClientRect();
			return $d({
				x: t.x - s,
				y: t.y - c
			}, [
				i,
				a,
				o
			], r !== null, r || [1, 1]);
		},
		flowToScreenPosition: (t) => {
			if (!q(e).domNode) return t;
			let { x: n, y: r, zoom: i } = q(e).viewport, { x: a, y: o } = q(e).domNode.getBoundingClientRect(), s = ef(t, [
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
			nodes: [...q(e).nodes],
			edges: [...q(e).edges],
			viewport: { ...q(e).viewport }
		}),
		updateNode: n,
		updateNodeData: (t, r, i) => {
			let a = q(e).nodeLookup.get(t)?.internals.userNode;
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
		getNodesBounds: (t) => Od(t, {
			nodeLookup: q(e).nodeLookup,
			nodeOrigin: q(e).nodeOrigin
		}),
		getHandleConnections: ({ type: t, id: n, nodeId: r }) => Array.from(q(e).connectionLookup.get(`${r}-${t}-${n ?? null}`)?.values() ?? [])
	};
}
function kh(e, t) {
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
function Ah(e, t) {
	P(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "selectionKey", 7, "Shift"), i = Z(t, "multiSelectionKey", 23, () => of() ? "Meta" : "Control"), a = Z(t, "deleteKey", 7, "Backspace"), o = Z(t, "panActivationKey", 7, " "), s = Z(t, "zoomActivationKey", 23, () => of() ? "Meta" : "Control"), { deleteElements: c } = Oh();
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
	return Mr("blur", cn, p), Mr("contextmenu", cn, p), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !0, !0)),
		type: "keydown"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !1, !0)),
		type: "keyup"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(i(), () => {
			n(n().multiselectionKeyPressed = !0, !0);
		}),
		type: "keydown"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(i(), () => n(n().multiselectionKeyPressed = !1, !0)),
		type: "keyup"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(a(), (e) => {
			!(e.originalEvent.ctrlKey || e.originalEvent.metaKey || e.originalEvent.shiftKey) && !yf(e.originalEvent) && (n(n().deleteKeyPressed = !0, !0), m());
		}),
		type: "keydown"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(a(), () => n(n().deleteKeyPressed = !1, !0)),
		type: "keyup"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), ki(cn, (e, t) => Dh?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), F({
		get store() {
			return n();
		},
		set store(e) {
			n(e), R();
		},
		get selectionKey() {
			return r();
		},
		set selectionKey(e = "Shift") {
			r(e), R();
		},
		get multiSelectionKey() {
			return i();
		},
		set multiSelectionKey(e = of() ? "Meta" : "Control") {
			i(e), R();
		},
		get deleteKey() {
			return a();
		},
		set deleteKey(e = "Backspace") {
			a(e), R();
		},
		get panActivationKey() {
			return o();
		},
		set panActivationKey(e = " ") {
			o(e), R();
		},
		get zoomActivationKey() {
			return s();
		},
		set zoomActivationKey(e = of() ? "Meta" : "Control") {
			s(e), R();
		}
	});
}
Q(Ah, {
	store: {},
	selectionKey: {},
	multiSelectionKey: {},
	deleteKey: {},
	panActivationKey: {},
	zoomActivationKey: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/ConnectionLine/ConnectionLine.svelte
var jh = /* @__PURE__ */ Ur("<path fill=\"none\" class=\"svelte-flow__connection-path\"></path>"), Mh = /* @__PURE__ */ Ur("<svg class=\"svelte-flow__connectionline\"><g><!></g></svg>");
function Nh(e, t) {
	P(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "type", 7), i = Z(t, "containerStyle", 7), a = Z(t, "style", 7), o = Z(t, "LineComponent", 7), s = /* @__PURE__ */ I(() => {
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
			case xd.Bezier: {
				let [t] = Ef(e);
				return t;
			}
			case xd.Straight: {
				let [t] = Nf(e);
				return t;
			}
			case xd.Step:
			case xd.SmoothStep: {
				let [t] = zf({
					...e,
					borderRadius: r() === xd.Step ? 0 : void 0
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
			n(e), R();
		},
		get type() {
			return r();
		},
		set type(e) {
			r(e), R();
		},
		get containerStyle() {
			return i();
		},
		set containerStyle(e) {
			i(e), R();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), R();
		},
		get LineComponent() {
			return o();
		},
		set LineComponent(e) {
			o(e), R();
		}
	}, l = Gr(), u = H(l), d = (e) => {
		var t = Mh(), r = V(t), c = V(r), l = (e) => {
			var t = Gr();
			Di(H(t), o, (e, t) => {
				t(e, {});
			}), Y(e, t);
		}, u = (e) => {
			var t = jh();
			W(() => {
				X(t, "d", q(s)), Vi(t, a());
			}), Y(e, t);
		};
		gi(c, (e) => {
			o() ? e(l) : e(u, -1);
		}), M(r), M(t), W((e) => {
			X(t, "width", n().width), X(t, "height", n().height), Vi(t, i()), zi(r, 0, e);
		}, [() => Ni(["svelte-flow__connection", mf(n().connection.isValid)])]), Y(e, t);
	};
	return gi(u, (e) => {
		n().connection.inProgress && e(d);
	}), Y(e, l), F(c);
}
Q(Nh, {
	store: {},
	type: {},
	containerStyle: {},
	style: {},
	LineComponent: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Panel/Panel.svelte
var Ph = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"position",
	"style",
	"class",
	"children"
]), Fh = /* @__PURE__ */ J("<div><!></div>");
function Ih(e, t) {
	P(t, !0);
	let n = Z(t, "position", 7, "top-right"), r = Z(t, "style", 7), i = Z(t, "class", 7), a = Z(t, "children", 7), o = /* @__PURE__ */ Sa(t, Ph), s = /* @__PURE__ */ I(() => `${n()}`.split("-"));
	var c = {
		get position() {
			return n();
		},
		set position(e = "top-right") {
			n(e), R();
		},
		get style() {
			return r();
		},
		set style(e) {
			r(e), R();
		},
		get class() {
			return i();
		},
		set class(e) {
			i(e), R();
		},
		get children() {
			return a();
		},
		set children(e) {
			a(e), R();
		}
	}, l = Fh();
	return oa(l, (e) => ({
		class: e,
		style: r(),
		...o
	}), [() => [
		"svelte-flow__panel",
		i(),
		...q(s)
	]]), fi(V(l), () => a() ?? g), M(l), Y(e, l), F(c);
}
Q(Ih, {
	position: {},
	style: {},
	class: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Attribution/Attribution.svelte
var Lh = /* @__PURE__ */ J("<a target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Svelte Flow attribution\">Svelte Flow</a>");
function Rh(e, t) {
	P(t, !0);
	let n = Z(t, "proOptions", 7), r = Z(t, "position", 7, "bottom-right"), i = "https://svelteflow.dev?utm_source=attribution";
	var a = {
		get proOptions() {
			return n();
		},
		set proOptions(e) {
			n(e), R();
		},
		get position() {
			return r();
		},
		set position(e = "bottom-right") {
			r(e), R();
		}
	}, o = Gr(), s = H(o), c = (e) => {
		{
			let t = /* @__PURE__ */ I(() => `Please only hide this attribution when you are subscribed to Svelte Flow Pro: ${i}`);
			Ih(e, {
				get position() {
					return r();
				},
				class: "svelte-flow__attribution",
				get "data-message"() {
					return q(t);
				},
				children: (e, t) => {
					var n = Lh();
					W(() => X(n, "href", i)), Y(e, n);
				},
				$$slots: { default: !0 }
			});
		}
	};
	return gi(s, (e) => {
		n()?.hideAttribution || e(c);
	}), Y(e, o), F(a);
}
Q(Rh, {
	proOptions: {},
	position: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/SvelteFlow/Wrapper.svelte
var zh = /* @__PURE__ */ J("<div><!></div>"), Bh = {
	hash: "svelte-mkap6j",
	code: ".svelte-flow.svelte-mkap6j {width:100%;height:100%;overflow:hidden;position:relative;z-index:0;}"
};
function Vh(e, t) {
	P(t, !0), Oi(e, Bh);
	let n = Z(t, "width", 7), r = Z(t, "height", 7), i = Z(t, "colorMode", 7), a = Z(t, "domNode", 15), o = Z(t, "clientWidth", 15), s = Z(t, "clientHeight", 15), c = Z(t, "children", 7), l = Z(t, "rest", 7), u = /* @__PURE__ */ I(() => l().class), d = /* @__PURE__ */ I(() => S(l(), /* @__PURE__ */ "id.class.nodeTypes.edgeTypes.colorMode.isValidConnection.onmove.onmovestart.onmoveend.onflowerror.ondelete.onbeforedelete.onbeforeconnect.onconnect.onconnectstart.onconnectend.onbeforereconnect.onreconnect.onreconnectstart.onreconnectend.onclickconnectstart.onclickconnectend.oninit.onselectionchange.onselectiondragstart.onselectiondrag.onselectiondragstop.onselectionstart.onselectionend.clickConnect.fitView.fitViewOptions.nodeOrigin.nodeDragThreshold.connectionDragThreshold.minZoom.maxZoom.initialViewport.connectionRadius.connectionMode.selectionMode.selectNodesOnDrag.snapGrid.defaultMarkerColor.translateExtent.nodeExtent.onlyRenderVisibleElements.autoPanOnConnect.autoPanOnNodeDrag.colorModeSSR.defaultEdgeOptions.elevateNodesOnSelect.elevateEdgesOnSelect.nodesDraggable.autoPanOnNodeFocus.nodesConnectable.elementsSelectable.nodesFocusable.edgesFocusable.disableKeyboardA11y.noDragClass.noPanClass.noWheelClass.ariaLabelConfig.autoPanSpeed.panOnScrollSpeed.zIndexMode.autoPanOnSelection".split(".")));
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
			n(e), R();
		},
		get height() {
			return r();
		},
		set height(e) {
			r(e), R();
		},
		get colorMode() {
			return i();
		},
		set colorMode(e) {
			i(e), R();
		},
		get domNode() {
			return a();
		},
		set domNode(e) {
			a(e), R();
		},
		get clientWidth() {
			return o();
		},
		set clientWidth(e) {
			o(e), R();
		},
		get clientHeight() {
			return s();
		},
		set clientHeight(e) {
			s(e), R();
		},
		get children() {
			return c();
		},
		set children(e) {
			c(e), R();
		},
		get rest() {
			return l();
		},
		set rest(e) {
			l(e), R();
		}
	}, m = zh();
	return oa(m, (e, t) => ({
		class: [
			"svelte-flow",
			"svelte-flow__container",
			i(),
			q(u)
		],
		"data-testid": "svelte-flow__wrapper",
		role: "application",
		onscroll: f,
		...q(d),
		[Zi]: {
			width: e,
			height: t
		}
	}), [() => pm(n()), () => pm(r())], void 0, void 0, "svelte-mkap6j"), fi(V(m), () => c() ?? g), M(m), ga(m, (e) => a(e), () => a()), ma(m, "clientHeight", s), ma(m, "clientWidth", o), Y(e, m), F(p);
}
Q(Vh, {
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
var Hh = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.$$host.width.height.proOptions.selectionKey.deleteKey.panActivationKey.multiSelectionKey.zoomActivationKey.paneClickDistance.nodeClickDistance.onmovestart.onmoveend.onmove.oninit.onnodeclick.onnodecontextmenu.onnodedrag.onnodedragstart.onnodedragstop.onnodepointerenter.onnodepointermove.onnodepointerleave.onselectionclick.onselectioncontextmenu.onselectionstart.onselectionend.onedgeclick.onedgecontextmenu.onedgepointerenter.onedgepointerleave.onpaneclick.onpanecontextmenu.panOnScrollMode.preventScrolling.zoomOnScroll.zoomOnDoubleClick.zoomOnPinch.panOnScroll.panOnScrollSpeed.panOnDrag.selectionOnDrag.autoPanOnSelection.connectionLineComponent.connectionLineStyle.connectionLineContainerStyle.connectionLineType.attributionPosition.children.nodes.edges.viewport".split(".")), Uh = /* @__PURE__ */ J("<div class=\"svelte-flow__viewport-back svelte-flow__container\"></div> <!> <div class=\"svelte-flow__edge-labels svelte-flow__container\"></div> <!> <!> <!> <div class=\"svelte-flow__viewport-front svelte-flow__container\"></div>", 1), Wh = /* @__PURE__ */ J("<!> <!>", 1), Gh = /* @__PURE__ */ J("<!> <!> <!> <!> <!>", 1);
function Kh(e, t) {
	P(t, !0);
	let n = Z(t, "width", 7), r = Z(t, "height", 7), i = Z(t, "proOptions", 7), a = Z(t, "selectionKey", 7), o = Z(t, "deleteKey", 7), s = Z(t, "panActivationKey", 7), c = Z(t, "multiSelectionKey", 7), l = Z(t, "zoomActivationKey", 7), u = Z(t, "paneClickDistance", 7, 1), d = Z(t, "nodeClickDistance", 7, 1), f = Z(t, "onmovestart", 7), p = Z(t, "onmoveend", 7), m = Z(t, "onmove", 7), h = Z(t, "oninit", 7), _ = Z(t, "onnodeclick", 7), v = Z(t, "onnodecontextmenu", 7), y = Z(t, "onnodedrag", 7), b = Z(t, "onnodedragstart", 7), x = Z(t, "onnodedragstop", 7), S = Z(t, "onnodepointerenter", 7), C = Z(t, "onnodepointermove", 7), w = Z(t, "onnodepointerleave", 7), T = Z(t, "onselectionclick", 7), E = Z(t, "onselectioncontextmenu", 7), D = Z(t, "onselectionstart", 7), ee = Z(t, "onselectionend", 7), te = Z(t, "onedgeclick", 7), ne = Z(t, "onedgecontextmenu", 7), re = Z(t, "onedgepointerenter", 7), ie = Z(t, "onedgepointerleave", 7), ae = Z(t, "onpaneclick", 7), O = Z(t, "onpanecontextmenu", 7), k = Z(t, "panOnScrollMode", 23, () => vd.Free), oe = Z(t, "preventScrolling", 7, !0), se = Z(t, "zoomOnScroll", 7, !0), ce = Z(t, "zoomOnDoubleClick", 7, !0), le = Z(t, "zoomOnPinch", 7, !0), ue = Z(t, "panOnScroll", 7, !1), de = Z(t, "panOnScrollSpeed", 7, .5), fe = Z(t, "panOnDrag", 7, !0), pe = Z(t, "selectionOnDrag", 7, !1), me = Z(t, "autoPanOnSelection", 7, !0), he = Z(t, "connectionLineComponent", 7), ge = Z(t, "connectionLineStyle", 7), _e = Z(t, "connectionLineContainerStyle", 7), ve = Z(t, "connectionLineType", 23, () => xd.Bezier), ye = Z(t, "attributionPosition", 7), be = Z(t, "children", 7), xe = Z(t, "nodes", 31, () => an([])), Se = Z(t, "edges", 31, () => an([])), A = Z(t, "viewport", 15, void 0), Ce = /* @__PURE__ */ Sa(t, Hh), j = Vm({
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
	}), we = $e(Bm);
	return we && we.setStore && we.setStore(j), et(Bm, {
		provider: !1,
		getStore() {
			return j;
		}
	}), On(() => {
		let e = {
			nodes: j.selectedNodes,
			edges: j.selectedEdges
		};
		wr(() => t.onselectionchange)?.(e);
		for (let t of j.selectionChangeHandlers.values()) t(e);
	}), mi(() => {
		we?.setStore(Vm({
			width: 0,
			height: 0,
			nodes: [],
			edges: [],
			props: {}
		}));
	}), Vh(e, {
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
			var n = Gh(), r = H(n);
			Ah(r, {
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
			var xe = U(r, 2);
			Wm(xe, {
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
					Ym(e, {
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
							var n = Wh(), r = H(n);
							Zm(r, {
								get store() {
									return j;
								},
								set store(e) {
									j = e;
								},
								children: (e, t) => {
									var n = Uh(), r = U(H(n), 2);
									yh(r, {
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
									var i = U(r, 4);
									Nh(i, {
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
									var a = U(i, 2);
									lh(a, {
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
									}), Th(U(a, 2), {
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
									}), Ee(2), Y(e, n);
								},
								$$slots: { default: !0 }
							});
							var i = U(r, 2);
							{
								let e = /* @__PURE__ */ I(() => !!(j.selectionRect && j.selectionRectMode === "user")), t = /* @__PURE__ */ I(() => j.selectionRect?.width), n = /* @__PURE__ */ I(() => j.selectionRect?.height), r = /* @__PURE__ */ I(() => j.selectionRect?.x), a = /* @__PURE__ */ I(() => j.selectionRect?.y);
								Sh(i, {
									get isVisible() {
										return q(e);
									},
									get width() {
										return q(t);
									},
									get height() {
										return q(n);
									},
									get x() {
										return q(r);
									},
									get y() {
										return q(a);
									}
								});
							}
							Y(e, n);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var Se = U(xe, 2);
			Rh(Se, {
				get proOptions() {
					return i();
				},
				get position() {
					return ye();
				}
			});
			var A = U(Se, 2);
			nh(A, { get store() {
				return j;
			} }), fi(U(A, 2), () => be() ?? g), Y(e, n);
		},
		$$slots: { default: !0 }
	}), F({
		get width() {
			return n();
		},
		set width(e) {
			n(e), R();
		},
		get height() {
			return r();
		},
		set height(e) {
			r(e), R();
		},
		get proOptions() {
			return i();
		},
		set proOptions(e) {
			i(e), R();
		},
		get selectionKey() {
			return a();
		},
		set selectionKey(e) {
			a(e), R();
		},
		get deleteKey() {
			return o();
		},
		set deleteKey(e) {
			o(e), R();
		},
		get panActivationKey() {
			return s();
		},
		set panActivationKey(e) {
			s(e), R();
		},
		get multiSelectionKey() {
			return c();
		},
		set multiSelectionKey(e) {
			c(e), R();
		},
		get zoomActivationKey() {
			return l();
		},
		set zoomActivationKey(e) {
			l(e), R();
		},
		get paneClickDistance() {
			return u();
		},
		set paneClickDistance(e = 1) {
			u(e), R();
		},
		get nodeClickDistance() {
			return d();
		},
		set nodeClickDistance(e = 1) {
			d(e), R();
		},
		get onmovestart() {
			return f();
		},
		set onmovestart(e) {
			f(e), R();
		},
		get onmoveend() {
			return p();
		},
		set onmoveend(e) {
			p(e), R();
		},
		get onmove() {
			return m();
		},
		set onmove(e) {
			m(e), R();
		},
		get oninit() {
			return h();
		},
		set oninit(e) {
			h(e), R();
		},
		get onnodeclick() {
			return _();
		},
		set onnodeclick(e) {
			_(e), R();
		},
		get onnodecontextmenu() {
			return v();
		},
		set onnodecontextmenu(e) {
			v(e), R();
		},
		get onnodedrag() {
			return y();
		},
		set onnodedrag(e) {
			y(e), R();
		},
		get onnodedragstart() {
			return b();
		},
		set onnodedragstart(e) {
			b(e), R();
		},
		get onnodedragstop() {
			return x();
		},
		set onnodedragstop(e) {
			x(e), R();
		},
		get onnodepointerenter() {
			return S();
		},
		set onnodepointerenter(e) {
			S(e), R();
		},
		get onnodepointermove() {
			return C();
		},
		set onnodepointermove(e) {
			C(e), R();
		},
		get onnodepointerleave() {
			return w();
		},
		set onnodepointerleave(e) {
			w(e), R();
		},
		get onselectionclick() {
			return T();
		},
		set onselectionclick(e) {
			T(e), R();
		},
		get onselectioncontextmenu() {
			return E();
		},
		set onselectioncontextmenu(e) {
			E(e), R();
		},
		get onselectionstart() {
			return D();
		},
		set onselectionstart(e) {
			D(e), R();
		},
		get onselectionend() {
			return ee();
		},
		set onselectionend(e) {
			ee(e), R();
		},
		get onedgeclick() {
			return te();
		},
		set onedgeclick(e) {
			te(e), R();
		},
		get onedgecontextmenu() {
			return ne();
		},
		set onedgecontextmenu(e) {
			ne(e), R();
		},
		get onedgepointerenter() {
			return re();
		},
		set onedgepointerenter(e) {
			re(e), R();
		},
		get onedgepointerleave() {
			return ie();
		},
		set onedgepointerleave(e) {
			ie(e), R();
		},
		get onpaneclick() {
			return ae();
		},
		set onpaneclick(e) {
			ae(e), R();
		},
		get onpanecontextmenu() {
			return O();
		},
		set onpanecontextmenu(e) {
			O(e), R();
		},
		get panOnScrollMode() {
			return k();
		},
		set panOnScrollMode(e = vd.Free) {
			k(e), R();
		},
		get preventScrolling() {
			return oe();
		},
		set preventScrolling(e = !0) {
			oe(e), R();
		},
		get zoomOnScroll() {
			return se();
		},
		set zoomOnScroll(e = !0) {
			se(e), R();
		},
		get zoomOnDoubleClick() {
			return ce();
		},
		set zoomOnDoubleClick(e = !0) {
			ce(e), R();
		},
		get zoomOnPinch() {
			return le();
		},
		set zoomOnPinch(e = !0) {
			le(e), R();
		},
		get panOnScroll() {
			return ue();
		},
		set panOnScroll(e = !1) {
			ue(e), R();
		},
		get panOnScrollSpeed() {
			return de();
		},
		set panOnScrollSpeed(e = .5) {
			de(e), R();
		},
		get panOnDrag() {
			return fe();
		},
		set panOnDrag(e = !0) {
			fe(e), R();
		},
		get selectionOnDrag() {
			return pe();
		},
		set selectionOnDrag(e = !1) {
			pe(e), R();
		},
		get autoPanOnSelection() {
			return me();
		},
		set autoPanOnSelection(e = !0) {
			me(e), R();
		},
		get connectionLineComponent() {
			return he();
		},
		set connectionLineComponent(e) {
			he(e), R();
		},
		get connectionLineStyle() {
			return ge();
		},
		set connectionLineStyle(e) {
			ge(e), R();
		},
		get connectionLineContainerStyle() {
			return _e();
		},
		set connectionLineContainerStyle(e) {
			_e(e), R();
		},
		get connectionLineType() {
			return ve();
		},
		set connectionLineType(e = xd.Bezier) {
			ve(e), R();
		},
		get attributionPosition() {
			return ye();
		},
		set attributionPosition(e) {
			ye(e), R();
		},
		get children() {
			return be();
		},
		set children(e) {
			be(e), R();
		},
		get nodes() {
			return xe();
		},
		set nodes(e = []) {
			xe(e), R();
		},
		get edges() {
			return Se();
		},
		set edges(e = []) {
			Se(e), R();
		},
		get viewport() {
			return A();
		},
		set viewport(e = void 0) {
			A(e), R();
		}
	});
}
Q(Kh, {
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
var qh = /* @__PURE__ */ new Set([
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
]), Jh = /* @__PURE__ */ J("<button><!></button>");
function Yh(e, t) {
	P(t, !0);
	let n = Z(t, "class", 7), r = Z(t, "bgColor", 7), i = Z(t, "bgColorHover", 7), a = Z(t, "color", 7), o = Z(t, "colorHover", 7), s = Z(t, "borderColor", 7), c = Z(t, "onclick", 7), l = Z(t, "children", 7), u = /* @__PURE__ */ Sa(t, qh);
	var d = {
		get class() {
			return n();
		},
		set class(e) {
			n(e), R();
		},
		get bgColor() {
			return r();
		},
		set bgColor(e) {
			r(e), R();
		},
		get bgColorHover() {
			return i();
		},
		set bgColorHover(e) {
			i(e), R();
		},
		get color() {
			return a();
		},
		set color(e) {
			a(e), R();
		},
		get colorHover() {
			return o();
		},
		set colorHover(e) {
			o(e), R();
		},
		get borderColor() {
			return s();
		},
		set borderColor(e) {
			s(e), R();
		},
		get onclick() {
			return c();
		},
		set onclick(e) {
			c(e), R();
		},
		get children() {
			return l();
		},
		set children(e) {
			l(e), R();
		}
	}, f = Jh();
	return oa(f, () => ({
		type: "button",
		onclick: c(),
		class: ["svelte-flow__controls-button", n()],
		...u,
		[Zi]: {
			"--xy-controls-button-background-color-props": r(),
			"--xy-controls-button-background-color-hover-props": i(),
			"--xy-controls-button-color-props": a(),
			"--xy-controls-button-color-hover-props": o(),
			"--xy-controls-button-border-color-props": s()
		}
	})), fi(V(f), () => l() ?? g), M(f), Y(e, f), F(d);
}
Q(Yh, {
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
var Xh = /* @__PURE__ */ Ur("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><path d=\"M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z\"></path></svg>");
function Zh(e) {
	Y(e, Xh());
}
Q(Zh, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Minus.svelte
var Qh = /* @__PURE__ */ Ur("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 5\"><path d=\"M0 0h32v4.2H0z\"></path></svg>");
function $h(e) {
	Y(e, Qh());
}
Q($h, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Fit.svelte
var eg = /* @__PURE__ */ Ur("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 30\"><path d=\"M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z\"></path></svg>");
function tg(e) {
	Y(e, eg());
}
Q(tg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Lock.svelte
var ng = /* @__PURE__ */ Ur("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z\"></path></svg>");
function rg(e) {
	Y(e, ng());
}
Q(rg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Unlock.svelte
var ig = /* @__PURE__ */ Ur("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z\"></path></svg>");
function ag(e) {
	Y(e, ig());
}
Q(ag, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Controls.svelte
var og = /* @__PURE__ */ new Set([
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
]), sg = /* @__PURE__ */ J("<!> <!>", 1), cg = /* @__PURE__ */ J("<!> <!> <!> <!> <!> <!>", 1);
function lg(e, t) {
	P(t, !0);
	let n = Z(t, "position", 7, "bottom-left"), r = Z(t, "orientation", 7, "vertical"), i = Z(t, "showZoom", 7, !0), a = Z(t, "showFitView", 7, !0), o = Z(t, "showLock", 7, !0), s = Z(t, "style", 7), c = Z(t, "class", 7), l = Z(t, "buttonBgColor", 7), u = Z(t, "buttonBgColorHover", 7), d = Z(t, "buttonColor", 7), f = Z(t, "buttonColorHover", 7), p = Z(t, "buttonBorderColor", 7), m = Z(t, "fitViewOptions", 7), h = Z(t, "children", 7), g = Z(t, "before", 7), _ = Z(t, "after", 7), v = /* @__PURE__ */ Sa(t, og), y = /* @__PURE__ */ I(zm), b = /* @__PURE__ */ I(() => ({
		bgColor: l(),
		bgColorHover: u(),
		color: d(),
		colorHover: f(),
		borderColor: p()
	})), x = /* @__PURE__ */ I(() => q(y).nodesDraggable || q(y).nodesConnectable || q(y).elementsSelectable), S = /* @__PURE__ */ I(() => q(y).viewport.zoom <= q(y).minZoom), C = /* @__PURE__ */ I(() => q(y).viewport.zoom >= q(y).maxZoom), w = /* @__PURE__ */ I(() => q(y).ariaLabelConfig), T = /* @__PURE__ */ I(() => r() === "horizontal" ? "horizontal" : "vertical"), E = () => {
		q(y).zoomIn();
	}, D = () => {
		q(y).zoomOut();
	}, ee = () => {
		q(y).fitView(m());
	}, te = () => {
		let e = !q(x);
		q(y).nodesDraggable = e, q(y).nodesConnectable = e, q(y).elementsSelectable = e;
	};
	var ne = {
		get position() {
			return n();
		},
		set position(e = "bottom-left") {
			n(e), R();
		},
		get orientation() {
			return r();
		},
		set orientation(e = "vertical") {
			r(e), R();
		},
		get showZoom() {
			return i();
		},
		set showZoom(e = !0) {
			i(e), R();
		},
		get showFitView() {
			return a();
		},
		set showFitView(e = !0) {
			a(e), R();
		},
		get showLock() {
			return o();
		},
		set showLock(e = !0) {
			o(e), R();
		},
		get style() {
			return s();
		},
		set style(e) {
			s(e), R();
		},
		get class() {
			return c();
		},
		set class(e) {
			c(e), R();
		},
		get buttonBgColor() {
			return l();
		},
		set buttonBgColor(e) {
			l(e), R();
		},
		get buttonBgColorHover() {
			return u();
		},
		set buttonBgColorHover(e) {
			u(e), R();
		},
		get buttonColor() {
			return d();
		},
		set buttonColor(e) {
			d(e), R();
		},
		get buttonColorHover() {
			return f();
		},
		set buttonColorHover(e) {
			f(e), R();
		},
		get buttonBorderColor() {
			return p();
		},
		set buttonBorderColor(e) {
			p(e), R();
		},
		get fitViewOptions() {
			return m();
		},
		set fitViewOptions(e) {
			m(e), R();
		},
		get children() {
			return h();
		},
		set children(e) {
			h(e), R();
		},
		get before() {
			return g();
		},
		set before(e) {
			g(e), R();
		},
		get after() {
			return _();
		},
		set after(e) {
			_(e), R();
		}
	};
	{
		let t = /* @__PURE__ */ I(() => [
			"svelte-flow__controls",
			q(T),
			c()
		]);
		Ih(e, wa({
			get class() {
				return q(t);
			},
			get position() {
				return n();
			},
			"data-testid": "svelte-flow__controls",
			get "aria-label"() {
				return q(w)["controls.ariaLabel"];
			},
			get style() {
				return s();
			}
		}, () => v, {
			children: (e, t) => {
				var n = cg(), r = H(n), s = (e) => {
					var t = Gr();
					fi(H(t), g), Y(e, t);
				};
				gi(r, (e) => {
					g() && e(s);
				});
				var c = U(r, 2), l = (e) => {
					var t = sg(), n = H(t);
					Yh(n, wa({
						onclick: E,
						class: "svelte-flow__controls-zoomin",
						get title() {
							return q(w)["controls.zoomIn.ariaLabel"];
						},
						get "aria-label"() {
							return q(w)["controls.zoomIn.ariaLabel"];
						},
						get disabled() {
							return q(C);
						}
					}, () => q(b), {
						children: (e, t) => {
							Zh(e, {});
						},
						$$slots: { default: !0 }
					})), Yh(U(n, 2), wa({
						onclick: D,
						class: "svelte-flow__controls-zoomout",
						get title() {
							return q(w)["controls.zoomOut.ariaLabel"];
						},
						get "aria-label"() {
							return q(w)["controls.zoomOut.ariaLabel"];
						},
						get disabled() {
							return q(S);
						}
					}, () => q(b), {
						children: (e, t) => {
							$h(e, {});
						},
						$$slots: { default: !0 }
					})), Y(e, t);
				};
				gi(c, (e) => {
					i() && e(l);
				});
				var u = U(c, 2), d = (e) => {
					Yh(e, wa({
						class: "svelte-flow__controls-fitview",
						onclick: ee,
						get title() {
							return q(w)["controls.fitView.ariaLabel"];
						},
						get "aria-label"() {
							return q(w)["controls.fitView.ariaLabel"];
						}
					}, () => q(b), {
						children: (e, t) => {
							tg(e, {});
						},
						$$slots: { default: !0 }
					}));
				};
				gi(u, (e) => {
					a() && e(d);
				});
				var f = U(u, 2), p = (e) => {
					Yh(e, wa({
						class: "svelte-flow__controls-interactive",
						onclick: te,
						get title() {
							return q(w)["controls.interactive.ariaLabel"];
						},
						get "aria-label"() {
							return q(w)["controls.interactive.ariaLabel"];
						}
					}, () => q(b), {
						children: (e, t) => {
							var n = Gr(), r = H(n), i = (e) => {
								ag(e, {});
							}, a = (e) => {
								rg(e, {});
							};
							gi(r, (e) => {
								q(x) ? e(i) : e(a, -1);
							}), Y(e, n);
						},
						$$slots: { default: !0 }
					}));
				};
				gi(f, (e) => {
					o() && e(p);
				});
				var m = U(f, 2), v = (e) => {
					var t = Gr();
					fi(H(t), h), Y(e, t);
				};
				gi(m, (e) => {
					h() && e(v);
				});
				var y = U(m, 2), T = (e) => {
					var t = Gr();
					fi(H(t), _), Y(e, t);
				};
				gi(y, (e) => {
					_() && e(T);
				}), Y(e, n);
			},
			$$slots: { default: !0 }
		}));
	}
	return F(ne);
}
Q(lg, {
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
var ug;
(function(e) {
	e.Lines = "lines", e.Dots = "dots", e.Cross = "cross";
})(ug ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/DotPattern.svelte
var dg = /* @__PURE__ */ Ur("<circle></circle>");
function fg(e, t) {
	P(t, !0);
	let n = Z(t, "radius", 7), r = Z(t, "class", 7);
	var i = {
		get radius() {
			return n();
		},
		set radius(e) {
			n(e), R();
		},
		get class() {
			return r();
		},
		set class(e) {
			r(e), R();
		}
	}, a = dg();
	return W(() => {
		X(a, "cx", n()), X(a, "cy", n()), X(a, "r", n()), zi(a, 0, Ni([
			"svelte-flow__background-pattern",
			"dots",
			r()
		]));
	}), Y(e, a), F(i);
}
Q(fg, {
	radius: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/LinePattern.svelte
var pg = /* @__PURE__ */ Ur("<path></path>");
function mg(e, t) {
	P(t, !0);
	let n = Z(t, "lineWidth", 7), r = Z(t, "dimensions", 7), i = Z(t, "variant", 7), a = Z(t, "class", 7);
	var o = {
		get lineWidth() {
			return n();
		},
		set lineWidth(e) {
			n(e), R();
		},
		get dimensions() {
			return r();
		},
		set dimensions(e) {
			r(e), R();
		},
		get variant() {
			return i();
		},
		set variant(e) {
			i(e), R();
		},
		get class() {
			return a();
		},
		set class(e) {
			a(e), R();
		}
	}, s = pg();
	return W(() => {
		X(s, "stroke-width", n()), X(s, "d", `M${r()[0] / 2} 0 V${r()[1]} M0 ${r()[1] / 2} H${r()[0]}`), zi(s, 0, Ni([
			"svelte-flow__background-pattern",
			i(),
			a()
		]));
	}), Y(e, s), F(o);
}
Q(mg, {
	lineWidth: {},
	dimensions: {},
	variant: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/Background.svelte
var hg = {
	[ug.Dots]: 1,
	[ug.Lines]: 1,
	[ug.Cross]: 6
}, gg = /* @__PURE__ */ Ur("<svg data-testid=\"svelte-flow__background\"><pattern patternUnits=\"userSpaceOnUse\"><!></pattern><rect x=\"0\" y=\"0\" width=\"100%\" height=\"100%\"></rect></svg>");
function _g(e, t) {
	P(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "variant", 23, () => ug.Dots), i = Z(t, "gap", 7, 20), a = Z(t, "size", 7), o = Z(t, "lineWidth", 7, 1), s = Z(t, "bgColor", 7), c = Z(t, "patternColor", 7), l = Z(t, "patternClass", 7), u = Z(t, "class", 7), d = /* @__PURE__ */ I(zm), f = /* @__PURE__ */ I(() => r() === ug.Dots), p = /* @__PURE__ */ I(() => r() === ug.Cross), m = /* @__PURE__ */ I(() => Array.isArray(i()) ? i() : [i(), i()]), h = /* @__PURE__ */ I(() => `background-pattern-${q(d).flowId}-${n() ?? ""}`), g = /* @__PURE__ */ I(() => [q(m)[0] * q(d).viewport.zoom || 1, q(m)[1] * q(d).viewport.zoom || 1]), _ = /* @__PURE__ */ I(() => (a() ?? hg[r()]) * q(d).viewport.zoom), v = /* @__PURE__ */ I(() => q(p) ? [q(_), q(_)] : q(g)), y = /* @__PURE__ */ I(() => q(f) ? [q(_) / 2, q(_) / 2] : [q(v)[0] / 2, q(v)[1] / 2]);
	var b = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), R();
		},
		get variant() {
			return r();
		},
		set variant(e = ug.Dots) {
			r(e), R();
		},
		get gap() {
			return i();
		},
		set gap(e = 20) {
			i(e), R();
		},
		get size() {
			return a();
		},
		set size(e) {
			a(e), R();
		},
		get lineWidth() {
			return o();
		},
		set lineWidth(e = 1) {
			o(e), R();
		},
		get bgColor() {
			return s();
		},
		set bgColor(e) {
			s(e), R();
		},
		get patternColor() {
			return c();
		},
		set patternColor(e) {
			c(e), R();
		},
		get patternClass() {
			return l();
		},
		set patternClass(e) {
			l(e), R();
		},
		get class() {
			return u();
		},
		set class(e) {
			u(e), R();
		}
	}, x = gg();
	let S;
	var C = V(x), w = V(C), T = (e) => {
		{
			let t = /* @__PURE__ */ I(() => q(_) / 2);
			fg(e, {
				get radius() {
					return q(t);
				},
				get class() {
					return l();
				}
			});
		}
	}, E = (e) => {
		mg(e, {
			get dimensions() {
				return q(v);
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
	gi(w, (e) => {
		q(f) ? e(T) : e(E, -1);
	}), M(C);
	var D = U(C);
	return M(x), W(() => {
		zi(x, 0, Ni([
			"svelte-flow__background",
			"svelte-flow__container",
			u()
		])), S = Vi(x, "", S, {
			"--xy-background-color-props": s(),
			"--xy-background-pattern-color-props": c()
		}), X(C, "id", q(h)), X(C, "x", q(d).viewport.x % q(g)[0]), X(C, "y", q(d).viewport.y % q(g)[1]), X(C, "width", q(g)[0]), X(C, "height", q(g)[1]), X(C, "patternTransform", `translate(-${q(y)[0]},-${q(y)[1]})`), X(D, "fill", `url(#${q(h)})`);
	}), Y(e, x), F(b);
}
Q(_g, {
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
function vg(e) {
	let t = /* @__PURE__ */ I(zm), n = /* @__PURE__ */ I(() => q(t).nodeLookup), r = /* @__PURE__ */ I(() => q(t).nodes), i = /* @__PURE__ */ I(() => (q(r), q(n).get(e)));
	return { get current() {
		return q(i);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/MinimapNode.svelte
var yg = /* @__PURE__ */ Ur("<rect></rect>");
function bg(e, t) {
	P(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "x", 7), i = Z(t, "y", 7), a = Z(t, "width", 7), o = Z(t, "height", 7), s = Z(t, "borderRadius", 7, 5), c = Z(t, "color", 7), l = Z(t, "shapeRendering", 7), u = Z(t, "strokeColor", 7), d = Z(t, "strokeWidth", 7, 2), f = Z(t, "selected", 7), p = Z(t, "class", 7), m = Z(t, "nodeComponent", 7), h = /* @__PURE__ */ I(() => vg(n())), g = /* @__PURE__ */ I(() => {
		if (!q(h).current) return {
			width: 0,
			height: 0,
			x: 0,
			y: 0
		};
		let { width: e, height: t } = cf(q(h).current);
		return {
			width: a() ?? e,
			height: o() ?? t,
			x: r() ?? q(h).current.internals.positionAbsolute.x,
			y: i() ?? q(h).current.internals.positionAbsolute.y
		};
	}), _ = /* @__PURE__ */ I(() => q(g).width), v = /* @__PURE__ */ I(() => q(g).height), y = /* @__PURE__ */ I(() => q(g).x), b = /* @__PURE__ */ I(() => q(g).y);
	var x = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), R();
		},
		get x() {
			return r();
		},
		set x(e) {
			r(e), R();
		},
		get y() {
			return i();
		},
		set y(e) {
			i(e), R();
		},
		get width() {
			return a();
		},
		set width(e) {
			a(e), R();
		},
		get height() {
			return o();
		},
		set height(e) {
			o(e), R();
		},
		get borderRadius() {
			return s();
		},
		set borderRadius(e = 5) {
			s(e), R();
		},
		get color() {
			return c();
		},
		set color(e) {
			c(e), R();
		},
		get shapeRendering() {
			return l();
		},
		set shapeRendering(e) {
			l(e), R();
		},
		get strokeColor() {
			return u();
		},
		set strokeColor(e) {
			u(e), R();
		},
		get strokeWidth() {
			return d();
		},
		set strokeWidth(e = 2) {
			d(e), R();
		},
		get selected() {
			return f();
		},
		set selected(e) {
			f(e), R();
		},
		get class() {
			return p();
		},
		set class(e) {
			p(e), R();
		},
		get nodeComponent() {
			return m();
		},
		set nodeComponent(e) {
			m(e), R();
		}
	}, S = Gr(), C = H(S), w = (e) => {
		let t = /* @__PURE__ */ I(m);
		var r = Gr();
		Di(H(r), () => q(t), (e, t) => {
			t(e, {
				get id() {
					return n();
				},
				get x() {
					return q(y);
				},
				get y() {
					return q(b);
				},
				get width() {
					return q(_);
				},
				get height() {
					return q(v);
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
		}), Y(e, r);
	}, T = (e) => {
		var t = yg();
		let n, r;
		W(() => {
			n = zi(t, 0, Ni(["svelte-flow__minimap-node", p()]), null, n, { selected: f() }), X(t, "x", q(y)), X(t, "y", q(b)), X(t, "rx", s()), X(t, "ry", s()), X(t, "width", q(_)), X(t, "height", q(v)), X(t, "shape-rendering", l()), r = Vi(t, "", r, {
				fill: c(),
				stroke: u(),
				"stroke-width": d()
			});
		}), Y(e, t);
	};
	return gi(C, (e) => {
		m() ? e(w) : e(T, -1);
	}), Y(e, S), F(x);
}
Q(bg, {
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
function xg(e, t) {
	let n = Dp({
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
var Sg = (e) => e instanceof Function ? e : () => e, Cg = /* @__PURE__ */ new Set([
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
]), wg = /* @__PURE__ */ Ur("<title> </title>"), Tg = /* @__PURE__ */ Ur("<svg class=\"svelte-flow__minimap-svg\" role=\"img\"><!><!><path class=\"svelte-flow__minimap-mask\" fill-rule=\"evenodd\" pointer-events=\"none\"></path></svg>"), Eg = /* @__PURE__ */ J("<svelte-css-wrapper style=\"display: contents\"><!></svelte-css-wrapper>", 1);
function Dg(e, t) {
	P(t, !0);
	let n = Z(t, "position", 7, "bottom-right"), r = Z(t, "ariaLabel", 7), i = Z(t, "nodeStrokeColor", 7, "transparent"), a = Z(t, "nodeColor", 7), o = Z(t, "nodeClass", 7, ""), s = Z(t, "nodeBorderRadius", 7, 5), c = Z(t, "nodeStrokeWidth", 7, 2), l = Z(t, "nodeComponent", 7), u = Z(t, "bgColor", 7), d = Z(t, "maskColor", 7), f = Z(t, "maskStrokeColor", 7), p = Z(t, "maskStrokeWidth", 7), m = Z(t, "width", 7, 200), h = Z(t, "height", 7, 150), g = Z(t, "pannable", 7, !0), _ = Z(t, "zoomable", 7, !0), v = Z(t, "inversePan", 7), y = Z(t, "zoomStep", 7), b = Z(t, "class", 7), x = /* @__PURE__ */ Sa(t, Cg), S = /* @__PURE__ */ I(zm), C = /* @__PURE__ */ I(() => q(S).ariaLabelConfig), w = typeof window > "u" || window.chrome ? "crispEdges" : "geometricPrecision", T = /* @__PURE__ */ I(() => `svelte-flow__minimap-desc-${q(S).flowId}`), E = /* @__PURE__ */ I(() => ({
		x: -q(S).viewport.x / q(S).viewport.zoom,
		y: -q(S).viewport.y / q(S).viewport.zoom,
		width: q(S).width / q(S).viewport.zoom,
		height: q(S).height / q(S).viewport.zoom
	})), D = /* @__PURE__ */ I(() => q(S).nodes.some((e) => !e.hidden)), ee = /* @__PURE__ */ I(() => q(D) ? Kd(kd(q(S).nodeLookup, { filter: (e) => !e.hidden }), q(E)) : q(E)), te = /* @__PURE__ */ I(() => q(ee).width / m()), ne = /* @__PURE__ */ I(() => q(ee).height / h()), re = /* @__PURE__ */ I(() => Math.max(q(te), q(ne))), ie = /* @__PURE__ */ I(() => q(re) * m()), ae = /* @__PURE__ */ I(() => q(re) * h()), O = /* @__PURE__ */ I(() => 5 * q(re)), k = /* @__PURE__ */ I(() => q(ee).x - (q(ie) - q(ee).width) / 2 - q(O)), oe = /* @__PURE__ */ I(() => q(ee).y - (q(ae) - q(ee).height) / 2 - q(O)), se = /* @__PURE__ */ I(() => q(ie) + q(O) * 2), ce = /* @__PURE__ */ I(() => q(ae) + q(O) * 2), le = () => q(re);
	var ue = {
		get position() {
			return n();
		},
		set position(e = "bottom-right") {
			n(e), R();
		},
		get ariaLabel() {
			return r();
		},
		set ariaLabel(e) {
			r(e), R();
		},
		get nodeStrokeColor() {
			return i();
		},
		set nodeStrokeColor(e = "transparent") {
			i(e), R();
		},
		get nodeColor() {
			return a();
		},
		set nodeColor(e) {
			a(e), R();
		},
		get nodeClass() {
			return o();
		},
		set nodeClass(e = "") {
			o(e), R();
		},
		get nodeBorderRadius() {
			return s();
		},
		set nodeBorderRadius(e = 5) {
			s(e), R();
		},
		get nodeStrokeWidth() {
			return c();
		},
		set nodeStrokeWidth(e = 2) {
			c(e), R();
		},
		get nodeComponent() {
			return l();
		},
		set nodeComponent(e) {
			l(e), R();
		},
		get bgColor() {
			return u();
		},
		set bgColor(e) {
			u(e), R();
		},
		get maskColor() {
			return d();
		},
		set maskColor(e) {
			d(e), R();
		},
		get maskStrokeColor() {
			return f();
		},
		set maskStrokeColor(e) {
			f(e), R();
		},
		get maskStrokeWidth() {
			return p();
		},
		set maskStrokeWidth(e) {
			p(e), R();
		},
		get width() {
			return m();
		},
		set width(e = 200) {
			m(e), R();
		},
		get height() {
			return h();
		},
		set height(e = 150) {
			h(e), R();
		},
		get pannable() {
			return g();
		},
		set pannable(e = !0) {
			g(e), R();
		},
		get zoomable() {
			return _();
		},
		set zoomable(e = !0) {
			_(e), R();
		},
		get inversePan() {
			return v();
		},
		set inversePan(e) {
			v(e), R();
		},
		get zoomStep() {
			return y();
		},
		set zoomStep(e) {
			y(e), R();
		},
		get class() {
			return b();
		},
		set class(e) {
			b(e), R();
		}
	}, de = Eg(), fe = H(de);
	{
		let e = /* @__PURE__ */ I(() => ["svelte-flow__minimap", b()]);
		_i(fe, () => ({ "--xy-minimap-background-color-props": u() })), Ih(fe.lastChild, wa({
			get position() {
				return n();
			},
			get class() {
				return q(e);
			},
			"data-testid": "svelte-flow__minimap"
		}, () => x, {
			children: (e, t) => {
				var n = Gr(), u = H(n), b = (e) => {
					var t = Tg();
					let n;
					var u = V(t), b = (e) => {
						var t = wg(), n = gn(t, !0);
						W(() => {
							X(t, "id", q(T)), ii(n, r() ?? q(C)["minimap.ariaLabel"]);
						}), Y(e, t);
					};
					gi(u, (e) => {
						(r() ?? q(C)["minimap.ariaLabel"]) && e(b);
					});
					var x = U(u);
					xi(x, 17, () => q(S).nodes, (e) => e.id, (e, t) => {
						let n = /* @__PURE__ */ I(() => q(S).nodeLookup.get(q(t).id));
						var r = Gr(), u = H(r), d = (e) => {
							{
								let r = /* @__PURE__ */ I(() => a() === void 0 ? void 0 : Sg(a())(q(t))), u = /* @__PURE__ */ I(() => Sg(i())(q(t))), d = /* @__PURE__ */ I(() => Sg(o())(q(t)));
								bg(e, {
									get id() {
										return q(n).id;
									},
									get selected() {
										return q(n).selected;
									},
									get nodeComponent() {
										return l();
									},
									get color() {
										return q(r);
									},
									get borderRadius() {
										return s();
									},
									get strokeColor() {
										return q(u);
									},
									get strokeWidth() {
										return c();
									},
									get shapeRendering() {
										return w;
									},
									get class() {
										return q(d);
									}
								});
							}
						}, f = /* @__PURE__ */ I(() => q(n) && lf(q(n)) && !q(n).hidden);
						gi(u, (e) => {
							q(f) && e(d);
						}), Y(e, r);
					});
					var D = U(x);
					M(t), ki(t, (e, t) => xg?.(e, t), () => ({
						store: q(S),
						panZoom: q(S).panZoom,
						getViewScale: le,
						translateExtent: q(S).translateExtent,
						width: q(S).width,
						height: q(S).height,
						inversePan: v(),
						zoomStep: y(),
						pannable: g(),
						zoomable: _()
					})), W(() => {
						X(t, "width", m()), X(t, "height", h()), X(t, "viewBox", `${q(k) ?? ""} ${q(oe) ?? ""} ${q(se) ?? ""} ${q(ce) ?? ""}`), X(t, "aria-labelledby", q(T)), n = Vi(t, "", n, {
							"--xy-minimap-mask-background-color-props": d(),
							"--xy-minimap-mask-stroke-color-props": f(),
							"--xy-minimap-mask-stroke-width-props": p() ? p() * q(re) : void 0
						}), X(D, "d", `M${q(k) - q(O)},${q(oe) - q(O)}h${q(se) + q(O) * 2}v${q(ce) + q(O) * 2}h${-q(se) - q(O) * 2}z
      M${q(E).x ?? ""},${q(E).y ?? ""}h${q(E).width ?? ""}v${q(E).height ?? ""}h${-q(E).width}z`);
					}), Y(e, t);
				};
				gi(u, (e) => {
					q(S).panZoom && e(b);
				}), Y(e, n);
			},
			$$slots: { default: !0 }
		})), M(fe);
	}
	return Y(e, de), F(ue);
}
Q(Dg, {
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
//#region src/convert.ts
var Og = 4, kg = 220, Ag = 120;
function jg(e) {
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
function Mg(e) {
	return {
		x: e % Og * kg,
		y: Math.floor(e / Og) * Ag
	};
}
function Ng(e) {
	return e.map((e, t) => ({
		id: e.id,
		type: "default",
		position: jg(e.attrs) ?? Mg(t),
		data: {
			label: e.label ?? e.id,
			nodeType: e.node_type,
			attrs: e.attrs
		}
	}));
}
function Pg(e) {
	return e.map((e, t) => ({
		id: `${e.from}->${e.to}#${t}`,
		source: e.from,
		target: e.to,
		label: e.label ?? void 0,
		data: {
			condition: e.condition,
			priority: e.priority,
			loopRestart: e.loop_restart,
			attrs: e.attrs
		}
	}));
}
function Fg(e, t, n, r) {
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
//#region src/WorkflowCanvasInner.svelte
var Ig = /* @__PURE__ */ J("<option> </option>"), Lg = /* @__PURE__ */ J("<div class=\"create-workflow-fields\" style=\"display: flex; gap: 0.75rem; align-items: flex-end; padding-bottom: 0.5rem;\"><label style=\"display: flex; flex-direction: column; font-size: 0.85rem;\">Name <input type=\"text\" data-testid=\"create-name-input\" placeholder=\"my-pipeline\"/></label> <label style=\"display: flex; flex-direction: column; font-size: 0.85rem;\">Directory <select data-testid=\"create-target-dir-select\"></select></label></div>"), Rg = /* @__PURE__ */ J("<!> <!> <!>", 1), zg = /* @__PURE__ */ J("<p role=\"alert\" data-testid=\"save-error\"> </p>"), Bg = /* @__PURE__ */ J("<div class=\"workflow-canvas-root\" style=\"width: 100%; height: 100%; min-height: 480px; display: flex; flex-direction: column;\"><!> <div class=\"canvas-area\" style=\"flex: 1; position: relative;\"><!></div> <button type=\"button\" data-testid=\"save-button\"> </button> <!></div>");
function Vg(e, t) {
	P(t, !0);
	let n = Z(t, "graph", 7, void 0), r = Z(t, "workflowId", 7, void 0), i = Z(t, "availableTargetDirs", 23, () => []), a = Z(t, "onSave", 7), o = /* @__PURE__ */ I(() => !r()), s = /* @__PURE__ */ z(""), c = /* @__PURE__ */ z("");
	On(() => {
		!q(c) && i().length > 0 && B(c, i()[0], !0);
	});
	let l = /* @__PURE__ */ z([]), u = /* @__PURE__ */ z([]), d = /* @__PURE__ */ z(null), f = /* @__PURE__ */ z(an({}));
	On(() => {
		n() && (B(l, Ng(n().nodes)), B(u, Pg(n().edges)), B(d, n().name, !0), B(f, n().graph_attrs, !0));
	});
	function p() {
		return Fg(q(d), q(f), q(l), q(u));
	}
	let m = /* @__PURE__ */ z(!1), h = /* @__PURE__ */ z(null);
	async function g() {
		B(h, null);
		let e;
		if (q(o)) {
			let t = q(s).trim();
			if (!t) {
				B(h, "workflow name must not be blank");
				return;
			}
			if (!q(c)) {
				B(h, "choose a target directory");
				return;
			}
			e = {
				name: t,
				targetDir: q(c)
			};
		}
		B(m, !0);
		try {
			await a()(p(), e);
		} catch (e) {
			B(h, e instanceof Error ? e.message : String(e), !0);
		} finally {
			B(m, !1);
		}
	}
	let _ = /* @__PURE__ */ I(() => q(m) || q(o) && !q(s).trim());
	var v = {
		currentGraph: p,
		get graph() {
			return n();
		},
		set graph(e = void 0) {
			n(e), R();
		},
		get workflowId() {
			return r();
		},
		set workflowId(e = void 0) {
			r(e), R();
		},
		get availableTargetDirs() {
			return i();
		},
		set availableTargetDirs(e = []) {
			i(e), R();
		},
		get onSave() {
			return a();
		},
		set onSave(e) {
			a(e), R();
		}
	}, y = Bg(), b = V(y), x = (e) => {
		var t = Lg(), n = V(t), r = U(V(n));
		ia(r), M(n);
		var a = U(n, 2), o = U(V(a));
		xi(o, 20, i, (e) => e, (e, t) => {
			var n = Ig(), r = gn(n, !0), i = {};
			W(() => {
				ii(r, t), i !== (i = t) && (n.value = (n.__value = i) ?? "");
			}), Y(e, n);
		}), M(o), Ki(o), M(a), M(t), ua(r, () => q(s), (e) => B(s, e)), qi(o, () => q(c), (e) => B(c, e)), Y(e, t);
	};
	gi(b, (e) => {
		q(o) && e(x);
	});
	var S = U(b, 2);
	Kh(V(S), {
		fitView: !0,
		get nodes() {
			return q(l);
		},
		set nodes(e) {
			B(l, e);
		},
		get edges() {
			return q(u);
		},
		set edges(e) {
			B(u, e);
		},
		children: (e, t) => {
			var n = Rg(), r = H(n);
			_g(r, {});
			var i = U(r, 2);
			lg(i, {}), Dg(U(i, 2), {}), Y(e, n);
		},
		$$slots: { default: !0 }
	}), M(S);
	var C = U(S, 2), w = gn(C, !0), T = U(C, 2), E = (e) => {
		var t = zg(), n = gn(t, !0);
		W(() => ii(n, q(h))), Y(e, t);
	};
	return gi(T, (e) => {
		q(h) && e(E);
	}), M(y), W(() => {
		C.disabled = q(_), ii(w, q(m) ? "Saving…" : "Save");
	}), Nr("click", C, g), Y(e, y), F(v);
}
Pr(["click"]), Q(Vg, {
	graph: {},
	workflowId: {},
	availableTargetDirs: {},
	onSave: {}
}, [], ["currentGraph"], { mode: "open" });
//#endregion
//#region src/api.ts
async function Hg(e) {
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
function Ug(e, t) {
	return fetch(`/api/workflows/${encodeURIComponent(e)}/graph`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t)
	}).then((e) => Hg(e));
}
function Wg(e, t, n) {
	return fetch("/api/workflows/new", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: n,
			target_dir: t,
			graph: e
		})
	}).then((e) => Hg(e));
}
//#endregion
//#region src/WorkflowCanvas.svelte
function Gg(e, t) {
	P(t, !0);
	let n = Z(t, "graph", 15, void 0), r = Z(t, "workflowId", 7, void 0), i = Z(t, "availableTargetDirs", 7, void 0), a = /* @__PURE__ */ z(void 0);
	async function o(e, n) {
		if (n) {
			let r = await Wg(e, n.targetDir, n.name);
			t.$$host.dispatchEvent(new CustomEvent("workflow-saved", {
				detail: r,
				bubbles: !0,
				composed: !0
			})), window.location.href = `/workflows/${encodeURIComponent(r.id)}/edit`;
			return;
		}
		if (!r()) throw Error("no workflowId set; cannot save");
		let i = await Ug(r(), e);
		t.$$host.dispatchEvent(new CustomEvent("workflow-saved", {
			detail: i,
			bubbles: !0,
			composed: !0
		}));
	}
	return On(() => {
		Object.assign(t.$$host, { getGraph: () => q(a)?.currentGraph() });
	}), ga(Vg(e, {
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
	}), (e) => B(a, e, !0), () => q(a)), F({
		get graph() {
			return n();
		},
		set graph(e = void 0) {
			n(e), R();
		},
		get workflowId() {
			return r();
		},
		set workflowId(e = void 0) {
			r(e), R();
		},
		get availableTargetDirs() {
			return i();
		},
		set availableTargetDirs(e = void 0) {
			i(e), R();
		}
	});
}
customElements.define("workflow-canvas", Q(Gg, {
	graph: {},
	workflowId: {},
	availableTargetDirs: {}
}, [], []));
//#endregion
export { Gg as default };
