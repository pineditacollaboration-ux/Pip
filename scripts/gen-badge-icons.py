# Iconos sólidos de dos tonos para las insignias (viewBox 24x24, hechos a medida).
# Capas: cuerpo = currentColor, detalle = var(--d) (oscuro), brillo = blanco translúcido.
import json, math

D = 'style="fill:var(--d)"'
DS = 'style="stroke:var(--d);fill:none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'
HI = 'fill="#fff" fill-opacity=".34"'
B = 'fill="currentColor"'

def star(cx, cy, ro, ri, n=5):
    pts = []
    for k in range(n * 2):
        r = ro if k % 2 == 0 else ri
        a = -math.pi / 2 + k * math.pi / n
        pts.append(f"{cx + r*math.cos(a):.2f} {cy + r*math.sin(a):.2f}")
    return "M" + "L".join(pts) + "Z"

icons = {}

icons['crown'] = (
    f'<path {B} d="M3 8.2 7.5 11.6 12 5l4.5 6.6L21 8.2 19 17.5H5z"/>'
    f'<rect {B} x="5" y="19" width="14" height="2.4" rx="1.2"/>'
    f'<circle {B} cx="3" cy="8" r="1.6"/><circle {B} cx="12" cy="4.9" r="1.7"/><circle {B} cx="21" cy="8" r="1.6"/>'
    f'<path {HI} d="M12 5 7.5 11.6 12 9.6z"/>'
    f'<circle {D} cx="12" cy="13.6" r="1.6"/><circle {D} cx="8" cy="14.8" r=".9"/><circle {D} cx="16" cy="14.8" r=".9"/>'
)

icons['award'] = (
    f'<path {B} fill-opacity=".62" d="M8.2 14.2 6.6 22.3 12 19.6l5.4 2.7-1.6-8.1z"/>'
    f'<circle {B} cx="12" cy="9" r="7"/>'
    f'<path {HI} d="M6.1 6.4a6.6 6.6 0 0 1 11.8 0A8.5 8.5 0 0 0 6.1 6.4z"/>'
    f'<circle {DS} cx="12" cy="9" r="4.7" stroke-opacity=".55" stroke-width="1"/>'
    f'<path {D} d="{star(12, 9.1, 3.1, 1.35)}"/>'
)

icons['plug'] = (
    f'<rect {B} x="8" y="2.6" width="2.3" height="6.4" rx="1.15"/><rect {B} x="13.7" y="2.6" width="2.3" height="6.4" rx="1.15"/>'
    f'<path {B} d="M5.6 8.4h12.8a.6.6 0 0 1 .6.6v3.6a7 7 0 0 1-7 7h-.0a7 7 0 0 1-7-7V9a.6.6 0 0 1 .6-.6z" transform="translate(0 -.4)"/>'
    f'<rect {B} x="10.8" y="17.6" width="2.4" height="4.6" rx="1.2"/>'
    f'<path {HI} d="M6.4 8.4h6.2v9.6A6.9 6.9 0 0 1 6.4 12.6z" transform="translate(0 -.4)"/>'
    f'<rect {D} x="9.2" y="11.2" width="1.9" height="3" rx=".9"/><rect {D} x="12.9" y="11.2" width="1.9" height="3" rx=".9"/>'
)

icons['user-round'] = (
    f'<circle {B} cx="12" cy="8" r="4.6"/>'
    f'<path {B} d="M3.6 21.4c0-4.9 3.8-7.8 8.4-7.8s8.4 2.9 8.4 7.8z"/>'
    f'<path {HI} d="M8.2 6.2a4.2 4.2 0 0 1 4.6-2.6 4.4 4.4 0 0 0-4.6 2.6z"/>'
    f'<path {D} fill-opacity=".35" d="M8.8 16.2c.9 1.3 2 1.9 3.2 1.9s2.3-.6 3.2-1.9c-1-.5-2-.7-3.2-.7s-2.2.2-3.2.7z"/>'
)

icons['link'] = (
    f'<path d="M10.2 13.8a4.6 4.6 0 0 0 6.9.5l3-3a4.6 4.6 0 0 0-6.5-6.5l-1.5 1.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'
    f'<path d="M13.8 10.2a4.6 4.6 0 0 0-6.9-.5l-3 3a4.6 4.6 0 0 0 6.5 6.5l1.5-1.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'
    f'<path d="M9.4 14.6l5.2-5.2" {DS} stroke-width="1.5" stroke-opacity=".7"/>'
)

icons['film'] = (
    f'<rect {B} x="2.6" y="4" width="18.8" height="16" rx="2.8"/>'
    f'<path {HI} d="M5.4 4h13.2a2.8 2.8 0 0 1 2.8 2.8V8H2.6V6.8A2.8 2.8 0 0 1 5.4 4z"/>'
    + ''.join(f'<rect {D} x="4.3" y="{y}" width="2" height="2" rx=".6"/><rect {D} x="17.7" y="{y}" width="2" height="2" rx=".6"/>' for y in (6.4, 11, 15.6))
    + f'<rect {D} x="8.2" y="6.6" width="7.6" height="10.8" rx="1.4"/>'
    f'<path {B} d="M10.9 9.9 13.9 12l-3 2.1z"/>'
)

