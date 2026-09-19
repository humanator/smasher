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
var C = 1 << 24, w = 1024, T = 2048, E = 4096, D = 8192, ee = 16384, te = 32768, ne = 1 << 25, re = 65536, ie = 1 << 19, ae = 1 << 20, O = 1 << 25, k = 1 << 21, oe = 1 << 22, se = 1 << 23, A = Symbol("$state"), ce = Symbol("component"), le = Symbol("legacy props"), ue = Symbol(""), de = Symbol("attributes"), fe = Symbol("class"), pe = Symbol("style"), me = Symbol("text"), he = Symbol("form reset"), ge = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), _e = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml");
function ve() {
	console.warn("https://svelte.dev/e/derived_inert");
}
function ye(e) {
	console.warn("https://svelte.dev/e/hydration_mismatch");
}
function be() {
	console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function xe() {
	console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/hydration.js
var j = !1;
function Se(e) {
	j = e;
}
var M;
function Ce(t) {
	if (t === null) throw ye(), e;
	return M = t;
}
function we() {
	return Ce(/* @__PURE__ */ pn(M));
}
function N(t) {
	if (j) {
		if (/* @__PURE__ */ pn(M) !== null) throw ye(), e;
		M = t;
	}
}
function Te(e = 1) {
	if (j) {
		for (var t = e, n = M; t--;) n = /* @__PURE__ */ pn(n);
		M = n;
	}
}
function Ee(e = !0) {
	for (var t = 0, n = M;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ pn(n);
		e && n.remove(), n = i;
	}
}
function De(t) {
	if (!t || t.nodeType !== 8) throw ye(), e;
	return t.data;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/equality.js
function Oe(e) {
	return e === this.v;
}
function ke(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function Ae(e) {
	return !ke(e, this.v);
}
function je(e) {
	throw Error("https://svelte.dev/e/lifecycle_outside_component");
}
//#endregion
//#region node_modules/svelte/src/internal/client/errors.js
function Me() {
	throw Error("https://svelte.dev/e/async_derived_orphan");
}
function Ne(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_duplicate");
}
function Pe(e) {
	throw Error("https://svelte.dev/e/effect_in_teardown");
}
function Fe() {
	throw Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Ie(e) {
	throw Error("https://svelte.dev/e/effect_orphan");
}
function Le() {
	throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Re() {
	throw Error("https://svelte.dev/e/hydration_failed");
}
function ze(e) {
	throw Error("https://svelte.dev/e/props_invalid_value");
}
function Be() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Ve() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function He() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Ue() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
//#endregion
//#region node_modules/svelte/src/internal/flags/index.js
var We = !1;
function Ge() {
	We = !0;
}
//#endregion
//#region node_modules/svelte/src/internal/shared/clone.js
var Ke = [];
function qe(e, t = !1, n = !1) {
	return Je(e, /* @__PURE__ */ new Map(), "", Ke, null, n);
}
function Je(e, t, n, i, a = null, o = !1) {
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
				l in e && (c[l] = Je(u, t, n, i, null, o));
			}
			return c;
		}
		if (p(e) === d) {
			c = {}, t.set(e, c), a !== null && t.set(a, c);
			for (var f of Object.keys(e)) c[f] = Je(e[f], t, n, i, null, o);
			return c;
		}
		if (e instanceof Date) return e.getTime(), structuredClone(e);
		if (typeof e.toJSON == "function" && !o) return Je(e.toJSON(), t, n, i, e);
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
function Ye(e) {
	let t = e.p;
	for (; t !== null && t.c === null;) t = t.p;
	return t?.c ?? null;
}
function Xe(e, t) {
	return e === null && je(t), e.c ??= new Map(Ye(e) || void 0);
}
//#endregion
//#region node_modules/svelte/src/internal/client/context.js
var P = null;
function Ze(e) {
	P = e;
}
function Qe(e) {
	return Xe(P, "getContext").get(e);
}
function $e(e, t) {
	return Xe(P, "setContext").set(e, t), t;
}
function et(e) {
	return Xe(P, "hasContext").has(e);
}
function F(e, t = !1, n) {
	P = {
		p: P,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: K,
		l: We && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	};
}
function I(e) {
	var t = P, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) On(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, P = t.p, tt(e);
}
function tt(e = {}) {
	return c(e, ce, { value: !0 }), e;
}
function nt() {
	return !We || P !== null && P.l === null;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/task.js
var rt = [];
function it() {
	var e = rt;
	rt = [], v(e);
}
function at(e) {
	if (rt.length === 0 && !Mt) {
		var t = rt;
		queueMicrotask(() => {
			t === rt && it();
		});
	}
	rt.push(e);
}
function ot() {
	for (; rt.length > 0;) it();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/status.js
var st = ~(T | E | w);
function ct(e, t) {
	e.f = e.f & st | t;
}
function lt(e) {
	e.f & 512 || e.deps === null ? ct(e, w) : ct(e, E);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/utils.js
function ut(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), ct(e, w);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/misc.js
function dt(e, t) {
	if (t) {
		let t = document.body;
		e.autofocus = !0, at(() => {
			document.activeElement === t && e.focus();
		});
	}
}
var ft = !1;
function pt() {
	ft || (ft = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[he]?.();
		});
	}, { capture: !0 }));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function mt(e) {
	var t = G, n = K;
	er(null), tr(null);
	try {
		return e();
	} finally {
		er(t), tr(n);
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/async.js
function ht(e, t, n, r) {
	let i = nt() ? yt : St;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = K, c = gt(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				xn(e, s);
			}
			_t();
		}
	}
	var d = vt();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ xt(e))).then(u).catch((e) => xn(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), _t();
	}) : f();
}
function gt() {
	var e = K, t = G, n = P, r = R;
	return function(i = !0) {
		tr(e), er(t), Ze(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function _t(e = !0) {
	tr(null), er(null), Ze(null), e && R?.deactivate();
}
function vt() {
	var e = K, t = e.b, n = R, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function yt(e) {
	var n = 2 | T;
	return K !== null && (K.f |= ie), {
		ctx: P,
		deps: null,
		effects: null,
		equals: Oe,
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
var bt = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function xt(e, n, r) {
	let i = K;
	i === null && Me();
	var a = void 0, o = Jt(t), s = !G, c = /* @__PURE__ */ new Set();
	return Nn(() => {
		var t = K, n = y();
		a = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== ge && n.reject(e);
			}).finally(_t);
		} catch (e) {
			n.reject(e), _t();
		}
		var r = R;
		if (s) {
			if (t.f & 32768) var l = vt();
			if (i.b?.is_rendered()) r.async_deriveds.get(t)?.reject(bt);
			else for (let e of c.values()) e.reject(bt);
			c.add(n), r.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), c.delete(n), t !== bt && (r.activate(), t ? (o.f |= se, Qt(o, t)) : (o.f & 8388608 && (o.f ^= se), Qt(o, e)), r.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), En(() => {
		for (let e of c) e.reject(bt);
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
function L(e) {
	let t = /* @__PURE__ */ yt(e);
	return rr(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function St(e) {
	let t = /* @__PURE__ */ yt(e);
	return t.equals = Ae, t;
}
function Ct(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) Vn(t[n]);
	}
}
function wt(e) {
	var n, r = K, i = e.parent;
	if (!Zn && i !== null && e.v !== t && i.f & 24576) return ve(), e.v;
	tr(i);
	try {
		Ct(e), n = hr(e);
	} finally {
		tr(r);
	}
	return n;
}
function Tt(e) {
	var t = wt(e);
	if (!e.equals(t) && (e.wv = fr(), (!R?.is_fork || e.deps === null) && (R === null ? e.v = t : (R.capture(e, t, !0), kt?.capture(e, t, !0)), e.deps === null))) {
		ct(e, w);
		return;
	}
	Zn || (At === null ? lt(e) : (Tn() || R?.is_fork) && At.set(e, t));
}
function Et(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && mt(() => {
		t.ac.abort(ge), t.ac = null;
	}), t.fn !== null && (t.teardown = g), vr(t, 0), zn(t));
}
function Dt(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && yr(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/batch.js
var Ot = null, R = null, kt = null, At = null, jt = null, Mt = !1, Nt = !1, Pt = null, Ft = null, It = 0, Lt = 1, Rt = class e {
	id = Lt++;
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
		Ot === null ? Ot = this : (Ot.#n = this, this.#t = Ot), Ot = this;
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
			for (var r of n.d) ct(r, T), t(r);
			for (r of n.m) ct(r, E), t(r);
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
		for (let e of this.#u) this.#d.delete(e), ct(e, T), this.schedule(e);
		for (let e of this.#d) ct(e, E), this.schedule(e);
		this.apply();
		for (var t = Pt = [], n = [], r = Ft = []; this.#c.length > 0;) {
			It++ > 1e3 && (this.#S(), zt());
			for (let e of this.#g()) try {
				this.#v(e, t, n);
			} catch (t) {
				throw Wt(e), this.#h() || this.discard(), t;
			}
		}
		if (R = null, r.length > 0) {
			var i = e.ensure();
			for (let e of r) i.schedule(e);
		}
		if (Pt = null, Ft = null, this.#h()) {
			this.#x(n), this.#x(t);
			for (let [e, t] of this.#f) Ut(e, t);
			r.length > 0 && R.#_();
			return;
		}
		let a = this.#y();
		if (a) {
			this.#x(n), this.#x(t), a.#b(this);
			return;
		}
		this.#u.clear(), this.#d.clear();
		for (let e of this.#r) e(this);
		this.#r.clear(), kt = this, Vt(n), Vt(t), kt = null, this.#s?.resolve();
		var o = R;
		if (this.#a === 0 && (this.#c.length === 0 || o !== null) && this.#S(), this.#c.length > 0) {
			if (o !== null) {
				for (let e of this.#c) o.#c.push(e);
				this.#c = [];
			} else o = this;
		}
		o !== null && (Kt.clear(), o.#_());
	}
	#v(e, t, n) {
		e.f ^= w;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = !!(i & 96);
			if (!(a && i & 1024 || i & 8192 || this.#f.has(r)) && r.fn !== null) {
				a ? r.f ^= w : i & 4 ? t.push(r) : pr(r) && (i & 16 && this.#d.add(r), yr(r));
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
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), ct(i, T), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#S(), R = this, this.#_();
	}
	#x(e) {
		for (var t = 0; t < e.length; t += 1) ut(e[t], this.#u, this.#d);
	}
	capture(e, n, r = !1) {
		e.v !== t && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [n, r]), At?.set(e, n)), this.is_fork || (e.v = n);
	}
	activate() {
		R = this;
	}
	deactivate() {
		R = null, At = null;
	}
	flush() {
		try {
			Nt = !0, R = this, this.#_();
		} finally {
			It = 0, jt = null, Pt = null, Ft = null, Nt = !1, R = null, At = null, Kt.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(bt);
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
		this.#m || (this.#m = !0, at(() => {
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
		if (R === null) {
			let t = R = new e();
			!Nt && !Mt && at(() => {
				t.#e || t.flush();
			});
		}
		return R;
	}
	apply() {
		At = null;
	}
	schedule(e) {
		if (jt = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) {
			e.b.defer_effect(e);
			return;
		}
		this.#c.push(e);
	}
	#S() {
		if (this.linked) {
			var e = this.#t, t = this.#n;
			e === null || (e.#n = t), t === null ? Ot = e : t.#t = e, this.linked = !1;
		}
	}
};
function z(e) {
	var t = Mt;
	Mt = !0;
	try {
		var n;
		for (e && (R !== null && !R.is_fork && R.flush(), n = e());;) {
			if (ot(), R === null) return n;
			R.flush();
		}
	} finally {
		Mt = t;
	}
}
function zt() {
	try {
		Le();
	} catch (e) {
		xn(e, jt);
	}
}
var Bt = null;
function Vt(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && pr(r) && (Bt = /* @__PURE__ */ new Set(), yr(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Un(r), Bt?.size > 0)) {
				Kt.clear();
				for (let e of Bt) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) Bt.has(n) && (Bt.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || yr(n);
					}
				}
				Bt.clear();
			}
		}
		Bt = null;
	}
}
function Ht(e) {
	R.schedule(e);
}
function Ut(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), ct(e, w);
		for (var n = e.first; n !== null;) Ut(n, t), n = n.next;
	}
}
function Wt(e) {
	ct(e, w);
	for (var t = e.first; t !== null;) Wt(t), t = t.next;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/sources.js
var Gt = /* @__PURE__ */ new Set(), Kt = /* @__PURE__ */ new Map(), qt = !1;
function Jt(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: Oe,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function B(e, t) {
	let n = Jt(e, t);
	return rr(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function Yt(e, t = !1, n = !0) {
	let r = Jt(e);
	return t || (r.equals = Ae), We && n && P !== null && P.l !== null && (P.l.s ??= []).push(r), r;
}
function V(e, t, n = !1) {
	return G !== null && (!$n || G.f & 131072) && nt() && G.f & 4325394 && (nr === null || !nr.has(e)) && He(), Qt(e, n ? nn(t) : t, Ft);
}
var Xt = null, Zt = 0;
function Qt(e, t, n = null) {
	if (!e.equals(t)) {
		Zn ? Kt.set(e, t) : Kt.has(e) || Kt.set(e, e.v);
		var r = Rt.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && wt(t), At === null && lt(t);
		}
		e.wv = fr(), Xt = null, Zt = 0, tn(e, T, n), Xt = null, nt() && K !== null && K.f & 1024 && !(K.f & 96) && (or === null ? sr([e]) : or.push(e)), !r.is_fork && Gt.size > 0 && !qt && $t();
	}
	return t;
}
function $t() {
	qt = !1;
	for (let e of Gt) {
		e.f & 1024 && ct(e, E);
		let t;
		try {
			t = pr(e);
		} catch {
			t = !0;
		}
		t && yr(e);
	}
	Gt.clear();
}
function en(e) {
	V(e, e.v + 1);
}
function tn(e, t, n) {
	var r = e.reactions;
	if (r !== null) {
		var i = nt(), a = r.length;
		if (Zt += a, Zt > 1e5 && Xt === null && (Xt = /* @__PURE__ */ new Set()), Xt !== null) {
			if (Xt.has(e)) return;
			Xt.add(e);
		}
		for (var o = 0; o < a; o++) {
			var s = r[o], c = s.f;
			if (i || s !== K) {
				var l = (c & T) === 0;
				if (l && ct(s, t), c & 131072) Gt.add(s);
				else if (c & 2) {
					var u = s;
					At?.delete(u), tn(u, E, n);
				} else if (l) {
					var d = s;
					c & 16 && Bt !== null && Bt.add(d), n === null ? Ht(d) : n.push(d);
				}
			}
		}
	}
}
function nn(e) {
	if (typeof e != "object" || !e || A in e || ce in e) return e;
	let n = p(e);
	if (n !== d && n !== f) return e;
	var i = /* @__PURE__ */ new Map(), a = r(e), o = /* @__PURE__ */ B(0), s = null, c = ur, u = (e) => {
		if (ur === c) return e();
		var t = G, n = ur;
		er(null), dr(c);
		var r = e();
		return er(t), dr(n), r;
	};
	return a && i.set("length", /* @__PURE__ */ B(e.length, s)), new Proxy(e, {
		defineProperty(e, t, n) {
			(!("value" in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) && Be();
			var r = i.get(t);
			return r === void 0 ? u(() => {
				var e = /* @__PURE__ */ B(n.value, s);
				return i.set(t, e), e;
			}) : V(r, n.value, !0), !0;
		},
		deleteProperty(e, n) {
			var r = i.get(n);
			if (r === void 0) {
				if (n in e) {
					let e = u(() => /* @__PURE__ */ B(t, s));
					i.set(n, e), en(o);
				}
			} else V(r, t), en(o);
			return !0;
		},
		get(n, r, a) {
			if (r === A) return e;
			var o = i.get(r), c = r in n;
			if (o === void 0 && (!c || l(n, r)?.writable) && (o = u(() => /* @__PURE__ */ B(nn(c ? n[r] : t), s)), i.set(r, o)), o !== void 0) {
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
			if (n === A) return !0;
			var r = i.get(n), a = r !== void 0 && r.v !== t || Reflect.has(e, n);
			return (r !== void 0 || K !== null && (!a || l(e, n)?.writable)) && (r === void 0 && (r = u(() => /* @__PURE__ */ B(a ? nn(e[n]) : t, s)), i.set(n, r)), q(r) === t) ? !1 : a;
		},
		set(e, n, r, c) {
			var d = i.get(n), f = n in e;
			if (a && n === "length") for (var p = r; p < d.v; p += 1) {
				var m = i.get(p + "");
				m === void 0 ? p in e && (m = u(() => /* @__PURE__ */ B(t, s)), i.set(p + "", m)) : V(m, t);
			}
			if (d === void 0) (!f || l(e, n)?.writable) && (d = u(() => /* @__PURE__ */ B(void 0, s)), V(d, nn(r)), i.set(n, d));
			else {
				f = d.v !== t;
				var h = u(() => nn(r));
				V(d, h);
			}
			var g = Reflect.getOwnPropertyDescriptor(e, n);
			if (g?.set && g.set.call(c, r), !f) {
				if (a && typeof n == "string") {
					var _ = i.get("length"), v = Number(n);
					Number.isInteger(v) && v >= _.v && V(_, v + 1);
				}
				en(o);
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
			Ve();
		}
	});
}
function rn(e) {
	try {
		if (typeof e == "object" && e && A in e) return e[A];
	} catch {}
	return e;
}
function an(e, t) {
	return Object.is(rn(e), rn(t));
}
var on, sn, cn, ln;
function un() {
	if (on === void 0) {
		on = window, sn = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		cn = l(t, "firstChild").get, ln = l(t, "nextSibling").get, m(e) && (e[fe] = void 0, e[de] = null, e[pe] = void 0, e.__e = void 0), m(n) && (n[me] = void 0);
	}
}
function dn(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function fn(e) {
	return cn.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function pn(e) {
	return ln.call(e);
}
function mn(e, t) {
	if (!j) return /* @__PURE__ */ fn(e);
	var n = /* @__PURE__ */ fn(M);
	if (n === null) n = M.appendChild(dn());
	else if (t && n.nodeType !== 3) {
		var r = dn();
		return n?.before(r), Ce(r), r;
	}
	return t && yn(n), Ce(n), n;
}
function H(e, t = !1) {
	if (!j) {
		var n = /* @__PURE__ */ fn(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ pn(n) : n;
	}
	if (t) {
		if (M?.nodeType !== 3) {
			var r = dn();
			return M?.before(r), Ce(r), r;
		}
		yn(M);
	}
	return M;
}
function hn(e, t = !1) {
	if (!j) return /* @__PURE__ */ fn(e);
	var n = mn(e, t);
	return N(e), n;
}
function U(e, t = 1, n = !1) {
	let r = j ? M : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ pn(r);
	if (!j) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = dn();
			return r === null ? i?.after(a) : r.before(a), Ce(a), a;
		}
		yn(r);
	}
	return Ce(r), r;
}
function gn(e) {
	e.textContent = "";
}
function _n() {
	return !1;
}
function vn(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function yn(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
function bn(e) {
	var t = K;
	if (t === null) return G.f |= se, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	xn(e, t);
}
function xn(e, t) {
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
function Sn(e) {
	K === null && (G === null && Ie(e), Fe()), Zn && Pe(e);
}
function Cn(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function wn(e, t) {
	var n = K;
	n !== null && n.f & 8192 && (e |= D);
	var r = {
		ctx: P,
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
	R?.register_created_effect(r);
	var i = r;
	if (e & 4) Pt === null ? Rt.ensure().schedule(r) : Pt.push(r);
	else if (t !== null) {
		try {
			yr(r);
		} catch (e) {
			throw Vn(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= re));
	}
	if (i !== null && (i.parent = n, n !== null && Cn(i, n), G !== null && G.f & 2 && !(e & 64))) {
		var a = G;
		(a.effects ??= []).push(i);
	}
	return r;
}
function Tn() {
	return G !== null && !$n;
}
function En(e) {
	let t = wn(8, null);
	return ct(t, w), t.teardown = e, t;
}
function Dn(e) {
	Sn("$effect");
	var t = K.f;
	if (!G && t & 32 && P !== null && !P.i) {
		var n = P;
		(n.e ??= []).push(e);
	} else return On(e);
}
function On(e) {
	return wn(4 | ae, e);
}
function kn(e) {
	return Sn("$effect.pre"), wn(8 | ae, e);
}
function An(e) {
	Rt.ensure();
	let t = wn(64 | ie, e);
	return () => {
		Vn(t);
	};
}
function jn(e) {
	Rt.ensure();
	let t = wn(64 | ie, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? Wn(t, () => {
			Vn(t), n(void 0);
		}) : (Vn(t), n(void 0));
	});
}
function Mn(e) {
	return wn(4, e);
}
function Nn(e) {
	return wn(oe | ie, e);
}
function Pn(e, t = 0) {
	return wn(8 | t, e);
}
function W(e, t = [], n = [], r = []) {
	ht(r, t, n, (t) => {
		wn(8, () => {
			e(...t.map(q));
		});
	});
}
function Fn(e, t = 0) {
	return wn(16 | t, e);
}
function In(e, t = 0) {
	return wn(C | t, e);
}
function Ln(e) {
	return wn(32 | ie, e);
}
function Rn(e) {
	var t = e.teardown;
	if (t !== null) {
		let n = Zn, r = G;
		Qn(!0), er(null);
		try {
			t.call(null);
		} catch (t) {
			xn(t, e.parent);
		} finally {
			Qn(n), er(r);
		}
	}
}
function zn(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && mt(() => {
			e.abort(ge);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : Vn(n, t), n = r;
	}
}
function Bn(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || Vn(t), t = n;
	}
}
function Vn(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (Hn(e.nodes.start, e.nodes.end), n = !0), e.f |= ne, zn(e, t && !n), vr(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	Rn(e), e.f ^= ne, e.f |= ee;
	var i = e.parent;
	i !== null && i.first !== null && Un(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Hn(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ pn(e);
		e.remove(), e = n;
	}
}
function Un(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Wn(e, t, n = !0) {
	var r = [];
	e.f |= 256, Gn(e, r, !0);
	var i = () => {
		n && Vn(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function Gn(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= D;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				Gn(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function Kn(e) {
	e.f &= -257, qn(e, !0);
}
function qn(e, t) {
	if (!(e.f & 256) && e.f & 8192) {
		e.f ^= D, e.f & 1024 || (ct(e, T), Rt.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			qn(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function Jn(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ pn(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/legacy.js
var Yn = null, Xn = !1, Zn = !1;
function Qn(e) {
	Zn = e;
}
var G = null, $n = !1;
function er(e) {
	G = e;
}
var K = null;
function tr(e) {
	K = e;
}
var nr = null;
function rr(e) {
	G !== null && (G.f & 2097152 || G.f & 2) && (nr ??= /* @__PURE__ */ new Set()).add(e);
}
var ir = null, ar = 0, or = null;
function sr(e) {
	or = e;
}
var cr = 1, lr = 0, ur = lr;
function dr(e) {
	ur = e;
}
function fr() {
	return ++cr;
}
function pr(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (pr(a) && Tt(a), a.wv > e.wv) return !0;
		}
		t & 512 && At === null && ct(e, w);
	}
	return !1;
}
function mr(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(nr !== null && nr.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? mr(a, t, !1) : t === a && (n ? ct(a, T) : a.f & 1024 && ct(a, E), Ht(a));
	}
}
function hr(e) {
	var t = ir, n = ar, r = or, i = G, a = nr, o = P, s = $n, c = ur, l = e.f;
	ir = null, ar = 0, or = null, G = l & 96 ? null : e, nr = null, Ze(e.ctx), $n = !1, ur = ++lr, e.ac !== null && (mt(() => {
		e.ac.abort(ge);
	}), e.ac = null);
	try {
		e.f |= k;
		var u = e.fn, d = u();
		e.f |= te;
		var f = gr(e);
		if (nt() && or !== null && !$n && f !== null && !(e.f & 6146)) for (var p = 0; p < or.length; p++) mr(or[p], e);
		if (i !== null && i !== e) {
			if (lr++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = lr;
			if (t !== null) for (let e of t) e.rv = lr;
			or !== null && (r === null ? r = or : r.push(...or));
		}
		return e.f & 8388608 && (e.f ^= se), d;
	} catch (t) {
		return gr(e), bn(t);
	} finally {
		e.f ^= k, ir = t, ar = n, or = r, G = i, nr = a, Ze(o), $n = s, ur = c;
	}
}
function gr(e) {
	var t = e.deps, n = R?.is_fork;
	if (ir !== null) {
		var r;
		if (n || vr(e, ar), t !== null && ar > 0) for (t.length = ar + ir.length, r = 0; r < ir.length; r++) t[ar + r] = ir[r];
		else e.deps = t = ir;
		if (Tn() && e.f & 512) for (r = ar; r < t.length; r++) (t[r].reactions ??= []).push(e);
	} else !n && t !== null && ar < t.length && (vr(e, ar), t.length = ar);
	return t;
}
function _r(e, n) {
	let r = n.reactions;
	if (r !== null) {
		var o = i.call(r, e);
		if (o !== -1) {
			var s = r.length - 1;
			s === 0 ? r = n.reactions = null : (r[o] = r[s], r.pop());
		}
	}
	if (r === null && n.f & 2 && (ir === null || !a.call(ir, n))) {
		var c = n;
		c.f & 512 && (c.f ^= 512), c.v !== t && lt(c), c.ac !== null && mt(() => {
			c.ac.abort(ge), c.ac = null, ct(c, T);
		}), Et(c), vr(c, 0);
	}
}
function vr(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) _r(e, n[r]);
}
function yr(e) {
	var t = e.f;
	if (!(t & 16384)) {
		ct(e, w);
		var n = K, r = Xn;
		K = e, Xn = !(t & 96);
		try {
			t & 16777232 ? Bn(e) : zn(e), Rn(e);
			var i = hr(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = cr;
		} finally {
			Xn = r, K = n;
		}
	}
}
function q(e) {
	var t = !!(e.f & 2);
	if (Yn?.add(e), G !== null && !$n && !(K !== null && K.f & 16384) && (nr === null || !nr.has(e))) {
		var n = G.deps;
		if (G.f & 2097152) e.rv < lr && (e.rv = lr, ir === null && n !== null && n[ar] === e ? ar++ : ir === null ? ir = [e] : ir.push(e));
		else {
			G.deps ??= [], a.call(G.deps, e) || G.deps.push(e);
			var r = e.reactions;
			r === null ? e.reactions = [G] : a.call(r, G) || r.push(G);
		}
	}
	if (Zn && Kt.has(e)) return Kt.get(e);
	if (t) {
		var i = e;
		if (Zn) {
			var o = i.v;
			return (!(i.f & 1024) && i.reactions !== null || xr(i)) && (o = wt(i)), Kt.set(i, o), o;
		}
		var s = !(i.f & 512) && !$n && G !== null && (Xn || !!(G.f & 512)), c = (i.f & te) === 0;
		pr(i) && (s && (i.f |= 512), Tt(i)), s && !c && (Dt(i), br(i));
	}
	if (At?.has(e)) return At.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function br(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (Dt(t), br(t));
}
function xr(e) {
	if (e.v === t) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (Kt.has(t) || t.f & 2 && xr(t)) return !0;
	return !1;
}
function Sr(e) {
	var t = $n;
	try {
		return $n = !0, e();
	} finally {
		$n = t;
	}
}
function Cr(e) {
	if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
		if (A in e) wr(e);
		else if (!Array.isArray(e)) for (let t in e) {
			let n = e[t];
			typeof n == "object" && n && A in n && wr(n);
		}
	}
}
function wr(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "object" && e && !(e instanceof EventTarget) && !t.has(e)) {
		t.add(e), e instanceof Date && e.getTime();
		for (let n in e) try {
			wr(e[n], t);
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
var Tr = Symbol("events"), Er = /* @__PURE__ */ new Set(), Dr = /* @__PURE__ */ new Set();
function Or(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || Fr.call(t, e), !e.cancelBubble) return mt(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? (i.__removed = !1, at(() => {
		i.__removed || t.addEventListener(e, i, r);
	})) : t.addEventListener(e, i, r), i;
}
function kr(e, t, n, r = {}) {
	var i = Or(t, e, n, r);
	return () => {
		i.__removed = !0, e.removeEventListener(t, i, r);
	};
}
function Ar(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = Or(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && En(() => {
		o.__removed = !0, t.removeEventListener(e, o, a);
	});
}
function jr(e, t, n) {
	(t[Tr] ??= {})[e] = n;
}
function Mr(e) {
	for (var t = 0; t < e.length; t++) Er.add(e[t]);
	for (var n of Dr) n(e);
}
var Nr = null, Pr = !1;
function Fr(e) {
	var t = this, n = t.ownerDocument, r = e.type, i = e.composedPath?.() || [], a = i[0] || e.target;
	Nr = e, Pr || (Pr = !0, setTimeout(() => {
		Pr = !1, Nr = null;
	}));
	var o = 0, s = Nr === e && e[Tr];
	if (s) {
		var l = i.indexOf(s);
		if (l !== -1 && (t === document || t === window)) {
			e[Tr] = t;
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
		er(null), tr(null);
		try {
			for (var p, m = []; a !== null && a !== t;) {
				try {
					var h = a[Tr]?.[r];
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
			e[Tr] = t, delete e.currentTarget, er(d), tr(f);
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/reconciler.js
var Ir = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function Lr(e) {
	return Ir?.createHTML(e) ?? e;
}
function Rr(e) {
	var t = vn("template");
	return t.innerHTML = Lr(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/template.js
function zr(e, t) {
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
		if (j) return zr(M, null), M;
		i === void 0 && (i = Rr(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ fn(i)));
		var t = r || sn ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ fn(t), s = t.lastChild;
			zr(o, s);
		} else zr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Br(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (j) return zr(M, null), M;
		if (!o) {
			var e = /* @__PURE__ */ fn(Rr(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ fn(e);) o.appendChild(/* @__PURE__ */ fn(e));
			else o = /* @__PURE__ */ fn(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ fn(t), r = t.lastChild;
			zr(n, r);
		} else zr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Vr(e, t) {
	return /* @__PURE__ */ Br(e, t, "svg");
}
function Hr(e = "") {
	if (!j) {
		var t = dn(e + "");
		return zr(t, t), t;
	}
	var n = M;
	return n.nodeType === 3 ? yn(n) : (n.before(n = dn()), Ce(n)), zr(n, n), n;
}
function Ur() {
	if (j) return zr(M, null), M;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = dn();
	return e.append(t, n), zr(t, n), e;
}
function Y(e, t) {
	if (j) {
		var n = K;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = M), we();
		return;
	}
	e !== null && e.before(t);
}
//#endregion
//#region node_modules/svelte/src/utils.js
function Wr(e) {
	return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
var Gr = [
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
function Kr(e) {
	return Gr.includes(e);
}
var qr = /* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split("."), Jr = {
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
function Yr(e) {
	return e = e.toLowerCase(), Jr[e] ?? e;
}
[...qr];
var Xr = ["touchstart", "touchmove"];
function Zr(e) {
	return Xr.includes(e);
}
//#endregion
//#region node_modules/svelte/src/reactivity/create-subscriber.js
function Qr(e) {
	let t = 0, n = Jt(0), r;
	return () => {
		Tn() && (q(n), Pn(() => (t === 0 && (r = Sr(() => e(() => en(n)))), t += 1, () => {
			at(() => {
				--t, t === 0 && (r?.(), r = void 0, en(n));
			});
		})));
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var $r = re | ie;
function ei(e, t, n, r) {
	new ti(e, t, n, r);
}
var ti = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = j ? M : null;
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
	#h = Qr(() => (this.#m = Jt(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = K;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = K.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = Fn(() => {
			if (j) {
				let e = this.#t;
				we();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, $r), j && (this.#e = M);
	}
	#g() {
		try {
			this.#a = Ln(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		at(r), t && (this.#s = Ln(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			if (t) {
				xe();
				return;
			}
			t = !0, n && Ue(), this.#s !== null && Wn(this.#s, () => {
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
					xn(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = Ln(() => e(this.#e)), at(() => {
			var e = this.#c = document.createDocumentFragment(), t = dn(), n = !1;
			if (e.append(t), this.#a = this.#S(() => {
				try {
					return Ln(() => this.#r(t));
				} catch (e) {
					try {
						this.error(e), n = !0;
					} catch (e) {
						xn(e, this.#i.parent);
					}
					return null;
				}
			}), this.#a === null) {
				this.#c = null, n && this.#x(R);
				return;
			}
			this.#u === 0 && (this.#e.before(e), this.#c = null, Wn(this.#o, () => {
				this.#o = null;
			}), this.#x(R));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = Ln(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				Jn(this.#a, e);
				let t = this.#n.pending;
				this.#o = Ln(() => t(this.#e));
			} else this.#x(R);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		ut(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = K, n = G, r = P;
		tr(this.#i), er(this.#i), Ze(this.#i.ctx);
		try {
			return Rt.ensure(), e();
		} finally {
			tr(t), er(n), Ze(r);
		}
	}
	#C(e, t) {
		if (!this.has_pending_snippet()) {
			this.parent && this.parent.#C(e, t);
			return;
		}
		this.#u += e, this.#u === 0 && (this.#x(t), this.#o && Wn(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null));
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, at(() => {
			this.#d = !1, this.#m && Qt(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), q(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		R?.is_fork ? (this.#a && R.skip_effect(this.#a), this.#o && R.skip_effect(this.#o), this.#s && R.skip_effect(this.#s), R.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (Vn(this.#a), null), this.#o &&= (Vn(this.#o), null), this.#s &&= (Vn(this.#s), null), j && (Ce(this.#t), Te(), Ce(Ee()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return Ln(() => {
						var r = K;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return xn(e, this.#i.parent), null;
				}
			}));
		};
		at(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				xn(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => xn(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
function ni(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[me] ??= e.nodeValue) && (e[me] = n, e.nodeValue = `${n}`);
}
function ri(e, t) {
	return oi(e, t);
}
function ii(t, n) {
	un(), n.intro = n.intro ?? !1;
	let r = n.target, i = j, a = M;
	try {
		for (var o = /* @__PURE__ */ fn(r); o && (o.nodeType !== 8 || o.data !== "[");) o = /* @__PURE__ */ pn(o);
		if (!o) throw e;
		Se(!0), Ce(o);
		let i = oi(t, {
			...n,
			anchor: o
		});
		return Se(!1), i;
	} catch (i) {
		if (i instanceof Error && i.message.split("\n").some((e) => e.startsWith("https://svelte.dev/e/"))) throw i;
		return i !== e && console.warn("Failed to hydrate: ", i), n.recover === !1 && Re(), un(), gn(r), Se(!1), ri(t, n);
	} finally {
		Se(i), Ce(a);
	}
}
var ai = /* @__PURE__ */ new Map();
function oi(t, { target: n, anchor: r, props: i = {}, events: a, context: s, intro: c = !0, transformError: l }) {
	un();
	var u = void 0, d = jn(() => {
		var c = r ?? n.appendChild(dn());
		ei(c, { pending: () => {} }, (n) => {
			F({});
			var r = P;
			if (s && (r.c = s), a && (i.$$events = a), j && zr(n, null), u = t(n, i) || tt(), j && (K.nodes.end = M, M === null || M.nodeType !== 8 || M.data !== "]")) throw ye(), e;
			I();
		}, l);
		var d = /* @__PURE__ */ new Set(), f = (e) => {
			for (var t = 0; t < e.length; t++) {
				var r = e[t];
				if (!d.has(r)) {
					d.add(r);
					var i = Zr(r);
					for (let e of [n, document]) {
						var a = ai.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), ai.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, Fr, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return f(o(Er)), Dr.add(f), () => {
			for (var e of d) for (let r of [n, document]) {
				var t = ai.get(r), i = t.get(e);
				--i == 0 ? (r.removeEventListener(e, Fr), t.delete(e), t.size === 0 && ai.delete(r)) : t.set(e, i);
			}
			Dr.delete(f), c !== r && c.parentNode?.removeChild(c);
		};
	});
	return si.set(u, d), u;
}
var si = /* @__PURE__ */ new WeakMap();
function ci(e, t) {
	let n = si.get(e);
	return n ? (si.delete(e), n(t)) : Promise.resolve();
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/branches.js
var li = class {
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
			if (n) Kn(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (Kn(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (Vn(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						Jn(r, t), t.append(dn()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else Vn(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), Wn(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (Vn(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = R, r = _n();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = dn();
				i.append(a), this.#n.set(e, {
					effect: Ln(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, Ln(() => t(this.anchor)));
		}
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else j && (this.anchor = M), this.#a(n);
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/snippet.js
function ui(e, t, ...n) {
	var r = new li(e);
	Fn(() => {
		let e = t() ?? null;
		r.ensure(e, e && ((t) => e(t, ...n)));
	}, re);
}
function di(e) {
	P === null && je("onMount"), We && P.l !== null ? pi(P).m.push(e) : Dn(() => {
		let t = Sr(e);
		if (typeof t == "function") return t;
	});
}
function fi(e) {
	P === null && je("onDestroy"), di(() => () => Sr(e));
}
function pi(e) {
	var t = e.l;
	return t.u ??= {
		a: [],
		b: [],
		m: []
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/if.js
function mi(e, t, n = !1) {
	var r;
	j && (r = M, we());
	var i = new li(e), a = n ? re : 0;
	function o(e, t) {
		if (j) {
			var n = De(r);
			if (e !== parseInt(n.substring(1))) {
				var a = Ee();
				Ce(a), i.anchor = a, Se(!1), i.ensure(e, t), Se(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	Fn(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/css-props.js
function hi(e, t) {
	j && Ce(/* @__PURE__ */ fn(e)), Pn(() => {
		var n = t();
		for (var r in n) {
			var i = n[r];
			i == null || i === "" ? e.style.removeProperty(r) : e.style.setProperty(r, i);
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/each.js
function gi(e, t, n) {
	for (var r = [], i = t.length, a, s = t.length, c = 0; c < i; c++) {
		let n = t[c];
		Wn(n, () => {
			if (a) {
				if (a.pending.delete(n), a.done.add(n), a.pending.size === 0) {
					var t = e.outrogroups;
					_i(e, o(a.done)), t.delete(a), t.size === 0 && (e.outrogroups = null);
				}
			} else --s;
		}, !1);
	}
	if (s === 0) {
		var l = r.length === 0 && n !== null && e.pending.size === 0;
		if (l) {
			var u = n, d = u.parentNode;
			gn(d), d.append(u), e.items.clear();
		}
		_i(e, t, !l);
	} else a = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(a);
}
function _i(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= O, Jn(a, document.createDocumentFragment())) : Vn(t[i], n);
	}
}
var vi;
function yi(e, t, n, i, a, s = null) {
	var c = e, l = /* @__PURE__ */ new Map();
	if (t & 4) {
		var u = e;
		c = j ? Ce(/* @__PURE__ */ fn(u)) : u.appendChild(dn());
	}
	j && we();
	var d = null, f = /* @__PURE__ */ St(() => {
		var e = n();
		return r(e) ? e : e == null ? [] : o(e);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, xi(v, p, c, t, i), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= O, Ci(d, null, c)) : Kn(d) : Wn(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: Fn(() => {
			p = q(f);
			var e = p.length;
			let r = !1;
			j && De(c) === "[!" != (e === 0) && (c = Ee(), Ce(c), Se(!1), r = !0);
			for (var o = /* @__PURE__ */ new Set(), u = R, v = _n(), y = 0; y < e; y += 1) {
				j && M.nodeType === 8 && M.data === "]" && (c = M, r = !0, Se(!1));
				var b = p[y], x = i(b, y), S = h ? null : l.get(x);
				S ? (S.v && Qt(S.v, b), S.i && Qt(S.i, y), v && u.unskip_effect(S.e)) : (S = Si(l, h ? c : vi ??= dn(), b, x, y, a, t, n), h || (S.e.f |= O), l.set(x, S)), o.add(x);
			}
			if (e === 0 && s && !d && (h ? d = Ln(() => s(c)) : (d = Ln(() => s(vi ??= dn())), d.f |= O)), e > o.size && Ne("", "", ""), j && e > 0 && Ce(Ee()), !h) {
				if (m.set(u, o), v) {
					for (let [e, t] of l) o.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			r && Se(!0), q(f);
		}),
		flags: t,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, j && (c = M);
}
function bi(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function xi(e, t, n, r, i) {
	var a = !!(r & 8), s = t.length, c = e.items, l = bi(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (a) for (v = 0; v < s; v += 1) h = t[v], g = i(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = i(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (Kn(_), a && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= O, _ === l) Ci(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), wi(e, d, _), wi(e, _, y), Ci(_, y, n), d = _, p = [], m = [], l = bi(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], C = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Ci(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					wi(e, S.prev, C.next), wi(e, d, S), wi(e, C, b), l = b, d = C, --v, p = [], m = [];
				} else u.delete(_), Ci(_, l, n), wi(e, _.prev, _.next), wi(e, _, d === null ? e.effect.first : d.next), wi(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = bi(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = bi(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (_i(e, o(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var w = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || w.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && w.push(l), l = bi(l.next);
		var T = w.length;
		if (T > 0) {
			var E = r & 4 && s === 0 ? n : null;
			if (a) {
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.measure();
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.fix();
			}
			gi(e, w, E);
		}
	}
	a && at(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function Si(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? Jt(n) : /* @__PURE__ */ Yt(n, !1, !1) : null, l = o & 2 ? Jt(i) : null;
	return {
		v: c,
		i: l,
		e: Ln(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Ci(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ pn(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function wi(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
function Ti(e, t, n) {
	var r;
	j && (r = M, we());
	var i = new li(e);
	Fn(() => {
		var e = t() ?? null;
		if (j && De(r) === "[" != (e !== null)) {
			var a = Ee();
			Ce(a), i.anchor = a, Se(!1), i.ensure(e, e && ((t) => n(t, e))), Se(!0);
			return;
		}
		i.ensure(e, e && ((t) => n(t, e)));
	}, re);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/css.js
function Ei(e, t) {
	Mn(() => {
		e = K?.parent?.nodes?.start ?? e;
		var n = e.getRootNode(), r = n.host ? n : n.head ?? n.ownerDocument.head;
		if (!r.querySelector("#" + t.hash)) {
			let e = vn("style");
			e.id = t.hash, e.textContent = t.code, r.appendChild(e);
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/actions.js
function Di(e, t, n) {
	Mn(() => {
		var r = Sr(() => t(e, n?.()) || {});
		if (n && r?.update) {
			var i = !1, a = {};
			Pn(() => {
				var e = n();
				Cr(e), i && ke(a, e) && (a = e, r.update(e));
			}), i = !0;
		}
		if (r?.destroy) return () => r.destroy();
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attachments.js
function Oi(e, t) {
	var n = void 0, r;
	In(() => {
		n !== (n = t()) && (r &&= (Vn(r), null), n && (r = Ln(() => {
			Mn(() => n(e));
		})));
	});
}
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function ki(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = ki(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function Ai() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = ki(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
function ji(e) {
	return typeof e == "object" ? Ai(e) : e ?? "";
}
var Mi = [..." 	\n\r\f\xA0\v﻿"];
function Ni(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Mi.includes(r[o - 1])) && (s === r.length || Mi.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function Pi(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function Fi(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Ii(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\/\*.*?\*\//g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(Fi)), i && c.push(...Object.keys(i).map(Fi));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = Fi(e.substring(l, u).trim());
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
		return r && (n += Pi(r)), i && (n += Pi(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function Li(e, t, n, r, i, a) {
	var o = e[fe];
	if (j || o !== n || o === void 0) {
		var s = Ni(n, r, a);
		(!j || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[fe] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/style.js
function Ri(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function zi(e, t, n, r) {
	var i = e[pe];
	if (j || i !== t) {
		var a = Ii(t, r);
		(!j || a !== e.getAttribute("style")) && (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[pe] = t;
	} else r && (Array.isArray(r) ? (Ri(e, n?.[0], r[0]), Ri(e, n?.[1], r[1], "important")) : Ri(e, n, r));
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
function Bi(e, t) {
	t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function Vi(e, t) {
	var n = !("__defaultValue" in e);
	(n || e.__defaultValue !== t) && (e.__defaultValue = t, Hi(e, !n || "__value" in e));
}
function Hi(e, t) {
	var n = e.__defaultValue, i = e.multiple, a = i ? n ?? [] : null;
	if (!i || r(a)) {
		var o = e.selectedIndex, s = t && i ? new Set(e.selectedOptions) : null;
		for (var c of e.options) {
			var l = Gi(c);
			Bi(c, i ? a.includes(l) : an(l, n));
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
function Ui(e, t, n = !1) {
	if (e.multiple) {
		if (t == null) return;
		if (!r(t)) return be();
		for (var i of e.options) i.selected = t.includes(Gi(i));
		return;
	}
	for (i of e.options) if (an(Gi(i), t)) {
		i.selected = !0;
		return;
	}
	(!n || t !== void 0) && (e.selectedIndex = -1);
}
function Wi(e) {
	var t = new MutationObserver((t) => {
		t.every(Ki) || ("__defaultValue" in e && Hi(e, !1), "__value" in e && Ui(e, e.__value));
	});
	t.observe(e, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["value"]
	}), En(() => {
		t.disconnect();
	});
}
function Gi(e) {
	return "__value" in e ? e.__value : e.value;
}
function Ki(e) {
	if (e.target.closest("selectedcontent") !== null) return !0;
	if (e.type === "childList") {
		var t = [...e.addedNodes, ...e.removedNodes];
		return t.length > 0 && t.every((e) => e.nodeName === "SELECTEDCONTENT");
	}
	return !1;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attributes.js
var qi = Symbol("class"), Ji = Symbol("style"), Yi = Symbol("is custom element"), Xi = Symbol("is html"), Zi = _e ? "link" : "LINK", Qi = _e ? "input" : "INPUT", $i = _e ? "option" : "OPTION", ea = _e ? "select" : "SELECT";
function ta(e) {
	if (j) {
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
		e[he] = n, at(n), pt();
	}
}
function X(e, t, n, r) {
	var i = ia(e);
	j && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === Zi) || i[t] !== (i[t] = n) && (t === "loading" && (e[ue] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && oa(e).has(t) ? e[t] = n : e.setAttribute(t, n));
}
function na(e, n, r, i, a = !1, o = !1) {
	j && a && e.nodeName === Qi && ("defaultValue" in r || "defaultChecked" in r || ta(e));
	var s = ia(e), c = s[Yi], l = !s[Xi];
	let u = j && c;
	u && Se(!1);
	var d = n || {}, f = e.nodeName === $i, p = e.nodeName === ea;
	for (var m in n) !(m in r) && m[0] + m[1] !== "$$" && (r[m] = null);
	r.class ? r.class = ji(r.class) : (i || r[qi]) && (r.class = null), r[Ji] && (r.style ??= null);
	var h = oa(e);
	if (e.nodeName === Qi && "type" in r && ("value" in r || "__value" in r)) {
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
			Li(e, e.namespaceURI === "http://www.w3.org/1999/xhtml", u, i, n?.[qi], r[qi]), d[a] = u, d[qi] = r[qi];
			continue;
		}
		if (a === "style") {
			zi(e, u, n?.[Ji], r[Ji]), d[a] = u, d[Ji] = r[Ji];
			continue;
		}
		var _ = d[a];
		if (u !== _ || u === void 0 && e.hasAttribute(a)) {
			d[a] = u;
			var v = a[0] + a[1];
			if (v !== "$$") {
				if (v === "on") {
					let t = {}, n = "$$" + a, r = a.slice(2);
					var y = Kr(r);
					if (Wr(r) && (r = r.slice(0, -7), t.capture = !0), !y && _) {
						if (u != null) continue;
						e.removeEventListener(r, d[n], t), d[n] = null;
					}
					if (y) jr(r, e, u), Mr([r]);
					else if (u != null) {
						function i(e) {
							d[a].call(this, e);
						}
						d[n] = Or(r, e, i, t);
					}
				} else if (a === "style") X(e, a, u);
				else if (a === "autofocus") dt(e, !!u);
				else if (!c && (a === "__value" || a === "value" && u != null)) e.value = e.__value = u;
				else if (a === "selected" && f) Bi(e, u);
				else {
					var b = a;
					l || (b = Yr(b));
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
	return u && Se(!0), d;
}
function ra(e, t, n = [], r = [], i = [], a, o = !1, s = !1) {
	ht(i, n, r, (n) => {
		var r = void 0, i = {}, c = e.nodeName === ea, l = !1;
		if (In(() => {
			var u = t(...n.map(q)), d = na(e, r, u, a, o, s);
			if (l && c) {
				var f = e;
				"defaultValue" in u && Vi(f, u.defaultValue), "value" in u && Ui(f, u.value);
			}
			for (let e of Object.getOwnPropertySymbols(i)) u[e] || Vn(i[e]);
			for (let t of Object.getOwnPropertySymbols(u)) {
				var p = u[t];
				t.description === "@attach" && (!r || p !== r[t]) && (i[t] && Vn(i[t]), i[t] = Ln(() => Oi(e, () => p))), d[t] = p;
			}
			r = d;
		}), c) {
			var u = e;
			Mn(() => {
				var e = r;
				"defaultValue" in e && Vi(u, e.defaultValue), Ui(u, e.value, !0), Wi(u);
			});
		}
		l = !0;
	});
}
function ia(e) {
	return e[de] ??= {
		[Yi]: e.nodeName.includes("-"),
		[Xi]: e.namespaceURI === n
	};
}
var aa = /* @__PURE__ */ new Map();
function oa(e) {
	var t = e.getAttribute("is") || e.nodeName, n = aa.get(t);
	if (n) return n;
	aa.set(t, n = /* @__PURE__ */ new Set());
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var o in r = u(i), r) r[o].set && o !== "innerHTML" && o !== "textContent" && o !== "innerText" && n.add(o);
		i = p(i);
	}
	return n;
}
var sa = /* @__PURE__ */ new class e {
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
function ca(e, t, n) {
	var r = sa.observe(e, () => n(e[t]));
	Mn(() => (Sr(() => n(e[t])), r));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function la(e, t) {
	return e === t || e?.[A] === t;
}
function ua(e = tt(), t, n, r) {
	var i = P.r, a = K;
	return Mn(() => {
		var o, s;
		return Pn(() => {
			o = s, s = r?.() || [], Sr(() => {
				la(n(...s), e) || (t(e, ...s), o && la(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && la(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
function da(e = !1) {
	let t = P, n = t.l.u;
	if (!n) return;
	let r = () => Cr(t.s);
	if (e) {
		let e = 0, n = {}, i = /* @__PURE__ */ yt(() => {
			let r = !1, i = t.s;
			for (let e in i) i[e] !== n[e] && (n[e] = i[e], r = !0);
			return r && e++, e;
		});
		r = () => q(i);
	}
	n.b.length && kn(() => {
		fa(t, r), v(n.b);
	}), Dn(() => {
		let e = Sr(() => n.m.map(_));
		return () => {
			for (let t of e) typeof t == "function" && t();
		};
	}), n.a.length && Dn(() => {
		fa(t, r), v(n.a);
	});
}
function fa(e, t) {
	if (e.l.s) for (let t of e.l.s) q(t);
	t();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/store.js
var pa = !1;
function ma(e) {
	var t = pa;
	try {
		return pa = !1, [e(), pa];
	} finally {
		pa = t;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/props.js
var ha = {
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
function ga(e, t, n) {
	return new Proxy({
		props: e,
		exclude: t
	}, ha);
}
var _a = {
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
		if (t === A || t === le) return !1;
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
function va(...e) {
	return new Proxy({ props: e }, _a);
}
function Z(e, t, n, r) {
	var i = !We || !!(n & 2), a = !!(n & 8), o = !!(n & 16), s = r, c = !0, u = void 0, d = () => o && i ? (u ??= /* @__PURE__ */ yt(r), q(u)) : (c && (c = !1, s = o ? Sr(r) : r), s);
	let f;
	if (a) {
		var p = A in e || le in e;
		f = l(e, t)?.set ?? (p && t in e ? (n) => e[t] = n : void 0);
	}
	var m, h = !1;
	a ? [m, h] = ma(() => e[t]) : m = e[t], m === void 0 && r !== void 0 && (m = d(), f && (i && ze(t), f(m)));
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
	var v = !1, y = (n & 1 ? yt : St)(() => (v = !1, g()));
	a && q(y);
	var b = K;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? q(y) : i && a ? nn(e) : e;
			return V(y, n), v = !0, s !== void 0 && (s = n), e;
		}
		return Zn && v || b.f & 16384 ? y.v : q(y);
	});
}
//#endregion
//#region node_modules/svelte/src/legacy/legacy-client.js
function ya(e) {
	return new ba(e);
}
var ba = class {
	#e;
	#t;
	constructor(e) {
		var t = /* @__PURE__ */ new Map(), n = (e, n) => {
			var r = /* @__PURE__ */ Yt(n, !1, !1);
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
				return r === le || (q(t.get(r) ?? n(r, Reflect.get(e, r))), Reflect.has(e, r));
			},
			set(e, r, i) {
				return V(t.get(r) ?? n(r, i), i), Reflect.set(e, r, i);
			}
		});
		this.#t = (e.hydrate ? ii : ri)(e.component, {
			target: e.target,
			anchor: e.anchor,
			props: r,
			context: e.context,
			intro: e.intro ?? !1,
			recover: e.recover,
			transformError: e.transformError
		}), (!e?.props?.$$host || e.sync === !1) && z(), this.#e = r.$$events;
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
			ci(this.#t);
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
}, xa;
typeof HTMLElement == "function" && (xa = class extends HTMLElement {
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
					let n = vn("slot");
					e !== "default" && (n.name = e), Y(t, n);
				};
			}
			let t = {}, n = Ca(this);
			for (let r of this.$$s) r in n && (r === "default" && !this.$$d.children ? (this.$$d.children = e(r), t.default = !0) : t[r] = e(r));
			for (let e of this.attributes) {
				let t = this.$$g_p(e.name);
				t in this.$$d || (this.$$d[t] = Sa(t, e.value, this.$$p_d, "toProp"));
			}
			for (let e in this.$$p_d) !(e in this.$$d) && this[e] !== void 0 && (this.$$d[e] = this[e], delete this[e]);
			this.$$c = ya({
				component: this.$$ctor,
				target: this.$$shadowRoot || this,
				props: {
					...this.$$d,
					$$slots: t,
					$$host: this
				}
			}), this.$$me = An(() => {
				Pn(() => {
					this.$$r = !0;
					for (let e of s(this.$$c)) {
						if (!this.$$p_d[e]?.reflect) continue;
						this.$$d[e] = this.$$c[e];
						let t = Sa(e, this.$$d[e], this.$$p_d, "toAttribute");
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
		this.$$r || (e = this.$$g_p(e), this.$$d[e] = Sa(e, n, this.$$p_d, "toProp"), this.$$c?.$set({ [e]: this.$$d[e] }));
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
function Sa(e, t, n, r) {
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
function Ca(e) {
	let t = {};
	return e.childNodes.forEach((e) => {
		t[e.slot || "default"] = !0;
	}), t;
}
function Q(e, t, n, r, i, a) {
	let o = class extends xa {
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
				n = Sa(e, n, t), this.$$d[e] = n;
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
var wa = { value: () => {} };
function Ta() {
	for (var e = 0, t = arguments.length, n = {}, r; e < t; ++e) {
		if (!(r = arguments[e] + "") || r in n || /[\s.]/.test(r)) throw Error("illegal type: " + r);
		n[r] = [];
	}
	return new Ea(n);
}
function Ea(e) {
	this._ = e;
}
function Da(e, t) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var n = "", r = e.indexOf(".");
		if (r >= 0 && (n = e.slice(r + 1), e = e.slice(0, r)), e && !t.hasOwnProperty(e)) throw Error("unknown type: " + e);
		return {
			type: e,
			name: n
		};
	});
}
Ea.prototype = Ta.prototype = {
	constructor: Ea,
	on: function(e, t) {
		var n = this._, r = Da(e + "", n), i, a = -1, o = r.length;
		if (arguments.length < 2) {
			for (; ++a < o;) if ((i = (e = r[a]).type) && (i = Oa(n[i], e.name))) return i;
			return;
		}
		if (t != null && typeof t != "function") throw Error("invalid callback: " + t);
		for (; ++a < o;) if (i = (e = r[a]).type) n[i] = ka(n[i], e.name, t);
		else if (t == null) for (i in n) n[i] = ka(n[i], e.name, null);
		return this;
	},
	copy: function() {
		var e = {}, t = this._;
		for (var n in t) e[n] = t[n].slice();
		return new Ea(e);
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
function Oa(e, t) {
	for (var n = 0, r = e.length, i; n < r; ++n) if ((i = e[n]).name === t) return i.value;
}
function ka(e, t, n) {
	for (var r = 0, i = e.length; r < i; ++r) if (e[r].name === t) {
		e[r] = wa, e = e.slice(0, r).concat(e.slice(r + 1));
		break;
	}
	return n != null && e.push({
		name: t,
		value: n
	}), e;
}
var Aa = {
	svg: "http://www.w3.org/2000/svg",
	xhtml: "http://www.w3.org/1999/xhtml",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/"
};
//#endregion
//#region node_modules/d3-selection/src/namespace.js
function ja(e) {
	var t = e += "", n = t.indexOf(":");
	return n >= 0 && (t = e.slice(0, n)) !== "xmlns" && (e = e.slice(n + 1)), Aa.hasOwnProperty(t) ? {
		space: Aa[t],
		local: e
	} : e;
}
//#endregion
//#region node_modules/d3-selection/src/creator.js
function Ma(e) {
	return function() {
		var t = this.ownerDocument, n = this.namespaceURI;
		return n === "http://www.w3.org/1999/xhtml" && t.documentElement.namespaceURI === "http://www.w3.org/1999/xhtml" ? t.createElement(e) : t.createElementNS(n, e);
	};
}
function Na(e) {
	return function() {
		return this.ownerDocument.createElementNS(e.space, e.local);
	};
}
function Pa(e) {
	var t = ja(e);
	return (t.local ? Na : Ma)(t);
}
//#endregion
//#region node_modules/d3-selection/src/selector.js
function Fa() {}
function Ia(e) {
	return e == null ? Fa : function() {
		return this.querySelector(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/select.js
function La(e) {
	typeof e != "function" && (e = Ia(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = Array(o), c, l, u = 0; u < o; ++u) (c = a[u]) && (l = e.call(c, c.__data__, u, a)) && ("__data__" in c && (l.__data__ = c.__data__), s[u] = l);
	return new Es(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/array.js
function Ra(e) {
	return e == null ? [] : Array.isArray(e) ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selectorAll.js
function za() {
	return [];
}
function Ba(e) {
	return e == null ? za : function() {
		return this.querySelectorAll(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectAll.js
function Va(e) {
	return function() {
		return Ra(e.apply(this, arguments));
	};
}
function Ha(e) {
	e = typeof e == "function" ? Va(e) : Ba(e);
	for (var t = this._groups, n = t.length, r = [], i = [], a = 0; a < n; ++a) for (var o = t[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && (r.push(e.call(c, c.__data__, l, o)), i.push(c));
	return new Es(r, i);
}
//#endregion
//#region node_modules/d3-selection/src/matcher.js
function Ua(e) {
	return function() {
		return this.matches(e);
	};
}
function Wa(e) {
	return function(t) {
		return t.matches(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChild.js
var Ga = Array.prototype.find;
function Ka(e) {
	return function() {
		return Ga.call(this.children, e);
	};
}
function qa() {
	return this.firstElementChild;
}
function Ja(e) {
	return this.select(e == null ? qa : Ka(typeof e == "function" ? e : Wa(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChildren.js
var Ya = Array.prototype.filter;
function Xa() {
	return Array.from(this.children);
}
function Za(e) {
	return function() {
		return Ya.call(this.children, e);
	};
}
function Qa(e) {
	return this.selectAll(e == null ? Xa : Za(typeof e == "function" ? e : Wa(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/filter.js
function $a(e) {
	typeof e != "function" && (e = Ua(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Es(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/sparse.js
function eo(e) {
	return Array(e.length);
}
//#endregion
//#region node_modules/d3-selection/src/selection/enter.js
function to() {
	return new Es(this._enter || this._groups.map(eo), this._parents);
}
function no(e, t) {
	this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, this._next = null, this._parent = e, this.__data__ = t;
}
no.prototype = {
	constructor: no,
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
function ro(e) {
	return function() {
		return e;
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/data.js
function io(e, t, n, r, i, a) {
	for (var o = 0, s, c = t.length, l = a.length; o < l; ++o) (s = t[o]) ? (s.__data__ = a[o], r[o] = s) : n[o] = new no(e, a[o]);
	for (; o < c; ++o) (s = t[o]) && (i[o] = s);
}
function ao(e, t, n, r, i, a, o) {
	var s, c, l = /* @__PURE__ */ new Map(), u = t.length, d = a.length, f = Array(u), p;
	for (s = 0; s < u; ++s) (c = t[s]) && (f[s] = p = o.call(c, c.__data__, s, t) + "", l.has(p) ? i[s] = c : l.set(p, c));
	for (s = 0; s < d; ++s) p = o.call(e, a[s], s, a) + "", (c = l.get(p)) ? (r[s] = c, c.__data__ = a[s], l.delete(p)) : n[s] = new no(e, a[s]);
	for (s = 0; s < u; ++s) (c = t[s]) && l.get(f[s]) === c && (i[s] = c);
}
function oo(e) {
	return e.__data__;
}
function so(e, t) {
	if (!arguments.length) return Array.from(this, oo);
	var n = t ? ao : io, r = this._parents, i = this._groups;
	typeof e != "function" && (e = ro(e));
	for (var a = i.length, o = Array(a), s = Array(a), c = Array(a), l = 0; l < a; ++l) {
		var u = r[l], d = i[l], f = d.length, p = co(e.call(u, u && u.__data__, l, r)), m = p.length, h = s[l] = Array(m), g = o[l] = Array(m);
		n(u, d, h, g, c[l] = Array(f), p, t);
		for (var _ = 0, v = 0, y, b; _ < m; ++_) if (y = h[_]) {
			for (_ >= v && (v = _ + 1); !(b = g[v]) && ++v < m;);
			y._next = b || null;
		}
	}
	return o = new Es(o, r), o._enter = s, o._exit = c, o;
}
function co(e) {
	return typeof e == "object" && "length" in e ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selection/exit.js
function lo() {
	return new Es(this._exit || this._groups.map(eo), this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/join.js
function uo(e, t, n) {
	var r = this.enter(), i = this, a = this.exit();
	return typeof e == "function" ? (r = e(r), r &&= r.selection()) : r = r.append(e + ""), t != null && (i = t(i), i &&= i.selection()), n == null ? a.remove() : n(a), r && i ? r.merge(i).order() : i;
}
//#endregion
//#region node_modules/d3-selection/src/selection/merge.js
function fo(e) {
	for (var t = e.selection ? e.selection() : e, n = this._groups, r = t._groups, i = n.length, a = r.length, o = Math.min(i, a), s = Array(i), c = 0; c < o; ++c) for (var l = n[c], u = r[c], d = l.length, f = s[c] = Array(d), p, m = 0; m < d; ++m) (p = l[m] || u[m]) && (f[m] = p);
	for (; c < i; ++c) s[c] = n[c];
	return new Es(s, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/order.js
function po() {
	for (var e = this._groups, t = -1, n = e.length; ++t < n;) for (var r = e[t], i = r.length - 1, a = r[i], o; --i >= 0;) (o = r[i]) && (a && o.compareDocumentPosition(a) ^ 4 && a.parentNode.insertBefore(o, a), a = o);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/sort.js
function mo(e) {
	e ||= ho;
	function t(t, n) {
		return t && n ? e(t.__data__, n.__data__) : !t - !n;
	}
	for (var n = this._groups, r = n.length, i = Array(r), a = 0; a < r; ++a) {
		for (var o = n[a], s = o.length, c = i[a] = Array(s), l, u = 0; u < s; ++u) (l = o[u]) && (c[u] = l);
		c.sort(t);
	}
	return new Es(i, this._parents).order();
}
function ho(e, t) {
	return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
//#endregion
//#region node_modules/d3-selection/src/selection/call.js
function go() {
	var e = arguments[0];
	return arguments[0] = this, e.apply(null, arguments), this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/nodes.js
function _o() {
	return Array.from(this);
}
//#endregion
//#region node_modules/d3-selection/src/selection/node.js
function vo() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length; i < a; ++i) {
		var o = r[i];
		if (o) return o;
	}
	return null;
}
//#endregion
//#region node_modules/d3-selection/src/selection/size.js
function yo() {
	let e = 0;
	for (let t of this) ++e;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/selection/empty.js
function bo() {
	return !this.node();
}
//#endregion
//#region node_modules/d3-selection/src/selection/each.js
function xo(e) {
	for (var t = this._groups, n = 0, r = t.length; n < r; ++n) for (var i = t[n], a = 0, o = i.length, s; a < o; ++a) (s = i[a]) && e.call(s, s.__data__, a, i);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/attr.js
function So(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function Co(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function wo(e, t) {
	return function() {
		this.setAttribute(e, t);
	};
}
function To(e, t) {
	return function() {
		this.setAttributeNS(e.space, e.local, t);
	};
}
function Eo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttribute(e) : this.setAttribute(e, n);
	};
}
function Do(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttributeNS(e.space, e.local) : this.setAttributeNS(e.space, e.local, n);
	};
}
function Oo(e, t) {
	var n = ja(e);
	if (arguments.length < 2) {
		var r = this.node();
		return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
	}
	return this.each((t == null ? n.local ? Co : So : typeof t == "function" ? n.local ? Do : Eo : n.local ? To : wo)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/window.js
function ko(e) {
	return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
}
//#endregion
//#region node_modules/d3-selection/src/selection/style.js
function Ao(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function jo(e, t, n) {
	return function() {
		this.style.setProperty(e, t, n);
	};
}
function Mo(e, t, n) {
	return function() {
		var r = t.apply(this, arguments);
		r == null ? this.style.removeProperty(e) : this.style.setProperty(e, r, n);
	};
}
function No(e, t, n) {
	return arguments.length > 1 ? this.each((t == null ? Ao : typeof t == "function" ? Mo : jo)(e, t, n ?? "")) : Po(this.node(), e);
}
function Po(e, t) {
	return e.style.getPropertyValue(t) || ko(e).getComputedStyle(e, null).getPropertyValue(t);
}
//#endregion
//#region node_modules/d3-selection/src/selection/property.js
function Fo(e) {
	return function() {
		delete this[e];
	};
}
function Io(e, t) {
	return function() {
		this[e] = t;
	};
}
function Lo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? delete this[e] : this[e] = n;
	};
}
function Ro(e, t) {
	return arguments.length > 1 ? this.each((t == null ? Fo : typeof t == "function" ? Lo : Io)(e, t)) : this.node()[e];
}
//#endregion
//#region node_modules/d3-selection/src/selection/classed.js
function zo(e) {
	return e.trim().split(/^|\s+/);
}
function Bo(e) {
	return e.classList || new Vo(e);
}
function Vo(e) {
	this._node = e, this._names = zo(e.getAttribute("class") || "");
}
Vo.prototype = {
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
function Ho(e, t) {
	for (var n = Bo(e), r = -1, i = t.length; ++r < i;) n.add(t[r]);
}
function Uo(e, t) {
	for (var n = Bo(e), r = -1, i = t.length; ++r < i;) n.remove(t[r]);
}
function Wo(e) {
	return function() {
		Ho(this, e);
	};
}
function Go(e) {
	return function() {
		Uo(this, e);
	};
}
function Ko(e, t) {
	return function() {
		(t.apply(this, arguments) ? Ho : Uo)(this, e);
	};
}
function qo(e, t) {
	var n = zo(e + "");
	if (arguments.length < 2) {
		for (var r = Bo(this.node()), i = -1, a = n.length; ++i < a;) if (!r.contains(n[i])) return !1;
		return !0;
	}
	return this.each((typeof t == "function" ? Ko : t ? Wo : Go)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/text.js
function Jo() {
	this.textContent = "";
}
function Yo(e) {
	return function() {
		this.textContent = e;
	};
}
function Xo(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.textContent = t ?? "";
	};
}
function Zo(e) {
	return arguments.length ? this.each(e == null ? Jo : (typeof e == "function" ? Xo : Yo)(e)) : this.node().textContent;
}
//#endregion
//#region node_modules/d3-selection/src/selection/html.js
function Qo() {
	this.innerHTML = "";
}
function $o(e) {
	return function() {
		this.innerHTML = e;
	};
}
function es(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.innerHTML = t ?? "";
	};
}
function ts(e) {
	return arguments.length ? this.each(e == null ? Qo : (typeof e == "function" ? es : $o)(e)) : this.node().innerHTML;
}
//#endregion
//#region node_modules/d3-selection/src/selection/raise.js
function ns() {
	this.nextSibling && this.parentNode.appendChild(this);
}
function rs() {
	return this.each(ns);
}
//#endregion
//#region node_modules/d3-selection/src/selection/lower.js
function is() {
	this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function as() {
	return this.each(is);
}
//#endregion
//#region node_modules/d3-selection/src/selection/append.js
function os(e) {
	var t = typeof e == "function" ? e : Pa(e);
	return this.select(function() {
		return this.appendChild(t.apply(this, arguments));
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/insert.js
function ss() {
	return null;
}
function cs(e, t) {
	var n = typeof e == "function" ? e : Pa(e), r = t == null ? ss : typeof t == "function" ? t : Ia(t);
	return this.select(function() {
		return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/remove.js
function ls() {
	var e = this.parentNode;
	e && e.removeChild(this);
}
function us() {
	return this.each(ls);
}
//#endregion
//#region node_modules/d3-selection/src/selection/clone.js
function ds() {
	var e = this.cloneNode(!1), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function fs() {
	var e = this.cloneNode(!0), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function ps(e) {
	return this.select(e ? fs : ds);
}
//#endregion
//#region node_modules/d3-selection/src/selection/datum.js
function ms(e) {
	return arguments.length ? this.property("__data__", e) : this.node().__data__;
}
//#endregion
//#region node_modules/d3-selection/src/selection/on.js
function hs(e) {
	return function(t) {
		e.call(this, t, this.__data__);
	};
}
function gs(e) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var t = "", n = e.indexOf(".");
		return n >= 0 && (t = e.slice(n + 1), e = e.slice(0, n)), {
			type: e,
			name: t
		};
	});
}
function _s(e) {
	return function() {
		var t = this.__on;
		if (t) {
			for (var n = 0, r = -1, i = t.length, a; n < i; ++n) a = t[n], (!e.type || a.type === e.type) && a.name === e.name ? this.removeEventListener(a.type, a.listener, a.options) : t[++r] = a;
			++r ? t.length = r : delete this.__on;
		}
	};
}
function vs(e, t, n) {
	return function() {
		var r = this.__on, i, a = hs(t);
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
function ys(e, t, n) {
	var r = gs(e + ""), i, a = r.length, o;
	if (arguments.length < 2) {
		var s = this.node().__on;
		if (s) {
			for (var c = 0, l = s.length, u; c < l; ++c) for (i = 0, u = s[c]; i < a; ++i) if ((o = r[i]).type === u.type && o.name === u.name) return u.value;
		}
		return;
	}
	for (s = t ? vs : _s, i = 0; i < a; ++i) this.each(s(r[i], t, n));
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/dispatch.js
function bs(e, t, n) {
	var r = ko(e), i = r.CustomEvent;
	typeof i == "function" ? i = new i(t, n) : (i = r.document.createEvent("Event"), n ? (i.initEvent(t, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(t, !1, !1)), e.dispatchEvent(i);
}
function xs(e, t) {
	return function() {
		return bs(this, e, t);
	};
}
function Ss(e, t) {
	return function() {
		return bs(this, e, t.apply(this, arguments));
	};
}
function Cs(e, t) {
	return this.each((typeof t == "function" ? Ss : xs)(e, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/iterator.js
function* ws() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length, o; i < a; ++i) (o = r[i]) && (yield o);
}
//#endregion
//#region node_modules/d3-selection/src/selection/index.js
var Ts = [null];
function Es(e, t) {
	this._groups = e, this._parents = t;
}
function Ds() {
	return new Es([[document.documentElement]], Ts);
}
function Os() {
	return this;
}
Es.prototype = Ds.prototype = {
	constructor: Es,
	select: La,
	selectAll: Ha,
	selectChild: Ja,
	selectChildren: Qa,
	filter: $a,
	data: so,
	enter: to,
	exit: lo,
	join: uo,
	merge: fo,
	selection: Os,
	order: po,
	sort: mo,
	call: go,
	nodes: _o,
	node: vo,
	size: yo,
	empty: bo,
	each: xo,
	attr: Oo,
	style: No,
	property: Ro,
	classed: qo,
	text: Zo,
	html: ts,
	raise: rs,
	lower: as,
	append: os,
	insert: cs,
	remove: us,
	clone: ps,
	datum: ms,
	on: ys,
	dispatch: Cs,
	[Symbol.iterator]: ws
};
//#endregion
//#region node_modules/d3-selection/src/select.js
function ks(e) {
	return typeof e == "string" ? new Es([[document.querySelector(e)]], [document.documentElement]) : new Es([[e]], Ts);
}
//#endregion
//#region node_modules/d3-selection/src/sourceEvent.js
function As(e) {
	let t;
	for (; t = e.sourceEvent;) e = t;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/pointer.js
function js(e, t) {
	if (e = As(e), t === void 0 && (t = e.currentTarget), t) {
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
var Ms = { passive: !1 }, Ns = {
	capture: !0,
	passive: !1
};
function Ps(e) {
	e.stopImmediatePropagation();
}
function Fs(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-drag/src/nodrag.js
function Is(e) {
	var t = e.document.documentElement, n = ks(e).on("dragstart.drag", Fs, Ns);
	"onselectstart" in t ? n.on("selectstart.drag", Fs, Ns) : (t.__noselect = t.style.MozUserSelect, t.style.MozUserSelect = "none");
}
function Ls(e, t) {
	var n = e.document.documentElement, r = ks(e).on("dragstart.drag", null);
	t && (r.on("click.drag", Fs, Ns), setTimeout(function() {
		r.on("click.drag", null);
	}, 0)), "onselectstart" in n ? r.on("selectstart.drag", null) : (n.style.MozUserSelect = n.__noselect, delete n.__noselect);
}
//#endregion
//#region node_modules/d3-drag/src/constant.js
var Rs = (e) => () => e;
//#endregion
//#region node_modules/d3-drag/src/event.js
function zs(e, { sourceEvent: t, subject: n, target: r, identifier: i, active: a, x: o, y: s, dx: c, dy: l, dispatch: u }) {
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
zs.prototype.on = function() {
	var e = this._.on.apply(this._, arguments);
	return e === this._ ? this : e;
};
//#endregion
//#region node_modules/d3-drag/src/drag.js
function Bs(e) {
	return !e.ctrlKey && !e.button;
}
function Vs() {
	return this.parentNode;
}
function Hs(e, t) {
	return t ?? {
		x: e.x,
		y: e.y
	};
}
function Us() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function Ws() {
	var e = Bs, t = Vs, n = Hs, r = Us, i = {}, a = Ta("start", "drag", "end"), o = 0, s, c, l, u, d = 0;
	function f(e) {
		e.on("mousedown.drag", p).filter(r).on("touchstart.drag", g).on("touchmove.drag", _, Ms).on("touchend.drag touchcancel.drag", v).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	function p(n, r) {
		if (!u && e.call(this, n, r)) {
			var i = y(this, t.call(this, n, r), n, r, "mouse");
			i && (ks(n.view).on("mousemove.drag", m, Ns).on("mouseup.drag", h, Ns), Is(n.view), Ps(n), l = !1, s = n.clientX, c = n.clientY, i("start", n));
		}
	}
	function m(e) {
		if (Fs(e), !l) {
			var t = e.clientX - s, n = e.clientY - c;
			l = t * t + n * n > d;
		}
		i.mouse("drag", e);
	}
	function h(e) {
		ks(e.view).on("mousemove.drag mouseup.drag", null), Ls(e.view, l), Fs(e), i.mouse("end", e);
	}
	function g(n, r) {
		if (e.call(this, n, r)) for (var i = n.changedTouches, a = t.call(this, n, r), o = i.length, s = 0, c; s < o; ++s) (c = y(this, a, n, r, i[s].identifier, i[s])) && (Ps(n), c("start", n, i[s]));
	}
	function _(e) {
		for (var t = e.changedTouches, n = t.length, r = 0, a; r < n; ++r) (a = i[t[r].identifier]) && (Fs(e), a("drag", e, t[r]));
	}
	function v(e) {
		var t = e.changedTouches, n = t.length, r, a;
		for (u && clearTimeout(u), u = setTimeout(function() {
			u = null;
		}, 500), r = 0; r < n; ++r) (a = i[t[r].identifier]) && (Ps(e), a("end", e, t[r]));
	}
	function y(e, t, r, s, c, l) {
		var u = a.copy(), d = js(l || r, t), p, m, h;
		if ((h = n.call(e, new zs("beforestart", {
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
				case "drag": d = js(l || a, t), _ = o;
			}
			u.call(r, e, new zs(r, {
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
		return arguments.length ? (e = typeof t == "function" ? t : Rs(!!t), f) : e;
	}, f.container = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : Rs(e), f) : t;
	}, f.subject = function(e) {
		return arguments.length ? (n = typeof e == "function" ? e : Rs(e), f) : n;
	}, f.touchable = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : Rs(!!e), f) : r;
	}, f.on = function() {
		var e = a.on.apply(a, arguments);
		return e === a ? f : e;
	}, f.clickDistance = function(e) {
		return arguments.length ? (d = (e = +e) * e, f) : Math.sqrt(d);
	}, f;
}
//#endregion
//#region node_modules/d3-color/src/define.js
function Gs(e, t, n) {
	e.prototype = t.prototype = n, n.constructor = e;
}
function Ks(e, t) {
	var n = Object.create(e.prototype);
	for (var r in t) n[r] = t[r];
	return n;
}
//#endregion
//#region node_modules/d3-color/src/color.js
function qs() {}
var Js = .7, Ys = 1 / Js, Xs = "\\s*([+-]?\\d+)\\s*", Zs = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", Qs = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", $s = /^#([0-9a-f]{3,8})$/, ec = RegExp(`^rgb\\(${Xs},${Xs},${Xs}\\)$`), tc = RegExp(`^rgb\\(${Qs},${Qs},${Qs}\\)$`), nc = RegExp(`^rgba\\(${Xs},${Xs},${Xs},${Zs}\\)$`), rc = RegExp(`^rgba\\(${Qs},${Qs},${Qs},${Zs}\\)$`), ic = RegExp(`^hsl\\(${Zs},${Qs},${Qs}\\)$`), ac = RegExp(`^hsla\\(${Zs},${Qs},${Qs},${Zs}\\)$`), oc = {
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
Gs(qs, dc, {
	copy(e) {
		return Object.assign(new this.constructor(), this, e);
	},
	displayable() {
		return this.rgb().displayable();
	},
	hex: sc,
	formatHex: sc,
	formatHex8: cc,
	formatHsl: lc,
	formatRgb: uc,
	toString: uc
});
function sc() {
	return this.rgb().formatHex();
}
function cc() {
	return this.rgb().formatHex8();
}
function lc() {
	return wc(this).formatHsl();
}
function uc() {
	return this.rgb().formatRgb();
}
function dc(e) {
	var t, n;
	return e = (e + "").trim().toLowerCase(), (t = $s.exec(e)) ? (n = t[1].length, t = parseInt(t[1], 16), n === 6 ? fc(t) : n === 3 ? new gc(t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, (t & 15) << 4 | t & 15, 1) : n === 8 ? pc(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, (t & 255) / 255) : n === 4 ? pc(t >> 12 & 15 | t >> 8 & 240, t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, ((t & 15) << 4 | t & 15) / 255) : null) : (t = ec.exec(e)) ? new gc(t[1], t[2], t[3], 1) : (t = tc.exec(e)) ? new gc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, 1) : (t = nc.exec(e)) ? pc(t[1], t[2], t[3], t[4]) : (t = rc.exec(e)) ? pc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, t[4]) : (t = ic.exec(e)) ? Cc(t[1], t[2] / 100, t[3] / 100, 1) : (t = ac.exec(e)) ? Cc(t[1], t[2] / 100, t[3] / 100, t[4]) : oc.hasOwnProperty(e) ? fc(oc[e]) : e === "transparent" ? new gc(NaN, NaN, NaN, 0) : null;
}
function fc(e) {
	return new gc(e >> 16 & 255, e >> 8 & 255, e & 255, 1);
}
function pc(e, t, n, r) {
	return r <= 0 && (e = t = n = NaN), new gc(e, t, n, r);
}
function mc(e) {
	return e instanceof qs || (e = dc(e)), e ? (e = e.rgb(), new gc(e.r, e.g, e.b, e.opacity)) : new gc();
}
function hc(e, t, n, r) {
	return arguments.length === 1 ? mc(e) : new gc(e, t, n, r ?? 1);
}
function gc(e, t, n, r) {
	this.r = +e, this.g = +t, this.b = +n, this.opacity = +r;
}
Gs(gc, hc, Ks(qs, {
	brighter(e) {
		return e = e == null ? Ys : Ys ** +e, new gc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? Js : Js ** +e, new gc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	rgb() {
		return this;
	},
	clamp() {
		return new gc(xc(this.r), xc(this.g), xc(this.b), bc(this.opacity));
	},
	displayable() {
		return -.5 <= this.r && this.r < 255.5 && -.5 <= this.g && this.g < 255.5 && -.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
	},
	hex: _c,
	formatHex: _c,
	formatHex8: vc,
	formatRgb: yc,
	toString: yc
}));
function _c() {
	return `#${Sc(this.r)}${Sc(this.g)}${Sc(this.b)}`;
}
function vc() {
	return `#${Sc(this.r)}${Sc(this.g)}${Sc(this.b)}${Sc((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function yc() {
	let e = bc(this.opacity);
	return `${e === 1 ? "rgb(" : "rgba("}${xc(this.r)}, ${xc(this.g)}, ${xc(this.b)}${e === 1 ? ")" : `, ${e})`}`;
}
function bc(e) {
	return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function xc(e) {
	return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function Sc(e) {
	return e = xc(e), (e < 16 ? "0" : "") + e.toString(16);
}
function Cc(e, t, n, r) {
	return r <= 0 ? e = t = n = NaN : n <= 0 || n >= 1 ? e = t = NaN : t <= 0 && (e = NaN), new Ec(e, t, n, r);
}
function wc(e) {
	if (e instanceof Ec) return new Ec(e.h, e.s, e.l, e.opacity);
	if (e instanceof qs || (e = dc(e)), !e) return new Ec();
	if (e instanceof Ec) return e;
	e = e.rgb();
	var t = e.r / 255, n = e.g / 255, r = e.b / 255, i = Math.min(t, n, r), a = Math.max(t, n, r), o = NaN, s = a - i, c = (a + i) / 2;
	return s ? (o = t === a ? (n - r) / s + (n < r) * 6 : n === a ? (r - t) / s + 2 : (t - n) / s + 4, s /= c < .5 ? a + i : 2 - a - i, o *= 60) : s = c > 0 && c < 1 ? 0 : o, new Ec(o, s, c, e.opacity);
}
function Tc(e, t, n, r) {
	return arguments.length === 1 ? wc(e) : new Ec(e, t, n, r ?? 1);
}
function Ec(e, t, n, r) {
	this.h = +e, this.s = +t, this.l = +n, this.opacity = +r;
}
Gs(Ec, Tc, Ks(qs, {
	brighter(e) {
		return e = e == null ? Ys : Ys ** +e, new Ec(this.h, this.s, this.l * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? Js : Js ** +e, new Ec(this.h, this.s, this.l * e, this.opacity);
	},
	rgb() {
		var e = this.h % 360 + (this.h < 0) * 360, t = isNaN(e) || isNaN(this.s) ? 0 : this.s, n = this.l, r = n + (n < .5 ? n : 1 - n) * t, i = 2 * n - r;
		return new gc(kc(e >= 240 ? e - 240 : e + 120, i, r), kc(e, i, r), kc(e < 120 ? e + 240 : e - 120, i, r), this.opacity);
	},
	clamp() {
		return new Ec(Dc(this.h), Oc(this.s), Oc(this.l), bc(this.opacity));
	},
	displayable() {
		return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
	},
	formatHsl() {
		let e = bc(this.opacity);
		return `${e === 1 ? "hsl(" : "hsla("}${Dc(this.h)}, ${Oc(this.s) * 100}%, ${Oc(this.l) * 100}%${e === 1 ? ")" : `, ${e})`}`;
	}
}));
function Dc(e) {
	return e = (e || 0) % 360, e < 0 ? e + 360 : e;
}
function Oc(e) {
	return Math.max(0, Math.min(1, e || 0));
}
function kc(e, t, n) {
	return (e < 60 ? t + (n - t) * e / 60 : e < 180 ? n : e < 240 ? t + (n - t) * (240 - e) / 60 : t) * 255;
}
//#endregion
//#region node_modules/d3-interpolate/src/constant.js
var Ac = (e) => () => e;
//#endregion
//#region node_modules/d3-interpolate/src/color.js
function jc(e, t) {
	return function(n) {
		return e + n * t;
	};
}
function Mc(e, t, n) {
	return e **= +n, t = t ** +n - e, n = 1 / n, function(r) {
		return (e + r * t) ** +n;
	};
}
function Nc(e) {
	return (e = +e) == 1 ? Pc : function(t, n) {
		return n - t ? Mc(t, n, e) : Ac(isNaN(t) ? n : t);
	};
}
function Pc(e, t) {
	var n = t - e;
	return n ? jc(e, n) : Ac(isNaN(e) ? t : e);
}
//#endregion
//#region node_modules/d3-interpolate/src/rgb.js
var Fc = (function e(t) {
	var n = Nc(t);
	function r(e, t) {
		var r = n((e = hc(e)).r, (t = hc(t)).r), i = n(e.g, t.g), a = n(e.b, t.b), o = Pc(e.opacity, t.opacity);
		return function(t) {
			return e.r = r(t), e.g = i(t), e.b = a(t), e.opacity = o(t), e + "";
		};
	}
	return r.gamma = e, r;
})(1);
//#endregion
//#region node_modules/d3-interpolate/src/numberArray.js
function Ic(e, t) {
	t ||= [];
	var n = e ? Math.min(t.length, e.length) : 0, r = t.slice(), i;
	return function(a) {
		for (i = 0; i < n; ++i) r[i] = e[i] * (1 - a) + t[i] * a;
		return r;
	};
}
function Lc(e) {
	return ArrayBuffer.isView(e) && !(e instanceof DataView);
}
//#endregion
//#region node_modules/d3-interpolate/src/array.js
function Rc(e, t) {
	for (var n = t ? t.length : 0, r = e ? Math.min(n, e.length) : 0, i = Array(r), a = Array(n), o = 0; o < r; ++o) i[o] = qc(e[o], t[o]);
	for (; o < n; ++o) a[o] = t[o];
	return function(e) {
		for (o = 0; o < r; ++o) a[o] = i[o](e);
		return a;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/date.js
function zc(e, t) {
	var n = /* @__PURE__ */ new Date();
	return e = +e, t = +t, function(r) {
		return n.setTime(e * (1 - r) + t * r), n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/number.js
function Bc(e, t) {
	return e = +e, t = +t, function(n) {
		return e * (1 - n) + t * n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/object.js
function Vc(e, t) {
	var n = {}, r = {}, i;
	for (i in (typeof e != "object" || !e) && (e = {}), (typeof t != "object" || !t) && (t = {}), t) i in e ? n[i] = qc(e[i], t[i]) : r[i] = t[i];
	return function(e) {
		for (i in n) r[i] = n[i](e);
		return r;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/string.js
var Hc = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, Uc = new RegExp(Hc.source, "g");
function Wc(e) {
	return function() {
		return e;
	};
}
function Gc(e) {
	return function(t) {
		return e(t) + "";
	};
}
function Kc(e, t) {
	var n = Hc.lastIndex = Uc.lastIndex = 0, r, i, a, o = -1, s = [], c = [];
	for (e += "", t += ""; (r = Hc.exec(e)) && (i = Uc.exec(t));) (a = i.index) > n && (a = t.slice(n, a), s[o] ? s[o] += a : s[++o] = a), (r = r[0]) === (i = i[0]) ? s[o] ? s[o] += i : s[++o] = i : (s[++o] = null, c.push({
		i: o,
		x: Bc(r, i)
	})), n = Uc.lastIndex;
	return n < t.length && (a = t.slice(n), s[o] ? s[o] += a : s[++o] = a), s.length < 2 ? c[0] ? Gc(c[0].x) : Wc(t) : (t = c.length, function(e) {
		for (var n = 0, r; n < t; ++n) s[(r = c[n]).i] = r.x(e);
		return s.join("");
	});
}
//#endregion
//#region node_modules/d3-interpolate/src/value.js
function qc(e, t) {
	var n = typeof t, r;
	return t == null || n === "boolean" ? Ac(t) : (n === "number" ? Bc : n === "string" ? (r = dc(t)) ? (t = r, Fc) : Kc : t instanceof dc ? Fc : t instanceof Date ? zc : Lc(t) ? Ic : Array.isArray(t) ? Rc : typeof t.valueOf != "function" && typeof t.toString != "function" || isNaN(t) ? Vc : Bc)(e, t);
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/decompose.js
var Jc = 180 / Math.PI, Yc = {
	translateX: 0,
	translateY: 0,
	rotate: 0,
	skewX: 0,
	scaleX: 1,
	scaleY: 1
};
function Xc(e, t, n, r, i, a) {
	var o, s, c;
	return (o = Math.sqrt(e * e + t * t)) && (e /= o, t /= o), (c = e * n + t * r) && (n -= e * c, r -= t * c), (s = Math.sqrt(n * n + r * r)) && (n /= s, r /= s, c /= s), e * r < t * n && (e = -e, t = -t, c = -c, o = -o), {
		translateX: i,
		translateY: a,
		rotate: Math.atan2(t, e) * Jc,
		skewX: Math.atan(c) * Jc,
		scaleX: o,
		scaleY: s
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/parse.js
var Zc;
function Qc(e) {
	let t = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(e + "");
	return t.isIdentity ? Yc : Xc(t.a, t.b, t.c, t.d, t.e, t.f);
}
function $c(e) {
	return e == null || (Zc ||= document.createElementNS("http://www.w3.org/2000/svg", "g"), Zc.setAttribute("transform", e), !(e = Zc.transform.baseVal.consolidate())) ? Yc : (e = e.matrix, Xc(e.a, e.b, e.c, e.d, e.e, e.f));
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/index.js
function el(e, t, n, r) {
	function i(e) {
		return e.length ? e.pop() + " " : "";
	}
	function a(e, r, i, a, o, s) {
		if (e !== i || r !== a) {
			var c = o.push("translate(", null, t, null, n);
			s.push({
				i: c - 4,
				x: Bc(e, i)
			}, {
				i: c - 2,
				x: Bc(r, a)
			});
		} else (i || a) && o.push("translate(" + i + t + a + n);
	}
	function o(e, t, n, a) {
		e === t ? t && n.push(i(n) + "rotate(" + t + r) : (e - t > 180 ? t += 360 : t - e > 180 && (e += 360), a.push({
			i: n.push(i(n) + "rotate(", null, r) - 2,
			x: Bc(e, t)
		}));
	}
	function s(e, t, n, a) {
		e === t ? t && n.push(i(n) + "skewX(" + t + r) : a.push({
			i: n.push(i(n) + "skewX(", null, r) - 2,
			x: Bc(e, t)
		});
	}
	function c(e, t, n, r, a, o) {
		if (e !== n || t !== r) {
			var s = a.push(i(a) + "scale(", null, ",", null, ")");
			o.push({
				i: s - 4,
				x: Bc(e, n)
			}, {
				i: s - 2,
				x: Bc(t, r)
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
var tl = el(Qc, "px, ", "px)", "deg)"), nl = el($c, ", ", ")", ")"), rl = 1e-12;
function il(e) {
	return ((e = Math.exp(e)) + 1 / e) / 2;
}
function al(e) {
	return ((e = Math.exp(e)) - 1 / e) / 2;
}
function ol(e) {
	return ((e = Math.exp(2 * e)) - 1) / (e + 1);
}
var sl = (function e(t, n, r) {
	function i(e, i) {
		var a = e[0], o = e[1], s = e[2], c = i[0], l = i[1], u = i[2], d = c - a, f = l - o, p = d * d + f * f, m, h;
		if (p < rl) h = Math.log(u / s) / t, m = function(e) {
			return [
				a + e * d,
				o + e * f,
				s * Math.exp(t * e * h)
			];
		};
		else {
			var g = Math.sqrt(p), _ = (u * u - s * s + r * p) / (2 * s * n * g), v = (u * u - s * s - r * p) / (2 * u * n * g), y = Math.log(Math.sqrt(_ * _ + 1) - _);
			h = (Math.log(Math.sqrt(v * v + 1) - v) - y) / t, m = function(e) {
				var r = e * h, i = il(y), c = s / (n * g) * (i * ol(t * r + y) - al(y));
				return [
					a + c * d,
					o + c * f,
					s * i / il(t * r + y)
				];
			};
		}
		return m.duration = h * 1e3 * t / Math.SQRT2, m;
	}
	return i.rho = function(t) {
		var n = Math.max(.001, +t), r = n * n;
		return e(n, r, r * r);
	}, i;
})(Math.SQRT2, 2, 4), cl = 0, ll = 0, ul = 0, dl = 1e3, fl, pl, ml = 0, hl = 0, gl = 0, _l = typeof performance == "object" && performance.now ? performance : Date, vl = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(e) {
	setTimeout(e, 17);
};
function yl() {
	return hl ||= (vl(bl), _l.now() + gl);
}
function bl() {
	hl = 0;
}
function xl() {
	this._call = this._time = this._next = null;
}
xl.prototype = Sl.prototype = {
	constructor: xl,
	restart: function(e, t, n) {
		if (typeof e != "function") throw TypeError("callback is not a function");
		n = (n == null ? yl() : +n) + (t == null ? 0 : +t), !this._next && pl !== this && (pl ? pl._next = this : fl = this, pl = this), this._call = e, this._time = n, Dl();
	},
	stop: function() {
		this._call && (this._call = null, this._time = Infinity, Dl());
	}
};
function Sl(e, t, n) {
	var r = new xl();
	return r.restart(e, t, n), r;
}
function Cl() {
	yl(), ++cl;
	for (var e = fl, t; e;) (t = hl - e._time) >= 0 && e._call.call(void 0, t), e = e._next;
	--cl;
}
function wl() {
	hl = (ml = _l.now()) + gl, cl = ll = 0;
	try {
		Cl();
	} finally {
		cl = 0, El(), hl = 0;
	}
}
function Tl() {
	var e = _l.now(), t = e - ml;
	t > dl && (gl -= t, ml = e);
}
function El() {
	for (var e, t = fl, n, r = Infinity; t;) t._call ? (r > t._time && (r = t._time), e = t, t = t._next) : (n = t._next, t._next = null, t = e ? e._next = n : fl = n);
	pl = e, Dl(r);
}
function Dl(e) {
	cl || (ll &&= clearTimeout(ll), e - hl > 24 ? (e < Infinity && (ll = setTimeout(wl, e - _l.now() - gl)), ul &&= clearInterval(ul)) : (ul ||= (ml = _l.now(), setInterval(Tl, dl)), cl = 1, vl(wl)));
}
//#endregion
//#region node_modules/d3-timer/src/timeout.js
function Ol(e, t, n) {
	var r = new xl();
	return t = t == null ? 0 : +t, r.restart((n) => {
		r.stop(), e(n + t);
	}, t, n), r;
}
//#endregion
//#region node_modules/d3-transition/src/transition/schedule.js
var kl = Ta("start", "end", "cancel", "interrupt"), Al = [];
function jl(e, t, n, r, i, a) {
	var o = e.__transition;
	if (!o) e.__transition = {};
	else if (n in o) return;
	Fl(e, n, {
		name: t,
		index: r,
		group: i,
		on: kl,
		tween: Al,
		time: a.time,
		delay: a.delay,
		duration: a.duration,
		ease: a.ease,
		timer: null,
		state: 0
	});
}
function Ml(e, t) {
	var n = Pl(e, t);
	if (n.state > 0) throw Error("too late; already scheduled");
	return n;
}
function Nl(e, t) {
	var n = Pl(e, t);
	if (n.state > 3) throw Error("too late; already running");
	return n;
}
function Pl(e, t) {
	var n = e.__transition;
	if (!n || !(n = n[t])) throw Error("transition not found");
	return n;
}
function Fl(e, t, n) {
	var r = e.__transition, i;
	r[t] = n, n.timer = Sl(a, 0, n.time);
	function a(e) {
		n.state = 1, n.timer.restart(o, n.delay, n.time), n.delay <= e && o(e - n.delay);
	}
	function o(a) {
		var l, u, d, f;
		if (n.state !== 1) return c();
		for (l in r) if (f = r[l], f.name === n.name) {
			if (f.state === 3) return Ol(o);
			f.state === 4 ? (f.state = 6, f.timer.stop(), f.on.call("interrupt", e, e.__data__, f.index, f.group), delete r[l]) : +l < t && (f.state = 6, f.timer.stop(), f.on.call("cancel", e, e.__data__, f.index, f.group), delete r[l]);
		}
		if (Ol(function() {
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
function Il(e, t) {
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
function Ll(e) {
	return this.each(function() {
		Il(this, e);
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/tween.js
function Rl(e, t) {
	var n, r;
	return function() {
		var i = Nl(this, e), a = i.tween;
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
function zl(e, t, n) {
	var r, i;
	if (typeof n != "function") throw Error();
	return function() {
		var a = Nl(this, e), o = a.tween;
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
function Bl(e, t) {
	var n = this._id;
	if (e += "", arguments.length < 2) {
		for (var r = Pl(this.node(), n).tween, i = 0, a = r.length, o; i < a; ++i) if ((o = r[i]).name === e) return o.value;
		return null;
	}
	return this.each((t == null ? Rl : zl)(n, e, t));
}
function Vl(e, t, n) {
	var r = e._id;
	return e.each(function() {
		var e = Nl(this, r);
		(e.value ||= {})[t] = n.apply(this, arguments);
	}), function(e) {
		return Pl(e, r).value[t];
	};
}
//#endregion
//#region node_modules/d3-transition/src/transition/interpolate.js
function Hl(e, t) {
	var n;
	return (typeof t == "number" ? Bc : t instanceof dc ? Fc : (n = dc(t)) ? (t = n, Fc) : Kc)(e, t);
}
//#endregion
//#region node_modules/d3-transition/src/transition/attr.js
function Ul(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function Wl(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function Gl(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttribute(e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function Kl(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttributeNS(e.space, e.local);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function ql(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttribute(e) : (o = this.getAttribute(e), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function Jl(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttributeNS(e.space, e.local) : (o = this.getAttributeNS(e.space, e.local), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function Yl(e, t) {
	var n = ja(e), r = n === "transform" ? nl : Hl;
	return this.attrTween(e, typeof t == "function" ? (n.local ? Jl : ql)(n, r, Vl(this, "attr." + e, t)) : t == null ? (n.local ? Wl : Ul)(n) : (n.local ? Kl : Gl)(n, r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/attrTween.js
function Xl(e, t) {
	return function(n) {
		this.setAttribute(e, t.call(this, n));
	};
}
function Zl(e, t) {
	return function(n) {
		this.setAttributeNS(e.space, e.local, t.call(this, n));
	};
}
function Ql(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && Zl(e, i)), n;
	}
	return i._value = t, i;
}
function $l(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && Xl(e, i)), n;
	}
	return i._value = t, i;
}
function eu(e, t) {
	var n = "attr." + e;
	if (arguments.length < 2) return (n = this.tween(n)) && n._value;
	if (t == null) return this.tween(n, null);
	if (typeof t != "function") throw Error();
	var r = ja(e);
	return this.tween(n, (r.local ? Ql : $l)(r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/delay.js
function tu(e, t) {
	return function() {
		Ml(this, e).delay = +t.apply(this, arguments);
	};
}
function nu(e, t) {
	return t = +t, function() {
		Ml(this, e).delay = t;
	};
}
function ru(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? tu : nu)(t, e)) : Pl(this.node(), t).delay;
}
//#endregion
//#region node_modules/d3-transition/src/transition/duration.js
function iu(e, t) {
	return function() {
		Nl(this, e).duration = +t.apply(this, arguments);
	};
}
function au(e, t) {
	return t = +t, function() {
		Nl(this, e).duration = t;
	};
}
function ou(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? iu : au)(t, e)) : Pl(this.node(), t).duration;
}
//#endregion
//#region node_modules/d3-transition/src/transition/ease.js
function su(e, t) {
	if (typeof t != "function") throw Error();
	return function() {
		Nl(this, e).ease = t;
	};
}
function cu(e) {
	var t = this._id;
	return arguments.length ? this.each(su(t, e)) : Pl(this.node(), t).ease;
}
//#endregion
//#region node_modules/d3-transition/src/transition/easeVarying.js
function lu(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		if (typeof n != "function") throw Error();
		Nl(this, e).ease = n;
	};
}
function uu(e) {
	if (typeof e != "function") throw Error();
	return this.each(lu(this._id, e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/filter.js
function du(e) {
	typeof e != "function" && (e = Ua(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Bu(r, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/merge.js
function fu(e) {
	if (e._id !== this._id) throw Error();
	for (var t = this._groups, n = e._groups, r = t.length, i = n.length, a = Math.min(r, i), o = Array(r), s = 0; s < a; ++s) for (var c = t[s], l = n[s], u = c.length, d = o[s] = Array(u), f, p = 0; p < u; ++p) (f = c[p] || l[p]) && (d[p] = f);
	for (; s < r; ++s) o[s] = t[s];
	return new Bu(o, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/on.js
function pu(e) {
	return (e + "").trim().split(/^|\s+/).every(function(e) {
		var t = e.indexOf(".");
		return t >= 0 && (e = e.slice(0, t)), !e || e === "start";
	});
}
function mu(e, t, n) {
	var r, i, a = pu(t) ? Ml : Nl;
	return function() {
		var o = a(this, e), s = o.on;
		s !== r && (i = (r = s).copy()).on(t, n), o.on = i;
	};
}
function hu(e, t) {
	var n = this._id;
	return arguments.length < 2 ? Pl(this.node(), n).on.on(e) : this.each(mu(n, e, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/remove.js
function gu(e) {
	return function() {
		var t = this.parentNode;
		for (var n in this.__transition) if (+n !== e) return;
		t && t.removeChild(this);
	};
}
function _u() {
	return this.on("end.remove", gu(this._id));
}
//#endregion
//#region node_modules/d3-transition/src/transition/select.js
function vu(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = Ia(e));
	for (var r = this._groups, i = r.length, a = Array(i), o = 0; o < i; ++o) for (var s = r[o], c = s.length, l = a[o] = Array(c), u, d, f = 0; f < c; ++f) (u = s[f]) && (d = e.call(u, u.__data__, f, s)) && ("__data__" in u && (d.__data__ = u.__data__), l[f] = d, jl(l[f], t, n, f, l, Pl(u, n)));
	return new Bu(a, this._parents, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selectAll.js
function yu(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = Ba(e));
	for (var r = this._groups, i = r.length, a = [], o = [], s = 0; s < i; ++s) for (var c = r[s], l = c.length, u, d = 0; d < l; ++d) if (u = c[d]) {
		for (var f = e.call(u, u.__data__, d, c), p, m = Pl(u, n), h = 0, g = f.length; h < g; ++h) (p = f[h]) && jl(p, t, n, h, f, m);
		a.push(f), o.push(u);
	}
	return new Bu(a, o, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selection.js
var bu = Ds.prototype.constructor;
function xu() {
	return new bu(this._groups, this._parents);
}
//#endregion
//#region node_modules/d3-transition/src/transition/style.js
function Su(e, t) {
	var n, r, i;
	return function() {
		var a = Po(this, e), o = (this.style.removeProperty(e), Po(this, e));
		return a === o ? null : a === n && o === r ? i : i = t(n = a, r = o);
	};
}
function Cu(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function wu(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = Po(this, e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function Tu(e, t, n) {
	var r, i, a;
	return function() {
		var o = Po(this, e), s = n(this), c = s + "";
		return s ?? (c = s = (this.style.removeProperty(e), Po(this, e))), o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s));
	};
}
function Eu(e, t) {
	var n, r, i, a = "style." + t, o = "end." + a, s;
	return function() {
		var c = Nl(this, e), l = c.on, u = c.value[a] == null ? s ||= Cu(t) : void 0;
		(l !== n || i !== u) && (r = (n = l).copy()).on(o, i = u), c.on = r;
	};
}
function Du(e, t, n) {
	var r = (e += "") == "transform" ? tl : Hl;
	return t == null ? this.styleTween(e, Su(e, r)).on("end.style." + e, Cu(e)) : typeof t == "function" ? this.styleTween(e, Tu(e, r, Vl(this, "style." + e, t))).each(Eu(this._id, e)) : this.styleTween(e, wu(e, r, t), n).on("end.style." + e, null);
}
//#endregion
//#region node_modules/d3-transition/src/transition/styleTween.js
function Ou(e, t, n) {
	return function(r) {
		this.style.setProperty(e, t.call(this, r), n);
	};
}
function ku(e, t, n) {
	var r, i;
	function a() {
		var a = t.apply(this, arguments);
		return a !== i && (r = (i = a) && Ou(e, a, n)), r;
	}
	return a._value = t, a;
}
function Au(e, t, n) {
	var r = "style." + (e += "");
	if (arguments.length < 2) return (r = this.tween(r)) && r._value;
	if (t == null) return this.tween(r, null);
	if (typeof t != "function") throw Error();
	return this.tween(r, ku(e, t, n ?? ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/text.js
function ju(e) {
	return function() {
		this.textContent = e;
	};
}
function Mu(e) {
	return function() {
		var t = e(this);
		this.textContent = t ?? "";
	};
}
function Nu(e) {
	return this.tween("text", typeof e == "function" ? Mu(Vl(this, "text", e)) : ju(e == null ? "" : e + ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/textTween.js
function Pu(e) {
	return function(t) {
		this.textContent = e.call(this, t);
	};
}
function Fu(e) {
	var t, n;
	function r() {
		var r = e.apply(this, arguments);
		return r !== n && (t = (n = r) && Pu(r)), t;
	}
	return r._value = e, r;
}
function Iu(e) {
	var t = "text";
	if (arguments.length < 1) return (t = this.tween(t)) && t._value;
	if (e == null) return this.tween(t, null);
	if (typeof e != "function") throw Error();
	return this.tween(t, Fu(e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/transition.js
function Lu() {
	for (var e = this._name, t = this._id, n = Vu(), r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) if (c = o[l]) {
		var u = Pl(c, t);
		jl(c, e, n, l, o, {
			time: u.time + u.delay + u.duration,
			delay: 0,
			duration: u.duration,
			ease: u.ease
		});
	}
	return new Bu(r, this._parents, e, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/end.js
function Ru() {
	var e, t, n = this, r = n._id, i = n.size();
	return new Promise(function(a, o) {
		var s = { value: o }, c = { value: function() {
			--i === 0 && a();
		} };
		n.each(function() {
			var n = Nl(this, r), i = n.on;
			i !== e && (t = (e = i).copy(), t._.cancel.push(s), t._.interrupt.push(s), t._.end.push(c)), n.on = t;
		}), i === 0 && a();
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/index.js
var zu = 0;
function Bu(e, t, n, r) {
	this._groups = e, this._parents = t, this._name = n, this._id = r;
}
function Vu() {
	return ++zu;
}
var Hu = Ds.prototype;
Bu.prototype = {
	constructor: Bu,
	select: vu,
	selectAll: yu,
	selectChild: Hu.selectChild,
	selectChildren: Hu.selectChildren,
	filter: du,
	merge: fu,
	selection: xu,
	transition: Lu,
	call: Hu.call,
	nodes: Hu.nodes,
	node: Hu.node,
	size: Hu.size,
	empty: Hu.empty,
	each: Hu.each,
	on: hu,
	attr: Yl,
	attrTween: eu,
	style: Du,
	styleTween: Au,
	text: Nu,
	textTween: Iu,
	remove: _u,
	tween: Bl,
	delay: ru,
	duration: ou,
	ease: cu,
	easeVarying: uu,
	end: Ru,
	[Symbol.iterator]: Hu[Symbol.iterator]
};
//#endregion
//#region node_modules/d3-ease/src/cubic.js
function Uu(e) {
	return ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2;
}
//#endregion
//#region node_modules/d3-transition/src/selection/transition.js
var Wu = {
	time: null,
	delay: 0,
	duration: 250,
	ease: Uu
};
function Gu(e, t) {
	for (var n; !(n = e.__transition) || !(n = n[t]);) if (!(e = e.parentNode)) throw Error(`transition ${t} not found`);
	return n;
}
function Ku(e) {
	var t, n;
	e instanceof Bu ? (t = e._id, e = e._name) : (t = Vu(), (n = Wu).time = yl(), e = e == null ? null : e + "");
	for (var r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && jl(c, e, t, l, o, n || Gu(c, t));
	return new Bu(r, this._parents, e, t);
}
Ds.prototype.interrupt = Ll, Ds.prototype.transition = Ku;
//#endregion
//#region node_modules/d3-zoom/src/constant.js
var qu = (e) => () => e;
//#endregion
//#region node_modules/d3-zoom/src/event.js
function Ju(e, { sourceEvent: t, target: n, transform: r, dispatch: i }) {
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
function Yu(e, t, n) {
	this.k = e, this.x = t, this.y = n;
}
Yu.prototype = {
	constructor: Yu,
	scale: function(e) {
		return e === 1 ? this : new Yu(this.k * e, this.x, this.y);
	},
	translate: function(e, t) {
		return e === 0 & t === 0 ? this : new Yu(this.k, this.x + this.k * e, this.y + this.k * t);
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
var Xu = new Yu(1, 0, 0);
Zu.prototype = Yu.prototype;
function Zu(e) {
	for (; !e.__zoom;) if (!(e = e.parentNode)) return Xu;
	return e.__zoom;
}
//#endregion
//#region node_modules/d3-zoom/src/noevent.js
function Qu(e) {
	e.stopImmediatePropagation();
}
function $u(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-zoom/src/zoom.js
function ed(e) {
	return (!e.ctrlKey || e.type === "wheel") && !e.button;
}
function td() {
	var e = this;
	return e instanceof SVGElement ? (e = e.ownerSVGElement || e, e.hasAttribute("viewBox") ? (e = e.viewBox.baseVal, [[e.x, e.y], [e.x + e.width, e.y + e.height]]) : [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]]) : [[0, 0], [e.clientWidth, e.clientHeight]];
}
function nd() {
	return this.__zoom || Xu;
}
function rd(e) {
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * (e.ctrlKey ? 10 : 1);
}
function id() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function ad(e, t, n) {
	var r = e.invertX(t[0][0]) - n[0][0], i = e.invertX(t[1][0]) - n[1][0], a = e.invertY(t[0][1]) - n[0][1], o = e.invertY(t[1][1]) - n[1][1];
	return e.translate(i > r ? (r + i) / 2 : Math.min(0, r) || Math.max(0, i), o > a ? (a + o) / 2 : Math.min(0, a) || Math.max(0, o));
}
function od() {
	var e = ed, t = td, n = ad, r = rd, i = id, a = [0, Infinity], o = [[-Infinity, -Infinity], [Infinity, Infinity]], s = 250, c = sl, l = Ta("start", "zoom", "end"), u, d, f, p = 500, m = 150, h = 0, g = 10;
	function _(e) {
		e.property("__zoom", nd).on("wheel.zoom", w, { passive: !1 }).on("mousedown.zoom", T).on("dblclick.zoom", E).filter(i).on("touchstart.zoom", D).on("touchmove.zoom", ee).on("touchend.zoom touchcancel.zoom", te).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	_.transform = function(e, t, n, r) {
		var i = e.selection ? e.selection() : e;
		i.property("__zoom", nd), e === i ? i.interrupt().each(function() {
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
			return n(Xu.translate(c[0], c[1]).scale(s.k).translate(typeof r == "function" ? -r.apply(this, arguments) : -r, typeof i == "function" ? -i.apply(this, arguments) : -i), e, o);
		}, a, s);
	};
	function v(e, t) {
		return t = Math.max(a[0], Math.min(a[1], t)), t === e.k ? e : new Yu(t, e.x, e.y);
	}
	function y(e, t, n) {
		var r = t[0] - n[0] * e.k, i = t[1] - n[1] * e.k;
		return r === e.x && i === e.y ? e : new Yu(e.k, r, i);
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
					e = new Yu(n, l[0] - t[0] * n, l[1] - t[1] * n);
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
			var t = ks(this.that).datum();
			l.call(e, this.that, new Ju(e, {
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
		var s = S(this, i).event(t), c = this.__zoom, l = Math.max(a[0], Math.min(a[1], c.k * 2 ** r.apply(this, arguments))), u = js(t);
		if (s.wheel) (s.mouse[0][0] !== u[0] || s.mouse[0][1] !== u[1]) && (s.mouse[1] = c.invert(s.mouse[0] = u)), clearTimeout(s.wheel);
		else if (c.k === l) return;
		else s.mouse = [u, c.invert(u)], Il(this), s.start();
		$u(t), s.wheel = setTimeout(d, m), s.zoom("mouse", n(y(v(c, l), s.mouse[0], s.mouse[1]), s.extent, o));
		function d() {
			s.wheel = null, s.end();
		}
	}
	function T(t, ...r) {
		if (f || !e.apply(this, arguments)) return;
		var i = t.currentTarget, a = S(this, r, !0).event(t), s = ks(t.view).on("mousemove.zoom", d, !0).on("mouseup.zoom", p, !0), c = js(t, i), l = t.clientX, u = t.clientY;
		Is(t.view), Qu(t), a.mouse = [c, this.__zoom.invert(c)], Il(this), a.start();
		function d(e) {
			if ($u(e), !a.moved) {
				var t = e.clientX - l, r = e.clientY - u;
				a.moved = t * t + r * r > h;
			}
			a.event(e).zoom("mouse", n(y(a.that.__zoom, a.mouse[0] = js(e, i), a.mouse[1]), a.extent, o));
		}
		function p(e) {
			s.on("mousemove.zoom mouseup.zoom", null), Ls(e.view, a.moved), $u(e), a.event(e).end();
		}
	}
	function E(r, ...i) {
		if (e.apply(this, arguments)) {
			var a = this.__zoom, c = js(r.changedTouches ? r.changedTouches[0] : r, this), l = a.invert(c), u = a.k * (r.shiftKey ? .5 : 2), d = n(y(v(a, u), c, l), t.apply(this, i), o);
			$u(r), s > 0 ? ks(this).transition().duration(s).call(x, d, c, r) : ks(this).call(_.transform, d, c, r);
		}
	}
	function D(t, ...n) {
		if (e.apply(this, arguments)) {
			var r = t.touches, i = r.length, a = S(this, n, t.changedTouches.length === i).event(t), o, s, c, l;
			for (Qu(t), s = 0; s < i; ++s) c = r[s], l = js(c, this), l = [
				l,
				this.__zoom.invert(l),
				c.identifier
			], a.touch0 ? !a.touch1 && a.touch0[2] !== l[2] && (a.touch1 = l, a.taps = 0) : (a.touch0 = l, o = !0, a.taps = 1 + !!u);
			u &&= clearTimeout(u), o && (a.taps < 2 && (d = l[0], u = setTimeout(function() {
				u = null;
			}, p)), Il(this), a.start());
		}
	}
	function ee(e, ...t) {
		if (this.__zooming) {
			var r = S(this, t).event(e), i = e.changedTouches, a = i.length, s, c, l, u;
			for ($u(e), s = 0; s < a; ++s) c = i[s], l = js(c, this), r.touch0 && r.touch0[2] === c.identifier ? r.touch0[0] = l : r.touch1 && r.touch1[2] === c.identifier && (r.touch1[0] = l);
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
			for (Qu(e), f && clearTimeout(f), f = setTimeout(function() {
				f = null;
			}, p), a = 0; a < i; ++a) o = r[a], n.touch0 && n.touch0[2] === o.identifier ? delete n.touch0 : n.touch1 && n.touch1[2] === o.identifier && delete n.touch1;
			if (n.touch1 && !n.touch0 && (n.touch0 = n.touch1, delete n.touch1), n.touch0) n.touch0[1] = this.__zoom.invert(n.touch0[0]);
			else if (n.end(), n.taps === 2 && (o = js(o, this), Math.hypot(d[0] - o[0], d[1] - o[1]) < g)) {
				var s = ks(this).on("dblclick.zoom");
				s && s.apply(this, arguments);
			}
		}
	}
	return _.wheelDelta = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : qu(+e), _) : r;
	}, _.filter = function(t) {
		return arguments.length ? (e = typeof t == "function" ? t : qu(!!t), _) : e;
	}, _.touchable = function(e) {
		return arguments.length ? (i = typeof e == "function" ? e : qu(!!e), _) : i;
	}, _.extent = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : qu([[+e[0][0], +e[0][1]], [+e[1][0], +e[1][1]]]), _) : t;
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
var sd = {
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
}, cd = [[-Infinity, -Infinity], [Infinity, Infinity]], ld = [
	"Enter",
	" ",
	"Escape"
], ud = {
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
}, dd;
(function(e) {
	e.Strict = "strict", e.Loose = "loose";
})(dd ||= {});
var fd;
(function(e) {
	e.Free = "free", e.Vertical = "vertical", e.Horizontal = "horizontal";
})(fd ||= {});
var pd;
(function(e) {
	e.Partial = "partial", e.Full = "full";
})(pd ||= {});
var md = {
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
}, hd;
(function(e) {
	e.Bezier = "default", e.Straight = "straight", e.Step = "step", e.SmoothStep = "smoothstep", e.SimpleBezier = "simplebezier";
})(hd ||= {});
var gd;
(function(e) {
	e.Arrow = "arrow", e.ArrowClosed = "arrowclosed";
})(gd ||= {});
var $;
(function(e) {
	e.Left = "left", e.Top = "top", e.Right = "right", e.Bottom = "bottom";
})($ ||= {});
var _d = {
	[$.Left]: $.Right,
	[$.Right]: $.Left,
	[$.Top]: $.Bottom,
	[$.Bottom]: $.Top
}, vd = (e) => !!e && typeof e == "object" && "id" in e && "source" in e && "target" in e, yd = (e) => !!e && typeof e == "object" && "id" in e && "position" in e && !("source" in e) && !("target" in e), bd = (e) => !!e && typeof e == "object" && "id" in e && "internals" in e && !("source" in e) && !("target" in e), xd = (e, t = [0, 0]) => {
	let { width: n, height: r } = tf(e), i = e.origin ?? t, a = n * i[0], o = r * i[1];
	return {
		x: e.position.x - a,
		y: e.position.y - o
	};
}, Sd = (e, t = { nodeOrigin: [0, 0] }) => {
	if (process.env.NODE_ENV === "development" && !t.nodeLookup && console.warn("Please use `getNodesBounds` from `useReactFlow`/`useSvelteFlow` hook to ensure correct values for sub flows. If not possible, you have to provide a nodeLookup to support sub flows."), e.length === 0) return {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	let n = !1, r = e.reduce((e, r) => {
		let i = typeof r == "string", a = !t.nodeLookup && !i ? r : void 0;
		return t.nodeLookup && (a = i ? t.nodeLookup.get(r) : bd(r) ? r : t.nodeLookup.get(r.id)), a ? (n = !0, Fd(e, zd(a, t.nodeOrigin))) : e;
	}, {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	});
	return n ? Ld(r) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, Cd = (e, t = {}) => {
	let n = {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	}, r = !1;
	return e.forEach((e) => {
		(t.filter === void 0 || t.filter(e)) && (n = Fd(n, zd(e)), r = !0);
	}), r ? Ld(n) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, wd = (e, t, [n, r, i] = [
	0,
	0,
	1
], a = !1, o = !1) => {
	let s = (t.x - n) / i, c = (t.y - r) / i, l = t.width / i, u = t.height / i, d = [];
	for (let t of e.values()) {
		let { measured: e, selectable: n = !0, hidden: r = !1 } = t;
		if (o && !n || r) continue;
		let i = e.width ?? t.width ?? t.initialWidth ?? 0, f = e.height ?? t.height ?? t.initialHeight ?? 0, { x: p, y: m } = t.internals.positionAbsolute, h = Vd(s, c, l, u, p, m, i, f), g = i * f, _ = a && h > 0;
		(!t.internals.handleBounds || _ || h >= g || t.dragging) && d.push(t);
	}
	return d;
}, Td = (e, t) => {
	let n = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		n.add(e.id);
	}), t.filter((e) => n.has(e.source) || n.has(e.target));
};
function Ed(e, t) {
	let n = /* @__PURE__ */ new Map(), r = t?.nodes ? new Set(t.nodes.map((e) => e.id)) : null;
	return e.forEach((e) => {
		let i;
		if (t?.includeHiddenNodes) {
			let { width: t, height: n } = tf(e);
			i = t > 0 && n > 0;
		} else i = !!(e.measured.width && e.measured.height && !e.hidden);
		i && (!r || r.has(e.id)) && n.set(e.id, e);
	}), n;
}
async function Dd({ nodes: e, width: t, height: n, panZoom: r, minZoom: i, maxZoom: a }, o) {
	if (e.size === 0) return !0;
	let s = Qd(Cd(Ed(e, o)), t, n, o?.minZoom ?? i, o?.maxZoom ?? a, o?.padding ?? .1);
	return await r.setViewport(s, {
		duration: o?.duration,
		ease: o?.ease,
		interpolate: o?.interpolate
	}), !0;
}
function Od({ nodeId: e, nextPosition: t, nodeLookup: n, nodeOrigin: r = [0, 0], nodeExtent: i, onError: a }) {
	let o = n.get(e), s = o.parentId ? n.get(o.parentId) : void 0, { x: c, y: l } = s ? s.internals.positionAbsolute : {
		x: 0,
		y: 0
	}, u = o.origin ?? r, d = o.extent || i;
	if (o.extent === "parent" && !o.expandParent) {
		if (!s) a?.("005", sd.error005());
		else {
			let { width: e, height: t } = tf(s);
			e && t && (d = [[c, l], [c + e, l + t]]);
		}
	} else s && ef(o.extent) && (d = [[o.extent[0][0] + c, o.extent[0][1] + l], [o.extent[1][0] + c, o.extent[1][1] + l]]);
	let f = ef(d) ? jd(t, d, o.measured) : t;
	return (o.measured.width === void 0 || o.measured.height === void 0) && a?.("015", sd.error015()), {
		position: {
			x: f.x - c + (o.measured.width ?? 0) * u[0],
			y: f.y - l + (o.measured.height ?? 0) * u[1]
		},
		positionAbsolute: f
	};
}
async function kd({ nodesToRemove: e = [], edgesToRemove: t = [], nodes: n, edges: r, onBeforeDelete: i }) {
	let a = new Set(e.map((e) => e.id)), o = [];
	for (let e of n) {
		if (e.deletable === !1) continue;
		let t = a.has(e.id), n = !t && e.parentId && o.find((t) => t.id === e.parentId);
		(t || n) && o.push(e);
	}
	let s = new Set(t.map((e) => e.id)), c = r.filter((e) => e.deletable !== !1), l = Td(o, c);
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
var Ad = (e, t = 0, n = 1) => Math.min(Math.max(e, t), n), jd = (e = {
	x: 0,
	y: 0
}, t, n) => ({
	x: Ad(e.x, t[0][0], t[1][0] - (n?.width ?? 0)),
	y: Ad(e.y, t[0][1], t[1][1] - (n?.height ?? 0))
});
function Md(e, t, n) {
	let { width: r, height: i } = tf(n), { x: a, y: o } = n.internals.positionAbsolute;
	return jd(e, [[a, o], [a + r, o + i]], t);
}
var Nd = (e, t, n) => e < t ? Ad(Math.abs(e - t), 1, t) / t : e > n ? -Ad(Math.abs(e - n), 1, t) / t : 0, Pd = (e, t, n = 15, r = 40) => [Nd(e.x, r, t.width - r) * n, Nd(e.y, r, t.height - r) * n], Fd = (e, t) => ({
	x: Math.min(e.x, t.x),
	y: Math.min(e.y, t.y),
	x2: Math.max(e.x2, t.x2),
	y2: Math.max(e.y2, t.y2)
}), Id = ({ x: e, y: t, width: n, height: r }) => ({
	x: e,
	y: t,
	x2: e + n,
	y2: t + r
}), Ld = ({ x: e, y: t, x2: n, y2: r }) => ({
	x: e,
	y: t,
	width: n - e,
	height: r - t
}), Rd = (e, t = [0, 0]) => {
	let { x: n, y: r } = bd(e) ? e.internals.positionAbsolute : xd(e, t);
	return {
		x: n,
		y: r,
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}, zd = (e, t = [0, 0]) => {
	let { x: n, y: r } = bd(e) ? e.internals.positionAbsolute : xd(e, t);
	return {
		x: n,
		y: r,
		x2: n + (e.measured?.width ?? e.width ?? e.initialWidth ?? 0),
		y2: r + (e.measured?.height ?? e.height ?? e.initialHeight ?? 0)
	};
}, Bd = (e, t) => Ld(Fd(Id(e), Id(t))), Vd = (e, t, n, r, i, a, o, s) => {
	let c = Math.max(0, Math.min(e + n, i + o) - Math.max(e, i)), l = Math.max(0, Math.min(t + r, a + s) - Math.max(t, a));
	return Math.ceil(c * l);
}, Hd = (e, t) => Vd(e.x, e.y, e.width, e.height, t.x, t.y, t.width, t.height), Ud = (e) => Wd(e.width) && Wd(e.height) && Wd(e.x) && Wd(e.y), Wd = (e) => !isNaN(e) && isFinite(e), Gd = (e, t) => (n, r) => {
	process.env.NODE_ENV === "development" && console.warn(`[${e}]: ${r} Help: ${t}error#${n}`);
}, Kd = (e, t = [1, 1]) => ({
	x: t[0] * Math.round(e.x / t[0]),
	y: t[1] * Math.round(e.y / t[1])
}), qd = ({ x: e, y: t }, [n, r, i], a = !1, o = [1, 1]) => {
	let s = {
		x: (e - n) / i,
		y: (t - r) / i
	};
	return a ? Kd(s, o) : s;
}, Jd = ({ x: e, y: t }, [n, r, i]) => ({
	x: e * i + n,
	y: t * i + r
});
function Yd(e, t) {
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
function Xd(e, t, n) {
	if (typeof e == "string" || typeof e == "number") {
		let r = Yd(e, n), i = Yd(e, t);
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
		let r = Yd(e.top ?? e.y ?? 0, n), i = Yd(e.bottom ?? e.y ?? 0, n), a = Yd(e.left ?? e.x ?? 0, t), o = Yd(e.right ?? e.x ?? 0, t);
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
function Zd(e, t, n, r, i, a) {
	let { x: o, y: s } = Jd(e, [
		t,
		n,
		r
	]), { x: c, y: l } = Jd({
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
var Qd = (e, t, n, r, i, a) => {
	let o = Xd(a, t, n), s = (t - o.x) / e.width, c = (n - o.y) / e.height, l = Ad(Math.min(s, c), r, i), u = e.x + e.width / 2, d = e.y + e.height / 2, f = t / 2 - u * l, p = n / 2 - d * l, m = Zd(e, f, p, l, t, n), h = {
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
}, $d = () => typeof navigator < "u" && navigator?.userAgent?.indexOf("Mac") >= 0;
function ef(e) {
	return e != null && e !== "parent";
}
function tf(e) {
	return {
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}
function nf(e) {
	return (e.measured?.width ?? e.width ?? e.initialWidth) !== void 0 && (e.measured?.height ?? e.height ?? e.initialHeight) !== void 0;
}
function rf(e, t = {
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
function af(e) {
	return {
		...ud,
		...e || {}
	};
}
function of(e) {
	if (typeof document > "u") return !0;
	let t = document.querySelector(`.${e}-flow__pane`);
	if (!t || !t.isConnected) return !0;
	let n = getComputedStyle(t);
	if (n.display === "none" || n.visibility === "hidden" || n.visibility === "collapse" || n.opacity === "0" || n.width === "0" && n.height === "0") return !0;
	let r = t.getBoundingClientRect();
	if (r.width === 0 && r.height === 0) return !0;
	let i = document.querySelector(`.${e}-flow__attribution`);
	if (!i || !i.isConnected) return !1;
	let a = getComputedStyle(i);
	if (a.display === "none" || a.visibility === "hidden" || a.visibility === "collapse" || a.opacity === "0") return !1;
	let o = i.getBoundingClientRect();
	return o.width !== 0 || o.height !== 0;
}
var sf = !1;
function cf(e) {
	if (sf || process.env.NODE_ENV !== "development") return;
	sf = !0;
	let t = `${e.charAt(0).toUpperCase() + e.slice(1)} Flow`;
	setTimeout(() => {
		of(e) || console.warn(`${t}: It seems like you are hiding the attribution. Please only do this when you are subscribed to ${t} Pro: https://${e}flow.dev/remove-attr\n%cYou can ignore this warning if you are subscribed.`, "font-style: italic;");
	}, 1e3);
}
function lf(e, t) {
	if (!e && !t) return !0;
	if (!e || !t || e.size !== t.size) return !1;
	if (!e.size && !t.size) return !0;
	for (let n of e.keys()) if (!t.has(n)) return !1;
	return !0;
}
function uf(e, t, n) {
	if (!n) return;
	let r = [];
	e.forEach((e, n) => {
		t?.has(n) || r.push(e);
	}), r.length && n(r);
}
function df(e) {
	return e === null ? null : e ? "valid" : "invalid";
}
function ff(e, { snapGrid: t = [0, 0], snapToGrid: n = !1, transform: r, containerBounds: i }) {
	let { x: a, y: o } = vf(e), s = qd({
		x: a - (i?.left ?? 0),
		y: o - (i?.top ?? 0)
	}, r), { x: c, y: l } = n ? Kd(s, t) : s;
	return {
		xSnapped: c,
		ySnapped: l,
		...s
	};
}
var pf = (e) => ({
	width: e.offsetWidth,
	height: e.offsetHeight
}), mf = (e) => e?.getRootNode?.() || window?.document, hf = [
	"INPUT",
	"SELECT",
	"TEXTAREA"
];
function gf(e) {
	let t = e.composedPath?.()?.[0] || e.target;
	return t?.nodeType === 1 ? hf.includes(t.nodeName) || t.hasAttribute("contenteditable") || !!t.closest(".nokey") : !1;
}
var _f = (e) => "clientX" in e, vf = (e, t) => {
	let n = _f(e), r = n ? e.clientX : e.touches?.[0].clientX, i = n ? e.clientY : e.touches?.[0].clientY;
	return {
		x: r - (t?.left ?? 0),
		y: i - (t?.top ?? 0)
	};
}, yf = (e, t, n, r, i) => {
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
			...pf(t)
		};
	});
};
function bf({ sourceX: e, sourceY: t, targetX: n, targetY: r, sourceControlX: i, sourceControlY: a, targetControlX: o, targetControlY: s }) {
	let c = e * .125 + i * .375 + o * .375 + n * .125, l = t * .125 + a * .375 + s * .375 + r * .125;
	return [
		c,
		l,
		Math.abs(c - e),
		Math.abs(l - t)
	];
}
function xf(e, t) {
	return e >= 0 ? .5 * e : t * 25 * Math.sqrt(-e);
}
function Sf({ pos: e, x1: t, y1: n, x2: r, y2: i, c: a }) {
	switch (e) {
		case $.Left: return [t - xf(t - r, a), n];
		case $.Right: return [t + xf(r - t, a), n];
		case $.Top: return [t, n - xf(n - i, a)];
		case $.Bottom: return [t, n + xf(i - n, a)];
	}
}
function Cf({ sourceX: e, sourceY: t, sourcePosition: n = $.Bottom, targetX: r, targetY: i, targetPosition: a = $.Top, curvature: o = .25 }) {
	let [s, c] = Sf({
		pos: n,
		x1: e,
		y1: t,
		x2: r,
		y2: i,
		c: o
	}), [l, u] = Sf({
		pos: a,
		x1: r,
		y1: i,
		x2: e,
		y2: t,
		c: o
	}), [d, f, p, m] = bf({
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
function wf({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let i = Math.abs(n - e) / 2, a = n < e ? n + i : n - i, o = Math.abs(r - t) / 2;
	return [
		a,
		r < t ? r + o : r - o,
		i,
		o
	];
}
function Tf({ sourceNode: e, targetNode: t, selected: n = !1, zIndex: r = 0, elevateOnSelect: i = !1, zIndexMode: a = "basic" }) {
	return a === "manual" ? r : (i && n ? r + 1e3 : r) + Math.max(e.parentId || i && e.selected ? e.internals.z : 0, t.parentId || i && t.selected ? t.internals.z : 0);
}
function Ef({ sourceNode: e, targetNode: t, width: n, height: r, transform: i }) {
	let a = Fd(zd(e), zd(t));
	return a.x === a.x2 && (a.x2 += 1), a.y === a.y2 && (a.y2 += 1), Hd({
		x: -i[0] / i[2],
		y: -i[1] / i[2],
		width: n / i[2],
		height: r / i[2]
	}, Ld(a)) > 0;
}
var Df = ({ source: e, sourceHandle: t, target: n, targetHandle: r }) => `xy-edge__${e}${t || ""}-${n}${r || ""}`, Of = (e, t) => t.some((t) => t.source === e.source && t.target === e.target && (t.sourceHandle === e.sourceHandle || !t.sourceHandle && !e.sourceHandle) && (t.targetHandle === e.targetHandle || !t.targetHandle && !e.targetHandle)), kf = (e, t, n = {}) => {
	if (!e.source || !e.target) return n.onError?.("006", sd.error006()), t;
	let r = n.getEdgeId || Df, i;
	return i = vd(e) ? { ...e } : {
		...e,
		id: r(e)
	}, Of(i, t) ? t : (i.sourceHandle === null && delete i.sourceHandle, i.targetHandle === null && delete i.targetHandle, t.concat(i));
};
function Af({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let [i, a, o, s] = wf({
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
var jf = {
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
}, Mf = ({ source: e, sourcePosition: t = $.Bottom, target: n }) => t === $.Left || t === $.Right ? e.x < n.x ? {
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
}, Nf = (e, t) => Math.sqrt((t.x - e.x) ** 2 + (t.y - e.y) ** 2);
function Pf({ source: e, sourcePosition: t = $.Bottom, target: n, targetPosition: r = $.Top, center: i, offset: a, stepPosition: o }) {
	let s = jf[t], c = jf[r], l = {
		x: e.x + s.x * a,
		y: e.y + s.y * a
	}, u = {
		x: n.x + c.x * a,
		y: n.y + c.y * a
	}, d = Mf({
		source: l,
		sourcePosition: t,
		target: u
	}), f = d.x === 0 ? "y" : "x", p = d[f], m = [], h, g, _ = {
		x: 0,
		y: 0
	}, v = {
		x: 0,
		y: 0
	}, [, , y, b] = wf({
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
function Ff(e, t, n, r) {
	let i = Math.min(Nf(e, t) / 2, Nf(t, n) / 2, r), { x: a, y: o } = t;
	if (e.x === a && a === n.x || e.y === o && o === n.y) return `L${a} ${o}`;
	if (e.y === o) {
		let t = e.x < n.x ? -1 : 1, r = e.y < n.y ? 1 : -1;
		return `L ${a + i * t},${o}Q ${a},${o} ${a},${o + i * r}`;
	}
	let s = e.x < n.x ? 1 : -1;
	return `L ${a},${o + i * (e.y < n.y ? -1 : 1)}Q ${a},${o} ${a + i * s},${o}`;
}
function If({ sourceX: e, sourceY: t, sourcePosition: n = $.Bottom, targetX: r, targetY: i, targetPosition: a = $.Top, borderRadius: o = 5, centerX: s, centerY: c, offset: l = 20, stepPosition: u = .5 }) {
	let [d, f, p, m, h] = Pf({
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
	for (let e = 1; e < d.length - 1; e++) g += Ff(d[e - 1], d[e], d[e + 1], o);
	return g += `L${d[d.length - 1].x} ${d[d.length - 1].y}`, [
		g,
		f,
		p,
		m,
		h
	];
}
function Lf(e) {
	return e && !!(e.internals.handleBounds || e.handles?.length) && !!(e.measured.width || e.width || e.initialWidth);
}
function Rf(e) {
	let { sourceNode: t, targetNode: n } = e;
	if (!Lf(t) || !Lf(n)) return null;
	let r = t.internals.handleBounds || zf(t.handles), i = n.internals.handleBounds || zf(n.handles), a = Vf(r?.source ?? [], e.sourceHandle), o = Vf(e.connectionMode === dd.Strict ? i?.target ?? [] : (i?.target ?? []).concat(i?.source ?? []), e.targetHandle);
	if (!a || !o) return e.onError?.("008", sd.error008(a ? "target" : "source", {
		id: e.id,
		sourceHandle: e.sourceHandle,
		targetHandle: e.targetHandle
	})), null;
	let s = a?.position || $.Bottom, c = o?.position || $.Top, l = Bf(t, a, s), u = Bf(n, o, c);
	return {
		sourceX: l.x,
		sourceY: l.y,
		targetX: u.x,
		targetY: u.y,
		sourcePosition: s,
		targetPosition: c
	};
}
function zf(e) {
	if (!e) return null;
	let t = [], n = [];
	for (let r of e) r.width = r.width ?? 1, r.height = r.height ?? 1, r.type === "source" ? t.push(r) : r.type === "target" && n.push(r);
	return {
		source: t,
		target: n
	};
}
function Bf(e, t, n = $.Left, r = !1) {
	let i = (t?.x ?? 0) + e.internals.positionAbsolute.x, a = (t?.y ?? 0) + e.internals.positionAbsolute.y, { width: o, height: s } = t ?? tf(e);
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
function Vf(e, t) {
	return e && (t ? e.find((e) => e.id === t) : e[0]) || null;
}
function Hf(e, t) {
	return e ? typeof e == "string" ? e : `${t ? `${t}__` : ""}${Object.keys(e).sort().map((t) => `${t}=${e[t]}`).join("&")}` : "";
}
function Uf(e, { id: t, defaultColor: n, defaultMarkerStart: r, defaultMarkerEnd: i }) {
	let a = /* @__PURE__ */ new Set();
	return e.reduce((e, o) => ([o.markerStart || r, o.markerEnd || i].forEach((r) => {
		if (r && typeof r == "object") {
			let i = Hf(r, t);
			a.has(i) || (e.push({
				id: i,
				color: r.color || n,
				...r
			}), a.add(i));
		}
	}), e), []).sort((e, t) => e.id.localeCompare(t.id));
}
var Wf = 1e3, Gf = 10, Kf = {
	nodeOrigin: [0, 0],
	nodeExtent: cd,
	elevateNodesOnSelect: !0,
	zIndexMode: "basic",
	defaults: {}
}, qf = {
	...Kf,
	checkEquality: !0
};
function Jf(e, t) {
	let n = { ...e };
	for (let e in t) t[e] !== void 0 && (n[e] = t[e]);
	return n;
}
function Yf(e, t, n) {
	let r = Jf(Kf, n);
	for (let n of e.values()) if (n.parentId) ep(n, e, t, r);
	else {
		let e = jd(xd(n, r.nodeOrigin), ef(n.extent) ? n.extent : r.nodeExtent, tf(n));
		n.internals.positionAbsolute = e;
	}
}
function Xf(e, t) {
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
function Zf(e) {
	return e === "manual";
}
function Qf(e, t, n, r = {}) {
	let i = Jf(qf, r), a = { i: 0 }, o = new Map(t), s = i?.elevateNodesOnSelect && !Zf(i.zIndexMode) ? Wf : 0, c = e.length > 0, l = !1;
	t.clear(), n.clear();
	for (let u of e) {
		let e = o.get(u.id);
		if (i.checkEquality && u === e?.internals.userNode) t.set(u.id, e);
		else {
			let n = jd(xd(u, i.nodeOrigin), ef(u.extent) ? u.extent : i.nodeExtent, tf(u));
			e = {
				...i.defaults,
				...u,
				measured: {
					width: u.measured?.width,
					height: u.measured?.height
				},
				internals: {
					positionAbsolute: n,
					handleBounds: Xf(u, e),
					z: tp(u, s, i.zIndexMode),
					userNode: u
				}
			}, t.set(u.id, e);
		}
		(e.measured === void 0 || e.measured.width === void 0 || e.measured.height === void 0) && !e.hidden && (c = !1), u.parentId && ep(e, t, n, r, a), l ||= u.selected ?? !1;
	}
	return {
		nodesInitialized: c,
		hasSelectedNodes: l
	};
}
function $f(e, t) {
	if (!e.parentId) return;
	let n = t.get(e.parentId);
	n ? n.set(e.id, e) : t.set(e.parentId, /* @__PURE__ */ new Map([[e.id, e]]));
}
function ep(e, t, n, r, i) {
	let { elevateNodesOnSelect: a, nodeOrigin: o, nodeExtent: s, zIndexMode: c } = Jf(Kf, r), l = e.parentId, u = t.get(l);
	if (!u) {
		console.warn(`Parent node ${l} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
		return;
	}
	$f(e, n), i && !u.parentId && u.internals.rootParentIndex === void 0 && c === "auto" && (u.internals.rootParentIndex = ++i.i, u.internals.z = u.internals.z + i.i * Gf), i && u.internals.rootParentIndex !== void 0 && (i.i = u.internals.rootParentIndex);
	let { x: d, y: f, z: p } = np(e, u, o, s, a && !Zf(c) ? Wf : 0, c), { positionAbsolute: m } = e.internals, h = d !== m.x || f !== m.y;
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
function tp(e, t, n) {
	let r = Wd(e.zIndex) ? e.zIndex : 0;
	return Zf(n) ? r : r + (e.selected ? t : 0);
}
function np(e, t, n, r, i, a) {
	let { x: o, y: s } = t.internals.positionAbsolute, c = tf(e), l = xd(e, n), u = ef(e.extent) ? jd(l, e.extent, c) : l, d = jd({
		x: o + u.x,
		y: s + u.y
	}, r, c);
	e.extent === "parent" && (d = Md(d, c, t));
	let f = tp(e, i, a), p = t.internals.z ?? 0;
	return {
		x: d.x,
		y: d.y,
		z: p >= f ? p + 1 : f
	};
}
function rp(e, t, n, r = [0, 0]) {
	let i = [], a = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.parentId);
		if (!e) continue;
		let r = Bd(a.get(n.parentId)?.expandedRect ?? Rd(e), n.rect);
		a.set(n.parentId, {
			expandedRect: r,
			parent: e
		});
	}
	return a.size > 0 && a.forEach(({ expandedRect: t, parent: a }, o) => {
		let s = a.internals.positionAbsolute, c = tf(a), l = a.origin ?? r, u = t.x < s.x ? Math.round(Math.abs(s.x - t.x)) : 0, d = t.y < s.y ? Math.round(Math.abs(s.y - t.y)) : 0, f = Math.max(c.width, Math.round(t.width)), p = Math.max(c.height, Math.round(t.height)), m = (f - c.width) * l[0], h = (p - c.height) * l[1];
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
function ip(e, t, n, r, i, a, o) {
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
		let s = pf(r.nodeElement), u = e.measured.width !== s.width || e.measured.height !== s.height;
		if (s.width && s.height && (u || !e.internals.handleBounds || r.force)) {
			let p = r.nodeElement.getBoundingClientRect(), m = ef(e.extent) ? e.extent : a, { positionAbsolute: h } = e.internals;
			if (e.parentId && e.extent === "parent") {
				let n = t.get(e.parentId);
				n && (h = Md(h, s, n));
			} else m && (h = jd(h, m, s));
			let g = {
				...e,
				measured: s,
				internals: {
					...e.internals,
					positionAbsolute: h,
					handleBounds: {
						source: yf("source", r.nodeElement, p, d, e.id),
						target: yf("target", r.nodeElement, p, d, e.id)
					}
				}
			};
			t.set(e.id, g), e.parentId && ep(g, t, n, {
				nodeOrigin: i,
				zIndexMode: o
			}), c = !0, u && (l.push({
				id: e.id,
				type: "dimensions",
				dimensions: s
			}), e.expandParent && e.parentId && f.push({
				id: e.id,
				parentId: e.parentId,
				rect: Rd(g, i)
			}));
		}
	}
	if (f.length > 0) {
		let e = rp(f, t, n, i);
		l.push(...e);
	}
	return {
		changes: l,
		updatedInternals: c
	};
}
async function ap({ delta: e, panZoom: t, transform: n, translateExtent: r, width: i, height: a }) {
	if (!t || !e.x && !e.y) return !1;
	let o = await t.setViewportConstrained({
		x: n[0] + e.x,
		y: n[1] + e.y,
		zoom: n[2]
	}, [[0, 0], [i, a]], r);
	return !!o && (o.x !== n[0] || o.y !== n[1] || o.k !== n[2]);
}
function op(e, t, n, r, i, a) {
	let o = i, s = r.get(o) || /* @__PURE__ */ new Map();
	r.set(o, s.set(n, t)), o = `${i}-${e}`;
	let c = r.get(o) || /* @__PURE__ */ new Map();
	if (r.set(o, c.set(n, t)), a) {
		o = `${i}-${e}-${a}`;
		let s = r.get(o) || /* @__PURE__ */ new Map();
		r.set(o, s.set(n, t));
	}
}
function sp(e, t, n) {
	e.clear(), t.clear();
	for (let r of n) {
		let { source: n, target: i, sourceHandle: a = null, targetHandle: o = null } = r, s = {
			edgeId: r.id,
			source: n,
			target: i,
			sourceHandle: a,
			targetHandle: o
		}, c = `${n}-${a}--${i}-${o}`;
		op("source", s, `${i}-${o}--${n}-${a}`, e, n, a), op("target", s, c, e, i, o), t.set(r.id, r);
	}
}
function cp(e, t) {
	if (!e.parentId) return !1;
	let n = t.get(e.parentId);
	return n ? n.selected ? !0 : cp(n, t) : !1;
}
function lp(e, t, n) {
	let r = e;
	do {
		if (r?.matches?.(t)) return !0;
		if (r === n) return !1;
		r = r?.parentElement;
	} while (r);
	return !1;
}
function up(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let [a, o] of e) if ((o.selected || o.id === r) && (!o.parentId || !cp(o, e)) && (o.draggable || t && o.draggable === void 0)) {
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
function dp({ nodeId: e, dragItems: t, nodeLookup: n, dragging: r = !0 }) {
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
function fp({ dragItems: e, snapGrid: t, x: n, y: r }) {
	let i = e.values().next().value;
	if (!i) return null;
	let a = {
		x: n - i.distance.x,
		y: r - i.distance.y
	}, o = Kd(a, t);
	return {
		x: o.x - a.x,
		y: o.y - a.y
	};
}
function pp({ onNodeMouseDown: e, getStoreItems: t, onDragStart: n, onDrag: r, onDragStop: i }) {
	let a = {
		x: null,
		y: null
	}, o = 0, s = /* @__PURE__ */ new Map(), c = !1, l = {
		x: 0,
		y: 0
	}, u = null, d = !1, f = null, p = !1, m = !1, h = null;
	function g({ noDragClassName: g, handleSelector: _, domNode: v, isSelectable: y, nodeId: b, nodeClickDistance: x = 0 }) {
		f = ks(v);
		function S({ x: e, y: n }) {
			let { nodeLookup: i, nodeExtent: o, snapGrid: c, snapToGrid: l, nodeOrigin: u, onNodeDrag: d, onSelectionDrag: f, onError: p, updateNodePositions: g } = t();
			a = {
				x: e,
				y: n
			};
			let _ = !1, v = s.size > 1, y = v && o ? Id(Cd(s)) : null, x = v && l ? fp({
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
				} : Kd(a, c));
				let s = null;
				if (v && o && !r.extent && y) {
					let { positionAbsolute: e } = r.internals, t = e.x - y.x + o[0][0], n = e.x + r.measured.width - y.x2 + o[1][0], i = e.y - y.y + o[0][1], a = e.y + r.measured.height - y.y2 + o[1][1];
					s = [[t, i], [n, a]];
				}
				let { position: d, positionAbsolute: f } = Od({
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
				let [e, t] = dp({
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
			let [s, d] = Pd(l, u, r);
			(s !== 0 || d !== 0) && (a.x = (a.x ?? 0) - s / e[2], a.y = (a.y ?? 0) - d / e[2], await n({
				x: s,
				y: d
			}) && S(a)), o = requestAnimationFrame(C);
		}
		function w(r) {
			let { nodeLookup: i, multiSelectionActive: o, nodesDraggable: c, transform: l, snapGrid: f, snapToGrid: p, selectNodesOnDrag: m, onNodeDragStart: h, onSelectionDragStart: g, unselectNodesAndEdges: _ } = t();
			d = !0, (!m || !y) && !o && b && (i.get(b)?.selected || _()), y && m && b && e?.(b);
			let v = ff(r.sourceEvent, {
				transform: l,
				snapGrid: f,
				snapToGrid: p,
				containerBounds: u
			});
			if (a = v, s = up(i, c, v, b), s.size > 0 && (n || h || !b && g)) {
				let [e, t] = dp({
					nodeId: b,
					dragItems: s,
					nodeLookup: i
				});
				n?.(r.sourceEvent, s, e, t), h?.(r.sourceEvent, e, t), b || g?.(r.sourceEvent, t);
			}
		}
		let T = Ws().clickDistance(x).on("start", (e) => {
			let { domNode: n, nodeDragThreshold: r, transform: i, snapGrid: o, snapToGrid: s } = t();
			u = n?.getBoundingClientRect() || null, p = !1, m = !1, h = e.sourceEvent, r === 0 && w(e), a = ff(e.sourceEvent, {
				transform: i,
				snapGrid: o,
				snapToGrid: s,
				containerBounds: u
			}), l = vf(e.sourceEvent, u);
		}).on("drag", (e) => {
			let { autoPanOnNodeDrag: n, transform: r, snapGrid: i, snapToGrid: o, nodeDragThreshold: f, nodeLookup: m } = t(), g = ff(e.sourceEvent, {
				transform: r,
				snapGrid: i,
				snapToGrid: o,
				containerBounds: u
			});
			if (h = e.sourceEvent, (e.sourceEvent.type === "touchmove" && e.sourceEvent.touches.length > 1 || b && !m.has(b)) && (p = !0), !p) {
				if (!c && n && d && (c = !0, C()), !d) {
					let t = vf(e.sourceEvent, u), n = t.x - l.x, r = t.y - l.y;
					Math.sqrt(n * n + r * r) > f && w(e);
				}
				(a.x !== g.xSnapped || a.y !== g.ySnapped) && s && d && (l = vf(e.sourceEvent, u), S(g));
			}
		}).on("end", (e) => {
			if (!d || p) {
				p && s.size > 0 && t().updateNodePositions(s, !1);
				return;
			}
			if (c = !1, d = !1, cancelAnimationFrame(o), s.size > 0) {
				let { nodeLookup: n, updateNodePositions: r, onNodeDragStop: a, onSelectionDragStop: o } = t();
				if (m &&= (r(s, !1), !1), i || a || !b && o) {
					let [t, r] = dp({
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
			return !e.button && (!g || !lp(t, `.${g}`, v)) && (!_ || lp(t, _, v));
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
function mp(e, t, n) {
	let r = [], i = {
		x: e.x - n,
		y: e.y - n,
		width: n * 2,
		height: n * 2
	};
	for (let e of t.values()) Hd(i, Rd(e)) > 0 && r.push(e);
	return r;
}
var hp = 250;
function gp(e, t, n, r) {
	let i = [], a = Infinity, o = mp(e, n, t + hp);
	for (let n of o) {
		let o = [...n.internals.handleBounds?.source ?? [], ...n.internals.handleBounds?.target ?? []];
		for (let s of o) {
			if (r.nodeId === s.nodeId && r.type === s.type && r.id === s.id) continue;
			let { x: o, y: c } = Bf(n, s, s.position, !0), l = Math.sqrt((o - e.x) ** 2 + (c - e.y) ** 2);
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
function _p(e, t, n, r, i, a = !1) {
	let o = r.get(e);
	if (!o) return null;
	let s = i === "strict" ? o.internals.handleBounds?.[t] : [...o.internals.handleBounds?.source ?? [], ...o.internals.handleBounds?.target ?? []], c = (n ? s?.find((e) => e.id === n) : s?.[0]) ?? null;
	return c && a ? {
		...c,
		...Bf(o, c, c.position, !0)
	} : c;
}
function vp(e, t) {
	return e || (t?.classList.contains("target") ? "target" : t?.classList.contains("source") ? "source" : null);
}
function yp(e, t) {
	let n = null;
	return t ? n = !0 : e && !t && (n = !1), n;
}
var bp = () => !0;
function xp(e, { connectionMode: t, connectionRadius: n, handleId: r, nodeId: i, edgeUpdaterType: a, isTarget: o, domNode: s, nodeLookup: c, lib: l, autoPanOnConnect: u, flowId: d, panBy: f, cancelConnection: p, onConnectStart: m, onConnect: h, onConnectEnd: g, isValidConnection: _ = bp, onReconnectEnd: v, updateConnection: y, getTransform: b, getFromHandle: x, autoPanSpeed: S, dragThreshold: C = 1, handleDomNode: w }) {
	let T = mf(e.target), E = 0, D, { x: ee, y: te } = vf(e), ne = vp(a, w), re = s?.getBoundingClientRect(), ie = !1;
	if (!re || !ne) return;
	let ae = _p(i, ne, r, c, t);
	if (!ae) return;
	let O = vf(e, re), k = !1, oe = null, se = !1, A = null;
	function ce() {
		if (!u || !re) return;
		let [e, t] = Pd(O, re, S);
		f({
			x: e,
			y: t
		}), E = requestAnimationFrame(ce);
	}
	let le = {
		...ae,
		nodeId: i,
		type: ne,
		position: ae.position
	}, ue = c.get(i), de = {
		inProgress: !0,
		isValid: null,
		from: Bf(ue, le, $.Left, !0),
		fromHandle: le,
		fromPosition: le.position,
		fromNode: ue,
		to: O,
		toHandle: null,
		toPosition: _d[le.position],
		toNode: null,
		pointer: O
	};
	function fe() {
		ie = !0, y(de), m?.(e, {
			nodeId: i,
			handleId: r,
			handleType: ne
		});
	}
	C === 0 && fe();
	function pe(e) {
		if (!ie) {
			let { x: t, y: n } = vf(e), r = t - ee, i = n - te;
			if (!(r * r + i * i > C * C)) return;
			fe();
		}
		if (!x() || !le) {
			me(e);
			return;
		}
		let a = b();
		O = vf(e, re), D = gp(qd(O, a, !1, [1, 1]), n, c, le), k ||= (ce(), !0);
		let s = Sp(e, {
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
		A = s.handleDomNode, oe = s.connection, se = yp(!!D, s.isValid);
		let u = c.get(i), f = u ? Bf(u, le, $.Left, !0) : de.from, p = {
			...de,
			from: f,
			isValid: se,
			to: s.toHandle && se ? Jd({
				x: s.toHandle.x,
				y: s.toHandle.y
			}, a) : O,
			toHandle: s.toHandle,
			toPosition: se && s.toHandle ? s.toHandle.position : _d[le.position],
			toNode: s.toHandle ? c.get(s.toHandle.nodeId) : null,
			pointer: O
		};
		y(p), de = p;
	}
	function me(e) {
		if (!("touches" in e && e.touches.length > 0)) {
			if (ie) {
				(D || A) && oe && se && h?.(oe);
				let { inProgress: t, ...n } = de, r = {
					...n,
					toPosition: de.toHandle ? de.toPosition : null
				};
				g?.(e, r), a && v?.(e, r);
			}
			p(), cancelAnimationFrame(E), k = !1, se = !1, oe = null, A = null, T.removeEventListener("mousemove", pe), T.removeEventListener("mouseup", me), T.removeEventListener("touchmove", pe), T.removeEventListener("touchend", me);
		}
	}
	T.addEventListener("mousemove", pe), T.addEventListener("mouseup", me), T.addEventListener("touchmove", pe), T.addEventListener("touchend", me);
}
function Sp(e, { handle: t, connectionMode: n, fromNodeId: r, fromHandleId: i, fromType: a, doc: o, lib: s, flowId: c, isValidConnection: l = bp, nodeLookup: u }) {
	let d = a === "target", f = t ? o.querySelector(`.${s}-flow__handle[data-id="${c}-${t?.nodeId}-${t?.id}-${t?.type}"]`) : null, { x: p, y: m } = vf(e), h = o.elementFromPoint(p, m), g = h?.classList.contains(`${s}-flow__handle`) ? h : f, _ = {
		handleDomNode: g,
		isValid: !1,
		connection: null,
		toHandle: null
	};
	if (g) {
		let e = vp(void 0, g), t = g.getAttribute("data-nodeid"), a = g.getAttribute("data-handleid"), o = g.classList.contains("connectable"), s = g.classList.contains("connectableend");
		if (!t || !e) return _;
		let c = {
			source: d ? t : r,
			sourceHandle: d ? a : i,
			target: d ? r : t,
			targetHandle: d ? i : a
		};
		_.connection = c, _.isValid = o && s && (n === dd.Strict ? d && e === "source" || !d && e === "target" : t !== r || a !== i) && l(c), _.toHandle = _p(t, e, a, u, n, !0);
	}
	return _;
}
var Cp = {
	onPointerDown: xp,
	isValid: Sp
};
function wp({ domNode: e, panZoom: t, getTransform: n, getViewScale: r }) {
	let i = ks(e);
	function a({ translateExtent: e, width: a, height: o, zoomStep: s = 1, pannable: c = !0, zoomable: l = !0, inversePan: u = !1 }) {
		let d = (e) => {
			if (e.sourceEvent.type !== "wheel" || !t) return;
			let r = n(), i = e.sourceEvent.ctrlKey && $d() ? 10 : 1, a = -e.sourceEvent.deltaY * (e.sourceEvent.deltaMode === 1 ? .05 : e.sourceEvent.deltaMode ? 1 : .002) * s, o = r[2] * 2 ** (a * i);
			t.scaleTo(o);
		}, f = [0, 0], p = od().on("start", (e) => {
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
		pointer: js
	};
}
var Tp = (e) => ({
	x: e.x,
	y: e.y,
	zoom: e.k
}), Ep = ({ x: e, y: t, zoom: n }) => Xu.translate(e, t).scale(n), Dp = (e, t) => e.target.closest(`.${t}`), Op = (e, t) => t === 2 && Array.isArray(e) && e.includes(2), kp = (e) => ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2, Ap = (e, t = 0, n = kp, r = () => {}) => {
	let i = typeof t == "number" && t > 0;
	return i || r(), i ? e.transition().duration(t).ease(n).on("end", r) : e;
}, jp = (e) => {
	let t = e.ctrlKey && $d() ? 10 : 1;
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * t;
};
function Mp({ zoomPanValues: e, noWheelClassName: t, d3Selection: n, d3Zoom: r, panOnScrollMode: i, panOnScrollSpeed: a, zoomOnPinch: o, onPanZoomStart: s, onPanZoom: c, onPanZoomEnd: l }) {
	return (u) => {
		if (Dp(u, t)) return u.ctrlKey && u.preventDefault(), !1;
		u.preventDefault(), u.stopImmediatePropagation();
		let d = n.property("__zoom").k || 1;
		if (u.ctrlKey && o) {
			let e = js(u), t = d * 2 ** jp(u);
			r.scaleTo(n, t, e, u);
			return;
		}
		let f = u.deltaMode === 1 ? 20 : 1, p = i === fd.Vertical ? 0 : u.deltaX * f, m = i === fd.Horizontal ? 0 : u.deltaY * f;
		!$d() && u.shiftKey && i !== fd.Vertical && (p = u.deltaY * f, m = 0), r.translateBy(n, -(p / d) * a, -(m / d) * a, { internal: !0 });
		let h = Tp(n.property("__zoom"));
		clearTimeout(e.panScrollTimeout), e.isPanScrolling ? c?.(u, h) : (e.isPanScrolling = !0, s?.(u, h)), e.panScrollTimeout = setTimeout(() => {
			l?.(u, h), e.isPanScrolling = !1;
		}, 150);
	};
}
function Np({ noWheelClassName: e, preventScrolling: t, d3ZoomHandler: n }) {
	return function(r, i) {
		let a = r.type === "wheel", o = !t && a && !r.ctrlKey, s = Dp(r, e);
		if (r.ctrlKey && a && s && r.preventDefault(), o || s) return null;
		r.preventDefault(), n.call(this, r, i);
	};
}
function Pp({ zoomPanValues: e, onDraggingChange: t, onPanZoomStart: n }) {
	return (r) => {
		if (r.sourceEvent?.internal) return;
		let i = Tp(r.transform);
		e.mouseButton = r.sourceEvent?.button || 0, e.isZoomingOrPanning = !0, e.prevViewport = i, r.sourceEvent?.type === "mousedown" && t(!0), n && n?.(r.sourceEvent, i);
	};
}
function Fp({ zoomPanValues: e, panOnDrag: t, onPaneContextMenu: n, onTransformChange: r, onPanZoom: i }) {
	return (a) => {
		e.usedRightMouseButton = !!(n && Op(t, e.mouseButton ?? 0)), a.sourceEvent?.sync || r([
			a.transform.x,
			a.transform.y,
			a.transform.k
		]), i && !a.sourceEvent?.internal && i?.(a.sourceEvent, Tp(a.transform));
	};
}
function Ip({ zoomPanValues: e, panOnDrag: t, panOnScroll: n, onDraggingChange: r, onPanZoomEnd: i, onPaneContextMenu: a }) {
	return (o) => {
		if (!o.sourceEvent?.internal && (e.isZoomingOrPanning = !1, a && Op(t, e.mouseButton ?? 0) && !e.usedRightMouseButton && o.sourceEvent && a(o.sourceEvent), e.usedRightMouseButton = !1, r(!1), i)) {
			let t = Tp(o.transform);
			e.prevViewport = t, clearTimeout(e.timerId), e.timerId = setTimeout(() => {
				i?.(o.sourceEvent, t);
			}, n ? 150 : 0);
		}
	};
}
function Lp({ panActivationKeyPressed: e, zoomActivationKeyPressed: t, zoomOnScroll: n, zoomOnPinch: r, panOnDrag: i, panOnScroll: a, zoomOnDoubleClick: o, userSelectionActive: s, noWheelClassName: c, noPanClassName: l, lib: u, connectionInProgress: d }) {
	return (f) => {
		let p = t || n, m = r && f.ctrlKey, h = f.type === "wheel";
		if (f.button === 1 && f.type === "mousedown" && (Dp(f, `${u}-flow__node`) || Dp(f, `${u}-flow__edge`) || Dp(f, `${u}-flow__selection`) || Dp(f, `${u}-flow__nodesselection`))) return !0;
		if (!i && !p && !a && !o && !r || s || d && !h || Dp(f, c) && h || Dp(f, l) && (!h || a && h && !t) || !r && f.ctrlKey && h) return !1;
		if (!r && f.type === "touchstart" && f.touches?.length > 1) return f.preventDefault(), !1;
		if (!p && !a && !m && h || !i && (f.type === "mousedown" || f.type === "touchstart") || Array.isArray(i) && !i.includes(f.button) && f.type === "mousedown") return !1;
		let g = Array.isArray(i) && i.includes(f.button) || !f.button || f.button <= 1;
		return (!f.ctrlKey || h || e) && g;
	};
}
function Rp({ domNode: e, minZoom: t, maxZoom: n, translateExtent: r, viewport: i, onPanZoom: a, onPanZoomStart: o, onPanZoomEnd: s, onDraggingChange: c }) {
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
	let f = od().extent(() => d).scaleExtent([t, n]).translateExtent(r), p = ks(e).call(f);
	y({
		x: i.x,
		y: i.y,
		zoom: Ad(i.zoom, t, n)
	}, [[0, 0], [u.width, u.height]], r);
	let m = p.on("wheel.zoom"), h = p.on("dblclick.zoom");
	f.wheelDelta(jp);
	async function g(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? qc : sl).transform(Ap(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function _({ noWheelClassName: e, noPanClassName: t, onPaneContextMenu: n, userSelectionActive: r, panOnScroll: i, panOnDrag: u, panOnScrollMode: d, panOnScrollSpeed: g, preventScrolling: _, zoomOnPinch: y, zoomOnScroll: b, zoomOnDoubleClick: x, panActivationKeyPressed: S = !1, zoomActivationKeyPressed: C, lib: w, onTransformChange: T, connectionInProgress: E, paneClickDistance: D, selectionOnDrag: ee }) {
		r && !l.isZoomingOrPanning && v();
		let te = i && !C && !r;
		f.clickDistance(ee ? Infinity : !Wd(D) || D < 0 ? 0 : D);
		let ne = te ? Mp({
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
		}) : Np({
			noWheelClassName: e,
			preventScrolling: _,
			d3ZoomHandler: m
		});
		p.on("wheel.zoom", ne, { passive: !1 });
		let re = Pp({
			zoomPanValues: l,
			onDraggingChange: c,
			onPanZoomStart: o
		});
		f.on("start", re);
		let ie = Fp({
			zoomPanValues: l,
			panOnDrag: u,
			onPaneContextMenu: !!n,
			onPanZoom: a,
			onTransformChange: T
		});
		f.on("zoom", ie);
		let ae = Ip({
			zoomPanValues: l,
			panOnDrag: u,
			panOnScroll: i,
			onPaneContextMenu: n,
			onPanZoomEnd: s,
			onDraggingChange: c
		});
		f.on("end", ae);
		let O = Lp({
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
		let r = Ep(e), i = f?.constrain()(r, t, n);
		return i && await g(i), i;
	}
	async function b(e, t) {
		let n = Ep(e);
		return await g(n, t), n;
	}
	function x(e) {
		if (p) {
			let t = Ep(e), n = p.property("__zoom");
			(n.k !== e.zoom || n.x !== e.x || n.y !== e.y) && f?.transform(p, t, null, { sync: !0 });
		}
	}
	function S() {
		let e = p ? Zu(p.node()) : {
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
			f?.interpolate(t?.interpolate === "linear" ? qc : sl).scaleTo(Ap(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	async function w(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? qc : sl).scaleBy(Ap(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function T(e) {
		f?.scaleExtent(e);
	}
	function E(e) {
		f?.translateExtent(e);
	}
	function D(e) {
		let t = !Wd(e) || e < 0 ? 0 : e;
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
var zp;
(function(e) {
	e.Line = "line", e.Handle = "handle";
})(zp ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/edges.js
var Bp = Gd("Svelte Flow", "https://svelteflow.dev/");
function Vp(e, t, n = {}) {
	return kf(e, t, {
		...n,
		onError: n.onError ?? Bp
	});
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/context.js
function Hp() {
	let e = {};
	return [(t) => {
		if (t && !et(e)) throw Error(t);
		return Qe(e);
	}, (t) => $e(e, t)];
}
var [Up, Wp] = Hp(), [Gp, Kp] = Hp(), [qp, Jp] = Hp(), Yp = /* @__PURE__ */ new Set([
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
]), Xp = /* @__PURE__ */ J("<div><!></div>");
function Zp(e, t) {
	F(t, !0);
	let n = Z(t, "id", 7, null), r = Z(t, "type", 7, "source"), i = Z(t, "position", 23, () => $.Top), a = Z(t, "style", 7), o = Z(t, "class", 7), s = Z(t, "isConnectable", 7), c = Z(t, "isConnectableStart", 7, !0), l = Z(t, "isConnectableEnd", 7, !0), u = Z(t, "isValidConnection", 7), d = Z(t, "onconnect", 7), f = Z(t, "ondisconnect", 7), p = Z(t, "children", 7), m = /* @__PURE__ */ ga(t, Yp), h = Up("Handle must be used within a Custom Node component"), _ = Gp("Handle must be used within a Custom Node component"), v = /* @__PURE__ */ L(() => r() === "target"), y = /* @__PURE__ */ L(() => s() === void 0 ? _.value : s()), b = Lm(), S = /* @__PURE__ */ L(() => b.ariaLabelConfig), C = null;
	kn(() => {
		if (d() || f()) {
			b.edges;
			let e = b.connectionLookup.get(`${h}-${r()}${n() ? `-${n()}` : ""}`);
			if (C && !lf(e, C)) {
				let t = e ?? /* @__PURE__ */ new Map();
				uf(C, t, f()), uf(t, C, d());
			}
			C = new Map(e);
		}
	});
	let w = /* @__PURE__ */ L(() => {
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
			b.connectionMode === dd.Strict ? e?.type !== r() : h !== e?.nodeId || n() !== e?.id,
			o && i
		];
	}), T = /* @__PURE__ */ L(() => x(q(w), 5)), E = /* @__PURE__ */ L(() => q(T)[0]), D = /* @__PURE__ */ L(() => q(T)[1]), ee = /* @__PURE__ */ L(() => q(T)[2]), te = /* @__PURE__ */ L(() => q(T)[3]), ne = /* @__PURE__ */ L(() => q(T)[4]);
	function re(e) {
		let t = b.onbeforeconnect ? b.onbeforeconnect(e) : e;
		t && (b.addEdge(t), b.onconnect?.(e));
	}
	function ie(e) {
		let t = _f(e);
		e.currentTarget && (t && e.button === 0 || !t) && Cp.onPointerDown(e, {
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
		let t = mf(e.target), i = u() ?? b.isValidConnection, { connectionMode: a, clickConnectStartHandle: o, flowId: s, nodeLookup: l } = b, { connection: d, isValid: f } = Cp.isValid(e, {
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
		let p = structuredClone(qe(b.connection));
		delete p.inProgress, p.toPosition = p.toHandle ? p.toHandle.position : null, b.onclickconnectend?.(e, p), b.clickConnectStartHandle = null;
	}
	var O = {
		get id() {
			return n();
		},
		set id(e = null) {
			n(e), z();
		},
		get type() {
			return r();
		},
		set type(e = "source") {
			r(e), z();
		},
		get position() {
			return i();
		},
		set position(e = $.Top) {
			i(e), z();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), z();
		},
		get class() {
			return o();
		},
		set class(e) {
			o(e), z();
		},
		get isConnectable() {
			return s();
		},
		set isConnectable(e) {
			s(e), z();
		},
		get isConnectableStart() {
			return c();
		},
		set isConnectableStart(e = !0) {
			c(e), z();
		},
		get isConnectableEnd() {
			return l();
		},
		set isConnectableEnd(e = !0) {
			l(e), z();
		},
		get isValidConnection() {
			return u();
		},
		set isValidConnection(e) {
			u(e), z();
		},
		get onconnect() {
			return d();
		},
		set onconnect(e) {
			d(e), z();
		},
		get ondisconnect() {
			return f();
		},
		set ondisconnect(e) {
			f(e), z();
		},
		get children() {
			return p();
		},
		set children(e) {
			p(e), z();
		}
	}, k = Xp(), oe = () => {};
	return ra(k, () => ({
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
		[qi]: {
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
	})), ui(mn(k), () => p() ?? g), N(k), Y(e, k), I(O);
}
Q(Zp, {
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
var Qp = /* @__PURE__ */ J("<!> <!>", 1);
function $p(e, t) {
	F(t, !0);
	let n = Z(t, "data", 7), r = Z(t, "targetPosition", 23, () => $.Top), i = Z(t, "sourcePosition", 23, () => $.Bottom);
	var a = {
		get data() {
			return n();
		},
		set data(e) {
			n(e), z();
		},
		get targetPosition() {
			return r();
		},
		set targetPosition(e = $.Top) {
			r(e), z();
		},
		get sourcePosition() {
			return i();
		},
		set sourcePosition(e = $.Bottom) {
			i(e), z();
		}
	}, o = Qp(), s = H(o);
	Zp(s, {
		type: "target",
		get position() {
			return r();
		}
	});
	var c = U(s);
	return Zp(U(c), {
		type: "source",
		get position() {
			return i();
		}
	}), W(() => ni(c, ` ${n()?.label ?? ""} `)), Y(e, o), I(a);
}
Q($p, {
	data: {},
	targetPosition: {},
	sourcePosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/InputNode.svelte
var em = /* @__PURE__ */ J(" <!>", 1);
function tm(e, t) {
	F(t, !0);
	let n = Z(t, "data", 23, () => ({ label: "Node" })), r = Z(t, "sourcePosition", 23, () => $.Bottom);
	var i = {
		get data() {
			return n();
		},
		set data(e = { label: "Node" }) {
			n(e), z();
		},
		get sourcePosition() {
			return r();
		},
		set sourcePosition(e = $.Bottom) {
			r(e), z();
		}
	};
	Te();
	var a = em(), o = H(a);
	return Zp(U(o), {
		type: "source",
		get position() {
			return r();
		}
	}), W(() => ni(o, `${n()?.label ?? ""} `)), Y(e, a), I(i);
}
Q(tm, {
	data: {},
	sourcePosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/OutputNode.svelte
var nm = /* @__PURE__ */ J(" <!>", 1);
function rm(e, t) {
	F(t, !0);
	let n = Z(t, "data", 23, () => ({ label: "Node" })), r = Z(t, "targetPosition", 23, () => $.Top);
	var i = {
		get data() {
			return n();
		},
		set data(e = { label: "Node" }) {
			n(e), z();
		},
		get targetPosition() {
			return r();
		},
		set targetPosition(e = $.Top) {
			r(e), z();
		}
	};
	Te();
	var a = nm(), o = H(a);
	return Zp(U(o), {
		type: "target",
		get position() {
			return r();
		}
	}), W(() => ni(o, `${n()?.label ?? ""} `)), Y(e, a), I(i);
}
Q(rm, {
	data: {},
	targetPosition: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/GroupNode.svelte
function im(e, t) {}
Q(im, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/portal.svelte.js
function am(e, t, n) {
	if (!n || !t) return;
	let r = n === "root" ? t : t.querySelector(`.svelte-flow__${n}`);
	r && r.appendChild(e);
}
function om(e, t) {
	let n = /* @__PURE__ */ L(Lm), r = /* @__PURE__ */ L(() => q(n).domNode), i;
	return q(r) ? am(e, q(r), t) : i = An(() => {
		Dn(() => {
			am(e, q(r), t), i?.();
		});
	}), {
		async update(t) {
			am(e, q(r), t);
		},
		destroy() {
			e.parentNode && e.parentNode.removeChild(e), i?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/utils.svelte.js
function sm() {
	let e = /* @__PURE__ */ B(typeof window > "u");
	if (q(e)) {
		let t = An(() => {
			Dn(() => {
				V(e, !1), t?.();
			});
		});
	}
	return { get value() {
		return q(e);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/index.js
var cm = (e) => yd(e), lm = (e) => vd(e);
function um(e) {
	return e === void 0 ? void 0 : `${e}px`;
}
var dm = {
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
}, fm = /* @__PURE__ */ new Set([
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
]), pm = /* @__PURE__ */ J("<div><!></div>"), mm = {
	hash: "svelte-1wg91mu",
	code: ".transparent.svelte-1wg91mu {background:transparent;}"
};
function hm(e, t) {
	F(t, !0), Ei(e, mm);
	let n = Z(t, "x", 7, 0), r = Z(t, "y", 7, 0), i = Z(t, "width", 7), a = Z(t, "height", 7), o = Z(t, "selectEdgeOnClick", 7, !1), s = Z(t, "transparent", 7, !1), c = Z(t, "class", 7), l = Z(t, "children", 7), u = /* @__PURE__ */ ga(t, fm), d = Lm(), f = qp("EdgeLabel must be used within a Custom Edge component"), p = /* @__PURE__ */ L(() => d.visible.edges.get(f)?.zIndex);
	var m = {
		get x() {
			return n();
		},
		set x(e = 0) {
			n(e), z();
		},
		get y() {
			return r();
		},
		set y(e = 0) {
			r(e), z();
		},
		get width() {
			return i();
		},
		set width(e) {
			i(e), z();
		},
		get height() {
			return a();
		},
		set height(e) {
			a(e), z();
		},
		get selectEdgeOnClick() {
			return o();
		},
		set selectEdgeOnClick(e = !1) {
			o(e), z();
		},
		get transparent() {
			return s();
		},
		set transparent(e = !1) {
			s(e), z();
		},
		get class() {
			return c();
		},
		set class(e) {
			c(e), z();
		},
		get children() {
			return l();
		},
		set children(e) {
			l(e), z();
		}
	}, h = pm(), _ = () => {
		o() && f && d.handleEdgeSelection(f);
	};
	return ra(h, (e, t, i) => ({
		class: [
			"svelte-flow__edge-label",
			{ transparent: s() },
			c()
		],
		tabindex: "-1",
		onclick: _,
		...u,
		[Ji]: {
			display: e,
			cursor: o() ? "pointer" : void 0,
			transform: `translate(-50%, -50%) translate(${n() ?? ""}px,${r() ?? ""}px)`,
			"pointer-events": "all",
			width: t,
			height: i,
			"z-index": q(p)
		}
	}), [
		() => sm().value ? "none" : void 0,
		() => um(i()),
		() => um(a())
	], void 0, void 0, "svelte-1wg91mu"), ui(mn(h), () => l() ?? g), N(h), Di(h, (e, t) => om?.(e, t), () => "edge-labels"), Y(e, h), I(m);
}
Q(hm, {
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
var gm = /* @__PURE__ */ new Set([
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
]), _m = /* @__PURE__ */ Vr("<path></path>"), vm = /* @__PURE__ */ Vr("<path fill=\"none\"></path><!><!>", 1);
function ym(e, t) {
	F(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "path", 7), i = Z(t, "label", 7), a = Z(t, "labelX", 7), o = Z(t, "labelY", 7), s = Z(t, "labelStyle", 7), c = Z(t, "markerStart", 7), l = Z(t, "markerEnd", 7), u = Z(t, "style", 7), d = Z(t, "interactionWidth", 7, 20), f = Z(t, "class", 7), p = /* @__PURE__ */ ga(t, gm);
	var m = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), z();
		},
		get path() {
			return r();
		},
		set path(e) {
			r(e), z();
		},
		get label() {
			return i();
		},
		set label(e) {
			i(e), z();
		},
		get labelX() {
			return a();
		},
		set labelX(e) {
			a(e), z();
		},
		get labelY() {
			return o();
		},
		set labelY(e) {
			o(e), z();
		},
		get labelStyle() {
			return s();
		},
		set labelStyle(e) {
			s(e), z();
		},
		get markerStart() {
			return c();
		},
		set markerStart(e) {
			c(e), z();
		},
		get markerEnd() {
			return l();
		},
		set markerEnd(e) {
			l(e), z();
		},
		get style() {
			return u();
		},
		set style(e) {
			u(e), z();
		},
		get interactionWidth() {
			return d();
		},
		set interactionWidth(e = 20) {
			d(e), z();
		},
		get class() {
			return f();
		},
		set class(e) {
			f(e), z();
		}
	}, h = vm(), g = H(h), _ = U(g), v = (e) => {
		var t = _m();
		ra(t, () => ({
			d: r(),
			"stroke-opacity": 0,
			"stroke-width": d(),
			fill: "none",
			class: "svelte-flow__edge-interaction",
			...p
		})), Y(e, t);
	};
	mi(_, (e) => {
		d() > 0 && e(v);
	});
	var y = U(_), b = (e) => {
		hm(e, {
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
				Te();
				var n = Hr();
				W(() => ni(n, i())), Y(e, n);
			},
			$$slots: { default: !0 }
		});
	};
	return mi(y, (e) => {
		i() && e(b);
	}), W(() => {
		X(g, "id", n()), X(g, "d", r()), Li(g, 0, ji(["svelte-flow__edge-path", f()])), X(g, "marker-start", c()), X(g, "marker-end", l()), zi(g, u());
	}), Y(e, h), I(m);
}
Q(ym, {
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
function bm(e, t) {
	F(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "interactionWidth", 7), i = Z(t, "label", 7), a = Z(t, "labelStyle", 7), o = Z(t, "markerEnd", 7), s = Z(t, "markerStart", 7), c = Z(t, "pathOptions", 7), l = Z(t, "sourcePosition", 7), u = Z(t, "sourceX", 7), d = Z(t, "sourceY", 7), f = Z(t, "style", 7), p = Z(t, "targetPosition", 7), m = Z(t, "targetX", 7), h = Z(t, "targetY", 7), g = /* @__PURE__ */ L(() => Cf({
		sourceX: u(),
		sourceY: d(),
		targetX: m(),
		targetY: h(),
		sourcePosition: l(),
		targetPosition: p(),
		curvature: c()?.curvature
	})), _ = /* @__PURE__ */ L(() => x(q(g), 3)), v = /* @__PURE__ */ L(() => q(_)[0]), y = /* @__PURE__ */ L(() => q(_)[1]), b = /* @__PURE__ */ L(() => q(_)[2]);
	return ym(e, {
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
	}), I({
		get id() {
			return n();
		},
		set id(e) {
			n(e), z();
		},
		get interactionWidth() {
			return r();
		},
		set interactionWidth(e) {
			r(e), z();
		},
		get label() {
			return i();
		},
		set label(e) {
			i(e), z();
		},
		get labelStyle() {
			return a();
		},
		set labelStyle(e) {
			a(e), z();
		},
		get markerEnd() {
			return o();
		},
		set markerEnd(e) {
			o(e), z();
		},
		get markerStart() {
			return s();
		},
		set markerStart(e) {
			s(e), z();
		},
		get pathOptions() {
			return c();
		},
		set pathOptions(e) {
			c(e), z();
		},
		get sourcePosition() {
			return l();
		},
		set sourcePosition(e) {
			l(e), z();
		},
		get sourceX() {
			return u();
		},
		set sourceX(e) {
			u(e), z();
		},
		get sourceY() {
			return d();
		},
		set sourceY(e) {
			d(e), z();
		},
		get style() {
			return f();
		},
		set style(e) {
			f(e), z();
		},
		get targetPosition() {
			return p();
		},
		set targetPosition(e) {
			p(e), z();
		},
		get targetX() {
			return m();
		},
		set targetX(e) {
			m(e), z();
		},
		get targetY() {
			return h();
		},
		set targetY(e) {
			h(e), z();
		}
	});
}
Q(bm, {
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
function xm(e, t) {
	F(t, !0);
	let n = Z(t, "interactionWidth", 7), r = Z(t, "label", 7), i = Z(t, "labelStyle", 7), a = Z(t, "style", 7), o = Z(t, "markerEnd", 7), s = Z(t, "markerStart", 7), c = Z(t, "sourcePosition", 7), l = Z(t, "sourceX", 7), u = Z(t, "sourceY", 7), d = Z(t, "targetPosition", 7), f = Z(t, "targetX", 7), p = Z(t, "targetY", 7), m = /* @__PURE__ */ L(() => If({
		sourceX: l(),
		sourceY: u(),
		targetX: f(),
		targetY: p(),
		sourcePosition: c(),
		targetPosition: d()
	})), h = /* @__PURE__ */ L(() => x(q(m), 3)), g = /* @__PURE__ */ L(() => q(h)[0]), _ = /* @__PURE__ */ L(() => q(h)[1]), v = /* @__PURE__ */ L(() => q(h)[2]);
	return ym(e, {
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
	}), I({
		get interactionWidth() {
			return n();
		},
		set interactionWidth(e) {
			n(e), z();
		},
		get label() {
			return r();
		},
		set label(e) {
			r(e), z();
		},
		get labelStyle() {
			return i();
		},
		set labelStyle(e) {
			i(e), z();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), z();
		},
		get markerEnd() {
			return o();
		},
		set markerEnd(e) {
			o(e), z();
		},
		get markerStart() {
			return s();
		},
		set markerStart(e) {
			s(e), z();
		},
		get sourcePosition() {
			return c();
		},
		set sourcePosition(e) {
			c(e), z();
		},
		get sourceX() {
			return l();
		},
		set sourceX(e) {
			l(e), z();
		},
		get sourceY() {
			return u();
		},
		set sourceY(e) {
			u(e), z();
		},
		get targetPosition() {
			return d();
		},
		set targetPosition(e) {
			d(e), z();
		},
		get targetX() {
			return f();
		},
		set targetX(e) {
			f(e), z();
		},
		get targetY() {
			return p();
		},
		set targetY(e) {
			p(e), z();
		}
	});
}
Q(xm, {
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
function Sm(e, t) {
	F(t, !0);
	let n = Z(t, "sourceX", 7), r = Z(t, "sourceY", 7), i = Z(t, "targetX", 7), a = Z(t, "targetY", 7), o = Z(t, "label", 7), s = Z(t, "labelStyle", 7), c = Z(t, "markerStart", 7), l = Z(t, "markerEnd", 7), u = Z(t, "interactionWidth", 7), d = Z(t, "style", 7), f = /* @__PURE__ */ L(() => Af({
		sourceX: n(),
		sourceY: r(),
		targetX: i(),
		targetY: a()
	})), p = /* @__PURE__ */ L(() => x(q(f), 3)), m = /* @__PURE__ */ L(() => q(p)[0]), h = /* @__PURE__ */ L(() => q(p)[1]), g = /* @__PURE__ */ L(() => q(p)[2]);
	return ym(e, {
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
	}), I({
		get sourceX() {
			return n();
		},
		set sourceX(e) {
			n(e), z();
		},
		get sourceY() {
			return r();
		},
		set sourceY(e) {
			r(e), z();
		},
		get targetX() {
			return i();
		},
		set targetX(e) {
			i(e), z();
		},
		get targetY() {
			return a();
		},
		set targetY(e) {
			a(e), z();
		},
		get label() {
			return o();
		},
		set label(e) {
			o(e), z();
		},
		get labelStyle() {
			return s();
		},
		set labelStyle(e) {
			s(e), z();
		},
		get markerStart() {
			return c();
		},
		set markerStart(e) {
			c(e), z();
		},
		get markerEnd() {
			return l();
		},
		set markerEnd(e) {
			l(e), z();
		},
		get interactionWidth() {
			return u();
		},
		set interactionWidth(e) {
			u(e), z();
		},
		get style() {
			return d();
		},
		set style(e) {
			d(e), z();
		}
	});
}
Q(Sm, {
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
function Cm(e, t) {
	F(t, !0);
	let n = Z(t, "sourceX", 7), r = Z(t, "sourceY", 7), i = Z(t, "sourcePosition", 7), a = Z(t, "targetX", 7), o = Z(t, "targetY", 7), s = Z(t, "targetPosition", 7), c = Z(t, "label", 7), l = Z(t, "labelStyle", 7), u = Z(t, "markerStart", 7), d = Z(t, "markerEnd", 7), f = Z(t, "interactionWidth", 7), p = Z(t, "style", 7), m = /* @__PURE__ */ L(() => If({
		sourceX: n(),
		sourceY: r(),
		targetX: a(),
		targetY: o(),
		sourcePosition: i(),
		targetPosition: s(),
		borderRadius: 0
	})), h = /* @__PURE__ */ L(() => x(q(m), 3)), g = /* @__PURE__ */ L(() => q(h)[0]), _ = /* @__PURE__ */ L(() => q(h)[1]), v = /* @__PURE__ */ L(() => q(h)[2]);
	return ym(e, {
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
	}), I({
		get sourceX() {
			return n();
		},
		set sourceX(e) {
			n(e), z();
		},
		get sourceY() {
			return r();
		},
		set sourceY(e) {
			r(e), z();
		},
		get sourcePosition() {
			return i();
		},
		set sourcePosition(e) {
			i(e), z();
		},
		get targetX() {
			return a();
		},
		set targetX(e) {
			a(e), z();
		},
		get targetY() {
			return o();
		},
		set targetY(e) {
			o(e), z();
		},
		get targetPosition() {
			return s();
		},
		set targetPosition(e) {
			s(e), z();
		},
		get label() {
			return c();
		},
		set label(e) {
			c(e), z();
		},
		get labelStyle() {
			return l();
		},
		set labelStyle(e) {
			l(e), z();
		},
		get markerStart() {
			return u();
		},
		set markerStart(e) {
			u(e), z();
		},
		get markerEnd() {
			return d();
		},
		set markerEnd(e) {
			d(e), z();
		},
		get interactionWidth() {
			return f();
		},
		set interactionWidth(e) {
			f(e), z();
		},
		get style() {
			return p();
		},
		set style(e) {
			p(e), z();
		}
	});
}
Q(Cm, {
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
var wm = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = Qr(t);
	}
	get current() {
		return this.#t(), this.#e();
	}
}, Tm = /\(.+\)/, Em = /* @__PURE__ */ new Set([
	"all",
	"print",
	"screen",
	"and",
	"or",
	"not",
	"only"
]), Dm = class extends wm {
	constructor(e, t) {
		let n = Tm.test(e) || e.split(/[\s,]+/).some((e) => Em.has(e.trim())) ? e : `(${e})`, r = window.matchMedia(n);
		super(() => r.matches, (e) => kr(r, "change", e));
	}
};
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/visibleElements.js
function Om(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	return wd(e, {
		x: 0,
		y: 0,
		width: n,
		height: r
	}, t, !0).forEach((e) => {
		i.set(e.id, e);
	}), i;
}
function km(e) {
	let { edges: t, defaultEdgeOptions: n, nodeLookup: r, previousEdges: i, connectionMode: a, onerror: o, onlyRenderVisible: s, elevateEdgesOnSelect: c, zIndexMode: l } = e, u = /* @__PURE__ */ new Map();
	for (let d of t) {
		let t = r.get(d.source), f = r.get(d.target);
		if (!t || !f || t.hidden || f.hidden) continue;
		if (s) {
			let { visibleNodes: n, transform: r, width: i, height: a } = e;
			if (Ef({
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
		let m = Rf({
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
			zIndex: Tf({
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
var Am = Gd("Svelte Flow", "https://svelteflow.dev/"), jm = {
	input: tm,
	output: rm,
	default: $p,
	group: im
}, Mm = {
	straight: Sm,
	smoothstep: xm,
	default: bm,
	step: Cm
};
function Nm(e, t, n, r, i, a) {
	return t && !n && r && i ? Qd(Cd(a, { filter: (e) => !(!e.width && !e.initialWidth || !e.height && !e.initialHeight) }), r, i, .5, 2, .1) : n ?? {
		x: 0,
		y: 0,
		zoom: 1
	};
}
function Pm(e) {
	class t {
		#e = /* @__PURE__ */ L(() => e.props.id ?? "1");
		get flowId() {
			return q(this.#e);
		}
		set flowId(e) {
			V(this.#e, e);
		}
		#t = /* @__PURE__ */ B(null);
		get domNode() {
			return q(this.#t);
		}
		set domNode(e) {
			V(this.#t, e);
		}
		#n = /* @__PURE__ */ B(null);
		get panZoom() {
			return q(this.#n);
		}
		set panZoom(e) {
			V(this.#n, e);
		}
		#r = /* @__PURE__ */ B(e.width ?? 0);
		get width() {
			return q(this.#r);
		}
		set width(e) {
			V(this.#r, e);
		}
		#i = /* @__PURE__ */ B(e.height ?? 0);
		get height() {
			return q(this.#i);
		}
		set height(e) {
			V(this.#i, e);
		}
		#a = /* @__PURE__ */ B(e.props.zIndexMode ?? "basic");
		get zIndexMode() {
			return q(this.#a);
		}
		set zIndexMode(e) {
			V(this.#a, e);
		}
		#o = /* @__PURE__ */ L(() => {
			let { nodesInitialized: t } = Qf(e.nodes, this.nodeLookup, this.parentLookup, {
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
			V(this.#o, e);
		}
		#s = /* @__PURE__ */ L(() => this.panZoom !== null);
		get viewportInitialized() {
			return q(this.#s);
		}
		set viewportInitialized(e) {
			V(this.#s, e);
		}
		#c = /* @__PURE__ */ L(() => (sp(this.connectionLookup, this.edgeLookup, e.edges), e.edges));
		get _edges() {
			return q(this.#c);
		}
		set _edges(e) {
			V(this.#c, e);
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
		#l = /* @__PURE__ */ L(() => {
			let e = this._prevSelectedNodeIds.size, t = /* @__PURE__ */ new Set(), n = this.nodes.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedNodeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedNodeIds.size > 0) && (this._prevSelectedNodes = n), this._prevSelectedNodeIds = t, this._prevSelectedNodes;
		});
		get selectedNodes() {
			return q(this.#l);
		}
		set selectedNodes(e) {
			V(this.#l, e);
		}
		_prevSelectedEdges = [];
		_prevSelectedEdgeIds = /* @__PURE__ */ new Set();
		#u = /* @__PURE__ */ L(() => {
			let e = this._prevSelectedEdgeIds.size, t = /* @__PURE__ */ new Set(), n = this.edges.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedEdgeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedEdgeIds.size > 0) && (this._prevSelectedEdges = n), this._prevSelectedEdgeIds = t, this._prevSelectedEdges;
		});
		get selectedEdges() {
			return q(this.#u);
		}
		set selectedEdges(e) {
			V(this.#u, e);
		}
		selectionChangeHandlers = /* @__PURE__ */ new Map();
		nodeLookup = /* @__PURE__ */ new Map();
		parentLookup = /* @__PURE__ */ new Map();
		connectionLookup = /* @__PURE__ */ new Map();
		edgeLookup = /* @__PURE__ */ new Map();
		_prevVisibleEdges = /* @__PURE__ */ new Map();
		#d = /* @__PURE__ */ L(() => {
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
				u = Om(i, r, t, n), d = km({
					...f,
					onlyRenderVisible: !0,
					visibleNodes: u,
					transform: r,
					width: t,
					height: n
				});
			} else u = this.nodeLookup, d = km(f);
			return this._prevVisibleEdges = d, {
				nodes: u,
				edges: d
			};
		});
		get visible() {
			return q(this.#d);
		}
		set visible(e) {
			V(this.#d, e);
		}
		#f = /* @__PURE__ */ L(() => e.props.nodesDraggable ?? !0);
		get nodesDraggable() {
			return q(this.#f);
		}
		set nodesDraggable(e) {
			V(this.#f, e);
		}
		#p = /* @__PURE__ */ L(() => e.props.nodesConnectable ?? !0);
		get nodesConnectable() {
			return q(this.#p);
		}
		set nodesConnectable(e) {
			V(this.#p, e);
		}
		#m = /* @__PURE__ */ L(() => e.props.elementsSelectable ?? !0);
		get elementsSelectable() {
			return q(this.#m);
		}
		set elementsSelectable(e) {
			V(this.#m, e);
		}
		#h = /* @__PURE__ */ L(() => e.props.nodesFocusable ?? !0);
		get nodesFocusable() {
			return q(this.#h);
		}
		set nodesFocusable(e) {
			V(this.#h, e);
		}
		#g = /* @__PURE__ */ L(() => e.props.edgesFocusable ?? !0);
		get edgesFocusable() {
			return q(this.#g);
		}
		set edgesFocusable(e) {
			V(this.#g, e);
		}
		#_ = /* @__PURE__ */ L(() => e.props.disableKeyboardA11y ?? !1);
		get disableKeyboardA11y() {
			return q(this.#_);
		}
		set disableKeyboardA11y(e) {
			V(this.#_, e);
		}
		#v = /* @__PURE__ */ L(() => e.props.minZoom ?? .5);
		get minZoom() {
			return q(this.#v);
		}
		set minZoom(e) {
			V(this.#v, e);
		}
		#y = /* @__PURE__ */ L(() => e.props.maxZoom ?? 2);
		get maxZoom() {
			return q(this.#y);
		}
		set maxZoom(e) {
			V(this.#y, e);
		}
		#b = /* @__PURE__ */ L(() => e.props.nodeOrigin ?? [0, 0]);
		get nodeOrigin() {
			return q(this.#b);
		}
		set nodeOrigin(e) {
			V(this.#b, e);
		}
		#x = /* @__PURE__ */ L(() => e.props.nodeExtent ?? cd);
		get nodeExtent() {
			return q(this.#x);
		}
		set nodeExtent(e) {
			V(this.#x, e);
		}
		#S = /* @__PURE__ */ L(() => e.props.translateExtent ?? cd);
		get translateExtent() {
			return q(this.#S);
		}
		set translateExtent(e) {
			V(this.#S, e);
		}
		#C = /* @__PURE__ */ L(() => e.props.defaultEdgeOptions ?? {});
		get defaultEdgeOptions() {
			return q(this.#C);
		}
		set defaultEdgeOptions(e) {
			V(this.#C, e);
		}
		#w = /* @__PURE__ */ L(() => e.props.nodeDragThreshold ?? 1);
		get nodeDragThreshold() {
			return q(this.#w);
		}
		set nodeDragThreshold(e) {
			V(this.#w, e);
		}
		#T = /* @__PURE__ */ L(() => e.props.autoPanOnNodeDrag ?? !0);
		get autoPanOnNodeDrag() {
			return q(this.#T);
		}
		set autoPanOnNodeDrag(e) {
			V(this.#T, e);
		}
		#E = /* @__PURE__ */ L(() => e.props.autoPanOnConnect ?? !0);
		get autoPanOnConnect() {
			return q(this.#E);
		}
		set autoPanOnConnect(e) {
			V(this.#E, e);
		}
		#D = /* @__PURE__ */ L(() => e.props.autoPanOnNodeFocus ?? !0);
		get autoPanOnNodeFocus() {
			return q(this.#D);
		}
		set autoPanOnNodeFocus(e) {
			V(this.#D, e);
		}
		#O = /* @__PURE__ */ L(() => e.props.autoPanSpeed ?? 15);
		get autoPanSpeed() {
			return q(this.#O);
		}
		set autoPanSpeed(e) {
			V(this.#O, e);
		}
		#k = /* @__PURE__ */ L(() => e.props.connectionDragThreshold ?? 1);
		get connectionDragThreshold() {
			return q(this.#k);
		}
		set connectionDragThreshold(e) {
			V(this.#k, e);
		}
		fitViewQueued = e.props.fitView ?? !1;
		fitViewOptions = e.props.fitViewOptions;
		fitViewResolver = null;
		#A = /* @__PURE__ */ L(() => e.props.snapGrid ?? null);
		get snapGrid() {
			return q(this.#A);
		}
		set snapGrid(e) {
			V(this.#A, e);
		}
		#j = /* @__PURE__ */ B(!1);
		get dragging() {
			return q(this.#j);
		}
		set dragging(e) {
			V(this.#j, e);
		}
		#M = /* @__PURE__ */ B(null);
		get selectionRect() {
			return q(this.#M);
		}
		set selectionRect(e) {
			V(this.#M, e);
		}
		#N = /* @__PURE__ */ B(!1);
		get selectionKeyPressed() {
			return q(this.#N);
		}
		set selectionKeyPressed(e) {
			V(this.#N, e);
		}
		#P = /* @__PURE__ */ B(!1);
		get multiselectionKeyPressed() {
			return q(this.#P);
		}
		set multiselectionKeyPressed(e) {
			V(this.#P, e);
		}
		#F = /* @__PURE__ */ B(!1);
		get deleteKeyPressed() {
			return q(this.#F);
		}
		set deleteKeyPressed(e) {
			V(this.#F, e);
		}
		#I = /* @__PURE__ */ B(!1);
		get panActivationKeyPressed() {
			return q(this.#I);
		}
		set panActivationKeyPressed(e) {
			V(this.#I, e);
		}
		#L = /* @__PURE__ */ B(!1);
		get zoomActivationKeyPressed() {
			return q(this.#L);
		}
		set zoomActivationKeyPressed(e) {
			V(this.#L, e);
		}
		#R = /* @__PURE__ */ B(null);
		get selectionRectMode() {
			return q(this.#R);
		}
		set selectionRectMode(e) {
			V(this.#R, e);
		}
		#z = /* @__PURE__ */ B("");
		get ariaLiveMessage() {
			return q(this.#z);
		}
		set ariaLiveMessage(e) {
			V(this.#z, e);
		}
		#B = /* @__PURE__ */ L(() => e.props.selectionMode ?? pd.Partial);
		get selectionMode() {
			return q(this.#B);
		}
		set selectionMode(e) {
			V(this.#B, e);
		}
		#V = /* @__PURE__ */ L(() => ({
			...jm,
			...e.props.nodeTypes
		}));
		get nodeTypes() {
			return q(this.#V);
		}
		set nodeTypes(e) {
			V(this.#V, e);
		}
		#H = /* @__PURE__ */ L(() => ({
			...Mm,
			...e.props.edgeTypes
		}));
		get edgeTypes() {
			return q(this.#H);
		}
		set edgeTypes(e) {
			V(this.#H, e);
		}
		#U = /* @__PURE__ */ L(() => e.props.noPanClass ?? "nopan");
		get noPanClass() {
			return q(this.#U);
		}
		set noPanClass(e) {
			V(this.#U, e);
		}
		#W = /* @__PURE__ */ L(() => e.props.noDragClass ?? "nodrag");
		get noDragClass() {
			return q(this.#W);
		}
		set noDragClass(e) {
			V(this.#W, e);
		}
		#G = /* @__PURE__ */ L(() => e.props.noWheelClass ?? "nowheel");
		get noWheelClass() {
			return q(this.#G);
		}
		set noWheelClass(e) {
			V(this.#G, e);
		}
		#K = /* @__PURE__ */ L(() => af(e.props.ariaLabelConfig));
		get ariaLabelConfig() {
			return q(this.#K);
		}
		set ariaLabelConfig(e) {
			V(this.#K, e);
		}
		#q = /* @__PURE__ */ B(Nm(this.nodesInitialized, e.props.fitView, e.props.initialViewport, this.width, this.height, this.nodeLookup));
		get _viewport() {
			return q(this.#q);
		}
		set _viewport(e) {
			V(this.#q, e);
		}
		get viewport() {
			return e.viewport ?? this._viewport;
		}
		set viewport(t) {
			e.viewport &&= t, this._viewport = t;
		}
		#J = /* @__PURE__ */ B(md);
		get _connection() {
			return q(this.#J);
		}
		set _connection(e) {
			V(this.#J, e);
		}
		#Y = /* @__PURE__ */ L(() => this._connection.inProgress ? {
			...this._connection,
			to: qd(this._connection.to, [
				this.viewport.x,
				this.viewport.y,
				this.viewport.zoom
			])
		} : this._connection);
		get connection() {
			return q(this.#Y);
		}
		set connection(e) {
			V(this.#Y, e);
		}
		#X = /* @__PURE__ */ L(() => e.props.connectionMode ?? dd.Strict);
		get connectionMode() {
			return q(this.#X);
		}
		set connectionMode(e) {
			V(this.#X, e);
		}
		#Z = /* @__PURE__ */ L(() => e.props.connectionRadius ?? 20);
		get connectionRadius() {
			return q(this.#Z);
		}
		set connectionRadius(e) {
			V(this.#Z, e);
		}
		#Q = /* @__PURE__ */ L(() => e.props.isValidConnection ?? (() => !0));
		get isValidConnection() {
			return q(this.#Q);
		}
		set isValidConnection(e) {
			V(this.#Q, e);
		}
		#$ = /* @__PURE__ */ L(() => e.props.selectNodesOnDrag ?? !0);
		get selectNodesOnDrag() {
			return q(this.#$);
		}
		set selectNodesOnDrag(e) {
			V(this.#$, e);
		}
		#ee = /* @__PURE__ */ L(() => e.props.defaultMarkerColor === void 0 ? "#b1b1b7" : e.props.defaultMarkerColor);
		get defaultMarkerColor() {
			return q(this.#ee);
		}
		set defaultMarkerColor(e) {
			V(this.#ee, e);
		}
		#te = /* @__PURE__ */ L(() => Uf(e.edges, {
			defaultColor: this.defaultMarkerColor,
			id: this.flowId,
			defaultMarkerStart: this.defaultEdgeOptions.markerStart,
			defaultMarkerEnd: this.defaultEdgeOptions.markerEnd
		}));
		get markers() {
			return q(this.#te);
		}
		set markers(e) {
			V(this.#te, e);
		}
		#ne = /* @__PURE__ */ L(() => e.props.onlyRenderVisibleElements ?? !1);
		get onlyRenderVisibleElements() {
			return q(this.#ne);
		}
		set onlyRenderVisibleElements(e) {
			V(this.#ne, e);
		}
		#re = /* @__PURE__ */ L(() => e.props.onflowerror ?? Am);
		get onerror() {
			return q(this.#re);
		}
		set onerror(e) {
			V(this.#re, e);
		}
		#ie = /* @__PURE__ */ L(() => e.props.ondelete);
		get ondelete() {
			return q(this.#ie);
		}
		set ondelete(e) {
			V(this.#ie, e);
		}
		#ae = /* @__PURE__ */ L(() => e.props.onbeforedelete);
		get onbeforedelete() {
			return q(this.#ae);
		}
		set onbeforedelete(e) {
			V(this.#ae, e);
		}
		#oe = /* @__PURE__ */ L(() => e.props.onbeforeconnect);
		get onbeforeconnect() {
			return q(this.#oe);
		}
		set onbeforeconnect(e) {
			V(this.#oe, e);
		}
		#se = /* @__PURE__ */ L(() => e.props.onconnect);
		get onconnect() {
			return q(this.#se);
		}
		set onconnect(e) {
			V(this.#se, e);
		}
		#ce = /* @__PURE__ */ L(() => e.props.onconnectstart);
		get onconnectstart() {
			return q(this.#ce);
		}
		set onconnectstart(e) {
			V(this.#ce, e);
		}
		#le = /* @__PURE__ */ L(() => e.props.onconnectend);
		get onconnectend() {
			return q(this.#le);
		}
		set onconnectend(e) {
			V(this.#le, e);
		}
		#ue = /* @__PURE__ */ L(() => e.props.onbeforereconnect);
		get onbeforereconnect() {
			return q(this.#ue);
		}
		set onbeforereconnect(e) {
			V(this.#ue, e);
		}
		#de = /* @__PURE__ */ L(() => e.props.onreconnect);
		get onreconnect() {
			return q(this.#de);
		}
		set onreconnect(e) {
			V(this.#de, e);
		}
		#fe = /* @__PURE__ */ L(() => e.props.onreconnectstart);
		get onreconnectstart() {
			return q(this.#fe);
		}
		set onreconnectstart(e) {
			V(this.#fe, e);
		}
		#pe = /* @__PURE__ */ L(() => e.props.onreconnectend);
		get onreconnectend() {
			return q(this.#pe);
		}
		set onreconnectend(e) {
			V(this.#pe, e);
		}
		#me = /* @__PURE__ */ L(() => e.props.clickConnect ?? !0);
		get clickConnect() {
			return q(this.#me);
		}
		set clickConnect(e) {
			V(this.#me, e);
		}
		#he = /* @__PURE__ */ L(() => e.props.onclickconnectstart);
		get onclickconnectstart() {
			return q(this.#he);
		}
		set onclickconnectstart(e) {
			V(this.#he, e);
		}
		#ge = /* @__PURE__ */ L(() => e.props.onclickconnectend);
		get onclickconnectend() {
			return q(this.#ge);
		}
		set onclickconnectend(e) {
			V(this.#ge, e);
		}
		#_e = /* @__PURE__ */ B(null);
		get clickConnectStartHandle() {
			return q(this.#_e);
		}
		set clickConnectStartHandle(e) {
			V(this.#_e, e);
		}
		#ve = /* @__PURE__ */ L(() => e.props.onselectiondrag);
		get onselectiondrag() {
			return q(this.#ve);
		}
		set onselectiondrag(e) {
			V(this.#ve, e);
		}
		#ye = /* @__PURE__ */ L(() => e.props.onselectiondragstart);
		get onselectiondragstart() {
			return q(this.#ye);
		}
		set onselectiondragstart(e) {
			V(this.#ye, e);
		}
		#be = /* @__PURE__ */ L(() => e.props.onselectiondragstop);
		get onselectiondragstop() {
			return q(this.#be);
		}
		set onselectiondragstop(e) {
			V(this.#be, e);
		}
		resolveFitView = async () => {
			this.panZoom && (await Dd({
				nodes: this.nodeLookup,
				width: this.width,
				height: this.height,
				panZoom: this.panZoom,
				minZoom: this.minZoom,
				maxZoom: this.maxZoom
			}, this.fitViewOptions), this.fitViewResolver?.resolve(!0), this.fitViewQueued = !1, this.fitViewOptions = void 0, this.fitViewResolver = null);
		};
		_prefersDark = new Dm("(prefers-color-scheme: dark)", e.props.colorModeSSR === "dark");
		#xe = /* @__PURE__ */ L(() => e.props.colorMode === "system" ? this._prefersDark.current ? "dark" : "light" : e.props.colorMode ?? "light");
		get colorMode() {
			return q(this.#xe);
		}
		set colorMode(e) {
			V(this.#xe, e);
		}
		constructor() {
			process.env.NODE_ENV === "development" && (Fm(e.nodes, "nodes"), Fm(e.edges, "edges"));
		}
		resetStoreValues() {
			this.dragging = !1, this.selectionRect = null, this.selectionRectMode = null, this.selectionKeyPressed = !1, this.multiselectionKeyPressed = !1, this.deleteKeyPressed = !1, this.panActivationKeyPressed = !1, this.zoomActivationKeyPressed = !1, this._connection = md, this.clickConnectStartHandle = null, this.viewport = e.props.initialViewport ?? {
				x: 0,
				y: 0,
				zoom: 1
			}, this.ariaLiveMessage = "";
		}
	}
	return new t();
}
function Fm(e, t) {
	try {
		e && e.length > 0 && structuredClone(e[0]);
	} catch {
		console.warn(`Use $state.raw for ${t} to prevent performance issues.`);
	}
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useStore.js
var Im = sd.error001("svelte");
function Lm() {
	let e = Qe(Rm);
	if (!e) throw Error(Im);
	return e.getStore();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/index.js
var Rm = Symbol();
function zm(e) {
	let t = Pm(e);
	function n(e) {
		t.nodeTypes = {
			...jm,
			...e
		};
	}
	function r(e) {
		t.edgeTypes = {
			...Mm,
			...e
		};
	}
	function i(e) {
		t.edges = Vp(e, t.edges, { onError: t.onerror });
	}
	let a = (e, n = !1) => {
		t.nodes = t.nodes.map((r) => {
			if (t.connection.inProgress && t.connection.fromNode.id === r.id) {
				let e = t.nodeLookup.get(r.id);
				e && (t.connection = {
					...t.connection,
					from: Bf(e, t.connection.fromHandle, $.Left, !0)
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
		let { changes: n, updatedInternals: r } = ip(e, t.nodeLookup, t.parentLookup, t.domNode, t.nodeOrigin, t.nodeExtent, t.zIndexMode);
		if (!r) return;
		Yf(t.nodeLookup, t.parentLookup, {
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
			t.onerror("012", sd.error012(e));
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
			t.onerror("016", sd.error016(e));
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
			i && (t = Kd(t, i));
			let { position: n, positionAbsolute: a } = Od({
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
		return ap({
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
		t._connection = md;
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
function Bm(e, t) {
	let { minZoom: n, maxZoom: r, initialViewport: i, onPanZoomStart: a, onPanZoom: o, onPanZoomEnd: s, translateExtent: c, setPanZoomInstance: l, onDraggingChange: u, onTransformChange: d } = t, f = Rp({
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
var Vm = /* @__PURE__ */ J("<div class=\"svelte-flow__zoom svelte-flow__container\"><!></div>");
function Hm(e, t) {
	F(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "panOnScrollMode", 7), i = Z(t, "preventScrolling", 7), a = Z(t, "zoomOnScroll", 7), o = Z(t, "zoomOnDoubleClick", 7), s = Z(t, "zoomOnPinch", 7), c = Z(t, "panOnDrag", 7), l = Z(t, "panOnScroll", 7), u = Z(t, "panOnScrollSpeed", 7), d = Z(t, "paneClickDistance", 7), f = Z(t, "selectionOnDrag", 7), p = Z(t, "onmovestart", 7), m = Z(t, "onmove", 7), h = Z(t, "onmoveend", 7), g = Z(t, "oninit", 7), _ = Z(t, "children", 7), v = /* @__PURE__ */ L(() => n().panActivationKeyPressed || c()), y = /* @__PURE__ */ L(() => n().panActivationKeyPressed || l()), { viewport: b } = n(), x = !1;
	Dn(() => {
		!x && n().viewportInitialized && (g()?.(), x = !0);
	});
	var S = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		},
		get panOnScrollMode() {
			return r();
		},
		set panOnScrollMode(e) {
			r(e), z();
		},
		get preventScrolling() {
			return i();
		},
		set preventScrolling(e) {
			i(e), z();
		},
		get zoomOnScroll() {
			return a();
		},
		set zoomOnScroll(e) {
			a(e), z();
		},
		get zoomOnDoubleClick() {
			return o();
		},
		set zoomOnDoubleClick(e) {
			o(e), z();
		},
		get zoomOnPinch() {
			return s();
		},
		set zoomOnPinch(e) {
			s(e), z();
		},
		get panOnDrag() {
			return c();
		},
		set panOnDrag(e) {
			c(e), z();
		},
		get panOnScroll() {
			return l();
		},
		set panOnScroll(e) {
			l(e), z();
		},
		get panOnScrollSpeed() {
			return u();
		},
		set panOnScrollSpeed(e) {
			u(e), z();
		},
		get paneClickDistance() {
			return d();
		},
		set paneClickDistance(e) {
			d(e), z();
		},
		get selectionOnDrag() {
			return f();
		},
		set selectionOnDrag(e) {
			f(e), z();
		},
		get onmovestart() {
			return p();
		},
		set onmovestart(e) {
			p(e), z();
		},
		get onmove() {
			return m();
		},
		set onmove(e) {
			m(e), z();
		},
		get onmoveend() {
			return h();
		},
		set onmoveend(e) {
			h(e), z();
		},
		get oninit() {
			return g();
		},
		set oninit(e) {
			g(e), z();
		},
		get children() {
			return _();
		},
		set children(e) {
			_(e), z();
		}
	}, C = Vm();
	return ui(mn(C), _), N(C), Di(C, (e, t) => Bm?.(e, t), () => ({
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
	})), Y(e, C), I(S);
}
Q(Hm, {
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
function Um(e, t) {
	return (n) => {
		n.target === t && e?.(n);
	};
}
function Wm(e) {
	return (t) => {
		let n = e.has(t.id);
		return !!t.selected === n ? t : {
			...t,
			selected: n
		};
	};
}
function Gm(e, t) {
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
var Km = /* @__PURE__ */ J("<div><!></div>");
function qm(e, t) {
	F(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "panOnDrag", 7, !0), i = Z(t, "paneClickDistance", 7, 1), a = Z(t, "selectionOnDrag", 7), o = Z(t, "autoPanOnSelection", 7, !0), s = Z(t, "onpaneclick", 7), c = Z(t, "onpanecontextmenu", 7), l = Z(t, "onselectionstart", 7), u = Z(t, "onselectionend", 7), d = Z(t, "children", 7), f, p = null, m = !1, h = /* @__PURE__ */ new Set(), g = /* @__PURE__ */ new Set(), _ = /* @__PURE__ */ L(() => n().panActivationKeyPressed || r()), v = /* @__PURE__ */ L(() => n().selectionKeyPressed || !!n().selectionRect || a() && q(_) !== !0), y = /* @__PURE__ */ L(() => n().elementsSelectable && (q(v) || n().selectionRectMode === "user")), b = !1, x = 0, S = {
		x: 0,
		y: 0
	}, C = !1;
	function w(e) {
		if (e.pointerType === "touch" && q(_) !== !1 && !n().selectionKeyPressed || (p = f?.getBoundingClientRect(), !p)) return;
		let t = e.target === f, r = !t && !!e.target.closest(".nokey"), i = a() && t || n().selectionKeyPressed;
		if (r || !q(v) || !i || e.button !== 0 || !e.isPrimary) return;
		e.target?.setPointerCapture?.(e.pointerId), b = !1, C = !1;
		let { x: o, y: s } = vf(e, p), c = qd({
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
		}, i = Jd(r, [
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
		h = new Set(wd(n().nodeLookup, a, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		], n().selectionMode === pd.Partial, !0).map((e) => e.id));
		let c = n().defaultEdgeOptions.selectable ?? !0;
		g = /* @__PURE__ */ new Set();
		for (let e of h) {
			let t = n().connectionLookup.get(e);
			if (t) for (let { edgeId: e } of t.values()) {
				let t = n().edgeLookup.get(e);
				t && (t.selectable ?? c) && g.add(e);
			}
		}
		Gm(o, h) || n(n().nodes = n().nodes.map(Wm(h)), !0), Gm(s, g) || n(n().edges = n().edges.map(Wm(g)), !0), n(n().selectionRectMode = "user", !0), n(n().selectionRect = a, !0);
	}
	function E() {
		if (!o() || !p) return;
		let [e, t] = Pd(S, p, n().autoPanSpeed);
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
	fi(() => {
		typeof window < "u" && D();
	});
	function ee(e) {
		if (!q(v) || !p || !n().selectionRect) return;
		let t = vf(e, p);
		S = {
			x: t.x,
			y: t.y
		};
		let r = Jd({
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
			n(e), z();
		},
		get panOnDrag() {
			return r();
		},
		set panOnDrag(e = !0) {
			r(e), z();
		},
		get paneClickDistance() {
			return i();
		},
		set paneClickDistance(e = 1) {
			i(e), z();
		},
		get selectionOnDrag() {
			return a();
		},
		set selectionOnDrag(e) {
			a(e), z();
		},
		get autoPanOnSelection() {
			return o();
		},
		set autoPanOnSelection(e = !0) {
			o(e), z();
		},
		get onpaneclick() {
			return s();
		},
		set onpaneclick(e) {
			s(e), z();
		},
		get onpanecontextmenu() {
			return c();
		},
		set onpanecontextmenu(e) {
			c(e), z();
		},
		get onselectionstart() {
			return l();
		},
		set onselectionstart(e) {
			l(e), z();
		},
		get onselectionend() {
			return u();
		},
		set onselectionend(e) {
			u(e), z();
		},
		get children() {
			return d();
		},
		set children(e) {
			d(e), z();
		}
	}, k = Km();
	let oe;
	var se = /* @__PURE__ */ L(() => q(y) ? void 0 : Um(ae, f)), A = /* @__PURE__ */ L(() => Um(re, f));
	return ui(mn(k), d), N(k), ua(k, (e) => f = e, () => f), W((e) => oe = Li(k, 1, "svelte-flow__pane svelte-flow__container", null, oe, {
		draggable: e,
		dragging: n().dragging,
		selection: q(v)
	}), [() => r() === !0 || Array.isArray(r()) && r().includes(0)]), jr("click", k, function(...e) {
		q(se)?.apply(this, e);
	}), Ar("pointerdown", k, function(...e) {
		(q(y) ? w : void 0)?.apply(this, e);
	}, !0), jr("pointermove", k, function(...e) {
		(q(y) ? ee : void 0)?.apply(this, e);
	}), jr("pointerup", k, te), Ar("pointercancel", k, function(...e) {
		(q(y) ? ne : void 0)?.apply(this, e);
	}), jr("contextmenu", k, function(...e) {
		q(A)?.apply(this, e);
	}), Ar("click", k, function(...e) {
		(q(y) ? ie : void 0)?.apply(this, e);
	}, !0), Y(e, k), I(O);
}
Mr([
	"click",
	"pointermove",
	"pointerup",
	"contextmenu"
]), Q(qm, {
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
var Jm = /* @__PURE__ */ J("<div class=\"svelte-flow__viewport xyflow__viewport svelte-flow__container\"><!></div>");
function Ym(e, t) {
	F(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "children", 7);
	var i = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		},
		get children() {
			return r();
		},
		set children(e) {
			r(e), z();
		}
	}, a = Jm();
	let o;
	return ui(mn(a), r), N(a), W(() => o = zi(a, "", o, { transform: `translate(${n().viewport.x ?? ""}px, ${n().viewport.y ?? ""}px) scale(${n().viewport.zoom ?? ""})` })), Y(e, a), I(i);
}
Q(Ym, {
	store: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/drag/index.js
function Xm(e, t) {
	let { store: n, onDrag: r, onDragStart: i, onDragStop: a, onNodeMouseDown: o } = t, s = pp({
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
var Zm = /* @__PURE__ */ J("<div aria-live=\"assertive\" aria-atomic=\"true\" class=\"a11y-live-msg svelte-13pq11u\"> </div>"), Qm = /* @__PURE__ */ J("<div class=\"a11y-hidden svelte-13pq11u\"> </div> <div class=\"a11y-hidden svelte-13pq11u\"> </div> <!>", 1), $m = {
	hash: "svelte-13pq11u",
	code: ".a11y-hidden.svelte-13pq11u {display:none;}.a11y-live-msg.svelte-13pq11u {position:absolute;width:1px;height:1px;margin:-1px;border:0;padding:0;overflow:hidden;clip:rect(0px, 0px, 0px, 0px);clip-path:inset(100%);}"
};
function eh(e, t) {
	F(t, !0), Ei(e, $m);
	let n = Z(t, "store", 7);
	var r = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		}
	}, i = Qm(), a = H(i), o = hn(a, !0), s = U(a, 2), c = hn(s, !0), l = U(s, 2), u = (e) => {
		var t = Zm(), r = hn(t, !0);
		W(() => {
			X(t, "id", `${rh}-${n().flowId}`), ni(r, n().ariaLiveMessage);
		}), Y(e, t);
	};
	return mi(l, (e) => {
		n().disableKeyboardA11y || e(u);
	}), W(() => {
		X(a, "id", `${th}-${n().flowId}`), ni(o, n().disableKeyboardA11y ? n().ariaLabelConfig["node.a11yDescription.default"] : n().ariaLabelConfig["node.a11yDescription.keyboardDisabled"]), X(s, "id", `${nh}-${n().flowId}`), ni(c, n().ariaLabelConfig["edge.a11yDescription.default"]);
	}), Y(e, i), I(r);
}
Q(eh, { store: {} }, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/A11yDescriptions/index.js
var th = "svelte-flow__node-desc", nh = "svelte-flow__edge-desc", rh = "svelte-flow__aria-live", ih = /* @__PURE__ */ J("<div><!></div>");
function ah(e, t) {
	F(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "node", 7), i = Z(t, "resizeObserver", 7), a = Z(t, "nodeClickDistance", 7), o = Z(t, "onnodeclick", 7), s = Z(t, "onnodedrag", 7), c = Z(t, "onnodedragstart", 7), l = Z(t, "onnodedragstop", 7), u = Z(t, "onnodepointerenter", 7), d = Z(t, "onnodepointerleave", 7), f = Z(t, "onnodepointermove", 7), p = Z(t, "onnodecontextmenu", 7), m = /* @__PURE__ */ L(() => b(r().data, () => ({}), !0)), h = /* @__PURE__ */ L(() => b(r().selected, !1)), g = /* @__PURE__ */ L(() => r().draggable), _ = /* @__PURE__ */ L(() => r().selectable), v = /* @__PURE__ */ L(() => b(r().deletable, !0)), y = /* @__PURE__ */ L(() => r().connectable), x = /* @__PURE__ */ L(() => r().focusable), S = /* @__PURE__ */ L(() => b(r().hidden, !1)), C = /* @__PURE__ */ L(() => b(r().dragging, !1)), w = /* @__PURE__ */ L(() => b(r().style, "")), T = /* @__PURE__ */ L(() => r().class), E = /* @__PURE__ */ L(() => b(r().type, "default")), D = /* @__PURE__ */ L(() => r().parentId), ee = /* @__PURE__ */ L(() => r().sourcePosition), te = /* @__PURE__ */ L(() => r().targetPosition), ne = /* @__PURE__ */ L(() => b(r().measured, () => ({
		width: 0,
		height: 0
	}), !0).width), re = /* @__PURE__ */ L(() => b(r().measured, () => ({
		width: 0,
		height: 0
	}), !0).height), ie = /* @__PURE__ */ L(() => r().initialWidth), ae = /* @__PURE__ */ L(() => r().initialHeight), O = /* @__PURE__ */ L(() => r().width), k = /* @__PURE__ */ L(() => r().height), oe = /* @__PURE__ */ L(() => r().dragHandle), se = /* @__PURE__ */ L(() => b(r().internals.z, 0)), A = /* @__PURE__ */ L(() => r().internals.positionAbsolute.x), ce = /* @__PURE__ */ L(() => r().internals.positionAbsolute.y), le = /* @__PURE__ */ L(() => r().internals.userNode), { id: ue } = r(), de = /* @__PURE__ */ L(() => q(g) ?? n().nodesDraggable), fe = /* @__PURE__ */ L(() => q(_) ?? n().elementsSelectable), pe = /* @__PURE__ */ L(() => q(y) ?? n().nodesConnectable), me = /* @__PURE__ */ L(() => nf(r())), he = /* @__PURE__ */ L(() => !!r().internals.handleBounds), ge = /* @__PURE__ */ L(() => q(me) && q(he)), _e = /* @__PURE__ */ L(() => q(x) ?? n().nodesFocusable);
	function ve(e) {
		return n().parentLookup.has(e);
	}
	let ye = /* @__PURE__ */ L(() => ve(ue)), be = /* @__PURE__ */ B(null), xe = null, j = q(E), Se = q(ee), M = q(te), Ce = /* @__PURE__ */ L(() => n().nodeTypes[q(E)] ?? $p), we = /* @__PURE__ */ L(() => n().ariaLabelConfig);
	Wp(ue), Kp({ get value() {
		return q(pe);
	} }), process.env.NODE_ENV === "development" && Dn(() => {
		n().nodeTypes[q(E)] || n().onerror("003", sd.error003(q(E)));
	});
	let Te = /* @__PURE__ */ L(() => {
		let e = q(ne) === void 0 ? q(O) ?? q(ie) : q(O), t = q(re) === void 0 ? q(k) ?? q(ae) : q(k);
		if (e !== void 0 || t !== void 0 || q(w) !== void 0) return `${q(w)};${e ? `width:${um(e)};` : ""}${t ? `height:${um(t)};` : ""}`;
	});
	Dn(() => {
		(q(E) !== j || q(ee) !== Se || q(te) !== M) && q(be) !== null && requestAnimationFrame(() => {
			q(be) !== null && n().updateNodeInternals(/* @__PURE__ */ new Map([[ue, {
				id: ue,
				nodeElement: q(be),
				force: !0
			}]]));
		}), j = q(E), Se = q(ee), M = q(te);
	}), Dn(() => {
		i() && (!q(ge) || q(be) !== xe) && (xe && i().unobserve(xe), q(be) && i().observe(q(be)), xe = q(be));
	}), fi(() => {
		xe && i()?.unobserve(xe);
	});
	function Ee(e) {
		q(fe) && (!n().selectNodesOnDrag || !q(de) || n().nodeDragThreshold > 0) && n().handleNodeSelection(ue), o()?.({
			node: q(le),
			event: e
		});
	}
	function De(e) {
		if (!(gf(e) || n().disableKeyboardA11y)) {
			if (ld.includes(e.key) && q(fe)) {
				let t = e.key === "Escape";
				n().handleNodeSelection(ue, t, q(be));
			} else q(de) && r().selected && Object.prototype.hasOwnProperty.call(dm, e.key) && (e.preventDefault(), n(n().ariaLiveMessage = q(we)["node.a11yDescription.ariaLiveMessage"]({
				direction: e.key.replace("Arrow", "").toLowerCase(),
				x: ~~r().internals.positionAbsolute.x,
				y: ~~r().internals.positionAbsolute.y
			}), !0), n().moveSelectedNodes(dm[e.key], e.shiftKey ? 4 : 1));
		}
	}
	let Oe = () => {
		if (n().disableKeyboardA11y || !n().autoPanOnNodeFocus || !q(be)?.matches(":focus-visible")) return;
		let { width: e, height: t, viewport: i } = n();
		wd(/* @__PURE__ */ new Map([[ue, r()]]), {
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
	var ke = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		},
		get node() {
			return r();
		},
		set node(e) {
			r(e), z();
		},
		get resizeObserver() {
			return i();
		},
		set resizeObserver(e) {
			i(e), z();
		},
		get nodeClickDistance() {
			return a();
		},
		set nodeClickDistance(e) {
			a(e), z();
		},
		get onnodeclick() {
			return o();
		},
		set onnodeclick(e) {
			o(e), z();
		},
		get onnodedrag() {
			return s();
		},
		set onnodedrag(e) {
			s(e), z();
		},
		get onnodedragstart() {
			return c();
		},
		set onnodedragstart(e) {
			c(e), z();
		},
		get onnodedragstop() {
			return l();
		},
		set onnodedragstop(e) {
			l(e), z();
		},
		get onnodepointerenter() {
			return u();
		},
		set onnodepointerenter(e) {
			u(e), z();
		},
		get onnodepointerleave() {
			return d();
		},
		set onnodepointerleave(e) {
			d(e), z();
		},
		get onnodepointermove() {
			return f();
		},
		set onnodepointermove(e) {
			f(e), z();
		},
		get onnodecontextmenu() {
			return p();
		},
		set onnodecontextmenu(e) {
			p(e), z();
		}
	}, Ae = Ur(), je = H(Ae), Me = (e) => {
		var t = ih();
		ra(t, () => ({
			"data-id": ue,
			class: [
				"svelte-flow__node",
				`svelte-flow__node-${q(E)}`,
				q(T)
			],
			style: q(Te),
			onclick: Ee,
			onpointerenter: u() ? (e) => u()({
				node: q(le),
				event: e
			}) : void 0,
			onpointerleave: d() ? (e) => d()({
				node: q(le),
				event: e
			}) : void 0,
			onpointermove: f() ? (e) => f()({
				node: q(le),
				event: e
			}) : void 0,
			oncontextmenu: p() ? (e) => p()({
				node: q(le),
				event: e
			}) : void 0,
			onkeydown: q(_e) ? De : void 0,
			onfocus: q(_e) ? Oe : void 0,
			tabIndex: q(_e) ? 0 : void 0,
			role: r().ariaRole ?? (q(_e) ? "group" : void 0),
			"aria-label": r().ariaLabel,
			"aria-roledescription": "node",
			"aria-describedby": n().disableKeyboardA11y ? void 0 : `${th}-${n().flowId}`,
			...r().domAttributes,
			[qi]: {
				dragging: q(C),
				selected: q(h),
				draggable: q(de),
				connectable: q(pe),
				selectable: q(fe),
				nopan: q(de),
				parent: q(ye)
			},
			[Ji]: {
				"z-index": q(se),
				transform: `translate(${q(A) ?? ""}px, ${q(ce) ?? ""}px)`,
				visibility: q(me) ? "visible" : "hidden"
			}
		})), Ti(mn(t), () => q(Ce), (e, t) => {
			t(e, {
				get data() {
					return q(m);
				},
				get id() {
					return ue;
				},
				get selected() {
					return q(h);
				},
				get selectable() {
					return q(fe);
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
					return q(de);
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
					return q(pe);
				},
				get positionAbsoluteX() {
					return q(A);
				},
				get positionAbsoluteY() {
					return q(ce);
				},
				get width() {
					return q(O);
				},
				get height() {
					return q(k);
				}
			});
		}), N(t), Di(t, (e, t) => Xm?.(e, t), () => ({
			nodeId: ue,
			isSelectable: q(fe),
			disabled: !q(de),
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
		})), ua(t, (e) => V(be, e), () => q(be)), Y(e, t);
	};
	return mi(je, (e) => {
		q(S) || e(Me);
	}), Y(e, Ae), I(ke);
}
Q(ah, {
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
var oh = /* @__PURE__ */ J("<div class=\"svelte-flow__nodes\"></div>");
function sh(e, t) {
	F(t, !0);
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
	fi(() => {
		f?.disconnect();
	});
	var p = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		},
		get nodeClickDistance() {
			return r();
		},
		set nodeClickDistance(e) {
			r(e), z();
		},
		get onnodeclick() {
			return i();
		},
		set onnodeclick(e) {
			i(e), z();
		},
		get onnodecontextmenu() {
			return a();
		},
		set onnodecontextmenu(e) {
			a(e), z();
		},
		get onnodepointerenter() {
			return o();
		},
		set onnodepointerenter(e) {
			o(e), z();
		},
		get onnodepointermove() {
			return s();
		},
		set onnodepointermove(e) {
			s(e), z();
		},
		get onnodepointerleave() {
			return c();
		},
		set onnodepointerleave(e) {
			c(e), z();
		},
		get onnodedrag() {
			return l();
		},
		set onnodedrag(e) {
			l(e), z();
		},
		get onnodedragstart() {
			return u();
		},
		set onnodedragstart(e) {
			u(e), z();
		},
		get onnodedragstop() {
			return d();
		},
		set onnodedragstop(e) {
			d(e), z();
		}
	}, m = oh();
	return yi(m, 21, () => n().visible.nodes.values(), (e) => e.id, (e, t) => {
		ah(e, {
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
	}), N(m), Y(e, m), I(p);
}
Q(sh, {
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
var ch = /* @__PURE__ */ Vr("<svg class=\"svelte-flow__edge-wrapper\"><g><!></g></svg>");
function lh(e, t) {
	F(t, !0);
	let n = Z(t, "edge", 7), r = Z(t, "store", 15), i = Z(t, "onedgeclick", 7), a = Z(t, "onedgecontextmenu", 7), o = Z(t, "onedgepointerenter", 7), s = Z(t, "onedgepointerleave", 7), c = /* @__PURE__ */ L(() => n().id), l = /* @__PURE__ */ L(() => n().source), u = /* @__PURE__ */ L(() => n().target), d = /* @__PURE__ */ L(() => n().sourceX), f = /* @__PURE__ */ L(() => n().sourceY), p = /* @__PURE__ */ L(() => n().targetX), m = /* @__PURE__ */ L(() => n().targetY), h = /* @__PURE__ */ L(() => n().sourcePosition), g = /* @__PURE__ */ L(() => n().targetPosition), _ = /* @__PURE__ */ L(() => b(n().animated, !1)), v = /* @__PURE__ */ L(() => b(n().selected, !1)), y = /* @__PURE__ */ L(() => n().label), x = /* @__PURE__ */ L(() => n().labelStyle), S = /* @__PURE__ */ L(() => b(n().data, () => ({}), !0)), C = /* @__PURE__ */ L(() => n().style), w = /* @__PURE__ */ L(() => n().interactionWidth), T = /* @__PURE__ */ L(() => b(n().type, "default")), E = /* @__PURE__ */ L(() => n().sourceHandle), D = /* @__PURE__ */ L(() => n().targetHandle), ee = /* @__PURE__ */ L(() => n().markerStart), te = /* @__PURE__ */ L(() => n().markerEnd), ne = /* @__PURE__ */ L(() => n().selectable), re = /* @__PURE__ */ L(() => n().focusable), ie = /* @__PURE__ */ L(() => b(n().deletable, !0)), ae = /* @__PURE__ */ L(() => n().hidden), O = /* @__PURE__ */ L(() => n().zIndex), k = /* @__PURE__ */ L(() => n().class), oe = /* @__PURE__ */ L(() => n().ariaLabel);
	Jp(q(c));
	let se = null, A = /* @__PURE__ */ L(() => q(ne) ?? r().elementsSelectable), ce = /* @__PURE__ */ L(() => q(re) ?? r().edgesFocusable), le = /* @__PURE__ */ L(() => r().edgeTypes[q(T)] ?? bm), ue = /* @__PURE__ */ L(() => q(ee) ? `url('#${Hf(q(ee), r().flowId)}')` : void 0), de = /* @__PURE__ */ L(() => q(te) ? `url('#${Hf(q(te), r().flowId)}')` : void 0);
	function fe(e) {
		let t = r().edgeLookup.get(q(c));
		t && (q(A) && r().handleEdgeSelection(q(c)), i()?.({
			event: e,
			edge: t
		}));
	}
	function pe(e, t) {
		let n = r().edgeLookup.get(q(c));
		n && t({
			event: e,
			edge: n
		});
	}
	function me(e) {
		if (!r().disableKeyboardA11y && ld.includes(e.key) && q(A)) {
			let { unselectNodesAndEdges: t, addSelectedEdges: i } = r();
			e.key === "Escape" ? (se?.blur(), t({ edges: [n()] })) : i([q(c)]);
		}
	}
	var he = {
		get edge() {
			return n();
		},
		set edge(e) {
			n(e), z();
		},
		get store() {
			return r();
		},
		set store(e) {
			r(e), z();
		},
		get onedgeclick() {
			return i();
		},
		set onedgeclick(e) {
			i(e), z();
		},
		get onedgecontextmenu() {
			return a();
		},
		set onedgecontextmenu(e) {
			a(e), z();
		},
		get onedgepointerenter() {
			return o();
		},
		set onedgepointerenter(e) {
			o(e), z();
		},
		get onedgepointerleave() {
			return s();
		},
		set onedgepointerleave(e) {
			s(e), z();
		}
	}, ge = Ur(), _e = H(ge), ve = (e) => {
		var t = ch();
		let i;
		var b = mn(t);
		ra(b, () => ({
			class: ["svelte-flow__edge", q(k)],
			"data-id": q(c),
			onclick: fe,
			oncontextmenu: a() ? (e) => {
				pe(e, a());
			} : void 0,
			onpointerenter: o() ? (e) => {
				pe(e, o());
			} : void 0,
			onpointerleave: s() ? (e) => {
				pe(e, s());
			} : void 0,
			"aria-label": q(oe) === null ? void 0 : q(oe) ? q(oe) : `Edge from ${q(l)} to ${q(u)}`,
			"aria-describedby": q(ce) ? `${nh}-${r().flowId}` : void 0,
			role: n().ariaRole ?? (q(ce) ? "group" : "img"),
			"aria-roledescription": "edge",
			onkeydown: q(ce) ? me : void 0,
			tabindex: q(ce) ? 0 : void 0,
			...n().domAttributes,
			[qi]: {
				animated: q(_),
				selected: q(v),
				selectable: q(A)
			}
		})), Ti(mn(b), () => q(le), (e, t) => {
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
					return q(A);
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
					return q(ue);
				},
				get markerEnd() {
					return q(de);
				}
			});
		}), N(b), ua(b, (e) => se = e, () => se), N(t), W(() => i = zi(t, "", i, { "z-index": q(O) })), Y(e, t);
	};
	return mi(_e, (e) => {
		q(ae) || e(ve);
	}), Y(e, ge), I(he);
}
//#endregion
//#region node_modules/svelte/src/internal/flags/legacy.js
Q(lh, {
	edge: {},
	store: {},
	onedgeclick: {},
	onedgecontextmenu: {},
	onedgepointerenter: {},
	onedgepointerleave: {}
}, [], [], { mode: "open" }), Ge();
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/MarkerDefinition.svelte
var uh = /* @__PURE__ */ Vr("<defs></defs>");
function dh(e, t) {
	F(t, !1);
	let n = Lm();
	da();
	var r = uh();
	yi(r, 5, () => n.markers, (e) => e.id, (e, t) => {
		hh(e, va(() => q(t)));
	}), N(r), Y(e, r), I();
}
Q(dh, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/Marker.svelte
var fh = /* @__PURE__ */ Vr("<polyline class=\"arrow\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4\"></polyline>"), ph = /* @__PURE__ */ Vr("<polyline class=\"arrowclosed\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4 -5,-4\"></polyline>"), mh = /* @__PURE__ */ Vr("<marker class=\"svelte-flow__arrowhead\" viewBox=\"-10 -10 20 20\" refX=\"0\" refY=\"0\"><!></marker>");
function hh(e, t) {
	F(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "type", 7), i = Z(t, "width", 7, 12.5), a = Z(t, "height", 7, 12.5), o = Z(t, "markerUnits", 7, "strokeWidth"), s = Z(t, "orient", 7, "auto-start-reverse"), c = Z(t, "color", 7, "none"), l = Z(t, "strokeWidth", 7);
	var u = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), z();
		},
		get type() {
			return r();
		},
		set type(e) {
			r(e), z();
		},
		get width() {
			return i();
		},
		set width(e = 12.5) {
			i(e), z();
		},
		get height() {
			return a();
		},
		set height(e = 12.5) {
			a(e), z();
		},
		get markerUnits() {
			return o();
		},
		set markerUnits(e = "strokeWidth") {
			o(e), z();
		},
		get orient() {
			return s();
		},
		set orient(e = "auto-start-reverse") {
			s(e), z();
		},
		get color() {
			return c();
		},
		set color(e = "none") {
			c(e), z();
		},
		get strokeWidth() {
			return l();
		},
		set strokeWidth(e) {
			l(e), z();
		}
	}, d = mh(), f = mn(d), p = (e) => {
		var t = fh();
		let n;
		W(() => {
			X(t, "stroke-width", l()), n = zi(t, "", n, { stroke: c() });
		}), Y(e, t);
	}, m = (e) => {
		var t = ph();
		let n;
		W(() => {
			X(t, "stroke-width", l()), n = zi(t, "", n, {
				stroke: c(),
				fill: c()
			});
		}), Y(e, t);
	};
	return mi(f, (e) => {
		r() === gd.Arrow ? e(p) : r() === gd.ArrowClosed && e(m, 1);
	}), N(d), W(() => {
		X(d, "id", n()), X(d, "markerWidth", `${i()}`), X(d, "markerHeight", `${a()}`), X(d, "markerUnits", o()), X(d, "orient", s());
	}), Y(e, d), I(u);
}
Q(hh, {
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
var gh = /* @__PURE__ */ J("<div class=\"svelte-flow__edges\"><svg class=\"svelte-flow__marker\"><!></svg> <!></div>");
function _h(e, t) {
	F(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "onedgeclick", 7), i = Z(t, "onedgecontextmenu", 7), a = Z(t, "onedgepointerenter", 7), o = Z(t, "onedgepointerleave", 7);
	var s = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		},
		get onedgeclick() {
			return r();
		},
		set onedgeclick(e) {
			r(e), z();
		},
		get onedgecontextmenu() {
			return i();
		},
		set onedgecontextmenu(e) {
			i(e), z();
		},
		get onedgepointerenter() {
			return a();
		},
		set onedgepointerenter(e) {
			a(e), z();
		},
		get onedgepointerleave() {
			return o();
		},
		set onedgepointerleave(e) {
			o(e), z();
		}
	}, c = gh(), l = mn(c);
	return dh(mn(l), {}), N(l), yi(U(l, 2), 17, () => n().visible.edges.values(), (e) => e.id, (e, t) => {
		lh(e, {
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
	}), N(c), Y(e, c), I(s);
}
Q(_h, {
	store: {},
	onedgeclick: {},
	onedgecontextmenu: {},
	onedgepointerenter: {},
	onedgepointerleave: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Selection/Selection.svelte
var vh = /* @__PURE__ */ J("<div class=\"svelte-flow__selection svelte-1vr3gfi\"></div>"), yh = {
	hash: "svelte-1vr3gfi",
	code: ".svelte-flow__selection.svelte-1vr3gfi {position:absolute;top:0;left:0;}"
};
function bh(e, t) {
	F(t, !0), Ei(e, yh);
	let n = Z(t, "x", 7, 0), r = Z(t, "y", 7, 0), i = Z(t, "width", 7, 0), a = Z(t, "height", 7, 0), o = Z(t, "isVisible", 7, !0);
	var s = {
		get x() {
			return n();
		},
		set x(e = 0) {
			n(e), z();
		},
		get y() {
			return r();
		},
		set y(e = 0) {
			r(e), z();
		},
		get width() {
			return i();
		},
		set width(e = 0) {
			i(e), z();
		},
		get height() {
			return a();
		},
		set height(e = 0) {
			a(e), z();
		},
		get isVisible() {
			return o();
		},
		set isVisible(e = !0) {
			o(e), z();
		}
	}, c = Ur(), l = H(c), u = (e) => {
		var t = vh();
		let o;
		W((e, i) => o = zi(t, "", o, {
			width: e,
			height: i,
			transform: `translate(${n()}px, ${r()}px)`
		}), [() => typeof i() == "string" ? i() : um(i()), () => typeof a() == "string" ? a() : um(a())]), Y(e, t);
	};
	return mi(l, (e) => {
		o() && e(u);
	}), Y(e, c), I(s);
}
Q(bh, {
	x: {},
	y: {},
	width: {},
	height: {},
	isVisible: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/NodeSelection/NodeSelection.svelte
var xh = /* @__PURE__ */ J("<div><!></div>"), Sh = {
	hash: "svelte-sf2y5e",
	code: ".svelte-flow__selection-wrapper.svelte-sf2y5e {position:absolute;top:0;left:0;z-index:2000;pointer-events:all;}.svelte-flow__selection-wrapper.svelte-sf2y5e:focus,\n  .svelte-flow__selection-wrapper.svelte-sf2y5e:focus-visible {outline:none;}"
};
function Ch(e, t) {
	F(t, !0), Ei(e, Sh);
	let n = Z(t, "store", 15), r = Z(t, "onnodedrag", 7), i = Z(t, "onnodedragstart", 7), a = Z(t, "onnodedragstop", 7), o = Z(t, "onselectionclick", 7), s = Z(t, "onselectioncontextmenu", 7), c = /* @__PURE__ */ B(void 0);
	Dn(() => {
		n().disableKeyboardA11y || q(c)?.focus({ preventScroll: !0 });
	});
	let l = /* @__PURE__ */ L(() => {
		if (n().selectionRectMode === "nodes") {
			n().nodes;
			let e = Cd(n().nodeLookup, { filter: (e) => !!e.selected });
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
		Object.prototype.hasOwnProperty.call(dm, e.key) && (e.preventDefault(), n().moveSelectedNodes(dm[e.key], e.shiftKey ? 4 : 1));
	}
	var p = {
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		},
		get onnodedrag() {
			return r();
		},
		set onnodedrag(e) {
			r(e), z();
		},
		get onnodedragstart() {
			return i();
		},
		set onnodedragstart(e) {
			i(e), z();
		},
		get onnodedragstop() {
			return a();
		},
		set onnodedragstop(e) {
			a(e), z();
		},
		get onselectionclick() {
			return o();
		},
		set onselectionclick(e) {
			o(e), z();
		},
		get onselectioncontextmenu() {
			return s();
		},
		set onselectioncontextmenu(e) {
			s(e), z();
		}
	}, m = Ur(), h = H(m), g = (e) => {
		var t = xh();
		let o;
		bh(mn(t), {
			width: "100%",
			height: "100%",
			x: 0,
			y: 0
		}), N(t), Di(t, (e, t) => Xm?.(e, t), () => ({
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
		})), ua(t, (e) => V(c, e), () => q(c)), W((e, r) => {
			Li(t, 1, ji(["svelte-flow__selection-wrapper", n().noPanClass]), "svelte-sf2y5e"), X(t, "role", n().disableKeyboardA11y ? void 0 : "button"), X(t, "tabindex", n().disableKeyboardA11y ? void 0 : -1), o = zi(t, "", o, {
				width: e,
				height: r,
				transform: `translate(${q(l).x ?? ""}px, ${q(l).y ?? ""}px)`
			});
		}, [() => um(q(l).width), () => um(q(l).height)]), jr("contextmenu", t, u), jr("click", t, d), jr("keydown", t, function(...e) {
			(n().disableKeyboardA11y ? void 0 : f)?.apply(this, e);
		}), Y(e, t);
	}, _ = /* @__PURE__ */ L(() => n().selectionRectMode === "nodes" && q(l) && Wd(q(l).x) && Wd(q(l).y));
	return mi(h, (e) => {
		q(_) && e(g);
	}), Y(e, m), I(p);
}
Mr([
	"contextmenu",
	"click",
	"keydown"
]), Q(Ch, {
	store: {},
	onnodedrag: {},
	onnodedragstart: {},
	onnodedragstop: {},
	onselectionclick: {},
	onselectioncontextmenu: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@svelte-put/shortcut/src/shortcut.js
function wh(e) {
	switch (e) {
		case "none": return 0;
		case "ctrl": return 8;
		case "shift": return 4;
		case "alt": return 2;
		case "meta": return 1;
	}
}
function Th(e, t) {
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
					for (let n of e) if ((Array.isArray(n) ? n : [n]).reduce((e, t) => e | wh(t), 0) === i) {
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
	return n && (o = kr(e, i, a)), {
		update: (t) => {
			let { enabled: s = !0, type: c = "keydown" } = t;
			n && (!s || i !== c) ? o?.() : !n && s && (o = kr(e, c, a)), n = s, i = c, r = t.trigger;
		},
		destroy: () => {
			o?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useSvelteFlow.svelte.js
function Eh() {
	let e = /* @__PURE__ */ L(Lm), t = (t) => {
		let n = cm(t) ? t : q(e).nodeLookup.get(t.id), r = n.parentId ? rf(n.position, n.measured, n.parentId, q(e).nodeLookup, q(e).nodeOrigin) : n.position;
		return Rd({
			...n,
			position: r,
			width: n.measured?.width ?? n.width,
			height: n.measured?.height ?? n.height
		});
	};
	function n(t, n, r = { replace: !1 }) {
		q(e).nodes = Sr(() => q(e).nodes).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r?.replace && cm(t) ? t : {
					...e,
					...t
				};
			}
			return e;
		});
	}
	function r(t, n, r = { replace: !1 }) {
		q(e).edges = Sr(() => q(e).edges).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r.replace && lm(t) ? t : {
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
		getNodes: (t) => t === void 0 ? q(e).nodes : Dh(q(e).nodeLookup, t),
		getEdge: (t) => q(e).edgeLookup.get(t),
		getEdges: (t) => t === void 0 ? q(e).edges : Dh(q(e).edgeLookup, t),
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
		getViewport: () => qe(q(e).viewport),
		setCenter: async (t, n, r) => q(e).setCenter(t, n, r),
		fitView: (t) => q(e).fitView(t),
		fitBounds: async (t, n) => {
			if (!q(e).panZoom) return !1;
			let r = Qd(t, q(e).width, q(e).height, q(e).minZoom, q(e).maxZoom, n?.padding ?? .1);
			return await q(e).panZoom.setViewport(r, {
				duration: n?.duration,
				ease: n?.ease,
				interpolate: n?.interpolate
			}), !0;
		},
		getIntersectingNodes: (n, r = !0, i) => {
			let a = Ud(n), o = a ? n : t(n);
			return o ? (i || q(e).nodes).filter((t) => {
				let i = q(e).nodeLookup.get(t.id);
				if (!i || !a && t.id === n.id) return !1;
				let s = Rd(i), c = Hd(s, o);
				return r && c > 0 || c >= s.width * s.height || c >= o.width * o.height;
			}) : [];
		},
		isNodeIntersecting: (e, n, r = !0) => {
			let i = Ud(e) ? e : t(e);
			if (!i) return !1;
			let a = Hd(i, n);
			return r && a > 0 || a >= n.width * n.height || a >= i.width * i.height;
		},
		deleteElements: async ({ nodes: t = [], edges: n = [] }) => {
			let { nodes: r, edges: i } = await kd({
				nodesToRemove: t,
				edgesToRemove: n,
				nodes: q(e).nodes,
				edges: q(e).edges,
				onBeforeDelete: q(e).onbeforedelete
			});
			return r && (q(e).nodes = Sr(() => q(e).nodes).filter((e) => !r.some(({ id: t }) => t === e.id))), i && (q(e).edges = Sr(() => q(e).edges).filter((e) => !i.some(({ id: t }) => t === e.id))), (r.length > 0 || i.length > 0) && q(e).ondelete?.({
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
			return qd({
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
			let { x: n, y: r, zoom: i } = q(e).viewport, { x: a, y: o } = q(e).domNode.getBoundingClientRect(), s = Jd(t, [
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
		getNodesBounds: (t) => Sd(t, {
			nodeLookup: q(e).nodeLookup,
			nodeOrigin: q(e).nodeOrigin
		}),
		getHandleConnections: ({ type: t, id: n, nodeId: r }) => Array.from(q(e).connectionLookup.get(`${r}-${t}-${n ?? null}`)?.values() ?? [])
	};
}
function Dh(e, t) {
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
function Oh(e, t) {
	F(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "selectionKey", 7, "Shift"), i = Z(t, "multiSelectionKey", 23, () => $d() ? "Meta" : "Control"), a = Z(t, "deleteKey", 7, "Backspace"), o = Z(t, "panActivationKey", 7, " "), s = Z(t, "zoomActivationKey", 23, () => $d() ? "Meta" : "Control"), { deleteElements: c } = Eh();
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
	return Ar("blur", on, p), Ar("contextmenu", on, p), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !0, !0)),
		type: "keydown"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !1, !0)),
		type: "keyup"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(i(), () => {
			n(n().multiselectionKeyPressed = !0, !0);
		}),
		type: "keydown"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(i(), () => n(n().multiselectionKeyPressed = !1, !0)),
		type: "keyup"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(a(), (e) => {
			!(e.originalEvent.ctrlKey || e.originalEvent.metaKey || e.originalEvent.shiftKey) && !gf(e.originalEvent) && (n(n().deleteKeyPressed = !0, !0), m());
		}),
		type: "keydown"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(a(), () => n(n().deleteKeyPressed = !1, !0)),
		type: "keyup"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), Di(on, (e, t) => Th?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), I({
		get store() {
			return n();
		},
		set store(e) {
			n(e), z();
		},
		get selectionKey() {
			return r();
		},
		set selectionKey(e = "Shift") {
			r(e), z();
		},
		get multiSelectionKey() {
			return i();
		},
		set multiSelectionKey(e = $d() ? "Meta" : "Control") {
			i(e), z();
		},
		get deleteKey() {
			return a();
		},
		set deleteKey(e = "Backspace") {
			a(e), z();
		},
		get panActivationKey() {
			return o();
		},
		set panActivationKey(e = " ") {
			o(e), z();
		},
		get zoomActivationKey() {
			return s();
		},
		set zoomActivationKey(e = $d() ? "Meta" : "Control") {
			s(e), z();
		}
	});
}
Q(Oh, {
	store: {},
	selectionKey: {},
	multiSelectionKey: {},
	deleteKey: {},
	panActivationKey: {},
	zoomActivationKey: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/ConnectionLine/ConnectionLine.svelte
var kh = /* @__PURE__ */ Vr("<path fill=\"none\" class=\"svelte-flow__connection-path\"></path>"), Ah = /* @__PURE__ */ Vr("<svg class=\"svelte-flow__connectionline\"><g><!></g></svg>");
function jh(e, t) {
	F(t, !0);
	let n = Z(t, "store", 15), r = Z(t, "type", 7), i = Z(t, "containerStyle", 7), a = Z(t, "style", 7), o = Z(t, "LineComponent", 7), s = /* @__PURE__ */ L(() => {
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
			case hd.Bezier: {
				let [t] = Cf(e);
				return t;
			}
			case hd.Straight: {
				let [t] = Af(e);
				return t;
			}
			case hd.Step:
			case hd.SmoothStep: {
				let [t] = If({
					...e,
					borderRadius: r() === hd.Step ? 0 : void 0
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
			n(e), z();
		},
		get type() {
			return r();
		},
		set type(e) {
			r(e), z();
		},
		get containerStyle() {
			return i();
		},
		set containerStyle(e) {
			i(e), z();
		},
		get style() {
			return a();
		},
		set style(e) {
			a(e), z();
		},
		get LineComponent() {
			return o();
		},
		set LineComponent(e) {
			o(e), z();
		}
	}, l = Ur(), u = H(l), d = (e) => {
		var t = Ah(), r = mn(t), c = mn(r), l = (e) => {
			var t = Ur();
			Ti(H(t), o, (e, t) => {
				t(e, {});
			}), Y(e, t);
		}, u = (e) => {
			var t = kh();
			W(() => {
				X(t, "d", q(s)), zi(t, a());
			}), Y(e, t);
		};
		mi(c, (e) => {
			o() ? e(l) : e(u, -1);
		}), N(r), N(t), W((e) => {
			X(t, "width", n().width), X(t, "height", n().height), zi(t, i()), Li(r, 0, e);
		}, [() => ji(["svelte-flow__connection", df(n().connection.isValid)])]), Y(e, t);
	};
	return mi(u, (e) => {
		n().connection.inProgress && e(d);
	}), Y(e, l), I(c);
}
Q(jh, {
	store: {},
	type: {},
	containerStyle: {},
	style: {},
	LineComponent: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Panel/Panel.svelte
var Mh = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"$$host",
	"position",
	"style",
	"class",
	"children"
]), Nh = /* @__PURE__ */ J("<div><!></div>");
function Ph(e, t) {
	F(t, !0);
	let n = Z(t, "position", 7, "top-right"), r = Z(t, "style", 7), i = Z(t, "class", 7), a = Z(t, "children", 7), o = /* @__PURE__ */ ga(t, Mh), s = /* @__PURE__ */ L(() => `${n()}`.split("-"));
	var c = {
		get position() {
			return n();
		},
		set position(e = "top-right") {
			n(e), z();
		},
		get style() {
			return r();
		},
		set style(e) {
			r(e), z();
		},
		get class() {
			return i();
		},
		set class(e) {
			i(e), z();
		},
		get children() {
			return a();
		},
		set children(e) {
			a(e), z();
		}
	}, l = Nh();
	return ra(l, (e) => ({
		class: e,
		style: r(),
		...o
	}), [() => [
		"svelte-flow__panel",
		i(),
		...q(s)
	]]), ui(mn(l), () => a() ?? g), N(l), Y(e, l), I(c);
}
Q(Ph, {
	position: {},
	style: {},
	class: {},
	children: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Attribution/Attribution.svelte
var Fh = /* @__PURE__ */ J("<a target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Svelte Flow attribution\">Svelte Flow</a>");
function Ih(e, t) {
	F(t, !0);
	let n = Z(t, "proOptions", 7), r = Z(t, "position", 7, "bottom-right"), i = `https://svelteflow.dev${process.env.NODE_ENV === "production" ? "?utm_source=attribution" : "/attribution"}`;
	process.env.NODE_ENV === "development" && Dn(() => {
		cf("svelte");
	});
	var a = {
		get proOptions() {
			return n();
		},
		set proOptions(e) {
			n(e), z();
		},
		get position() {
			return r();
		},
		set position(e = "bottom-right") {
			r(e), z();
		}
	}, o = Ur(), s = H(o), c = (e) => {
		{
			let t = /* @__PURE__ */ L(() => `Please only hide this attribution when you are subscribed to Svelte Flow Pro: ${i}`);
			Ph(e, {
				get position() {
					return r();
				},
				class: "svelte-flow__attribution",
				get "data-message"() {
					return q(t);
				},
				children: (e, t) => {
					var n = Fh();
					W(() => X(n, "href", i)), Y(e, n);
				},
				$$slots: { default: !0 }
			});
		}
	};
	return mi(s, (e) => {
		n()?.hideAttribution || e(c);
	}), Y(e, o), I(a);
}
Q(Ih, {
	proOptions: {},
	position: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/SvelteFlow/Wrapper.svelte
var Lh = /* @__PURE__ */ J("<div><!></div>"), Rh = {
	hash: "svelte-mkap6j",
	code: ".svelte-flow.svelte-mkap6j {width:100%;height:100%;overflow:hidden;position:relative;z-index:0;}"
};
function zh(e, t) {
	F(t, !0), Ei(e, Rh);
	let n = Z(t, "width", 7), r = Z(t, "height", 7), i = Z(t, "colorMode", 7), a = Z(t, "domNode", 15), o = Z(t, "clientWidth", 15), s = Z(t, "clientHeight", 15), c = Z(t, "children", 7), l = Z(t, "rest", 7), u = /* @__PURE__ */ L(() => l().class), d = /* @__PURE__ */ L(() => S(l(), /* @__PURE__ */ "id.class.nodeTypes.edgeTypes.colorMode.isValidConnection.onmove.onmovestart.onmoveend.onflowerror.ondelete.onbeforedelete.onbeforeconnect.onconnect.onconnectstart.onconnectend.onbeforereconnect.onreconnect.onreconnectstart.onreconnectend.onclickconnectstart.onclickconnectend.oninit.onselectionchange.onselectiondragstart.onselectiondrag.onselectiondragstop.onselectionstart.onselectionend.clickConnect.fitView.fitViewOptions.nodeOrigin.nodeDragThreshold.connectionDragThreshold.minZoom.maxZoom.initialViewport.connectionRadius.connectionMode.selectionMode.selectNodesOnDrag.snapGrid.defaultMarkerColor.translateExtent.nodeExtent.onlyRenderVisibleElements.autoPanOnConnect.autoPanOnNodeDrag.colorModeSSR.defaultEdgeOptions.elevateNodesOnSelect.elevateEdgesOnSelect.nodesDraggable.autoPanOnNodeFocus.nodesConnectable.elementsSelectable.nodesFocusable.edgesFocusable.disableKeyboardA11y.noDragClass.noPanClass.noWheelClass.ariaLabelConfig.autoPanSpeed.panOnScrollSpeed.zIndexMode.autoPanOnSelection".split(".")));
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
			n(e), z();
		},
		get height() {
			return r();
		},
		set height(e) {
			r(e), z();
		},
		get colorMode() {
			return i();
		},
		set colorMode(e) {
			i(e), z();
		},
		get domNode() {
			return a();
		},
		set domNode(e) {
			a(e), z();
		},
		get clientWidth() {
			return o();
		},
		set clientWidth(e) {
			o(e), z();
		},
		get clientHeight() {
			return s();
		},
		set clientHeight(e) {
			s(e), z();
		},
		get children() {
			return c();
		},
		set children(e) {
			c(e), z();
		},
		get rest() {
			return l();
		},
		set rest(e) {
			l(e), z();
		}
	}, m = Lh();
	return ra(m, (e, t) => ({
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
		[Ji]: {
			width: e,
			height: t
		}
	}), [() => um(n()), () => um(r())], void 0, void 0, "svelte-mkap6j"), ui(mn(m), () => c() ?? g), N(m), ua(m, (e) => a(e), () => a()), ca(m, "clientHeight", s), ca(m, "clientWidth", o), Y(e, m), I(p);
}
Q(zh, {
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
var Bh = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.$$host.width.height.proOptions.selectionKey.deleteKey.panActivationKey.multiSelectionKey.zoomActivationKey.paneClickDistance.nodeClickDistance.onmovestart.onmoveend.onmove.oninit.onnodeclick.onnodecontextmenu.onnodedrag.onnodedragstart.onnodedragstop.onnodepointerenter.onnodepointermove.onnodepointerleave.onselectionclick.onselectioncontextmenu.onselectionstart.onselectionend.onedgeclick.onedgecontextmenu.onedgepointerenter.onedgepointerleave.onpaneclick.onpanecontextmenu.panOnScrollMode.preventScrolling.zoomOnScroll.zoomOnDoubleClick.zoomOnPinch.panOnScroll.panOnScrollSpeed.panOnDrag.selectionOnDrag.autoPanOnSelection.connectionLineComponent.connectionLineStyle.connectionLineContainerStyle.connectionLineType.attributionPosition.children.nodes.edges.viewport".split(".")), Vh = /* @__PURE__ */ J("<div class=\"svelte-flow__viewport-back svelte-flow__container\"></div> <!> <div class=\"svelte-flow__edge-labels svelte-flow__container\"></div> <!> <!> <!> <div class=\"svelte-flow__viewport-front svelte-flow__container\"></div>", 1), Hh = /* @__PURE__ */ J("<!> <!>", 1), Uh = /* @__PURE__ */ J("<!> <!> <!> <!> <!>", 1);
function Wh(e, t) {
	F(t, !0);
	let n = Z(t, "width", 7), r = Z(t, "height", 7), i = Z(t, "proOptions", 7), a = Z(t, "selectionKey", 7), o = Z(t, "deleteKey", 7), s = Z(t, "panActivationKey", 7), c = Z(t, "multiSelectionKey", 7), l = Z(t, "zoomActivationKey", 7), u = Z(t, "paneClickDistance", 7, 1), d = Z(t, "nodeClickDistance", 7, 1), f = Z(t, "onmovestart", 7), p = Z(t, "onmoveend", 7), m = Z(t, "onmove", 7), h = Z(t, "oninit", 7), _ = Z(t, "onnodeclick", 7), v = Z(t, "onnodecontextmenu", 7), y = Z(t, "onnodedrag", 7), b = Z(t, "onnodedragstart", 7), x = Z(t, "onnodedragstop", 7), S = Z(t, "onnodepointerenter", 7), C = Z(t, "onnodepointermove", 7), w = Z(t, "onnodepointerleave", 7), T = Z(t, "onselectionclick", 7), E = Z(t, "onselectioncontextmenu", 7), D = Z(t, "onselectionstart", 7), ee = Z(t, "onselectionend", 7), te = Z(t, "onedgeclick", 7), ne = Z(t, "onedgecontextmenu", 7), re = Z(t, "onedgepointerenter", 7), ie = Z(t, "onedgepointerleave", 7), ae = Z(t, "onpaneclick", 7), O = Z(t, "onpanecontextmenu", 7), k = Z(t, "panOnScrollMode", 23, () => fd.Free), oe = Z(t, "preventScrolling", 7, !0), se = Z(t, "zoomOnScroll", 7, !0), A = Z(t, "zoomOnDoubleClick", 7, !0), ce = Z(t, "zoomOnPinch", 7, !0), le = Z(t, "panOnScroll", 7, !1), ue = Z(t, "panOnScrollSpeed", 7, .5), de = Z(t, "panOnDrag", 7, !0), fe = Z(t, "selectionOnDrag", 7, !1), pe = Z(t, "autoPanOnSelection", 7, !0), me = Z(t, "connectionLineComponent", 7), he = Z(t, "connectionLineStyle", 7), ge = Z(t, "connectionLineContainerStyle", 7), _e = Z(t, "connectionLineType", 23, () => hd.Bezier), ve = Z(t, "attributionPosition", 7), ye = Z(t, "children", 7), be = Z(t, "nodes", 31, () => nn([])), xe = Z(t, "edges", 31, () => nn([])), j = Z(t, "viewport", 15, void 0), Se = /* @__PURE__ */ ga(t, Bh), M = zm({
		props: Se,
		width: n(),
		height: r(),
		get nodes() {
			return be();
		},
		set nodes(e) {
			be(e);
		},
		get edges() {
			return xe();
		},
		set edges(e) {
			xe(e);
		},
		get viewport() {
			return j();
		},
		set viewport(e) {
			j(e);
		}
	}), Ce = Qe(Rm);
	return Ce && Ce.setStore && Ce.setStore(M), $e(Rm, {
		provider: !1,
		getStore() {
			return M;
		}
	}), Dn(() => {
		let e = {
			nodes: M.selectedNodes,
			edges: M.selectedEdges
		};
		Sr(() => t.onselectionchange)?.(e);
		for (let t of M.selectionChangeHandlers.values()) t(e);
	}), fi(() => {
		Ce?.setStore(zm({
			width: 0,
			height: 0,
			nodes: [],
			edges: [],
			props: {}
		}));
	}), zh(e, {
		get colorMode() {
			return M.colorMode;
		},
		get width() {
			return n();
		},
		get height() {
			return r();
		},
		get rest() {
			return Se;
		},
		get domNode() {
			return M.domNode;
		},
		set domNode(e) {
			M.domNode = e;
		},
		get clientWidth() {
			return M.width;
		},
		set clientWidth(e) {
			M.width = e;
		},
		get clientHeight() {
			return M.height;
		},
		set clientHeight(e) {
			M.height = e;
		},
		children: (e, t) => {
			var n = Uh(), r = H(n);
			Oh(r, {
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
					return M;
				},
				set store(e) {
					M = e;
				}
			});
			var be = U(r, 2);
			Hm(be, {
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
					return A();
				},
				get zoomOnPinch() {
					return ce();
				},
				get panOnScroll() {
					return le();
				},
				get panOnScrollSpeed() {
					return ue();
				},
				get panOnDrag() {
					return de();
				},
				get paneClickDistance() {
					return u();
				},
				get selectionOnDrag() {
					return fe();
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
					return M;
				},
				set store(e) {
					M = e;
				},
				children: (e, t) => {
					qm(e, {
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
							return de();
						},
						get paneClickDistance() {
							return u();
						},
						get selectionOnDrag() {
							return fe();
						},
						get autoPanOnSelection() {
							return pe();
						},
						get store() {
							return M;
						},
						set store(e) {
							M = e;
						},
						children: (e, t) => {
							var n = Hh(), r = H(n);
							Ym(r, {
								get store() {
									return M;
								},
								set store(e) {
									M = e;
								},
								children: (e, t) => {
									var n = Vh(), r = U(H(n), 2);
									_h(r, {
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
											return M;
										},
										set store(e) {
											M = e;
										}
									});
									var i = U(r, 4);
									jh(i, {
										get type() {
											return _e();
										},
										get LineComponent() {
											return me();
										},
										get containerStyle() {
											return ge();
										},
										get style() {
											return he();
										},
										get store() {
											return M;
										},
										set store(e) {
											M = e;
										}
									});
									var a = U(i, 2);
									sh(a, {
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
											return M;
										},
										set store(e) {
											M = e;
										}
									}), Ch(U(a, 2), {
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
											return M;
										},
										set store(e) {
											M = e;
										}
									}), Te(2), Y(e, n);
								},
								$$slots: { default: !0 }
							});
							var i = U(r, 2);
							{
								let e = /* @__PURE__ */ L(() => !!(M.selectionRect && M.selectionRectMode === "user")), t = /* @__PURE__ */ L(() => M.selectionRect?.width), n = /* @__PURE__ */ L(() => M.selectionRect?.height), r = /* @__PURE__ */ L(() => M.selectionRect?.x), a = /* @__PURE__ */ L(() => M.selectionRect?.y);
								bh(i, {
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
			var xe = U(be, 2);
			Ih(xe, {
				get proOptions() {
					return i();
				},
				get position() {
					return ve();
				}
			});
			var j = U(xe, 2);
			eh(j, { get store() {
				return M;
			} }), ui(U(j, 2), () => ye() ?? g), Y(e, n);
		},
		$$slots: { default: !0 }
	}), I({
		get width() {
			return n();
		},
		set width(e) {
			n(e), z();
		},
		get height() {
			return r();
		},
		set height(e) {
			r(e), z();
		},
		get proOptions() {
			return i();
		},
		set proOptions(e) {
			i(e), z();
		},
		get selectionKey() {
			return a();
		},
		set selectionKey(e) {
			a(e), z();
		},
		get deleteKey() {
			return o();
		},
		set deleteKey(e) {
			o(e), z();
		},
		get panActivationKey() {
			return s();
		},
		set panActivationKey(e) {
			s(e), z();
		},
		get multiSelectionKey() {
			return c();
		},
		set multiSelectionKey(e) {
			c(e), z();
		},
		get zoomActivationKey() {
			return l();
		},
		set zoomActivationKey(e) {
			l(e), z();
		},
		get paneClickDistance() {
			return u();
		},
		set paneClickDistance(e = 1) {
			u(e), z();
		},
		get nodeClickDistance() {
			return d();
		},
		set nodeClickDistance(e = 1) {
			d(e), z();
		},
		get onmovestart() {
			return f();
		},
		set onmovestart(e) {
			f(e), z();
		},
		get onmoveend() {
			return p();
		},
		set onmoveend(e) {
			p(e), z();
		},
		get onmove() {
			return m();
		},
		set onmove(e) {
			m(e), z();
		},
		get oninit() {
			return h();
		},
		set oninit(e) {
			h(e), z();
		},
		get onnodeclick() {
			return _();
		},
		set onnodeclick(e) {
			_(e), z();
		},
		get onnodecontextmenu() {
			return v();
		},
		set onnodecontextmenu(e) {
			v(e), z();
		},
		get onnodedrag() {
			return y();
		},
		set onnodedrag(e) {
			y(e), z();
		},
		get onnodedragstart() {
			return b();
		},
		set onnodedragstart(e) {
			b(e), z();
		},
		get onnodedragstop() {
			return x();
		},
		set onnodedragstop(e) {
			x(e), z();
		},
		get onnodepointerenter() {
			return S();
		},
		set onnodepointerenter(e) {
			S(e), z();
		},
		get onnodepointermove() {
			return C();
		},
		set onnodepointermove(e) {
			C(e), z();
		},
		get onnodepointerleave() {
			return w();
		},
		set onnodepointerleave(e) {
			w(e), z();
		},
		get onselectionclick() {
			return T();
		},
		set onselectionclick(e) {
			T(e), z();
		},
		get onselectioncontextmenu() {
			return E();
		},
		set onselectioncontextmenu(e) {
			E(e), z();
		},
		get onselectionstart() {
			return D();
		},
		set onselectionstart(e) {
			D(e), z();
		},
		get onselectionend() {
			return ee();
		},
		set onselectionend(e) {
			ee(e), z();
		},
		get onedgeclick() {
			return te();
		},
		set onedgeclick(e) {
			te(e), z();
		},
		get onedgecontextmenu() {
			return ne();
		},
		set onedgecontextmenu(e) {
			ne(e), z();
		},
		get onedgepointerenter() {
			return re();
		},
		set onedgepointerenter(e) {
			re(e), z();
		},
		get onedgepointerleave() {
			return ie();
		},
		set onedgepointerleave(e) {
			ie(e), z();
		},
		get onpaneclick() {
			return ae();
		},
		set onpaneclick(e) {
			ae(e), z();
		},
		get onpanecontextmenu() {
			return O();
		},
		set onpanecontextmenu(e) {
			O(e), z();
		},
		get panOnScrollMode() {
			return k();
		},
		set panOnScrollMode(e = fd.Free) {
			k(e), z();
		},
		get preventScrolling() {
			return oe();
		},
		set preventScrolling(e = !0) {
			oe(e), z();
		},
		get zoomOnScroll() {
			return se();
		},
		set zoomOnScroll(e = !0) {
			se(e), z();
		},
		get zoomOnDoubleClick() {
			return A();
		},
		set zoomOnDoubleClick(e = !0) {
			A(e), z();
		},
		get zoomOnPinch() {
			return ce();
		},
		set zoomOnPinch(e = !0) {
			ce(e), z();
		},
		get panOnScroll() {
			return le();
		},
		set panOnScroll(e = !1) {
			le(e), z();
		},
		get panOnScrollSpeed() {
			return ue();
		},
		set panOnScrollSpeed(e = .5) {
			ue(e), z();
		},
		get panOnDrag() {
			return de();
		},
		set panOnDrag(e = !0) {
			de(e), z();
		},
		get selectionOnDrag() {
			return fe();
		},
		set selectionOnDrag(e = !1) {
			fe(e), z();
		},
		get autoPanOnSelection() {
			return pe();
		},
		set autoPanOnSelection(e = !0) {
			pe(e), z();
		},
		get connectionLineComponent() {
			return me();
		},
		set connectionLineComponent(e) {
			me(e), z();
		},
		get connectionLineStyle() {
			return he();
		},
		set connectionLineStyle(e) {
			he(e), z();
		},
		get connectionLineContainerStyle() {
			return ge();
		},
		set connectionLineContainerStyle(e) {
			ge(e), z();
		},
		get connectionLineType() {
			return _e();
		},
		set connectionLineType(e = hd.Bezier) {
			_e(e), z();
		},
		get attributionPosition() {
			return ve();
		},
		set attributionPosition(e) {
			ve(e), z();
		},
		get children() {
			return ye();
		},
		set children(e) {
			ye(e), z();
		},
		get nodes() {
			return be();
		},
		set nodes(e = []) {
			be(e), z();
		},
		get edges() {
			return xe();
		},
		set edges(e = []) {
			xe(e), z();
		},
		get viewport() {
			return j();
		},
		set viewport(e = void 0) {
			j(e), z();
		}
	});
}
Q(Wh, {
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
var Gh = /* @__PURE__ */ new Set([
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
]), Kh = /* @__PURE__ */ J("<button><!></button>");
function qh(e, t) {
	F(t, !0);
	let n = Z(t, "class", 7), r = Z(t, "bgColor", 7), i = Z(t, "bgColorHover", 7), a = Z(t, "color", 7), o = Z(t, "colorHover", 7), s = Z(t, "borderColor", 7), c = Z(t, "onclick", 7), l = Z(t, "children", 7), u = /* @__PURE__ */ ga(t, Gh);
	var d = {
		get class() {
			return n();
		},
		set class(e) {
			n(e), z();
		},
		get bgColor() {
			return r();
		},
		set bgColor(e) {
			r(e), z();
		},
		get bgColorHover() {
			return i();
		},
		set bgColorHover(e) {
			i(e), z();
		},
		get color() {
			return a();
		},
		set color(e) {
			a(e), z();
		},
		get colorHover() {
			return o();
		},
		set colorHover(e) {
			o(e), z();
		},
		get borderColor() {
			return s();
		},
		set borderColor(e) {
			s(e), z();
		},
		get onclick() {
			return c();
		},
		set onclick(e) {
			c(e), z();
		},
		get children() {
			return l();
		},
		set children(e) {
			l(e), z();
		}
	}, f = Kh();
	return ra(f, () => ({
		type: "button",
		onclick: c(),
		class: ["svelte-flow__controls-button", n()],
		...u,
		[Ji]: {
			"--xy-controls-button-background-color-props": r(),
			"--xy-controls-button-background-color-hover-props": i(),
			"--xy-controls-button-color-props": a(),
			"--xy-controls-button-color-hover-props": o(),
			"--xy-controls-button-border-color-props": s()
		}
	})), ui(mn(f), () => l() ?? g), N(f), Y(e, f), I(d);
}
Q(qh, {
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
var Jh = /* @__PURE__ */ Vr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><path d=\"M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z\"></path></svg>");
function Yh(e) {
	Y(e, Jh());
}
Q(Yh, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Minus.svelte
var Xh = /* @__PURE__ */ Vr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 5\"><path d=\"M0 0h32v4.2H0z\"></path></svg>");
function Zh(e) {
	Y(e, Xh());
}
Q(Zh, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Fit.svelte
var Qh = /* @__PURE__ */ Vr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 30\"><path d=\"M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z\"></path></svg>");
function $h(e) {
	Y(e, Qh());
}
Q($h, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Lock.svelte
var eg = /* @__PURE__ */ Vr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z\"></path></svg>");
function tg(e) {
	Y(e, eg());
}
Q(tg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Unlock.svelte
var ng = /* @__PURE__ */ Vr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z\"></path></svg>");
function rg(e) {
	Y(e, ng());
}
Q(rg, {}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Controls.svelte
var ig = /* @__PURE__ */ new Set([
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
]), ag = /* @__PURE__ */ J("<!> <!>", 1), og = /* @__PURE__ */ J("<!> <!> <!> <!> <!> <!>", 1);
function sg(e, t) {
	F(t, !0);
	let n = Z(t, "position", 7, "bottom-left"), r = Z(t, "orientation", 7, "vertical"), i = Z(t, "showZoom", 7, !0), a = Z(t, "showFitView", 7, !0), o = Z(t, "showLock", 7, !0), s = Z(t, "style", 7), c = Z(t, "class", 7), l = Z(t, "buttonBgColor", 7), u = Z(t, "buttonBgColorHover", 7), d = Z(t, "buttonColor", 7), f = Z(t, "buttonColorHover", 7), p = Z(t, "buttonBorderColor", 7), m = Z(t, "fitViewOptions", 7), h = Z(t, "children", 7), g = Z(t, "before", 7), _ = Z(t, "after", 7), v = /* @__PURE__ */ ga(t, ig), y = /* @__PURE__ */ L(Lm), b = /* @__PURE__ */ L(() => ({
		bgColor: l(),
		bgColorHover: u(),
		color: d(),
		colorHover: f(),
		borderColor: p()
	})), x = /* @__PURE__ */ L(() => q(y).nodesDraggable || q(y).nodesConnectable || q(y).elementsSelectable), S = /* @__PURE__ */ L(() => q(y).viewport.zoom <= q(y).minZoom), C = /* @__PURE__ */ L(() => q(y).viewport.zoom >= q(y).maxZoom), w = /* @__PURE__ */ L(() => q(y).ariaLabelConfig), T = /* @__PURE__ */ L(() => r() === "horizontal" ? "horizontal" : "vertical"), E = () => {
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
			n(e), z();
		},
		get orientation() {
			return r();
		},
		set orientation(e = "vertical") {
			r(e), z();
		},
		get showZoom() {
			return i();
		},
		set showZoom(e = !0) {
			i(e), z();
		},
		get showFitView() {
			return a();
		},
		set showFitView(e = !0) {
			a(e), z();
		},
		get showLock() {
			return o();
		},
		set showLock(e = !0) {
			o(e), z();
		},
		get style() {
			return s();
		},
		set style(e) {
			s(e), z();
		},
		get class() {
			return c();
		},
		set class(e) {
			c(e), z();
		},
		get buttonBgColor() {
			return l();
		},
		set buttonBgColor(e) {
			l(e), z();
		},
		get buttonBgColorHover() {
			return u();
		},
		set buttonBgColorHover(e) {
			u(e), z();
		},
		get buttonColor() {
			return d();
		},
		set buttonColor(e) {
			d(e), z();
		},
		get buttonColorHover() {
			return f();
		},
		set buttonColorHover(e) {
			f(e), z();
		},
		get buttonBorderColor() {
			return p();
		},
		set buttonBorderColor(e) {
			p(e), z();
		},
		get fitViewOptions() {
			return m();
		},
		set fitViewOptions(e) {
			m(e), z();
		},
		get children() {
			return h();
		},
		set children(e) {
			h(e), z();
		},
		get before() {
			return g();
		},
		set before(e) {
			g(e), z();
		},
		get after() {
			return _();
		},
		set after(e) {
			_(e), z();
		}
	};
	{
		let t = /* @__PURE__ */ L(() => [
			"svelte-flow__controls",
			q(T),
			c()
		]);
		Ph(e, va({
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
				var n = og(), r = H(n), s = (e) => {
					var t = Ur();
					ui(H(t), g), Y(e, t);
				};
				mi(r, (e) => {
					g() && e(s);
				});
				var c = U(r, 2), l = (e) => {
					var t = ag(), n = H(t);
					qh(n, va({
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
							Yh(e, {});
						},
						$$slots: { default: !0 }
					})), qh(U(n, 2), va({
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
							Zh(e, {});
						},
						$$slots: { default: !0 }
					})), Y(e, t);
				};
				mi(c, (e) => {
					i() && e(l);
				});
				var u = U(c, 2), d = (e) => {
					qh(e, va({
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
							$h(e, {});
						},
						$$slots: { default: !0 }
					}));
				};
				mi(u, (e) => {
					a() && e(d);
				});
				var f = U(u, 2), p = (e) => {
					qh(e, va({
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
							var n = Ur(), r = H(n), i = (e) => {
								rg(e, {});
							}, a = (e) => {
								tg(e, {});
							};
							mi(r, (e) => {
								q(x) ? e(i) : e(a, -1);
							}), Y(e, n);
						},
						$$slots: { default: !0 }
					}));
				};
				mi(f, (e) => {
					o() && e(p);
				});
				var m = U(f, 2), v = (e) => {
					var t = Ur();
					ui(H(t), h), Y(e, t);
				};
				mi(m, (e) => {
					h() && e(v);
				});
				var y = U(m, 2), T = (e) => {
					var t = Ur();
					ui(H(t), _), Y(e, t);
				};
				mi(y, (e) => {
					_() && e(T);
				}), Y(e, n);
			},
			$$slots: { default: !0 }
		}));
	}
	return I(ne);
}
Q(sg, {
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
var cg;
(function(e) {
	e.Lines = "lines", e.Dots = "dots", e.Cross = "cross";
})(cg ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/DotPattern.svelte
var lg = /* @__PURE__ */ Vr("<circle></circle>");
function ug(e, t) {
	F(t, !0);
	let n = Z(t, "radius", 7), r = Z(t, "class", 7);
	var i = {
		get radius() {
			return n();
		},
		set radius(e) {
			n(e), z();
		},
		get class() {
			return r();
		},
		set class(e) {
			r(e), z();
		}
	}, a = lg();
	return W(() => {
		X(a, "cx", n()), X(a, "cy", n()), X(a, "r", n()), Li(a, 0, ji([
			"svelte-flow__background-pattern",
			"dots",
			r()
		]));
	}), Y(e, a), I(i);
}
Q(ug, {
	radius: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/LinePattern.svelte
var dg = /* @__PURE__ */ Vr("<path></path>");
function fg(e, t) {
	F(t, !0);
	let n = Z(t, "lineWidth", 7), r = Z(t, "dimensions", 7), i = Z(t, "variant", 7), a = Z(t, "class", 7);
	var o = {
		get lineWidth() {
			return n();
		},
		set lineWidth(e) {
			n(e), z();
		},
		get dimensions() {
			return r();
		},
		set dimensions(e) {
			r(e), z();
		},
		get variant() {
			return i();
		},
		set variant(e) {
			i(e), z();
		},
		get class() {
			return a();
		},
		set class(e) {
			a(e), z();
		}
	}, s = dg();
	return W(() => {
		X(s, "stroke-width", n()), X(s, "d", `M${r()[0] / 2} 0 V${r()[1]} M0 ${r()[1] / 2} H${r()[0]}`), Li(s, 0, ji([
			"svelte-flow__background-pattern",
			i(),
			a()
		]));
	}), Y(e, s), I(o);
}
Q(fg, {
	lineWidth: {},
	dimensions: {},
	variant: {},
	class: {}
}, [], [], { mode: "open" });
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/Background.svelte
var pg = {
	[cg.Dots]: 1,
	[cg.Lines]: 1,
	[cg.Cross]: 6
}, mg = /* @__PURE__ */ Vr("<svg data-testid=\"svelte-flow__background\"><pattern patternUnits=\"userSpaceOnUse\"><!></pattern><rect x=\"0\" y=\"0\" width=\"100%\" height=\"100%\"></rect></svg>");
function hg(e, t) {
	F(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "variant", 23, () => cg.Dots), i = Z(t, "gap", 7, 20), a = Z(t, "size", 7), o = Z(t, "lineWidth", 7, 1), s = Z(t, "bgColor", 7), c = Z(t, "patternColor", 7), l = Z(t, "patternClass", 7), u = Z(t, "class", 7), d = /* @__PURE__ */ L(Lm), f = /* @__PURE__ */ L(() => r() === cg.Dots), p = /* @__PURE__ */ L(() => r() === cg.Cross), m = /* @__PURE__ */ L(() => Array.isArray(i()) ? i() : [i(), i()]), h = /* @__PURE__ */ L(() => `background-pattern-${q(d).flowId}-${n() ?? ""}`), g = /* @__PURE__ */ L(() => [q(m)[0] * q(d).viewport.zoom || 1, q(m)[1] * q(d).viewport.zoom || 1]), _ = /* @__PURE__ */ L(() => (a() ?? pg[r()]) * q(d).viewport.zoom), v = /* @__PURE__ */ L(() => q(p) ? [q(_), q(_)] : q(g)), y = /* @__PURE__ */ L(() => q(f) ? [q(_) / 2, q(_) / 2] : [q(v)[0] / 2, q(v)[1] / 2]);
	var b = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), z();
		},
		get variant() {
			return r();
		},
		set variant(e = cg.Dots) {
			r(e), z();
		},
		get gap() {
			return i();
		},
		set gap(e = 20) {
			i(e), z();
		},
		get size() {
			return a();
		},
		set size(e) {
			a(e), z();
		},
		get lineWidth() {
			return o();
		},
		set lineWidth(e = 1) {
			o(e), z();
		},
		get bgColor() {
			return s();
		},
		set bgColor(e) {
			s(e), z();
		},
		get patternColor() {
			return c();
		},
		set patternColor(e) {
			c(e), z();
		},
		get patternClass() {
			return l();
		},
		set patternClass(e) {
			l(e), z();
		},
		get class() {
			return u();
		},
		set class(e) {
			u(e), z();
		}
	}, x = mg();
	let S;
	var C = mn(x), w = mn(C), T = (e) => {
		{
			let t = /* @__PURE__ */ L(() => q(_) / 2);
			ug(e, {
				get radius() {
					return q(t);
				},
				get class() {
					return l();
				}
			});
		}
	}, E = (e) => {
		fg(e, {
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
	mi(w, (e) => {
		q(f) ? e(T) : e(E, -1);
	}), N(C);
	var D = U(C);
	return N(x), W(() => {
		Li(x, 0, ji([
			"svelte-flow__background",
			"svelte-flow__container",
			u()
		])), S = zi(x, "", S, {
			"--xy-background-color-props": s(),
			"--xy-background-pattern-color-props": c()
		}), X(C, "id", q(h)), X(C, "x", q(d).viewport.x % q(g)[0]), X(C, "y", q(d).viewport.y % q(g)[1]), X(C, "width", q(g)[0]), X(C, "height", q(g)[1]), X(C, "patternTransform", `translate(-${q(y)[0]},-${q(y)[1]})`), X(D, "fill", `url(#${q(h)})`);
	}), Y(e, x), I(b);
}
Q(hg, {
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
function gg(e) {
	let t = /* @__PURE__ */ L(Lm), n = /* @__PURE__ */ L(() => q(t).nodeLookup), r = /* @__PURE__ */ L(() => q(t).nodes), i = /* @__PURE__ */ L(() => (q(r), q(n).get(e)));
	return { get current() {
		return q(i);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/MinimapNode.svelte
var _g = /* @__PURE__ */ Vr("<rect></rect>");
function vg(e, t) {
	F(t, !0);
	let n = Z(t, "id", 7), r = Z(t, "x", 7), i = Z(t, "y", 7), a = Z(t, "width", 7), o = Z(t, "height", 7), s = Z(t, "borderRadius", 7, 5), c = Z(t, "color", 7), l = Z(t, "shapeRendering", 7), u = Z(t, "strokeColor", 7), d = Z(t, "strokeWidth", 7, 2), f = Z(t, "selected", 7), p = Z(t, "class", 7), m = Z(t, "nodeComponent", 7), h = /* @__PURE__ */ L(() => gg(n())), g = /* @__PURE__ */ L(() => {
		if (!q(h).current) return {
			width: 0,
			height: 0,
			x: 0,
			y: 0
		};
		let { width: e, height: t } = tf(q(h).current);
		return {
			width: a() ?? e,
			height: o() ?? t,
			x: r() ?? q(h).current.internals.positionAbsolute.x,
			y: i() ?? q(h).current.internals.positionAbsolute.y
		};
	}), _ = /* @__PURE__ */ L(() => q(g).width), v = /* @__PURE__ */ L(() => q(g).height), y = /* @__PURE__ */ L(() => q(g).x), b = /* @__PURE__ */ L(() => q(g).y);
	var x = {
		get id() {
			return n();
		},
		set id(e) {
			n(e), z();
		},
		get x() {
			return r();
		},
		set x(e) {
			r(e), z();
		},
		get y() {
			return i();
		},
		set y(e) {
			i(e), z();
		},
		get width() {
			return a();
		},
		set width(e) {
			a(e), z();
		},
		get height() {
			return o();
		},
		set height(e) {
			o(e), z();
		},
		get borderRadius() {
			return s();
		},
		set borderRadius(e = 5) {
			s(e), z();
		},
		get color() {
			return c();
		},
		set color(e) {
			c(e), z();
		},
		get shapeRendering() {
			return l();
		},
		set shapeRendering(e) {
			l(e), z();
		},
		get strokeColor() {
			return u();
		},
		set strokeColor(e) {
			u(e), z();
		},
		get strokeWidth() {
			return d();
		},
		set strokeWidth(e = 2) {
			d(e), z();
		},
		get selected() {
			return f();
		},
		set selected(e) {
			f(e), z();
		},
		get class() {
			return p();
		},
		set class(e) {
			p(e), z();
		},
		get nodeComponent() {
			return m();
		},
		set nodeComponent(e) {
			m(e), z();
		}
	}, S = Ur(), C = H(S), w = (e) => {
		let t = /* @__PURE__ */ L(m);
		var r = Ur();
		Ti(H(r), () => q(t), (e, t) => {
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
		var t = _g();
		let n, r;
		W(() => {
			n = Li(t, 0, ji(["svelte-flow__minimap-node", p()]), null, n, { selected: f() }), X(t, "x", q(y)), X(t, "y", q(b)), X(t, "rx", s()), X(t, "ry", s()), X(t, "width", q(_)), X(t, "height", q(v)), X(t, "shape-rendering", l()), r = zi(t, "", r, {
				fill: c(),
				stroke: u(),
				"stroke-width": d()
			});
		}), Y(e, t);
	};
	return mi(C, (e) => {
		m() ? e(w) : e(T, -1);
	}), Y(e, S), I(x);
}
Q(vg, {
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
function yg(e, t) {
	let n = wp({
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
var bg = (e) => e instanceof Function ? e : () => e, xg = /* @__PURE__ */ new Set([
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
]), Sg = /* @__PURE__ */ Vr("<title> </title>"), Cg = /* @__PURE__ */ Vr("<svg class=\"svelte-flow__minimap-svg\" role=\"img\"><!><!><path class=\"svelte-flow__minimap-mask\" fill-rule=\"evenodd\" pointer-events=\"none\"></path></svg>"), wg = /* @__PURE__ */ J("<svelte-css-wrapper style=\"display: contents\"><!></svelte-css-wrapper>", 1);
function Tg(e, t) {
	F(t, !0);
	let n = Z(t, "position", 7, "bottom-right"), r = Z(t, "ariaLabel", 7), i = Z(t, "nodeStrokeColor", 7, "transparent"), a = Z(t, "nodeColor", 7), o = Z(t, "nodeClass", 7, ""), s = Z(t, "nodeBorderRadius", 7, 5), c = Z(t, "nodeStrokeWidth", 7, 2), l = Z(t, "nodeComponent", 7), u = Z(t, "bgColor", 7), d = Z(t, "maskColor", 7), f = Z(t, "maskStrokeColor", 7), p = Z(t, "maskStrokeWidth", 7), m = Z(t, "width", 7, 200), h = Z(t, "height", 7, 150), g = Z(t, "pannable", 7, !0), _ = Z(t, "zoomable", 7, !0), v = Z(t, "inversePan", 7), y = Z(t, "zoomStep", 7), b = Z(t, "class", 7), x = /* @__PURE__ */ ga(t, xg), S = /* @__PURE__ */ L(Lm), C = /* @__PURE__ */ L(() => q(S).ariaLabelConfig), w = typeof window > "u" || window.chrome ? "crispEdges" : "geometricPrecision", T = /* @__PURE__ */ L(() => `svelte-flow__minimap-desc-${q(S).flowId}`), E = /* @__PURE__ */ L(() => ({
		x: -q(S).viewport.x / q(S).viewport.zoom,
		y: -q(S).viewport.y / q(S).viewport.zoom,
		width: q(S).width / q(S).viewport.zoom,
		height: q(S).height / q(S).viewport.zoom
	})), D = /* @__PURE__ */ L(() => q(S).nodes.some((e) => !e.hidden)), ee = /* @__PURE__ */ L(() => q(D) ? Bd(Cd(q(S).nodeLookup, { filter: (e) => !e.hidden }), q(E)) : q(E)), te = /* @__PURE__ */ L(() => q(ee).width / m()), ne = /* @__PURE__ */ L(() => q(ee).height / h()), re = /* @__PURE__ */ L(() => Math.max(q(te), q(ne))), ie = /* @__PURE__ */ L(() => q(re) * m()), ae = /* @__PURE__ */ L(() => q(re) * h()), O = /* @__PURE__ */ L(() => 5 * q(re)), k = /* @__PURE__ */ L(() => q(ee).x - (q(ie) - q(ee).width) / 2 - q(O)), oe = /* @__PURE__ */ L(() => q(ee).y - (q(ae) - q(ee).height) / 2 - q(O)), se = /* @__PURE__ */ L(() => q(ie) + q(O) * 2), A = /* @__PURE__ */ L(() => q(ae) + q(O) * 2), ce = () => q(re);
	var le = {
		get position() {
			return n();
		},
		set position(e = "bottom-right") {
			n(e), z();
		},
		get ariaLabel() {
			return r();
		},
		set ariaLabel(e) {
			r(e), z();
		},
		get nodeStrokeColor() {
			return i();
		},
		set nodeStrokeColor(e = "transparent") {
			i(e), z();
		},
		get nodeColor() {
			return a();
		},
		set nodeColor(e) {
			a(e), z();
		},
		get nodeClass() {
			return o();
		},
		set nodeClass(e = "") {
			o(e), z();
		},
		get nodeBorderRadius() {
			return s();
		},
		set nodeBorderRadius(e = 5) {
			s(e), z();
		},
		get nodeStrokeWidth() {
			return c();
		},
		set nodeStrokeWidth(e = 2) {
			c(e), z();
		},
		get nodeComponent() {
			return l();
		},
		set nodeComponent(e) {
			l(e), z();
		},
		get bgColor() {
			return u();
		},
		set bgColor(e) {
			u(e), z();
		},
		get maskColor() {
			return d();
		},
		set maskColor(e) {
			d(e), z();
		},
		get maskStrokeColor() {
			return f();
		},
		set maskStrokeColor(e) {
			f(e), z();
		},
		get maskStrokeWidth() {
			return p();
		},
		set maskStrokeWidth(e) {
			p(e), z();
		},
		get width() {
			return m();
		},
		set width(e = 200) {
			m(e), z();
		},
		get height() {
			return h();
		},
		set height(e = 150) {
			h(e), z();
		},
		get pannable() {
			return g();
		},
		set pannable(e = !0) {
			g(e), z();
		},
		get zoomable() {
			return _();
		},
		set zoomable(e = !0) {
			_(e), z();
		},
		get inversePan() {
			return v();
		},
		set inversePan(e) {
			v(e), z();
		},
		get zoomStep() {
			return y();
		},
		set zoomStep(e) {
			y(e), z();
		},
		get class() {
			return b();
		},
		set class(e) {
			b(e), z();
		}
	}, ue = wg(), de = H(ue);
	{
		let e = /* @__PURE__ */ L(() => ["svelte-flow__minimap", b()]);
		hi(de, () => ({ "--xy-minimap-background-color-props": u() })), Ph(de.lastChild, va({
			get position() {
				return n();
			},
			get class() {
				return q(e);
			},
			"data-testid": "svelte-flow__minimap"
		}, () => x, {
			children: (e, t) => {
				var n = Ur(), u = H(n), b = (e) => {
					var t = Cg();
					let n;
					var u = mn(t), b = (e) => {
						var t = Sg(), n = hn(t, !0);
						W(() => {
							X(t, "id", q(T)), ni(n, r() ?? q(C)["minimap.ariaLabel"]);
						}), Y(e, t);
					};
					mi(u, (e) => {
						(r() ?? q(C)["minimap.ariaLabel"]) && e(b);
					});
					var x = U(u);
					yi(x, 17, () => q(S).nodes, (e) => e.id, (e, t) => {
						let n = /* @__PURE__ */ L(() => q(S).nodeLookup.get(q(t).id));
						var r = Ur(), u = H(r), d = (e) => {
							{
								let r = /* @__PURE__ */ L(() => a() === void 0 ? void 0 : bg(a())(q(t))), u = /* @__PURE__ */ L(() => bg(i())(q(t))), d = /* @__PURE__ */ L(() => bg(o())(q(t)));
								vg(e, {
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
						}, f = /* @__PURE__ */ L(() => q(n) && nf(q(n)) && !q(n).hidden);
						mi(u, (e) => {
							q(f) && e(d);
						}), Y(e, r);
					});
					var D = U(x);
					N(t), Di(t, (e, t) => yg?.(e, t), () => ({
						store: q(S),
						panZoom: q(S).panZoom,
						getViewScale: ce,
						translateExtent: q(S).translateExtent,
						width: q(S).width,
						height: q(S).height,
						inversePan: v(),
						zoomStep: y(),
						pannable: g(),
						zoomable: _()
					})), W(() => {
						X(t, "width", m()), X(t, "height", h()), X(t, "viewBox", `${q(k) ?? ""} ${q(oe) ?? ""} ${q(se) ?? ""} ${q(A) ?? ""}`), X(t, "aria-labelledby", q(T)), n = zi(t, "", n, {
							"--xy-minimap-mask-background-color-props": d(),
							"--xy-minimap-mask-stroke-color-props": f(),
							"--xy-minimap-mask-stroke-width-props": p() ? p() * q(re) : void 0
						}), X(D, "d", `M${q(k) - q(O)},${q(oe) - q(O)}h${q(se) + q(O) * 2}v${q(A) + q(O) * 2}h${-q(se) - q(O) * 2}z
      M${q(E).x ?? ""},${q(E).y ?? ""}h${q(E).width ?? ""}v${q(E).height ?? ""}h${-q(E).width}z`);
					}), Y(e, t);
				};
				mi(u, (e) => {
					q(S).panZoom && e(b);
				}), Y(e, n);
			},
			$$slots: { default: !0 }
		})), N(de);
	}
	return Y(e, ue), I(le);
}
Q(Tg, {
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
var Eg = 4, Dg = 220, Og = 120;
function kg(e) {
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
function Ag(e) {
	return {
		x: e % Eg * Dg,
		y: Math.floor(e / Eg) * Og
	};
}
function jg(e) {
	return e.map((e, t) => ({
		id: e.id,
		type: "default",
		position: kg(e.attrs) ?? Ag(t),
		data: {
			label: e.label ?? e.id,
			nodeType: e.node_type,
			attrs: e.attrs
		}
	}));
}
function Mg(e) {
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
function Ng(e, t, n, r) {
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
var Pg = /* @__PURE__ */ J("<!> <!> <!>", 1), Fg = /* @__PURE__ */ J("<p role=\"alert\" data-testid=\"save-error\"> </p>"), Ig = /* @__PURE__ */ J("<div class=\"workflow-canvas-root\" style=\"width: 100%; height: 100%; min-height: 480px; display: flex; flex-direction: column;\"><div class=\"canvas-area\" style=\"flex: 1; position: relative;\"><!></div> <button type=\"button\" data-testid=\"save-button\"> </button> <!></div>");
function Lg(e, t) {
	F(t, !0);
	let n = Z(t, "graph", 7, void 0), r = Z(t, "onSave", 7), i = /* @__PURE__ */ B([]), a = /* @__PURE__ */ B([]), o = /* @__PURE__ */ B(null), s = /* @__PURE__ */ B(nn({}));
	Dn(() => {
		n() && (V(i, jg(n().nodes)), V(a, Mg(n().edges)), V(o, n().name, !0), V(s, n().graph_attrs, !0));
	});
	function c() {
		return Ng(q(o), q(s), q(i), q(a));
	}
	let l = /* @__PURE__ */ B(!1), u = /* @__PURE__ */ B(null);
	async function d() {
		V(l, !0), V(u, null);
		try {
			await r()(c());
		} catch (e) {
			V(u, e instanceof Error ? e.message : String(e), !0);
		} finally {
			V(l, !1);
		}
	}
	var f = {
		currentGraph: c,
		get graph() {
			return n();
		},
		set graph(e = void 0) {
			n(e), z();
		},
		get onSave() {
			return r();
		},
		set onSave(e) {
			r(e), z();
		}
	}, p = Ig(), m = mn(p);
	Wh(mn(m), {
		fitView: !0,
		get nodes() {
			return q(i);
		},
		set nodes(e) {
			V(i, e);
		},
		get edges() {
			return q(a);
		},
		set edges(e) {
			V(a, e);
		},
		children: (e, t) => {
			var n = Pg(), r = H(n);
			hg(r, {});
			var i = U(r, 2);
			sg(i, {}), Tg(U(i, 2), {}), Y(e, n);
		},
		$$slots: { default: !0 }
	}), N(m);
	var h = U(m, 2), g = hn(h, !0), _ = U(h, 2), v = (e) => {
		var t = Fg(), n = hn(t, !0);
		W(() => ni(n, q(u))), Y(e, t);
	};
	return mi(_, (e) => {
		q(u) && e(v);
	}), N(p), W(() => {
		h.disabled = q(l), ni(g, q(l) ? "Saving…" : "Save");
	}), jr("click", h, d), Y(e, p), I(f);
}
Mr(["click"]), Q(Lg, {
	graph: {},
	onSave: {}
}, [], ["currentGraph"], { mode: "open" });
//#endregion
//#region src/api.ts
async function Rg(e) {
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
function zg(e, t) {
	return fetch(`/api/workflows/${encodeURIComponent(e)}/graph`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t)
	}).then((e) => Rg(e));
}
//#endregion
//#region src/WorkflowCanvas.svelte
function Bg(e, t) {
	F(t, !0);
	let n = Z(t, "graph", 15, void 0), r = Z(t, "workflowId", 7, void 0), i = /* @__PURE__ */ B(void 0);
	async function a(e) {
		if (!r()) throw Error("no workflowId set; cannot save");
		let n = await zg(r(), e);
		t.$$host.dispatchEvent(new CustomEvent("workflow-saved", {
			detail: n,
			bubbles: !0,
			composed: !0
		}));
	}
	return Dn(() => {
		Object.assign(t.$$host, { getGraph: () => q(i)?.currentGraph() });
	}), ua(Lg(e, {
		get graph() {
			return n();
		},
		onSave: a
	}), (e) => V(i, e, !0), () => q(i)), I({
		get graph() {
			return n();
		},
		set graph(e = void 0) {
			n(e), z();
		},
		get workflowId() {
			return r();
		},
		set workflowId(e = void 0) {
			r(e), z();
		}
	});
}
customElements.define("workflow-canvas", Q(Bg, {
	graph: {},
	workflowId: {}
}, [], []));
//#endregion
export { Bg as default };
