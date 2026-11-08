// Minimal stand-in for the design canvas runtime, enough to render the
// round-6 boards in docs/design/boards locally: {{holes}}, <sc-for>, <sc-if>,
// on* handlers bound to functions, and a Component class with renderVals(),
// setState() and componentDidMount(). Served by server.mjs at /runtime.js.

(async function () {
    const name = decodeURIComponent(location.pathname.split("/").pop());
    const res = await fetch("/boards/" + encodeURIComponent(name));
    if (!res.ok) {
        document.body.textContent = "No board called " + name;
        return;
    }
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    document.title = doc.title + " · local preview";

    for (const link of doc.head.querySelectorAll('link[rel="stylesheet"]')) {
        document.head.appendChild(document.importNode(link, true));
    }
    const xdc = doc.querySelector("x-dc");
    const helmet = xdc.querySelector("helmet");
    if (helmet) {
        for (const el of [...helmet.children]) document.head.appendChild(document.importNode(el, true));
        helmet.remove();
    }

    const script = doc.querySelector("script[data-dc-script]");
    const decl = JSON.parse(script.getAttribute("data-props") || "{}");
    const props = {};
    for (const [key, spec] of Object.entries(decl)) {
        if (key[0] !== "$" && spec && "default" in spec) props[key] = spec.default;
    }
    for (const [key, value] of new URLSearchParams(location.search)) props[key] = value;

    const template = document.createElement("template");
    template.innerHTML = xdc.innerHTML;

    let scheduled = false;
    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            render();
        });
    };

    class DCLogic {
        constructor(p) {
            this.props = p;
            this.state = undefined;
        }
        setState(patch) {
            const next = typeof patch === "function" ? patch(this.state || {}, this.props) : patch;
            this.state = Object.assign({}, this.state || {}, next);
            schedule();
        }
        forceUpdate() {
            schedule();
        }
    }
    const Component = new Function("DCLogic", script.textContent + "\nreturn Component;")(DCLogic);
    const component = new Component(props);

    const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
    const lookup = (path, scope) => {
        if (path === "true") return true;
        if (path === "false") return false;
        if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
        if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
        return path.split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), scope);
    };
    const whole = (text) => {
        const m = text.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
        return m ? m[1] : null;
    };
    const interp = (text, scope) =>
        text.replace(HOLE, (_, path) => {
            const v = lookup(path, scope);
            return v == null ? "" : String(v);
        });

    // Returns the nodes that replace `node` (itself, none, or a repeated list).
    function process(node, scope) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.nodeValue.includes("{{")) node.nodeValue = interp(node.nodeValue, scope);
            return [node];
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return [node];

        if (node.localName === "sc-for") {
            const list = lookup(whole(node.getAttribute("list") || "") || "", scope) || [];
            const as = node.getAttribute("as") || "item";
            const out = [];
            list.forEach((item, index) => {
                const inner = Object.assign(Object.create(scope), { [as]: item, $index: index });
                for (const child of node.childNodes) out.push(...process(child.cloneNode(true), inner));
            });
            return out;
        }
        if (node.localName === "sc-if") {
            if (!lookup(whole(node.getAttribute("value") || "") || "", scope)) return [];
            const out = [];
            for (const child of [...node.childNodes]) out.push(...process(child, scope));
            return out;
        }

        for (const { name, value } of [...node.attributes]) {
            if (name.startsWith("hint-")) {
                node.removeAttribute(name);
                continue;
            }
            if (!value.includes("{{")) continue;
            const path = whole(value);
            if (/^on[a-z]/.test(name)) {
                node.removeAttribute(name);
                const fn = path ? lookup(path, scope) : null;
                if (typeof fn === "function") node.addEventListener(name.slice(2), fn);
                continue;
            }
            const v = path ? lookup(path, scope) : interp(value, scope);
            node.setAttribute(name, v == null ? "" : String(v));
        }
        for (const child of [...node.childNodes]) {
            const replaced = process(child, scope);
            if (replaced.length === 1 && replaced[0] === child) continue;
            for (const r of replaced) node.insertBefore(r, child);
            child.remove();
        }
        return [node];
    }

    const root = document.getElementById("root");
    let mounted = false;
    function render() {
        const vals = component.renderVals() || {};
        const fragment = template.content.cloneNode(true);
        for (const child of [...fragment.childNodes]) {
            const replaced = process(child, vals);
            if (replaced.length === 1 && replaced[0] === child) continue;
            for (const r of replaced) fragment.insertBefore(r, child);
            child.remove();
        }
        root.replaceChildren(fragment);
        if (!mounted) {
            mounted = true;
            if (typeof component.componentDidMount === "function") component.componentDidMount();
        }
    }
    render();
})();