icons['palette'] = (
    f'<path {B} d="M12 2.8a9.2 9.2 0 1 0 0 18.4c1.2 0 2-.9 2-1.9 0-.6-.2-1-.6-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a4.2 4.2 0 0 0 4.2-4.2C21.2 6.4 17.1 2.8 12 2.8z"/>'
    f'<path {HI} d="M12 2.8c-3.6 0-6.6 2-8 4.9C5.6 6 8.5 5 12 5.2c3.4.2 6.2 1.4 8.4 3.4C19.7 5.4 16.2 2.8 12 2.8z"/>'
    f'<circle {D} cx="7.4" cy="11.6" r="1.5"/><circle {D} cx="10" cy="7.6" r="1.5"/><circle {D} cx="14.6" cy="7.6" r="1.5"/><circle {D} cx="17.3" cy="11" r="1.5"/>'
)

icons['eye'] = (
    f'<path {B} d="M1.8 12C4.4 7.2 8 5 12 5s7.6 2.2 10.2 7c-2.6 4.8-6.2 7-10.2 7S4.4 16.8 1.8 12z"/>'
    f'<circle {D} cx="12" cy="12" r="4.6"/><circle {B} cx="12" cy="12" r="2.3"/>'
    f'<circle fill="#fff" cx="13.1" cy="10.9" r="1"/>'
)

icons['flame'] = (
    f'<path {B} d="M12.4 1.9c.5 3.2 3.3 5.1 5 7.8 1.3 2.1 1.6 4.5.7 6.7a6.6 6.6 0 0 1-6.1 4.7 6.6 6.6 0 0 1-6-5.6c-.4-2.5.5-4.5 1.9-6.2.3 1.5 1 2.5 2 3C9.4 8.2 10.6 4.8 12.4 1.9z"/>'
    f'<path {D} fill-opacity=".62" d="M12 21c-2.2 0-3.7-1.5-3.7-3.4 0-1.7 1.2-2.8 2.4-4.1.4 1.1 1.1 1.7 1.8 2 .5-1.1.5-2.2.2-3.3 1.8 1.3 3 3 3 5.4 0 2-1.5 3.4-3.7 3.4z"/>'
    f'<path {HI} d="M8.6 9.5c-.9 1.3-1.4 2.8-1.2 4.4.2-1.8 1.3-3.2 2.7-4.3-.6-.1-1.1-.1-1.5-.1z"/>'
)

icons['mouse-pointer-click'] = (
    f'<path {B} d="M8.6 8.6 21.2 13.4l-5.6 1.9-1.9 5.7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'
    f'<path {HI} d="M8.6 8.6 21.2 13.4l-6.6 1z"/>'
    f'<path d="M7.4 2.8v2.6M2.8 7.4h2.6M4.2 4.2l1.9 1.9M10.6 4.2 8.7 6.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>'
)

icons['clock'] = (
    f'<circle {B} cx="12" cy="12" r="9.6"/>'
    f'<path {HI} d="M4.4 8.4a8.6 8.6 0 0 1 15.2 0A11 11 0 0 0 4.4 8.4z"/>'
    f'<circle {D} cx="12" cy="12" r="7.4"/>'
    f'<path d="M12 7.2V12l3.4 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    f'<circle {B} cx="12" cy="12" r="1.2"/>'
)

icons['zap'] = (
    f'<path {B} d="M13.8 1.8 4.2 13.4h6.3l-1 8.8 10.3-12.4h-6.6z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>'
    f'<path {HI} d="M13.8 1.8 4.2 13.4h6.3l.6-5z"/>'
)

icons['sparkles'] = (
    f'<path {B} d="M10 3.2 12.3 9.7 18.8 12l-6.5 2.3L10 20.8 7.7 14.3 1.2 12l6.5-2.3z"/>'
    f'<path {B} d="M19 2.6l.9 2.5 2.5.9-2.5.9L19 9.4l-.9-2.5-2.5-.9 2.5-.9z"/>'
    f'<path {B} d="M19.2 15.2l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/>'
    f'<path {HI} d="M10 3.2 12.3 9.7 10 12z"/>'
)

icons['rocket'] = (
    f'<path {B} fill-opacity=".6" d="M7.4 13.6 4 14.6l-1 4.4 3.6-1.4zM16.6 13.6l3.4 1 1 4.4-3.6-1.4z"/>'
    f'<path {B} d="M12 1.8c3.4 2.2 5 5.6 5 9.4 0 2.2-.4 4.2-1.1 6.2H8.1C7.4 15.4 7 13.4 7 11.2c0-3.8 1.6-7.2 5-9.4z"/>'
    f'<path {HI} d="M12 1.8c-3.4 2.2-5 5.6-5 9.4l5-.4z"/>'
    f'<circle {D} cx="12" cy="10" r="2.4"/><circle fill="#fff" fill-opacity=".5" cx="11.2" cy="9.2" r=".8"/>'
    f'<path {B} d="M10 19.2h4l-2 3.2z"/>'
)

json.dump(icons, open('src/badge-icons.json', 'w'), ensure_ascii=False)
print(len(icons), 'iconos')
