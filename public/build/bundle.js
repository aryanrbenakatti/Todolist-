
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (234:5) {#if todo.status === 'pending'}
    function create_if_block_3(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*todo*/ ctx[15].task + "";
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let button_class_value;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[10](/*i*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			t2 = text("✔");
    			t3 = space();
    			attr_dev(div0, "class", "svelte-zv5e1x");
    			add_location(div0, file, 235, 7, 4285);
    			attr_dev(button, "class", button_class_value = "tick " + (/*todo*/ ctx[15].status === 'completed' ? 'active' : '') + " svelte-zv5e1x");
    			add_location(button, file, 236, 7, 4315);
    			attr_dev(div1, "class", "task svelte-zv5e1x");
    			add_location(div1, file, 234, 6, 4259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(button, t2);
    			append_dev(div1, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[15].task + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && button_class_value !== (button_class_value = "tick " + (/*todo*/ ctx[15].status === 'completed' ? 'active' : '') + " svelte-zv5e1x")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(234:5) {#if todo.status === 'pending'}",
    		ctx
    	});

    	return block;
    }

    // (224:37) 
    function create_if_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*todo*/ ctx[15].status === 'completed' && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*todo*/ ctx[15].status === 'completed') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(224:37) ",
    		ctx
    	});

    	return block;
    }

    // (214:4) {#if filter === 'all'}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*todo*/ ctx[15].task + "";
    	let t0;
    	let t1;
    	let button0;
    	let t2;
    	let button0_class_value;
    	let t3;
    	let button1;
    	let t5;
    	let div1_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*i*/ ctx[17]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*i*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button0 = element("button");
    			t2 = text("✔");
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "✖";
    			t5 = space();
    			attr_dev(div0, "class", "svelte-zv5e1x");
    			add_location(div0, file, 215, 6, 3677);
    			attr_dev(button0, "class", button0_class_value = "tick " + (/*todo*/ ctx[15].status === 'completed' ? 'active' : '') + " svelte-zv5e1x");
    			add_location(button0, file, 216, 6, 3706);
    			attr_dev(button1, "class", "cross svelte-zv5e1x");
    			add_location(button1, file, 219, 6, 3845);
    			attr_dev(div1, "class", div1_class_value = "task " + /*todo*/ ctx[15].status + " svelte-zv5e1x");
    			add_location(div1, file, 214, 5, 3638);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, button0);
    			append_dev(button0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(div1, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[15].task + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && button0_class_value !== (button0_class_value = "tick " + (/*todo*/ ctx[15].status === 'completed' ? 'active' : '') + " svelte-zv5e1x")) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (dirty & /*todos*/ 1 && div1_class_value !== (div1_class_value = "task " + /*todo*/ ctx[15].status + " svelte-zv5e1x")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(214:4) {#if filter === 'all'}",
    		ctx
    	});

    	return block;
    }

    // (225:5) {#if todo.status === 'completed'}
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*todo*/ ctx[15].task + "";
    	let t0;
    	let t1;
    	let button;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[9](/*i*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			button.textContent = "✖";
    			t3 = space();
    			attr_dev(div0, "class", "svelte-zv5e1x");
    			add_location(div0, file, 226, 7, 4062);
    			attr_dev(button, "class", "cross svelte-zv5e1x");
    			add_location(button, file, 227, 7, 4092);
    			attr_dev(div1, "class", "task completed svelte-zv5e1x");
    			add_location(div1, file, 225, 6, 4026);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(div1, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[15].task + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(225:5) {#if todo.status === 'completed'}",
    		ctx
    	});

    	return block;
    }

    // (213:3) {#each todos as todo, i}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*filter*/ ctx[2] === 'all') return create_if_block;
    		if (/*filter*/ ctx[2] === 'completed') return create_if_block_1;
    		if (/*todo*/ ctx[15].status === 'pending') return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(213:3) {#each todos as todo, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let input;
    	let t0;
    	let button0;
    	let t2;
    	let div1;
    	let t3;
    	let div2;
    	let button1;
    	let t4;
    	let button1_class_value;
    	let t5;
    	let button2;
    	let t6;
    	let button2_class_value;
    	let t7;
    	let button3;
    	let t8;
    	let button3_class_value;
    	let mounted;
    	let dispose;
    	let each_value = /*todos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			button1 = element("button");
    			t4 = text("All");
    			t5 = space();
    			button2 = element("button");
    			t6 = text("Completed");
    			t7 = space();
    			button3 = element("button");
    			t8 = text("Incomplete");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter your task");
    			attr_dev(input, "class", "svelte-zv5e1x");
    			add_location(input, file, 207, 3, 3433);
    			attr_dev(button0, "class", "svelte-zv5e1x");
    			add_location(button0, file, 208, 3, 3506);
    			attr_dev(div0, "class", "form svelte-zv5e1x");
    			add_location(div0, file, 205, 2, 3407);
    			attr_dev(div1, "class", "tasks svelte-zv5e1x");
    			add_location(div1, file, 211, 2, 3558);
    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*filter*/ ctx[2] === 'all' ? 'active' : '') + " svelte-zv5e1x"));
    			add_location(button1, file, 246, 3, 4532);
    			attr_dev(button2, "class", button2_class_value = "" + (null_to_empty(/*filter*/ ctx[2] === 'completed' ? 'active' : '') + " svelte-zv5e1x"));
    			add_location(button2, file, 249, 3, 4640);
    			attr_dev(button3, "class", button3_class_value = "" + (null_to_empty(/*filter*/ ctx[2] === 'incomplete' ? 'active' : '') + " svelte-zv5e1x"));
    			add_location(button3, file, 252, 3, 4766);
    			attr_dev(div2, "class", "filters svelte-zv5e1x");
    			add_location(div2, file, 245, 2, 4507);
    			attr_dev(div3, "class", "todo svelte-zv5e1x");
    			add_location(div3, file, 204, 1, 3386);
    			attr_dev(div4, "class", "container svelte-zv5e1x");
    			add_location(div4, file, 203, 0, 3361);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*task*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, button0);
    			append_dev(div3, t2);
    			append_dev(div3, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(button1, t4);
    			append_dev(div2, t5);
    			append_dev(div2, button2);
    			append_dev(button2, t6);
    			append_dev(div2, t7);
    			append_dev(div2, button3);
    			append_dev(button3, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(button0, "click", /*addTask*/ ctx[3], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[11], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_5*/ ctx[12], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_6*/ ctx[13], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*task*/ 2 && input.value !== /*task*/ ctx[1]) {
    				set_input_value(input, /*task*/ ctx[1]);
    			}

    			if (dirty & /*todos, removeTask, markComplete, filter*/ 53) {
    				each_value = /*todos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*filter*/ 4 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*filter*/ ctx[2] === 'all' ? 'active' : '') + " svelte-zv5e1x"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (dirty & /*filter*/ 4 && button2_class_value !== (button2_class_value = "" + (null_to_empty(/*filter*/ ctx[2] === 'completed' ? 'active' : '') + " svelte-zv5e1x"))) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			if (dirty & /*filter*/ 4 && button3_class_value !== (button3_class_value = "" + (null_to_empty(/*filter*/ ctx[2] === 'incomplete' ? 'active' : '') + " svelte-zv5e1x"))) {
    				attr_dev(button3, "class", button3_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let todos = [];
    	let task = "";
    	let filter = 'All';
    	let src = './images/background.jpg';

    	function addTask() {
    		$$invalidate(0, todos = [{ task, status: "pending" }, ...todos]);
    		$$invalidate(1, task = "");
    	}

    	function markComplete(i) {
    		$$invalidate(0, todos[i].status = "completed", todos);
    		$$invalidate(0, todos = [...todos]);
    	}

    	function removeTask(i) {
    		todos.splice(i, 1);
    		$$invalidate(0, todos = [...todos]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		task = this.value;
    		$$invalidate(1, task);
    	}

    	const click_handler = i => markComplete(i);
    	const click_handler_1 = i => removeTask(i);
    	const click_handler_2 = i => removeTask(i);
    	const click_handler_3 = i => markComplete(i);
    	const click_handler_4 = () => $$invalidate(2, filter = 'all');
    	const click_handler_5 = () => $$invalidate(2, filter = 'completed');
    	const click_handler_6 = () => $$invalidate(2, filter = 'incomplete');

    	$$self.$capture_state = () => ({
    		todos,
    		task,
    		filter,
    		src,
    		addTask,
    		markComplete,
    		removeTask
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('task' in $$props) $$invalidate(1, task = $$props.task);
    		if ('filter' in $$props) $$invalidate(2, filter = $$props.filter);
    		if ('src' in $$props) src = $$props.src;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todos,
    		task,
    		filter,
    		addTask,
    		markComplete,
    		removeTask,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
