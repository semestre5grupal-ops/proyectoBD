import folium

# 1. Crear el mapa centrado en Ecuador con tema oscuro (ideal para tu dashboard de Tailwind)
map_ec = folium.Map(location=[-1.8312, -78.1834], zoom_start=6, tiles="CartoDB dark_matter")

# 2. Datos de las bodegas / provincias con coordenadas reales
datos = [
    {"provincia": "Pichincha", "lat": -0.1807, "lon": -78.4678, "compras": 1450, "ventas": 3890, "color": "#22c55e"}, # Verde (Alto volumen)
    {"provincia": "Guayas", "lat": -2.1962, "lon": -79.8862, "compras": 980, "ventas": 2100, "color": "#22c55e"},  # Verde (Alto volumen)
    {"provincia": "Azuay", "lat": -2.9001, "lon": -79.0059, "compras": 120, "ventas": 85, "color": "#ef4444"},    # Rojo (Bajo volumen)
    {"provincia": "Manabí", "lat": -1.0546, "lon": -80.4544, "compras": 45, "ventas": 30, "color": "#ef4444"}     # Rojo (Bajo volumen)
]

# 3. Insertar los nodos interactivos
for d in datos:
    # Tarjeta flotante con estilos en línea
    tooltip_html = f"""
    <div style="background-color: #1e293b; color: white; padding: 10px; border-radius: 8px; border: 1px solid {d['color']}; min-width: 120px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
        <h4 style="margin: 0 0 5px 0; color: {d['color']}; font-family: sans-serif;">{d['provincia']}</h4>
        <p style="margin: 0; font-family: monospace; font-size: 12px;">Compras: {d['compras']} u.</p>
        <p style="margin: 0; font-family: monospace; font-size: 12px; font-weight: bold;">Ventas: {d['ventas']} u.</p>
    </div>
    """
    
    folium.CircleMarker(
        location=[d["lat"], d["lon"]],
        radius=9,
        color=d["color"],
        weight=2,
        fill=True,
        fill_color=d["color"],
        fill_opacity=0.8,
        tooltip=folium.Tooltip(tooltip_html)
    ).add_to(map_ec)

# 4. Exportar el resultado
archivo_salida = "mapa_ecuador.html"
map_ec.save(archivo_salida)
print(f"¡Éxito! Mapa generado en el archivo: {archivo_salida}")