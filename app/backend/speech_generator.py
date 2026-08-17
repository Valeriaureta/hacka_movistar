from typing import Any, Dict

def generar_speech_comercial(cliente: Dict[str, Any], oferta: Dict[str, Any], canal: str) -> str:
    """Genera el argumento comercial persuasivo principal para el asesor."""
    nombre_oferta = oferta.get("nombre_oferta", "Oferta Personalizada")
    precio = oferta.get("precio_mensual", 0)
    ahorro_pct = oferta.get("ahorro_pct", 0)
    gb = oferta.get("gb_incluidos", 0)
    es_mt = oferta.get("es_movistar_total", False) or oferta.get("oferta_es_mt", False)
    
    antiguedad = cliente.get("antiguedad_meses", 0)
    anios = antiguedad // 12
    consumo_datos = cliente.get("consumo_datos_gb_prom", 0)
    monto_actual = cliente.get("monto_facturado_prom", 0)
    
    # Saludo y reconocimiento de fidelidad
    if anios >= 2:
        intro = f"Estimado cliente, valorando su preferencia y fidelidad durante más de {anios} años con Movistar, "
    else:
        intro = "Estimado cliente, gracias por comunicarse con Movistar. "

    # Argumento principal según tipo de oferta
    if es_mt:
        ahorro_txt = f" con un ahorro exclusivo de hasta {ahorro_pct}% frente a contratar servicios por separado" if ahorro_pct > 0 else ""
        cuerpo = (
            f"hemos habilitado para su hogar el beneficio convergente **{nombre_oferta}** por solo **S/ {precio:.2f}/mes**{ahorro_txt}. "
            f"Tendrá una única factura unificada, internet de alta velocidad con fibra y bono duplicador de GB en su móvil."
        )
    elif gb > 0 and gb > consumo_datos:
        cuerpo = (
            f"notamos que su consumo promedio alcanza {consumo_datos:.1f} GB al mes. Con el **{nombre_oferta}** "
            f"le garantizamos **{gb} GB de navegación** en alta velocidad por solo **S/ {precio:.2f}/mes**, evitando cualquier corte o cobro adicional."
        )
    else:
        cuerpo = (
            f"tenemos reservada la oferta especial **{nombre_oferta}** por tan solo **S/ {precio:.2f}/mes**, "
            f"optimizando el rendimiento y cobertura de sus servicios actuales."
        )

    # Cierre según canal
    if canal.lower() == "digital" or canal.lower() == "app":
        cierre = " Puede activarlo inmediatamente en un solo clic desde su App Mi Movistar o autorizarme ahora mismo."
    elif canal.lower() == "tienda":
        cierre = " Podemos dejar el beneficio activo en su cuenta hoy mismo antes de finalizar su visita."
    else:
        cierre = " ¿Le gustaría que activemos este beneficio en su línea a partir de su próximo ciclo de facturación?"

    return intro + cuerpo + cierre

def generar_speech_rebate(cliente: Dict[str, Any], oferta_rebate: Dict[str, Any], objecion: str = "precio") -> str:
    """Genera el speech de contingencia (rebate) cuando el cliente objeta la oferta principal."""
    nombre_oferta = oferta_rebate.get("nombre_oferta", "Plan Alternativo")
    precio = oferta_rebate.get("precio_mensual", 0)
    
    if "movistar total" in nombre_oferta.lower():
        return (
            f"Comprendo su posición. Si prefiere mantener una inversión más ajustada, "
            f"tenemos la alternativa **{nombre_oferta}** por solo **S/ {precio:.2f}/mes**, "
            f"manteniendo la unificación de recibos y el beneficio de duplicar datos."
        )
    elif "movil" in nombre_oferta.lower():
        return (
            f"Entiendo perfectamente. Si en este momento solo desea potenciar su línea móvil, "
            f"le podemos aplicar la promoción **{nombre_oferta}** a solo **S/ {precio:.2f}/mes** "
            f"para asegurar que nunca le falten datos ni minutos."
        )
    else:
        return (
            f"Totalmente de acuerdo. Como plan de contingencia inmediata, podemos ofrecerle "
            f"el paquete **{nombre_oferta}** por **S/ {precio:.2f}/mes**, una opción balanceada y sin compromiso de permanencia extendido."
        )
