"""One-off refactor: replace static inline colour styles with Fooda design-system classes.
Usage: python3 scripts/to_fooda_classes.py file1.jsx file2.jsx ...
Only exact, static style objects listed in MAP are converted; dynamic ones are left alone.
"""
import re, sys

MAP = {
    "{ backgroundColor: '#F5B700', color: '#111111' }": "f-btn-gold",
    "{ color: '#111111' }": "f-on-gold",
    "{ color: '#15803D' }": "f-text-green",
    "{ backgroundColor: '#FFFBEB' }": "f-tint-gold",
    "{ color: '#DC2626' }": "f-text-red",
    "{ color: '#F5B700' }": "f-text-gold",
    "{ backgroundColor: '#ffffff' }": "f-float",
    "{ backgroundColor: '#DC2626', color: '#ffffff' }": "f-btn-danger",
    "{ color: '#ffffff' }": "text-white",
    "{ color: '#B91C1C' }": "f-text-red-strong",
    "{ color: '#991B1B' }": "f-text-red-strong",
    "{ color: '#7F1D1D' }": "f-text-red-strong",
    "{ color: '#6B7280' }": "f-text-muted",
    "{ color: '#374151' }": "f-text-soft",
    "{ backgroundColor: '#F5B700' }": "bg-fooda-gold",
    "{ backgroundColor: '#111111' }": "f-bg-ink",
    "{ color: '#111111', backgroundColor: '#ffffff' }": "f-float",
    "{ borderColor: '#FECACA', color: '#B91C1C', backgroundColor: '#ffffff' }": "f-btn-outline-danger",
    "{ borderColor: '#FECACA', backgroundColor: '#FFFBFB' }": "f-border-red f-tint-red",
    "{ borderColor: '#FDE68A' }": "f-border-gold",
    "{ backgroundColor: '#ffffff', color: '#374151' }": "f-float",
    "{ backgroundColor: '#FFFBEB', color: '#92400E' }": "f-tint-gold f-text-amber",
    "{ backgroundColor: '#FEF3C7', color: '#92400E' }": "f-tint-gold f-text-amber",
    "{ backgroundColor: '#FEF2F2', color: '#991B1B' }": "f-tint-red f-text-red-strong",
    "{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }": "f-tint-red f-border-red",
    "{ backgroundColor: '#FEF2F2' }": "f-tint-red",
    "{ backgroundColor: '#F9FAFB', color: '#6B7280' }": "f-tint-gray f-text-muted",
    "{ backgroundColor: '#F3F4F6' }": "f-tint-gray",
    "{ backgroundColor: '#ECFDF3', color: '#15803D', borderColor: '#BBF7D0' }": "f-tint-green f-text-green f-border-green",
    "{ backgroundColor: '#ECFDF3', color: '#15803D' }": "f-tint-green f-text-green",
    "{ backgroundColor: '#ECFDF3', borderColor: '#BBF7D0' }": "f-tint-green f-border-green",
    "{ backgroundColor: '#ECFDF3' }": "f-tint-green",
    "{ backgroundColor: '#E5383B' }": "bg-fooda-red",
    "{ backgroundColor: '#9CA3AF' }": "bg-gray-400",
    "{ backgroundColor: '#15803D', color: '#ffffff' }": "bg-green-700 text-white",
    "{ backgroundColor: '#FFFDF5' }": "f-tint-cream",
    "{ color: '#111111', backgroundColor: '#ffffff' }": "f-float",
}

STYLE_RE = re.compile(r"\s*style=\{(\{[^{}]*\})\}")


def convert(src):
    out, pos, changed, skipped = [], 0, 0, 0
    for m in STYLE_RE.finditer(src):
        obj = re.sub(r"\s+", " ", m.group(1)).strip()
        tokens = MAP.get(obj)
        if not tokens:
            skipped += 1
            continue
        # Find the opening tag this style belongs to.
        tag_start = src.rfind("<", 0, m.start())
        tag_text = src[tag_start:m.start()]
        out.append(src[pos:tag_start])
        cm = re.search(r'className=("([^"]*)"|\{`([^`]*)`\})', tag_text)
        if cm:
            if cm.group(2) is not None:
                new_cls = f'className="{cm.group(2)} {tokens}"'
            else:
                new_cls = "className={`" + cm.group(3) + f" {tokens}`}}"
            tag_text = tag_text[:cm.start()] + new_cls + tag_text[cm.end():]
            out.append(tag_text)
        else:
            out.append(tag_text + f' className="{tokens}"')
        pos = m.end()
        changed += 1
    out.append(src[pos:])
    return "".join(out), changed, skipped


if __name__ == "__main__":
    for path in sys.argv[1:]:
        src = open(path).read()
        new, changed, skipped = convert(src)
        open(path, "w").write(new)
        print(f"{path}: converted {changed}, left {skipped} dynamic")
