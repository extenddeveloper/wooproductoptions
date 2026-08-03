/**
 * Editable JavaScript source reconstructed from the storefront production bundle.
 * Run npm run build after changing this file.
 */

(() => {
    "use strict";
    const e = window.WooOptionsFicStorefront?.i18n ?? {}, t = { checking: e.checking ?? "Checking your options…", confirmed: e.confirmed ?? "Configuration confirmed", couldNotQuote: e.couldNotQuote ?? "Please review your options before adding this product.", uploading: e.uploading ?? "Uploading…", uploadComplete: e.uploadComplete ?? "Upload complete" }, o = window.WooOptionsFicStorefront?.restRoot ?? "/wp-json/wooptionsfic/v1/";
    function r(e) { return window.CSS?.escape ? window.CSS.escape(e) : e.replace(/[^a-zA-Z0-9_-]/g, "\\$&"); }
    class a {
        quoteTimer = 0;
        aborter = null;
        lastQuote = null;
        lastSelection = "";
        interactionRecorded = !1;
        savedUuid = "";
        productImageSnapshot = null;
        constructor(e) { this.root = e; const t = e.querySelector("[data-wof-config]"); if (!t?.textContent)
            throw new Error("WooOptionsFic configuration payload is missing."); this.payload = JSON.parse(t.textContent), this.configuration = this.payload.configuration, this.form = e.closest("form.cart"), this.root.querySelectorAll("input, select, textarea").forEach(e => { e.disabled && (e.dataset.wofFixedDisabled = "true"), e.required = !1; }), this.bind(), this.updateRangeOutputs(), this.updateColorOutputs(), this.applyConfigurationSettings(), this.applyConfigurationStyle(), this.loadSharedConfiguration(), this.updateProductImage(), this.scheduleQuote(50); }
        bind() { if (this.root.addEventListener("input", e => { const t = e.target; t.matches("[data-wof-save-name]") || (this.updateRangeOutputs(), this.selectionChanged(t)); }), this.root.addEventListener("change", e => { const t = e.target; t.matches("[data-wof-upload-input]") ? this.upload(t) : this.selectionChanged(t); }), this.root.addEventListener("click", e => { const t = e.target, o = t.closest("[data-wof-upload-remove]"); if (o)
            return void this.removeUpload(o); const r = t.closest("[data-wof-add-row]"); if (r)
            return void this.addRow(r); const a = t.closest("[data-wof-remove-row]"); if (a)
            return void this.removeRow(a); const i = t.closest("[data-wof-move-row]"); i ? this.moveRow(i) : t.closest("[data-wof-save]") ? this.saveConfiguration() : t.closest("[data-wof-share]") ? this.shareConfiguration() : t.closest("[data-wof-copy-share]") && this.copyShareLink(); }), this.form?.addEventListener("submit", e => { const t = this.readSelection(); this.writeSelection(t); const o = JSON.stringify(t); this.lastQuote?.valid && this.lastSelection === o && "true" !== this.root.getAttribute("aria-busy") || (e.preventDefault(), this.requestQuote(!0)); }), this.form && window.jQuery) {
            const e = () => this.scheduleQuote(50);
            window.jQuery(this.form).on("found_variation.wooptionsfic reset_data.wooptionsfic", e);
        } }
        selectionChanged(e) { this.updateColorOutputs(), this.updateProductImage(e); if (this.clearFieldError(e.closest("[data-wof-field]")), this.scheduleQuote(), !this.interactionRecorded) {
            this.interactionRecorded = !0;
            const t = e.closest("[data-wof-field]"), r = { setUuid: this.configuration.setUuid, revisionUuid: this.configuration.revisionUuid, variationId: this.variationId(), token: this.payload.token, fieldUuid: t?.dataset.wofField ?? "", choiceUuid: e.matches('input[type="radio"],input[type="checkbox"]') && /^[0-9a-f-]{36}$/i.test(e.value) ? e.value : "" };
            fetch(`${o}products/${this.productId()}/interaction`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r), credentials: "same-origin" }).catch(() => { });
        } }
        scheduleQuote(e = 320) { window.clearTimeout(this.quoteTimer), this.quoteTimer = window.setTimeout(() => { this.requestQuote(); }, e); }
        async requestQuote(e = !1, r = !1) { const a = this.readSelection(); this.writeSelection(a); const i = JSON.stringify(a); this.aborter?.abort(), this.aborter = new AbortController, this.setPending(!0); try {
            const n = await fetch(`${o}products/${this.productId()}/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: this.payload.token, variationId: this.variationId(), quantity: this.quantity(), selection: a }), credentials: "same-origin", cache: "no-store", signal: this.aborter.signal }), s = await n.json().catch(() => ({}));
            if (!n.ok) {
                if (!r && this.isTokenError(s) && await this.refreshConfigurationToken())
                    return await this.requestQuote(e, !0);
                throw new Error(this.restErrorMessage(s));
            }
            this.acceptToken(s.token), this.lastQuote = s, this.lastSelection = i, this.renderQuote(s, e);
        }
        catch (r) {
            if (r instanceof DOMException && "AbortError" === r.name)
                return;
            this.lastQuote = null, this.showGlobalError(r instanceof Error ? r.message : t.couldNotQuote, e), this.setAddToCartEnabled(!1);
        }
        finally {
            this.setPending(!1);
        } }
        acceptToken(e) { if ("string" != typeof e || !e)
            return; this.payload.token = e; const t = this.root.querySelector('input[name="wooptionsfic_token"]'); t && (t.value = e); }
        isTokenError(e) { const t = Array.isArray(e?.data?.errors) ? e.data.errors : Array.isArray(e?.errors) ? e.errors : []; return "wooptionsfic_public_token_invalid" === e?.code || t.some(e => "public_token_invalid" === e?.code || "session_required" === e?.code); }
        restErrorMessage(e) { const o = Array.isArray(e?.data?.errors) ? e.data.errors : Array.isArray(e?.errors) ? e.errors : [], r = o.map(e => e?.code).filter(Boolean); return r.includes("rate_limited") ? "Price checking is temporarily busy. Wait a moment and try again." : r.includes("cross_set_duplicate_uuid") || "wooptionsfic_configuration_merge_failed" === e?.code ? "This product has conflicting option-set assignments. Review the assigned option sets and publish them again." : "string" == typeof e?.message && e.message ? e.message : t.couldNotQuote; }
        async refreshConfigurationToken() { const e = await fetch(`${o}products/${this.productId()}/configuration?variationId=${this.variationId()}&_wof=${Date.now()}`, { method: "GET", credentials: "same-origin", cache: "no-store", headers: { "Cache-Control": "no-cache" } }), t = await e.json().catch(() => ({})); if (!e.ok || !t?.token || !t?.configuration)
            return !1; const r = this.configuration?.revisionUuid ?? "", a = t.configuration.revisionUuid ?? ""; if (r && a && r !== a)
            throw new Error("Product options were updated. Refresh this page before continuing."); this.payload = { ...this.payload, ...t }, this.configuration = t.configuration, this.applyConfigurationSettings(), this.applyConfigurationStyle(); const i = this.root.querySelector('input[name="wooptionsfic_token"]'), n = this.root.querySelector('input[name="wooptionsfic_revision"]'); return i && (i.value = t.token), n && (n.value = a), !0; }
        applyConfigurationSettings() { const e = this.configuration?.settings ?? {}, t = this.root.querySelector("[data-wof-summary]"), o = this.root.querySelector("[data-wof-summary-rows]"), r = this.root.querySelector("[data-wof-save-panel]"), a = this.root.querySelector(".wof-configurator__grid"), i = this.root.querySelector("[data-wof-fields]"), n = !1 !== e.showPriceBreakdown, s = !1 !== e.stickySummary, c = !1 !== e.saveEnabled; t?.classList.toggle("is-sticky", s), t && a && i && (s ? a.insertBefore(t, i) : a.append(t)), o && (o.hidden = !n), r && (r.hidden = !c), this.root.dataset.showPriceBreakdown = n ? "1" : "0", this.root.dataset.stickySummary = s ? "1" : "0", this.root.dataset.saveEnabled = c ? "1" : "0"; }
        applyConfigurationStyle() { const e = this.configuration?.style ?? {}, t = e.tokens ?? {}; Object.entries(t).forEach(([e, t]) => { if ("string" != typeof t || !/^(?:#[0-9a-f]{6}|currentColor|Canvas|transparent)$/i.test(t))
            return; const o = e.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(); this.root.style.setProperty(`--wof-${o}`, t); }), this.root.dataset.wofPalette = String(e.palette ?? ""), this.root.style.colorScheme = "night-studio" === e.palette ? "dark" : "light"; const o = e.typography ?? {}, r = o.family ?? "inherit", a = { inherit: "inherit", "system-ui": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', Inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', Manrope: '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', Poppins: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', Outfit: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', "Plus Jakarta Sans": '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', Roboto: '"Roboto", Arial, sans-serif' }; this.root.style.setProperty("--wof-font", a[r] ?? "inherit"), this.root.style.setProperty("--wof-label-weight", String(Math.max(400, Math.min(800, Number(o.labelWeight ?? 650))))), this.root.style.setProperty("--wof-body-weight", String(Math.max(300, Math.min(700, Number(o.bodyWeight ?? 450))))), this.root.style.setProperty("--wof-font-size", `${Math.max(16, Math.min(24, Number(o.desktopSize ?? 16)))}px`), this.root.style.setProperty("--wof-line-height", String(Math.max(1.2, Math.min(2, Number(o.lineHeight ?? 1.5))))), this.ensureTypographyFont(r); }
        ensureTypographyFont(e) { const t = { Inter: "Inter:wght@300;400;500;600;700;800", Manrope: "Manrope:wght@300;400;500;600;700;800", Poppins: "Poppins:wght@300;400;500;600;700;800", Outfit: "Outfit:wght@300;400;500;600;700;800", "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@300;400;500;600;700;800", Roboto: "Roboto:wght@300;400;500;600;700;800" }[e]; if (!t)
            return; const o = `wooptionsfic-font-${e.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; if (document.getElementById(o))
            return; const r = document.createElement("link"); r.id = o, r.rel = "stylesheet", r.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t).replace(/%3A/g, ":").replace(/%40/g, "@").replace(/%3B/g, ";").replace(/%2B/g, "+")}&display=swap`, r.crossOrigin = "anonymous", document.head.append(r); }
        readSelection() { const e = {}; return this.configuration.fields.forEach(t => { this.acceptsValue(t) && (e[t.uuid] = this.readField(t, this.root)); }), e; }
        readField(e, t) { const o = t.querySelector(`[data-wof-field="${r(e.uuid)}"]`); if (!o)
            return null; if ("repeater" === e.type)
            return Array.from(o.querySelectorAll(":scope [data-wof-row]")).map(t => { const o = {}; return (e.children ?? []).forEach(e => { o[e.uuid] = this.readField(e, t); }), { rowUuid: t.dataset.wofRow, values: o }; }); if ("checkbox" === e.type || "toggle" === e.type)
            return Boolean(o.querySelector('input[type="checkbox"]:checked')); if ("checkbox_group" === e.type || e.multiple)
            return Array.from(o.querySelectorAll('input[type="checkbox"]:checked')).map(e => e.value); if (["radio", "segmented", "color_swatch", "image_swatch"].includes(e.type))
            return o.querySelector('input[type="radio"]:checked')?.value ?? ""; if ("product" === e.type)
            return Array.from(o.querySelectorAll("input:checked")).map(e => e.value); if ("date_range" === e.type) {
            const e = o.querySelectorAll('input[type="date"]');
            return { start: e[0]?.value ?? "", end: e[1]?.value ?? "" };
        } return "file" === e.type ? Array.from(o.querySelectorAll("[data-wof-upload-ref]")).map(e => e.value).filter(Boolean) : o.querySelector('input:not([type="file"]), select, textarea')?.value ?? ""; }
        acceptsValue(e) { return !["heading", "paragraph", "help", "separator", "spacer", "formula", "calculated"].includes(e.type); }
        writeSelection(e) { const t = this.root.querySelector("[data-wof-selection-json]"); t && (t.value = JSON.stringify(e)); }
        renderQuote(e, o) { if (e?.settings && (this.configuration.settings = { ...(this.configuration.settings ?? {}), ...e.settings }), e?.style && (this.configuration.style = e.style), e?.settings || e?.style)
            this.applyConfigurationSettings(), this.applyConfigurationStyle(); if (this.clearAllErrors(), this.applyStates(e.states), !e.valid)
            return this.renderErrors(e.errors, o), this.setAddToCartEnabled(!1), void this.setStatus(t.couldNotQuote, "error"); this.setAddToCartEnabled(!0), this.setStatus(t.confirmed, "confirmed"); const a = this.root.querySelector("[data-wof-total]"); a && e.price && (a.textContent = this.money(e.price.unitPrice.decimal, e.price.unitPrice.currency)); const i = this.root.querySelector("[data-wof-summary-rows]"), n = !1 !== this.configuration?.settings?.showPriceBreakdown; i && (i.hidden = !n, i.replaceChildren(), n && e.price?.contributions.forEach(e => { const t = document.createElement("div"), o = document.createElement("span"), a = document.createElement("strong"); o.textContent = e.label, a.textContent = this.money(e.rounded.decimal, e.rounded.currency), t.append(o, a), i.append(t); const n = this.root.querySelector(`[data-wof-calculated="${r(e.sourceUuid)}"]`); n && (n.value = a.textContent); })); }
        applyStates(e) { Object.entries(e ?? {}).forEach(([e, t]) => { const o = this.root.querySelector(`[data-wof-field="${r(e)}"]`); o && (o.hidden = !t.visible, o.classList.toggle("is-disabled", !t.enabled), o.querySelectorAll("input, select, textarea").forEach(e => { const o = !!t.visible && !!t.enabled; e.disabled = !o || "true" === e.dataset.wofFixedDisabled, e.required = !1, t.required && o ? e.setAttribute("aria-required", "true") : e.removeAttribute("aria-required"); })); }); }
        renderErrors(e, t) { const o = this.root.querySelector("[data-wof-errors]"), a = []; let i = null; if (e.forEach(e => { const t = e.fieldUuid ? this.root.querySelector(`[data-wof-field="${r(e.fieldUuid)}"]`) : null, o = this.errorText(e.code, e.label); if (t) {
            t.classList.add("is-invalid");
            const e = t.querySelector("[data-wof-field-error]");
            e && (e.textContent = o), t.querySelector("input, select, textarea")?.setAttribute("aria-invalid", "true"), i ??= t;
        }
        else
            a.push(o); }), o && (o.hidden = 0 === a.length, o.textContent = a.join(" ")), t) {
            const e = i, t = e?.querySelector("input, select, textarea") ?? o;
            t?.focus();
        } }
        errorText(e, t = "") { const o = t || "This option"; return e.includes("required") ? `${o} is required.` : e.includes("minimum") || e.includes("too_few") ? `${o} is below the allowed minimum.` : e.includes("maximum") || e.includes("too_many") ? `${o} exceeds the allowed maximum.` : e.includes("email") ? `Enter a valid email address for ${o}.` : e.includes("upload") ? `Check the private upload for ${o}.` : `Please check ${o}.`; }
        clearAllErrors() { this.root.querySelectorAll(".is-invalid").forEach(e => this.clearFieldError(e)); const e = this.root.querySelector("[data-wof-errors]"); e && (e.hidden = !0, e.textContent = ""); }
        clearFieldError(e) { if (!e)
            return; e.classList.remove("is-invalid"); const t = e.querySelector("[data-wof-field-error]"); t && (t.textContent = ""), e.querySelector('[aria-invalid="true"]')?.removeAttribute("aria-invalid"); }
        showGlobalError(e, o = !1) { const r = this.root.querySelector("[data-wof-errors]"); r && (r.hidden = !1, r.textContent = e, o && r.focus()), this.setStatus(t.couldNotQuote, "error"); }
        setPending(e) { this.root.setAttribute("aria-busy", e ? "true" : "false"), this.root.classList.toggle("is-quoting", e), e && this.setStatus(t.checking, "pending"); }
        setStatus(e, t) { const o = this.root.querySelector("[data-wof-status]"); if (o) {
            o.dataset.state = t;
            const r = o.querySelector("span:last-child");
            r && (r.textContent = e);
        } }
        setAddToCartEnabled(e) { const t = this.form?.querySelector("button.single_add_to_cart_button"); t && (t.disabled = !e, t.setAttribute("aria-disabled", e ? "false" : "true")); }
        updateRangeOutputs() { this.root.querySelectorAll('input[type="range"]').forEach(e => { const t = e.parentElement?.querySelector("[data-wof-range-output]"); t && (t.value = e.value); }); }
        updateColorOutputs() { this.root.querySelectorAll("[data-wof-color-picker]").forEach(e => { const t = e.querySelector("[data-wof-color-input]"), o = e.querySelector("[data-wof-color-value]"); t && o && (o.textContent = String(t.value || "#5B4FF5").toUpperCase()); }); }
        captureProductImageSnapshot() { if (this.productImageSnapshot) return; const e = this.root.closest(".product") ?? document, t = Array.from(e.querySelectorAll(".woocommerce-product-gallery__image.flex-active-slide img, .woocommerce-product-gallery__image:first-child img, .woocommerce-product-gallery .wp-post-image")).filter(e => !this.root.contains(e)), o = Array.from(new Set(t)); this.productImageSnapshot = o.map(e => ({ element: e, src: e.getAttribute("src"), srcset: e.getAttribute("srcset"), sizes: e.getAttribute("sizes"), dataSrc: e.getAttribute("data-src"), large: e.getAttribute("data-large_image"), parentHref: e.closest("a")?.getAttribute("href") ?? null })); }
        restoreProductImage() { if (!this.productImageSnapshot) return; this.productImageSnapshot.forEach(e => { const t = e.element, o = (r, a) => { null === a ? t.removeAttribute(r) : t.setAttribute(r, a); }; o("src", e.src), o("srcset", e.srcset), o("sizes", e.sizes), o("data-src", e.dataSrc), o("data-large_image", e.large); const r = t.closest("a"); r && (null === e.parentHref ? r.removeAttribute("href") : r.setAttribute("href", e.parentHref)); }); }
        updateProductImage(e = null) { const t = e?.closest?.('[data-wof-update-product-image="1"]') ?? this.root.querySelector('[data-wof-update-product-image="1"]'); if (!t) return; const o = t.querySelector('input:checked[data-wof-product-image-url]'), r = o?.dataset?.wofProductImageUrl ?? ""; if (!r) { o || this.restoreProductImage(); return; } this.captureProductImageSnapshot(), this.productImageSnapshot?.forEach(e => { const t = e.element; t.setAttribute("src", r), t.setAttribute("data-src", r), t.setAttribute("data-large_image", r), t.removeAttribute("srcset"), t.removeAttribute("sizes"); const o = t.closest("a"); o && o.setAttribute("href", r); }), this.root.dispatchEvent(new CustomEvent("wooptionsfic:product-image-updated", { detail: { url: r } })); }
        addRow(e) { const t = e.closest("[data-wof-repeater]"), o = t?.querySelector("[data-wof-repeater-rows]"), r = o?.querySelectorAll(":scope > [data-wof-row]"); if (!t || !o || !r?.length)
            return; const a = Number(t.dataset.max || 10); if (r.length >= a)
            return; const i = r[r.length - 1], n = i.cloneNode(!0), s = i.dataset.wofRow ?? "", c = crypto.randomUUID(); n.dataset.wofRow = c, n.querySelectorAll("[name], [id], [for]").forEach(e => { ["name", "id", "for"].forEach(t => { const o = e.getAttribute(t); o && e.setAttribute(t, o.split(s).join(c)); }); }), n.querySelectorAll("input, textarea, select").forEach(e => { e instanceof HTMLInputElement ? ["checkbox", "radio"].includes(e.type) ? e.checked = !1 : "hidden" !== e.type && (e.value = "") : e.value = ""; }), o.append(n), this.renumberRows(t), n.querySelector("input, select, textarea")?.focus(), this.announceRows(t, "Row added."), this.scheduleQuote(50); }
        removeRow(e) { const t = e.closest("[data-wof-repeater]"), o = e.closest("[data-wof-row]"), r = t?.querySelectorAll("[data-wof-row]"); if (!t || !o || !r || r.length <= Number(t.dataset.min || 0))
            return; const a = o.previousElementSibling?.querySelector("input, select, textarea") ?? t.querySelector("[data-wof-add-row]"); o.remove(), this.renumberRows(t), a?.focus(), this.announceRows(t, "Row removed."), this.scheduleQuote(50); }
        moveRow(e) { const t = e.closest("[data-wof-repeater]"), o = e.closest("[data-wof-row]"), r = e.dataset.wofMoveRow; t && o && ("up" === r && o.previousElementSibling && o.parentElement?.insertBefore(o, o.previousElementSibling), "down" === r && o.nextElementSibling && o.parentElement?.insertBefore(o.nextElementSibling, o), this.renumberRows(t), e.focus(), this.announceRows(t, "Row moved."), this.scheduleQuote(50)); }
        renumberRows(e) { e.querySelectorAll("[data-wof-row]").forEach((e, t) => { const o = e.querySelector("legend"); o && (o.textContent = o.textContent?.replace(/#?\d+$/, String(t + 1)) ?? `Item ${t + 1}`); }); }
        announceRows(e, t) { const o = e.querySelector("[data-wof-repeater-live]"); o && (o.textContent = t); }
        formatBytes(e) { const t = Number(e); return Number.isFinite(t) && t > 0 ? t >= 1048576 ? `${(t / 1048576).toFixed(t >= 10485760 ? 1 : 2)} MB` : t >= 1024 ? `${(t / 1024).toFixed(1)} KB` : `${t} B` : "0 B"; }
        uploadFileIconSvg(e, t) { const o = (String(t ?? "").split(".").pop() ?? "").toLowerCase(), r = String(e ?? "").toLowerCase(); return "pdf" === o || r.includes("pdf") ? '<svg viewBox="0 0 24 24" focusable="false"><path d="M6.5 2.75h7l4 4v14.5h-11zM13.5 2.75v4h4M8.7 12.1h6.6M8.7 15.2h6.6M8.7 18.3h4.2" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>' : "csv" === o || r.includes("spreadsheet") || r.includes("excel") || r.includes("csv") ? '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 4.5h16v15H4zM4 9.5h16M4 14.5h16M9.4 4.5v15M14.7 4.5v15" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>' : "txt" === o || r.startsWith("text/") ? '<svg viewBox="0 0 24 24" focusable="false"><path d="M6 3.5h8l4 4v13H6zM14 3.5v4h4M8.7 11h6.6M8.7 14.3h6.6M8.7 17.6h4.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : r.startsWith("audio/") ? '<svg viewBox="0 0 24 24" focusable="false"><path d="M9.5 18.2a2.7 2.7 0 1 1-2.7-2.7c1.05 0 1.9.28 2.7.82V6.2l8-1.7v11.8a2.7 2.7 0 1 1-2.7-2.7c1.05 0 1.9.28 2.7.82V8.1l-8 1.7z" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>' : r.startsWith("video/") ? '<svg viewBox="0 0 24 24" focusable="false"><rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg>' : r.includes("zip") || r.includes("archive") || ["zip", "rar", "7z"].includes(o) ? '<svg viewBox="0 0 24 24" focusable="false"><path d="M6 3.5h8l4 4v13H6zM14 3.5v4h4M10.5 5.5h2M10.5 8h2M10.5 10.5h2M10.2 14h2.6v3.4h-2.6z" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 24 24" focusable="false"><path d="M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15h6M9 18h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
        releaseUploadPreview(e) { const t = e?.dataset?.wofPreviewUrl ?? ""; t && window.URL?.revokeObjectURL && (window.URL.revokeObjectURL(t), delete e.dataset.wofPreviewUrl); }
        renderUploadItemIcon(e, t, o = "", r = !1) { const a = e.querySelector(".wof-upload-item__icon"); if (!a)
            return; this.releaseUploadPreview(e); const i = String(o || t?.type || "").toLowerCase(), n = String(t?.name || "").toLowerCase(), s = (n.split(".").pop() ?? "").toLowerCase(); a.className = "wof-upload-item__icon", a.replaceChildren(); if (r && i.startsWith("image/") && t instanceof Blob && window.URL?.createObjectURL) {
            const o = window.URL.createObjectURL(t), r = document.createElement("img");
            r.src = o, r.alt = "", r.loading = "eager", r.decoding = "async", r.dataset.wofObjectUrl = "true", e.dataset.wofPreviewUrl = o, a.classList.add("is-image"), a.append(r);
            return;
        } const c = i.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(s); a.classList.add(c ? "is-image-file" : "pdf" === s || i.includes("pdf") ? "is-pdf" : "csv" === s || i.includes("csv") || i.includes("spreadsheet") ? "is-sheet" : "txt" === s || i.startsWith("text/") ? "is-text" : i.startsWith("audio/") ? "is-audio" : i.startsWith("video/") ? "is-video" : i.includes("zip") || i.includes("archive") || ["zip", "rar", "7z"].includes(s) ? "is-archive" : "is-file"), a.innerHTML = c ? '<svg viewBox="0 0 24 24" focusable="false"><path d="M4.5 5.5h15v13h-15zM7.5 15l3.2-3.5 2.4 2.3 1.9-2 2.5 3.2M9 9.2h.01" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>' : this.uploadFileIconSvg(i, n); }
        createUploadItem(e, t) { const o = document.createElement("div"); o.className = "wof-upload-item is-uploading", o.innerHTML = '<button type="button" class="wof-upload-item__remove" data-wof-upload-remove aria-label="Remove file"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button><span class="wof-upload-item__icon" aria-hidden="true"></span><span class="wof-upload-item__copy"><strong></strong><span class="wof-upload-item__progress" aria-hidden="true"><i></i></span><small></small></span><span class="wof-upload-item__size"></span>'; const r = o.querySelector("strong"), a = o.querySelector(".wof-upload-item__size"), i = o.querySelector(".wof-upload-item__copy small"); return r && (r.textContent = e.name), a && (a.textContent = this.formatBytes(e.size)), i && (i.textContent = t), this.renderUploadItemIcon(o, e, e.type, !1), o; }
        setUploadItemError(e, t, o = "") { e.classList.remove("is-uploading", "is-complete"), e.classList.add("is-error"); const r = e.querySelector(".wof-upload-item__copy small"), a = e.querySelector(".wof-upload-item__progress"); r && (r.textContent = t), a && (a.hidden = !0), o && (e.dataset.errorDetail = o); }
        setUploadItemComplete(e, t, o) { e.classList.remove("is-uploading", "is-error"), e.classList.add("is-complete"), e.dataset.wofUploadId = t.opaqueId; const r = e.querySelector(".wof-upload-item__copy small"), a = e.querySelector(".wof-upload-item__size"), i = e.querySelector(".wof-upload-item__progress i"); r && (r.textContent = "Upload complete"), a && (a.textContent = this.formatBytes(t.bytes)), i && (i.style.width = "100%"), this.renderUploadItemIcon(e, o, t.mime, !0); }
        removeUpload(e) { const t = e.closest("[data-wof-upload]"), o = e.closest(".wof-upload-item"); if (!t || !o)
            return; const a = o.dataset.wofUploadId ?? ""; a && t.querySelector(`[data-wof-upload-ref][data-wof-upload-id="${r(a)}"]`)?.remove(), this.releaseUploadPreview(o), o.remove(), t.classList.toggle("has-files", Boolean(t.querySelector(".wof-upload-item"))), this.scheduleQuote(50); }
        async upload(e) { const o = e.closest("[data-wof-field]"), r = e.closest("[data-wof-upload]"), a = r?.querySelector("[data-wof-upload-list]"), i = r?.querySelector("[data-wof-upload-template]"), n = Array.from(e.files ?? []); if (!(n.length && o && r && a && i))
            return; const s = Math.max(1, Number(r.dataset.maxFiles ?? 1)), c = Math.max(1, Number(r.dataset.maxFileMb ?? 5)), d = c * 1048576; if (n.length > s)
            return this.showGlobalError(`Choose no more than ${s} file${1 === s ? "" : "s"}.`, !0), void (e.value = ""); r.querySelectorAll("[data-wof-upload-ref]:not([data-wof-upload-template])").forEach(e => e.remove()), a.querySelectorAll(".wof-upload-item").forEach(e => this.releaseUploadPreview(e)), a.replaceChildren(), r.classList.add("is-uploading"), r.classList.remove("is-complete"), this.setStatus(t.uploading, "pending"); let u = 0; for (const h of n) {
            const n = this.createUploadItem(h, "Uploading…");
            a.append(n);
            if (h.size > d) {
                this.setUploadItemError(n, "File is too large", `Max File Size: ${c}MB`);
                const e = n.querySelector(".wof-upload-item__copy small");
                e && (e.innerHTML = "", e.append(document.createTextNode("File is too large"), document.createElement("br")));
                const t = document.createElement("span");
                t.className = "wof-upload-item__detail", t.textContent = `Max File Size: ${c}MB`, e?.append(t);
                continue;
            }
            try {
                const t = await this.uploadFile(h, o.dataset.wofField ?? "", e.closest("[data-wof-row]")?.dataset.wofRow ?? "");
                const r = i.cloneNode(!0);
                r.removeAttribute("data-wof-upload-template"), r.removeAttribute("hidden"), r.value = t.opaqueId, r.dataset.wofUploadId = t.opaqueId, i.insertAdjacentElement("afterend", r), this.setUploadItemComplete(n, t, h), u++;
            }
            catch (e) {
                this.setUploadItemError(n, e instanceof Error ? e.message : "The file was not accepted.");
            }
        } r.classList.remove("is-uploading"), r.classList.toggle("is-complete", u > 0), r.classList.toggle("has-files", a.children.length > 0), e.value = "", this.scheduleQuote(50); }
        uploadErrorMessage(e, t = "The file was not accepted.") { const o = Array.isArray(e?.data?.errors) ? e.data.errors : Array.isArray(e?.errors) ? e.errors : [], r = o.map(e => e?.code).filter(Boolean); return r.includes("session_required") ? "Your upload session could not be started. Refresh the page and try again." : r.includes("invalid_upload_field") ? "This upload field is no longer available. Refresh the product page." : r.includes("upload_size") ? "The file is larger than the allowed upload limit." : r.includes("upload_extension") ? "This file type is not allowed for this option." : r.includes("upload_mime") ? "The file contents do not match its file extension." : r.includes("upload_dimensions") ? "The image dimensions are too large or the image is invalid." : r.includes("upload_rejected") ? "The file did not pass the security scan." : r.includes("upload_revision_changed") ? "The product options were updated. Refresh the page before uploading." : r.includes("upload_intent_expired") ? "The upload took too long. Choose the file again." : r.includes("upload_error") || r.includes("upload_missing") ? "The browser could not send this file. Choose it again." : "string" == typeof e?.message && e.message && "The request contains invalid configuration data." !== e.message ? e.message : t; }
        async uploadFile(e, t, r, a = !1) { const i = await fetch(`${o}uploads/intents`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify({ productId: this.productId(), variationId: this.variationId(), fieldUuid: t, rowUuid: r, token: this.payload.token }) }), n = await i.json().catch(() => ({})); if (!i.ok || !n.opaqueId) {
            if (!a && this.isTokenError(n) && await this.refreshConfigurationToken())
                return this.uploadFile(e, t, r, !0);
            throw new Error(this.uploadErrorMessage(n, "The upload could not start."));
        } const s = async (t) => { const r = new FormData; r.append("file", e), r.append("token", this.payload.token); const a = await fetch(`${o}uploads/${n.opaqueId}/complete`, { method: "POST", body: r, credentials: "same-origin", cache: "no-store" }), i = await a.json().catch(() => ({})); if (!a.ok || !i.opaqueId) {
            if (!t && this.isTokenError(i) && await this.refreshConfigurationToken())
                return s(!0);
            throw new Error(this.uploadErrorMessage(i));
        } return { opaqueId: i.opaqueId, name: i.name ?? e.name, bytes: Number(i.bytes ?? e.size), mime: i.mime ?? e.type }; }; return s(!1); }
        async saveConfiguration(e = !1) { if (!this.configuration?.settings?.saveEnabled)
            return; if (!this.lastQuote?.valid && (await this.requestQuote(!0), !this.lastQuote?.valid))
            return; const t = this.root.querySelector("[data-wof-save-status]"), r = this.root.querySelector("[data-wof-save-name]")?.value ?? "My configuration"; t && (t.textContent = "Saving…"); try {
            const a = await fetch(`${o}saved-configurations`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify({ productId: this.productId(), variationId: this.variationId(), name: r, selection: this.readSelection(), token: this.payload.token }) }), i = await a.json().catch(() => ({}));
            if (!a.ok || !i.uuid) {
                if (!e && this.isTokenError(i) && await this.refreshConfigurationToken())
                    return this.saveConfiguration(!0);
                throw new Error(this.restErrorMessage(i));
            }
            this.savedUuid = i.uuid, t && (t.textContent = "Configuration saved."), this.root.querySelector("[data-wof-share]")?.removeAttribute("hidden");
        }
        catch (e) {
            t && (t.textContent = e instanceof Error ? e.message : "Save failed.");
        } }
        async shareConfiguration(e = !1) { if (this.savedUuid || await this.saveConfiguration(), !this.savedUuid)
            return; const t = this.root.querySelector("[data-wof-save-status]"); t && (t.textContent = "Creating share link…"); try {
            const r = await fetch(`${o}saved-configurations/${this.savedUuid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store", body: JSON.stringify({ action: "share" }) }), a = await r.json().catch(() => ({}));
            if (!r.ok || !a.token) {
                if (!e && this.isTokenError(a) && await this.refreshConfigurationToken())
                    return this.shareConfiguration(!0);
                const o = Array.isArray(a?.data?.errors) ? a.data.errors : Array.isArray(a?.errors) ? a.errors : [], r = o.map(e => e?.code).filter(Boolean);
                throw new Error(r.includes("share_disabled") ? "Share links are disabled for this option set." : r.includes("session_required") ? "Your saved-configuration session expired. Save it again and retry." : "string" == typeof a?.message && a.message && "The request contains invalid configuration data." !== a.message ? a.message : "Could not create a share link.");
            }
            const i = new URL(window.location.href);
            i.searchParams.set("wof_share", a.token);
            const n = this.root.querySelector("[data-wof-share-link]"), s = n?.querySelector("input");
            n && s && (n.hidden = !1, s.value = i.toString(), s.focus(), s.select()), t && (t.textContent = "Share link created.");
        }
        catch (e) {
            t && (t.textContent = e instanceof Error ? e.message : "Share failed.");
        } }
        async copyShareLink() { const e = this.root.querySelector("[data-wof-share-link] input"); if (e?.value)
            try {
                await navigator.clipboard.writeText(e.value);
                const t = this.root.querySelector("[data-wof-save-status]");
                t && (t.textContent = "Share link copied.");
            }
            catch {
                e.focus(), e.select();
            } }
        loadSharedConfiguration() { const e = new URL(window.location.href).searchParams.get("wof_share"); e && fetch(`${o}shared-configurations/${encodeURIComponent(e)}/load`, { method: "POST", credentials: "same-origin" }).then(async (e) => { const t = await e.json(); if (!e.ok || !t.configuration || t.configuration.productId !== this.productId())
            throw new Error(t.message ?? "This shared configuration is unavailable for this product."); this.applySelection(t.configuration.selection), this.scheduleQuote(50); const o = this.root.querySelector("[data-wof-save-status]"); o && (o.textContent = "Shared configuration loaded."); }).catch(e => this.showGlobalError(e instanceof Error ? e.message : "Shared configuration could not load.")); }
        applySelection(e) { this.configuration.fields.forEach(t => { const o = e[t.uuid], a = this.root.querySelector(`[data-wof-field="${r(t.uuid)}"]`); if (!a || void 0 === o || "repeater" === t.type)
            return; if ("checkbox" === t.type || "toggle" === t.type) {
            const e = a.querySelector('input[type="checkbox"]');
            return void (e && (e.checked = Boolean(o)));
        } if (t.choices) {
            const e = Array.isArray(o) ? o.map(String) : [String(o)];
            a.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(t => { t.checked = e.includes(t.value); });
            const t = a.querySelector("select");
            return void (t && (t.value = e[0] ?? ""));
        } const i = a.querySelector('input:not([type="file"]), textarea, select'); i && "object" != typeof o && (i.value = String(o ?? "")); }), this.updateColorOutputs(), this.updateProductImage(); }
        money(e, t) { const o = Number(e); if (Number.isFinite(o))
            try {
                return new Intl.NumberFormat(window.WooOptionsFicStorefront.locale, { style: "currency", currency: t }).format(o);
            }
            catch {
                return `${t} ${e}`;
            } return `${t} ${e}`; }
        productId() { return Number(this.root.dataset.productId ?? 0); }
        variationId() { return Number(this.form?.querySelector("input.variation_id")?.value ?? 0); }
        quantity() { return Math.max(1, Number(this.form?.querySelector("input.qty")?.value ?? 1)); }
    }
    function i() { document.querySelectorAll("[data-wof-root]").forEach(e => { if (!e.dataset.wofReady) {
        e.dataset.wofReady = "true";
        try {
            new a(e);
        }
        catch (e) {
            window.console.error("WooOptionsFic could not initialize.", e);
        }
    } }); }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", i, { once: !0 }) : i();
})();

